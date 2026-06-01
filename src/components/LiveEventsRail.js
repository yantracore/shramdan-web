"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePreferences } from "@/app/providers";
import { staggerContainer, staggerItem } from "@/lib/motion";

// Live Events Feed (Phase 13). TV-program-style horizontal strip of
// currently-live events. Empty state when no streams are active.
//
// Data shape (eventual; backend not yet wired):
//   liveEvents = [{
//     id: string,
//     title: string,
//     addressText?: string,
//     liveStream: {
//       isActive: boolean,
//       startedAt: ISO string,
//       streamUrl: string,        // YouTube Live or placeholder
//       thumbnailUrl?: string,
//       viewerCount?: number,
//     }
//   }, ...]
//
// For now this component takes the array as a prop. Future revisions
// will wire it to GET /events with a filter on liveStream.isActive.

export function LiveEventsRail({ liveEvents = [], copy }) {
  const reduceMotion = useReducedMotion();
  const { entranceAnimation } = usePreferences();
  const shouldAnimate = !reduceMotion && entranceAnimation;
  const isEmpty = liveEvents.length === 0;

  return (
    <section
      className="live-events-rail"
      aria-labelledby="live-events-rail-title"
    >
      <header className="live-events-rail-header">
        <span className="eyebrow live-events-rail-eyebrow">
          <span className="live-dot" aria-hidden="true" />
          {copy?.eyebrow || "अहिले लाइभ"}
        </span>
        <h2 id="live-events-rail-title">{copy?.title || "Currently live"}</h2>
        {copy?.subtitle ? <p>{copy.subtitle}</p> : null}
      </header>

      {isEmpty ? <LiveEmptyState copy={copy} /> : null}

      {!isEmpty ? (
        shouldAnimate ? (
          <motion.ul className="live-events-rail-list" {...staggerContainer}>
            {liveEvents.map((event) => (
              <LiveEventCard key={event.id} event={event} copy={copy} animated />
            ))}
          </motion.ul>
        ) : (
          <ul className="live-events-rail-list">
            {liveEvents.map((event) => (
              <LiveEventCard key={event.id} event={event} copy={copy} />
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}

function LiveEventCard({ event, copy, animated = false }) {
  const Wrapper = animated ? motion.li : "li";
  const wrapperProps = animated ? staggerItem : {};
  const startedAt = event?.liveStream?.startedAt;
  const durationLabel = formatLiveDuration(startedAt, copy);
  const viewers = event?.liveStream?.viewerCount;
  const previewUrl = event?.liveStream?.previewEmbedUrl || event?.liveStream?.streamUrl;
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  const showPreview = isHovered && previewUrl && !reduceMotion;

  return (
    <Wrapper
      className="live-events-rail-card"
      {...wrapperProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/events/${event.id}`} className="live-events-rail-card-link">
        <div className="live-events-rail-thumb">
          {event?.liveStream?.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.liveStream.thumbnailUrl}
              alt={event.title}
              loading="lazy"
            />
          ) : (
            <div className="live-events-rail-thumb-fallback" aria-hidden="true">
              <span>श्रमदान</span>
            </div>
          )}

          <AnimatePresence>
            {showPreview ? (
              <motion.div
                key="preview"
                className="live-events-rail-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden="true"
              >
                <iframe
                  src={previewUrl}
                  title={`${event.title} live preview`}
                  allow="autoplay; encrypted-media"
                  loading="lazy"
                  frameBorder="0"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <span className="live-events-rail-badge">
            <span className="live-dot" aria-hidden="true" />
            LIVE
          </span>
          {durationLabel ? (
            <span className="live-events-rail-duration">{durationLabel}</span>
          ) : null}
        </div>
        <div className="live-events-rail-meta">
          <h3>{event.title}</h3>
          {event.addressText ? <p>{event.addressText}</p> : null}
          {Number.isFinite(viewers) ? (
            <p className="live-events-rail-viewers">
              {(copy?.viewersPrefix || "")}
              {viewers.toLocaleString()}
              {(copy?.viewersSuffix || " watching")}
            </p>
          ) : null}
        </div>
      </Link>
    </Wrapper>
  );
}

function LiveEmptyState({ copy }) {
  return (
    <div className="live-events-rail-empty">
      <span className="live-events-rail-empty-icon" aria-hidden="true">
        📺
      </span>
      <p>
        {copy?.emptyMessage ||
          "अहिले कुनै live event छैन। जब कुनै शुरू हुन्छ, श्रमेश यहीँ देखाउनेछ।"}
      </p>
    </div>
  );
}

function formatLiveDuration(startedAt, copy) {
  if (!startedAt) return null;
  const startMs = Date.parse(startedAt);
  if (Number.isNaN(startMs)) return null;
  const nowMs = Date.now();
  const diffMin = Math.max(0, Math.floor((nowMs - startMs) / 60_000));
  if (diffMin < 1) return copy?.justStarted || "Just started";
  if (diffMin < 60) return `${diffMin}m ${copy?.durationLive || "live"}`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (mins === 0) return `${hours}h ${copy?.durationLive || "live"}`;
  return `${hours}h ${mins}m ${copy?.durationLive || "live"}`;
}
