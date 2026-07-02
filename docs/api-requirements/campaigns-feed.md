# Campaigns feed (unified list · counts · map)

> The `/campaigns` page is one surface over the whole campaign lifecycle:
> **OPEN** (an issue still gathering support) → **DRAFT / Planning** → **SCHEDULED**
> → **ACTIVE** → **COMPLETED**. Today the frontend builds this list itself: it
> fires five separate capped requests (`/issues?status=OPEN&limit=50` plus four
> `/events?status=…&limit=50`), concatenates them in lifecycle order, and then
> fakes "infinite scroll" by slicing the already-loaded array client-side. No
> request is sent while the user scrolls, the list silently stops at the per-status
> cap, and the status-chip counts are likewise capped at 100 — so neither the feed
> nor the badge numbers are real beyond the cap. This file specifies the backend
> support needed to make the feed, its counts, and its map mode correct at scale.

**Spec status:** `shipped (list + counts + minimal map mode)`
**Last updated:** 2026-07-02
**Owner:** Pranish (backend)

---

## Why a unified endpoint

The feed is a single ordered stream that mixes **two entity types** (an OPEN
issue and four event stages) under one lifecycle ordering. A merged, ordered
stream like this cannot be cursor-paginated from the client across five
independent endpoints — there is no stable cross-endpoint cursor, and "load the
next 6" has no server meaning. The clean fix is one server-side endpoint that
merges, orders, filters, counts, and paginates. The frontend then becomes a thin
consumer: fetch page → render → fetch next page at the scroll sentinel.

Three endpoints are requested, sharing one filter vocabulary:

1. `GET /campaigns` — the paginated list feed (this is the load-more fix).
2. `GET /campaigns/counts` — exact per-stage totals for the chip row.
3. `GET /campaigns/map` — lightweight markers for map mode (**see "Map mode" —
   shape still under discussion, do not build until confirmed**).

---

## 1. `GET /campaigns` — paginated feed

Returns a single lifecycle-ordered list of mixed items.

### Item shape

Each item is card-ready so the list never has to refetch per row. Items are
discriminated by `kind`.

- **kind** (`enum`, required, public) — `issue` | `event`.
- **id** (`string`, required, public) — issue id when `kind=issue`, event id when `kind=event`.
- **status** (`enum`, required, public) — lifecycle stage: `OPEN` (issues only), `DRAFT`, `SCHEDULED`, `ACTIVE`, `COMPLETED`.
- **title** (`string`, required, public) — localized per `Accept-Language`/`?language=`. For events this must resolve from the linked issue's translations (today the embedded issue ships without `translations`, forcing a slug fallback — see [events.md](events.md) P1).
- **addressText** (`string`, optional, public) — display address.
- **category** (`enum`, optional, public) — issue category.
- **thumbnailUrl** (`string`, optional, public) — cover image; for events, resolved from the linked issue's cover (the frontend currently does this enrichment with extra `/issues` round-trips — fold it server-side).
- **latitude / longitude** (`number`, optional, public) — for the preview/map.
- **provinceId / districtId** (`string`, optional, public) — for filter echo.
- **createdAt** (`datetime`, public) — issues: report time (drives "25 d ago").
- **scheduledAt** (`datetime`, optional, public) — events from SCHEDULED on.
- **completedAt** (`datetime`, optional, public) — COMPLETED events.
- **voteCount** (`number`, optional, public) — issues: supporter count (drives "2 supporters").
- **participantCount** (`number`, optional, public) — events: joined workers.
- **issueId** (`string`, optional, public) — on event items, the originating issue (already present on event payloads).

### Per-viewer participation echo — REQUESTED (P1, 2026-07-02)

**Gap (verified live 2026-07-02):** authenticated `GET /campaigns?mode=maximum`
carries `myVote` (`{ voterRole, eventRole }` — the caller's *vote* on the
backing issue) but **no participation echo for the event itself**. Joining an
event directly (`POST /events/{id}/participants`) never sets `myVote`, so a
member who joined an ACTIVE/SCHEDULED event sees a plain "Join" button on every
campaigns-feed card after a refresh — while `GET /events` list items already
embed exactly the needed field.

**Request:** mirror the `GET /events` behaviour — for authenticated callers,
add `viewerParticipation` (the caller's `EventParticipant` row
`{ id, eventId, role, status, joinedAt, confirmedAt, checkedInAt, note }`, or
`null`) to every **event-stage** item in `mode=maximum`. Omit for anonymous
callers and for `OPEN` items, same as `/events`.

**Interim frontend workaround (shipped 2026-07-02, remove when this lands):**
`useCampaignFeed` fires one bulk sweep over `GET /events?status=DRAFT|SCHEDULED|ACTIVE`
(3 requests, limit 100 each) and decorates feed items with the embedded
`viewerParticipation`. Correct but wasteful — and silently incomplete beyond
100 events per stage.

### Ordering

For `status=all`, lifecycle order, then within each stage:

```
OPEN       → voteCount desc        (most-supported first)
DRAFT      → natural / createdAt desc
SCHEDULED  → scheduledAt asc       (soonest first)
ACTIVE     → natural
COMPLETED  → completedAt desc      (most-recent first)
```

For a single `status=…`, just that stage in its own order above. Paging must be
stable within this composite ordering across the stage boundaries.

> **⚠️ OPEN REGRESSION (2026-07-02, for Pranish):** since the `page` swap the
> live feed is no longer lifecycle-grouped — `status=all` page 1 comes back as
> `COMPLETED COMPLETED ACTIVE … DRAFT OPEN DRAFT OPEN …` (statuses interleaved
> throughout). The frontend renders stage dividers off status transitions, so
> the "all" list now shows dozens of repeated stage separators. Please restore
> the composite lifecycle ordering above (or tell us the intended new ordering
> so the frontend can adapt deliberately).

### Pagination

**Page-based (shipped 2026-07-02, replacing the cursor draft).** The first
iteration (2026-07-01) used an opaque `cursor`; the backend swapped it for
`page` (integer, 1-based) the next day. Request `limit` (default **20**, max
**100**) and `page`. Response:

```json
{
  "data": {
    "items": [ /* items */ ],
    "pagination": {
      "page": 1, "limit": 20, "total": 97, "totalPages": 33,
      "hasNext": true, "hasPrev": false
    }
  }
}
```

`pagination.hasNext === false` on the last page — the single signal the
frontend needs to stop the loader. Sending the removed `cursor` param now
fails validation (`400 Unrecognized key: "cursor"`), so it must never be sent.

### Filters

All optional; absence means "no constraint". `counts` and `map` must accept the
**same** set so all three surfaces agree.

- **status** (`enum`) — `all` (default) | `OPEN` | `DRAFT` | `SCHEDULED` | `ACTIVE` | `COMPLETED`.
- **category** (`enum`) — issue category.
- **provinceId** (`string`).
- **districtId** (`string`).
- **q** (`string`) — case-insensitive text match over title + address.
- **language** (`string`) — `np` | `en`; selects the localized `title`.

### RBAC

`Public`.

---

## 2. `GET /campaigns/counts` — exact per-stage totals

Powers the status-chip badges. Must be a real `COUNT` (not a capped list length —
today's badges are capped at 100 and wrong beyond that). Honors the **same
filters** as the feed (`category`, `provinceId`, `districtId`, `q`) so a badge
always matches the size of the list that clicking it would produce.

Response:

```json
{ "OPEN": 0, "DRAFT": 0, "SCHEDULED": 0, "ACTIVE": 0, "COMPLETED": 0, "total": 0 }
```

`total` is the sum across stages (i.e. the `status=all` feed size).

### RBAC

`Public`.

---

## 3. Lightweight markers — SHIPPED as `GET /campaigns?mode=minimal`

> **Shipped (2026-07-02), with one shape change from the proposal:** instead of
> a separate `/campaigns/map` path, the backend added `mode=minimal` to the list
> endpoint. Same idea, same filters, same "ship every matching marker in one
> cheap payload" contract (tiny even at `limit=1000`). The original proposal is
> kept below as the rationale record.
>
> **Frontend consumers (map-only, by design):** the `/campaigns` map view
> (`useCampaignMarkers` — URL-driven filters) and, since 2026-07-02, the home
> overview map (same hook, explicit `status`-only filter driven by the activity
> funnel). No other surface may use `mode=minimal`.

**Proposal:** one un-paginated endpoint that returns **all** matching campaigns
as the smallest possible record, cheap enough to ship thousands in a single
response. The frontend plots them and clusters client-side (a cluster bubble
shows the exact count of markers it contains, because the client holds every
marker — so numbers stay accurate at every zoom, unlike a viewport/bbox query).

Per-marker shape (minimal):

```json
{ "id": "…", "kind": "issue|event", "status": "OPEN|…", "lat": 0, "lng": 0, "title": "…" }
```

Full detail for the preview pane is fetched lazily on marker click via the
existing `GET /issues/{id}` / `GET /events/{id}`.

Accepts the same filters as the feed. Rough size budget: ~80 bytes/marker →
10,000 markers ≈ 0.8 MB raw, ~150 KB gzipped — acceptable for a single fetch at
Nepal scale. A `bbox`/viewport parameter is noted as a **future escape hatch**
if marker volume ever outgrows a single payload; it is intentionally *not* in the
MVP because it breaks accurate totals.

### RBAC

`Public`.

---

## Migration notes (frontend side, after this lands)

- `useCampaignFeed` collapses from five fetches + client concat to one paginated
  `GET /campaigns`; the IntersectionObserver fetches the next page instead of
  slicing memory. ✅ (2026-07-01, moved to `page`-based 2026-07-02)
- The load-more spinner gets bound to a real `loadingMore` state and hidden when
  `pagination.hasNext === false` (fixes the perpetual spinner). ✅
- `useCampaignCounts` drops its capped list-length counting for `GET /campaigns/counts`. ✅
- `CampaignsMap` consumes the minimal marker payload + client clustering instead
  of the full in-memory feed. ✅ (2026-07-02, via `mode=minimal`; home overview
  map joined the same source the same day)
- `ActivityStatsRow` (the five-step funnel) swaps its client-side fold over
  `GET /issues?limit=100` + `listAllEvents()` for `GET /campaigns/counts`.
  ✅ (2026-07-02 — the fold was provably wrong live: OPEN read 42 vs 44 real,
  DRAFT read 0 vs 24 real)

---

## Recent changes

- `2026-07-02` — **map mode confirmed shipped + home adoption:** the proposed
  `/campaigns/map` landed as `mode=minimal` on the list endpoint; section 3
  updated to match. The home overview map now consumes it too (funnel-driven
  `status` filter only), replacing its old full `GET /issues?limit=100` fetch +
  event-bucket reuse.
- `2026-07-02` — **`viewerParticipation` embed requested (P1):** event-stage
  `mode=maximum` items need the caller's participation row so list cards can
  show "Joined as …" after a refresh (see the REQUESTED section under "Item
  shape"). Interim client-side bulk sweep over `GET /events` shipped same day.
- `2026-07-02` — **ordering regression flagged:** `status=all` no longer comes
  back lifecycle-grouped (see the ⚠️ callout under "Ordering") — needs a backend
  fix or an explicit contract update.
- `2026-07-02` — **breaking pagination swap on prod:** `GET /campaigns` dropped
  `cursor` (now a 400 validation error) in favour of `page` (integer) +
  `data.pagination {page, limit, total, totalPages, hasNext, hasPrev}`. Frontend
  `useCampaignFeed` migrated same day. Spec updated to match what shipped.
- `2026-06-30` — initial draft. Specifies unified paginated feed, exact counts,
  and the proposed lightweight-markers map endpoint (map shape pending discussion).
