"use client";

import { Suspense } from "react";
import EventMapBlock from "@/components/EventMapBlock";
import { campaignVisualStatus } from "@/lib/campaignStatus";
import { useCampaignMarkers } from "@/lib/useCampaignMarkers";

// Plots the /campaigns feed — issues AND events together — on one Leaflet map by
// reusing EventMap's combined-marker support: events ride in as `entries`
// ({ event, status }) and issues as raw `issues`, both clustered in a single
// layer. Imported only via EventMapBlock (next/dynamic, ssr:false) so Leaflet
// never touches `window` on the server.
//
// Marker source: its OWN lightweight GET /campaigns?mode=minimal fetch
// (useCampaignMarkers) so the map shows EVERY matching campaign, not just the
// list's loaded page. While that loads (or if it errors) it falls back to the
// `items` prop (the in-memory list feed) so it never renders worse than before.
//
// `filters` (optional) hands the hook explicit filters instead of the URL —
// the home map drives its status this way (see useCampaignMarkers).
function isMappable(record) {
  const lat = Number(record?.latitude);
  const lng = Number(record?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function MapSkeleton() {
  return (
    <div className="issue-map-skeleton" aria-busy="true" aria-hidden="true">
      <div className="issue-map-skeleton-shimmer" />
    </div>
  );
}

function CampaignsMapInner({
  items,
  language,
  content,
  mapCopy,
  emptyLabel,
  height = 600,
  filters
}) {
  const { markers, loading, error, ready } = useCampaignMarkers({ filters });
  // Authoritative once the minimal fetch has resolved once (`ready`) — and it
  // STAYS authoritative through later refetches: a filter switch keeps the
  // stale markers on the live map until the new set lands, so the Leaflet
  // canvas never unmounts (unmount → remount is a visible tile-reload flicker).
  // Before that first resolve the list feed is the fallback (worst case = the
  // previous behaviour).
  const source = ready ? markers : items || [];

  const entries = [];
  const issues = [];
  source.forEach((entry) => {
    if (!entry?.data) return;
    if (entry.kind === "event") {
      entries.push({
        event: entry.data,
        status: campaignVisualStatus(entry.status)
      });
    } else {
      issues.push(entry.data);
    }
  });

  const hasMappable =
    entries.some((e) => isMappable(e.event)) || issues.some(isMappable);

  if (!hasMappable && !ready) {
    // Nothing to plot AND no marker feed yet → shimmer instead of a premature
    // "no campaigns" verdict (home passes items=[], so this is its whole wait).
    if (loading) return <MapSkeleton />;
    return (
      <div className="campaigns-map-empty" role="status">
        {emptyLabel}
      </div>
    );
  }
  // `ready` with zero matches falls through: the funnel above is this map's
  // filter control, so the canvas stays mounted (markers just clear) and the
  // "nothing here" note floats on top instead of replacing the map.

  return (
    <div className="campaigns-map-frame">
      <EventMapBlock
        entries={entries}
        issues={issues}
        issuesContent={content}
        t={mapCopy}
        language={language}
        height={height}
        interactive
        enableFullscreen
        fullscreenLabel={mapCopy?.fullscreenOpen}
        exitFullscreenLabel={mapCopy?.fullscreenClose}
      />
      {!hasMappable ? (
        <div className="campaigns-map-empty-overlay" role="status">
          <span className="campaigns-map-empty-note">{emptyLabel}</span>
        </div>
      ) : null}
    </div>
  );
}

// useCampaignMarkers calls useSearchParams(), which needs a Suspense boundary
// on statically prerendered pages (home) or `next build` bails out of static
// generation — same wrap ActivityStatsRow uses.
export function CampaignsMap(props) {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <CampaignsMapInner {...props} />
    </Suspense>
  );
}

export default CampaignsMap;
