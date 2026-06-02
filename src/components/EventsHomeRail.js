"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarOutlined, EnvironmentOutlined, TeamOutlined } from "@ant-design/icons";
import { usePreferences } from "@/app/providers";
import { staggerContainer, staggerItem } from "@/lib/motion";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const NP_MONTHS_SHORT = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
];
const NP_WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];

// Chromium's Intl "ne-NP" emits Latin digits and inconsistent abbreviations,
// and the SSR/CSR pair produced hydration warnings — so we compose NP manually.
function formatScheduledPill(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  if (language === "np") {
    const weekday = NP_WEEKDAYS_SHORT[date.getDay()];
    const month = NP_MONTHS_SHORT[date.getMonth()];
    const day = localizeDigits(date.getDate(), "np");
    const hour = localizeDigits(date.getHours(), "np");
    const minute = localizeDigits(String(date.getMinutes()).padStart(2, "0"), "np");
    return `${weekday}, ${month} ${day}, ${hour}:${minute}`;
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function EventsHomeRail({
  liveEvents = [],
  upcomingEvents = [],
  copy,
  language = "np"
}) {
  const reduceMotion = useReducedMotion();
  const { entranceAnimation } = usePreferences();
  const shouldAnimate = !reduceMotion && entranceAnimation;

  const items = [
    ...liveEvents.map((event) => ({ kind: "live", event })),
    ...upcomingEvents.map((event) => ({ kind: "upcoming", event }))
  ];
  const isEmpty = items.length === 0;

  return (
    <section className="events-home-rail" aria-labelledby="events-home-rail-title">
      <header className="events-home-rail-header">
        <div className="events-home-rail-header-text">
          <span className="eyebrow events-home-rail-eyebrow">
            <span className="live-dot" aria-hidden="true" />
            {copy?.eyebrow}
          </span>
          <h2 id="events-home-rail-title">{copy?.title}</h2>
          {copy?.subtitle ? <p>{copy.subtitle}</p> : null}
        </div>
        <Link href="/events" className="events-home-rail-view-all">
          {copy?.viewAll}
        </Link>
      </header>

      {isEmpty ? (
        <div className="live-events-rail-empty">
          <span className="live-events-rail-empty-icon" aria-hidden="true">📺</span>
          <p>{copy?.emptyMessage}</p>
        </div>
      ) : shouldAnimate ? (
        <motion.ul className="events-home-rail-list" {...staggerContainer}>
          {items.map((item) =>
            item.kind === "live" ? (
              <LiveCard key={item.event.id} event={item.event} copy={copy} animated />
            ) : (
              <UpcomingCard
                key={item.event.id}
                event={item.event}
                language={language}
                animated
              />
            )
          )}
        </motion.ul>
      ) : (
        <ul className="events-home-rail-list">
          {items.map((item) =>
            item.kind === "live" ? (
              <LiveCard key={item.event.id} event={item.event} copy={copy} />
            ) : (
              <UpcomingCard key={item.event.id} event={item.event} language={language} />
            )
          )}
        </ul>
      )}
    </section>
  );
}

function LiveCard({ event, copy, animated = false }) {
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
      className="events-home-rail-card live-events-rail-card"
      {...wrapperProps}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/events/${event.id}`} className="live-events-rail-card-link">
        <div className="live-events-rail-thumb">
          {event?.liveStream?.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.liveStream.thumbnailUrl} alt={event.title} loading="lazy" />
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
            {copy?.liveBadge || "LIVE"}
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
              {copy?.viewersPrefix || ""}
              {viewers.toLocaleString()}
              {copy?.viewersSuffix || " watching"}
            </p>
          ) : null}
        </div>
      </Link>
    </Wrapper>
  );
}

function UpcomingCard({ event, language, animated = false }) {
  const Wrapper = animated ? motion.li : "li";
  const wrapperProps = animated ? staggerItem : {};

  return (
    <Wrapper className="events-home-rail-card live-events-rail-card" {...wrapperProps}>
      <Link href={`/events/${event.id}`} className="live-events-rail-card-link">
        <div className="live-events-rail-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.thumbnailUrl || "/images/event-types/cleanup.jpg"}
            alt={event.title}
            loading="lazy"
          />
          <span className="events-home-rail-scheduled-badge">
            <CalendarOutlined aria-hidden="true" />{" "}
            {formatScheduledPill(event.scheduledAt, language)}
          </span>
        </div>
        <div className="live-events-rail-meta">
          <h3>{event.title}</h3>
          {event.addressText ? (
            <p>
              <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
            </p>
          ) : null}
          {event.leaderName ? (
            <p className="events-home-rail-leader">
              <TeamOutlined aria-hidden="true" /> {event.leaderName}
            </p>
          ) : null}
        </div>
      </Link>
    </Wrapper>
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
