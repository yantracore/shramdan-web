"use client";

// useRoleSupport — shared hook that drives the "Support" flow on any issue
// surface (IssueVoteButton, PublicIssueCard, IssuePreviewPane). It lazy-loads
// the full roster + myVote on first openModal(), builds the panelProps object
// the SupportRolesModal/ParticipantsPanel needs, and delegates all mutations to
// the existing useIssueVote hook so message toasts + optimistic counts stay
// consistent with the rest of the app.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
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

  // Ref-keyed guard: tracks which issueId has already been loaded.
  // Using a ref (not state) means changing issueId never triggers a re-render
  // by itself — ensureLoaded handles the transition transparently.
  const loadedIdRef = useRef(null);

  // Local issue snapshot — patched optimistically after each vote then
  // reconciled from the server via fetchIssueParticipants.
  const [issue, setIssue] = useState(seed);
  const [myVote, setMyVote] = useState(null);
  const [participants, setParticipants] = useState([]);

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

  // ── ensureLoaded — loads at most once per issueId ─────────────────────────
  // Keyed by ref so any issueId change (same-component SPA navigation) triggers
  // a fresh load without relying on boolean state that can be stale across
  // renders. Clears stale per-issue data before fetching so the old roster
  // never flashes on the new issue.
  const ensureLoaded = useCallback(async () => {
    if (loadedIdRef.current === issueId) return;
    loadedIdRef.current = issueId;
    // Clear stale per-issue data so the new issue never briefly shows the old roster.
    setIssue(seed);
    setMyVote(null);
    setParticipants([]);
    setLoading(true);
    try {
      await load();
    } finally {
      setLoading(false);
    }
  }, [issueId, seed, load]);

  const openModal = useCallback(() => {
    setOpen(true);
    ensureLoaded();
  }, [ensureLoaded]);

  const closeModal = useCallback(() => setOpen(false), []);

  // ── Eager load (when caller wants the roster visible without opening modal) ──
  // When eager=true we run ensureLoaded on mount (and whenever ensureLoaded's
  // identity changes, i.e. whenever issueId/seed/load change). ensureLoaded is
  // internally ref-guarded so it never double-fetches for the same issueId.
  useEffect(() => {
    if (eager) ensureLoaded();
  }, [eager, ensureLoaded]);

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
