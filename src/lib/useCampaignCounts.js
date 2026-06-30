"use client";

// Per-status item counts for the /campaigns chip row, fetched once on mount
// (and on province/district change). Lightweight: hits the same endpoints as
// the feed but only reads `items.length` — no cover-image enrichment, no
// normalize — so all five badges can show a number without paying the feed's
// full cost. Counts are capped at COUNT_LIMIT; data volumes are small enough
// that this equals the true count today.

import { useCallback, useEffect, useState } from "react";
import { getJson } from "@/lib/apiClient";
import { getListItems } from "@/lib/adminUtils";
import { CAMPAIGN_STATUS_SEQUENCE } from "@/lib/campaignStatus";

const COUNT_LIMIT = 100;

async function countStatus(status, { provinceId, districtId, category, search }) {
  const path = status === "OPEN" ? "/issues" : "/events";
  const response = await getJson(path, {
    params: {
      status,
      limit: COUNT_LIMIT,
      provinceId,
      districtId,
      // Counts must honor the SAME filters as the feed (category + search are
      // backend-side on both /issues and /events) so a badge matches the size
      // of the list clicking it produces.
      ...(category ? { category } : {}),
      ...(search ? { search } : {})
    }
  });
  return getListItems(response).length;
}

export function useCampaignCounts({ provinceId, districtId, category, q }) {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const settled = await Promise.allSettled(
      CAMPAIGN_STATUS_SEQUENCE.map((s) =>
        countStatus(s, { provinceId, districtId, category, search: q })
      )
    );
    const next = {};
    settled.forEach((res, i) => {
      // A failed stage leaves its count null (badge falls back to nothing)
      // rather than poisoning the others.
      next[CAMPAIGN_STATUS_SEQUENCE[i]] =
        res.status === "fulfilled" ? res.value : null;
    });
    return next;
  }, [provinceId, districtId, category, q]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const next = await load();
        if (!cancelled) setCounts(next);
      } catch {
        if (!cancelled) setCounts({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const total = CAMPAIGN_STATUS_SEQUENCE.reduce(
    (sum, s) => sum + (counts[s] || 0),
    0
  );

  return { counts, total, loading };
}
