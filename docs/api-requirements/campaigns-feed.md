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

**Spec status:** `shipped (list + counts); map still proposed`
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

## 3. `GET /campaigns/map` — lightweight markers — PROPOSED (under discussion)

> **Do not build yet.** The map cannot paginate, and "zoom in to load more"
> would make the on-screen totals wrong, so we are deliberately choosing a
> different shape. Leading proposal below; to be confirmed before implementation.

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
- `useCampaignCounts` drops its capped list-length counting for `GET /campaigns/counts`.
- `CampaignsMap` consumes `GET /campaigns/map` + client clustering instead of the
  full in-memory feed.

---

## Recent changes

- `2026-07-02` — **ordering regression flagged:** `status=all` no longer comes
  back lifecycle-grouped (see the ⚠️ callout under "Ordering") — needs a backend
  fix or an explicit contract update.
- `2026-07-02` — **breaking pagination swap on prod:** `GET /campaigns` dropped
  `cursor` (now a 400 validation error) in favour of `page` (integer) +
  `data.pagination {page, limit, total, totalPages, hasNext, hasPrev}`. Frontend
  `useCampaignFeed` migrated same day. Spec updated to match what shipped.
- `2026-06-30` — initial draft. Specifies unified paginated feed, exact counts,
  and the proposed lightweight-markers map endpoint (map shape pending discussion).
