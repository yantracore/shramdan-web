import { getJson } from "@/lib/apiClient";

export const REPORT_SECTIONS = [
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

export const REPORT_BUCKETS = ["day", "week", "month"];

function toIsoOrNull(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value.toISOString === "function") return value.toISOString();
  return null;
}

export function buildReportParams(filters = {}) {
  const params = {};

  const fromIso = toIsoOrNull(filters.fromDate);
  const toIso = toIsoOrNull(filters.toDate);
  if (fromIso) params.fromDate = fromIso;
  if (toIso) params.toDate = toIso;

  if (filters.bucket && REPORT_BUCKETS.includes(filters.bucket)) {
    params.bucket = filters.bucket;
  }

  if (Array.isArray(filters.sections) && filters.sections.length) {
    params.sections = filters.sections.join(",");
  }

  if (filters.topN) {
    const n = Number(filters.topN);
    if (Number.isFinite(n) && n >= 1 && n <= 50) {
      params.topN = String(Math.round(n));
    }
  }

  const stringFilters = [
    "municipality",
    "ward",
    "userRole",
    "userVerified",
    "userIsOAuth",
    "issueStatus",
    "issueCategory",
    "eventStatus",
    "eventRiskLevel",
    "eventLeaderVotingStatus",
    "voterRole",
    "feedbackType",
    "feedbackStatus",
    "applicationRole",
    "applicationStatus",
    "uploadFileType",
    "uploadIsConfirmed",
    "uploadLinkedTo"
  ];

  stringFilters.forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== "") {
      params[key] = String(value);
    }
  });

  return params;
}

export async function fetchReport(filters = {}) {
  const params = buildReportParams(filters);
  const response = await getJson("/reports", { params, requireAuth: true });
  return response?.data ?? null;
}

// Public community-impact report — a curated, PII-free subset of the admin
// report. Backend exposes it to ANY signed-in user (not fully public), so
// callers must degrade gracefully when the viewer is logged out (401).
// Shape mirrors fetchReport but omits feedback/applications/uploads and
// per-user emails. See GET /api/v1/reports/public.
export const PUBLIC_REPORT_SECTIONS = [
  "overview",
  "community",
  "issues",
  "events",
  "engagement",
  "geographic"
];

export async function fetchPublicReport(filters = {}) {
  const params = buildReportParams(filters);
  const response = await getJson("/reports/public", { params, requireAuth: true });
  return response?.data ?? null;
}

export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || Number.isNaN(Number(bytes))) return "—";
  const value = Number(bytes);
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let unitIndex = -1;
  let scaled = value;
  do {
    scaled /= 1024;
    unitIndex += 1;
  } while (scaled >= 1024 && unitIndex < units.length - 1);
  return `${scaled.toFixed(scaled >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatPercent(value, options = {}) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "—";
  const { decimals = 1, withSign = false } = options;
  const n = Number(value);
  const fixed = n.toFixed(decimals);
  if (withSign && n > 0) return `+${fixed}%`;
  return `${fixed}%`;
}

export function formatCount(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString("en-US");
}

export function getDeltaTrend(percent) {
  if (percent === undefined || percent === null || Number.isNaN(Number(percent))) return "flat";
  const n = Number(percent);
  if (n > 0.5) return "up";
  if (n < -0.5) return "down";
  return "flat";
}

export function formatBucketLabel(bucket, value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  if (bucket === "day") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (bucket === "week") {
    return `Wk ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  if (bucket === "month") {
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString("en-US");
}
