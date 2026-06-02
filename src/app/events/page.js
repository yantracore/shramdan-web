"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Select } from "antd";
import { SiteShell } from "@/components/SiteShell";
import { EventListCard } from "@/components/EventListCard";
import { EventPreviewPane } from "@/components/EventPreviewPane";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import {
  getDemoLiveEvents,
  getDemoUpcomingEvents,
  getDemoPastEvents
} from "@/lib/devMockData";

const PAGE_COPY = {
  np: {
    pageTitle: "अभियानहरू",
    eyebrow: "अभियानहरू",
    title: "श्रमदान अभियानहरू",
    intro:
      "अहिले प्रसारणमा रहेका, आउँदै गरेका, र भर्खर सम्पन्न भएका सबै अभियानहरू। बायाँबाट कुनै पनि अभियान छान्नुहोस् — दायाँ प्यानलमा लाइभ प्रसारण र विवरण देखिनेछ।",
    sections: {
      live: { eyebrow: "अहिले लाइभ" },
      upcoming: { eyebrow: "आउँदै" },
      past: { eyebrow: "सम्पन्न" }
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
    },
    preview: {
      empty: "बायाँबाट कुनै अभियान छान्नुहोस्।",
      back: "सूचीमा फर्कनुहोस्",
      openFull: "पूर्ण विवरण पृष्ठ खोल्नुहोस्",
      meetup: "भेला हुने ठाउँ र निर्देशन",
      roles: "चाहिने भूमिकाहरू",
      photos: "तस्वीरहरू",
      voices: "दिनको आवाज",
      result: "नतिजा सारांश",
      showMore: "थप पढ्नुहोस्",
      showLess: "छोटो बनाउनुहोस्",
      risk: {
        NORMAL: "सामान्य जोखिम",
        WATCH: "ध्यान आवश्यक",
        HIGH: "उच्च जोखिम"
      }
    },
    list: {
      loadingMore: "थप अभियान ल्याउँदै…",
      noMore: "सबै अभियान देखाइए।"
    }
  },
  en: {
    pageTitle: "Events",
    eyebrow: "Events",
    title: "Shramdan Campaigns",
    intro:
      "All campaigns — live, upcoming, and recently completed. Pick any event from the left; the live stream and details show on the right.",
    sections: {
      live: { eyebrow: "On now" },
      upcoming: { eyebrow: "Upcoming" },
      past: { eyebrow: "Completed" }
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
    },
    preview: {
      empty: "Pick a campaign from the list to see details here.",
      back: "Back to list",
      openFull: "Open Full Event Page",
      meetup: "Meetup details",
      roles: "Roles needed",
      photos: "Photos",
      voices: "Voices from the day",
      result: "Result summary",
      showMore: "Show more",
      showLess: "Show less",
      risk: {
        NORMAL: "Normal risk",
        WATCH: "Heads-up",
        HIGH: "High risk"
      }
    },
    list: {
      loadingMore: "Loading more campaigns…",
      noMore: "All campaigns shown."
    }
  }
};

const FILTER_KEYS = new Set(["all", "live", "upcoming", "past"]);
const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 6;

function byScheduledAsc(a, b) {
  return Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt);
}
function byCompletedDesc(a, b) {
  return Date.parse(b.completedAt) - Date.parse(a.completedAt);
}

export default function EventsListPage() {
  const { language } = usePreferences();
  const t = PAGE_COPY[language] || PAGE_COPY.np;
  const router = useRouter();
  const searchParams = useSearchParams();

  // ----- filter state (status select, event type disabled placeholder) -----
  const initialFilter = (() => {
    const show = searchParams?.get("show");
    return show && FILTER_KEYS.has(show) ? show : "all";
  })();
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    const show = searchParams?.get("show");
    const next = show && FILTER_KEYS.has(show) ? show : "all";
    setFilter((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  // ----- raw data + ordered/flattened list ------------------------------
  const live = useMemo(() => getDemoLiveEvents(), []);
  const upcoming = useMemo(() => getDemoUpcomingEvents(), []);
  const past = useMemo(() => getDemoPastEvents(), []);

  // ----- city filter ----------------------------------------------------
  const initialCity = searchParams?.get("city") || "all";
  const [city, setCity] = useState(initialCity);
  useEffect(() => {
    const c = searchParams?.get("city") || "all";
    setCity((prev) => (prev === c ? prev : c));
  }, [searchParams]);

  const cityOptions = useMemo(() => {
    const set = new Set();
    [...live, ...upcoming, ...past].forEach((e) => {
      const tail = (e.addressText || "").split(",").pop()?.trim();
      if (tail) set.add(tail);
    });
    return Array.from(set).sort();
  }, [live, upcoming, past]);

  const updateCity = useCallback(
    (next) => {
      setCity(next);
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (!next || next === "all") params.delete("city");
      else params.set("city", next);
      const query = params.toString();
      router.replace(query ? `/events?${query}` : "/events", { scroll: false });
    },
    [router, searchParams]
  );

  const orderedEvents = useMemo(() => {
    const items = [
      ...live.map((event) => ({ event, status: "live" })),
      ...[...upcoming].sort(byScheduledAsc).map((event) => ({ event, status: "upcoming" })),
      ...[...past].sort(byCompletedDesc).map((event) => ({ event, status: "past" }))
    ];
    let filtered = filter === "all" ? items : items.filter((entry) => entry.status === filter);
    if (city && city !== "all") {
      filtered = filtered.filter((entry) => {
        const tail = (entry.event.addressText || "").split(",").pop()?.trim();
        return tail === city;
      });
    }
    return filtered;
  }, [live, upcoming, past, filter, city]);

  // ----- selection state --------------------------------------------------
  const [selectedId, setSelectedId] = useState(null);
  const didInitialResolveRef = useRef(false);

  // Resolve initial selection: URL param > first live > first overall.
  // Also bump visibleCount so the selected card is in the rendered slice
  // even when it lives past the initial window (e.g. ?event=demo-past-1).
  useEffect(() => {
    if (didInitialResolveRef.current) return;
    if (orderedEvents.length === 0) return;
    didInitialResolveRef.current = true;
    const fromUrl = searchParams?.get("event");
    let resolvedId = null;
    let resolvedIndex = -1;
    if (fromUrl) {
      resolvedIndex = orderedEvents.findIndex((e) => e.event.id === fromUrl);
      if (resolvedIndex >= 0) resolvedId = fromUrl;
    }
    if (!resolvedId) {
      resolvedIndex = orderedEvents.findIndex((e) => e.status === "live");
      if (resolvedIndex < 0) resolvedIndex = 0;
      resolvedId = orderedEvents[resolvedIndex]?.event.id ?? null;
    }
    setSelectedId(resolvedId);
    if (resolvedIndex >= INITIAL_VISIBLE) {
      setVisibleCount((v) => Math.max(v, resolvedIndex + 1));
    }
    // If a mobile user lands via a direct ?event=… link, jump straight to
    // the detail view instead of the list — they came for the event.
    if (
      fromUrl &&
      resolvedId &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      setMobileView("detail");
    }
  }, [orderedEvents, searchParams]);

  // When filter narrows the list and selected isn't in it, re-select first.
  // Skip until initial resolve has completed so we don't clobber the URL pick.
  useEffect(() => {
    if (!didInitialResolveRef.current) return;
    if (selectedId === null) return;
    if (orderedEvents.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!orderedEvents.some((e) => e.event.id === selectedId)) {
      const firstLive = orderedEvents.find((e) => e.status === "live");
      setSelectedId((firstLive || orderedEvents[0])?.event.id ?? null);
    }
  }, [orderedEvents, selectedId]);

  // ----- visible window (load-more) ---------------------------------------
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Reset window when filter changes.
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [filter]);

  const visibleEvents = useMemo(
    () => orderedEvents.slice(0, visibleCount),
    [orderedEvents, visibleCount]
  );
  const hasMore = visibleCount < orderedEvents.length;

  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((v) => Math.min(v + LOAD_MORE_STEP, orderedEvents.length));
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, orderedEvents.length]);

  // ----- mobile drill-in state -------------------------------------------
  const [mobileView, setMobileView] = useState("list");

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (event) => {
      if (event.matches) setMobileView("list");
    };
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  // ----- URL sync on select ---------------------------------------------
  const updateUrl = useCallback(
    (eventId, opts) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (eventId) params.set("event", eventId);
      else params.delete("event");
      const query = params.toString();
      const url = query ? `/events?${query}` : "/events";
      if (opts?.push) {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [router, searchParams]
  );

  const handleSelect = useCallback(
    (id) => {
      setSelectedId(id);
      const isMobile =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(max-width: 1023px)").matches;
      if (isMobile) {
        setMobileView("detail");
        updateUrl(id, { push: true });
      } else {
        updateUrl(id);
      }
    },
    [updateUrl]
  );

  const handleBack = useCallback(() => {
    setMobileView("list");
  }, []);

  // ----- filter Select -----------------------------------------------------
  const updateFilter = useCallback(
    (next) => {
      setFilter(next);
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (next === "all") params.delete("show");
      else params.set("show", next);
      const query = params.toString();
      router.replace(query ? `/events?${query}` : "/events", { scroll: false });
    },
    [router, searchParams]
  );

  const statusOptions = [
    { value: "live", label: t.filters.live },
    { value: "upcoming", label: t.filters.upcoming },
    { value: "past", label: t.filters.past }
  ];
  const eventTypeOptions = [{ value: "cleanup", label: t.filters.eventTypeCleanup }];

  const localizedCopy = copy[language] || copy.np;
  const reportIssueCtaLabel =
    localizedCopy?.issueNew?.cta?.list ?? "Report a New Issue";

  // ----- keyboard nav on the listbox -------------------------------------
  const listRef = useRef(null);
  const handleListKeyDown = (e) => {
    const total = visibleEvents.length;
    if (total === 0) return;
    const currentIndex = visibleEvents.findIndex((x) => x.event.id === selectedId);
    let nextIndex = currentIndex;
    if (e.key === "ArrowDown") {
      nextIndex = Math.min(total - 1, currentIndex + 1);
    } else if (e.key === "ArrowUp") {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = total - 1;
    } else {
      return;
    }
    if (nextIndex !== currentIndex) {
      e.preventDefault();
      const nextId = visibleEvents[nextIndex]?.event.id;
      if (nextId) handleSelect(nextId);
    }
  };

  // ----- auto-scroll selected card into view on initial deep-link --------
  const selectedCardRef = useRef(null);
  const didInitialScrollRef = useRef(false);
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (!selectedId) return;
    if (!selectedCardRef.current) return;
    didInitialScrollRef.current = true;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    selectedCardRef.current.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  }, [selectedId]);

  // ----- build list with inline status dividers --------------------------
  const renderedItems = [];
  let lastStatus = null;
  visibleEvents.forEach((entry, idx) => {
    if (entry.status !== lastStatus) {
      const dividerLabel =
        entry.status === "live"
          ? t.sections.live.eyebrow
          : entry.status === "upcoming"
            ? t.sections.upcoming.eyebrow
            : t.sections.past.eyebrow;
      renderedItems.push(
        <li
          key={`divider-${entry.status}`}
          role="separator"
          className="events-split-divider"
        >
          {dividerLabel}
        </li>
      );
      lastStatus = entry.status;
    }
    const isSelected = entry.event.id === selectedId;
    renderedItems.push(
      <EventListCard
        key={entry.event.id}
        event={entry.event}
        status={entry.status}
        selected={isSelected}
        language={language}
        t={t}
        onSelect={handleSelect}
        optionId={`event-option-${entry.event.id}`}
        ref={isSelected ? selectedCardRef : null}
      />
    );
  });

  const selectedEntry = orderedEvents.find((e) => e.event.id === selectedId) || null;
  const isMobileDrillActive = mobileView === "detail";

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
                htmlFor="events-filter-city"
              >
                {language === "np" ? "स्थान" : "City"}
              </label>
              <Select
                id="events-filter-city"
                allowClear
                onChange={(value) => updateCity(value || "all")}
                options={cityOptions.map((c) => ({ value: c, label: c }))}
                placeholder={language === "np" ? "सबै स्थान" : "All cities"}
                value={city === "all" ? undefined : city}
              />
            </div>
            <Link className="public-issues-filters-cta" href="/issues/new">
              <Button type="primary" icon={<PlusOutlined />} size="large">
                {reportIssueCtaLabel}
              </Button>
            </Link>
          </div>
        </div>

        <section
          className="events-split"
          data-mobile-view={mobileView}
          aria-label={t.filters.ariaLabel}
        >
          <div className="events-split-list">
            <ul
              ref={listRef}
              role="listbox"
              aria-label={t.title}
              aria-activedescendant={
                selectedId ? `event-option-${selectedId}` : undefined
              }
              className="events-split-list-inner"
              onKeyDown={handleListKeyDown}
            >
              {renderedItems}
            </ul>
            {hasMore ? (
              <>
                <div ref={sentinelRef} className="events-split-sentinel" aria-hidden="true" />
                <div className="events-split-loading" role="status" aria-live="polite">
                  {t.list.loadingMore}
                </div>
              </>
            ) : orderedEvents.length > INITIAL_VISIBLE ? (
              <div className="events-split-nomore">{t.list.noMore}</div>
            ) : null}
          </div>

          <EventPreviewPane
            event={selectedEntry?.event || null}
            status={selectedEntry?.status || "live"}
            language={language}
            t={t}
            onBack={handleBack}
            isMobileDrillActive={isMobileDrillActive}
          />
        </section>
      </article>
    </SiteShell>
  );
}
