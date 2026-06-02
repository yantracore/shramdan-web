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
import { useMemo } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getDemoPastEvents } from "@/lib/devMockData";

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
  const past = useMemo(() => getDemoPastEvents(), []);

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
                <Link href={`/events/${event.id}`} className="impact-event-link">
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
