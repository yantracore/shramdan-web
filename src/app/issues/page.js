"use client";

import { ReloadOutlined } from "@ant-design/icons";
import { Button, Empty, Select, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
import { PublicIssueCard } from "@/components/PublicIssueCard";
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
const FETCH_LIMIT = 50;

function isPublicIssue(issue) {
  return PUBLIC_ISSUE_STATUSES.includes(issue?.status);
}

export default function IssuesListPage() {
  const { language } = usePreferences();
  const t = copy[language];
  const content = t.issues;

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: undefined,
    category: undefined,
    sort: "voteCount"
  });

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getJson("/issues", {
        params: {
          status: filters.status,
          category: filters.category,
          sort: filters.sort,
          limit: FETCH_LIMIT
        }
      });
      const list = getListItems(response).filter(isPublicIssue);
      setIssues(list);
    } catch (fetchError) {
      setIssues([]);
      setError(fetchError?.message || content.states.errorBody);
    } finally {
      setLoading(false);
    }
  }, [filters, content.states.errorBody]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIssues();
  }, [fetchIssues]);

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

  const showEmpty = !loading && !error && issues.length === 0;
  const showError = !loading && Boolean(error);

  return (
    <SiteShell>
      <section className="page-section public-issues-section">
        <div className="section-heading">
          <span className="eyebrow">{content.list.eyebrow}</span>
          <h1>{content.list.title}</h1>
          <p>{content.list.intro}</p>
        </div>

        <div className="public-issues-filters" role="group" aria-label={content.filters.statusLabel}>
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

        {loading ? (
          <div className="public-issues-loading" role="status">
            <Spin />
            <span>{content.states.loading}</span>
          </div>
        ) : null}

        {showError ? (
          <div className="public-issues-error" role="alert">
            <h2>{content.states.errorTitle}</h2>
            <p>{content.states.errorBody}</p>
            <Button icon={<ReloadOutlined />} onClick={fetchIssues} type="primary">
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

        {!loading && !error && issues.length > 0 ? (
          <div className="public-issues-grid">
            {issues.map((issue) => (
              <PublicIssueCard
                key={issue.id}
                issue={issue}
                content={content}
                language={language}
              />
            ))}
          </div>
        ) : null}
      </section>
    </SiteShell>
  );
}
