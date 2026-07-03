"use client";

// The TV-app pivot homepage. Stacked blocks above the fold:
//
//   1. BrochureHero — restored pre-pivot video hero, Join + Learn More CTAs
//   2. EventsHomeRail — the main highlight; viewport-scales 1 → 7 cards
//   3. Stats pills + overview map
//   4. Curated for-you stream
//
// The search box + filters button live on /issues and /events (the listing
// surfaces that actually have a dataset to narrow). The rest of the old
// brochure HomeClient content lives on /intro, /invitations, and /resources
// (restored 2026-07-02 from 3d66f5b^).

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { ActivityStatsRow } from "@/components/ActivityStatsRow";
import { BrochureHero } from "@/components/BrochureHero";
import { CampaignsMap } from "@/components/CampaignsMap";
import { EventsHomeRail } from "@/components/EventsHomeRail";
import HomeDiscoveryRails from "@/components/HomeDiscoveryRails";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { localizeIssue } from "@/lib/adminUtils";
import { useCuratedCampaigns } from "@/lib/useCuratedCampaigns";
import { CAMPAIGN_STATUS_SEQUENCE } from "@/lib/campaignStatus";
import { copy } from "@/lib/siteContent";

// The map's status filter, picked by tapping a step of the activity funnel
// right above it. Session-scoped and DELIBERATELY separate from /campaigns'
// URL-driven filters (+ shramdan:campaigns:list-state) — a stage picked on
// home must never re-filter the campaigns page, and vice versa.
const HOME_MAP_STATUS_KEY = "shramdan:home:map-status";

export default function HomeSearchView({ overallPercent = null }) {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const search = t.homeSearch ?? copy.np.homeSearch;
  const rail = t.liveEventsRail ?? copy.np.liveEventsRail;

  const [mapStatus, setMapStatus] = useState(null);

  // One GET /campaigns/curated feeds the coverflow rail (ongoing + upcoming
  // shelves) AND the discovery strips below — the old 3× /events rail fetch is
  // gone. The map doesn't ride on this either (own fetch via CampaignsMap).
  const {
    shelves,
    loading: shelvesLoading,
    error: shelvesError,
    requestLocation
  } = useCuratedCampaigns();

  // The rail reads event.title directly (it isn't a re-localizing card), so
  // pick the language's title here from the marker's embedded translations —
  // a language flip repaints with no refetch.
  const localizeRailEvents = useCallback(
    (shelf) =>
      shelf.map((it) => {
        const localized = localizeIssue(it.data.linkedIssue, language);
        return localized?.title ? { ...it.data, title: localized.title } : it.data;
      }),
    [language]
  );
  const railLive = useMemo(
    () => localizeRailEvents(shelves.ongoing),
    [shelves.ongoing, localizeRailEvents]
  );
  const railUpcoming = useMemo(
    () => localizeRailEvents(shelves.upcoming),
    [shelves.upcoming, localizeRailEvents]
  );

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
      <BrochureHero variant="home" overallPercent={overallPercent} />

      {!shelvesLoading && !shelvesError && railLive.length === 0 && railUpcoming.length === 0 ? (
        // Backend answered with zero campaigns (e.g. clean production) —
        // invite the first listing instead of an empty rail shell. An API
        // error deliberately falls through to the rail: "ready to list" would
        // be a lie during an outage.
        <section className="home-launch-cta" aria-label={t.homeLaunch.title}>
          <h2>{t.homeLaunch.title}</h2>
          <p>{t.homeLaunch.body}</p>
          <Button type="primary" size="large" href="/issues/new" icon={<PlusOutlined />}>
            {t.homeLaunch.cta}
          </Button>
        </section>
      ) : (
        <EventsHomeRail
          liveEvents={railLive}
          upcomingEvents={railUpcoming}
          copy={rail}
          language={language}
          loading={shelvesLoading}
        />
      )}

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
      <HomeDiscoveryRails
        language={language}
        shelves={shelves}
        requestLocation={requestLocation}
      />
    </SiteShell>
  );
}
