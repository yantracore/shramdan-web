"use client";

// /me/preview — auth-free demo of what a member profile feels like.
// Backend has no profile endpoint wired yet; the real /me page is auth-
// gated and redirects to /login when there's no session. This page lives
// in parallel as a static stub so the design can be reviewed any time.

import {
  CalendarOutlined,
  CheckCircleOutlined,
  HeartFilled,
  LikeOutlined,
  TeamOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useMemo } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import {
  getDemoLiveEvents,
  getDemoNotifications,
  getDemoUpcomingEvents,
  getDemoPastEvents
} from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const ACHIEVEMENTS = [
  { id: "first_vote", emoji: "👍", labelNp: "पहिलो समर्थन", labelEn: "First support", unlocked: true },
  { id: "first_event", emoji: "🤝", labelNp: "पहिलो अभियान", labelEn: "First event", unlocked: true },
  { id: "supporter", emoji: "💚", labelNp: "१० समर्थन", labelEn: "10 supports", unlocked: true },
  { id: "joiner", emoji: "🎽", labelNp: "५ अभियान सहभागी", labelEn: "5 events joined", unlocked: true },
  { id: "organizer", emoji: "⚡", labelNp: "पहिलो संयोजन", labelEn: "First organizer", unlocked: true },
  { id: "monsoon", emoji: "🌧", labelNp: "मनसुन सरसफाइ", labelEn: "Monsoon cleanup", unlocked: false }
];

const COPY = {
  np: {
    pageTitle: "मेरो प्रोफाइल — झलक",
    devBanner:
      "👀 यो डेमो हो। सदस्य बनेपछि तपाईंको वास्तविक प्रोफाइल यहीँ देखिनेछ।",
    devCta: "अहिले OTP बाट जोडिनुहोस्",
    name: "विवेक डेमो",
    handle: "@vivekdemo",
    phone: "+९७७ ९८XXXXXX९४",
    location: "काठमाडौँ, नेपाल",
    memberSince: "सदस्यता मिति",
    memberDate: "२०२६ असार २",
    statsTitle: "योगदान सारांश",
    stat1Label: "अभियानमा सहभागी",
    stat2Label: "समर्थन गरिएको समस्या",
    stat3Label: "अभियान संयोजन",
    badgesTitle: "उपलब्धि",
    badgesLockedHint: "अब आउने",
    activityTitle: "हालैको गतिविधि",
    eventsTitle: "तपाईंका आगामी अभियानहरू",
    pastTitle: "तपाईं सहभागी भएका",
    viewEvent: "विवरण",
    noEvents: "तपाईंले अहिलेसम्म कुनै अभियानमा प्रतिबद्धता जनाउनुभएको छैन।",
    badge: "डेमो प्रोफाइल"
  },
  en: {
    pageTitle: "My profile — preview",
    devBanner:
      "👀 This is a demo. Your real profile lives here after signup.",
    devCta: "Sign up with OTP",
    name: "Vivek Demo",
    handle: "@vivekdemo",
    phone: "+977 98XXXXXX94",
    location: "Kathmandu, Nepal",
    memberSince: "Member since",
    memberDate: "Jun 2, 2026",
    statsTitle: "Contribution summary",
    stat1Label: "Events joined",
    stat2Label: "Issues supported",
    stat3Label: "Events coordinated",
    badgesTitle: "Achievements",
    badgesLockedHint: "Coming up",
    activityTitle: "Recent activity",
    eventsTitle: "Your upcoming events",
    pastTitle: "Past events you joined",
    viewEvent: "View",
    noEvents: "You haven't committed to any campaigns yet.",
    badge: "Demo profile"
  }
};

function initialsOf(name) {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || "")
    .join("");
}

export default function MeProfilePreview() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;

  const upcoming = useMemo(() => getDemoUpcomingEvents().slice(0, 2), []);
  const past = useMemo(() => getDemoPastEvents().slice(0, 2), []);
  const notifications = useMemo(() => getDemoNotifications().slice(0, 4), []);
  const live = useMemo(() => getDemoLiveEvents().slice(0, 1), []);

  const stats = [
    { value: 5, label: t.stat1Label, icon: TeamOutlined },
    { value: 12, label: t.stat2Label, icon: LikeOutlined },
    { value: 1, label: t.stat3Label, icon: CheckCircleOutlined }
  ];

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="me-preview-section page-section">
        <aside className="me-preview-banner" role="status">
          <span>{t.devBanner}</span>
          <Link href="/signup" className="me-preview-banner-cta">
            {t.devCta} →
          </Link>
        </aside>

        <article className="me-preview-card content-card">
          <header className="me-preview-header">
            <div className="me-preview-avatar" aria-hidden="true">
              <span>{initialsOf(t.name)}</span>
              <HeartFilled className="me-preview-avatar-badge" />
            </div>
            <div className="me-preview-id">
              <span className="me-preview-tag">{t.badge}</span>
              <h1>{t.name}</h1>
              <p className="me-preview-handle">{t.handle}</p>
              <p className="me-preview-meta">{t.phone}</p>
              <p className="me-preview-meta">{t.location}</p>
              <p className="me-preview-meta">
                <CalendarOutlined aria-hidden="true" /> {t.memberSince}: {t.memberDate}
              </p>
            </div>
          </header>
        </article>

        <section
          className="me-preview-stats"
          aria-labelledby="me-preview-stats-title"
        >
          <h2 id="me-preview-stats-title" className="me-preview-section-title">
            {t.statsTitle}
          </h2>
          <div className="me-preview-stats-grid">
            {stats.map(({ value, label, icon: Icon }, i) => (
              <article key={i} className="me-preview-stat-card">
                <span className="me-preview-stat-icon" aria-hidden="true">
                  <Icon />
                </span>
                <strong className="me-preview-stat-value">
                  {localizeDigits(value, language)}
                </strong>
                <span className="me-preview-stat-label">{label}</span>
              </article>
            ))}
          </div>
        </section>

        <section
          className="me-preview-badges"
          aria-labelledby="me-preview-badges-title"
        >
          <h2
            id="me-preview-badges-title"
            className="me-preview-section-title"
          >
            {t.badgesTitle}
          </h2>
          <ul className="me-preview-badges-grid">
            {ACHIEVEMENTS.map((b) => (
              <li
                key={b.id}
                className={`me-preview-badge-tile${b.unlocked ? "" : " is-locked"}`}
              >
                <span className="me-preview-badge-emoji" aria-hidden="true">
                  {b.emoji}
                </span>
                <span className="me-preview-badge-label">
                  {language === "np" ? b.labelNp : b.labelEn}
                </span>
                {!b.unlocked ? (
                  <span className="me-preview-badge-locked">
                    {t.badgesLockedHint}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {notifications.length > 0 ? (
          <section
            className="me-preview-activity"
            aria-labelledby="me-preview-activity-title"
          >
            <h2 id="me-preview-activity-title" className="me-preview-section-title">
              {t.activityTitle}
            </h2>
            <ol className="me-preview-activity-list">
              {notifications.map((n) => {
                const title = n.title?.[language] || n.title?.np;
                const body = n.body?.[language] || n.body?.np;
                return (
                  <li key={n.id} className="me-preview-activity-item">
                    <Link href={n.href} className="me-preview-activity-link">
                      <strong>{title}</strong>
                      <span>{body}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {[...live, ...upcoming].length > 0 ? (
          <section
            className="me-preview-events"
            aria-labelledby="me-preview-events-title"
          >
            <h2 id="me-preview-events-title" className="me-preview-section-title">
              {t.eventsTitle}
            </h2>
            <ul className="me-preview-events-list">
              {[...live, ...upcoming].map((event) => (
                <li key={event.id} className="me-preview-event-row">
                  <span className="me-preview-event-title">{event.title}</span>
                  <span className="me-preview-event-place">{event.addressText}</span>
                  <Link href={`/events/${event.id}`} className="me-preview-event-cta">
                    {t.viewEvent} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {past.length > 0 ? (
          <section
            className="me-preview-events me-preview-past"
            aria-labelledby="me-preview-past-title"
          >
            <h2 id="me-preview-past-title" className="me-preview-section-title">
              {t.pastTitle}
            </h2>
            <ul className="me-preview-events-list">
              {past.map((event) => (
                <li key={event.id} className="me-preview-event-row">
                  <span className="me-preview-event-title">{event.title}</span>
                  <span className="me-preview-event-place">{event.addressText}</span>
                  <Link href={`/events/${event.id}`} className="me-preview-event-cta">
                    {t.viewEvent} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </SiteShell>
  );
}
