"use client";

// useRoleSupport — shared hook that drives the "Support" flow on any issue
// surface (IssueVoteButton, PublicIssueCard, IssuePreviewPane). It lazy-loads
// the full roster + myVote on first openModal(), builds the panelProps object
// the SupportRolesModal/ParticipantsPanel needs, and delegates all mutations to
// the existing useIssueVote hook so message toasts + optimistic counts stay
// consistent with the rest of the app.

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useIssueVote } from "@/lib/useIssueVote";
import {
  fetchIssueParticipants,
  fetchMyIssueVotes,
  getJson
} from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { getListItems } from "@/lib/adminUtils";

// Role menu order shared with the issue page and event page.
// COORDINATOR is intentionally excluded — coordination is now exclusively the
// WANT_TO_LEAD (leadership) path per 2026-06-23 backend enum change.
const PARTICIPANT_ROLE_ORDER = [
  "WORKER",
  "PHOTOGRAPHER",
  "LIVESTREAMER",
  "MEDIC",
  "SAFETY_LEAD",
  "LOGISTICS"
];

export function useRoleSupport(
  issueId,
  { seed = null, content, language = "np", onVoteChange, eager = false } = {}
) {
  const session = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSession,
    () => null
  );

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Local issue snapshot — patched optimistically after each vote then
  // reconciled from the server via fetchIssueParticipants.
  const [issue, setIssue] = useState(seed);
  const [myVote, setMyVote] = useState(null);
  const [participants, setParticipants] = useState([]);

  // FIX 1 — stale `loaded` flag on issueId change.
  // When the component stays mounted but issueId changes (SPA navigation),
  // reset all per-issue state so the eager effect and openModal() re-fetch
  // for the new issue instead of showing stale data from the previous one.
  // The setState calls here are intentional — they fire only when issueId
  // actually changes and React batches them with any concurrent render, so
  // no cascading extra render is scheduled. seed is intentionally excluded
  // from deps (it is the initial value; re-reading it on every seed reference
  // change would fight optimistic patches made after mount).
  /* eslint-disable react-hooks/set-state-in-effect -- intentional: state resets are tied to issueId change only, not an ongoing external subscription */
  useEffect(() => {
    setLoaded(false);
    setIssue(seed);
    setMyVote(null);
    setParticipants([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Called by useIssueVote's onVoteChange callback after every confirmed
  // mutation. Payload is { voterRole, eventRole, ...serverData } on a vote,
  // or null on a retract.
  const applyVoteChange = useCallback(
    (payload) => {
      setMyVote(
        payload
          ? {
              voterRole: payload.voterRole || "INTERESTED",
              eventRole: payload.eventRole ?? null
            }
          : null
      );
      // Patch local counts from whatever the server echoed.
      if (payload) {
        setIssue((prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          next.isVoted = true;
          if (typeof payload.voteCount === "number") next.voteCount = payload.voteCount;
          if (typeof payload.attendingCount === "number")
            next.attendingCount = payload.attendingCount;
          if (typeof payload.conversionThreshold === "number")
            next.conversionThreshold = payload.conversionThreshold;
          if (payload.status) next.status = payload.status;
          return next;
        });
      } else {
        setIssue((prev) => {
          if (!prev) return prev;
          return { ...prev, isVoted: false };
        });
      }
      // Re-fetch the named roster so a fresh face appears immediately.
      fetchIssueParticipants(issueId, { limit: 100 })
        .then((res) => setParticipants(getListItems(res)))
        .catch(() => {});
      // Bubble up to the caller (e.g. IssueVoteButton's own onVoteChange).
      onVoteChange?.(payload);
    },
    [issueId, onVoteChange]
  );

  // Delegate all mutations to useIssueVote. This keeps toasts, optimistic
  // counts, auth-redirect, and the voted/voting state consistent with every
  // other surface that uses useIssueVote directly.
  const {
    isAuthenticated,
    voteCount,
    voted,
    voting,
    handleVoteClick,
    handleRetract
  } = useIssueVote({
    issueId,
    initialVoteCount: seed?.voteCount,
    initialVoted: seed?.isVoted,
    content: content?.card || content || {},
    onVoteChange: applyVoteChange
  });

  // ── Lazy load ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const [detail, myVotesRes, partsRes] = await Promise.all([
      getJson(`/issues/${issueId}`).catch(() => null),
      getAuthSession()?.user
        ? fetchMyIssueVotes({ limit: 100 }).catch(() => null)
        : Promise.resolve(null),
      fetchIssueParticipants(issueId, { limit: 100 }).catch(() => null)
    ]);
    // Merge fetched detail over the seed (detail is the authoritative snapshot).
    const data = detail?.data ?? detail ?? seed ?? {};
    if (data) {
      setIssue((prev) => ({ ...(prev || {}), ...data }));
    }
    const myVotes = myVotesRes ? getListItems(myVotesRes) : [];
    const mine = myVotes.find((v) => String(v.id) === String(data?.id ?? issueId));
    setMyVote(
      mine
        ? { voterRole: mine.voterRole || "INTERESTED", eventRole: mine.eventRole || null }
        : null
    );
    setParticipants(getListItems(partsRes));
  }, [issueId, seed]);

  const openModal = useCallback(async () => {
    setOpen(true);
    if (loaded) return;
    setLoading(true);
    try {
      await load();
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [loaded, load]);

  const closeModal = useCallback(() => setOpen(false), []);

  // ── Eager load (when caller wants the roster visible without opening modal) ──
  // When eager=true we run the same load-once logic on mount so the caller can
  // render the always-visible roster (e.g. the issue detail page body panel)
  // without needing to open the modal first. Guard with !loaded so we never
  // double-fetch if openModal() was called before the effect fires.
  useEffect(() => {
    if (!eager || loaded) return;
    let cancelled = false;
    // Wrap in async IIFE so setState calls happen after the effect returns
    // (in .then/.finally microtasks), avoiding the set-state-in-effect lint.
    (async () => {
      setLoading(true);
      try {
        await load();
        if (!cancelled) setLoaded(true);
      } catch {
        // ignore — individual fetch errors are swallowed inside load()
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eager, issueId]);

  // ── panelProps derivation ──────────────────────────────────────────────────
  // Mirrors issues/[id]/page.js lines ~458-517 verbatim, adapted to local state.
  const viewerName = session?.user?.name || null;
  const isOpenIssue = issue?.status === "OPEN";

  const roles = (() => {
    const countByRole = new Map();
    if (Array.isArray(issue?.eventRoleCounts)) {
      for (const entry of issue.eventRoleCounts) {
        countByRole.set(entry?.eventRole, Number(entry?.voterCount) || 0);
      }
    }
    const namesByRole = new Map();
    for (const p of participants) {
      if (!p?.eventRole || !p?.user?.name) continue;
      const arr = namesByRole.get(p.eventRole) || [];
      arr.push(p.user.name);
      namesByRole.set(p.eventRole, arr);
    }
    return PARTICIPANT_ROLE_ORDER.map((role) => {
      const names = namesByRole.get(role) || [];
      const count = Math.max(Number(countByRole.get(role)) || 0, names.length);
      return { role, count, names };
    });
  })();

  const viewer =
    myVote?.voterRole === "GOING" && myVote?.eventRole
      ? { role: myVote.eventRole, status: "GOING", name: viewerName }
      : null;

  const viewerIsLeader = myVote?.voterRole === "WANT_TO_LEAD";

  const leaderSlot =
    isOpenIssue || viewerIsLeader
      ? {
          viewerIsLeader,
          name: viewerIsLeader ? viewerName : null,
          count: viewerIsLeader ? 1 : 0,
          canLead: isOpenIssue && !myVote
        }
      : null;

  const progress =
    isOpenIssue && Number(issue?.conversionThreshold) > 0
      ? {
          current: Number(issue?.attendingCount) || 0,
          target: Number(issue?.conversionThreshold),
          variant: "conversion"
        }
      : null;

  // joinableRoles: null means "all roles open" (the panel shows the full
  // grid); [] means "nothing joinable" (viewer already voted / issue not open).
  const joinableRoles = isOpenIssue && !myVote ? null : [];
  const canLeave = isOpenIssue && Boolean(viewer);
  const canLeaveLead = isOpenIssue && viewerIsLeader;

  // ── Mutation helpers ───────────────────────────────────────────────────────
  // These delegate to handleVoteClick/handleRetract from useIssueVote so the
  // shared toast + optimistic count logic is never duplicated.
  const join = useCallback(
    (role) => handleVoteClick({ voterRole: "GOING", eventRole: role }),
    [handleVoteClick]
  );
  const lead = useCallback(
    () => handleVoteClick({ voterRole: "WANT_TO_LEAD" }),
    [handleVoteClick]
  );
  const interested = useCallback(
    () => handleVoteClick({ voterRole: "INTERESTED" }),
    [handleVoteClick]
  );
  const leave = useCallback(() => handleRetract(), [handleRetract]);
  const retract = useCallback(() => handleRetract(), [handleRetract]);

  const panelProps = {
    roles,
    viewer,
    progress,
    joinableRoles,
    canLeave,
    leaderSlot,
    canLeaveLead,
    // FIX 2 — authoritative "committed" total for the panel heading badge.
    // Pass attendingCount (GOING tally) because COORDINATOR + role-less GOING
    // voters never appear in per-role rows, so row-sum would undercount.
    // null falls back to the panel's own row-sum.
    totalOverride: Number.isFinite(Number(issue?.attendingCount)) ? Number(issue?.attendingCount) : null,
    onJoin: join,
    onLead: lead,
    onLeave: leave,
    onLeaveLead: leave
  };

  return {
    // Modal open state
    open,
    openModal,
    closeModal,
    loading,
    // Vote state (mirrors useIssueVote surface)
    isAuthenticated,
    voteCount,
    voted,
    voting,
    voterRole: myVote?.voterRole ?? null,
    eventRole: myVote?.eventRole ?? null,
    // Retract — exposed so IssueVoteButton's withdraw Popconfirm can call it.
    retract,
    // Panel contract for SupportRolesModal / ParticipantsPanel
    panelProps,
    // "I'm interested" shortcut used by SupportRolesModal's top button
    onInterested: interested
  };
}
