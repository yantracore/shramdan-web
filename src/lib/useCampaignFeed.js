"use client";

// Unified campaign feed. Reads the right backend source per status and returns
// a single ordered list of `{ kind, status, id, data }` entries the
// /campaigns page renders through a card/preview dispatcher.
//
//   OPEN      -> /issues?status=OPEN         (kind: "issue")
//   DRAFT     -> listDraftEvents             (kind: "event")
//   SCHEDULED -> listUpcomingEvents          (kind: "event")
//   ACTIVE    -> listLiveEvents              (kind: "event")
//   COMPLETED -> listPastEvents              (kind: "event")
//
// For status "all" every stage is fetched in parallel and concatenated in
// lifecycle order (OPEN -> DRAFT -> SCHEDULED -> ACTIVE -> COMPLETED). The
// buckets are disjoint by construction (an issue contributes only its OPEN
// stage; a stale SCHEDULED event surfaces under ACTIVE, never under both), so
// no dedup is needed.

import { useCallback, useEffect, useState } from "react";
import { fetchMyIssueVotes, getJson } from "@/lib/apiClient";
import { getAuthSession } from "@/lib/authSession";
import { getListItems } from "@/lib/adminUtils";
import { listEventsByStatus } from "@/lib/eventsApi";
import { CAMPAIGN_STATUS_SEQUENCE } from "@/lib/campaignStatus";

const ISSUE_LIMIT = 50;

// One lightweight, page-wide round-trip recovering the viewer's stored vote
// intent across every OPEN issue. The list read (GET /issues) carries `isVoted`
// but NOT `voterRole`/`eventRole` (a documented backend gap — see
// docs/api-requirements/issues.md), so a refreshed card knows it was voted yet
// can't tell Supported from Joined/Leading and falls back to "Supported". This
// map lets us decorate each issue with its role so the card renders the right
// label WITHOUT opening the modal. Anonymous viewers skip it entirely. Once the
// list echoes voterRole/eventRole per-viewer this whole call can be dropped.
async function fetchMyVotesMap() {
  if (!getAuthSession()?.user) return null;
  try {
    const res = await fetchMyIssueVotes({ limit: 100 });
    const map = new Map();
    for (const vote of getListItems(res)) {
      map.set(String(vote.id), {
        voterRole: vote.voterRole || "INTERESTED",
        eventRole: vote.eventRole || null
      });
    }
    return map;
  } catch {
    return null;
  }
}

async function fetchOpenIssues({ provinceId, districtId, votesMap }) {
  const response = await getJson("/issues", {
    params: { status: "OPEN", provinceId, districtId, limit: ISSUE_LIMIT }
  });
  const entries = getListItems(response).map((issue) => {
    const mine = votesMap?.get(String(issue.id));
    // Decorate with the viewer's resolved role so the card's CTA reads the true
    // commitment (Supported / Joined / Leading) on first paint.
    const data = mine
      ? { ...issue, isVoted: true, voterRole: mine.voterRole, eventRole: mine.eventRole }
      : issue;
    return { kind: "issue", status: "OPEN", id: issue.id, data };
  });
  // Most-supported first.
  return entries.sort(
    (a, b) => (b.data.voteCount || 0) - (a.data.voteCount || 0)
  );
}

function toEventEntries(status, events) {
  return events.map((ev) => ({ kind: "event", status, id: ev.id, data: ev }));
}

function byScheduledAsc(a, b) {
  return Date.parse(a.data.scheduledAt || 0) - Date.parse(b.data.scheduledAt || 0);
}
function byCompletedDesc(a, b) {
  return Date.parse(b.data.completedAt || 0) - Date.parse(a.data.completedAt || 0);
}

async function fetchStatus(status, opts) {
  if (status === "OPEN") return fetchOpenIssues(opts);
  // Every later stage maps 1:1 to a backend event status — fetch it raw so the
  // displayed list and the chip-row count agree exactly.
  const entries = toEventEntries(status, await listEventsByStatus(status, opts));
  if (status === "SCHEDULED") return entries.sort(byScheduledAsc);
  if (status === "COMPLETED") return entries.sort(byCompletedDesc);
  return entries;
}

export function useCampaignFeed({ status, language, provinceId, districtId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    // Resolve the viewer's vote roles once up front, then hand the map to every
    // stage fetch (only fetchOpenIssues consumes it). null for anon viewers.
    const votesMap = await fetchMyVotesMap();
    const opts = { language, provinceId, districtId, votesMap };
    const wanted =
      !status || status === "all" ? CAMPAIGN_STATUS_SEQUENCE : [status];
    // Settle each stage independently: a single failing endpoint contributes
    // nothing instead of blanking the whole page. We only raise an error when
    // everything failed (nothing to show + at least one failure).
    const settled = await Promise.allSettled(
      wanted.map((s) => fetchStatus(s, opts))
    );
    const merged = [];
    let anyError = false;
    settled.forEach((res) => {
      if (res.status === "fulfilled") merged.push(...res.value);
      else anyError = true;
    });
    return { merged, anyError };
  }, [status, language, provinceId, districtId]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    (async () => {
      try {
        const { merged, anyError } = await load();
        if (cancelled) return;
        setItems(merged);
        if (anyError && merged.length === 0) setError("load_failed");
      } catch {
        if (cancelled) return;
        setItems([]);
        setError("load_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { items, loading, error };
}
