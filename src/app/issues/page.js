"use client";

import {
  EnvironmentOutlined,
  LeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  UnorderedListOutlined
} from "@ant-design/icons";
import { Button, Empty, Select } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
const SORT_OPTIONS = [
  { value: "voteCount", labelKey: "sortMostVotes" },
  { value: "createdAt", labelKey: "sortNewest" }
];
const PAGE_SIZE = 8;
const MAP_FETCH_LIMIT = 200;
const DESKTOP_BREAKPOINT = "(min-width: 1024px)";

function isPublicIssue(issue) {
  return PUBLIC_ISSUE_STATUSES.includes(issue?.status);
}

export default function IssuesListPage() {
  const { language } = usePreferences();
  const t = copy[language];
  const content = t.issues;
  const mapContent = content.map || {};

  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: undefined,
    category: undefined,
    sort: "voteCount"
  });
  const [mapOpen, setMapOpen] = useState(false);
  const [mapIssues, setMapIssues] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia(DESKTOP_BREAKPOINT).matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMapOpen(true);
    }
  }, []);

  const fetchPage = useCallback(
    async (cursor) => {
      const response = await getJson("/issues", {
        params: {
          status: filters.status,
          category: filters.category,
          sort: filters.sort,
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
    if (!mapOpen) return undefined;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMapLoading(true);
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
      } finally {
        if (!cancelled) setMapLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapOpen, filters.status, filters.category]);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
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
  const currentItems = pages[currentPage - 1]?.items || [];
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

  const mappableCount = mapIssues.length;

  return (
    <SiteShell pageTitle={t.pageTitles.issues}>
      <section className="page-section public-issues-section">
        <div className="section-heading section-heading-with-cta">
          <div className="section-heading-body">
            <span className="eyebrow">{content.list.eyebrow}</span>
            <h1>{content.list.title}</h1>
            <p>{content.list.intro}</p>
          </div>
          <Link className="section-heading-cta" href="/issues/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              {t.issueNew.cta.list}
            </Button>
          </Link>
        </div>

        <div className="public-issues-toolbar">
          <div
            className="public-issues-filters"
            role="group"
            aria-label={content.filters.statusLabel}
          >
            <Select
              allowClear
              aria-label={content.filters.statusLabel}
              onChange={(value) => setFilter("status", value)}
              options={statusOptions}
              placeholder={content.filters.statusPlaceholder}
              value={filters.status}
            />
            <Select
              allowClear
              aria-label={content.filters.categoryLabel}
              onChange={(value) => setFilter("category", value)}
              options={categoryOptions}
              placeholder={content.filters.categoryPlaceholder}
              value={filters.category}
            />
            <Select
              aria-label={content.filters.sortLabel}
              onChange={(value) => setFilter("sort", value)}
              options={sortOptions}
              value={filters.sort}
            />
          </div>

          <div
            className="public-issues-view-toggle"
            role="group"
            aria-label={mapContent.toggleLabel || "View"}
          >
            <button
              aria-pressed={!mapOpen}
              className={`public-issues-view-btn${!mapOpen ? " is-active" : ""}`}
              onClick={() => setMapOpen(false)}
              type="button"
            >
              <UnorderedListOutlined aria-hidden="true" />
              <span>{mapContent.viewList || "List"}</span>
            </button>
            <button
              aria-pressed={mapOpen}
              className={`public-issues-view-btn${mapOpen ? " is-active" : ""}`}
              onClick={() => setMapOpen(true)}
              type="button"
            >
              <EnvironmentOutlined aria-hidden="true" />
              <span>{mapContent.viewMap || "Map"}</span>
            </button>
          </div>
        </div>

        <div
          className={`public-issues-content${mapOpen ? " has-map" : ""}`}
        >
          <div className="public-issues-list-col">
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
          </div>

          {mapOpen ? (
            <aside
              className="public-issues-map-col"
              aria-label={mapContent.regionLabel || "Issues map"}
            >
              <div className="public-issues-map-card">
                <div className="public-issues-map-card-header">
                  <h2>{mapContent.title || "Issues across Nepal"}</h2>
                  <span className="public-issues-map-count">
                    {(mapContent.markerCount || "{n} on map").replace(
                      "{n}",
                      toLocalDigits(mappableCount, language)
                    )}
                  </span>
                </div>
                <p className="public-issues-map-note">
                  {mapContent.note ||
                    "Pins show only issues with a known location. Most testing is in Kathmandu and Pokhara — coverage will grow."}
                </p>
                <IssueMapBlock
                  issues={mapIssues}
                  content={content}
                  language={language}
                  height={620}
                />
                <ul className="public-issues-map-legend" aria-hidden="true">
                  <li>
                    <span className="legend-dot legend-dot--open" />
                    {content.statusLabels.OPEN}
                  </li>
                  <li>
                    <span className="legend-dot legend-dot--scheduled" />
                    {content.statusLabels.EVENT_SCHEDULED}
                  </li>
                  <li>
                    <span className="legend-dot legend-dot--completed" />
                    {content.statusLabels.COMPLETED}
                  </li>
                </ul>
                {mapLoading ? (
                  <span className="public-issues-map-loading" aria-live="polite">
                    {content.states.loading}
                  </span>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>
      </section>
    </SiteShell>
  );
}
