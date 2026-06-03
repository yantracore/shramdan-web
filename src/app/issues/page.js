"use client";

import {
  LeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined
} from "@ant-design/icons";
import { Button, Empty, Select } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import IssueMapBlock from "@/components/IssueMapBlock";
import {
  PublicIssueCard,
  PublicIssueCardSkeleton,
  toLocalDigits
} from "@/components/PublicIssueCard";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { ISSUE_CATEGORIES, getListItems } from "@/lib/adminUtils";

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
const MAP_FETCH_LIMIT = 100;

function isPublicIssue(issue) {
  return PUBLIC_ISSUE_STATUSES.includes(issue?.status);
}

export default function IssuesListPage() {
  const { language } = usePreferences();
  const t = copy[language];
  const content = t.issues;
  const liveIssuesCopy = t.liveIssues || {};

  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySet = new Set(ISSUE_CATEGORIES);

  const readFiltersFromUrl = useCallback(() => {
    const statusParam = searchParams?.get("status");
    const categoryParam = searchParams?.get("category");
    const sortParam = searchParams?.get("sort");
    return {
      status: statusParam && STATUS_VALUES.has(statusParam) ? statusParam : undefined,
      category: categoryParam && categorySet.has(categoryParam) ? categoryParam : undefined,
      sort: sortParam && SORT_VALUES.has(sortParam) ? sortParam : "voteCount"
    };
    // categorySet is rebuilt from a stable constant each render — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => readFiltersFromUrl());
  const [mapIssues, setMapIssues] = useState([]);
  const [nearMe, setNearMe] = useState(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState("");

  const sortedItems = useMemo(() => {
    const items = pages[currentPage - 1]?.items || [];
    if (filters.sort !== "nearest" || !nearMe) return items;
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
    return [...items].sort((a, b) => {
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
  }, [pages, currentPage, nearMe, filters.sort]);

  // Re-sync state from URL on back/forward navigation.
  useEffect(() => {
    const next = readFiltersFromUrl();
    setFilters((prev) => {
      if (
        prev.status === next.status &&
        prev.category === next.category &&
        prev.sort === next.sort
      ) {
        return prev;
      }
      return next;
    });
  }, [readFiltersFromUrl]);

  const fetchPage = useCallback(
    async (cursor) => {
      const response = await getJson("/issues", {
        params: {
          status: filters.status,
          category: filters.category,
          // Server only knows voteCount and createdAt. For client-only sorts
          // (e.g. "nearest") we let the server default to voteCount and sort
          // the page locally afterwards.
          sort: CLIENT_ONLY_SORTS.has(filters.sort) ? undefined : filters.sort,
          limit: PAGE_SIZE,
          cursor
        }
      });
      const items = getListItems(response).filter(isPublicIssue);
      const nextCursor = response?.data?.nextCursor || null;
      return { items, nextCursor };
    },
    [filters]
  );

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    (async () => {
      try {
        const page = await fetchPage();
        if (cancelled) return;
        setPages([page]);
        setCurrentPage(1);
      } catch (fetchError) {
        if (cancelled) return;
        setPages([]);
        setError(fetchError?.message || content.states.errorBody);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, content.states.errorBody]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getJson("/issues", {
          params: {
            status: filters.status,
            category: filters.category,
            limit: MAP_FETCH_LIMIT
          }
        });
        const items = getListItems(response)
          .filter(isPublicIssue)
          .filter((issue) => {
            const lat = Number(issue?.latitude);
            const lng = Number(issue?.longitude);
            return Number.isFinite(lat) && Number.isFinite(lng);
          });
        if (!cancelled) setMapIssues(items);
      } catch {
        if (!cancelled) setMapIssues([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters.status, filters.category]);

  const applyFilters = useCallback(
    (next) => {
      setFilters(next);
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (next.status) params.set("status", next.status);
      else params.delete("status");
      if (next.category) params.set("category", next.category);
      else params.delete("category");
      if (next.sort && next.sort !== "voteCount") params.set("sort", next.sort);
      else params.delete("sort");
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
  // no location fix yet, fire the prompt once. requestNearMe sets state, so
  // we suppress the cascading-render lint here on purpose.
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

  const knownPages = pages.length;
  const currentItems = sortedItems;
  const isOnLastCachedPage = currentPage >= knownPages;
  const lastCursorAvailable = Boolean(pages[currentPage - 1]?.nextCursor);
  const canGoNext = !loading && (isOnLastCachedPage ? lastCursorAvailable : true);
  const canGoPrev = !loading && currentPage > 1;

  const scrollTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (!canGoPrev) return;
    setCurrentPage((p) => p - 1);
    scrollTop();
  };

  const handleNext = async () => {
    if (!canGoNext) return;
    if (currentPage < knownPages) {
      setCurrentPage((p) => p + 1);
      scrollTop();
      return;
    }
    const cursor = pages[currentPage - 1]?.nextCursor;
    if (!cursor) return;
    setLoading(true);
    setError("");
    try {
      const page = await fetchPage(cursor);
      setPages((prev) => [...prev, page]);
      setCurrentPage((p) => p + 1);
      scrollTop();
    } catch (fetchError) {
      setError(fetchError?.message || content.states.errorBody);
    } finally {
      setLoading(false);
    }
  };

  const handleJump = (n) => {
    if (loading || n < 1 || n > knownPages || n === currentPage) return;
    setCurrentPage(n);
    scrollTop();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    (async () => {
      try {
        const page = await fetchPage();
        setPages([page]);
        setCurrentPage(1);
      } catch (fetchError) {
        setPages([]);
        setError(fetchError?.message || content.states.errorBody);
      } finally {
        setLoading(false);
      }
    })();
  };

  const totalCachedItems = pages.reduce((sum, p) => sum + p.items.length, 0);
  const isInitialLoad = loading && pages.length === 0;
  const isNavigating = loading && pages.length > 0;
  const showError = !loading && Boolean(error);
  const showEmpty =
    !loading && !error && pages.length > 0 && totalCachedItems === 0;
  const showResults = !error && currentItems.length > 0;
  const showPagination =
    !error && pages.length > 0 && (knownPages > 1 || lastCursorAvailable);

  return (
    <SiteShell pageTitle={t.pageTitles.issues}>
      <section className="page-section public-issues-section">
        <div className="section-heading">
          <span className="eyebrow">{content.list.eyebrow}</span>
          <h1>{content.list.title}</h1>
          <p>{content.list.intro}</p>
        </div>

        <div className="public-issues-toolbar">
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
          </div>
          <div className="public-issues-actions">
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
            <Link className="public-issues-filters-cta" href="/issues/new">
              <Button type="primary" icon={<PlusOutlined />} size="large">
                {t.issueNew.cta.list}
              </Button>
            </Link>
          </div>
        </div>

        {isInitialLoad ? (
          <div
            aria-busy="true"
            aria-label={content.states.loading}
            className="public-issues-grid public-issues-grid-skeleton"
            role="status"
          >
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <PublicIssueCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

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

        {showResults ? (
          <div
            aria-busy={isNavigating ? "true" : undefined}
            className={`public-issues-grid${isNavigating ? " is-navigating" : ""}`}
          >
            {currentItems.map((issue) => (
              <PublicIssueCard
                key={issue.id}
                issue={issue}
                content={content}
                language={language}
              />
            ))}
          </div>
        ) : null}

        {showPagination ? (
          <nav
            aria-label={content.pagination.ariaLabel}
            className="public-issues-pagination"
          >
            <button
              className="public-issues-pagination-nav"
              disabled={!canGoPrev}
              onClick={handlePrev}
              type="button"
            >
              <LeftOutlined />
              <span>{content.pagination.previous}</span>
            </button>
            {Array.from({ length: knownPages }).map((_, index) => {
              const num = index + 1;
              const active = num === currentPage;
              return (
                <button
                  aria-current={active ? "page" : undefined}
                  className={`public-issues-pagination-page${active ? " is-active" : ""}`}
                  disabled={loading || active}
                  key={num}
                  onClick={() => handleJump(num)}
                  type="button"
                >
                  {toLocalDigits(num, language)}
                </button>
              );
            })}
            <button
              className="public-issues-pagination-nav"
              disabled={!canGoNext}
              onClick={handleNext}
              type="button"
            >
              <span>{content.pagination.next}</span>
              <RightOutlined />
            </button>
          </nav>
        ) : null}

        <div className="public-issues-map-section">
          <div className="live-issues-map-frame">
            <IssueMapBlock
              issues={mapIssues}
              content={content}
              language={language}
              height={360}
              interactive
              enableFullscreen
              fullscreenLabel={liveIssuesCopy.fullscreenOpen || "Open fullscreen map"}
              exitFullscreenLabel={liveIssuesCopy.fullscreenClose || "Close fullscreen map"}
            />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
