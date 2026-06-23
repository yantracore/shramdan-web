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

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

// App language state uses "np" for Nepali; "ne" accepted defensively (the
// `<html lang>` / API locale form). Either renders the count in Devanagari.
function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np" && language !== "ne") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function fill(template, values) {
  return Object.entries(values).reduce(
    (out, [key, val]) => out.split(`{${key}}`).join(val),
    String(template ?? "")
  );
}

/* Builds the antd `rules` arrays + inline hints for the issue title and
 * description from a locale's message templates, so every issue form (public
 * reporter, member edit, admin create/edit) enforces the SAME floors from one
 * place. `messages` supplies the templates ({n} = the limit, {c}/{w} = the
 * char/word minimums in the hint); counts are localised to `language`.
 *
 * Required + whitespace fire first (validateFirst on the Form.Item keeps only
 * the first failure visible), then the min-char and min-word floors. */
export function buildIssueTextRules(messages, language) {
  const tl = ISSUE_TEXT_LIMITS.title;
  const dl = ISSUE_TEXT_LIMITS.description;
  const nd = (n) => localizeDigits(n, language);
  const m = messages || {};

  return {
    titleRules: [
      { required: true, whitespace: true, message: m.titleRequired },
      {
        validator: minCharsValidator(
          tl.minChars,
          fill(m.titleMinChars, { n: nd(tl.minChars) })
        )
      },
      {
        validator: minWordsValidator(
          tl.minWords,
          fill(m.titleMinWords, { n: nd(tl.minWords) })
        )
      }
    ],
    descriptionRules: [
      { required: true, whitespace: true, message: m.descriptionRequired },
      {
        validator: minCharsValidator(
          dl.minChars,
          fill(m.descriptionMinChars, { n: nd(dl.minChars) })
        )
      },
      {
        validator: minWordsValidator(
          dl.minWords,
          fill(m.descriptionMinWords, { n: nd(dl.minWords) })
        )
      }
    ],
    titleHint: m.titleHint
      ? fill(m.titleHint, { c: nd(tl.minChars), w: nd(tl.minWords) })
      : undefined,
    descriptionHint: m.descriptionHint
      ? fill(m.descriptionHint, { c: nd(dl.minChars), w: nd(dl.minWords) })
      : undefined
  };
}
