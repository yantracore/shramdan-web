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

import { AppstoreOutlined, CloseOutlined, EnvironmentOutlined, LoadingOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Button, Empty, Pagination, Segmented, Select, Skeleton } from "antd";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { categoryOptionLabel } from "@/lib/categoryIcons";
import { useCampaignFeed } from "@/lib/useCampaignFeed";
import { useCampaignCounts } from "@/lib/useCampaignCounts";
import { getProvinceById, getDistrictById } from "@/lib/geographyApi";
import {
  CAMPAIGN_STATUS_SEQUENCE,
  campaignSlugToStatus,
  campaignStatusLabel,
  campaignStatusPath,
  campaignVisualStatus
} from "@/lib/campaignStatus";

const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 6;
const THUMBNAILS_PAGE_SIZE = 12;
const CATEGORY_VALUES = new Set(ISSUE_CATEGORIES);

// Sort choices for the unified feed. Both `voteCount` and `createdAt` are
// accepted by GET /issues AND GET /events, so one choice orders every lifecycle
// bucket. The cleared (no-value) state keeps the lifecycle-smart default
// ordering (OPEN by votes, SCHEDULED soonest-first, COMPLETED latest-done).
const SORT_OPTIONS = [
  { value: "votes", sort: "voteCount", order: "desc", labelKey: "sortMostVotes" },
  { value: "newest", sort: "createdAt", order: "desc", labelKey: "sortNewest" }
];
const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));

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
// Secondary-filter query params that mean "the URL deliberately asks for a
// specific list" — when any is present (deep link, shared link, browser back)
// the URL wins over memory. The status now lives in the PATH, not here.
const CAMPAIGN_URL_PARAMS = [
  "category",
  "province",
  "district",
  "sort",
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
    (snap.sort ?? undefined) === (filters.sort ?? undefined) &&
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

// One removable pill in the active-filters strip: the human label for a live
// secondary filter (category / province / district / sort) plus an × that
// clears just that one. Styled on the existing search-chip look so the whole
// strip reads as a single family.
function FilterChip({ label, onRemove, removeLabel }) {
  return (
    <span className="public-issues-search-chip campaigns-filter-chip">
      <span className="campaigns-filter-chip-text">{label}</span>
      <button
        type="button"
        className="public-issues-search-chip-clear"
        aria-label={`${removeLabel}: ${label}`}
        title={removeLabel}
        onClick={onRemove}
      >
        <CloseOutlined aria-hidden="true" />
      </button>
    </span>
  );
}

export default function CampaignsListPageContent({ status: statusProp = "all" }) {
  const { language } = usePreferences();
  const t = PAGE_COPY[language] || PAGE_COPY.np;
  const issuesCopy = (copy[language] || copy.np).issues;
  const eventsCopy = EVENTS_COPY[language] || EVENTS_COPY.np;
  const homeSearch = (copy[language] || copy.np).homeSearch || {};

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The active stage is read from the PATH, reactively. A chip click updates the
  // URL with window.history (shallow) rather than a route navigation, so the
  // page never unmounts/remounts — the chrome above the list stays put instead
  // of blinking — while usePathname still flips this value and the feed
  // refetches. Falls back to the SSR-provided prop only if pathname is absent.
  const routeStatus = useMemo(() => {
    if (!pathname) return statusProp;
    const seg = pathname.split("/")[2];
    if (!seg) return "all";
    return campaignSlugToStatus(seg) || "all";
  }, [pathname, statusProp]);

  // Snapshot of the last list state, captured ONCE at first client render —
  // before any persistence effect below can overwrite it — so restoration is
  // immune to the mount-time writes those effects make.
  const [listMemory] = useState(() =>
    typeof window !== "undefined" ? readListState() : null
  );

  // When the bare index mounts only to bounce to a remembered stage path, it is
  // a throwaway mount — its mount-time persist writes would clobber the very
  // snapshot the destination is about to restore from. This latches true the
  // instant we decide to redirect, so the persist effects below stay quiet.
  const suppressPersistRef = useRef(false);

  // ----- filter state (status / category / province / district / q) -------
  // `status` is authoritative from the ROUTE (/campaigns = all,
  // /campaigns/<slug> = a stage); the secondary filters still ride the query
  // string so a filtered section stays shareable.
  const readFiltersFromUrl = useCallback(() => {
    const categoryParam = searchParams?.get("category");
    const provinceParam = searchParams?.get("province");
    const districtParam = searchParams?.get("district");
    const sortParam = searchParams?.get("sort");
    const qParam = searchParams?.get("q");
    return {
      status: routeStatus,
      category:
        categoryParam && CATEGORY_VALUES.has(categoryParam)
          ? categoryParam
          : undefined,
      provinceId: provinceParam || undefined,
      districtId: districtParam || undefined,
      sort: sortParam && SORT_VALUES.has(sortParam) ? sortParam : undefined,
      q: qParam ? qParam.trim() : ""
    };
  }, [searchParams, routeStatus]);

  const [filters, setFilters] = useState(() => readFiltersFromUrl());

  useEffect(() => {
    const next = readFiltersFromUrl();
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Human names for the active province/district chips. The list only carries
  // the IDs; these resolve to display names off the tab-cached geography lists
  // (no new network call). While a name is still resolving the chip falls back
  // to a generic "Province"/"District" label so it never flashes a raw UUID.
  const [regionNames, setRegionNames] = useState({ province: null, district: null });

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
  // The list path for the current section — `/campaigns` (all) or
  // `/campaigns/<slug>`. Every in-page URL write builds onto this base so the
  // active status section is preserved.
  const basePath = useMemo(() => campaignStatusPath(routeStatus), [routeStatus]);

  // All in-page URL writes go through window.history, NOT the Next router — a
  // router navigation would remount this page (SiteShell + chrome live inside
  // it) and blink. Next still mirrors history into usePathname/useSearchParams,
  // so every sync effect keeps working. Keeping status and the secondary
  // filters on the same mechanism also avoids a router/history desync (a stale
  // router URL turning a query tweak into a perceived path change → remount).
  const writeUrl = useCallback((url, push = false) => {
    if (typeof window === "undefined") return;
    if (push) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }, []);

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
      writeUrl(query ? `${basePath}?${query}` : basePath);
    },
    [writeUrl, searchParams, basePath]
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
      writeUrl(query ? `${basePath}?${query}` : basePath);
    },
    [writeUrl, searchParams, basePath]
  );

  // Secondary-filter change (category / province / district / q). Status is
  // unchanged here, so the path stays put and only the query string moves.
  const applyFilters = useCallback(
    (next) => {
      setFilters(next);
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("status"); // legacy param — never reintroduce it
      if (next.category) params.set("category", next.category);
      else params.delete("category");
      if (next.provinceId) params.set("province", next.provinceId);
      else params.delete("province");
      if (next.districtId) params.set("district", next.districtId);
      else params.delete("district");
      if (next.sort) params.set("sort", next.sort);
      else params.delete("sort");
      if (next.q) params.set("q", next.q);
      else params.delete("q");
      const query = params.toString();
      writeUrl(query ? `${basePath}?${query}` : basePath);
    },
    [writeUrl, searchParams, basePath]
  );

  // Status change = a section change = a PATH change, but performed SHALLOWLY
  // with window.history rather than the Next router. SiteShell (which holds the
  // page-transition wrapper + the whole chrome) is rendered INSIDE this page, so
  // a real route navigation would remount it and blink. A shallow URL update
  // keeps the page mounted; usePathname still flips `routeStatus` so the feed
  // refetches, and SiteShell's now-stable /campaigns key avoids re-keying.
  // pushState (not replace) so browser back/forward steps through the stages.
  const goToStatus = useCallback(
    (nextStatus) => {
      if (nextStatus === routeStatus) return;
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.provinceId) params.set("province", filters.provinceId);
      if (filters.districtId) params.set("district", filters.districtId);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.q) params.set("q", filters.q);
      const v = searchParams?.get("view");
      if (v === "map" || v === "thumbnails") params.set("view", v);
      const query = params.toString();
      const path = campaignStatusPath(nextStatus);
      writeUrl(query ? `${path}?${query}` : path, true);
    },
    [writeUrl, routeStatus, searchParams, filters]
  );

  const setFilter = useCallback(
    (key, value) => {
      if (key === "status") {
        goToStatus(value);
        return;
      }
      applyFilters({ ...filters, [key]: value });
    },
    [filters, applyFilters, goToStatus]
  );

  // The search box owns its live typing state and commits a debounced query
  // here (instant on clear / Enter). We only feed it the committed q.
  const handleSearch = useCallback(
    (q) => applyFilters({ ...filters, q }),
    [applyFilters, filters]
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

  // Reset the SECONDARY filters + search in one shot. Status is intentionally
  // left alone — it lives in the path and has its own always-visible chip row —
  // so this clears exactly the "old filters" a returning visitor gets stuck
  // with (category / province / district / sort / query) and nothing else.
  const clearAllFilters = useCallback(() => {
    applyFilters({
      ...filters,
      category: undefined,
      provinceId: undefined,
      districtId: undefined,
      sort: undefined,
      q: ""
    });
  }, [filters, applyFilters]);

  // ----- restore the tab/view/page from memory ---------------------------
  // Runs once. If the URL already names a specific list — a stage path
  // (/campaigns/<slug>) or any secondary filter in the query (a deep/shared
  // link, or a browser-back restore) — the URL is authoritative and we leave it
  // alone. Only the truly bare index (/campaigns, status "all", no query), i.e.
  // a top-nav visit or the detail page's plain `/campaigns` back link, replays
  // the remembered section + filters; the route/sync effects pick it up.
  const didRestoreFiltersRef = useRef(false);
  useEffect(() => {
    if (didRestoreFiltersRef.current) return;
    didRestoreFiltersRef.current = true;
    if (routeStatus !== "all") return;
    if (hasExplicitCampaignParams(searchParams)) return;
    const snap = listMemory;
    if (!snap) return;
    const params = new URLSearchParams();
    if (snap.category) params.set("category", snap.category);
    if (snap.provinceId) params.set("province", snap.provinceId);
    if (snap.districtId) params.set("district", snap.districtId);
    if (snap.sort) params.set("sort", snap.sort);
    if (snap.q) params.set("q", snap.q);
    if (snap.view === "map" || snap.view === "thumbnails") {
      params.set("view", snap.view);
    }
    if (snap.page && snap.page > 1) params.set("page", String(snap.page));
    const path = campaignStatusPath(snap.status || "all");
    const query = params.toString();
    // Nothing to restore if it resolves right back to the bare index.
    if (path !== "/campaigns" || query) {
      // This mount is about to be replaced — keep its persist effects from
      // overwriting the snapshot the destination mount will restore from.
      suppressPersistRef.current = true;
      router.replace(query ? `${path}?${query}` : path, { scroll: false });
    }
  }, [routeStatus, searchParams, router, listMemory]);

  // ----- data ------------------------------------------------------------
  // Resolve the picked sort choice into the API's { sort, order } pair. No
  // choice → both undefined → the feed keeps its lifecycle-smart default order.
  const sortChoice = SORT_OPTIONS.find((o) => o.value === filters.sort) || null;
  const { items, loading, error } = useCampaignFeed({
    status: filters.status,
    language,
    provinceId: filters.provinceId,
    districtId: filters.districtId,
    category: filters.category,
    q: filters.q,
    sort: sortChoice?.sort,
    order: sortChoice?.order
  });

  // Per-stage counts for the chip badges — always all five, independent of the
  // active status (so every badge shows a number). They honor the SAME
  // secondary filters as the feed (category + search), so a badge always
  // matches the size of the list clicking it would produce.
  const { counts, total, loading: countsLoading } = useCampaignCounts({
    provinceId: filters.provinceId,
    districtId: filters.districtId,
    category: filters.category,
    q: filters.q
  });

  // No client-side narrowing: category + text search are applied server-side by
  // useCampaignFeed (forwarded to /issues + /events). The feed already arrives
  // filtered and in lifecycle order, so the list and the chip counts agree.
  const filteredItems = items;

  // Resolve the active province/district IDs to display names for their chips.
  // Reads the cached geography lists; re-runs on ID or language change.
  useEffect(() => {
    let cancelled = false;
    const pid = filters.provinceId;
    const did = filters.districtId;
    if (!pid && !did) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegionNames({ province: null, district: null });
      return;
    }
    const pick = (rec) =>
      rec ? (language === "np" ? rec.localName || rec.name : rec.name || rec.localName) : null;
    Promise.all([
      pid ? getProvinceById(pid) : Promise.resolve(null),
      did ? getDistrictById(did) : Promise.resolve(null)
    ])
      .then(([prov, dist]) => {
        if (cancelled) return;
        setRegionNames({ province: pick(prov), district: pick(dist) });
      })
      .catch(() => {
        if (!cancelled) setRegionNames({ province: null, district: null });
      });
    return () => {
      cancelled = true;
    };
  }, [filters.provinceId, filters.districtId, language]);

  // ----- visible window (load-more) --------------------------------------
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (suppressPersistRef.current) return;
    writeListState({
      status: filters.status,
      category: filters.category,
      provinceId: filters.provinceId,
      districtId: filters.districtId,
      sort: filters.sort,
      q: filters.q,
      view,
      page
    });
  }, [filters, view, page]);

  useEffect(() => {
    if (suppressPersistRef.current) return;
    writeListState({ visibleCount });
  }, [visibleCount]);

  useEffect(() => {
    if (suppressPersistRef.current) return;
    if (selectedId) writeListState({ selectedId });
  }, [selectedId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const onScroll = () => {
      if (raf || suppressPersistRef.current) return;
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

  const categoryOptions = ISSUE_CATEGORIES.map((value) => ({
    value,
    label: categoryOptionLabel(value, issuesCopy.categoryLabels?.[value] || value)
  }));
  const sortOptions = SORT_OPTIONS.map((o) => ({
    value: o.value,
    label: issuesCopy.filters?.[o.labelKey] || o.value
  }));

  // ----- active-filter chips (secondary filters + search) ----------------
  // Status is deliberately excluded: it lives in the path, has its own chip
  // row, and the reset leaves it untouched.
  const activeCategoryLabel = filters.category
    ? issuesCopy.categoryLabels?.[filters.category] || filters.category
    : null;
  const activeSortLabel = filters.sort
    ? sortOptions.find((o) => o.value === filters.sort)?.label || filters.sort
    : null;
  const provinceFallback = language === "np" ? "प्रदेश" : "Province";
  const districtFallback = language === "np" ? "जिल्ला" : "District";
  const hasActiveFilters = Boolean(
    filters.q ||
      filters.category ||
      filters.provinceId ||
      filters.districtId ||
      filters.sort
  );

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
                  {
                    value: "list",
                    label: (
                      <span className="campaign-view-chip">
                        <UnorderedListOutlined aria-hidden="true" />
                        <span className="campaign-view-chip-text">
                          {t.viewList}
                        </span>
                      </span>
                    )
                  },
                  {
                    value: "thumbnails",
                    label: (
                      <span className="campaign-view-chip">
                        <AppstoreOutlined aria-hidden="true" />
                        <span className="campaign-view-chip-text">
                          {t.viewThumbnails}
                        </span>
                      </span>
                    )
                  },
                  {
                    value: "map",
                    label: (
                      <span className="campaign-view-chip">
                        <EnvironmentOutlined aria-hidden="true" />
                        <span className="campaign-view-chip-text">
                          {t.viewMap}
                        </span>
                      </span>
                    )
                  }
                ]}
                value={view}
                onChange={handleViewChange}
              />
            </div>
          </div>

          <div className="public-issues-search-row">
            <PublicSearchBar
              value={filters.q}
              onSearch={handleSearch}
              onToggleFilters={() => setFiltersOpen((open) => !open)}
              filtersOpen={filtersOpen}
              labels={homeSearch}
            />
            <Link className="public-issues-filters-cta" href="/issues/new">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                aria-label={reportIssueCtaLabel}
              >
                {reportIssueCtaLabel}
              </Button>
            </Link>
          </div>

          {filtersOpen ? (
            <div className="public-issues-filters">
              {/* Status lives in the chip row above; the panel keeps the
                  secondary filters (category / province / district) + sort. */}
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
              {/* Sort sits apart on the right (margin-left:auto); category /
                  province / district stay grouped on the left. */}
              <div className="public-issues-filter-field public-issues-sort-field">
                <label
                  className="public-issues-filter-label"
                  htmlFor="campaigns-filter-sort"
                >
                  {issuesCopy.filters.sortLabel}
                </label>
                <Select
                  id="campaigns-filter-sort"
                  allowClear
                  onChange={(value) => setFilter("sort", value)}
                  options={sortOptions}
                  placeholder={issuesCopy.filters.sortPlaceholder}
                  value={filters.sort}
                />
              </div>
            </div>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <div
            className="campaigns-active-filters"
            role="group"
            aria-label={homeSearch.activeFiltersLabel}
          >
            {filters.q ? (
              <span className="public-issues-search-chip campaigns-filter-chip" role="status">
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
              </span>
            ) : null}

            {filters.category ? (
              <FilterChip
                label={activeCategoryLabel}
                removeLabel={homeSearch.removeFilter}
                onRemove={() => applyFilters({ ...filters, category: undefined })}
              />
            ) : null}

            {filters.provinceId ? (
              <FilterChip
                label={regionNames.province || provinceFallback}
                removeLabel={homeSearch.removeFilter}
                onRemove={() =>
                  applyFilters({
                    ...filters,
                    provinceId: undefined,
                    districtId: undefined
                  })
                }
              />
            ) : null}

            {filters.districtId ? (
              <FilterChip
                label={regionNames.district || districtFallback}
                removeLabel={homeSearch.removeFilter}
                onRemove={() => applyFilters({ ...filters, districtId: undefined })}
              />
            ) : null}

            {filters.sort ? (
              <FilterChip
                label={activeSortLabel}
                removeLabel={homeSearch.removeFilter}
                onRemove={() => applyFilters({ ...filters, sort: undefined })}
              />
            ) : null}

            <button
              type="button"
              className="campaigns-active-filters-clear"
              onClick={clearAllFilters}
            >
              {homeSearch.clearAllFilters}
            </button>
          </div>
        ) : null}

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
