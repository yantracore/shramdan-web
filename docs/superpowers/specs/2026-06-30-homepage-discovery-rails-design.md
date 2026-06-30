# Homepage Discovery Rails — Design Spec

**Date:** 2026-06-30
**Status:** Approved (design), pending implementation plan
**Surface:** Public homepage (`/`) — bilingual EN + NE

## Problem

The homepage's "Nearby issues" section ([StreamList.js](../../../src/components/StreamList.js))
is a flat grid of issue cards with a two-button header (geolocation "Show nearby" + "View all").
We want the homepage to be a **discovery** surface that surfaces campaigns across their
lifecycle, browsable Netflix-style.

A naive "one horizontal rail per lifecycle status" (OPEN / DRAFT / SCHEDULED / ACTIVE / COMPLETED)
was rejected: status is our backend lifecycle, not the user's mental model; several statuses share
the same user intent; sparse/empty rails look broken on a thin staging DB; six stacked rails impose
two-axis scroll fatigue; and it duplicates the `/campaigns` status-filter page.

## Decision

Replace the flat nearby grid with **intent-grouped horizontal rails**, reusing the existing
[CampaignCard.js](../../../src/components/CampaignCard.js) thumbnail. The coverflow hero
([EventsHomeRail.js](../../../src/components/EventsHomeRail.js)) above stays unchanged.

### Rails (in order)

| # | NE title | EN title | Buckets (status) | View-all link | Render when |
|---|----------|----------|------------------|---------------|-------------|
| 1 | तपाईं नजिकैका अभियान | Near you | all kinds, distance-sorted | `/campaigns` | always |
| 2 | अहिले र चाँडैका अभियान | Happening now & soon | ACTIVE + SCHEDULED | `/campaigns?status=ACTIVE` | items ≥ 1 |
| 3 | साथ खोज्दै | Needs your support | OPEN + DRAFT | `/campaigns?status=OPEN` | items ≥ 1 |
| 4 | भइसकेका काम | Impact so far | COMPLETED | `/campaigns?status=COMPLETED` | items ≥ 1 |

- Each rail shows **max 10** cards.
- Each rail header: left = eyebrow + `<h2>` title; right = a single CTA `सबै हेर्ने →` / `View all →`
  (agentive `-ने` form per NP button convention). No other buttons.
- Status string values are the canonical ones from [campaignStatus.js](../../../src/lib/campaignStatus.js):
  `OPEN | DRAFT | SCHEDULED | ACTIVE | COMPLETED`. Labels reuse `CAMPAIGN_STATUS_LABELS`.

## Components

### `CampaignRail.js` (new, reusable)

A single horizontally-scrollable rail. Used by all four sections.

- **Slider:** Swiper (already a dependency, `^12.1.4`) with `Navigation` (prev/next arrows),
  `Keyboard`, and `A11y` modules. **Not** `EffectCoverflow` — this is a flat Netflix row.
- **Peek:** responsive `slidesPerView` so adjacent cards are partly visible
  (≈ `1.2 / 2.2 / 3.2 / 4.2` across the existing breakpoints `<640 / 640–1023 / 1024–1279 / ≥1280`).
- **Edge vanish:** CSS `mask-image` linear-gradient fade on the rail's left/right edges so cards
  dissolve at the boundary (combined with Swiper's overflow clip). Fade suppressed at the true start/end.
- **No autoplay** (browse rail, not a hero). Honors `prefers-reduced-motion` (instant slide, no momentum flourish).
- Renders `null` when it receives 0 items (caller can also guard).
- Props: `{ title, eyebrow, viewAllHref, viewAllLabel, items, language, distanceByKey? }`.
  Each item renders a `CampaignCard` (passing `distanceKm` when provided).

### `HomeDiscoveryRails.js` (new) — section container

Replaces the `<StreamList … defaultMode="issue" />` usage in
[HomeSearchView.js](../../../src/components/HomeSearchView.js). Owns the data hook and renders the
four `CampaignRail`s in order, omitting rails 2–4 when empty.

## Data layer

### `useHomeRails.js` (new hook)

Returns `{ near, happening, support, impact, loading, error }` where each rail value is an array of
normalized campaign entries (`{ kind, status, id, data, latitude, longitude }`), already capped at 10.

- Fetch all five stages **in parallel** (`Promise.allSettled`), reusing the existing fetch logic in
  [useCampaignFeed.js](../../../src/lib/useCampaignFeed.js) / [eventsApi.js](../../../src/lib/eventsApi.js):
  OPEN → `GET /issues?status=OPEN`, the rest → `GET /events?status=<S>`. Province/district scoping
  passed through where available.
- Bucketing:
  - `happening` = ACTIVE then SCHEDULED (active first, then soonest), slice 10.
  - `support` = OPEN then DRAFT (by voteCount / recency), slice 10.
  - `impact` = COMPLETED (most recent first), slice 10.
  - `near` = every fetched entry that has lat/lng, distance-sorted, slice 10.

### Location handling (`near` rail)

- Uses the existing [useGeolocation](../../../src/lib/useGeolocation.js) hook (`{ position, … }`)
  already wired in providers.
- **If `position` is available:** sort `near` by ascending distance (reuse `distanceKmOrNull`),
  pass `distanceKm` to each card so the "Nearby / X km away" chip shows.
- **If not:** the `near` rail still renders the same campaigns ordered by relevance/recency, with no
  distance chips and **no extra location button** (the removed "Show nearby" button is not
  reintroduced now; it can be added back later if desired).

## Removed / changed

- [HomeSearchView.js](../../../src/components/HomeSearchView.js): swap the `<StreamList … defaultMode="issue" />`
  block for `<HomeDiscoveryRails … />`.
- [StreamList.js](../../../src/components/StreamList.js): the old nearby header, its two buttons, and the
  flat `.home-for-you-grid` are no longer used by the homepage. StreamList may remain for other callers;
  if the homepage was its only consumer, it is removed in a follow-up (verify usages first — do not
  delete blindly).
- New CSS: `src/styles/campaign-rail.css` for rail layout, arrows, and edge mask. Reuse existing
  `home-for-you-header` / `campaign-card` styles where possible.

## Copy

| Key | NE | EN |
|-----|----|----|
| rail1 title | तपाईं नजिकैका अभियान | Near you |
| rail2 title | अहिले र चाँडैका अभियान | Happening now & soon |
| rail3 title | साथ खोज्दै | Needs your support |
| rail4 title | भइसकेका काम | Impact so far |
| view-all CTA | सबै हेर्ने | View All |

(Exact eyebrow strings finalized during implementation, sourced from `siteContent.js`. Brand renders
as श्रमदान in NE.)

## Testing / verification

- Lint + build pass.
- Browser-verify (Playwright) on the running dev app at the homepage:
  - Rails render in order with peek + working prev/next arrows; edge fade visible.
  - Empty status buckets hide their rail (no empty rails).
  - Each rail capped at 10 cards; View-all links resolve to the correct `/campaigns?status=` filter.
  - Keyboard arrows move the focused rail; `prefers-reduced-motion` disables momentum.
  - NE locale shows Devanagari titles; EN shows Title-Case CTA.

## Out of scope

- Backend changes (frontend-only, per Issue↔Event convergence direction).
- Re-adding an explicit geolocation request button.
- Touching the coverflow hero rail.
