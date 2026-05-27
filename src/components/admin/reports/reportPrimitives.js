"use client";

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MinusOutlined
} from "@ant-design/icons";
import { Skeleton, Tooltip } from "antd";
import {
  formatCount,
  formatPercent,
  getDeltaTrend
} from "@/lib/reportsApi";

export const REPORT_COLORS = [
  "#176b5c",
  "#e75f1b",
  "#3e7bb5",
  "#d99800",
  "#7e5bd0",
  "#28a18a",
  "#c64a6c",
  "#3fa46a",
  "#5f7269",
  "#d94646"
];

export function KpiTile({
  label,
  value,
  hint,
  delta,
  loading,
  accent,
  formatValue = formatCount,
  icon
}) {
  const trend = getDeltaTrend(delta);
  const trendIcon =
    trend === "up" ? <ArrowUpOutlined /> : trend === "down" ? <ArrowDownOutlined /> : <MinusOutlined />;

  return (
    <article
      className={`admin-report-kpi admin-report-kpi-${trend}`}
      style={accent ? { "--kpi-accent": accent } : undefined}
    >
      <header>
        {icon ? <span className="admin-report-kpi-icon">{icon}</span> : null}
        <span className="admin-report-kpi-label">{label}</span>
      </header>
      <div className="admin-report-kpi-value">
        {loading ? <Skeleton.Button active size="small" style={{ width: 96 }} /> : formatValue(value)}
      </div>
      {delta !== undefined && delta !== null ? (
        <Tooltip title="Change vs previous period of the same length.">
          <div className={`admin-report-kpi-delta is-${trend}`}>
            {trendIcon}
            <span>{formatPercent(delta, { decimals: 1, withSign: true })}</span>
          </div>
        </Tooltip>
      ) : null}
      {hint ? <p className="admin-report-kpi-hint">{hint}</p> : null}
    </article>
  );
}

export function ChartCard({
  title,
  description,
  size = "default",
  actions,
  loading,
  isEmpty,
  emptyHint = "No data available for the selected filters.",
  children
}) {
  return (
    <section className={`admin-report-card admin-report-card-${size}`}>
      <header>
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="admin-report-card-actions">{actions}</div> : null}
      </header>
      <div className="admin-report-card-body">
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} title={false} />
        ) : isEmpty ? (
          <div className="admin-report-card-empty">{emptyHint}</div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export function BarList({ items, valueLabel = "count", total, emptyHint = "No data." }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <div className="admin-report-card-empty">{emptyHint}</div>;
  }

  const computedMax = items.reduce((acc, item) => Math.max(acc, Number(item.value) || 0), 0);
  const max = (total ?? computedMax) || 1;

  return (
    <ul className="admin-report-bar-list">
      {items.map((item, idx) => {
        const value = Number(item.value) || 0;
        const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
        return (
          <li key={item.key || item.label || idx}>
            <div className="admin-report-bar-row">
              <span className="admin-report-bar-label" title={item.label}>
                {item.label}
              </span>
              <span className="admin-report-bar-value">
                {formatCount(value)}
                {item.suffix ? <span className="admin-report-bar-suffix">{item.suffix}</span> : null}
              </span>
            </div>
            <div className="admin-report-bar-track" aria-hidden="true">
              <span
                className="admin-report-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: item.color || REPORT_COLORS[idx % REPORT_COLORS.length]
                }}
              />
            </div>
            <span className="visually-hidden">
              {item.label}: {valueLabel} {value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function MetricRow({ items, loading }) {
  return (
    <div className="admin-report-metric-row">
      {items.map((m, idx) => (
        <div className="admin-report-metric" key={m.label || idx}>
          <span className="admin-report-metric-label">{m.label}</span>
          <strong className="admin-report-metric-value">
            {loading ? (
              <Skeleton.Button active size="small" style={{ width: 64 }} />
            ) : (
              (m.format || formatCount)(m.value)
            )}
          </strong>
          {m.hint ? <span className="admin-report-metric-hint">{m.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function objectToChartData(obj, { labelKey = "label", valueKey = "value" } = {}) {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => ({ [labelKey]: k, [valueKey]: Number(v) || 0 }));
}

export function objectToBarItems(obj, { transform } = {}) {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => ({
      label: transform ? transform(k) : k,
      key: k,
      value: Number(v) || 0
    }))
    .sort((a, b) => b.value - a.value);
}

export function titleCaseEnum(value) {
  if (!value) return "—";
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)(\w)/g, (_, p, c) => p + c.toUpperCase());
}
