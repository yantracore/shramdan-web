"use client";

// /calendar — month grid of upcoming + past Shramdan events. Pure view
// over devMockData getDemoLive/Upcoming/PastEvents; clicking a day with
// events anchors to that day's list in the column on the right (or below
// on mobile).

import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { listAllEvents } from "@/lib/eventsApi";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const NP_MONTHS = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
];

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const NP_WEEKDAYS = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COPY = {
  np: {
    pageTitle: "अभियान पात्रो",
    eyebrow: "महिनाको दृश्य",
    title: "तय भएका अभियानहरू एकै नजरमा",
    intro: "तय भएका, चलिरहेका र भर्खर सम्पन्न अभियान महिनाको नक्साजस्तै हेर्नुहोस्।",
    prev: "अघिल्लो",
    next: "अर्को",
    today: "आज",
    selectedHint: "मिति छान्नुहोस्",
    selectedEmpty: "यो दिन कुनै तय भएको अभियान छैन।",
    legendLive: "लाइभ",
    legendUpcoming: "आउँदै",
    legendPast: "सम्पन्न"
  },
  en: {
    pageTitle: "Campaign calendar",
    eyebrow: "Month view",
    title: "Scheduled campaigns at a glance",
    intro: "Scheduled, live, and recently completed campaigns laid out on the month grid.",
    prev: "Previous",
    next: "Next",
    today: "Today",
    selectedHint: "Pick a date",
    selectedEmpty: "No campaigns scheduled on this day.",
    legendLive: "Live",
    legendUpcoming: "Upcoming",
    legendPast: "Done"
  }
};

function isoDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(date, language) {
  const months = language === "np" ? NP_MONTHS : EN_MONTHS;
  const weekdays = language === "np" ? NP_WEEKDAYS : EN_WEEKDAYS;
  return `${weekdays[date.getDay()]}, ${months[date.getMonth()]} ${localizeDigits(date.getDate(), language)}`;
}

export default function CalendarPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const months = language === "np" ? NP_MONTHS : EN_MONTHS;
  const weekdays = language === "np" ? NP_WEEKDAYS : EN_WEEKDAYS;

  const [buckets, setBuckets] = useState({ live: [], upcoming: [], past: [] });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listAllEvents({ language });
        if (!cancelled) setBuckets(data);
      } catch {
        if (!cancelled) setBuckets({ live: [], upcoming: [], past: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Collect all dated events, indexed by ISO date key.
  const eventsByDay = useMemo(() => {
    const map = new Map();
    const push = (event, dateIso, kind) => {
      if (!dateIso) return;
      const d = new Date(dateIso);
      if (Number.isNaN(d.getTime())) return;
      const key = isoDateKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ ...event, kind, date: d });
    };
    buckets.live.forEach((e) => push(e, e.scheduledAt, "live"));
    buckets.upcoming.forEach((e) => push(e, e.scheduledAt, "upcoming"));
    buckets.past.forEach((e) => push(e, e.completedAt, "past"));
    return map;
  }, [buckets]);

  const today = new Date();
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDayOfMonth.getDay(); // 0=Sun
  const cells = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedKey = isoDateKey(selected);
  const selectedEvents = eventsByDay.get(selectedKey) || [];

  const goPrev = () => setCursor(new Date(year, month - 1, 1));
  const goNext = () => setCursor(new Date(year, month + 1, 1));
  const goToday = () => {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today);
  };

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="calendar-section page-section">
        <header className="calendar-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <div className="calendar-controls">
          <button
            type="button"
            className="calendar-nav"
            onClick={goPrev}
            aria-label={t.prev}
          >
            <ArrowLeftOutlined />
          </button>
          <h2 className="calendar-month-label">
            {months[month]} {localizeDigits(year, language)}
          </h2>
          <button
            type="button"
            className="calendar-nav"
            onClick={goNext}
            aria-label={t.next}
          >
            <ArrowRightOutlined />
          </button>
          <button
            type="button"
            className="calendar-today"
            onClick={goToday}
          >
            {t.today}
          </button>
          <div className="calendar-legend" aria-hidden="true">
            <span className="calendar-legend-dot is-live" /> {t.legendLive}
            <span className="calendar-legend-dot is-upcoming" /> {t.legendUpcoming}
            <span className="calendar-legend-dot is-past" /> {t.legendPast}
          </div>
        </div>

        <div className="calendar-grid-wrap">
          <div className="calendar-grid" role="grid">
            {weekdays.map((w) => (
              <div key={w} className="calendar-weekday" role="columnheader">
                {w}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={`blank-${i}`} className="calendar-cell calendar-cell-blank" />;
              const key = isoDateKey(d);
              const dayEvents = eventsByDay.get(key) || [];
              const isToday = isoDateKey(today) === key;
              const isSelected = selectedKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`calendar-cell${isToday ? " is-today" : ""}${isSelected ? " is-selected" : ""}${dayEvents.length > 0 ? " has-events" : ""}`}
                  onClick={() => setSelected(d)}
                  aria-label={dayLabel(d, language)}
                >
                  <span className="calendar-cell-num">
                    {localizeDigits(d.getDate(), language)}
                  </span>
                  <span className="calendar-cell-dots" aria-hidden="true">
                    {dayEvents.slice(0, 3).map((e, k) => (
                      <span key={k} className={`calendar-cell-dot is-${e.kind}`} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <aside className="calendar-day-panel" aria-live="polite">
            <header className="calendar-day-panel-head">
              <strong>{dayLabel(selected, language)}</strong>
              <span>{localizeDigits(selectedEvents.length, language)}</span>
            </header>
            {selectedEvents.length === 0 ? (
              <p className="calendar-day-panel-empty">{t.selectedEmpty}</p>
            ) : (
              <ul className="calendar-day-panel-list">
                {selectedEvents.map((e) => (
                  <li key={`${e.id}-${e.kind}`} className={`calendar-day-event is-${e.kind}`}>
                    <Link href={`/events/${e.slug ?? e.id}`}>
                      <span className="calendar-day-event-kind">
                        {t[`legend${e.kind.charAt(0).toUpperCase() + e.kind.slice(1)}`]}
                      </span>
                      <strong>{e.title}</strong>
                      {e.addressText ? <span>{e.addressText}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
