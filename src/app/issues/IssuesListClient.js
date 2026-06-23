"use client";

import {
  CloseOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { Button, Empty, Select, Skeleton } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import IssueMapBlock from "@/components/IssueMapBlock";
import { ActivityStatsRow } from "@/components/ActivityStatsRow";
import { IssueListCard } from "@/components/IssueListCard";
import { IssuePreviewPane } from "@/components/IssuePreviewPane";
import { ProvinceDistrictFilter } from "@/components/ProvinceDistrictFilter";
import { PublicSearchBar } from "@/components/PublicSearchBar";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { ISSUE_CATEGORIES, getListItems, localizeIssue } from "@/lib/adminUtils";

const PUBLIC_ISSUE_STATUSES = ["OPEN", "EVENT_SCHEDULED", "COMPLETED"];
// Server-supported sorts: voteCount, createdAt (no direction param).
// "nearest" is client-side over the current page using haversine + geolocation.
const SORT_OPTIONS = [
  { value: "voteCount", labelKey: "sortMostVotes", clientOnly: false },
  { value: "createdAt", labelKey: "sortNewest", clientOnly: false },
  { value: "nearest", labelKey: "sortNearest", clientOnly: true }
];
const SORT_VALUES = new Set(SORT_OPTIONS.map((o) => o.value));
const CLIENT_ONLY_SORTS = new Set(
  SORT_OPTIONS.filter((o) => o.clientOnly).map((o) => o.value)
);
const STATUS_VALUES = new Set(PUBLIC_ISSUE_STATUSES);
const PAGE_SIZE = 12;
const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 6;
const MAP_FETCH_LIMIT = 100;

function isPublicIssue(issue) {
  return PUBLIC_ISSUE_STATUSES.includes(issue?.status);
}

export default function IssuesListPageContent() {
  const { language } = usePreferences();
  const t = copy[language];
  const content = t.issues;
  const homeSearch = t.homeSearch || {};
  const liveIssuesCopy = t.liveIssues || {};
  const preview = content.preview || {};
  const splitCopy = content.split || {};

  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySet = useMemo(() => new Set(ISSUE_CATEGORIES), []);

  const readFiltersFromUrl = useCallback(() => {
    const statusParam = searchParams?.get("status");
    const categoryParam = searchParams?.get("category");
    const provinceParam = searchParams?.get("province");
    const districtParam = searchParams?.get("district");
    const sortParam = searchParams?.get("sort");
    const qParam = searchParams?.get("q");
    return {
      status: statusParam && STATUS_VALUES.has(statusParam) ? statusParam : undefined,
      category:
        categoryParam && categorySet.has(categoryParam) ? categoryParam : undefined,
      provinceId: provinceParam || undefined,
      districtId: districtParam || undefined,
      sort: sortParam && SORT_VALUES.has(sortParam) ? sortParam : "voteCount",
      q: qParam ? qParam.trim() : ""
    };
  }, [searchParams, categorySet]);

  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => readFiltersFromUrl());
  const [mapIssues, setMapIssues] = useState([]);
  const [nearMe, setNearMe] = useState(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  // Detailed filter panel is collapsed by default; the filter button in the
  // search bar toggles it open. Search text is kept in a local input buffer
  // and committed to the URL filters on submit.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(() => readFiltersFromUrl().q);

  // Re-sync state from URL on back/forward navigation.
  useEffect(() => {
    const next = readFiltersFromUrl();
    setFilters((prev) => {
      if (
        prev.status === next.status &&
        prev.category === next.category &&
        prev.provinceId === next.provinceId &&
        prev.districtId === next.districtId &&
        prev.sort === next.sort &&
        prev.q === next.q
      ) {
        return prev;
      }
      return next;
    });
  }, [readFiltersFromUrl]);

  // Keep the search input in sync when the query changes from the URL
  // (back/forward nav, or clearing the search chip).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput(filters.q);
  }, [filters.q]);

  const fetchPage = useCallback(
    async (cursor) => {
      const response = await getJson("/issues", {
        params: {
          status: filters.status,
          category: filters.category,
          // Province/district UUID filters — server-side from the new geography endpoints.
          provinceId: filters.provinceId,
          districtId: filters.districtId,
          // Server only knows voteCount and createdAt; client-only sorts
          // (e.g. "nearest") fall back to voteCount and re-sort locally.
          sort: CLIENT_ONLY_SORTS.has(filters.sort) ? undefined : filters.sort,
          limit: PAGE_SIZE,
          cursor
        }
      });
      const pageItems = getListItems(response).filter(isPublicIssue);
      const next = response?.data?.nextCursor || null;
      return { items: pageItems, nextCursor: next };
    },
    [filters]
  );

  // Initial fetch + refetch on filter change.
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    (async () => {
      try {
        const page = await fetchPage();
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setVisibleCount(INITIAL_VISIBLE);
      } catch (fetchError) {
        if (cancelled) return;
        setItems([]);
        setNextCursor(null);
        setError(fetchError?.message || content.states.errorBody);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, content.states.errorBody]);

  // Map data fetch (independent of pagination — wider window for overview).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getJson("/issues", {
          params: {
            status: filters.status,
            category: filters.category,
            provinceId: filters.provinceId,
            districtId: filters.districtId,
            limit: MAP_FETCH_LIMIT
          }
        });
        const pageItems = getListItems(response)
          .filter(isPublicIssue)
          .filter((issue) => {
            const lat = Number(issue?.latitude);
            const lng = Number(issue?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          });
        if (!cancelled) setMapIssues(pageItems);
      } catch {
        if (!cancelled) setMapIssues([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters.status, filters.category, filters.provinceId, filters.districtId]);

  const applyFilters = useCallback(
    (next) => {
      setFilters(next);
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (next.status) params.set("status", next.status);
      else params.delete("status");
      if (next.category) params.set("category", next.category);
      else params.delete("category");
      if (next.provinceId) params.set("province", next.provinceId);
      else params.delete("province");
      if (next.districtId) params.set("district", next.districtId);
      else params.delete("district");
      if (next.sort && next.sort !== "voteCount") params.set("sort", next.sort);
      else params.delete("sort");
      if (next.q) params.set("q", next.q);
      else params.delete("q");
      const query = params.toString();
      router.replace(query ? `/issues?${query}` : "/issues", { scroll: false });
    },
    [router, searchParams]
  );

  const requestNearMe = useCallback(
    (onGranted) => {
      if (typeof window === "undefined" || !navigator?.geolocation) {
        setGeoError(content.filters.sortLocationUnsupported);
        return;
      }
      setGeoError("");
      setGeoBusy(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoBusy(false);
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setNearMe(loc);
          onGranted?.(loc);
        },
        () => {
          setGeoBusy(false);
          setGeoError(content.filters.sortLocationDenied);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
      );
    },
    [content.filters.sortLocationDenied, content.filters.sortLocationUnsupported]
  );

  // If the page lands with ?sort=nearest (deep link or refresh) and there's
  // no location fix yet, fire the prompt once.
  useEffect(() => {
    if (filters.sort === "nearest" && !nearMe && !geoBusy && !geoError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      requestNearMe();
    }
  }, [filters.sort, nearMe, geoBusy, geoError, requestNearMe]);

  const setFilter = (key, value) => {
    if (key === "sort" && value === "nearest") {
      const next = { ...filters, sort: "nearest" };
      applyFilters(next);
      if (!nearMe) requestNearMe();
      return;
    }
    if (key === "sort") setGeoError("");
    applyFilters({ ...filters, [key]: value });
  };

  const sortedItems = useMemo(() => {
    // Text search is client-side over the loaded buffer — substring match on
    // title + address (Devanagari-safe; compares the original strings). We match
    // against the *localized* title/description (localizeIssue resolves the
    // active locale from issue.translations) so the search hits the same text
    // the cards render, not the raw base-locale fields.
    const needle = filters.q?.trim().toLowerCase();
    const base = needle
      ? items.filter((issue) => {
          const localized = localizeIssue(issue, language);
          const title = (localized.title || "").toLowerCase();
          const addr = (issue.addressText || "").toLowerCase();
          const desc = (localized.description || "").toLowerCase();
          return (
            title.includes(needle) ||
            addr.includes(needle) ||
            desc.includes(needle)
          );
        })
      : items;
    if (filters.sort !== "nearest" || !nearMe) return base;
    const haversine = (lat1, lon1, lat2, lon2) => {
      const toRad = (d) => (d * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };
    return [...base].sort((a, b) => {
      const aLat = Number(a.latitude);
      const aLng = Number(a.longitude);
      const bLat = Number(b.latitude);
      const bLng = Number(b.longitude);
      const aOk = Number.isFinite(aLat) && Number.isFinite(aLng);
      const bOk = Number.isFinite(bLat) && Number.isFinite(bLng);
      if (!aOk && !bOk) return 0;
      if (!aOk) return 1;
      if (!bOk) return -1;
      const da = haversine(nearMe.lat, nearMe.lng, aLat, aLng);
      const db = haversine(nearMe.lat, nearMe.lng, bLat, bLng);
      return da - db;
    });
  }, [items, nearMe, filters.sort, filters.q, language]);

  const visibleItems = useMemo(
    () => sortedItems.slice(0, visibleCount),
    [sortedItems, visibleCount]
  );

  // Selection state (URL-driven).
  const [selectedId, setSelectedId] = useState(null);
  const didInitialResolveRef = useRef(false);
  const selectedCardRef = useRef(null);
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    if (didInitialResolveRef.current) return;
    if (sortedItems.length === 0) return;
    didInitialResolveRef.current = true;
    const fromUrl = searchParams?.get("issue");
    let resolvedId = null;
    let resolvedIndex = -1;
    if (fromUrl) {
      resolvedIndex = sortedItems.findIndex((i) => i.id === fromUrl);
      if (resolvedIndex >= 0) resolvedId = fromUrl;
    }
    if (!resolvedId) {
      resolvedId = sortedItems[0]?.id ?? null;
      resolvedIndex = 0;
    }
    setSelectedId(resolvedId);
    if (resolvedIndex >= INITIAL_VISIBLE) {
      setVisibleCount((v) => Math.max(v, resolvedIndex + 1));
    }
    // Direct deep-link on mobile → drill straight to detail pane.
    if (
      fromUrl &&
      resolvedId &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      setMobileView("detail");
    }
  }, [sortedItems, searchParams]);

  // When list changes and selected isn't in it, re-select first.
  useEffect(() => {
    if (!didInitialResolveRef.current) return;
    if (selectedId === null) return;
    if (sortedItems.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!sortedItems.some((i) => i.id === selectedId)) {
      setSelectedId(sortedItems[0]?.id ?? null);
    }
  }, [sortedItems, selectedId]);

  // Mobile drill-in state.
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

  const updateUrl = useCallback(
    (issueId, opts) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (issueId) params.set("issue", issueId);
      else params.delete("issue");
      const query = params.toString();
      const url = query ? `/issues?${query}` : "/issues";
      if (opts?.push) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
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

  // Infinite scroll: load more items into the visible window; once that
  // window catches up to the local buffer, fetch the next API page.
  const sentinelRef = useRef(null);
  const hasMoreLocal = visibleCount < sortedItems.length;
  const hasMoreRemote = Boolean(nextCursor);
  const hasMore = hasMoreLocal || hasMoreRemote;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        if (hasMoreLocal) {
          setVisibleCount((v) => Math.min(v + LOAD_MORE_STEP, sortedItems.length));
          return;
        }
        if (hasMoreRemote && !loadingMore) {
          setLoadingMore(true);
          try {
            const page = await fetchPage(nextCursor);
            setItems((prev) => [...prev, ...page.items]);
            setNextCursor(page.nextCursor);
            setVisibleCount((v) => v + LOAD_MORE_STEP);
          } catch (fetchError) {
            setError(fetchError?.message || content.states.errorBody);
          } finally {
            setLoadingMore(false);
          }
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    hasMore,
    hasMoreLocal,
    hasMoreRemote,
    sortedItems.length,
    nextCursor,
    loadingMore,
    fetchPage,
    content.states.errorBody
  ]);

  // Auto-scroll selected card into view on initial deep-link.
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

  const handleRetry = () => {
    setLoading(true);
    setError("");
    (async () => {
      try {
        const page = await fetchPage();
        setItems(page.items);
        setNextCursor(page.nextCursor);
        setVisibleCount(INITIAL_VISIBLE);
      } catch (fetchError) {
        setItems([]);
        setNextCursor(null);
        setError(fetchError?.message || content.states.errorBody);
      } finally {
        setLoading(false);
      }
    })();
  };

  const statusOptions = PUBLIC_ISSUE_STATUSES.map((value) => ({
    value,
    label: content.statusLabels[value] || value
  }));
  const categoryOptions = ISSUE_CATEGORIES.map((value) => ({
    value,
    label: content.categoryLabels[value] || value
  }));
  const sortOptions = SORT_OPTIONS.map((option) => ({
    value: option.value,
    label: content.filters[option.labelKey]
  }));
  // Province/district filter handler — feeds ProvinceDistrictFilter's onChange.
  const handleGeographyChange = useCallback(
    ({ provinceId, districtId }) => {
      applyFilters({ ...filters, provinceId: provinceId || undefined, districtId: districtId || undefined });
    },
    [filters, applyFilters]
  );

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      applyFilters({ ...filters, q: searchInput.trim() });
    },
    [applyFilters, filters, searchInput]
  );

  const selectedIssue = sortedItems.find((i) => i.id === selectedId) || null;
  const isMobileDrillActive = mobileView === "detail";
  const showResults = !error && !loading && visibleItems.length > 0;
  // Empty when the *filtered* list is empty — covers both "no issues at all"
  // and "search matched nothing" so a zero-result query never shows a blank gap.
  const showEmpty =
    !loading && !error && sortedItems.length === 0;
  const showError = !loading && Boolean(error);
  const isInitialLoad = loading && items.length === 0;

  return (
    <SiteShell pageTitle={t.pageTitles.issues}>
      <section className="page-section public-issues-section">
        <div className="section-heading">
          <span className="eyebrow">{content.list.eyebrow}</span>
          <h1>{content.list.title}</h1>
          <p>{content.list.intro}</p>
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
          <ActivityStatsRow language={language} interactive currentPage="issues" />
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
                {t.issueNew.cta.list}
              </Button>
            </Link>
          </div>
          {filtersOpen ? (
          <div className="public-issues-filters">
            <div className="public-issues-filter-field">
              <label
                className="public-issues-filter-label"
                htmlFor="issues-filter-status"
              >
                {content.filters.statusLabel}
              </label>
              <Select
                id="issues-filter-status"
                allowClear
                onChange={(value) => setFilter("status", value)}
                options={statusOptions}
                placeholder={content.filters.statusPlaceholder}
                value={filters.status}
              />
            </div>
            <div className="public-issues-filter-field">
              <label
                className="public-issues-filter-label"
                htmlFor="issues-filter-category"
              >
                {content.filters.categoryLabel}
              </label>
              <Select
                id="issues-filter-category"
                allowClear
                onChange={(value) => setFilter("category", value)}
                options={categoryOptions}
                placeholder={content.filters.categoryPlaceholder}
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
                htmlFor="issues-filter-sort"
              >
                {content.filters.sortLabel}
              </label>
              <Select
                id="issues-filter-sort"
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
                  {geoBusy ? content.filters.sortLocating : geoError}
                </span>
              ) : null}
            </div>
          </div>
          ) : null}
        </div>

        {showError ? (
          <div className="public-issues-error" role="alert">
            <h2>{content.states.errorTitle}</h2>
            <p>{content.states.errorBody}</p>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              type="primary"
            >
              {content.states.retry}
            </Button>
          </div>
        ) : null}

        {showEmpty ? (
          <Empty
            className="public-issues-empty"
            description={
              <>
                <strong>{content.states.emptyTitle}</strong>
                <p>{content.states.emptyBody}</p>
              </>
            }
          />
        ) : null}

        {isInitialLoad ? (
          <section
            className="events-split"
            aria-busy="true"
            aria-label={content.states.loading}
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
          <section
            className="events-split"
            data-mobile-view={mobileView}
            aria-label={splitCopy.listAriaLabel || content.list.title}
          >
            <div className="events-split-list">
              <ul
                ref={listRef}
                role="listbox"
                aria-label={content.list.title}
                aria-activedescendant={
                  selectedId ? `issue-option-${selectedId}` : undefined
                }
                className="events-split-list-inner"
                onKeyDown={handleListKeyDown}
              >
                {visibleItems.map((issue) => {
                  const isSelected = issue.id === selectedId;
                  return (
                    <IssueListCard
                      key={issue.id}
                      issue={issue}
                      selected={isSelected}
                      language={language}
                      content={content}
                      onSelect={handleSelect}
                      optionId={`issue-option-${issue.id}`}
                      ref={isSelected ? selectedCardRef : null}
                    />
                  );
                })}
              </ul>
              {hasMore || loadingMore ? (
                <>
                  <div
                    ref={sentinelRef}
                    className="events-split-sentinel"
                    aria-hidden="true"
                  />
                  <div
                    className="events-split-loading"
                    role="status"
                    aria-live="polite"
                  >
                    {splitCopy.loadingMore || "Loading more…"}
                  </div>
                </>
              ) : visibleItems.length > INITIAL_VISIBLE ? (
                <div className="events-split-nomore">
                  {splitCopy.noMore || "All shown."}
                </div>
              ) : null}
            </div>

            <IssuePreviewPane
              issue={selectedIssue}
              language={language}
              content={content}
              preview={preview}
              onBack={handleBack}
              isMobileDrillActive={isMobileDrillActive}
            />
          </section>
        ) : null}

        {showResults ? (
          <div className="public-issues-map-section">
            <div className="live-issues-map-frame">
              <IssueMapBlock
                issues={mapIssues}
                content={content}
                language={language}
                height={612}
                interactive
                enableFullscreen
                fullscreenLabel={
                  liveIssuesCopy.fullscreenOpen || "Open fullscreen map"
                }
                exitFullscreenLabel={
                  liveIssuesCopy.fullscreenClose || "Close fullscreen map"
                }
              />
            </div>
          </div>
        ) : null}
      </section>
    </SiteShell>
  );
}
