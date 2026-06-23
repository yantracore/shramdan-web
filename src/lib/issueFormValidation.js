/* Front-end validation floors for the issue title + description fields.
 *
 * These block low-effort junk ("fix this", "asdf", a one-word title) without
 * frustrating a genuine reporter. The backend imposes no min-length contract on
 * these fields (see docs/api-requirements/issues.md), so this is purely a
 * client-side quality gate.
 *
 * Counting is language-agnostic:
 *  - words split on whitespace — Devanagari separates words with spaces just
 *    like Latin, so the same rule serves both locales.
 *  - characters count Unicode code points of the trimmed value. For Nepali that
 *    runs a touch high (matras count as their own code point), which only makes
 *    the minimum *easier* to clear — so a Devanagari report never gets falsely
 *    blocked for being "too short".
 *
 * Shared so the issue edit + admin create forms can adopt the same floors. */

export const ISSUE_TEXT_LIMITS = {
  title: { minChars: 10, minWords: 2, maxChars: 140 },
  description: { minChars: 25, minWords: 5, maxChars: 2000 }
};

export function countChars(value) {
  return Array.from(String(value ?? "").trim()).length;
}

export function countWords(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// Empty / whitespace-only values are left to the `required` rule, so the two
// rules don't both fire on a blank field — these only police real input.
function isEmpty(value) {
  return value == null || String(value).trim() === "";
}

export function minCharsValidator(min, message) {
  return (_rule, value) => {
    if (isEmpty(value) || countChars(value) >= min) return Promise.resolve();
    return Promise.reject(new Error(message));
  };
}

export function minWordsValidator(min, message) {
  return (_rule, value) => {
    if (isEmpty(value) || countWords(value) >= min) return Promise.resolve();
    return Promise.reject(new Error(message));
  };
}
