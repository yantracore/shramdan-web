"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  PlusOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Button, Select } from "antd";
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
    },
    filters: {
      ariaLabel: "अभियान फिल्टर",
      all: "सबै",
      live: "लाइभ",
      upcoming: "आउँदै",
      past: "सम्पन्न",
      statusLabel: "स्थिति",
      statusPlaceholder: "सबै स्थिति",
      eventTypeLabel: "अभियानको प्रकार",
      eventTypeCleanup: "सरसफाइ"
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
    },
    filters: {
      ariaLabel: "Filter campaigns",
      all: "All",
      live: "Live",
      upcoming: "Upcoming",
      past: "Past",
      statusLabel: "Status",
      statusPlaceholder: "All Statuses",
      eventTypeLabel: "Event Type",
      eventTypeCleanup: "Cleanup"
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

const NP_MONTHS_SHORT = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
];
const NP_WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];

// Date pill — full readable date + time for upcoming events.
// NP: "बिहि, जुन ४, २:३०"  /  EN: "Thu, Jun 4, 2:30 PM"
//
// We build the NP string manually because Chromium's Intl support for
// "ne-NP" emits Latin digits and inconsistent abbreviations across systems,
// and the SSR/CSR pair produced hydration warnings.
function formatSchedulePill(iso, language) {
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
  const datePill = formatSchedulePill(event.scheduledAt, language);
  return (
    <Link href={`/events/${event.id}`} className="events-card events-card-upcoming">
      <div className="events-card-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.thumbnailUrl || "/images/event-types/cleanup.jpg"} alt={event.title} loading="lazy" />
        <span className="events-card-badge events-card-badge-upcoming">
          <CalendarOutlined aria-hidden="true" /> {datePill}
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

const FILTER_KEYS = new Set(["all", "live", "upcoming", "past"]);

export default function EventsListPage() {
  const { language } = usePreferences();
  const t = PAGE_COPY[language] || PAGE_COPY.np;
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialFilter = (() => {
    const show = searchParams?.get("show");
    return show && FILTER_KEYS.has(show) ? show : "all";
  })();
  const [filter, setFilter] = useState(initialFilter);

  // Keep state in sync if the user navigates with back/forward.
  useEffect(() => {
    const show = searchParams?.get("show");
    const next = show && FILTER_KEYS.has(show) ? show : "all";
    setFilter((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  const updateFilter = (next) => {
    setFilter(next);
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (next === "all") {
      params.delete("show");
    } else {
      params.set("show", next);
    }
    const query = params.toString();
    router.replace(query ? `/events?${query}` : "/events", { scroll: false });
  };

  const live = useMemo(() => getDemoLiveEvents(), []);
  const upcoming = useMemo(() => getDemoUpcomingEvents(), []);
  const past = useMemo(() => getDemoPastEvents(), []);

  const statusOptions = [
    { value: "live", label: t.filters.live },
    { value: "upcoming", label: t.filters.upcoming },
    { value: "past", label: t.filters.past }
  ];

  const eventTypeOptions = [
    { value: "cleanup", label: t.filters.eventTypeCleanup }
  ];

  const localizedCopy = copy[language] || copy.np;
  const reportIssueCtaLabel = localizedCopy?.issueNew?.cta?.list ?? "Report a New Issue";

  const showLive = filter === "all" || filter === "live";
  const showUpcoming = filter === "all" || filter === "upcoming";
  const showPast = filter === "all" || filter === "past";

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <article className="events-list-page">
        <header className="events-list-header">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <div className="public-issues-toolbar">
          <div className="public-issues-filters">
            <div className="public-issues-filter-field">
              <label
                className="public-issues-filter-label"
                htmlFor="events-filter-status"
              >
                {t.filters.statusLabel}
              </label>
              <Select
                id="events-filter-status"
                allowClear
                onChange={(value) => updateFilter(value || "all")}
                options={statusOptions}
                placeholder={t.filters.statusPlaceholder}
                value={filter === "all" ? undefined : filter}
              />
            </div>
            <div className="public-issues-filter-field">
              <label
                className="public-issues-filter-label"
                htmlFor="events-filter-type"
              >
                {t.filters.eventTypeLabel}
              </label>
              <Select
                id="events-filter-type"
                disabled
                options={eventTypeOptions}
                value="cleanup"
              />
            </div>
            <Link className="public-issues-filters-cta" href="/issues/new">
              <Button type="primary" icon={<PlusOutlined />} size="large">
                {reportIssueCtaLabel}
              </Button>
            </Link>
          </div>
        </div>

        {showLive ? (
          <Section section={t.sections.live} isEmpty={live.length === 0} emptyText={t.sections.live.empty}>
            {live.map((event) => (
              <LiveCard key={event.id} event={event} t={t} language={language} />
            ))}
          </Section>
        ) : null}

        {showUpcoming ? (
          <Section section={t.sections.upcoming} isEmpty={upcoming.length === 0} emptyText={t.sections.upcoming.empty}>
            {upcoming.map((event) => (
              <UpcomingCard key={event.id} event={event} t={t} language={language} />
            ))}
          </Section>
        ) : null}

        {showPast ? (
          <Section section={t.sections.past} isEmpty={past.length === 0} emptyText={t.sections.past.empty}>
            {past.map((event) => (
              <PastCard key={event.id} event={event} t={t} language={language} />
            ))}
          </Section>
        ) : null}
      </article>
    </SiteShell>
  );
}
