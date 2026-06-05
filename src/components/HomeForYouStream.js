"use client";

// Phase 2 v3 — "For you" curated event grid that sits below the carousel.
// Scroll-revealed naturally (no JS-gated reveal): the homepage's
// above-the-fold (brand + search + pills + map + carousel) fills the
// viewport, and this grid is what users find when they scroll down.
//
// Ranking v0:
//   1. Live events first
//   2. Upcoming events sorted by scheduledAt (soonest first)
//   3. Past events at the bottom (recency-sorted)
//
// Geolocation-based proximity ranking is Phase 2 v4 work — adds a
// useGeolocation hook + Haversine distance. v0 is the same ordering the
// rail uses, just laid out as a denser grid so visitors can see more at
// a glance than the carousel allows.

import { ArrowRightOutlined, CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listAllEvents } from "@/lib/eventsApi";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const NP_MONTHS_SHORT = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
];
const NP_WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function formatScheduledLabel(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (language === "np") {
    const weekday = NP_WEEKDAYS_SHORT[date.getDay()];
    const month = NP_MONTHS_SHORT[date.getMonth()];
    const day = localizeDigits(date.getDate(), "np");
    return `${weekday}, ${month} ${day}`;
  }
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function ForYouCard({ event, status, language, copy }) {
  const dateLabel = formatScheduledLabel(event.scheduledAt, language);
  const statusLabel = copy?.statusLabels?.[status] || status;
  const poster = event.thumbnailUrl || "/images/event-types/cleanup.jpg";

  return (
    <article className={`home-for-you-card home-for-you-card--${status}`}>
      <Link
        href={`/events/${event.slug ?? event.id}`}
        className="home-for-you-card-link"
        aria-label={event.title}
      >
        <div className="home-for-you-card-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt={event.title} loading="lazy" />
          <span className={`home-for-you-card-badge home-for-you-card-badge--${status}`}>
            {status === "live" ? (
              <span className="live-dot" aria-hidden="true" />
            ) : null}
            {statusLabel}
          </span>
        </div>
        <div className="home-for-you-card-body">
          <h3>{event.title}</h3>
          <div className="home-for-you-card-meta">
            {event.addressText ? (
              <span className="home-for-you-card-address">
                <EnvironmentOutlined aria-hidden="true" />
                <span>{event.addressText}</span>
              </span>
            ) : null}
            {dateLabel ? (
              <span className="home-for-you-card-date">
                <CalendarOutlined aria-hidden="true" />
                <span>{dateLabel}</span>
              </span>
            ) : null}
          </div>
          <span className="home-for-you-card-cta">
            {copy?.viewLink || (language === "np" ? "विवरण" : "View detail")}
            <ArrowRightOutlined aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function HomeForYouStream({ language = "np", copy }) {
  const t = copy ?? {};
  const [buckets, setBuckets] = useState({ live: [], upcoming: [], past: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAllEvents({ language });
        if (cancelled) return;
        setBuckets({
          live: data.live ?? [],
          upcoming: data.upcoming ?? [],
          past: data.past ?? []
        });
      } catch {
        if (cancelled) return;
        setBuckets({ live: [], upcoming: [], past: [] });
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  // v0 ranking: live → upcoming (soonest first) → past (newest first).
  // Caps the visible count at 12 so the grid stays scannable; "View
  // all" link sits in the header for the full list.
  const entries = useMemo(() => {
    const tag = (events, status) =>
      (events ?? []).map((event) => ({ event, status }));
    const live = tag(buckets.live, "live");
    const upcoming = tag(buckets.upcoming, "upcoming").sort((a, b) => {
      const aAt = a.event?.scheduledAt ? new Date(a.event.scheduledAt).getTime() : Infinity;
      const bAt = b.event?.scheduledAt ? new Date(b.event.scheduledAt).getTime() : Infinity;
      return aAt - bAt;
    });
    const past = tag(buckets.past, "past").sort((a, b) => {
      const aAt = a.event?.scheduledAt ? new Date(a.event.scheduledAt).getTime() : 0;
      const bAt = b.event?.scheduledAt ? new Date(b.event.scheduledAt).getTime() : 0;
      return bAt - aAt;
    });
    return [...live, ...upcoming, ...past].slice(0, 12);
  }, [buckets]);

  if (loaded && entries.length === 0) {
    return null; // empty state handled by the rail's existing empty message
  }

  return (
    <section className="home-for-you" aria-labelledby="home-for-you-title">
      <header className="home-for-you-header">
        <div className="home-for-you-header-text">
          {t.eyebrow ? (
            <span className="eyebrow home-for-you-eyebrow">{t.eyebrow}</span>
          ) : null}
          <h2 id="home-for-you-title">{t.title}</h2>
          {t.intro ? <p>{t.intro}</p> : null}
        </div>
        <Link className="home-for-you-view-all" href="/events">
          {language === "np" ? "सबै हेर्नुहोस्" : "View all"}
          <ArrowRightOutlined aria-hidden="true" />
        </Link>
      </header>

      <div className="home-for-you-grid">
        {entries.map(({ event, status }) => (
          <ForYouCard
            key={`${status}-${event.id ?? event.slug}`}
            event={event}
            status={status}
            language={language}
            copy={t}
          />
        ))}
      </div>
    </section>
  );
}

export default HomeForYouStream;
