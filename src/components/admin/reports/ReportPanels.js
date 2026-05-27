"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  EnvironmentOutlined,
  FormOutlined,
  HddOutlined,
  MessageOutlined,
  RiseOutlined,
  StarFilled,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Empty, Tag } from "antd";
import {
  formatBucketLabel,
  formatBytes,
  formatCount,
  formatPercent
} from "@/lib/reportsApi";
import {
  AreaChart,
  BarChart,
  ColumnChart,
  FunnelChart,
  GaugeChart,
  LineChart,
  PieChart,
  RoseChart
} from "@/components/admin/reports/reportCharts";
import {
  BarList,
  ChartCard,
  KpiTile,
  MetricRow,
  REPORT_COLORS,
  objectToBarItems,
  objectToChartData,
  titleCaseEnum
} from "@/components/admin/reports/reportPrimitives";

const STATUS_COLORS = {
  OPEN: "#3e7bb5",
  EVENT_SCHEDULED: "#7e5bd0",
  COMPLETED: "#3fa46a",
  REJECTED: "#d94646",
  DUPLICATE: "#5f7269",
  DRAFT: "#5f7269",
  SCHEDULED: "#3e7bb5",
  ACTIVE: "#176b5c",
  PAUSED: "#d99800",
  CANCELLED: "#d94646",
  NORMAL: "#3fa46a",
  WATCH: "#d99800",
  URGENT: "#e75f1b",
  CRITICAL: "#d94646",
  NEW: "#3e7bb5",
  REVIEWED: "#7e5bd0",
  IN_PROGRESS: "#d99800",
  RESOLVED: "#3fa46a",
  CLOSED: "#5f7269",
  SUBMITTED: "#3e7bb5",
  UNDER_REVIEW: "#7e5bd0",
  SHORTLISTED: "#176b5c",
  ONBOARDING: "#d99800",
  IMAGE: "#176b5c",
  VIDEO: "#7e5bd0",
  DOCUMENT: "#3e7bb5",
  OTHER: "#5f7269",
  INTERESTED: "#3e7bb5",
  GOING: "#176b5c",
  WANT_TO_LEAD: "#e75f1b"
};

function commonChartTheme(extra = {}) {
  return {
    autoFit: true,
    padding: "auto",
    animation: false,
    theme: {
      type: "light"
    },
    ...extra
  };
}

function buildTimeSeries(series, bucket, label = "Count") {
  if (!Array.isArray(series)) return [];
  return series.map((entry) => ({
    bucketLabel: formatBucketLabel(bucket, entry.bucket || entry.date),
    bucketDate: entry.bucket || entry.date,
    value: Number(entry.count ?? entry.value ?? 0),
    series: label
  }));
}

function TimeSeriesArea({ data, color = REPORT_COLORS[0], height = 220 }) {
  if (!data || data.length === 0) return null;
  return (
    <AreaChart
      {...commonChartTheme({
        data,
        height,
        xField: "bucketLabel",
        yField: "value",
        seriesField: "series",
        smooth: true,
        color,
        areaStyle: { fillOpacity: 0.18 },
        line: { size: 2.5, color },
        point: { size: 3, shape: "circle", style: { fill: color, stroke: "#fff", lineWidth: 1 } },
        xAxis: { tickCount: Math.min(8, data.length) },
        yAxis: { grid: { line: { style: { stroke: "#dce5df", lineDash: [2, 2] } } } },
        tooltip: { showMarkers: true }
      })}
    />
  );
}

function CategoryPie({ data, height = 220, legend = { position: "right" }, color }) {
  if (!data || data.length === 0) return null;
  return (
    <PieChart
      {...commonChartTheme({
        data,
        height,
        angleField: "value",
        colorField: "label",
        radius: 0.92,
        innerRadius: 0.58,
        legend,
        color: color || REPORT_COLORS,
        label: {
          type: "inner",
          offset: "-30%",
          content: ({ percent }) => (percent >= 0.07 ? `${(percent * 100).toFixed(0)}%` : ""),
          style: { fontSize: 11, fill: "#fff", fontWeight: 700 }
        },
        statistic: {
          title: false,
          content: {
            style: { fontSize: 18, fontWeight: 800, color: "#17211c" },
            customHtml: (container, view, datum, currentData) => {
              const total = (currentData || []).reduce((acc, d) => acc + (d.value || 0), 0);
              return formatCount(total);
            }
          }
        },
        interactions: [{ type: "element-active" }]
      })}
    />
  );
}

function CategoryColumn({ data, height = 220, colorMap }) {
  if (!data || data.length === 0) return null;
  return (
    <ColumnChart
      {...commonChartTheme({
        data,
        height,
        xField: "label",
        yField: "value",
        color: ({ label }) => (colorMap && colorMap[label]) || REPORT_COLORS[0],
        columnStyle: { radius: [6, 6, 0, 0] },
        label: {
          position: "top",
          style: { fill: "#17211c", fontSize: 11, fontWeight: 700 }
        },
        xAxis: { label: { autoRotate: true, autoHide: false } },
        yAxis: { grid: { line: { style: { stroke: "#dce5df", lineDash: [2, 2] } } } }
      })}
    />
  );
}

function HorizontalBar({ data, height = 240, color = REPORT_COLORS[0] }) {
  if (!data || data.length === 0) return null;
  return (
    <BarChart
      {...commonChartTheme({
        data,
        height,
        xField: "value",
        yField: "label",
        color,
        barStyle: { radius: [0, 6, 6, 0] },
        label: {
          position: "right",
          style: { fill: "#17211c", fontSize: 11, fontWeight: 700 }
        }
      })}
    />
  );
}

export function OverviewPanel({ data, bucket, loading }) {
  if (!data) return null;
  const totals = data.totals || {};
  const period = data.period || {};
  const delta = data.deltaPercent || {};

  const tiles = [
    { key: "users", label: "Users", icon: <TeamOutlined />, accent: "#176b5c" },
    { key: "issues", label: "Issues", icon: <EnvironmentOutlined />, accent: "#3e7bb5" },
    { key: "events", label: "Events", icon: <CalendarOutlined />, accent: "#7e5bd0" },
    { key: "votes", label: "Issue votes", icon: <RiseOutlined />, accent: "#e75f1b" },
    { key: "feedback", label: "Feedback", icon: <MessageOutlined />, accent: "#d99800" },
    { key: "applications", label: "Applications", icon: <FormOutlined />, accent: "#28a18a" },
    { key: "uploads", label: "Uploads", icon: <CloudUploadOutlined />, accent: "#5f7269" }
  ];

  return (
    <section className="admin-report-section">
      <header className="admin-report-section-heading">
        <h2>Overview</h2>
        <p>Lifetime totals with the change vs the previous period of equal length.</p>
      </header>
      <div className="admin-report-kpi-grid">
        {tiles.map((tile) => (
          <KpiTile
            key={tile.key}
            label={tile.label}
            value={totals[tile.key]}
            delta={delta[tile.key]}
            hint={period[tile.key] !== undefined ? `${formatCount(period[tile.key])} in period` : null}
            accent={tile.accent}
            icon={tile.icon}
            loading={loading}
          />
        ))}
      </div>
    </section>
  );
}

export function UsersPanel({ data, bucket, loading }) {
  if (!data) return null;
  const verifiedData = [
    { label: "Verified", value: data.verified || 0 },
    { label: "Unverified", value: data.unverified || 0 }
  ];
  const oauthData = [
    { label: "OAuth", value: data.oauth || 0 },
    { label: "Native", value: data.native || 0 }
  ];
  const roleData = objectToChartData(data.byRole);
  const series = buildTimeSeries(data.timeSeries, bucket, "New users");
  const topReported = data.topContributors?.byIssuesReported || [];
  const topVoted = data.topContributors?.byVotesCast || [];
  const topLed = data.topContributors?.byEventsLed || [];

  return (
    <section className="admin-report-section">
      <header className="admin-report-section-heading">
        <h2>Users</h2>
        <p>Account base, verification and OAuth posture, and top contributors.</p>
      </header>

      <MetricRow
        loading={loading}
        items={[
          { label: "Total users", value: data.total },
          { label: "Verified %", value: data.verifiedPercent, format: (v) => formatPercent(v) },
          { label: "New in period", value: data.newInPeriod },
          { label: "OAuth users", value: data.oauth },
          { label: "Native users", value: data.native }
        ]}
      />

      <div className="admin-report-grid admin-report-grid-3">
        <ChartCard title="Phone verification" description="Verified vs unverified accounts." isEmpty={!data.total}>
          <CategoryPie data={verifiedData} color={["#176b5c", "#d99800"]} />
        </ChartCard>
        <ChartCard title="Signup method" description="OAuth vs native sign-up split." isEmpty={!data.total}>
          <CategoryPie data={oauthData} color={["#3e7bb5", "#7e5bd0"]} />
        </ChartCard>
        <ChartCard title="By role" description="Administrative role distribution." isEmpty={roleData.length === 0}>
          <CategoryColumn data={roleData} />
        </ChartCard>
      </div>

      <ChartCard
        title="New users over time"
        description="Newly signed-up users per bucket."
        size="wide"
        isEmpty={series.length === 0}
      >
        <TimeSeriesArea data={series} color="#176b5c" height={260} />
      </ChartCard>

      <div className="admin-report-grid admin-report-grid-3">
        <ChartCard title="Top issue reporters" isEmpty={topReported.length === 0}>
          <TopContributorList items={topReported} icon={<EnvironmentOutlined />} />
        </ChartCard>
        <ChartCard title="Top voters" isEmpty={topVoted.length === 0}>
          <TopContributorList items={topVoted} icon={<RiseOutlined />} />
        </ChartCard>
        <ChartCard title="Top event leaders" isEmpty={topLed.length === 0}>
          <TopContributorList items={topLed} icon={<TrophyOutlined />} />
        </ChartCard>
      </div>
    </section>
  );
}

function TopContributorList({ items, icon }) {
  if (!items || items.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  return (
    <ol className="admin-report-top-list">
      {items.slice(0, 10).map((item, idx) => {
        const user = item.user || {};
        return (
          <li key={user.id || idx}>
            <span className="admin-report-top-rank">{idx + 1}</span>
            <Avatar size={32}>{(user.name || user.username || "?").slice(0, 1).toUpperCase()}</Avatar>
            <div className="admin-report-top-meta">
              <strong>{user.name || user.username || "Anonymous"}</strong>
              {user.username && user.name ? <span>@{user.username}</span> : null}
            </div>
            <span className="admin-report-top-value">
              {icon} {formatCount(item.count)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function IssuesPanel({ data, bucket, loading }) {
  if (!data) return null;
  const byStatus = objectToChartData(data.byStatus);
  const byCategory = objectToChartData(data.byCategory);
  const byMunicipality = (data.byMunicipality || []).map((m) => ({
    label: m.municipality || "Unknown",
    value: Number(m.count) || 0
  }));
  const series = buildTimeSeries(data.timeSeries, bucket, "New issues");
  const conversionPercent = data.conversionRate?.issueToEventPercent ?? 0;

  return (
    <section className="admin-report-section">
      <header className="admin-report-section-heading">
        <h2>Issues</h2>
        <p>Community-reported problems — status mix, popularity, and conversion to scheduled events.</p>
      </header>

      <MetricRow
        loading={loading}
        items={[
          { label: "Total issues", value: data.total },
          { label: "New in period", value: data.newInPeriod },
          { label: "Avg votes / issue", value: data.avgVoteCount, format: (v) => Number(v ?? 0).toFixed(1) },
          {
            label: "Converted to events",
            value: data.conversionRate?.converted,
            hint: `${formatCount(data.conversionRate?.eligible)} eligible`
          },
          {
            label: "Conversion rate",
            value: conversionPercent,
            format: (v) => formatPercent(v)
          }
        ]}
      />

      <div className="admin-report-grid admin-report-grid-2">
        <ChartCard title="By status" isEmpty={byStatus.length === 0}>
          <CategoryColumn data={byStatus} colorMap={STATUS_COLORS} />
        </ChartCard>
        <ChartCard title="By category" isEmpty={byCategory.length === 0}>
          <CategoryPie data={byCategory.map((d) => ({ label: titleCaseEnum(d.label), value: d.value }))} />
        </ChartCard>
      </div>

      <div className="admin-report-grid admin-report-grid-2">
        <ChartCard title="Issue to event conversion" description="Promotion rate from OPEN issues to scheduled events.">
          <GaugeChart
            {...commonChartTheme({
              percent: Math.min(1, Number(conversionPercent || 0) / 100),
              range: { color: "l(0) 0:#e75f1b 0.5:#d99800 1:#176b5c" },
              indicator: {
                pointer: { style: { stroke: "#17211c" } },
                pin: { style: { stroke: "#17211c" } }
              },
              statistic: {
                title: { offsetY: -28, formatter: () => "Promoted" },
                content: {
                  style: { fontSize: "26px", fontWeight: 800 },
                  formatter: () => formatPercent(conversionPercent)
                }
              },
              height: 240
            })}
          />
        </ChartCard>
        <ChartCard title="Top voted issues" isEmpty={!data.topVoted || data.topVoted.length === 0}>
          <ol className="admin-report-top-list admin-report-top-list-compact">
            {(data.topVoted || []).slice(0, 10).map((issue, idx) => (
              <li key={issue.id || idx}>
                <span className="admin-report-top-rank">{idx + 1}</span>
                <div className="admin-report-top-meta admin-report-top-meta-wide">
                  <strong>{issue.title || "Untitled"}</strong>
                  <span>
                    <Tag color={STATUS_COLORS[issue.status] ? undefined : "default"} style={{
                      backgroundColor: STATUS_COLORS[issue.status],
                      color: "#fff",
                      borderColor: "transparent"
                    }}>
                      {titleCaseEnum(issue.status)}
                    </Tag>
                    {issue.category ? <Tag>{titleCaseEnum(issue.category)}</Tag> : null}
                  </span>
                </div>
                <span className="admin-report-top-value">
                  <RiseOutlined /> {formatCount(issue.voteCount)}
                </span>
              </li>
            ))}
          </ol>
        </ChartCard>
      </div>

      <ChartCard
        title="Reported issues over time"
        size="wide"
        isEmpty={series.length === 0}
      >
        <TimeSeriesArea data={series} color="#3e7bb5" height={260} />
      </ChartCard>

      {byMunicipality.length > 0 ? (
        <ChartCard title="Issues by municipality" size="wide">
          <BarList items={byMunicipality} valueLabel="issues" />
        </ChartCard>
      ) : null}
    </section>
  );
}

export function EventsPanel({ data, bucket, loading }) {
  if (!data) return null;
  const byStatus = objectToChartData(data.byStatus);
  const byRisk = objectToChartData(data.byRiskLevel);
  const leaderVoting = objectToChartData(data.leaderVotingState);
  const series = buildTimeSeries(data.timeSeries, bucket, "New events");
  const completion = data.completionRate?.completedPercent || 0;

  return (
    <section className="admin-report-section">
      <header className="admin-report-section-heading">
        <h2>Events</h2>
        <p>Scheduled cleanup events — lifecycle, risk posture, leadership, and attendance.</p>
      </header>

      <MetricRow
        loading={loading}
        items={[
          { label: "Total events", value: data.total },
          { label: "New in period", value: data.newInPeriod },
          {
            label: "Completion rate",
            value: completion,
            format: (v) => formatPercent(v),
            hint: `${formatCount(data.completionRate?.completed)} of ${formatCount(data.completionRate?.pipeline)}`
          },
          { label: "Total attendees", value: data.attendance?.totalAttendees },
          {
            label: "Avg attendees / event",
            value: data.attendance?.avgAttendees,
            format: (v) => Number(v ?? 0).toFixed(1)
          }
        ]}
      />

      <div className="admin-report-grid admin-report-grid-3">
        <ChartCard title="By lifecycle status" isEmpty={byStatus.length === 0}>
          <CategoryColumn data={byStatus} colorMap={STATUS_COLORS} />
        </ChartCard>
        <ChartCard title="By risk level" isEmpty={byRisk.length === 0}>
          <RoseChart
            {...commonChartTheme({
              data: byRisk,
              xField: "label",
              yField: "value",
              seriesField: "label",
              color: ({ label }) => STATUS_COLORS[label] || REPORT_COLORS[0],
              radius: 0.9,
              innerRadius: 0.2,
              height: 220,
              legend: { position: "bottom" }
            })}
          />
        </ChartCard>
        <ChartCard title="Leader voting state" isEmpty={leaderVoting.length === 0}>
          <CategoryPie data={leaderVoting} />
        </ChartCard>
      </div>

      <div className="admin-report-grid admin-report-grid-2">
        <ChartCard title="Upcoming events" isEmpty={!data.upcoming || data.upcoming.length === 0}>
          <ol className="admin-report-top-list admin-report-top-list-compact">
            {(data.upcoming || []).slice(0, 8).map((event, idx) => (
              <li key={event.id || idx}>
                <span className="admin-report-top-rank">
                  <CalendarOutlined />
                </span>
                <div className="admin-report-top-meta admin-report-top-meta-wide">
                  <strong>{event.title || "Untitled event"}</strong>
                  <span>
                    {event.scheduledFor
                      ? new Date(event.scheduledFor).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })
                      : "Date TBD"}
                  </span>
                </div>
                <Tag color={STATUS_COLORS[event.status] ? undefined : "default"} style={{
                  backgroundColor: STATUS_COLORS[event.status],
                  color: "#fff",
                  borderColor: "transparent"
                }}>
                  {titleCaseEnum(event.status)}
                </Tag>
              </li>
            ))}
          </ol>
        </ChartCard>
        <ChartCard title="Top event leaders" isEmpty={!data.topLeaders || data.topLeaders.length === 0}>
          <ol className="admin-report-top-list">
            {(data.topLeaders || []).slice(0, 10).map((leader, idx) => {
              const user = leader.user || {};
              return (
                <li key={user.id || idx}>
                  <span className="admin-report-top-rank">{idx + 1}</span>
                  <Avatar size={32}>
                    {(user.name || user.username || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <div className="admin-report-top-meta">
                    <strong>{user.name || user.username || "Anonymous"}</strong>
                    {user.username ? <span>@{user.username}</span> : null}
                  </div>
                  <span className="admin-report-top-value">
                    <TrophyOutlined /> {formatCount(leader.count)}
                  </span>
                </li>
              );
            })}
          </ol>
        </ChartCard>
      </div>

      <ChartCard title="New events over time" size="wide" isEmpty={series.length === 0}>
        <TimeSeriesArea data={series} color="#7e5bd0" height={260} />
      </ChartCard>
    </section>
  );
}

export function EngagementPanel({ data, bucket, loading }) {
  if (!data) return null;
  const issueVotes = data.issueVotes || {};
  const leaderVotes = data.leaderVotes || {};
  const byVoterRole = objectToChartData(issueVotes.byVoterRole);

  const seriesIssue = buildTimeSeries(issueVotes.timeSeries, bucket, "Issue votes");
  const seriesLeader = buildTimeSeries(leaderVotes.timeSeries, bucket, "Leader votes");
  const combinedSeries = [...seriesIssue, ...seriesLeader];

  return (
    <section className="admin-report-section">
      <header className="admin-report-section-heading">
        <h2>Engagement</h2>
        <p>Issue votes and leader-voting participation.</p>
      </header>

      <MetricRow
        loading={loading}
        items={[
          { label: "Total issue votes", value: issueVotes.total },
          { label: "Issue votes in period", value: issueVotes.newInPeriod },
          { label: "Total leader votes", value: leaderVotes.total },
          { label: "Leader votes in period", value: leaderVotes.newInPeriod }
        ]}
      />

      <div className="admin-report-grid admin-report-grid-2">
        <ChartCard title="Voter commitment mix" description="How voters described their intent." isEmpty={byVoterRole.length === 0}>
          <CategoryPie
            data={byVoterRole.map((d) => ({ label: titleCaseEnum(d.label), value: d.value }))}
            color={[STATUS_COLORS.INTERESTED, STATUS_COLORS.GOING, STATUS_COLORS.WANT_TO_LEAD]}
          />
        </ChartCard>
        <ChartCard title="Votes over time" size="default" isEmpty={combinedSeries.length === 0}>
          <LineChart
            {...commonChartTheme({
              data: combinedSeries,
              xField: "bucketLabel",
              yField: "value",
              seriesField: "series",
              smooth: true,
              color: ["#e75f1b", "#176b5c"],
              point: { size: 3, shape: "circle" },
              height: 220,
              legend: { position: "top" }
            })}
          />
        </ChartCard>
      </div>
    </section>
  );
}

export function FeedbackPanel({ data, bucket, loading }) {
  if (!data) return null;
  const byType = objectToChartData(data.byType);
  const byStatus = objectToChartData(data.byStatus);
  const series = buildTimeSeries(data.timeSeries, bucket, "New feedback");

  return (
    <section className="admin-report-section">
      <header className="admin-report-section-heading">
        <h2>Feedback</h2>
        <p>Suggestions, bug reports, questions — and how quickly they reach resolution.</p>
      </header>

      <MetricRow
        loading={loading}
        items={[
          { label: "Total feedback", value: data.total },
          { label: "New in period", value: data.newInPeriod },
          { label: "Pending triage", value: data.pending },
          {
            label: "Avg rating",
            value: data.avgRating,
            format: (v) =>
              v === null || v === undefined ? "—" : `${Number(v).toFixed(2)} / 5`,
            hint: `${formatCount(data.ratingsSubmitted)} ratings`
          }
        ]}
      />

      <div className="admin-report-grid admin-report-grid-3">
        <ChartCard title="By type" isEmpty={byType.length === 0}>
          <CategoryPie data={byType.map((d) => ({ label: titleCaseEnum(d.label), value: d.value }))} />
        </ChartCard>
        <ChartCard title="By status" isEmpty={byStatus.length === 0}>
          <CategoryColumn
            data={byStatus.map((d) => ({ label: titleCaseEnum(d.label), value: d.value }))}
            colorMap={Object.fromEntries(
              Object.entries(STATUS_COLORS).map(([k, v]) => [titleCaseEnum(k), v])
            )}
          />
        </ChartCard>
        <ChartCard title="Rating snapshot" description="Average rating from submitted feedback.">
          <GaugeChart
            {...commonChartTheme({
              percent: Math.max(0, Math.min(1, Number(data.avgRating || 0) / 5)),
              range: { color: "l(0) 0:#d94646 0.4:#d99800 1:#176b5c" },
              indicator: { pointer: { style: { stroke: "#17211c" } }, pin: { style: { stroke: "#17211c" } } },
              statistic: {
                title: { offsetY: -28, formatter: () => "Avg rating" },
                content: {
                  style: { fontSize: "22px", fontWeight: 800 },
                  formatter: () =>
                    data.avgRating === null || data.avgRating === undefined
                      ? "—"
                      : `${Number(data.avgRating).toFixed(2)} / 5`
                }
              },
              height: 220
            })}
          />
        </ChartCard>
      </div>

      <ChartCard title="Feedback over time" size="wide" isEmpty={series.length === 0}>
        <TimeSeriesArea data={series} color="#d99800" height={240} />
      </ChartCard>
    </section>
  );
}

export function ApplicationsPanel({ data, bucket, loading }) {
  if (!data) return null;
  const funnel = data.funnel || {};
  const funnelData = [
    { stage: "Submitted", value: funnel.submitted || 0 },
    { stage: "Under review", value: funnel.underReview || 0 },
    { stage: "Shortlisted", value: funnel.shortlisted || 0 },
    { stage: "Onboarding", value: funnel.onboarding || 0 },
    { stage: "Active", value: funnel.active || 0 }
  ].filter((d) => d.value > 0);

  const byRole = objectToChartData(data.byRole);
  const byStatus = objectToChartData(data.byStatus);
  const series = buildTimeSeries(data.timeSeries, bucket, "New applications");

  return (
    <section className="admin-report-section">
      <header className="admin-report-section-heading">
        <h2>Applications</h2>
        <p>Contributor application pipeline and role breakdown.</p>
      </header>

      <MetricRow
        loading={loading}
        items={[
          { label: "Total applications", value: data.total },
          { label: "New in period", value: data.newInPeriod },
          { label: "Active contributors", value: funnel.active },
          { label: "Rejected", value: funnel.rejected }
        ]}
      />

      <div className="admin-report-grid admin-report-grid-2">
        <ChartCard
          title="Onboarding funnel"
          description="From application submitted through active contributor."
          isEmpty={funnelData.length === 0}
        >
          <FunnelChart
            {...commonChartTheme({
              data: funnelData,
              xField: "stage",
              yField: "value",
              color: ["#3e7bb5", "#7e5bd0", "#176b5c", "#d99800", "#3fa46a"],
              height: 280,
              label: {
                formatter: (datum) => `${datum.stage}: ${formatCount(datum.value)}`
              },
              tooltip: { showMarkers: false }
            })}
          />
        </ChartCard>
        <ChartCard title="By status" isEmpty={byStatus.length === 0}>
          <CategoryColumn
            data={byStatus.map((d) => ({ label: titleCaseEnum(d.label), value: d.value }))}
            colorMap={Object.fromEntries(
              Object.entries(STATUS_COLORS).map(([k, v]) => [titleCaseEnum(k), v])
            )}
          />
        </ChartCard>
      </div>

      <ChartCard title="Applications by role" size="wide" isEmpty={byRole.length === 0}>
        <HorizontalBar
          data={byRole
            .map((d) => ({ label: titleCaseEnum(d.label), value: d.value }))
            .sort((a, b) => b.value - a.value)}
          height={Math.max(240, byRole.length * 32)}
          color="#28a18a"
        />
      </ChartCard>

      <ChartCard title="Applications over time" size="wide" isEmpty={series.length === 0}>
        <TimeSeriesArea data={series} color="#28a18a" height={240} />
      </ChartCard>
    </section>
  );
}

export function UploadsPanel({ data, bucket, loading }) {
  if (!data) return null;
  const byFileType = objectToChartData(data.byFileType);
  const linked = data.byLinkedEntity || {};
  const linkedData = [
    { label: "Linked to issue", value: linked.withIssue || 0 },
    { label: "Linked to event", value: linked.withEvent || 0 },
    { label: "Linked to user", value: linked.withUser || 0 },
    { label: "Orphaned", value: linked.orphan || 0 }
  ];
  const confirmedData = [
    { label: "Confirmed", value: data.confirmed || 0 },
    { label: "Unconfirmed", value: data.unconfirmed || 0 }
  ];
  const series = buildTimeSeries(data.timeSeries, bucket, "New uploads");

  return (
    <section className="admin-report-section">
      <header className="admin-report-section-heading">
        <h2>Uploads</h2>
        <p>Media storage — file mix, confirmation state, and linkage to other resources.</p>
      </header>

      <MetricRow
        loading={loading}
        items={[
          { label: "Total uploads", value: data.total },
          { label: "New in period", value: data.newInPeriod },
          {
            label: "Total storage",
            value: data.totalSizeBytes,
            format: (v) => formatBytes(v)
          },
          {
            label: "Avg file size",
            value: data.avgSizeBytes,
            format: (v) => formatBytes(v)
          },
          {
            label: "Confirmed",
            value: data.confirmed,
            hint: `${formatCount(data.unconfirmed)} pending confirmation`
          }
        ]}
      />

      <div className="admin-report-grid admin-report-grid-3">
        <ChartCard title="By file type" isEmpty={byFileType.length === 0}>
          <CategoryPie
            data={byFileType.map((d) => ({ label: titleCaseEnum(d.label), value: d.value }))}
            color={[STATUS_COLORS.IMAGE, STATUS_COLORS.VIDEO, STATUS_COLORS.DOCUMENT, STATUS_COLORS.OTHER]}
          />
        </ChartCard>
        <ChartCard title="Confirmation state" isEmpty={!data.total}>
          <CategoryPie data={confirmedData} color={["#176b5c", "#d99800"]} />
        </ChartCard>
        <ChartCard title="Linked to" description="Which entity owns the upload.">
          <HorizontalBar data={linkedData} height={220} color="#3e7bb5" />
        </ChartCard>
      </div>

      <ChartCard title="Uploads over time" size="wide" isEmpty={series.length === 0}>
        <TimeSeriesArea data={series} color="#5f7269" height={240} />
      </ChartCard>
    </section>
  );
}

export function GeographicPanel({ data, loading }) {
  if (!data) return null;
  const issuesMuni = (data.issuesByMunicipality || []).map((row) => ({
    label: row.municipality || "Unknown",
    value: Number(row.count) || 0
  }));
  const eventsMuni = (data.eventsByMunicipality || []).map((row) => ({
    label: row.municipality || "Unknown",
    value: Number(row.count) || 0
  }));
  const issuesWard = (data.issuesByWard || []).map((row) => ({
    label: `${row.municipality || "Unknown"} — Ward ${row.ward || "?"}`,
    value: Number(row.count) || 0
  }));

  return (
    <section className="admin-report-section">
      <header className="admin-report-section-heading">
        <h2>Geographic distribution</h2>
        <p>Where issues are reported and where events take place.</p>
      </header>

      <div className="admin-report-grid admin-report-grid-2">
        <ChartCard title="Issues by municipality" isEmpty={issuesMuni.length === 0}>
          <BarList items={issuesMuni} valueLabel="issues" />
        </ChartCard>
        <ChartCard title="Events by municipality" isEmpty={eventsMuni.length === 0}>
          <BarList items={eventsMuni} valueLabel="events" />
        </ChartCard>
      </div>

      <ChartCard title="Issues by ward" size="wide" isEmpty={issuesWard.length === 0}>
        <BarList items={issuesWard} valueLabel="issues" />
      </ChartCard>
    </section>
  );
}
