# 09 · Home: the activity funnel is the map's filter

**Date:** 2026-07-02
**Status:** shipped

## The idea

The home page deliberately offers no filter panel — browsing lives on
`/campaigns`. But the five-step activity funnel (खुला → तयारीमा → मिति तय →
चलिरहेको → सम्पन्न) sits directly above the overview map, and each step *is* a
status. So the funnel doubles as the map's one allowed filter: tap a stage to
see only those campaigns on the map, tap it again to clear. A powerful-but-
minimal slice of the campaigns page's map browsing, without importing its
filter UI.

## Decisions

1. **One marker source everywhere.** The home map now consumes the same
   ultra-minimal `GET /campaigns?mode=minimal&limit=1000` payload as the
   `/campaigns` map, through the same `useCampaignMarkers` hook and the same
   `CampaignsMap` component. The old home-only plumbing (full
   `GET /issues?limit=100` fetch + reusing the rail's event buckets) is gone.
   `mode=minimal` stays map-only — no list/card surface may adopt it.

2. **Two filter sources, never crossed.**
   - `/campaigns`: filters live in the URL (status in the path, the rest in the
     query). `useCampaignMarkers()` reads them itself — unchanged.
   - Home: exactly one filter (status), owned by component state and passed as
     an explicit `filters` override — the hook then ignores the URL entirely.
   - Persistence is per-surface: home stores its pick in
     `sessionStorage["shramdan:home:map-status"]`; the campaigns page keeps its
     own `shramdan:campaigns:list-state` + URL. Neither reads the other's key,
     so a stage picked on home can never re-filter `/campaigns`, and vice versa.

3. **Funnel gains a third mode.** `ActivityStatsRow` was static (home) or
   link-out (`/issues`, `/events`). New filter mode: pass `onSelectStatus` +
   `activeStatus` and each step renders as a toggle `<button aria-pressed>`;
   the row hands back `null` when the active step is clicked again. The pressed
   step wears a ring in its own state colour (`currentColor` from the marker's
   state ink — see 06-state-color-system).

4. **The map section always renders.** It is the funnel's canvas; a stage with
   zero mappable campaigns shows the `mapEmpty` copy (and a shimmer while the
   minimal fetch is in flight) at the same clamped height, so toggling never
   makes the panel jump.

## Known trade-offs

- Returning to home with a stored filter fires one unfiltered minimal fetch
  before the post-mount sessionStorage restore refires it filtered. Accepted:
  the payload is tiny and gating the first fetch would complicate hydration.
- ~~The funnel's *counts* still come from capped `GET /issues?limit=100` +
  `listAllEvents()` folding, so they can drift from the map's true totals
  (observed live: funnel OPEN=42 vs 44 markers).~~ Fixed same day: the rail now
  reads `GET /campaigns/counts` (exact totals, one call), and its numbers match
  the map's markers stage for stage.
