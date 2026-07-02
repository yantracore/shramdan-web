"use client";

// Map markers for the /campaigns map view. Fetches GET /campaigns?mode=minimal
// — the lightweight all-markers payload the backend recommends for dense map
// viewports (tiny even at limit=1000, so the map shows EVERY campaign, not just
// the list's current page).
//
// Two filter sources, one hook:
//   - Default (no args): reads the SAME filters the /campaigns list uses straight
//     from the URL (status from the path, the rest from the query), so the map and
//     list agree without threading new props through the page.
//   - `{ filters }` override: the caller owns the filters outright and the URL is
//     ignored — the home map passes its own session-scoped status this way, so
//     home and /campaigns filters never leak into each other.
// The map component falls back to the in-memory list feed while this loads or if
// it errors, so it never renders worse than before.

import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getJson } from "@/lib/apiClient";
import { getListItems } from "@/lib/adminUtils";
import { campaignSlugToStatus } from "@/lib/campaignStatus";

const MARKER_LIMIT = 1000;

// minimal item { slug, status, lat, lng, title, addressText, image, supporterCount }
// → the { kind, status, id, data } shape CampaignsMap / EventMap markers read
// (they want latitude/longitude/title/addressText/slug).
function adaptMarker(item) {
  const kind = item.status === "OPEN" ? "issue" : "event";
  return {
    kind,
    status: item.status,
    id: item.slug,
    data: {
      slug: item.slug,
      id: item.slug,
      status: item.status,
      title: item.title,
      addressText: item.addressText,
      latitude: item.lat,
      longitude: item.lng,
      coverImage: item.image || null,
      thumbnailUrl: item.image || null,
      voteCount: item.supporterCount ?? 0
    }
  };
}

export function useCampaignMarkers({ filters } = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Explicit filters win outright; otherwise status lives in the path
  // (/campaigns/<slug>) and the rest ride the query — mirror
  // CampaignsListClient's reading so the map matches the list.
  const slug = (pathname || "").split("/")[2] || null;
  const status = filters
    ? filters.status || null
    : slug
      ? campaignSlugToStatus(slug)
      : null;
  const category = filters
    ? filters.category || null
    : searchParams?.get("category") || null;
  const provinceId = filters
    ? filters.provinceId || null
    : searchParams?.get("province") || null;
  const districtId = filters
    ? filters.districtId || null
    : searchParams?.get("district") || null;
  const search = filters
    ? filters.search || null
    : searchParams?.get("q") || null;

  const load = useCallback(
    () =>
      getJson("/campaigns", {
        params: {
          mode: "minimal",
          limit: MARKER_LIMIT,
          ...(status ? { status } : {}),
          ...(category ? { category } : {}),
          ...(provinceId ? { provinceId } : {}),
          ...(districtId ? { districtId } : {}),
          ...(search ? { search } : {})
        }
      }),
    [status, category, provinceId, districtId, search]
  );

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const response = await load();
        if (cancelled) return;
        setMarkers(getListItems(response).map(adaptMarker));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { markers, loading, error };
}
