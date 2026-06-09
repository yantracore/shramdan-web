"use client";

// Phase 2 v0 of the TV-app pivot homepage. Replaces the old brochure-style
// HomeClient at /. Three stacked blocks above the fold:
//
//   1. Brand title + slogan (compact — share the band with the search box)
//   2. Search box + filters button
//   3. EventsHomeRail — the main highlight; viewport-scales 1 → 7 cards
//
// Stats pills, map, and curated for-you stream come in Phase 2 follow-ups.
// HomeClient.js stays in the repo as reference for /intro content. The
// IntroCinematic at /intro is a separate, already-polished page.

import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityStatsRow } from "@/components/ActivityStatsRow";
import EventMapBlock from "@/components/EventMapBlock";
import { EventsHomeRail } from "@/components/EventsHomeRail";
import { StreamList } from "@/components/StreamList";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { listAllEvents } from "@/lib/eventsApi";
import { copy } from "@/lib/siteContent";

export default function HomeSearchView() {
  const { language } = usePreferences();
  const router = useRouter();
  const t = copy[language] ?? copy.np;
  const search = t.homeSearch ?? copy.np.homeSearch;
  const rail = t.liveEventsRail ?? copy.np.liveEventsRail;

  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // listAllEvents() returns the three buckets in one shot so the
        // rail and the map stay in sync without firing 3 parallel calls.
        const buckets = await listAllEvents({ language });
        if (cancelled) return;
        setLiveEvents(buckets.live ?? []);
        setUpcomingEvents(buckets.upcoming ?? []);
        setPastEvents(buckets.past ?? []);
      } catch {
        if (cancelled) return;
        setLiveEvents([]);
        setUpcomingEvents([]);
        setPastEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const mapEntries = useMemo(() => {
    const tag = (events, status) =>
      (events ?? []).map((event) => ({ event, status }));
    return [
      ...tag(liveEvents, "live"),
      ...tag(upcomingEvents, "upcoming"),
      ...tag(pastEvents, "past")
    ];
  }, [liveEvents, upcomingEvents, pastEvents]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    router.push(qs ? `/events?${qs}` : "/events");
  };

  return (
    <SiteShell>
      <section className="home-search-hero" aria-labelledby="home-search-title">
        <div className="home-search-hero-inner">
          <header className="home-search-brand">
            <Image
              className="home-search-brand-logo"
              src="/branding/logo.png"
              alt=""
              width={112}
              height={112}
              priority
            />
            <h1 id="home-search-title">{t.brand ?? t.footer?.brand ?? "श्रमदान"}</h1>
            <p>{search.slogan}</p>
          </header>

        </div>
      </section>

      <EventsHomeRail
        liveEvents={liveEvents}
        upcomingEvents={upcomingEvents}
        copy={rail}
        language={language}
      />

      <section className="home-search-panel" aria-label={search.searchAria}>
        <div className="home-search-panel-inner">
          <form className="home-search-bar" onSubmit={handleSubmit} role="search">
            <label className="home-search-input">
              <SearchOutlined aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={search.searchPlaceholder}
                aria-label={search.searchAria}
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              className="home-search-filters"
              aria-label={search.filtersLabel}
              title={search.filtersLabel}
            >
              <FilterOutlined aria-hidden="true" />
              <span>{search.filtersLabel}</span>
            </button>
            <button
              type="submit"
              className="home-search-submit"
              aria-label={search.submitAria}
            >
              <SearchOutlined aria-hidden="true" />
            </button>
          </form>

          <div className="home-search-stats">
            <ActivityStatsRow language={language} variant="events" />
          </div>

          {mapEntries.length > 0 ? (
            <section
              className="home-search-map"
              aria-labelledby="home-search-map-title"
            >
              <header className="home-search-map-header">
                <span className="eyebrow home-search-map-eyebrow">
                  {search.mapEyebrow}
                </span>
              </header>
              <h2 id="home-search-map-title" className="sr-only">
                {search.mapEyebrow}
              </h2>
              <div className="home-search-map-frame">
                <EventMapBlock
                  entries={mapEntries}
                  t={search.map}
                  language={language}
                  height={544}
                  interactive
                  enableFullscreen
                  fullscreenLabel={search.map.fullscreenOpen}
                  exitFullscreenLabel={search.map.fullscreenClose}
                />
              </div>
            </section>
          ) : null}
        </div>
      </section>

      <StreamList language={language} copy={search.forYou} defaultMode="event" />
    </SiteShell>
  );
}
