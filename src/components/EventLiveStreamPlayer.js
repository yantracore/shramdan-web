"use client";

// Single-event live stream player (Phase 14 — autoplay on detail page).
// Renders an embedded YouTube Live (or placeholder video) at the top
// of the event detail page when the event has an active liveStream.
//
// Visible chrome: LIVE badge, big pulsing viewer counter, live duration.
// Player is muted autoplay so the visit isn't a surprise sound-blast.

import { EyeOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function toLocalDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

export function EventLiveStreamPlayer({ liveStream, eventTitle, copy, language = "en" }) {
  const [duration, setDuration] = useState(() =>
    computeDuration(liveStream?.startedAt)
  );
  const videoRef = useRef(null);

  useEffect(() => {
    if (!liveStream?.startedAt) return;
    const id = setInterval(() => {
      setDuration(computeDuration(liveStream.startedAt));
    }, 30_000);
    return () => clearInterval(id);
  }, [liveStream?.startedAt]);

  // React's JSX `muted` prop occasionally fails to set the IDL property on
  // first paint, especially across stream URL swaps in the split-view
  // preview pane. Pin muted=true imperatively so demo footage never
  // surprise-blasts audio when the user clicks through events.
  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = true;
    node.defaultMuted = true;
    node.volume = 0;
  }, [liveStream?.streamUrl]);

  if (!liveStream?.isActive || !liveStream?.streamUrl) return null;

  const hasViewers = Number.isFinite(liveStream.viewerCount);
  const viewerNumber = hasViewers
    ? toLocalDigits(liveStream.viewerCount.toLocaleString("en-US"), language)
    : null;
  const isNativeVideo = /\.mp4(\?|$)/i.test(liveStream.streamUrl);
  const representativeLabel =
    copy?.representativeFootage ||
    (language === "np" ? "प्रतिनिधि दृश्य" : "Representative footage");

  return (
    <section className="event-live-player" aria-label={copy?.liveAria || "Live stream player"}>
      <div className="event-live-player-frame">
        {isNativeVideo ? (
          <video
            ref={videoRef}
            src={liveStream.streamUrl}
            poster={liveStream.thumbnailUrl || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${eventTitle} — ${representativeLabel}`}
          />
        ) : (
          <iframe
            src={liveStream.streamUrl}
            title={`${eventTitle} — live stream`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
            allowFullScreen
          />
        )}
        {isNativeVideo ? (
          <span className="event-live-player-rep-tag" aria-hidden="true">
            {representativeLabel}
          </span>
        ) : null}
      </div>
      <div className="event-live-player-meta">
        <span className="event-live-badge">
          <span className="live-dot" aria-hidden="true" />
          {copy?.liveBadge || "LIVE"}
        </span>
        {duration ? (
          <span className="event-live-duration">
            {toLocalDigits(duration, language)} {copy?.durationSuffix || "live"}
          </span>
        ) : null}
        {hasViewers ? (
          <span className="event-live-viewers-big" aria-live="polite">
            <EyeOutlined aria-hidden="true" className="event-live-viewers-icon" />
            <span className="event-live-viewers-number">{viewerNumber}</span>
            <span className="event-live-viewers-label">
              {(copy?.viewersSuffix || " watching").trim()}
            </span>
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
