"use client";

// Unified campaign surface. One list, one status filter spanning the whole
// lifecycle: खुला (OPEN issue) → तयारीमा (DRAFT) → मिति तय (SCHEDULED) →
// चलिरहेको (ACTIVE) → सम्पन्न (COMPLETED). The status the user picks decides which
// backend source is read (see useCampaignFeed); the list/preview dispatch by
// item `kind` to the existing issue/event cards so nothing is re-implemented.
//
// The status filter lives in TWO synced surfaces over one `filters.status`
// state: a Segmented chip row (always visible) and a Select inside the
// collapsible filter panel. "all" is the default and groups every stage under
// inline dividers in lifecycle order.

import { CloseOutlined, LoadingOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Empty, Pagination, Segmented, Select, Skeleton } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProvinceDistrictFilter } from "@/components/ProvinceDistrictFilter";
import { PublicSearchBar } from "@/components/PublicSearchBar";
import { SiteShell } from "@/components/SiteShell";
import { EventListCard } from "@/components/EventListCard";
import { EventPreviewPane } from "@/components/EventPreviewPane";
import { IssueListCard } from "@/components/IssueListCard";
import { IssuePreviewPane } from "@/components/IssuePreviewPane";
import { CampaignsMap } from "@/components/CampaignsMap";
import { CampaignCard } from "@/components/CampaignCard";
import { PAGE_COPY as EVENTS_COPY } from "@/app/events/EventsListClient";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { ISSUE_CATEGORIES, localizeIssue } from "@/lib/adminUtils";
import { useCampaignFeed } from "@/lib/useCampaignFeed";
import { useCampaignCounts } from "@/lib/useCampaignCounts";
import {
  CAMPAIGN_FILTER_VALUES,
  CAMPAIGN_STATUS_SEQUENCE,
  campaignStatusLabel,
  campaignVisualStatus
} from "@/lib/campaignStatus";

const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 6;
const THUMBNAILS_PAGE_SIZE = 12;
const CATEGORY_VALUES = new Set(ISSUE_CATEGORIES);

// ----- session-scoped list memory --------------------------------------
// The list lives on /campaigns; a card opens a full detail route
// (/events/:id, /issues/:id), which unmounts this whole tree. Without help,
// returning — via the browser back button, the detail page's "back to
// campaigns" link, or simply revisiting from elsewhere — drops everything:
// the active tab, how far the user had scrolled (visibleCount), the open
// item, and the scroll offset. We snapshot all of that into sessionStorage so
// any return rebuilds the exact list the user left. It is intentionally
// session-scoped (clears with the tab) and per-browser, not shared.
const LIST_STATE_KEY = "shramdan:campaigns:list-state";
// Params that mean "the URL deliberately asks for a specific list" — when any
// is present (deep link, shared link, browser back) the URL wins over memory.
const CAMPAIGN_URL_PARAMS = [
  "status",
  "category",
  "province",
  "district",
  "q",
  "view",
  "page"
];

function readListState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LIST_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeListState(patch) {
  if (typeof window === "undefined") return;
  try {
    const prev = readListState() || {};
    window.sessionStorage.setItem(
      LIST_STATE_KEY,
      JSON.stringify({ ...prev, ...patch })
    );
  } catch {
    /* storage full or unavailable — memory is a best-effort nicety */
  }
}

// Two snapshots describe "the same list" only when every dimension that
// changes which items render matches — otherwise a restored visibleCount /
// selectedId / scroll would point into a different feed.
function sameListIdentity(snap, filters, view) {
  if (!snap) return false;
  return (
    (snap.status ?? "all") === filters.status &&
    (snap.category ?? undefined) === (filters.category ?? undefined) &&
    (snap.provinceId ?? undefined) === (filters.provinceId ?? undefined) &&
    (snap.districtId ?? undefined) === (filters.districtId ?? undefined) &&
    (snap.q ?? "") === (filters.q ?? "") &&
    (snap.view ?? "list") === view
  );
}

function hasExplicitCampaignParams(searchParams) {
  return CAMPAIGN_URL_PARAMS.some((key) => Boolean(searchParams?.get(key)));
}

const PAGE_COPY = {
  np: {
    pageTitle: "अभियानहरू",
    eyebrow: "अभियानहरू",
    title: "श्रमदान अभियानहरू",
    intro:
      "समस्या उठेदेखि सम्पन्न अभियानसम्म — सबै एकै ठाउँमा। तलको स्थिति फिल्टरले खुला, तयारीमा, मिति तय, चलिरहेको र सम्पन्न — जुनसुकै चरण छान्न मिल्छ।",
    statusFilterAria: "स्थिति फिल्टर",
    viewToggleAria: "दृश्य रोज्नुहोस्",
    viewList: "सूची",
    viewThumbnails: "ग्रिड",
    viewMap: "नक्सा",
    listAriaLabel: "अभियानहरूको सूची",
    gridAriaLabel: "अभियानहरूको ग्रिड",
    loadingMore: "थप ल्याउँदै…",
    noMore: "सबै देखाइए।"
  },
  en: {
    pageTitle: "Campaigns",
    eyebrow: "Campaigns",
    title: "Shramdan Campaigns",
    intro:
      "From a reported problem to a finished cleanup — all in one place. The status filter below switches between Open, Planning, Scheduled, Ongoing and Complete.",
    statusFilterAria: "Status filter",
    viewToggleAria: "Choose view",
    viewList: "List",
    viewThumbnails: "Grid",
    viewMap: "Map",
    listAriaLabel: "List of campaigns",
    gridAriaLabel: "Grid of campaigns",
    loadingMore: "Loading more…",
    noMore: "All shown."
  }
};

// A readable title + address for client-side text search, per item kind.
function itemSearchText(entry, language) {
  if (entry.kind === "issue") {
    const localized = localizeIssue(entry.data, language);
    return {
      title: (localized.title || "").toLowerCase(),
      addr: (entry.data.addressText || "").toLowerCase(),
      desc: (localized.description || "").toLowerCase()
    };
  }
  return {
    title: (entry.data.title || "").toLowerCase(),
    addr: (entry.data.addressText || "").toLowerCase(),
    desc: ""
  };
}

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// A status chip's content: the stage label + a count badge. While the stage is
// (re)fetching, the number is swapped for a spinner — so a click reads as
// "loading below" even when the page chrome around it doesn't move.
function StatusChip({ text, count, loading, language, status }) {
  return (
    <span className="campaign-chip" data-status={status || undefined}>
      <span className="campaign-chip-text">{text}</span>
      <span className="campaign-chip-count">
        {loading ? (
          <LoadingOutlined className="campaign-chip-spin" aria-label="loading" />
        ) : (
          localizeDigits(Number.isFinite(count) ? count : 0, language)
        )}
      </span>
    </span>
  );
}

export default function CampaignsListPageContent() {
  const { language } = usePreferences();
  const t = PAGE_COPY[language] || PAGE_COPY.np;
  const issuesCopy = (copy[language] || copy.np).issues;
  const eventsCopy = EVENTS_COPY[language] || EVENTS_COPY.np;
  const homeSearch = (copy[language] || copy.np).homeSearch || {};

  const router = useRouter();
  const searchParams = useSearchParams();

  // Snapshot of the last list state, captured ONCE at first client render —
  // before any persistence effect below can overwrite it — so restoration is
  // immune to the mount-time writes those effects make.
  const [listMemory] = useState(() =>
    typeof window !== "undefined" ? readListState() : null
  );

  // ----- filter state (status / category / province / district / q) -------
  const readFiltersFromUrl = useCallback(() => {
    const statusParam = searchParams?.get("status");
    const categoryParam = searchParams?.get("category");
    const provinceParam = searchParams?.get("province");
    const districtParam = searchParams?.get("district");
    const qParam = searchParams?.get("q");
    return {
      status:
        statusParam && CAMPAIGN_FILTER_VALUES.has(statusParam)
          ? statusParam
          : "all",
      category:
        categoryParam && CATEGORY_VALUES.has(categoryParam)
          ? categoryParam
          : undefined,
      provinceId: provinceParam || undefined,
      districtId: districtParam || undefined,
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
      prev.q === next.q
        ? prev
        : next
    );
  }, [readFiltersFromUrl]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.q);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(filters.q);
  }, [filters.q]);

  // ----- list / thumbnails / map view toggle (URL-synced via ?view=) ------
  // `view` is not a filter — it rides on its own ?view= param so a filtered
  // map/grid is shareable, and filter/selection URL writes preserve it
  // untouched. Values: "list" (default) | "thumbnails" | "map".
  const readView = useCallback(() => {
    const v = searchParams?.get("view");
    return v === "map" || v === "thumbnails" ? v : "list";
  }, [searchParams]);
  const [view, setView] = useState(readView);
  useEffect(() => {
    const next = readView();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView((prev) => (prev === next ? prev : next));
  }, [readView]);
  const handleViewChange = useCallback(
    (nextView) => {
      setView(nextView);
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (nextView === "map" || nextView === "thumbnails") {
        params.set("view", nextView);
      } else {
        params.delete("view");
      }
      // Switching views drops any thumbnail page index — it is meaningless
      // outside the grid.
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `/campaigns?${query}` : "/campaigns", {
        scroll: false
      });
    },
    [router, searchParams]
  );

  // ----- thumbnails pagination (URL-synced via ?page=) -------------------
  const [page, setPage] = useState(() => {
    const p = Number(searchParams?.get("page"));
    return Number.isFinite(p) && p >= 1 ? Math.floor(p) : 1;
  });
  useEffect(() => {
    const p = Number(searchParams?.get("page"));
    const next = Number.isFinite(p) && p >= 1 ? Math.floor(p) : 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage((prev) => (prev === next ? prev : next));
  }, [searchParams]);
  const handlePageChange = useCallback(
    (nextPage) => {
      setPage(nextPage);
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (nextPage > 1) params.set("page", String(nextPage));
      else params.delete("page");
      const query = params.toString();
      router.replace(query ? `/campaigns?${query}` : "/campaigns", {
        scroll: false
      });
    },
    [router, searchParams]
  );

  const applyFilters = useCallback(
    (next) => {
      setFilters(next);
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (next.status && next.status !== "all") params.set("status", next.status);
      else params.delete("status");
      if (next.category) params.set("category", next.category);
      else params.delete("category");
      if (next.provinceId) params.set("province", next.provinceId);
      else params.delete("province");
      if (next.districtId) params.set("district", next.districtId);
      else params.delete("district");
      if (next.q) params.set("q", next.q);
      else params.delete("q");
      const query = params.toString();
      router.replace(query ? `/campaigns?${query}` : "/campaigns", {
        scroll: false
      });
    },
    [router, searchParams]
  );

  const setFilter = useCallback(
    (key, value) => applyFilters({ ...filters, [key]: value }),
    [filters, applyFilters]
  );

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      applyFilters({ ...filters, q: searchInput.trim() });
    },
    [applyFilters, filters, searchInput]
  );

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

  // ----- restore the tab/view/page from memory ---------------------------
  // Runs once. If the URL names a specific list (deep link, shared link, or a
  // browser-back restore that already carries ?status=…), the URL is
  // authoritative and we leave it alone. If we arrived "bare" — a top-nav
  // visit, or the detail page's plain `/campaigns` back link — we replay the
  // remembered tab into the URL, which the sync effects above pick up.
  const didRestoreFiltersRef = useRef(false);
  useEffect(() => {
    if (didRestoreFiltersRef.current) return;
    didRestoreFiltersRef.current = true;
    if (hasExplicitCampaignParams(searchParams)) return;
    const snap = listMemory;
    if (!snap) return;
    const params = new URLSearchParams();
    if (snap.status && snap.status !== "all") params.set("status", snap.status);
    if (snap.category) params.set("category", snap.category);
    if (snap.provinceId) params.set("province", snap.provinceId);
    if (snap.districtId) params.set("district", snap.districtId);
    if (snap.q) params.set("q", snap.q);
    if (snap.view === "map" || snap.view === "thumbnails") {
      params.set("view", snap.view);
    }
    if (snap.page && snap.page > 1) params.set("page", String(snap.page));
    const query = params.toString();
    if (query) router.replace(`/campaigns?${query}`, { scroll: false });
  }, [searchParams, router, listMemory]);

  // ----- data ------------------------------------------------------------
  const { items, loading, error } = useCampaignFeed({
    status: filters.status,
    language,
    provinceId: filters.provinceId,
    districtId: filters.districtId
  });

  // Per-stage counts for the chip badges — always all five, independent of the
  // active filter (so every badge can show a number, not just the selected one).
  const { counts, total, loading: countsLoading } = useCampaignCounts({
    provinceId: filters.provinceId,
    districtId: filters.districtId
  });

  // Client-side category + text narrowing over the merged feed (the feed is
  // already in lifecycle order).
  const filteredItems = useMemo(() => {
    let list = items;
    if (filters.category) {
      list = list.filter((entry) => entry.data.category === filters.category);
    }
    const needle = filters.q?.trim().toLowerCase();
    if (needle) {
      list = list.filter((entry) => {
        const { title, addr, desc } = itemSearchText(entry, language);
        return (
          title.includes(needle) ||
          addr.includes(needle) ||
          desc.includes(needle)
        );
      });
    }
    return list;
  }, [items, filters.category, filters.q, language]);

  // ----- visible window (load-more) --------------------------------------
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [filters]);

  // ----- thumbnails page window ------------------------------------------
  const pageCount = Math.max(1, Math.ceil(filteredItems.length / THUMBNAILS_PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedItems = useMemo(
    () =>
      filteredItems.slice(
        (safePage - 1) * THUMBNAILS_PAGE_SIZE,
        safePage * THUMBNAILS_PAGE_SIZE
      ),
    [filteredItems, safePage]
  );

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount]
  );
  const hasMore = visibleCount < filteredItems.length;

  const sentinelRef = useRef(null);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((v) => Math.min(v + LOAD_MORE_STEP, filteredItems.length));
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, filteredItems.length]);

  // ----- selection + window/scroll restore (in-memory only) --------------
  // `selectedId` lives only in memory, never the URL. On the FIRST settled
  // load we restore — but only when memory describes this exact list — the
  // remembered open item, how far the list had been scrolled (visibleCount),
  // and the scroll offset; otherwise we fall back to selecting the first item.
  // Gating on `!loading` means the restore measures against real items, not an
  // empty first frame.
  const [selectedId, setSelectedId] = useState(null);
  const selectedCardRef = useRef(null);
  const didInitialResolveRef = useRef(false);

  useEffect(() => {
    if (didInitialResolveRef.current) return;
    if (loading) return;
    if (filteredItems.length === 0) return;
    didInitialResolveRef.current = true;

    const restorable = sameListIdentity(listMemory, filters, view);

    let nextSelected = filteredItems[0]?.id ?? null;
    if (
      restorable &&
      listMemory.selectedId &&
      filteredItems.some((e) => e.id === listMemory.selectedId)
    ) {
      nextSelected = listMemory.selectedId;
    }
    setSelectedId(nextSelected);

    if (restorable && listMemory.visibleCount > INITIAL_VISIBLE) {
      setVisibleCount(Math.min(listMemory.visibleCount, filteredItems.length));
    }

    if (restorable && listMemory.scrollY > 0) {
      const y = listMemory.scrollY;
      // The restored visibleCount paints over several frames (and rows can keep
      // growing the page). Jumping too early lands short, clamped to whatever
      // height exists at that instant. So wait — frame by frame, up to a small
      // cap — until the document is actually tall enough to reach the saved
      // offset, then jump exactly once.
      let attempts = 0;
      const restoreScroll = () => {
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll >= y || attempts >= 30) {
          window.scrollTo(0, y);
          return;
        }
        attempts += 1;
        requestAnimationFrame(restoreScroll);
      };
      requestAnimationFrame(restoreScroll);
    }
  }, [loading, filteredItems, filters, view, listMemory]);

  useEffect(() => {
    if (!didInitialResolveRef.current) return;
    if (selectedId === null) return;
    if (filteredItems.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!filteredItems.some((e) => e.id === selectedId)) {
      setSelectedId(filteredItems[0]?.id ?? null);
    }
  }, [filteredItems, selectedId]);

  // ----- mobile drill-in -------------------------------------------------
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

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile) setMobileView("detail");
  }, []);

  const handleBack = useCallback(() => setMobileView("list"), []);

  // ----- persist list state to session memory ----------------------------
  // Each dimension is mirrored into sessionStorage as it settles, so whatever
  // the user last saw is what a return (back button, detail "back" link, or a
  // fresh visit) rebuilds. The capture in `listMemory` above froze the
  // restore-time values before these mount-time writes run, so they cannot
  // race the restore.
  useEffect(() => {
    writeListState({
      status: filters.status,
      category: filters.category,
      provinceId: filters.provinceId,
      districtId: filters.districtId,
      q: filters.q,
      view,
      page
    });
  }, [filters, view, page]);

  useEffect(() => {
    writeListState({ visibleCount });
  }, [visibleCount]);

  useEffect(() => {
    if (selectedId) writeListState({ selectedId });
  }, [selectedId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        writeListState({ scrollY: window.scrollY });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // ----- keyboard nav ----------------------------------------------------
  const listRef = useRef(null);
  const handleListKeyDown = (e) => {
    const total = visibleItems.length;
    if (total === 0) return;
    const currentIndex = visibleItems.findIndex((x) => x.id === selectedId);
    let nextIndex = currentIndex;
    if (e.key === "ArrowDown") nextIndex = Math.min(total - 1, currentIndex + 1);
    else if (e.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = total - 1;
    else return;
    if (nextIndex !== currentIndex) {
      e.preventDefault();
      const nextId = visibleItems[nextIndex]?.id;
      if (nextId) handleSelect(nextId);
    }
  };

  // ----- filter options --------------------------------------------------
  // Chip row: rich labels with a count badge / loader. The badge for a stage
  // spins while counts are still loading, or while THAT stage is the active
  // selection and its feed is fetching (the click-feedback case).
  const chipOptions = useMemo(() => {
    const make = (value, count) => ({
      value,
      label: (
        <StatusChip
          text={campaignStatusLabel(value, language)}
          count={count}
          loading={countsLoading || (filters.status === value && loading)}
          language={language}
          status={value === "all" ? null : campaignVisualStatus(value)}
        />
      )
    });
    return [
      make("all", total),
      ...CAMPAIGN_STATUS_SEQUENCE.map((value) => make(value, counts[value]))
    ];
  }, [language, counts, total, countsLoading, loading, filters.status]);

  // Dropdown mirror: plain text labels (the badge/loader belong on the chips).
  const dropdownOptions = useMemo(
    () => [
      { value: "all", label: campaignStatusLabel("all", language) },
      ...CAMPAIGN_STATUS_SEQUENCE.map((value) => ({
        value,
        label: (
          <span className="campaign-filter-opt" data-status={campaignVisualStatus(value)}>
            <span className="campaign-filter-dot" aria-hidden="true" />
            {campaignStatusLabel(value, language)}
          </span>
        )
      }))
    ],
    [language]
  );
  const categoryOptions = ISSUE_CATEGORIES.map((value) => ({
    value,
    label: issuesCopy.categoryLabels?.[value] || value
  }));
  const reportIssueCtaLabel =
    (copy[language] || copy.np)?.issueNew?.cta?.list ?? "Report New Issue";

  // ----- render the list with inline status dividers (only for "all") ----
  const showDividers = filters.status === "all";
  const renderedItems = [];
  let lastStatus = null;
  visibleItems.forEach((entry) => {
    if (showDividers && entry.status !== lastStatus) {
      renderedItems.push(
        <li
          key={`divider-${entry.status}`}
          role="separator"
          className="events-split-divider"
        >
          {campaignStatusLabel(entry.status, language)}
        </li>
      );
      lastStatus = entry.status;
    }
    const isSelected = entry.id === selectedId;
    if (entry.kind === "issue") {
      renderedItems.push(
        <IssueListCard
          key={entry.id}
          issue={entry.data}
          selected={isSelected}
          language={language}
          content={issuesCopy}
          onSelect={handleSelect}
          optionId={`campaign-option-${entry.id}`}
          ref={isSelected ? selectedCardRef : null}
        />
      );
    } else {
      renderedItems.push(
        <EventListCard
          key={entry.id}
          event={entry.data}
          status={campaignVisualStatus(entry.status)}
          statusLabel={campaignStatusLabel(entry.status, language)}
          selected={isSelected}
          language={language}
          t={eventsCopy}
          onSelect={handleSelect}
          optionId={`campaign-option-${entry.id}`}
          ref={isSelected ? selectedCardRef : null}
        />
      );
    }
  });

  const selectedEntry = filteredItems.find((e) => e.id === selectedId) || null;
  const isMobileDrillActive = mobileView === "detail";
  const isInitialLoad = loading && items.length === 0;
  const showEmpty = !loading && !error && filteredItems.length === 0;
  const showError = !loading && Boolean(error) && filteredItems.length === 0;

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
              {homeSearch.searchingPrefix}
            </span>
            <strong>{filters.q}</strong>
            <button
              type="button"
              className="public-issues-search-chip-clear"
              aria-label={homeSearch.clearSearch}
              title={homeSearch.clearSearch}
              onClick={() => applyFilters({ ...filters, q: "" })}
            >
              <CloseOutlined aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div className="public-issues-toolbar">
          {/* Status filter (chip row, always visible) + list/map view toggle. */}
          <div className="campaigns-toolbar-top">
            <div
              className="campaigns-status-chips"
              role="group"
              aria-label={t.statusFilterAria}
            >
              <Segmented
                options={chipOptions}
                value={filters.status}
                onChange={(value) => setFilter("status", value)}
              />
            </div>
            <div
              className="campaigns-view-toggle"
              role="group"
              aria-label={t.viewToggleAria}
            >
              <Segmented
                options={[
                  { value: "list", label: t.viewList },
                  { value: "thumbnails", label: t.viewThumbnails },
                  { value: "map", label: t.viewMap }
                ]}
                value={view}
                onChange={handleViewChange}
              />
            </div>
          </div>

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
              {/* Same status filter, mirrored in the detailed panel. */}
              <div className="public-issues-filter-field">
                <label
                  className="public-issues-filter-label"
                  htmlFor="campaigns-filter-status"
                >
                  {issuesCopy.filters.statusLabel}
                </label>
                <Select
                  id="campaigns-filter-status"
                  onChange={(value) => setFilter("status", value || "all")}
                  options={dropdownOptions}
                  value={filters.status}
                />
              </div>
              <div className="public-issues-filter-field">
                <label
                  className="public-issues-filter-label"
                  htmlFor="campaigns-filter-category"
                >
                  {issuesCopy.filters.categoryLabel}
                </label>
                <Select
                  id="campaigns-filter-category"
                  allowClear
                  onChange={(value) => setFilter("category", value)}
                  options={categoryOptions}
                  placeholder={issuesCopy.filters.categoryPlaceholder}
                  value={filters.category}
                />
              </div>
              <ProvinceDistrictFilter
                provinceId={filters.provinceId || null}
                districtId={filters.districtId || null}
                onChange={handleGeographyChange}
                language={language}
              />
            </div>
          ) : null}
        </div>

        {showError ? (
          <div className="public-issues-error" role="alert">
            <h2>{issuesCopy.states.errorTitle}</h2>
            <p>{issuesCopy.states.errorBody}</p>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setFilter("status", filters.status)}
              type="primary"
            >
              {issuesCopy.states.retry}
            </Button>
          </div>
        ) : null}

        {showEmpty ? (
          <Empty
            className="public-issues-empty"
            description={
              <>
                <strong>{issuesCopy.states.emptyTitle}</strong>
                <p>{issuesCopy.states.emptyBody}</p>
              </>
            }
          />
        ) : null}

        {isInitialLoad ? (
          <section
            className="events-split"
            aria-busy="true"
            aria-label={issuesCopy.states.loading}
          >
            <div className="events-split-list">
              <ul className="events-split-list-inner">
                {Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="event-list-card" aria-hidden="true">
                    <div className="event-list-card-thumb">
                      <Skeleton.Image active style={{ width: "100%", height: "100%" }} />
                    </div>
                    <div className="event-list-card-body">
                      <Skeleton active paragraph={{ rows: 2 }} title={false} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <aside className="events-split-preview" aria-hidden="true">
              <Skeleton.Image active style={{ width: "100%", aspectRatio: "16 / 9" }} />
              <div className="event-preview-body">
                <Skeleton active paragraph={{ rows: 4 }} />
              </div>
            </aside>
          </section>
        ) : null}

        {!isInitialLoad && !showEmpty && !showError ? (
          view === "map" ? (
            <CampaignsMap
              items={filteredItems}
              language={language}
              content={issuesCopy}
              mapCopy={homeSearch.map}
              emptyLabel={homeSearch.mapEmpty}
            />
          ) : view === "thumbnails" ? (
            <section aria-label={t.gridAriaLabel}>
              <div className="campaign-card-grid">
                {pagedItems.map((entry) => (
                  <CampaignCard
                    key={entry.id}
                    campaign={{ kind: entry.kind, data: entry.data }}
                    language={language}
                  />
                ))}
              </div>
              {filteredItems.length > THUMBNAILS_PAGE_SIZE ? (
                <div className="campaign-card-grid-pagination">
                  <Pagination
                    current={safePage}
                    pageSize={THUMBNAILS_PAGE_SIZE}
                    total={filteredItems.length}
                    showSizeChanger={false}
                    onChange={handlePageChange}
                  />
                </div>
              ) : null}
            </section>
          ) : (
          <section
            className="events-split"
            data-mobile-view={mobileView}
            aria-label={t.listAriaLabel}
          >
            <div className="events-split-list">
              <ul
                ref={listRef}
                role="listbox"
                aria-label={t.listAriaLabel}
                aria-activedescendant={
                  selectedId ? `campaign-option-${selectedId}` : undefined
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
                    <LoadingOutlined className="events-split-loading-spinner" aria-hidden="true" spin />
                    <span>{t.loadingMore}</span>
                  </div>
                </>
              ) : filteredItems.length > INITIAL_VISIBLE ? (
                <div className="events-split-nomore">{t.noMore}</div>
              ) : null}
            </div>

            {selectedEntry?.kind === "issue" ? (
              <IssuePreviewPane
                issue={selectedEntry.data}
                language={language}
                content={issuesCopy}
                preview={issuesCopy.preview}
                onBack={handleBack}
                isMobileDrillActive={isMobileDrillActive}
              />
            ) : (
              <EventPreviewPane
                event={selectedEntry?.data || null}
                status={
                  selectedEntry ? campaignVisualStatus(selectedEntry.status) : "active"
                }
                language={language}
                t={eventsCopy}
                onBack={handleBack}
                isMobileDrillActive={isMobileDrillActive}
              />
            )}
          </section>
          )
        ) : null}
      </section>
    </SiteShell>
  );
}
