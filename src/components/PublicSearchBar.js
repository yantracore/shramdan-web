"use client";

import { useEffect, useRef, useState } from "react";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";

// Search + filter-toggle bar shared by /campaigns, /issues and /events. Lifted
// from the homepage hero (HomeSearchView) so the listing pages own the search
// box now.
//
// The live typing state lives HERE, not in the parent page. That matters: each
// listing page renders a heavy tree (cards, preview pane, map, chip counts), so
// holding the keystroke-by-keystroke value up there made every letter
// reconcile the whole thing — the "laggy while typing" feel. Keeping it local
// means a keystroke re-renders only this small bar; the parent only hears the
// committed query.
//
// Committing is debounced so search-as-you-type fires once typing settles
// (`debounceMs`), not on every letter — except clearing, which commits
// instantly (an empty box should feel immediate), and Enter / the search
// button, which flush the current text right away.
//
// `value`            — the committed query (source of truth, e.g. filters.q).
//                      External changes (clear chip, URL restore, browser back)
//                      flow back into the box.
// `onSearch`         — called with the trimmed query when it commits.
// `debounceMs`       — idle delay before a typed query commits (default 300).
// `onToggleFilters`  — flips the detailed filter panel open/closed.
// `filtersOpen`      — current panel state (drives aria-expanded + active style).
// `labels`           — { searchPlaceholder, searchAria, filtersLabel, submitAria }.

const DEFAULT_DEBOUNCE_MS = 300;

export function PublicSearchBar({
  value,
  onSearch,
  onToggleFilters,
  filtersOpen,
  labels,
  debounceMs = DEFAULT_DEBOUNCE_MS
}) {
  const t = labels || {};
  const committed = value ?? "";

  const [text, setText] = useState(committed);
  const timerRef = useRef(null);
  // Always call the latest onSearch / latest committed value without making the
  // handlers depend on them (so an inline `onSearch` closure over fresh filters
  // is fine — we never capture a stale one).
  const onSearchRef = useRef(onSearch);
  const committedRef = useRef(committed);
  useEffect(() => {
    onSearchRef.current = onSearch;
    committedRef.current = committed;
  });

  // Adopt the committed value when it changes from the OUTSIDE (cleared via the
  // chip, restored from the URL, browser back). We skip when it already matches
  // what's typed — an echo of our own commit must not yank the cursor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText((prev) => (prev.trim() === committed.trim() ? prev : committed));
  }, [committed]);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  // Clear any pending debounce when the bar unmounts.
  useEffect(() => clearTimer, []);

  const commit = (next) => {
    clearTimer();
    const trimmed = next.trim();
    if (trimmed === committedRef.current.trim()) return;
    committedRef.current = trimmed;
    onSearchRef.current?.(trimmed);
  };

  const handleChange = (event) => {
    const next = event.target.value;
    setText(next);
    clearTimer();
    if (next.trim() === "") {
      // Clearing (the input's native ✕, or a manual wipe) commits immediately —
      // no reason to make an empty list wait out the debounce.
      commit("");
      return;
    }
    timerRef.current = setTimeout(() => commit(next), debounceMs);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    commit(text); // Enter / the search button flush the current text now.
  };

  return (
    <form className="public-search-bar" role="search" onSubmit={handleSubmit}>
      <label className="public-search-input">
        <SearchOutlined aria-hidden="true" />
        <input
          type="search"
          value={text}
          onChange={handleChange}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchAria}
          autoComplete="off"
        />
      </label>
      <button
        type="button"
        className={`public-search-filters${filtersOpen ? " is-active" : ""}`}
        aria-label={t.filtersLabel}
        title={t.filtersLabel}
        aria-expanded={filtersOpen}
        onClick={onToggleFilters}
      >
        <FilterOutlined aria-hidden="true" />
        <span>{t.filtersLabel}</span>
      </button>
      <button
        type="submit"
        className="public-search-submit"
        aria-label={t.submitAria}
      >
        <SearchOutlined aria-hidden="true" />
      </button>
    </form>
  );
}
