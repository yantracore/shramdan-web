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

export function getIssueCoverImageUrl(issue) {
  if (!issue) return null;
  const uploads = Array.isArray(issue.uploads) ? issue.uploads : [];
  if (issue.coverImageId) {
    const match = uploads.find((upload) => upload?.id === issue.coverImageId);
    if (match?.url) return match.url;
  }
  const raw = issue.coverImage;
  if (typeof raw === "string" && raw) return raw;
  if (raw && typeof raw === "object" && typeof raw.url === "string" && raw.url) return raw.url;
  return getFirstIssueImage(issue)?.url || null;
}

// Backend stores the issue title/description as a translations[] array
// keyed by locale ("en" / "ne"). The frontend uses "np" as the language
// code, so we map "np" → "ne" when picking. Fallback chain:
//   wanted locale → English → Nepali → first available → top-level title.
// Top-level `title`/`description` are kept as a fallback so dummy data
// or older API responses without translations still render.
export function localizeIssue(issue, language) {
  if (!issue) return issue;
  const translations = Array.isArray(issue.translations) ? issue.translations : [];
  if (translations.length === 0) return issue;
  const wantedLocale = language === "np" ? "ne" : "en";
  const wanted = translations.find((entry) => entry?.locale === wantedLocale);
  const enEntry = translations.find((entry) => entry?.locale === "en");
  const neEntry = translations.find((entry) => entry?.locale === "ne");
  const picked = wanted || enEntry || neEntry || translations[0];
  return {
    ...issue,
    title: picked?.title || issue.title || "",
    description: picked?.description || issue.description || ""
  };
}
