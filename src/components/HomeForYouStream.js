"use client";

// Phase 2 v3+v4 — "For you" curated event grid that sits below the
// carousel. Scroll-revealed naturally (no JS-gated reveal): the
// homepage's above-the-fold (brand + search + pills + map + carousel)
// fills the viewport, and this grid is what users find when they
// scroll down.
//
// Ranking — adaptive:
//   v4 (preferred): geolocation granted → entries sorted by Haversine
//     distance from the user. Each card shows a "{n} km दूर" badge.
//     Live events still get a status badge; distance is additive.
//   v0 (fallback): live → upcoming (soonest first) → past (newest first).
//     Used until permission is granted (or when denied / unsupported).
//
// Permission flow: silent — we attempt request() once after the grid
// has loaded data. If the user declines or the browser blocks the
// prompt, we leave a "नजिकैका देखाउनुहोस्" / "Show nearby" affordance
// in the header so they can opt in later.

import { AimOutlined, ArrowRightOutlined, CalendarOutlined, EnvironmentOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listAllEvents } from "@/lib/eventsApi";
import { distanceKmOrNull } from "@/lib/haversine";
import { useGeolocation } from "@/lib/useGeolocation";

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

function formatDistance(km, language, copy) {
  if (km == null) return null;
  if (km < 1) return copy?.distanceNearby || (language === "np" ? "नजिकै" : "Nearby");
  const rounded = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  const suffix = copy?.distanceSuffix || (language === "np" ? "किमी दूर" : "km away");
  return `${localizeDigits(rounded, language)} ${suffix}`;
}

function ForYouCard({ event, status, distanceKm, language, copy }) {
  const dateLabel = formatScheduledLabel(event.scheduledAt, language);
  const statusLabel = copy?.statusLabels?.[status] || status;
  const distanceLabel = formatDistance(distanceKm, language, copy);
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
          {distanceLabel ? (
            <span className="home-for-you-card-distance" aria-label={distanceLabel}>
              <AimOutlined aria-hidden="true" />
              {distanceLabel}
            </span>
          ) : null}
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
  const { position, busy, error, request } = useGeolocation();
  const [autoRequested, setAutoRequested] = useState(false);

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

  // Auto-request geolocation once data has loaded. Silent — if the user
  // denies or the browser blocks, we keep the v0 ranking and surface a
  // "Show nearby" affordance so they can opt in later.
  useEffect(() => {
    if (!loaded) return;
    if (autoRequested) return;
    if (position || error) return;
    // Defer to the next frame so React's effect rule
    // (react-hooks/set-state-in-effect) is satisfied — the flag is set
    // alongside the geolocation call, not synchronously in the body.
    const raf = window.requestAnimationFrame(() => {
      setAutoRequested(true);
      request();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [loaded, position, error, autoRequested, request]);

  const entries = useMemo(() => {
    const tag = (events, status) =>
      (events ?? []).map((event) => ({
        event,
        status,
        distanceKm: distanceKmOrNull(position, event.latitude, event.longitude)
      }));

    const live = tag(buckets.live, "live");
    const upcoming = tag(buckets.upcoming, "upcoming");
    const past = tag(buckets.past, "past");
    const all = [...live, ...upcoming, ...past];

    if (position) {
      // v4 ranking: distance-first (ascending). Entries without coords
      // sink to the bottom, preserving their relative status order.
      const ranked = [...all].sort((a, b) => {
        const aD = a.distanceKm;
        const bD = b.distanceKm;
        if (aD == null && bD == null) return 0;
        if (aD == null) return 1;
        if (bD == null) return -1;
        return aD - bD;
      });
      return ranked.slice(0, 12);
    }

    // v0 fallback: live → upcoming (soonest first) → past (newest first).
    upcoming.sort((a, b) => {
      const aAt = a.event?.scheduledAt ? new Date(a.event.scheduledAt).getTime() : Infinity;
      const bAt = b.event?.scheduledAt ? new Date(b.event.scheduledAt).getTime() : Infinity;
      return aAt - bAt;
    });
    past.sort((a, b) => {
      const aAt = a.event?.scheduledAt ? new Date(a.event.scheduledAt).getTime() : 0;
      const bAt = b.event?.scheduledAt ? new Date(b.event.scheduledAt).getTime() : 0;
      return bAt - aAt;
    });
    return [...live, ...upcoming, ...past].slice(0, 12);
  }, [buckets, position]);

  if (loaded && entries.length === 0) {
    return null; // empty state handled by the rail's existing empty message
  }

  // "Show nearby" CTA appears when (a) location isn't granted yet and
  // (b) the user has either had a silent attempt complete with no
  // result, or hit an explicit error. We hide it while busy so we don't
  // flicker a button under a system prompt.
  const showLocationCta = !position && !busy && (error || autoRequested);
  const locationGranted = Boolean(position);

  return (
    <section className="home-for-you" aria-labelledby="home-for-you-title">
      <header className="home-for-you-header">
        <div className="home-for-you-header-text">
          {t.eyebrow ? (
            <span className="eyebrow home-for-you-eyebrow">{t.eyebrow}</span>
          ) : null}
          <h2 id="home-for-you-title">{t.title}</h2>
          {locationGranted && t.locationGranted ? (
            <p className="home-for-you-location-note">
              <AimOutlined aria-hidden="true" /> {t.locationGranted}
            </p>
          ) : t.intro ? (
            <p>{t.intro}</p>
          ) : null}
        </div>
        <div className="home-for-you-header-actions">
          {showLocationCta ? (
            <button
              type="button"
              className="home-for-you-location-cta"
              onClick={() => request()}
            >
              <AimOutlined aria-hidden="true" />
              {t.locationCta || (language === "np" ? "नजिकैका देखाउनुहोस्" : "Show nearby")}
            </button>
          ) : null}
          <Link className="home-for-you-view-all" href="/events">
            {language === "np" ? "सबै हेर्नुहोस्" : "View all"}
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="home-for-you-grid">
        {entries.map(({ event, status, distanceKm }) => (
          <ForYouCard
            key={`${status}-${event.id ?? event.slug}`}
            event={event}
            status={status}
            distanceKm={distanceKm}
            language={language}
            copy={t}
          />
        ))}
      </div>
    </section>
  );
}

export default HomeForYouStream;
