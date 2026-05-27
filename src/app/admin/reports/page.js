"use client";

import { CalendarOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Empty, Skeleton, Tag } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { ReportsFilters } from "@/components/admin/reports/ReportsFilters";
import {
  ApplicationsPanel,
  EngagementPanel,
  EventsPanel,
  FeedbackPanel,
  GeographicPanel,
  IssuesPanel,
  OverviewPanel,
  UploadsPanel,
  UsersPanel
} from "@/components/admin/reports/ReportPanels";
import { fetchReport } from "@/lib/reportsApi";

const INITIAL_FILTERS = {
  fromDate: null,
  toDate: null,
  bucket: null,
  topN: 10,
  sections: [],
  municipality: null,
  ward: null,
  userRole: null,
  userVerified: null,
  userIsOAuth: null,
  issueStatus: null,
  issueCategory: null,
  eventStatus: null,
  eventRiskLevel: null,
  eventLeaderVotingStatus: null,
  voterRole: null,
  feedbackType: null,
  feedbackStatus: null,
  applicationRole: null,
  applicationStatus: null,
  uploadFileType: null,
  uploadIsConfirmed: null,
  uploadLinkedTo: null
};

const ALL_PANELS = [
  "overview",
  "users",
  "issues",
  "events",
  "engagement",
  "feedback",
  "applications",
  "uploads",
  "geographic"
];

function formatRangeLabel(filters) {
  if (!filters.fromDate || !filters.toDate) return "All time";
  try {
    const from = new Date(
      typeof filters.fromDate === "string" ? filters.fromDate : filters.fromDate.toISOString()
    );
    const to = new Date(
      typeof filters.toDate === "string" ? filters.toDate : filters.toDate.toISOString()
    );
    const opts = { dateStyle: "medium" };
    return `${from.toLocaleDateString("en-US", opts)} → ${to.toLocaleDateString("en-US", opts)}`;
  } catch {
    return "Custom range";
  }
}

export default function AdminReportsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReport = useCallback(
    async (mode = "initial") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const data = await fetchReport(filters);
        setReport(data);
      } catch (err) {
        setError(err?.message || "Could not load report.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport("initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleReset = () => setFilters(INITIAL_FILTERS);
  const handleRefresh = () => loadReport("refresh");

  const visibleSections = useMemo(() => {
    if (Array.isArray(filters.sections) && filters.sections.length) {
      return filters.sections;
    }
    return ALL_PANELS;
  }, [filters.sections]);

  const bucket = report?.range?.bucket || filters.bucket || "auto";

  return (
    <AdminShell title="Reports">
      <section className="admin-panel admin-report-panel">
        <AdminPanelHeading
          eyebrow="Analytics"
          title="Reports"
          description="Aggregated cross-domain analytics for the entire control center. Tune the filters to narrow the view; lifetime totals always reflect the active filters but ignore the date range."
          actions={
            <div className="admin-report-heading-meta">
              <Tag icon={<CalendarOutlined />}>{formatRangeLabel(filters)}</Tag>
              <Tag>Bucket: {bucket}</Tag>
              <Tag>Top-N: {filters.topN || 10}</Tag>
            </div>
          }
        />

        <ReportsFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleReset}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          loading={loading}
        />

        {error ? (
          <Alert
            message="Could not load the report"
            description={error}
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            action={
              <Button onClick={() => loadReport("initial")} type="primary">
                Try again
              </Button>
            }
          />
        ) : null}

        {loading && !report ? (
          <div className="admin-report-skeleton-stack">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} active paragraph={{ rows: 6 }} />
            ))}
          </div>
        ) : null}

        {!loading && !report && !error ? (
          <Empty description="No report data available." />
        ) : null}

        {report ? (
          <div className="admin-report-stack">
            {visibleSections.includes("overview") && report.overview ? (
              <OverviewPanel data={report.overview} bucket={bucket} loading={loading} />
            ) : null}
            {visibleSections.includes("users") && report.users ? (
              <UsersPanel data={report.users} bucket={bucket} loading={loading} />
            ) : null}
            {visibleSections.includes("issues") && report.issues ? (
              <IssuesPanel data={report.issues} bucket={bucket} loading={loading} />
            ) : null}
            {visibleSections.includes("events") && report.events ? (
              <EventsPanel data={report.events} bucket={bucket} loading={loading} />
            ) : null}
            {visibleSections.includes("engagement") && report.engagement ? (
              <EngagementPanel data={report.engagement} bucket={bucket} loading={loading} />
            ) : null}
            {visibleSections.includes("feedback") && report.feedback ? (
              <FeedbackPanel data={report.feedback} bucket={bucket} loading={loading} />
            ) : null}
            {visibleSections.includes("applications") && report.applications ? (
              <ApplicationsPanel data={report.applications} bucket={bucket} loading={loading} />
            ) : null}
            {visibleSections.includes("uploads") && report.uploads ? (
              <UploadsPanel data={report.uploads} bucket={bucket} loading={loading} />
            ) : null}
            {visibleSections.includes("geographic") && report.geographic ? (
              <GeographicPanel data={report.geographic} loading={loading} />
            ) : null}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
