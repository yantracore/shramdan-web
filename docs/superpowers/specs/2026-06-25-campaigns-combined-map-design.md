# /campaigns Combined Map — Design

**Date:** 2026-06-25
**Polish item:** `[ ] P1 [from 1.1] Combined map on /campaigns (issues + events with coords)` — the `/issues` map was dropped when the list pages merged into `/campaigns`. Restore a unified map of the **current filtered results**.

## Goal

Add a map view to `/campaigns` that plots the **currently filtered** campaign feed — issues *and* events together — on one interactive Leaflet map, without disturbing the existing split list + preview surface.

## Key insight (what already exists)

The hard part is already built and only needs wiring:

- **`EventMap`** (`src/components/EventMap.js`) is already a *combined* map: its default export accepts both `entries` (events, each `{ event, status }`) **and** `issues` (raw issues), rendering `EventMarker` + the shared `IssueMarker` in one cluster. The home map already uses it this way (`HomeSearchView.js`).
- **`EventMapBlock`** (`src/components/EventMapBlock.js`) is the `next/dynamic` `{ ssr: false }` wrapper with a skeleton — required because Leaflet touches `window`. Reuse it; do not import `EventMap` directly.
- **Copy already exists:** `copy[lang].homeSearch.map` carries `statusLabels.{live,upcoming,past}`, `viewDetail`, `fullscreenOpen`, `fullscreenClose`; `homeSearch.mapEyebrow` + `homeSearch.mapEmpty` exist too. `/campaigns` already binds `homeSearch`.
- **Feed shape:** `useCampaignFeed` returns `items: { kind: "issue"|"event", status, id, data }[]`. `campaignVisualStatus(status)` maps a campaign status → `open|upcoming|live|past` (events only ever resolve to `upcoming|live|past`, which is exactly what `EventMarker` expects).

## Approach (chosen: View toggle, List ⇄ Map)

A `Segmented` toggle next to the status chips switches the body between the existing **list+preview** and a **full-width map** of the same filtered results. Chosen over a map-band-above-list (eats vertical space) and map-replaces-preview (needs marker↔selection sync that `EventMap` does not support today).

### New component — `src/components/CampaignsMap.js`

A small, well-bounded wrapper so the 656-line `CampaignsListClient` stays lean and the feed→map mapping is isolated and independently readable.

- **Props:** `{ items, language, content /* issuesCopy */, mapCopy /* homeSearch.map */, emptyLabel /* homeSearch.mapEmpty */ }`
- **Behavior:** split `items` by `kind`:
  - events → `{ event: it.data, status: campaignVisualStatus(it.status) }` → `entries`
  - issues → `it.data` → `issues`
- Renders `EventMapBlock` with `entries`, `issues`, `issuesContent={content}`, `t={mapCopy}`, `language`, a tall `height`, `interactive`, `enableFullscreen`, and the fullscreen labels from `mapCopy`.
- If neither list has any coord-bearing item, render the `emptyLabel` caption instead of an empty map (matches the home `mapEmpty` treatment). `EventMap` already filters out items lacking finite lat/lng, so no extra guarding is needed beyond the all-empty case.

### Changes to `CampaignsListClient.js`

- New `view` state (`"list" | "map"`), default `"list"`, **synced to `?view=map`** via the existing `applyFilters`/URL pattern (shareable, consistent with `status`/`category`/`sel`). `view` is *not* a filter, so add it through the same `URLSearchParams` plumbing without resetting the visible window.
- Add a `Segmented` toggle (NP: **सूची / नक्सा**, EN: **List / Map**) in the toolbar, beside the status chips.
- When `view === "map"`: render `<CampaignsMap items={filteredItems} … />` in place of the `events-split` section. The search chip, status chips, search row, and filter panel stay visible above it so filtering still drives the map. Loading → existing skeleton path (or a map skeleton via `EventMapBlock`'s own `loading`).
- When `view === "list"`: unchanged.

### Copy / i18n

- Add `viewList` / `viewMap` labels to `PAGE_COPY` (NP: सूची / नक्सा — these are view names, not actions, so plain nouns, not `-ने` form).
- Reuse `homeSearch.map`, `homeSearch.mapEmpty` for the map itself — no new strings there.

## Edge cases

- **Zero mapped results** (filtered set has no coords): show `mapEmpty` caption, not a blank map.
- **Loading:** `EventMapBlock` shows its shimmer skeleton; the page's `isInitialLoad` still gates the list path.
- **SSR:** never import `EventMap` directly in the page — only via `EventMapBlock`.
- **Mobile:** full-width map with `enableFullscreen`; toggle remains reachable. Map is independent of the mobile list↔detail drill-in (`mobileView`), which only applies to the list view.
- **Back/forward:** `?view=` re-syncs like the other params.

## Out of scope (logged separately if wanted)

- Marker → list-card selection sync (would need an `onSelect` on `EventMap`).
- Cross-kind sort, DRAFT card polish, real cursor pagination — already separate P2 backlog items.

## Verification

Drive `/campaigns` in a real browser (Playwright):
1. `/campaigns?view=map` renders a map with **both** issue and event pins (status filter `all`).
2. Toggle सूची ⇄ नक्सा flips the body and updates the URL.
3. Changing the status filter re-plots the map (e.g. `?status=OPEN&view=map` shows only issue pins).
4. Fullscreen opens/closes; Escape exits.
5. A filter combination with no coords shows the empty caption, not a blank map.
6. Mobile width: map is full-width and usable.
Screenshot each key state before calling it done.
