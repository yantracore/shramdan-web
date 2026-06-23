"use client";

// Phase 2 v0 of the TV-app pivot homepage. Replaces the old brochure-style
// HomeClient at /. Stacked blocks above the fold:
//
//   1. Brand title + slogan
//   2. EventsHomeRail — the main highlight; viewport-scales 1 → 7 cards
//   3. Stats pills + overview map
//   4. Curated for-you stream
//
// The search box + filters button now live on /issues and /events (the
// listing surfaces that actually have a dataset to narrow). HomeClient.js
// stays in the repo as reference for /intro content. The IntroCinematic at
// /intro is a separate, already-polished page.

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivityStatsRow } from "@/components/ActivityStatsRow";
import EventMapBlock from "@/components/EventMapBlock";
import { EventsHomeRail } from "@/components/EventsHomeRail";
import { StreamList } from "@/components/StreamList";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { listAllEvents } from "@/lib/eventsApi";
import { getJson } from "@/lib/apiClient";
import { getListItems } from "@/lib/adminUtils";
import { copy } from "@/lib/siteContent";

// Issue statuses surfaced publicly (mirrors /issues page) — the home map mixes
// these raw issues in with scheduled events so the overview shows everything.
const PUBLIC_ISSUE_STATUSES = ["OPEN", "EVENT_SCHEDULED", "COMPLETED"];
const MAP_ISSUE_LIMIT = 100;

export default function HomeSearchView() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const search = t.homeSearch ?? copy.np.homeSearch;
  const rail = t.liveEventsRail ?? copy.np.liveEventsRail;

  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [mapIssues, setMapIssues] = useState([]);

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

  // Raw issues for the map — independent of the event buckets above. Language
  // doesn't change the geo filter, so this fires once; markers re-localize via
  // the `language` prop on render.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getJson("/issues", {
          params: { limit: MAP_ISSUE_LIMIT }
        });
        if (cancelled) return;
        const items = getListItems(response)
          .filter((issue) => PUBLIC_ISSUE_STATUSES.includes(issue?.status))
          .filter((issue) => {
            const lat = Number(issue?.latitude);
            const lng = Number(issue?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          });
        setMapIssues(items);
      } catch {
        if (!cancelled) setMapIssues([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mapEntries = useMemo(() => {
    const tag = (events, status) =>
      (events ?? []).map((event) => ({ event, status }));
    return [
      ...tag(liveEvents, "live"),
      ...tag(upcomingEvents, "upcoming"),
      ...tag(pastEvents, "past")
    ];
  }, [liveEvents, upcomingEvents, pastEvents]);

  return (
    <SiteShell>
      <section className="home-search-hero" aria-labelledby="home-search-title">
        <div className="home-search-hero-inner">
          <header className="home-search-brand">
            <Image
              className="home-search-brand-logo"
              src="/branding/logo-mark.png"
              alt=""
              width={112}
              height={112}
              priority
            />
            <h1 id="home-search-title">{t.brand ?? t.footer?.brand ?? "श्रमदान"}</h1>
            <p>{search.slogan}</p>
            <div className="home-search-intro-link">
              <Link href="/intro">
                {language === "np" ? "श्रमदान के हो? हेर्ने →" : "What is Shramdan? Learn more →"}
              </Link>
            </div>
          </header>

        </div>
      </section>

      <EventsHomeRail
        liveEvents={liveEvents}
        upcomingEvents={upcomingEvents}
        copy={rail}
        language={language}
      />

      <section className="home-search-panel" aria-label={search.mapEyebrow}>
        <div className="home-search-panel-inner">
          <div className="home-search-stats">
            <ActivityStatsRow language={language} />
          </div>

          {mapEntries.length > 0 || mapIssues.length > 0 ? (
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
                  issues={mapIssues}
                  issuesContent={t.issues}
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

      {/* Events live in the coverflow rail above; this stream lists issues only. */}
      <StreamList
        language={language}
        copy={search.forYou}
        defaultMode="issue"
        showModeTabs={false}
      />
    </SiteShell>
  );
}
