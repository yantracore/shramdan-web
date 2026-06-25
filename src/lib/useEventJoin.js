"use client";

// useEventJoin — shared hook that drives the "Join" flow on any event
// surface (EventJoinButton, EventPreviewPane). It lazy-loads the full
// roster + myParticipation on first openModal(), builds the panelProps
// object ParticipantsPanel needs, and handles join/leave mutations with
// the same toast branches and demo-event local-mutation path as the
// events/[id]/page.js.
//
// Structural template: mirrors useRoleSupport's ref-keyed ensureLoaded
// pattern exactly (loadedIdRef, eager option, openModal lazy-path).

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { App } from "antd";
import { useRouter } from "next/navigation";
import { deleteJson, getJson, postJson } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import {
  buildRolesNeeded,
  countActiveParticipants,
  findViewerRoleByName,
  isActiveParticipationStatus
} from "@/lib/eventParticipants";
import { eventJoinPhase, PARTICIPANT_ROLE_ORDER } from "@/lib/issueActions";
import { getResponseData } from "@/lib/adminUtils";
import { getDemoEventById } from "@/lib/devMockData";

// Event lifecycle stages that still accept a join.
const EVENT_JOINABLE_STATUSES = new Set(["DRAFT", "SCHEDULED", "ACTIVE"]);

// Toasts — copied verbatim from events/[id]/page.js JOIN_COPY so no new copy
// is invented, and both surfaces always say the same thing.
const JOIN_COPY = {
  np: {
    joined: "तपाईं जोडिनुभयो।",
    waitlisted: "भूमिका भरिएको छ — तपाईं प्रतीक्षा सूचीमा हुनुहुन्छ।",
    already: "तपाईं पहिले अर्को भूमिकामा जोडिनुभएको छ।",
    medic: "स्वास्थ्यकर्मी भूमिकाका लागि प्रमाणित मेडिकल क्रेडेन्सियल चाहिन्छ।",
    rejoinBlocked:
      "अहिले फेरि जोडिन सकिएन — पहिले छाड्नुभएको रेकर्ड सर्भरले पुनः सक्रिय गरेन।",
    joinError: "जोडिन सकिएन। फेरि प्रयास गर्नुहोस्।",
    left: "तपाईं यो श्रमदानबाट हट्नुभयो।",
    leaveError: "हट्न सकिएन। फेरि प्रयास गर्नुहोस्।"
  },
  en: {
    joined: "You're in.",
    waitlisted: "Role full — you're on the waitlist.",
    already: "You've already joined in another role.",
    medic: "The Medic role requires verified medical credentials.",
    rejoinBlocked:
      "Couldn't re-join right now — a signup you previously left wasn't reactivated by the server.",
    joinError: "Could not join. Please try again.",
    left: "You've left this shramdan.",
    leaveError: "Could not leave. Please try again."
  }
};

export function useEventJoin(eventId, { seed = null, language = "np", eager = false } = {}) {
  const { message: messageApi } = App.useApp();
  const router = useRouter();

  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const viewerName = session?.user?.name || null;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ref-keyed guard: tracks which eventId has already been loaded.
  // Using a ref (not state) means changing eventId never triggers a re-render
  // by itself — ensureLoaded handles the transition transparently.
  const loadedIdRef = useRef(null);

  // eventData is the merged event snapshot (rolePlan → rolesNeeded already
  // aggregated client-side). Seeded from the caller's prop on first render.
  const [eventData, setEventData] = useState(seed);
  const [myParticipation, setMyParticipation] = useState(null);

  // isDemoEvent — demo-* id has no backend, mutations stay local.
  const isDemoEvent =
    typeof eventId === "string" && eventId.startsWith("demo-");

  // ── Lazy load ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!eventId) return;

    if (isDemoEvent) {
      // Demo events are resolved from local mock — no API round-trip.
      const demo = getDemoEventById(eventId);
      if (demo) setEventData(demo);
      setMyParticipation(null);
      return;
    }

    // 1. Fetch event detail.
    const response = await getJson(`/events/${eventId}`).catch(() => null);
    const data = getResponseData(response, null) || response?.data || response;
    if (!data) return;

    // 2. Fetch participant roster if rolePlan present without rolesNeeded.
    let merged = data;
    if (Array.isArray(data?.rolePlan) && !Array.isArray(data?.rolesNeeded)) {
      try {
        const rosterResponse = await getJson(`/events/${data.id}/participants?limit=200`);
        const rosterData = getResponseData(rosterResponse, null);
        const participants = Array.isArray(rosterData?.items)
          ? rosterData.items
          : Array.isArray(rosterData)
            ? rosterData
            : [];
        merged = {
          ...data,
          rolesNeeded: buildRolesNeeded(data.rolePlan, participants),
          participantCount: countActiveParticipants(participants)
        };
      } catch {
        merged = {
          ...data,
          rolesNeeded: buildRolesNeeded(data.rolePlan, []),
          participantCount: 0
        };
      }
    }
    setEventData(merged);

    // 3. Fetch my own participation (auth only).
    const resolvedId = merged.id || eventId;
    if (session?.user?.id) {
      try {
        const meResponse = await getJson(`/events/${resolvedId}/participants/me`, {
          requireAuth: true
        });
        const meData = meResponse?.data ?? meResponse;
        setMyParticipation(
          meData?.role && isActiveParticipationStatus(meData.status)
            ? { id: meData.id, role: meData.role, status: meData.status }
            : null
        );
      } catch {
        setMyParticipation(null);
      }
    } else {
      setMyParticipation(null);
    }
  }, [eventId, isDemoEvent, session?.user?.id]);

  // ── ensureLoaded — loads at most once per eventId ────────────────────────────
  const ensureLoaded = useCallback(async () => {
    if (loadedIdRef.current === eventId) return;
    loadedIdRef.current = eventId;
    // Clear stale per-event data so the old roster never flashes on the new event.
    setEventData(seed);
    setMyParticipation(null);
    setLoading(true);
    try {
      await load();
    } finally {
      setLoading(false);
    }
  }, [eventId, seed, load]);

  const openModal = useCallback(() => {
    setOpen(true);
    ensureLoaded();
  }, [ensureLoaded]);

  const closeModal = useCallback(() => setOpen(false), []);

  // ── Eager load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (eager) ensureLoaded();
  }, [eager, ensureLoaded]);

  // ── Refetch helpers (mirror page's handleJoinChanged / handleLeaveChanged) ───
  const refetchAll = useCallback(async () => {
    if (isDemoEvent) return;
    // Reconcile from the server after a mutation. Keep the ref-guard intact
    // (load() always fetches regardless), and wrap in setLoading so the button
    // stays disabled during the round-trip — no double-submit, no race window,
    // and no spurious clear-to-seed flash (which nulling the ref would trigger
    // on the next ensureLoaded).
    setLoading(true);
    try {
      await load();
    } finally {
      setLoading(false);
    }
  }, [isDemoEvent, load]);

  // ── panelProps derivation ─────────────────────────────────────────────────────
  // Mirrors events/[id]/page.js lines 485–533 verbatim.
  const viewerRole =
    myParticipation?.role ||
    findViewerRoleByName(eventData?.rolesNeeded, viewerName);
  const viewerStatus = myParticipation?.status || null;

  const leader = eventData?.eventLeader ?? null;
  const isLeader = Boolean(
    session?.user?.id &&
      eventData?.eventLeaderId &&
      session?.user?.id === eventData?.eventLeaderId
  );

  // Fine-grained join behaviour from the EVENT's status (issue.status is coarse).
  // joinableRoles: null = all roles open; ["WORKER"] = cleaner only; [] = none.
  // Declared before the role-row build below, which reads participantJoinableRoles.
  const phase = eventJoinPhase(eventData?.status);
  const participantJoinableRoles = phase.roleScope;

  // Real plan rows (rolePlan → rolesNeeded), COORDINATOR excluded from the grid.
  const planRows = (Array.isArray(eventData?.rolesNeeded) ? eventData.rolesNeeded : [])
    .filter((row) => row.role !== "COORDINATOR")
    .map((row) => ({
      role: row.role,
      count: row.filled || 0,
      target: row.count,
      names: Array.isArray(row.filledNames) ? row.filledNames : []
    }));

  // Which roles this phase must be able to OFFER, even with no rolePlan:
  //   all roles (DRAFT) → the full menu;  ["WORKER"] (SCHEDULED/ACTIVE) → cleaner.
  const scopeRoles =
    participantJoinableRoles === null
      ? PARTICIPANT_ROLE_ORDER
      : participantJoinableRoles;

  // Merge: start from real plan rows, then add any scoped role missing from the
  // plan as an empty, OPEN row so it renders a Join action. `target` is omitted
  // on purpose: ParticipantsPanel coerces it with Number(), and Number(null) is
  // 0 — which would read as a full 0/0 slot ("पूरा") and hide the Join button.
  // Leaving it undefined makes Number(undefined) → NaN → "no target", so the row
  // is open and joinable.
  const participantRoles = (() => {
    const byRole = new Map(planRows.map((r) => [r.role, r]));
    for (const role of scopeRoles) {
      if (!byRole.has(role)) byRole.set(role, { role, count: 0, names: [] });
    }
    // Preserve a stable order: known order first, then any plan-only extras.
    const ordered = PARTICIPANT_ROLE_ORDER.filter((r) => byRole.has(r)).map((r) => byRole.get(r));
    const extras = planRows.filter((r) => !PARTICIPANT_ROLE_ORDER.includes(r.role));
    return [...ordered, ...extras];
  })();

  const participantViewer = viewerRole
    ? { role: viewerRole, status: viewerStatus, name: viewerName }
    : null;

  const participantTotalTarget = participantRoles.reduce(
    (s, r) => s + (Number(r.target) || 0),
    0
  );
  const participantTotalFilled = participantRoles.reduce(
    (s, r) => s + Math.min(Number(r.count) || 0, Number(r.target) || 0),
    0
  );
  const participantProgress =
    participantTotalTarget > 0
      ? { current: participantTotalFilled, target: participantTotalTarget, variant: "fill" }
      : null;

  const participantCanLeave =
    Boolean(viewerRole) &&
    EVENT_JOINABLE_STATUSES.has(eventData?.status) &&
    viewerStatus !== "CHECKED_IN" &&
    (isDemoEvent || Boolean(myParticipation?.id));

  // Leadership slot: read-only (canLead: false — nominations live in LeaderNominationPanel).
  const participantLeaderSlot =
    eventData?.eventLeaderId || isLeader
      ? {
          viewerIsLeader: isLeader,
          name: leader?.name || (isLeader ? viewerName : null),
          count: eventData?.eventLeaderId ? 1 : 0,
          canLead: false
        }
      : null;

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const jc = JOIN_COPY[language] || JOIN_COPY.np;

  const join = useCallback(
    async (role) => {
      if (!session?.user?.id) {
        const slug = eventData?.slug ?? eventData?.id ?? eventId;
        router.push(buildLoginHref(`/events/${slug}`, "join"));
        return;
      }

      if (isDemoEvent) {
        // Demo: mutate the local roster without API.
        setEventData((prev) => {
          if (!prev || !Array.isArray(prev.rolesNeeded)) return prev;
          const rolesNeeded = prev.rolesNeeded.map((row) => {
            if (row.role !== role) return row;
            const filledNames = Array.isArray(row.filledNames) ? row.filledNames : [];
            if (filledNames.includes(viewerName)) return row;
            return {
              ...row,
              filled: Math.min((row.filled || 0) + 1, row.count),
              filledNames: [...filledNames, viewerName || "तपाईं"]
            };
          });
          return { ...prev, rolesNeeded };
        });
        setMyParticipation({ id: null, role, status: "CONFIRMED" });
        messageApi.success(jc.joined);
        return;
      }

      const resolvedId = eventData?.id || eventId;
      try {
        const response = await postJson(
          `/events/${resolvedId}/participants`,
          { role },
          { requireAuth: true }
        );
        const data = response?.data ?? response;
        if (data?.status && !isActiveParticipationStatus(data.status)) {
          messageApi.error(jc.rejoinBlocked);
          refetchAll();
        } else {
          messageApi[data?.status === "INVITED" ? "info" : "success"](
            data?.status === "INVITED" ? jc.waitlisted : jc.joined
          );
          // Optimistic update then server reconcile.
          setMyParticipation({
            id: data?.id || null,
            role,
            status: data?.status || "CONFIRMED"
          });
          refetchAll();
        }
      } catch (err) {
        if (err?.status === 403 && /MEDIC/i.test(err?.errorCode || err?.message || "")) {
          messageApi.error(jc.medic);
        } else if (err?.status === 409) {
          messageApi.warning(jc.already);
          refetchAll();
        } else {
          messageApi.error(err?.message || jc.joinError);
        }
        throw err;
      }
    },
    [
      eventData,
      eventId,
      isDemoEvent,
      jc,
      messageApi,
      refetchAll,
      router,
      session,
      viewerName
    ]
  );

  const leave = useCallback(async () => {
    if (!isDemoEvent) {
      if (!myParticipation?.id) return;
      const resolvedId = eventData?.id || eventId;
      try {
        await deleteJson(`/events/${resolvedId}/participants/${myParticipation.id}`, {
          requireAuth: true
        });
      } catch (err) {
        messageApi.error(err?.message || jc.leaveError);
        throw err;
      }
    }
    messageApi.success(jc.left);
    // Mirror handleLeaveChanged: clear participation, strip viewer from local roster.
    setMyParticipation(null);
    setEventData((prev) => {
      if (!prev) return prev;
      if (!Array.isArray(prev.rolesNeeded) || !viewerName) return prev;
      const rolesNeeded = prev.rolesNeeded.map((row) => {
        const filledNames = Array.isArray(row.filledNames) ? row.filledNames : [];
        if (!filledNames.includes(viewerName)) return row;
        return {
          ...row,
          filled: Math.max(0, (row.filled || 0) - 1),
          filledNames: filledNames.filter((name) => name !== viewerName)
        };
      });
      return { ...prev, rolesNeeded };
    });
  }, [eventData, eventId, isDemoEvent, jc, messageApi, myParticipation, viewerName]);

  const joinable = phase.joinable;

  const panelProps = {
    roles: participantRoles,
    viewer: participantViewer,
    progress: participantProgress,
    joinableRoles: participantJoinableRoles,
    canLeave: participantCanLeave,
    leaderSlot: participantLeaderSlot,
    // Events: no totalOverride — the roster IS the full picture.
    // Events: no onLead/onLeaveLead/onInterested — leadership is read-only here.
    onJoin: join,
    onLeave: leave
  };

  return {
    open,
    openModal,
    closeModal,
    loading,
    panelProps,
    joinable,
    phase,
    viewerRole,
    viewerStatus
  };
}
