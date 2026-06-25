"use client";

import EventMapBlock from "@/components/EventMapBlock";
import { campaignVisualStatus } from "@/lib/campaignStatus";

// Plots the current /campaigns feed — issues AND events together — on one
// Leaflet map by reusing EventMap's combined-marker support: events ride in as
// `entries` ({ event, status }) and issues as raw `issues`, both clustered in a
// single layer. Imported only via EventMapBlock (next/dynamic, ssr:false) so
// Leaflet never touches `window` on the server.
//
// `items` is the already-filtered campaign feed ({ kind, status, id, data }),
// so the map always reflects exactly what the list would show.
function isMappable(record) {
  const lat = Number(record?.latitude);
  const lng = Number(record?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function CampaignsMap({
  items,
  language,
  content,
  mapCopy,
  emptyLabel,
  height = 600
}) {
  const entries = [];
  const issues = [];
  (items || []).forEach((entry) => {
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

  if (!hasMappable) {
    return (
      <div className="campaigns-map-empty" role="status">
        {emptyLabel}
      </div>
    );
  }

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
    </div>
  );
}

export default CampaignsMap;
