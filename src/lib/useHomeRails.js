"use client";

// Buckets the unified campaign feed into intent-grouped rails for the homepage.
// Statuses are our backend lifecycle; users discover by intent, so we collapse:
//   happening = ACTIVE + SCHEDULED   (join now / soon)
//   support   = OPEN   + DRAFT       (vote / shape)
//   impact    = COMPLETED            (proof / inspiration)
//   near      = everything with coords, distance-sorted when location is known
// Upstream useCampaignFeed already orders each status (OPEN most-supported,
// SCHEDULED soonest, COMPLETED most-recent), so we only concatenate + slice.

import { useMemo } from "react";
import { useCampaignFeed } from "@/lib/useCampaignFeed";
import { useGeolocation } from "@/lib/useGeolocation";
import { distanceKmOrNull } from "@/lib/haversine";

const MAX_PER_RAIL = 10;

const wrap = (list) => list.map((entry) => ({ entry, distanceKm: null }));

export function useHomeRails({ language, provinceId, districtId } = {}) {
  const { items, loading, error } = useCampaignFeed({
    status: "all",
    language,
    provinceId,
    districtId
  });
  const { position } = useGeolocation();

  return useMemo(() => {
    const byStatus = (s) => items.filter((it) => it.status === s);

    const happening = wrap(
      [...byStatus("ACTIVE"), ...byStatus("SCHEDULED")].slice(0, MAX_PER_RAIL)
    );
    const support = wrap(
      [...byStatus("OPEN"), ...byStatus("DRAFT")].slice(0, MAX_PER_RAIL)
    );
    const impact = wrap(byStatus("COMPLETED").slice(0, MAX_PER_RAIL));

    const withDistance = items.map((entry) => ({
      entry,
      distanceKm: distanceKmOrNull(
        position,
        entry.data?.latitude,
        entry.data?.longitude
      )
    }));
    if (position) {
      withDistance.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
    const near = withDistance.slice(0, MAX_PER_RAIL);

    return { near, happening, support, impact, loading, error };
  }, [items, position, loading, error]);
}
