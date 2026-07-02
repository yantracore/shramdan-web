"use client";

// Per-status counts for the /campaigns chip row. One call to GET
// /campaigns/counts (shipped 2026-07-01) returns EXACT totals per lifecycle
// stage — no more 5 separate capped list-length counts. Honors the same
// secondary filters as the feed (category + search + province/district) so a
// badge always matches the size of the list clicking it would produce.

import { useCallback, useEffect, useState } from "react";
import { getJson } from "@/lib/apiClient";
import { CAMPAIGN_STATUS_SEQUENCE } from "@/lib/campaignStatus";

export function useCampaignCounts({ provinceId, districtId, category, q }) {
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await getJson("/campaigns/counts", {
      params: {
        ...(provinceId ? { provinceId } : {}),
        ...(districtId ? { districtId } : {}),
        ...(category ? { category } : {}),
        ...(q ? { search: q } : {})
      }
    });
    const data = response?.data ?? response;
    const raw = data?.counts || {};
    // Keep only the stages the chip row shows (OPEN → COMPLETED); PAUSED /
    // CANCELLED are excluded from the surfaced feed, so the "all" total is the
    // sum of the displayed stages, matching what the feed renders.
    const next = {};
    let sum = 0;
    for (const stage of CAMPAIGN_STATUS_SEQUENCE) {
      const n = Number.isFinite(raw[stage]) ? raw[stage] : 0;
      next[stage] = n;
      sum += n;
    }
    return { next, sum };
  }, [provinceId, districtId, category, q]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const { next, sum } = await load();
        if (!cancelled) {
          setCounts(next);
          setTotal(sum);
        }
      } catch {
        if (!cancelled) {
          setCounts({});
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { counts, total, loading };
}
