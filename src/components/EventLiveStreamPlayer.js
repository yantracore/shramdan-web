"use client";

// Single-event live stream player (Phase 14 — autoplay on detail page).
// Renders an embedded YouTube Live (or placeholder video) at the top
// of the event detail page when the event has an active liveStream.
//
// Visible chrome: LIVE badge, viewer count, live duration. Player is
// muted autoplay so the visit isn't a surprise sound-blast.

import { useEffect, useState } from "react";

export function EventLiveStreamPlayer({ liveStream, eventTitle, copy }) {
  const [duration, setDuration] = useState(() =>
    computeDuration(liveStream?.startedAt)
  );

  useEffect(() => {
    if (!liveStream?.startedAt) return;
    const id = setInterval(() => {
      setDuration(computeDuration(liveStream.startedAt));
    }, 30_000);
    return () => clearInterval(id);
  }, [liveStream?.startedAt]);

  if (!liveStream?.isActive || !liveStream?.streamUrl) return null;

  return (
    <section className="event-live-player" aria-label={copy?.liveAria || "Live stream player"}>
      <div className="event-live-player-frame">
        <iframe
          src={liveStream.streamUrl}
          title={`${eventTitle} — live stream`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          loading="lazy"
          allowFullScreen
        />
      </div>
      <div className="event-live-player-meta">
        <span className="event-live-badge">
          <span className="live-dot" aria-hidden="true" />
          {copy?.liveBadge || "LIVE"}
        </span>
        {duration ? (
          <span className="event-live-duration">
            {duration} {copy?.durationSuffix || "live"}
          </span>
        ) : null}
        {Number.isFinite(liveStream.viewerCount) ? (
          <span className="event-live-viewers">
            {liveStream.viewerCount.toLocaleString()}
            {copy?.viewersSuffix || " watching"}
          </span>
        ) : null}
        {liveStream.isMock ? (
          <span className="event-live-mock-flag" title="Dev mock data — backend liveStream not yet wired">
            DEV MOCK
          </span>
        ) : null}
      </div>
    </section>
  );
}

function computeDuration(startedAt) {
  if (!startedAt) return null;
  const startMs = Date.parse(startedAt);
  if (Number.isNaN(startMs)) return null;
  const diffMin = Math.max(0, Math.floor((Date.now() - startMs) / 60_000));
  if (diffMin < 1) return "Just started";
  if (diffMin < 60) return `${diffMin}m`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}
