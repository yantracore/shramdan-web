"use client";

import {
  ArrowRightOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FormOutlined,
  GlobalOutlined,
  MessageOutlined,
  PlusOutlined,
  RiseOutlined,
  TeamOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import { Alert, Button, Skeleton, Tag } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import {
  ApplicationsPanel,
  EventsPanel,
  IssuesPanel,
  OverviewPanel
} from "@/components/admin/reports/ReportPanels";
import { KpiTile } from "@/components/admin/reports/reportPrimitives";
import {
  fetchReport,
  formatBytes,
  formatCount,
  formatPercent
} from "@/lib/reportsApi";

const DASHBOARD_SECTIONS = [
  "overview",
  "users",
  "issues",
  "events",
  "feedback",
  "applications",
  "uploads"
];

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

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
  const users = report?.users;
  const uploads = report?.uploads;

  return (
    <AdminShell title="Dashboard">
      <section className="admin-dashboard-overview">
        <div className="admin-dashboard-hero">
          <div className="admin-dashboard-hero-headline">
            <span className="eyebrow">Control center</span>
            <h2>Shramdan admin dashboard</h2>
            <p>
              Snapshot of the active community — accounts, reported issues, scheduled events, and
              contributor engagement. {todayLabel()}.
            </p>
          </div>
          <div className="admin-dashboard-quick-actions">
            <Link href="/admin/reports">
              <Button type="primary" icon={<RiseOutlined />}>
                Open full reports
              </Button>
            </Link>
            <Link href="/admin/issues/create">
              <Button icon={<PlusOutlined />}>Create issue</Button>
            </Link>
            <Link href="/admin/applications">
              <Button icon={<FormOutlined />}>Review applications</Button>
            </Link>
            <Link href="/admin/feedback">
              <Button icon={<MessageOutlined />}>Open feedback</Button>
            </Link>
            <Link href="/">
              <Button icon={<GlobalOutlined />}>Public site</Button>
            </Link>
          </div>
        </div>

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
            <Skeleton active paragraph={{ rows: 6 }} />
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
                  <strong>{formatCount((apps?.funnel?.submitted || 0) + (apps?.funnel?.underReview || 0))}</strong>
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
                  <strong>{formatCount(report.issues?.byStatus?.OPEN)}</strong>
                  <span className="shortcut-hint">
                    Avg {Number(report.issues?.avgVoteCount ?? 0).toFixed(1)} votes / issue ·{" "}
                    {formatPercent(report.issues?.conversionRate?.issueToEventPercent)} converted
                  </span>
                  <span className="admin-dashboard-link-row">
                    Triage issues <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/events" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <ThunderboltOutlined /> Events awaiting admin
                  </div>
                  <strong>{formatCount(report.events?.leaderVotingState?.PENDING_ADMIN)}</strong>
                  <span className="shortcut-hint">
                    {formatCount(report.events?.leaderVotingState?.OPEN)} leader votes open
                  </span>
                  <span className="admin-dashboard-link-row">
                    Open events <ArrowRightOutlined />
                  </span>
                </Link>
              </div>
            </section>

            <section className="admin-report-section">
              <header className="admin-report-section-heading">
                <h2>Community pulse</h2>
                <p>Member base posture and content footprint.</p>
              </header>
              <div className="admin-report-kpi-grid">
                <KpiTile
                  label="Verified users"
                  value={users?.verifiedPercent}
                  delta={null}
                  formatValue={(v) => formatPercent(v)}
                  accent="#176b5c"
                  icon={<TeamOutlined />}
                  hint={`${formatCount(users?.verified)} of ${formatCount(users?.total)}`}
                />
                <KpiTile
                  label="OAuth signups"
                  value={users?.oauth}
                  delta={null}
                  accent="#7e5bd0"
                  icon={<TeamOutlined />}
                  hint={`${formatCount(users?.native)} native sign-ups`}
                />
                <KpiTile
                  label="Stored media"
                  value={uploads?.totalSizeBytes}
                  formatValue={formatBytes}
                  delta={null}
                  accent="#5f7269"
                  hint={`${formatCount(uploads?.total)} uploads · ${formatCount(uploads?.unconfirmed)} unconfirmed`}
                />
                <KpiTile
                  label="Orphaned uploads"
                  value={uploads?.byLinkedEntity?.orphan}
                  delta={null}
                  accent="#d94646"
                  hint="Uploads with no linked issue, event, or user"
                />
              </div>
            </section>

            {report.issues ? (
              <IssuesPanel data={report.issues} bucket={bucket} loading={loading} />
            ) : null}

            {report.events ? (
              <EventsPanel data={report.events} bucket={bucket} loading={loading} />
            ) : null}

            {report.applications ? (
              <ApplicationsPanel data={report.applications} bucket={bucket} loading={loading} />
            ) : null}

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
                  <strong>{formatCount(report.issues?.total)}</strong>
                  <span className="shortcut-hint">Reported community issues.</span>
                  <span className="admin-dashboard-link-row">
                    Open <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/events" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <CalendarOutlined /> Events
                  </div>
                  <strong>{formatCount(report.events?.total)}</strong>
                  <span className="shortcut-hint">Scheduled cleanups & leadership.</span>
                  <span className="admin-dashboard-link-row">
                    Open <ArrowRightOutlined />
                  </span>
                </Link>
                <Link href="/admin/users" className="admin-dashboard-shortcut">
                  <div className="shortcut-head">
                    <TeamOutlined /> Users
                  </div>
                  <strong>{formatCount(users?.total)}</strong>
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
                    Filter by date, geography, status and more across every domain.
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
