"use client";

import {
  ArrowRightOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FormOutlined,
  MessageOutlined,
  RiseOutlined,
  TeamOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import { Alert, Button, Skeleton } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { OverviewPanel } from "@/components/admin/reports/ReportPanels";
import { fetchReport, formatCount, formatPercent } from "@/lib/reportsApi";

const DASHBOARD_SECTIONS = [
  "overview",
  "issues",
  "events",
  "feedback",
  "applications"
];

export default function AdminDashboardPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchReport({ sections: DASHBOARD_SECTIONS, topN: 5 });
      setReport(data);
    } catch (err) {
      setError(err?.message || "Could not load dashboard analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const bucket = report?.range?.bucket || "auto";
  const overview = report?.overview;
  const feedback = report?.feedback;
  const apps = report?.applications;
  const issues = report?.issues;
  const events = report?.events;

  return (
    <AdminShell title="Dashboard">
      <section className="admin-dashboard-overview">
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Could not load dashboard analytics"
            description={error}
            action={
              <Button onClick={load} type="primary">
                Try again
              </Button>
            }
          />
        ) : null}

        {loading && !report ? (
          <>
            <Skeleton active paragraph={{ rows: 2 }} />
            <Skeleton active paragraph={{ rows: 4 }} />
          </>
        ) : null}

        {report ? (
          <>
            {overview ? (
              <OverviewPanel data={overview} bucket={bucket} loading={loading} />
            ) : null}

            <section className="admin-report-section">
              <header className="admin-report-section-heading">
                <h2>Needs attention</h2>
                <p>Quick-glance counts that usually need a triage decision today.</p>
              </header>
              <div className="admin-report-kpi-grid">
                <Link href="/admin/feedback" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <MessageOutlined /> Pending feedback
                  </div>
                  <strong>{formatCount(feedback?.pending)}</strong>
                  <span className="shortcut-hint">
                    {formatCount(feedback?.newInPeriod)} new in current period
                  </span>
                  <span className="admin-dashboard-link-row">
                    Review feedback <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/applications" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <FormOutlined /> Open applications
                  </div>
                  <strong>
                    {formatCount((apps?.funnel?.submitted || 0) + (apps?.funnel?.underReview || 0))}
                  </strong>
                  <span className="shortcut-hint">
                    {formatCount(apps?.funnel?.submitted)} submitted ·{" "}
                    {formatCount(apps?.funnel?.underReview)} under review
                  </span>
                  <span className="admin-dashboard-link-row">
                    Review applications <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/issues" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <EnvironmentOutlined /> Open issues
                  </div>
                  <strong>{formatCount(issues?.byStatus?.OPEN)}</strong>
                  <span className="shortcut-hint">
                    Avg {Number(issues?.avgVoteCount ?? 0).toFixed(1)} votes / issue ·{" "}
                    {formatPercent(issues?.conversionRate?.issueToEventPercent)} converted
                  </span>
                  <span className="admin-dashboard-link-row">
                    Triage issues <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/events" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <ThunderboltOutlined /> Events awaiting admin
                  </div>
                  <strong>{formatCount(events?.leaderVotingState?.PENDING_ADMIN)}</strong>
                  <span className="shortcut-hint">
                    {formatCount(events?.leaderVotingState?.OPEN)} leader votes open
                  </span>
                  <span className="admin-dashboard-link-row">
                    Open events <ArrowRightOutlined />
                  </span>
                </Link>
              </div>
            </section>

            <section className="admin-report-section">
              <header className="admin-report-section-heading">
                <h2>Jump to a control center area</h2>
                <p>Routine admin tasks live on their own pages.</p>
              </header>
              <div className="admin-dashboard-shortcuts">
                <Link href="/admin/applications" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <FormOutlined /> Applications
                  </div>
                  <strong>{formatCount(apps?.total)}</strong>
                  <span className="shortcut-hint">Onboarding pipeline & contributor notes.</span>
                  <span className="admin-dashboard-link-row">
                    Open <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/feedback" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <MessageOutlined /> Feedback
                  </div>
                  <strong>{formatCount(feedback?.total)}</strong>
                  <span className="shortcut-hint">Suggestions, bug reports & replies.</span>
                  <span className="admin-dashboard-link-row">
                    Open <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/issues" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <EnvironmentOutlined /> Issues
                  </div>
                  <strong>{formatCount(issues?.total)}</strong>
                  <span className="shortcut-hint">Reported community issues.</span>
                  <span className="admin-dashboard-link-row">
                    Open <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/events" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <CalendarOutlined /> Events
                  </div>
                  <strong>{formatCount(events?.total)}</strong>
                  <span className="shortcut-hint">Scheduled cleanups & leadership.</span>
                  <span className="admin-dashboard-link-row">
                    Open <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/users" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <TeamOutlined /> Users
                  </div>
                  <strong>Browse</strong>
                  <span className="shortcut-hint">Registered members & verification.</span>
                  <span className="admin-dashboard-link-row">
                    Open <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/reports" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <RiseOutlined /> Reports
                  </div>
                  <strong>Full analytics</strong>
                  <span className="shortcut-hint">
                    Filter by date, geography, status, and more across every domain.
                  </span>
                  <span className="admin-dashboard-link-row">
                    Open <ArrowRightOutlined />
                  </span>
                </Link>
              </div>
            </section>
          </>
        ) : null}
      </section>
    </AdminShell>
  );
}
