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
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityStatsRow } from "@/components/ActivityStatsRow";
import { EventsHomeRail } from "@/components/EventsHomeRail";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { listLiveEvents, listUpcomingEvents } from "@/lib/eventsApi";
import { copy } from "@/lib/siteContent";

export default function HomeSearchView() {
  const { language } = usePreferences();
  const router = useRouter();
  const t = copy[language] ?? copy.np;
  const search = t.homeSearch ?? copy.np.homeSearch;
  const rail = t.liveEventsRail ?? copy.np.liveEventsRail;

  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [live, upcoming] = await Promise.all([
          listLiveEvents({ language }),
          listUpcomingEvents({ language, limit: 12 })
        ]);
        if (cancelled) return;
        setLiveEvents(live);
        setUpcomingEvents(upcoming);
      } catch {
        if (cancelled) return;
        setLiveEvents([]);
        setUpcomingEvents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

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
            <h1 id="home-search-title">{t.brand ?? t.footer?.brand ?? "श्रमदान"}</h1>
            <p>{search.slogan}</p>
          </header>

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
        </div>
      </section>

      <EventsHomeRail
        liveEvents={liveEvents}
        upcomingEvents={upcomingEvents}
        copy={rail}
        language={language}
      />
    </SiteShell>
  );
}
