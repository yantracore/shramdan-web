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
import { useCallback, useEffect, useState } from "react";
import { ActivityStatsRow } from "@/components/ActivityStatsRow";
import { CampaignsMap } from "@/components/CampaignsMap";
import { EventsHomeRail } from "@/components/EventsHomeRail";
import HomeDiscoveryRails from "@/components/HomeDiscoveryRails";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { listAllEvents } from "@/lib/eventsApi";
import { CAMPAIGN_STATUS_SEQUENCE } from "@/lib/campaignStatus";
import { copy } from "@/lib/siteContent";

// The map's status filter, picked by tapping a step of the activity funnel
// right above it. Session-scoped and DELIBERATELY separate from /campaigns'
// URL-driven filters (+ shramdan:campaigns:list-state) — a stage picked on
// home must never re-filter the campaigns page, and vice versa.
const HOME_MAP_STATUS_KEY = "shramdan:home:map-status";

export default function HomeSearchView() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const search = t.homeSearch ?? copy.np.homeSearch;
  const rail = t.liveEventsRail ?? copy.np.liveEventsRail;

  const [liveEvents, setLiveEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [mapStatus, setMapStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    (async () => {
      try {
        // Both rail buckets in one shot — the map no longer rides on these
        // (it has its own minimal /campaigns fetch via CampaignsMap).
        const buckets = await listAllEvents({ language });
        if (cancelled) return;
        setLiveEvents(buckets.active ?? []);
        setUpcomingEvents(buckets.scheduled ?? []);
      } catch {
        if (cancelled) return;
        setLiveEvents([]);
        setUpcomingEvents([]);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Restore the persisted map filter AFTER mount — reading sessionStorage in
  // the useState initializer would make the server and client first paints
  // disagree (hydration mismatch on aria-pressed / is-active).
  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(HOME_MAP_STATUS_KEY);
      if (stored && CAMPAIGN_STATUS_SEQUENCE.includes(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMapStatus(stored);
      }
    } catch {
      /* storage unavailable — filter just starts at "all" */
    }
  }, []);

  const handleSelectStatus = useCallback((next) => {
    setMapStatus(next);
    try {
      if (next) window.sessionStorage.setItem(HOME_MAP_STATUS_KEY, next);
      else window.sessionStorage.removeItem(HOME_MAP_STATUS_KEY);
    } catch {
      /* best-effort persistence only */
    }
  }, []);

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
        loading={eventsLoading}
      />

      <section className="home-search-panel" aria-label={search.mapEyebrow}>
        <div className="home-search-panel-inner">
          <div className="home-search-stats">
            <ActivityStatsRow
              language={language}
              activeStatus={mapStatus}
              onSelectStatus={handleSelectStatus}
            />
          </div>

          {/* Always rendered: the funnel above is this map's filter control,
              so the canvas has to stay put even when a stage plots nothing. */}
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
              <CampaignsMap
                items={[]}
                language={language}
                content={t.issues}
                mapCopy={search.map}
                emptyLabel={search.mapEmpty}
                height={320}
                filters={{ status: mapStatus }}
              />
            </div>
          </section>
        </div>
      </section>

      {/* Intent-grouped discovery rails (near / happening / support / impact). */}
      <HomeDiscoveryRails language={language} />
    </SiteShell>
  );
}
