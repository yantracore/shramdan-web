// Shared, framework-light helpers for the /discussions surface.
//
// Extracted in the 2026-06-18 reusability makeover: the list page, the list
// card, the category rail, the new-topic modal, and (Phase 2) the detail
// page all read the SAME formatting + category metadata from here instead of
// re-declaring localizeDigits / formatRelative / the threshold constant in
// every file. Pure functions, no React, no side effects — safe to copy into
// any other surface that needs the same grammar.

// Feature-proposal promotion threshold. Mirrors getFeatureProposalThreshold()
// in src/lib/discussionsStub.js and the backend contract in
// docs/api-requirements/feature-votes.md.
export const THRESHOLD_VOTES = 20;

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

// "12" → "१२" when language is Nepali; untouched otherwise.
export function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// Replace a single "{n}" token in a copy template with a localized number.
export function formatTokenized(template, n, language) {
  if (!template) return "";
  return template.replace("{n}", localizeDigits(n, language));
}

// Relative time, bilingual. "just now" / "5m" / "3h" / "2d".
export function formatRelative(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const np = language === "np";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return np ? "भर्खरै" : "just now";
  if (diffMin < 60) return np ? `${localizeDigits(diffMin, "np")} मि. अघि` : `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return np ? `${localizeDigits(diffHr, "np")} घन्टा अघि` : `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return np ? `${localizeDigits(diffDay, "np")} दिन अघि` : `${diffDay}d ago`;
}

// ── Category taxonomy ────────────────────────────────────────────────
//
// Single source of truth for the left rail, the card chip, and the
// new-topic modal. `key` matches DiscussionTopic.category in the backend
// contract (docs/api-requirements/discussions.md). The "all" pseudo-entry
// is the rail's default and matches every topic.
//
// Labels live in siteContent.discussions.categories[key] for bilingual
// support; icons are mapped by `iconKey` inside DiscussionCategoryRail (kept
// out of this pure module so it stays React-free and copy-pasteable).

export const ALL_CATEGORY = "all";

export const DISCUSSION_CATEGORIES = [
  { key: "all", iconKey: "all", accent: "var(--primary)" },
  { key: "DESIGN", iconKey: "design", accent: "#a855f7" },
  { key: "FRONTEND", iconKey: "frontend", accent: "#2563eb" },
  { key: "BACKEND", iconKey: "backend", accent: "#0891b2" },
  // "OTHER" is the catch-all: a residual bucket for anything outside the dev
  // lanes. When one theme piles up here it can graduate to its own category.
  { key: "OTHER", iconKey: "other", accent: "#64748b" }
];

// Default catch-all bucket for topics with no (or a retired) category.
export const DEFAULT_CATEGORY = "OTHER";

// Lookup helper for chips/cards that have only a category key.
export function categoryMeta(key) {
  return DISCUSSION_CATEGORIES.find((c) => c.key === key) ?? null;
}

// True when a topic belongs to the selected rail category. "all" is a wildcard;
// topics with no category fall under COMMUNITY so nothing ever disappears.
export function topicMatchesCategory(topic, categoryKey) {
  if (!categoryKey || categoryKey === ALL_CATEGORY) return true;
  const tc = topic.category || DEFAULT_CATEGORY;
  return tc === categoryKey;
}
