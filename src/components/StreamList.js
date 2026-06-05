"use client";

// Phase 3 v0 — Unified Issues + Events stream component.
//
// Replaces HomeForYouStream as the homepage's "for-you" feed. The same
// component will later (Phase 3 v1) become the body of /events and
// /issues so the three surfaces share a single render path.
//
// Today's scope (v0):
//   - mode: 'event' | 'issue'  (in-place toggle via mode tabs)
//   - layout: compact card grid (same shape for both modes)
//   - geolocation: silent attempt; on grant entries sort by distance
//   - status badges: live/upcoming/past for events; open/scheduled/
//     completed for issues — colour-coded
//
// Deferred to v1: list/thumbnails/map view-switch, /events and /issues
// page migration, persistent support actions that follow promoted issues.

import {
  AimOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  ThunderboltFilled
} from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listAllEvents } from "@/lib/eventsApi";
import { distanceKmOrNull } from "@/lib/haversine";
import { useGeolocation } from "@/lib/useGeolocation";
import { getJson } from "@/lib/apiClient";
import { getIssueCoverImageUrl, getListItems, localizeIssue } from "@/lib/adminUtils";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const NP_MONTHS_SHORT = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
];
const NP_WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];

const PUBLIC_ISSUE_STATUSES = ["OPEN", "EVENT_SCHEDULED", "COMPLETED"];

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

// --- Event → unified entry shape -----------------------------------
function eventToEntry(event, status) {
  return {
    kind: "event",
    id: event.id ?? event.slug,
    slug: event.slug ?? event.id,
    title: event.title,
    addressText: event.addressText,
    poster: event.thumbnailUrl || "/images/event-types/cleanup.jpg",
    status,
    scheduledAt: event.scheduledAt,
    latitude: event.latitude,
    longitude: event.longitude,
    href: `/events/${event.slug ?? event.id}`,
    raw: event
  };
}

// --- Issue → unified entry shape -----------------------------------
function issueToEntry(rawIssue, language) {
  const issue = localizeIssue(rawIssue, language);
  return {
    kind: "issue",
    id: issue.id ?? issue.slug,
    slug: issue.slug ?? issue.id,
    title: issue.title || issue.addressText || "—",
    addressText: issue.addressText,
    poster: getIssueCoverImageUrl(issue) || "/images/event-types/cleanup.jpg",
    status: issue.status, // OPEN | EVENT_SCHEDULED | COMPLETED
    scheduledAt: null,
    latitude: issue.latitude,
    longitude: issue.longitude,
    href: `/issues/${issue.slug ?? issue.id}`,
    raw: issue
  };
}

function StreamCard({ entry, distanceKm, language, copy }) {
  const dateLabel = entry.kind === "event"
    ? formatScheduledLabel(entry.scheduledAt, language)
    : "";
  const distanceLabel = formatDistance(distanceKm, language, copy);
  const statusLabel = copy?.statusLabels?.[entry.status] || entry.status;
  const badgeClass = `home-for-you-card-badge--${
    entry.kind === "event" ? entry.status : entry.status.toLowerCase().replace(/_/g, "-")
  }`;

  return (
    <article className={`home-for-you-card home-for-you-card--${entry.kind}`}>
      <Link
        href={entry.href}
        className="home-for-you-card-link"
        aria-label={entry.title}
      >
        <div className="home-for-you-card-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={entry.poster} alt={entry.title} loading="lazy" />
          <span className={`home-for-you-card-badge ${badgeClass}`}>
            {entry.kind === "event" && entry.status === "live" ? (
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
          <h3>{entry.title}</h3>
          <div className="home-for-you-card-meta">
            {entry.addressText ? (
              <span className="home-for-you-card-address">
                <EnvironmentOutlined aria-hidden="true" />
                <span>{entry.addressText}</span>
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

export function StreamList({
  language = "np",
  copy,
  defaultMode = "event",
  maxItems = 12
}) {
  const t = copy ?? {};
  const [mode, setMode] = useState(defaultMode);

  // Per-mode data buckets so switching tabs doesn't re-fetch each time.
  const [eventBuckets, setEventBuckets] = useState({ live: [], upcoming: [], past: [] });
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [issues, setIssues] = useState([]);
  const [issuesLoaded, setIssuesLoaded] = useState(false);

  const { position, busy, error, request } = useGeolocation();
  const [autoRequested, setAutoRequested] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (mode === "event" && !eventsLoaded) {
      (async () => {
        try {
          const data = await listAllEvents({ language });
          if (cancelled) return;
          setEventBuckets({
            live: data.live ?? [],
            upcoming: data.upcoming ?? [],
            past: data.past ?? []
          });
        } catch {
          if (cancelled) return;
          setEventBuckets({ live: [], upcoming: [], past: [] });
        } finally {
          if (!cancelled) setEventsLoaded(true);
        }
      })();
    } else if (mode === "issue" && !issuesLoaded) {
      (async () => {
        try {
          const response = await getJson("/issues", {
            params: { limit: maxItems, sort: "voteCount" }
          });
          if (cancelled) return;
          const items = getListItems(response).filter((issue) =>
            PUBLIC_ISSUE_STATUSES.includes(issue?.status)
          );
          setIssues(items);
        } catch {
          if (cancelled) return;
          setIssues([]);
        } finally {
          if (!cancelled) setIssuesLoaded(true);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [mode, eventsLoaded, issuesLoaded, language, maxItems]);

  // Silent geolocation attempt once we have any data to sort.
  const loaded = mode === "event" ? eventsLoaded : issuesLoaded;
  useEffect(() => {
    if (!loaded) return;
    if (autoRequested) return;
    if (position || error) return;
    const raf = window.requestAnimationFrame(() => {
      setAutoRequested(true);
      request();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [loaded, position, error, autoRequested, request]);

  const entries = useMemo(() => {
    let baseEntries = [];
    if (mode === "event") {
      const tagged = [
        ...(eventBuckets.live ?? []).map((event) => eventToEntry(event, "live")),
        ...(eventBuckets.upcoming ?? []).map((event) => eventToEntry(event, "upcoming")),
        ...(eventBuckets.past ?? []).map((event) => eventToEntry(event, "past"))
      ];
      // v0 base ranking: live → upcoming-soonest → past-newest.
      const live = tagged.filter((e) => e.status === "live");
      const upcoming = tagged.filter((e) => e.status === "upcoming").sort((a, b) => {
        const aAt = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
        const bAt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
        return aAt - bAt;
      });
      const past = tagged.filter((e) => e.status === "past").sort((a, b) => {
        const aAt = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const bAt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
        return bAt - aAt;
      });
      baseEntries = [...live, ...upcoming, ...past];
    } else {
      baseEntries = issues.map((issue) => issueToEntry(issue, language));
    }

    const withDistance = baseEntries.map((entry) => ({
      entry,
      distanceKm: distanceKmOrNull(position, entry.latitude, entry.longitude)
    }));

    if (position) {
      // v4 ranking: distance-first ascending; null distances sink to bottom.
      withDistance.sort((a, b) => {
        const aD = a.distanceKm;
        const bD = b.distanceKm;
        if (aD == null && bD == null) return 0;
        if (aD == null) return 1;
        if (bD == null) return -1;
        return aD - bD;
      });
    }

    return withDistance.slice(0, maxItems);
  }, [mode, eventBuckets, issues, position, language, maxItems]);

  const isEmpty = loaded && entries.length === 0;
  const showLocationCta = !position && !busy && (error || autoRequested);
  const locationGranted = Boolean(position);

  const modeTabs = [
    {
      key: "event",
      label: t.modeEventLabel || (language === "np" ? "अभियानहरू" : "Events"),
      icon: ThunderboltFilled
    },
    {
      key: "issue",
      label: t.modeIssueLabel || (language === "np" ? "समस्याहरू" : "Issues"),
      icon: FlagOutlined
    }
  ];

  return (
    <section className="home-for-you stream-list" aria-labelledby="stream-list-title">
      <header className="home-for-you-header">
        <div className="home-for-you-header-text">
          {t.eyebrow ? (
            <span className="eyebrow home-for-you-eyebrow">{t.eyebrow}</span>
          ) : null}
          <h2 id="stream-list-title">{t.title}</h2>
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
          <Link className="home-for-you-view-all" href={mode === "event" ? "/events" : "/issues"}>
            {language === "np" ? "सबै हेर्नुहोस्" : "View all"}
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="stream-list-mode-tabs" role="tablist" aria-label={t.modeTabsAria || (language === "np" ? "धारा प्रकार" : "Stream type")}>
        {modeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = mode === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`stream-list-mode-tab${isActive ? " is-active" : ""}`}
              onClick={() => setMode(tab.key)}
            >
              <Icon aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isEmpty ? (
        <div className="home-for-you-empty" role="status">
          <EnvironmentOutlined aria-hidden="true" />
          <p>
            {t.emptyMessage ||
              (language === "np"
                ? "अहिले देखाउन कुनै कुरा छैन।"
                : "Nothing to show right now.")}
          </p>
          <Link className="home-for-you-empty-cta" href={mode === "event" ? "/events" : "/issues"}>
            {language === "np"
              ? mode === "event" ? "सबै अभियान हेर्नुहोस्" : "सबै समस्या हेर्नुहोस्"
              : mode === "event" ? "Browse all events" : "Browse all issues"}
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="home-for-you-grid">
          {entries.map(({ entry, distanceKm }) => (
            <StreamCard
              key={`${entry.kind}-${entry.id}`}
              entry={entry}
              distanceKm={distanceKm}
              language={language}
              copy={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default StreamList;
