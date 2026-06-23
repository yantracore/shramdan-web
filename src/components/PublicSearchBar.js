"use client";

import { FilterOutlined, SearchOutlined } from "@ant-design/icons";

// Search + filter-toggle bar shared by /issues and /events. Lifted from the
// homepage hero (HomeSearchView) so the listing pages own the search box now.
// Purely presentational: each page wires its own query state, submit handler,
// and `filtersOpen` toggle for the detailed filter panel that sits below it.
//
// `value`/`onChange`  — controlled search text.
// `onSubmit`          — form submit (page applies the query).
// `onToggleFilters`   — flips the detailed filter panel open/closed.
// `filtersOpen`       — current panel state (drives aria-expanded + active style).
// `labels`            — { searchPlaceholder, searchAria, filtersLabel, submitAria }.
export function PublicSearchBar({
  value,
  onChange,
  onSubmit,
  onToggleFilters,
  filtersOpen,
  labels
}) {
  const t = labels || {};
  return (
    <form className="public-search-bar" role="search" onSubmit={onSubmit}>
      <label className="public-search-input">
        <SearchOutlined aria-hidden="true" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
