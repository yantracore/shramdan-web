"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloseOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Select } from "antd";
import { SiteShell } from "@/components/SiteShell";
import { EventListCard } from "@/components/EventListCard";
import { EventPreviewPane } from "@/components/EventPreviewPane";
import { ActivityStatsRow } from "@/components/ActivityStatsRow";
import { ProvinceDistrictFilter } from "@/components/ProvinceDistrictFilter";
import { PublicSearchBar } from "@/components/PublicSearchBar";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { listAllEvents } from "@/lib/eventsApi";
import { haversineKm } from "@/lib/haversine";
import { useGeolocation } from "@/lib/useGeolocation";
import { ISSUE_CATEGORIES } from "@/lib/adminUtils";

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
      view: "विवरण हेर्ने"
    },
    filters: {
      ariaLabel: "अभियान फिल्टर",
      all: "सबै",
      allStatuses: "सबै स्थिति",
      live: "लाइभ",
      upcoming: "आउँदै",
      past: "सम्पन्न",
      statusLabel: "स्थिति",
      statusPlaceholder: "सबै स्थिति",
      categoryLabel: "क्षेत्र",
      categoryPlaceholder: "सबै क्षेत्र",
      districtLabel: "जिल्ला",
      districtPlaceholder: "सबै जिल्ला",
      allDistricts: "सबै जिल्ला",
      sortLabel: "क्रमबद्ध",
      sortPlaceholder: "क्रम छान्नुहोस्",
      sortMostJoined: "सबैभन्दा बढी सहभागी",
      sortNewest: "नयाँ पहिले",
      sortNearest: "नजिकैका पहिले",
      sortLocating: "स्थान खोज्दै…",
      sortLocationDenied: "स्थान अनुमति अस्वीकृत भयो",
      sortLocationUnsupported: "ब्राउजरले स्थान समर्थन गर्दैन",
      searchingPrefix: "खोज्दै:",
      clearSearch: "खोज खाली गर्ने"
    },
    categoryLabels: {
      ROADSIDE: "सडक र फुटपाथ",
      VACANT_LAND: "खाली जग्गा",
      RIVERBANK: "नदी किनार",
      DRAINAGE: "ढल र नाला",
      PARK_PUBLIC_SPACE: "पार्क र सार्वजनिक स्थान",
      HIKING_TRAIL: "पदयात्रा मार्ग",
      OTHER: "अन्य"
    },
    preview: {
      empty: "बायाँबाट कुनै अभियान छान्नुहोस्।",
      back: "सूचीमा फर्कने",
      openFull: "पूर्ण विवरण हेर्ने",
      meetup: "भेला हुने ठाउँ र निर्देशन",
      roles: "सहभागीहरू",
      photos: "तस्वीरहरू",
      voices: "दिनको आवाज",
      result: "नतिजा सारांश",
      showMore: "थप पढ्ने",
      showLess: "छोटो बनाउने",
      risk: {
        NORMAL: "सामान्य जोखिम",
        WATCH: "ध्यान आवश्यक",
        HIGH: "उच्च जोखिम"
      }
    },
    list: {
      loadingMore: "थप अभियान ल्याउँदै…",
      noMore: "सबै अभियान देखाइए।"
    },
    map: {
      statusLabels: {
        live: "अहिले लाइभ",
        upcoming: "आउँदै",
        past: "सम्पन्न"
      },
      viewDetail: "विवरण",
      fullscreenOpen: "पूर्ण-स्क्रिन नक्सा खोल्ने",
      fullscreenClose: "पूर्ण-स्क्रिन नक्सा बन्द गर्ने"
    }
  },
  en: {
    pageTitle: "Events",
    eyebrow: "Events",
    title: "Shramdan Events",
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
      allStatuses: "All Statuses",
      live: "Live",
      upcoming: "Upcoming",
      past: "Past",
      statusLabel: "Status",
      statusPlaceholder: "All Statuses",
      categoryLabel: "Category",
      categoryPlaceholder: "All Categories",
      districtLabel: "District",
      districtPlaceholder: "All Districts",
      allDistricts: "All Districts",
      sortLabel: "Sort By",
      sortPlaceholder: "Sort",
      sortMostJoined: "Most Joined",
      sortNewest: "Newest First",
      sortNearest: "Nearest to Me",
      sortLocating: "Locating…",
      sortLocationDenied: "Location permission denied",
      sortLocationUnsupported: "Browser does not support location",
      searchingPrefix: "Searching:",
      clearSearch: "Clear search"
    },
    categoryLabels: {
      ROADSIDE: "Roadside",
      VACANT_LAND: "Vacant land",
      RIVERBANK: "Riverbank",
      DRAINAGE: "Drainage",
      PARK_PUBLIC_SPACE: "Park / public space",
      HIKING_TRAIL: "Hiking trail",
      OTHER: "Other"
    },
    preview: {
      empty: "Pick a campaign from the list to see details here.",
      back: "Back to list",
      openFull: "Open Full Event Page",
      meetup: "Meetup details",
      roles: "Participants",
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
    },
    map: {
      statusLabels: {
        live: "On now",
        upcoming: "Upcoming",
        past: "Completed"
      },
      viewDetail: "View",
      fullscreenOpen: "Open fullscreen map",
      fullscreenClose: "Close fullscreen map"
    }
  }
};

const FILTER_KEYS = new Set(["all", "live", "upcoming", "past"]);
const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 6;

// Sort options mirror /issues for visual parity. They re-order events
// *within* each status group (live, upcoming, past) so the page's coarse
// timeline structure stays intact. `nearest` is client-only and uses the
// browser geolocation API; the others map to backend sorts once the events
// list endpoint accepts the same `sort=` param /issues already supports.
const SORT_OPTIONS = [
  { value: "participantCount", labelKey: "sortMostJoined", clientOnly: false },
  { value: "createdAt", labelKey: "sortNewest", clientOnly: false },
  { value: "nearest", labelKey: "sortNearest", clientOnly: true }
];
const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));
const CLIENT_ONLY_SORTS = new Set(
  SORT_OPTIONS.filter((o) => o.clientOnly).map((o) => o.value)
);
const CATEGORY_VALUES = new Set(ISSUE_CATEGORIES);

function byScheduledAsc(a, b) {
  return Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt);
}
function byCompletedDesc(a, b) {
  return Date.parse(b.completedAt) - Date.parse(a.completedAt);
}


export default function EventsListPageContent() {
  const { language } = usePreferences();
  const t = PAGE_COPY[language] || PAGE_COPY.np;
  const homeSearch = copy[language]?.homeSearch || copy.np.homeSearch;
  const router = useRouter();
  const searchParams = useSearchParams();

  // ----- filter state (status / category / province / district / sort + view) -------
  // URL params: ?show=status&category=KEY&province=UUID&district=UUID&sort=VALUE&q=TEXT&event=ID
  const readFiltersFromUrl = useCallback(() => {
    const show = searchParams?.get("show");
    const categoryParam = searchParams?.get("category");
    const provinceParam = searchParams?.get("province");
    const districtParam = searchParams?.get("district");
    const sortParam = searchParams?.get("sort");
    const qParam = searchParams?.get("q");
    return {
      status: show && FILTER_KEYS.has(show) ? show : "all",
      category:
        categoryParam && CATEGORY_VALUES.has(categoryParam)
          ? categoryParam
          : undefined,
      provinceId: provinceParam || undefined,
      districtId: districtParam || undefined,
      sort:
        sortParam && SORT_VALUES.has(sortParam) ? sortParam : "participantCount",
      q: qParam ? qParam.trim() : ""
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(() => readFiltersFromUrl());

  useEffect(() => {
    const next = readFiltersFromUrl();
    setFilters((prev) =>
      prev.status === next.status &&
      prev.category === next.category &&
      prev.provinceId === next.provinceId &&
      prev.districtId === next.districtId &&
      prev.sort === next.sort &&
      prev.q === next.q
        ? prev
        : next
    );
  }, [readFiltersFromUrl]);

  // Detailed filter panel is collapsed by default; the filter button in the
  // search bar toggles it open. Search text is kept in a local input buffer
  // and committed to the URL filters on submit (handler defined below, once
  // applyFilters exists).
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.q);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(filters.q);
  }, [filters.q]);

  // ----- raw data + ordered/flattened list ------------------------------
  const [live, setLive] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { live: liveEv, upcoming: upEv, past: pastEv } = await listAllEvents({
          language,
          provinceId: filters.provinceId,
          districtId: filters.districtId
        });
        if (cancelled) return;
        setLive(liveEv);
        setUpcoming(upEv);
        setPast(pastEv);
      } catch {
        if (cancelled) return;
        setLive([]); setUpcoming([]); setPast([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language, filters.provinceId, filters.districtId]);

  const applyFilters = useCallback(
    (next) => {
      setFilters(next);
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (next.status && next.status !== "all") params.set("show", next.status);
      else params.delete("show");
      if (next.category) params.set("category", next.category);
      else params.delete("category");
      if (next.provinceId) params.set("province", next.provinceId);
      else params.delete("province");
      if (next.districtId) params.set("district", next.districtId);
      else params.delete("district");
      if (next.sort && next.sort !== "participantCount") params.set("sort", next.sort);
      else params.delete("sort");
      if (next.q) params.set("q", next.q);
      else params.delete("q");
      const query = params.toString();
      router.replace(query ? `/events?${query}` : "/events", { scroll: false });
    },
    [router, searchParams]
  );

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      applyFilters({ ...filters, q: searchInput.trim() });
    },
    [applyFilters, filters, searchInput]
  );

  // ----- geolocation (for sort=nearest) ----------------------------------
  // Uses the shared useGeolocation hook + haversineKm helper so this
  // surface and the homepage for-you grid stay aligned on permission UX.
  // `nearMe` is just an alias for the hook's position; geoBusy / geoError
  // remain as local state-derived names so the rest of the file reads
  // unchanged from its prior shape.
  const {
    position: nearMe,
    busy: geoBusy,
    error: geoErrorCode,
    request: requestNearMe
  } = useGeolocation();

  const geoError = useMemo(() => {
    if (!geoErrorCode) return "";
    if (geoErrorCode === "unsupported") return t.filters.sortLocationUnsupported;
    return t.filters.sortLocationDenied;
  }, [geoErrorCode, t.filters.sortLocationDenied, t.filters.sortLocationUnsupported]);

  useEffect(() => {
    if (filters.sort === "nearest" && !nearMe && !geoBusy && !geoError) {
      requestNearMe();
    }
  }, [filters.sort, nearMe, geoBusy, geoError, requestNearMe]);

  const setFilter = useCallback(
    (key, value) => {
      if (key === "sort" && value === "nearest") {
        applyFilters({ ...filters, sort: "nearest" });
        if (!nearMe) requestNearMe();
        return;
      }
      applyFilters({ ...filters, [key]: value });
    },
    [filters, applyFilters, nearMe, requestNearMe]
  );

  // Province/district filter handler — feeds ProvinceDistrictFilter onChange.
  const handleGeographyChange = useCallback(
    ({ provinceId, districtId }) => {
      applyFilters({
        ...filters,
        provinceId: provinceId || undefined,
        districtId: districtId || undefined
      });
    },
    [filters, applyFilters]
  );

  const orderedEvents = useMemo(() => {
    // Secondary sort applied within each status group (live > upcoming >
    // past). Primary status grouping stays so the page's coarse timeline
    // structure remains predictable when users only narrow by category /
    // district. `nearest` falls back to the default scheduled-asc order
    // until a geolocation fix lands.
    const sortFn = (eA, eB) => {
      if (filters.sort === "participantCount") {
        return (eB.participantCount || 0) - (eA.participantCount || 0);
      }
      if (filters.sort === "createdAt") {
        return Date.parse(eB.scheduledAt || 0) - Date.parse(eA.scheduledAt || 0);
      }
      if (filters.sort === "nearest" && nearMe) {
        const aLat = Number(eA.latitude);
        const aLng = Number(eA.longitude);
        const bLat = Number(eB.latitude);
        const bLng = Number(eB.longitude);
        const aOk = Number.isFinite(aLat) && Number.isFinite(aLng);
        const bOk = Number.isFinite(bLat) && Number.isFinite(bLng);
        if (!aOk && !bOk) return 0;
        if (!aOk) return 1;
        if (!bOk) return -1;
        return (
          haversineKm(nearMe.lat, nearMe.lng, aLat, aLng) -
          haversineKm(nearMe.lat, nearMe.lng, bLat, bLng)
        );
      }
      return 0;
    };

    const liveSorted =
      filters.sort === "participantCount" || filters.sort === "createdAt" || (filters.sort === "nearest" && nearMe)
        ? [...live].sort(sortFn)
        : live;
    const upcomingSorted =
      filters.sort === "participantCount" || (filters.sort === "nearest" && nearMe)
        ? [...upcoming].sort(sortFn)
        : [...upcoming].sort(byScheduledAsc);
    const pastSorted =
      filters.sort === "participantCount" || (filters.sort === "nearest" && nearMe)
        ? [...past].sort(sortFn)
        : [...past].sort(byCompletedDesc);

    const items = [
      ...liveSorted.map((event) => ({ event, status: "live" })),
      ...upcomingSorted.map((event) => ({ event, status: "upcoming" })),
      ...pastSorted.map((event) => ({ event, status: "past" }))
    ];
    let filtered =
      filters.status === "all"
        ? items
        : items.filter((entry) => entry.status === filters.status);
    // Province/district filtering is server-side via listAllEvents params.
    // Client-side: category + text search only.
    if (filters.category) {
      filtered = filtered.filter(
        (entry) => entry.event.category === filters.category
      );
    }
    if (filters.q) {
      // Substring match on title + addressText. Case-insensitive,
      // Devanagari-safe because we compare against the original strings
      // rather than ASCII-folded ones (matches what users type into the
      // homepage search box).
      const needle = filters.q.toLowerCase();
      filtered = filtered.filter((entry) => {
        const title = (entry.event.title || "").toLowerCase();
        const addr = (entry.event.addressText || "").toLowerCase();
        return title.includes(needle) || addr.includes(needle);
      });
    }
    return filtered;
  }, [live, upcoming, past, filters, nearMe]);

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

  // Reset window when filters change.
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [filters]);

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

  // ----- filter options ----------------------------------------------------
  const statusOptions = [
    { value: "live", label: t.filters.live },
    { value: "upcoming", label: t.filters.upcoming },
    { value: "past", label: t.filters.past }
  ];
  const categoryOptions = ISSUE_CATEGORIES.map((value) => ({
    value,
    label: t.categoryLabels?.[value] || value
  }));
  const sortOptions = SORT_OPTIONS.map((option) => ({
    value: option.value,
    label: t.filters[option.labelKey]
  }));

  const localizedCopy = copy[language] || copy.np;
  const reportIssueCtaLabel =
    localizedCopy?.issueNew?.cta?.list ?? "Report New Issue";

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
      <section className="page-section public-issues-section">
        <div className="section-heading">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>

        {filters.q ? (
          <div className="public-issues-search-chip" role="status">
            <SearchOutlined aria-hidden="true" />
            <span className="public-issues-search-chip-label">
              {t.filters.searchingPrefix}
            </span>
            <strong>{filters.q}</strong>
            <button
              type="button"
              className="public-issues-search-chip-clear"
              aria-label={t.filters.clearSearch}
              title={t.filters.clearSearch}
              onClick={() => applyFilters({ ...filters, q: "" })}
            >
              <CloseOutlined aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div className="public-issues-toolbar">
          <ActivityStatsRow language={language} interactive currentPage="events" />
          <div className="public-issues-search-row">
            <PublicSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={handleSearchSubmit}
              onToggleFilters={() => setFiltersOpen((open) => !open)}
              filtersOpen={filtersOpen}
              labels={homeSearch}
            />
            <Link className="public-issues-filters-cta" href="/issues/new">
              <Button type="primary" icon={<PlusOutlined />} size="large">
                {reportIssueCtaLabel}
              </Button>
            </Link>
          </div>
          {filtersOpen ? (
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
                onChange={(value) => setFilter("status", value || "all")}
                options={statusOptions}
                placeholder={t.filters.statusPlaceholder}
                value={filters.status === "all" ? undefined : filters.status}
              />
            </div>
            <div className="public-issues-filter-field">
              <label
                className="public-issues-filter-label"
                htmlFor="events-filter-category"
              >
                {t.filters.categoryLabel}
              </label>
              <Select
                id="events-filter-category"
                allowClear
                onChange={(value) => setFilter("category", value)}
                options={categoryOptions}
                placeholder={t.filters.categoryPlaceholder}
                value={filters.category}
              />
            </div>
            <ProvinceDistrictFilter
              provinceId={filters.provinceId || null}
              districtId={filters.districtId || null}
              onChange={handleGeographyChange}
              language={language}
            />
            <div className="public-issues-filter-field public-issues-sort-field">
              <label
                className="public-issues-filter-label"
                htmlFor="events-filter-sort"
              >
                {t.filters.sortLabel}
              </label>
              <Select
                id="events-filter-sort"
                onChange={(value) => setFilter("sort", value)}
                options={sortOptions}
                value={filters.sort}
                loading={geoBusy}
              />
              {filters.sort === "nearest" && (geoBusy || geoError) ? (
                <span
                  className={`public-issues-sort-hint${geoError ? " is-error" : ""}`}
                  role={geoError ? "alert" : "status"}
                >
                  {geoBusy ? t.filters.sortLocating : geoError}
                </span>
              ) : null}
            </div>
          </div>
          ) : null}
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
      </section>
    </SiteShell>
  );
}
