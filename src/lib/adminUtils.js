export const APPLICATION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "ONBOARDING",
  "ACTIVE",
  "REJECTED"
];

export const FEEDBACK_STATUSES = ["NEW", "REVIEWED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const ISSUE_STATUSES = [
  "OPEN",
  "EVENT_SCHEDULED",
  "COMPLETED",
  "REJECTED",
  "DUPLICATE"
];

export const ISSUE_CATEGORIES = [
  "ROADSIDE",
  "VACANT_LAND",
  "RIVERBANK",
  "DRAINAGE",
  "PARK_PUBLIC_SPACE",
  "HIKING_TRAIL",
  "OTHER"
];

export const ISSUE_STATUS_COLORS = {
  OPEN: "blue",
  EVENT_SCHEDULED: "gold",
  COMPLETED: "green",
  REJECTED: "red",
  DUPLICATE: "default"
};

export const EVENT_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED"
];

export const EVENT_STATUS_COLORS = {
  DRAFT: "default",
  SCHEDULED: "blue",
  ACTIVE: "cyan",
  PAUSED: "orange",
  COMPLETED: "green",
  CANCELLED: "red"
};

export const EVENT_RISK_LEVELS = ["NORMAL", "ELEVATED", "HIGH"];

export const EVENT_RISK_COLORS = {
  NORMAL: "default",
  ELEVATED: "orange",
  HIGH: "red"
};

export const LEADER_VOTING_STATUS_COLORS = {
  NONE: "default",
  OPEN: "blue",
  PENDING_ADMIN: "orange",
  CLOSED: "green"
};

export function formatEnum(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function formatCoordinates(latitude, longitude) {
  if (latitude == null || longitude == null) return "";
  return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
}

export function getResponseData(response, fallback) {
  return response?.data ?? fallback;
}

export function getListItems(response) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export function buildEnumOptions(values) {
  return values.map((value) => ({ label: formatEnum(value), value }));
}

export function isImageUpload(upload) {
  if (!upload || !upload.url) return false;
  if (upload.fileType === "IMAGE") return true;
  if (typeof upload.mimeType === "string" && upload.mimeType.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(upload.url);
}

export function getFirstIssueImage(issue) {
  const uploads = Array.isArray(issue?.uploads) ? issue.uploads : [];
  return uploads.find(isImageUpload) || null;
}
