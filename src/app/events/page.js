"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined } from "@ant-design/icons";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import {
  getDemoLiveEvents,
  getDemoUpcomingEvents,
  getDemoPastEvents
} from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const localizeDigits = (str, lang) =>
  lang !== "np" ? String(str) : String(str).replace(/\d/g, (d) => NP_DIGITS[Number(d)]);

const PAGE_COPY = {
  np: {
    pageTitle: "अभियानहरू",
    eyebrow: "अभियानहरू",
    title: "श्रमदान अभियानहरू",
    intro:
      "अहिले प्रसारणमा रहेका, आउँदै गरेका, र भर्खर सम्पन्न भएका सबै अभियानहरू। थम्बनेलमा क्लिक गर्नुहोस्, विवरण हेर्नुहोस्, र चाहिँदो भूमिकामा जोडिनुहोस्।",
    sections: {
      live: {
        eyebrow: "अहिले लाइभ",
        title: "अहिले चलिरहेका अभियान",
        empty: "अहिले कुनै अभियान लाइभ छैन।"
      },
      upcoming: {
        eyebrow: "आउँदै",
        title: "तय भएका आउँदा अभियान",
        empty: "अहिले कुनै आउँदो अभियान दर्ता भएको छैन।"
      },
      past: {
        eyebrow: "सम्पन्न",
        title: "भर्खर सम्पन्न अभियानहरू",
        empty: "हालसम्म कुनै अभियान सम्पन्न भएको छैन।"
      }
    },
    meta: {
      live: "लाइभ",
      in: "मा",
      ago: "अघि",
      participants: "सहभागी",
      durationMin: "{n} मिनेट",
      view: "विवरण हेर्नुहोस्"
    }
  },
  en: {
    pageTitle: "Events",
    eyebrow: "Events",
    title: "Shramdan Campaigns",
    intro:
      "All campaigns — currently live, upcoming, and recently completed. Click any thumbnail for the full detail page and join in your preferred role.",
    sections: {
      live: {
        eyebrow: "On now",
        title: "Currently live",
        empty: "No campaigns are live right now."
      },
      upcoming: {
        eyebrow: "Upcoming",
        title: "Scheduled campaigns",
        empty: "No upcoming campaigns are scheduled yet."
      },
      past: {
        eyebrow: "Completed",
        title: "Recently completed",
        empty: "No completed campaigns yet."
      }
    },
    meta: {
      live: "LIVE",
      in: "in",
      ago: "ago",
      participants: "participants",
      durationMin: "{n} min",
      view: "View detail"
    }
  }
};

function timeFromNow(iso, language) {
  if (!iso) return "";
  const ms = Date.parse(iso) - Date.now();
  const abs = Math.abs(ms);
  const min = Math.round(abs / 60_000);
  if (min < 60) {
    return `${localizeDigits(min, language)} ${language === "np" ? "मिनेट" : "min"}`;
  }
  const hr = Math.round(min / 60);
  if (hr < 48) {
    return `${localizeDigits(hr, language)} ${language === "np" ? "घण्टा" : "h"}`;
  }
  const days = Math.round(hr / 24);
  return `${localizeDigits(days, language)} ${language === "np" ? "दिन" : "d"}`;
}

function LiveCard({ event, t, language }) {
  return (
    <Link href={`/events/${event.id}`} className="events-card events-card-live">
      <div className="events-card-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.liveStream?.thumbnailUrl || "/images/event-types/cleanup.jpg"} alt={event.title} loading="lazy" />
        <span className="events-card-badge events-card-badge-live">
          <span className="live-dot" aria-hidden="true" />
          {t.meta.live}
        </span>
        {Number.isFinite(event.liveStream?.viewerCount) ? (
          <span className="events-card-viewers">
            {localizeDigits(event.liveStream.viewerCount, language)}
          </span>
        ) : null}
      </div>
      <div className="events-card-body">
        <h3>{event.title}</h3>
        {event.addressText ? (
          <p className="events-card-meta-row">
            <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function UpcomingCard({ event, t, language }) {
  const when = timeFromNow(event.scheduledAt, language);
  return (
    <Link href={`/events/${event.id}`} className="events-card events-card-upcoming">
      <div className="events-card-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.thumbnailUrl || "/images/event-types/cleanup.jpg"} alt={event.title} loading="lazy" />
        <span className="events-card-badge events-card-badge-upcoming">
          <CalendarOutlined aria-hidden="true" /> {t.meta.in} {when}
        </span>
      </div>
      <div className="events-card-body">
        <h3>{event.title}</h3>
        {event.addressText ? (
          <p className="events-card-meta-row">
            <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
          </p>
        ) : null}
        <div className="events-card-meta-grid">
          {event.durationMinutes ? (
            <span>
              <ClockCircleOutlined aria-hidden="true" />{" "}
              {t.meta.durationMin.replace("{n}", localizeDigits(event.durationMinutes, language))}
            </span>
          ) : null}
          {event.leaderName ? (
            <span>
              <TeamOutlined aria-hidden="true" /> {event.leaderName}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function PastCard({ event, t, language }) {
  const ago = timeFromNow(event.completedAt, language);
  return (
    <Link href={`/events/${event.id}`} className="events-card events-card-past">
      <div className="events-card-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.thumbnailUrl || "/images/event-types/cleanup.jpg"} alt={event.title} loading="lazy" />
        <span className="events-card-badge events-card-badge-past">
          <CalendarOutlined aria-hidden="true" /> {ago} {t.meta.ago}
        </span>
      </div>
      <div className="events-card-body">
        <h3>{event.title}</h3>
        {event.addressText ? (
          <p className="events-card-meta-row">
            <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
          </p>
        ) : null}
        {Number.isFinite(event.participantCount) ? (
          <p className="events-card-meta-row">
            <TeamOutlined aria-hidden="true" /> {localizeDigits(event.participantCount, language)}{" "}
            {t.meta.participants}
          </p>
        ) : null}
        {event.resultSummary ? (
          <p className="events-card-summary">{event.resultSummary}</p>
        ) : null}
      </div>
    </Link>
  );
}

function Section({ section, children, isEmpty, emptyText }) {
  return (
    <section className="events-section" aria-labelledby={`events-${section.eyebrow}-title`}>
      <header className="events-section-header">
        <span className="eyebrow">{section.eyebrow}</span>
        <h2 id={`events-${section.eyebrow}-title`}>{section.title}</h2>
      </header>
      {isEmpty ? (
        <div className="events-section-empty">
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="events-grid">{children}</div>
      )}
    </section>
  );
}

export default function EventsListPage() {
  const { language } = usePreferences();
  const t = PAGE_COPY[language] || PAGE_COPY.np;

  const live = useMemo(() => getDemoLiveEvents(), []);
  const upcoming = useMemo(() => getDemoUpcomingEvents(), []);
  const past = useMemo(() => getDemoPastEvents(), []);

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <article className="events-list-page">
        <header className="events-list-header">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <Section section={t.sections.live} isEmpty={live.length === 0} emptyText={t.sections.live.empty}>
          {live.map((event) => (
            <LiveCard key={event.id} event={event} t={t} language={language} />
          ))}
        </Section>

        <Section section={t.sections.upcoming} isEmpty={upcoming.length === 0} emptyText={t.sections.upcoming.empty}>
          {upcoming.map((event) => (
            <UpcomingCard key={event.id} event={event} t={t} language={language} />
          ))}
        </Section>

        <Section section={t.sections.past} isEmpty={past.length === 0} emptyText={t.sections.past.empty}>
          {past.map((event) => (
            <PastCard key={event.id} event={event} t={t} language={language} />
          ))}
        </Section>
      </article>
    </SiteShell>
  );
}
