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

// Statuses an admin may set manually via PATCH /issues/{id}/status. Excludes
// EVENT_SCHEDULED (driven by the scheduling flow, not a manual override) — the
// backend enum for that endpoint is OPEN | COMPLETED | REJECTED | DUPLICATE.
export const ISSUE_MODERATION_STATUSES = [
  "OPEN",
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

// Hues align with the campaign lifecycle state colours
// (docs/design/06-state-color-system.md): OPEN = indigo (geekblue), a promoted
// EVENT_SCHEDULED issue = amber/planning (gold), COMPLETED = green.
export const ISSUE_STATUS_COLORS = {
  OPEN: "geekblue",
  EVENT_SCHEDULED: "gold",
  COMPLETED: "green",
  REJECTED: "red",
  DUPLICATE: "default"
};

// Maps a backend validation path root (POST/PATCH /issues) onto the matching
// form field, so a server-side error lands inline on the right input. Used with
// applyApiErrorsToForm. Payload-only aliases: `coverImageId` is the cover
// upload, `uploadIds` the extra-images picker; `language` is sent alongside the
// edited text but has no visible field, so its errors fall to the form level.
//
// IssueForm (admin + member edit) drops the map pin into a single composite
// `location` field, so latitude/longitude errors both land there.
export const ISSUE_FORM_FIELD_MAP = {
  title: "title",
  description: "description",
  category: "category",
  addressText: "addressText",
  latitude: "location",
  longitude: "location",
  municipality: "municipality",
  ward: "ward",
  coverImageId: "cover",
  uploadIds: "additionalImages",
  language: null
};

// Real, rendered field names on the single-screen IssueForm. Any backend key
// outside this set surfaces at the form level instead of being pinned to a
// field that never renders.
export const ISSUE_FORM_FIELDS = [
  "cover",
  "additionalImages",
  "title",
  "description",
  "category",
  "location",
  "addressText",
  "municipality",
  "ward"
];

// Public reporter (/issues/new): same `location` picker, but with no
// municipality/ward inputs — those errors fall to the form level.
export const ISSUE_PICKER_FIELD_MAP = {
  ...ISSUE_FORM_FIELD_MAP,
  municipality: null,
  ward: null
};

export const ISSUE_PICKER_FIELDS = [
  "cover",
  "additionalImages",
  "title",
  "description",
  "category",
  "location",
  "addressText"
];

// Admin create (IssueMultiStepForm): separate latitude/longitude number inputs
// rather than a map picker, so those errors land on their own fields.
export const ISSUE_STEP_FIELD_MAP = {
  ...ISSUE_FORM_FIELD_MAP,
  latitude: "latitude",
  longitude: "longitude"
};

export const ISSUE_STEP_FIELDS = [
  "cover",
  "additionalImages",
  "title",
  "description",
  "category",
  "addressText",
  "latitude",
  "longitude",
  "municipality",
  "ward"
];

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

// Aligned to the backend enum (PATCH /events/{id} riskLevel + the demo data
// and IncidentPanel, which already used these). The previous NORMAL/ELEVATED/
// HIGH values were drift and left WATCH/URGENT/CRITICAL tags colourless.
export const EVENT_RISK_LEVELS = ["NORMAL", "WATCH", "URGENT", "CRITICAL"];

export const EVENT_RISK_COLORS = {
  NORMAL: "green",
  WATCH: "gold",
  URGENT: "orange",
  CRITICAL: "red"
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

export function isUsableImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url, "https://shramdan.org");
    return parsed.hostname !== "cdn.shramdan.org";
  } catch {
    return true;
  }
}

// Old seed batches wrote covers on the dead cdn.shramdan.org host; the 20
// affected records can't be repaired via the API (PATCH /issues/{id} is
// reporter-only — even ADMIN gets a 500; backend fix requested 2026-07-02 in
// docs/api-requirements/issues.md). Until the data is fixed server-side, a
// dead cover is swapped for a category-matched local demo photo — never an
// empty placeholder. Only applies when a cover EXISTS but its host is dead;
// genuinely image-less records keep their normal skeleton.
const CATEGORY_FALLBACK_COVERS = {
  DRAINAGE: "/images/demo-events/muglin-drains.jpg",
  ROADSIDE: "/images/demo-events/galchhi-roadside.jpg",
  RIVERBANK: "/images/demo-events/melamchi-riverbank.jpg",
  PARK_PUBLIC_SPACE: "/images/demo-events/ratnapark-cleanup.jpg",
  HIKING_TRAIL: "/images/demo-events/antu-trail.jpg",
  VACANT_LAND: "/images/demo-events/bardia-buffer.jpg",
  OTHER: "/images/demo-events/school-paint.jpg"
};

export function getCategoryFallbackImage(category) {
  return CATEGORY_FALLBACK_COVERS[category] || CATEGORY_FALLBACK_COVERS.OTHER;
}

// null/undefined → null (no image); usable URL → as-is; dead-host URL →
// category-matched local demo cover.
export function resolveUsableImage(url, category) {
  if (!url) return null;
  return isUsableImageUrl(url) ? url : getCategoryFallbackImage(category);
}

export function getFirstIssueImage(issue) {
  const uploads = Array.isArray(issue?.uploads) ? issue.uploads : (Array.isArray(issue?.images) ? issue.images : []);
  return uploads.find((upload) => isImageUpload(upload) && isUsableImageUrl(upload.url)) || null;
}

export function getIssueCoverImageUrl(issue) {
  if (!issue) return null;
  const uploads = Array.isArray(issue.uploads) ? issue.uploads : (Array.isArray(issue.images) ? issue.images : []);
  if (issue.coverImageId) {
    const match = uploads.find((upload) => upload?.id === issue.coverImageId);
    if (isUsableImageUrl(match?.url)) return match.url;
  }
  const raw = issue.coverImage;
  if (typeof raw === "string" && isUsableImageUrl(raw)) return raw;
  if (raw && typeof raw === "object" && isUsableImageUrl(raw.url)) return raw.url;
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
