"use client";

// /impact — community impact aggregate. Sums the demo past-events into
// headline numbers so anyone arriving cold sees "what the platform has
// already moved" at a glance. UI-only for now; once a real /reports
// endpoint lands, swap the useMemo aggregate for a fetch.

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ToolOutlined,
  TrophyOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { listPastEvents } from "@/lib/eventsApi";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    pageTitle: "श्रमदानको प्रभाव",
    eyebrow: "सामूहिक उपलब्धि",
    title: "हाम्रो हातले अहिलेसम्म जेजति गर्‍यो",
    intro:
      "श्रमदान सदस्यहरूले मिलेर पूरा गरेका अभियानको कुल योगफल। हरेक अङ्क पछाडि स्थानीय श्रम, समय र समन्वय छ।",
    stats: {
      events: "अभियान सम्पन्न",
      participants: "कुल सहभागी",
      locations: "अभियान भएका स्थान",
      minutes: "श्रम मिनेट"
    },
    categoryMixHeading: "अभियानको प्रकार अनुसार वितरण",
    categoryMixIntro:
      "अहिलेसम्म कुन-कुन प्रकारका अभियानमा सबैभन्दा बढी श्रम लागेको — समुदायको चाख कहाँ बढी।",
    geographyHeading: "स्थान अनुसार",
    geographyIntro:
      "अहिलेसम्म कुन-कुन शहर / गाउँमा श्रमदान भएको — कुल अभियान संख्या अनुसार।",
    geographyCount: "{n} अभियान",
    timeSeriesHeading: "मासिक रूपमा सम्पन्न",
    timeSeriesIntro:
      "विगत ६ महिनामा कुन-कुन महिनामा कति अभियान सम्पन्न भयो।",
    monthNames: [
      "जन", "फेब", "मार्च", "अप्रिल", "मे", "जुन",
      "जुलाई", "अग", "सेप्ट", "अक्ट", "नोभ", "डिस"
    ],
    categoryLabels: {
      cleanup: "सरसफाइ",
      afforestation: "वृक्षारोपण",
      beautification: "सौन्दर्यीकरण",
      trail: "ट्रेल मर्मत",
      dam: "बाँध / पोखरी",
      infrastructure: "पूर्वाधार",
      seasonal: "मौसमी",
      disaster: "विपद् राहत"
    },
    categoryFallback: "अन्य",
    eventsHeading: "सम्पन्न अभियानहरू",
    eventDateLabel: "मिति",
    eventParticipantsLabel: "सहभागी",
    eventDurationLabel: "अवधि (मिनेट)",
    viewDetail: "विस्तृत हेर्नुहोस्",
    ctaTitle: "तपाईं पनि जोडिनुहोस्",
    ctaBody: "अर्को अभियान सुरु हुनलागेको छ। तपाईं भूमिकामा छनोट गरेर अहिल्यै सहभागी हुनुहोस्।",
    ctaBtn: "आउँदा अभियानहरू हेर्नुहोस्"
  },
  en: {
    pageTitle: "Shramdan impact",
    eyebrow: "Collective wins",
    title: "What our hands have moved so far",
    intro:
      "The running total of campaigns Shramdan members have closed together. Every number stands on local labour, time, and coordination.",
    stats: {
      events: "Campaigns completed",
      participants: "Total participants",
      locations: "Cities & sites",
      minutes: "Labour-minutes"
    },
    categoryMixHeading: "Campaigns by category",
    categoryMixIntro:
      "Where the labour has been going — community appetite by category.",
    geographyHeading: "Where it happened",
    geographyIntro:
      "Towns and cities by total campaigns completed so far.",
    geographyCount: "{n} campaigns",
    timeSeriesHeading: "Completed by month",
    timeSeriesIntro:
      "Campaigns completed across the last six months.",
    monthNames: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ],
    categoryLabels: {
      cleanup: "Cleanup",
      afforestation: "Afforestation",
      beautification: "Beautification",
      trail: "Trail repair",
      dam: "Pond / dam",
      infrastructure: "Infrastructure",
      seasonal: "Seasonal",
      disaster: "Disaster relief"
    },
    categoryFallback: "Other",
    eventsHeading: "Completed campaigns",
    eventDateLabel: "Date",
    eventParticipantsLabel: "Participants",
    eventDurationLabel: "Duration (min)",
    viewDetail: "View detail",
    ctaTitle: "Join the next one",
    ctaBody: "Another campaign is about to begin. Pick a role and lock in.",
    ctaBtn: "Browse upcoming campaigns"
  }
};

function formatCompletedAt(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export default function ImpactPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const [past, setPast] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listPastEvents({ language });
        if (!cancelled) setPast(items);
      } catch {
        if (!cancelled) setPast([]);
      }
    })();
    return () => { cancelled = true; };
  }, [language]);

  const totals = useMemo(() => {
    const events = past.length;
    const participants = past.reduce(
      (sum, e) => sum + (Number(e.participantCount) || 0),
      0
    );
    const minutes = past.reduce(
      (sum, e) => sum + (Number(e.durationMinutes) || 0) * (Number(e.participantCount) || 0),
      0
    );
    const locations = new Set(
      past
        .map((e) => (e.addressText || "").split(",").pop()?.trim().toLowerCase())
        .filter(Boolean)
    ).size;
    return { events, participants, minutes, locations };
  }, [past]);

  const statTiles = [
    { value: totals.events, label: t.stats.events, icon: CheckCircleOutlined },
    { value: totals.participants, label: t.stats.participants, icon: TeamOutlined },
    { value: totals.locations, label: t.stats.locations, icon: EnvironmentOutlined },
    { value: totals.minutes, label: t.stats.minutes, icon: ToolOutlined }
  ];

  const categoryMix = useMemo(() => {
    const counts = new Map();
    past.forEach((event) => {
      const key = event.category || "other";
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const total = past.length || 1;
    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        count,
        percent: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [past]);

  const geographyMix = useMemo(() => {
    const counts = new Map();
    past.forEach((event) => {
      // Extract the trailing geographic segment from addressText, e.g.
      // "तीनकुने पुल, ललितपुर" → "ललितपुर". Fall back to the whole
      // address when no comma is present.
      const raw = (event.addressText || "").trim();
      if (!raw) return;
      const city = raw.split(",").pop().trim();
      if (!city) return;
      counts.set(city, (counts.get(city) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
      .slice(0, 8);
  }, [past]);

  const timeSeries = useMemo(() => {
    // Six-bucket monthly series of completed events. Builds the bucket
    // labels from the most recent six calendar months ending with the
    // newest completedAt seen on a past event (or today if none).
    const ref = past.reduce((latest, event) => {
      const ts = event.completedAt ? new Date(event.completedAt).getTime() : 0;
      return ts > latest ? ts : latest;
    }, 0);
    const refDate = ref ? new Date(ref) : new Date(0);
    if (!ref) return [];
    const buckets = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
      buckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        count: 0
      });
    }
    past.forEach((event) => {
      if (!event.completedAt) return;
      const d = new Date(event.completedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.count += 1;
    });
    const max = buckets.reduce((m, b) => Math.max(m, b.count), 0) || 1;
    return buckets.map((b) => ({
      ...b,
      percent: Math.round((b.count / max) * 100)
    }));
  }, [past]);

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="impact-section page-section">
        <header className="impact-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <div className="impact-stats-grid">
          {statTiles.map(({ value, label, icon: Icon }, i) => (
            <article key={i} className="impact-stat">
              <span className="impact-stat-icon" aria-hidden="true">
                <Icon />
              </span>
              <strong className="impact-stat-value">
                {localizeDigits(value.toLocaleString("en-US"), language)}
              </strong>
              <span className="impact-stat-label">{label}</span>
            </article>
          ))}
        </div>

        {categoryMix.length > 0 ? (
          <section
            className="impact-category-mix"
            aria-labelledby="impact-category-mix-title"
          >
            <header className="impact-category-mix-header">
              <h2 id="impact-category-mix-title">{t.categoryMixHeading}</h2>
              <p>{t.categoryMixIntro}</p>
            </header>
            <ul className="impact-category-mix-list">
              {categoryMix.map((row) => {
                const label = t.categoryLabels[row.key] || t.categoryFallback;
                return (
                  <li key={row.key} className="impact-category-mix-row">
                    <Link
                      href={`/events?show=past&category=${encodeURIComponent(row.key)}`}
                      className="impact-category-mix-link"
                    >
                      <span className="impact-category-mix-label">{label}</span>
                      <span className="impact-category-mix-bar" aria-hidden="true">
                        <span
                          className={`impact-category-mix-fill cat-${row.key}`}
                          style={{ width: `${Math.max(4, row.percent)}%` }}
                        />
                      </span>
                      <span className="impact-category-mix-count">
                        {localizeDigits(row.count, language)}
                      </span>
                      <span className="impact-category-mix-percent">
                        {localizeDigits(row.percent, language)}%
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {geographyMix.length > 0 ? (
          <section
            className="impact-geography"
            aria-labelledby="impact-geography-title"
          >
            <header className="impact-section-header">
              <h2 id="impact-geography-title">{t.geographyHeading}</h2>
              <p>{t.geographyIntro}</p>
            </header>
            <ul className="impact-geography-list">
              {geographyMix.map((row) => (
                <li key={row.city} className="impact-geography-row">
                  <span className="impact-geography-city">{row.city}</span>
                  <span className="impact-geography-count">
                    {t.geographyCount.replace(
                      "{n}",
                      localizeDigits(row.count, language)
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {timeSeries.length > 0 ? (
          <section
            className="impact-time-series"
            aria-labelledby="impact-time-series-title"
          >
            <header className="impact-section-header">
              <h2 id="impact-time-series-title">{t.timeSeriesHeading}</h2>
              <p>{t.timeSeriesIntro}</p>
            </header>
            <ol className="impact-time-series-list">
              {timeSeries.map((bucket) => (
                <li key={bucket.key} className="impact-time-series-bar">
                  <span
                    className="impact-time-series-fill"
                    style={{ height: `${Math.max(4, bucket.percent)}%` }}
                    aria-hidden="true"
                  />
                  <span className="impact-time-series-count">
                    {localizeDigits(bucket.count, language)}
                  </span>
                  <span className="impact-time-series-label">
                    {t.monthNames[bucket.monthIndex]}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section
          className="impact-events"
          aria-labelledby="impact-events-title"
        >
          <header className="impact-events-header">
            <TrophyOutlined aria-hidden="true" />
            <h2 id="impact-events-title">{t.eventsHeading}</h2>
          </header>
          <ul className="impact-events-list">
            {past.map((event) => (
              <li key={event.id} className="impact-event-row">
                <Link href={`/events/${event.slug ?? event.id}`} className="impact-event-link">
                  <span className="impact-event-title">{event.title}</span>
                  <span className="impact-event-meta">
                    {event.addressText}
                  </span>
                  {event.resultSummary ? (
                    <span className="impact-event-result">
                      {event.resultSummary}
                    </span>
                  ) : null}
                  <span className="impact-event-stats">
                    <span>
                      <strong>{formatCompletedAt(event.completedAt, language)}</strong>
                      <em>{t.eventDateLabel}</em>
                    </span>
                    <span>
                      <strong>{localizeDigits(event.participantCount, language)}</strong>
                      <em>{t.eventParticipantsLabel}</em>
                    </span>
                    <span>
                      <strong>{localizeDigits(event.durationMinutes, language)}</strong>
                      <em>{t.eventDurationLabel}</em>
                    </span>
                  </span>
                  <span className="impact-event-arrow" aria-hidden="true">
                    {t.viewDetail} <ArrowRightOutlined />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <aside className="impact-cta" role="complementary">
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaBody}</p>
          <Link href="/events?show=upcoming" className="impact-cta-btn">
            {t.ctaBtn} <ArrowRightOutlined />
          </Link>
        </aside>
      </section>
    </SiteShell>
  );
}
