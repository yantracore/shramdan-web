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
import { getJson } from "@/lib/apiClient";
import { getListItems } from "@/lib/adminUtils";
import {
  listDraftEvents,
  listLiveEvents,
  listPastEvents,
  listUpcomingEvents
} from "@/lib/eventsApi";
import { CAMPAIGN_STATUS_SEQUENCE } from "@/lib/campaignStatus";

const ISSUE_LIMIT = 50;

async function fetchOpenIssues({ provinceId, districtId }) {
  const response = await getJson("/issues", {
    params: { status: "OPEN", provinceId, districtId, limit: ISSUE_LIMIT }
  });
  const entries = getListItems(response).map((issue) => ({
    kind: "issue",
    status: "OPEN",
    id: issue.id,
    data: issue
  }));
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
  switch (status) {
    case "OPEN":
      return fetchOpenIssues(opts);
    case "DRAFT":
      return toEventEntries("DRAFT", await listDraftEvents(opts));
    case "SCHEDULED":
      return toEventEntries("SCHEDULED", await listUpcomingEvents(opts)).sort(
        byScheduledAsc
      );
    case "ACTIVE":
      return toEventEntries("ACTIVE", await listLiveEvents(opts));
    case "COMPLETED":
      return toEventEntries("COMPLETED", await listPastEvents(opts)).sort(
        byCompletedDesc
      );
    default:
      return [];
  }
}

export function useCampaignFeed({ status, language, provinceId, districtId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const opts = { language, provinceId, districtId };
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
