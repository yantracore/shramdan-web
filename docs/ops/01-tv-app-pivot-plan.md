# TV-like App Pivot — Phased Work Plan

> Companion plan to the [2026-06-05 ADR](../decisions/2026-06-05-tv-like-app-pivot.md). The ADR captures *why* and *what's decided*; this file captures *the order of work and what each phase ships*.
>
> **Scope.** This pivot reshapes the public web surface. Admin control center and the future `/app` follow the same metaphor but are sequenced separately.
>
> **Expected length.** 10–50 working sessions. Each phase below is one or more sessions; phases can run partially in parallel where they don't fight each other.
>
> **Update protocol.** Mark phases `in progress` / `done` inline as work lands, append `← done: YYYY-MM-DD` like the master roadmap convention. Move newly discovered subtasks under the right phase; don't create a new top-level until a genuinely new theme appears.

---

## Cross-cutting design principles (apply to every phase below)

These are not phases — they are constraints every phase must honour. Each principle has its own memory entry; this section exists so the plan does not have to repeat them inside each phase.

### CC-1. Glassiness is the default for overlay surfaces

Any surface that sits *above* page content — corner-block chrome, the curved top-center pill nav, sticky filter bars, hover affordances on cards, sticky modal headers, search-box surrounds when floating over imagery — uses a glassy treatment by default. Reference recipe lives in the existing `.events-home-rail-poster-cta` class in [src/styles/live-events-rail.css](../../src/styles/live-events-rail.css) (`background: rgba(0, 0, 0, 0.42); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.22)`).

Phases that introduce a new overlay (Phase 1 corner blocks + pill nav, Phase 2 search-box surround, Phase 4 view-switch tab pill, Phase 5 sticky filter rows, Phase 7 discussion thread floats) all default to glass. Form inputs, dense data tables, and body cards in a list stay opaque — readability beats theatricality.

### CC-2. Representative Image, always (staging mode)

While the app is in staging mode, every image-bearing UI element renders a **real-looking demo image** — never a transparent placeholder, empty skeleton, or "no image" string. Existing demo assets live under [public/images/demo-events/](../../public/images/demo-events/); add to that folder (or a sibling like `demo-members/`, `demo-stories/`) whenever a new image-bearing surface ships.

Phases that introduce new image-bearing surfaces (Phase 4 thumbnails view, Phase 6 intro photo strip, Phase 7 member profile photos + discussion topic art) MUST ship with representative imagery committed under `public/images/`. A new surface without a representative image is not "done."

When the app flips out of staging (see [[project-api-base-url-staging]]), this constraint relaxes and real user-uploaded content takes over.

---

## Phase 0 — Pre-pivot snapshot ← done: 2026-06-05

Lock in the decision and clear the working tree so the next change is clearly pivot work, not leftover polish.

- [x] Commit pending in-flight work in clean clusters (API docs refresh, loginRedirect rollout, live-stream poster CTA, demo imagery) ← done: 2026-06-05
- [x] Capture pivot in auto-memory (`project_radical_pivot_tv_app`) ← done: 2026-06-05
- [x] ADR written ← done: 2026-06-05
- [x] This plan written ← done: 2026-06-05

---

## Phase 1 — TV layout primitives

Reshape the page chrome before reshaping any specific page. Every later phase depends on these primitives.

- [ ] Remove the full-width header background from `SiteShell`. The header band stops being a visual surface.
- [ ] Split header into four corner blocks: organization (top-left), user (top-right), app (bottom-left), `+`/quick-icons (bottom-right). Keep them position-sticky so they don't move with content scroll.
- [ ] Optional curved top-center pill nav (Home · Events · Issues · Join · Feedback · Login) for the largest screens only (`@media (min-width: 1440px)`). Animate in on first session load; respect `prefers-reduced-motion`.
- [ ] Tablet + mobile fallback: corners collapse into a single compact top bar with a drawer for nav.
- [ ] Visual verify in Playwright at three widths (desktop, tablet, mobile).

**Backend asks:** none.

---

## Phase 2 — Homepage as search surface

This is the headline change. Replace the current homepage with a Google-style landing — but **not** Google's centered-in-viewport layout. Search sits closer to the top edge so the **event carousel** can be the main highlight directly below it. The brand title + slogan share that hero band with the search box.

### Above-the-fold layout (विवेक 2026-06-05 clarifications)

```text
+--------------------------------------------------------------------------+
|  [corners + top-center pill nav]                                         |
|                                                                          |
|                       श्रमदान                                            |   <- brand title + slogan
|             "हाम्रो श्रम, हाम्रो समाज, हाम्रो भविष्य।"                       |       (small block above search)
|                                                                          |
|          [   🔍  search events / issues / places         ]  [filters]    |   <- search bar slightly above-center,
|                                                                          |       closer to top edge but not too close
|     [ EVENT CAROUSEL — main highlight, large posters, snap-scroll ]      |   <- THE main highlight below search
|     [   ◀  card  card  card  card  card  card  card  ▶   ]               |
|                                                                          |
+--------------------------------------------------------------------------+
```

- Search bar is **not exactly center** like Google — closer to top edge, ~20–28% from the top, so the carousel earns the eye.
- Brand title (श्रमदान / Shramdan) + slogan share the same vertical column as the search box; small typography so they don't outshine the search.
- The event carousel is the **single most important visual** on first paint. Re-use the existing poster card component (the one with the glassy "View Details" pill); only the count/scaling logic changes.
- Stats pills + map move **below** the carousel (still above the fold on tall screens; otherwise on first scroll).

### Carousel scaling by viewport (विवेक 2026-06-05)

Item count adapts to screen real estate. Use container queries (or width breakpoints if container queries aren't available):

| Viewport width | Visible items | Notes |
| --- | --- | --- |
| `< 600px` (mobile) | **1** | Existing behaviour. Snap-scroll, large poster. |
| `600–899px` (small tablet) | **2** | Optional intermediate; default to 1 if too tight. |
| `900–1279px` (tablet / small laptop) | **3** | Max for narrow desktops. |
| `1280–1599px` (HD / 1920×1080) | **3 to 5** | Test live; aim for cards that don't get squeezed. |
| `1600–2199px` (QHD 2K) | **5** | Comfortable proportion. |
| `≥ 2200px` (4K and above) | **up to 7** | Maximum density; no more. |

- Card aspect ratio stays fixed (taller-than-wide poster) so density change does not warp the artwork.
- No squeeze — if 5 cards at 1920px would force cards below ~280px wide, drop to 3.
- Carousel scroll is one-card-per-step on every viewport so peek-of-next-card stays consistent.

### Other Phase 2 mechanics (unchanged from original plan)

- [ ] Move current `HomeClient.js` content out — it becomes the source of the new `/intro` page (see Phase 6). Keep the file in git history; do not duplicate.
- [ ] New `/` (homepage):
  - [ ] No default vertical scrollbar in the above-the-fold viewport.
  - [ ] Brand title + slogan + search bar + filters button (top band).
  - [ ] Event carousel directly below — the main highlight; viewport-scaled count per the table above.
  - [ ] Stats pills row beneath the carousel, driven by the public reports API. Active pill highlighted. Clicking a pill scopes the stream + acts as a status filter extension.
  - [ ] Decent-size map below the pills.
  - [ ] On further scroll-down OR on a `Participate` click → reveal the curated for-you stream, ranked by location proximity (use the existing geolocation hook if it covers this; otherwise add one).
- [ ] Add a route guard so `/` does not 404 if the curated stream API is empty — show suggested events instead.
- [ ] Backend ask: confirm the public reports API exposes the counts we need for the pills (status × kind). Capture as `docs/api-requirements/reports.md` if missing.
- [ ] Visual verify with Playwright at 360px / 1280px / 1920px / 2560px / 3840px — assert carousel item count matches the table.

**Risks:** the current homepage carries SEO; ensure the new `/intro` ranks for the same terms (canonical + a JSON-LD update may be needed).

---

## Phase 3 — Unified Issues + Events stream component

The list-renderer used by the homepage scrolled section, `/events`, and `/issues` becomes one component with a tabbed Issue/Event switch.

- [x] Extract a single `<StreamList>` component that renders both. Inputs: `defaultMode: 'issue' | 'event'`, `maxItems`, `copy`, `language`. Compact grid layout; in-place mode-tab switch. ← done: 2026-06-05 (v0 ships in `src/components/StreamList.js`; replaces `HomeForYouStream` on the homepage)
- [ ] **Phase 3 v1**: Replace the current `/events` split-view body and the `/issues` body with `<StreamList>`. The two pages remain valid deep-link entry points but render the same component. (Deferred — both pages are ~900 lines with interconnected list/preview/map/filter logic; v1 is its own commit.)
- [ ] **Phase 3 v1**: Extend `<StreamList>` to accept `view: 'list' | 'thumbnails' | 'map'` and merge with existing EventListCard + IssueListCard + EventMap so the view-switch finally drives layout (currently still a placeholder on /events).
- [ ] **Phase 3 v1**: Persist support actions on issues that have already promoted to events, until the linked event finishes. Surface a small "supported via event" affordance.
- [ ] Stats pills become tabbed filter chips inside `<StreamList>`. (v0 keeps ActivityStatsRow as a separate row above the stream; v1 merges them.)

**Backend asks:**
- `docs/api-requirements/events.md` — confirm "supports continue until event finishes" semantics. Update if needed.
- Add to `docs/api-requirements/issues.md` (or `incidents.md`): a clear "promoted to event" field with the linked event id + status.

---

## Phase 4 — Three view modes (List · Thumbnails · Map)

- [ ] List view = the current split layout, polished. Tab control becomes the canonical view switcher.
- [ ] **Fix the sticky `.events-split-preview` scroll-pass-through bug.** When the user wheels over the preview and the preview is already at its end, the body must scroll. Currently the sticky preview traps wheel events. Likely an `overscroll-behavior` + `pointer-events` adjustment.
- [ ] Thumbnails view = smaller preview + two-row dense thumb grid. Same data shape; different layout primitive.
- [ ] Map view = existing map results screen, promoted from a separate route into a tab. On the homepage, map results appear below the map; on dedicated pages, map and list-of-results share the screen.
- [ ] View switch state is URL-synced (`?view=list|thumbs|map`) so it persists across refresh + share.

**Backend asks:** none beyond Phase 3.

---

## Phase 5 — App chrome shrink-down across all pages

Page-by-page audit to remove brochure-style chrome. Each row below is its own session-or-two.

- [ ] `/events` and `/issues` — tiny eyebrow, lean title/desc, compact filter row, single primary action (`Begin Shramdan Registration` on `/issues`).
- [ ] `/me`, `/me/preview`, `/me/applications`
- [ ] `/calendar`
- [ ] `/impact`
- [ ] `/stories`
- [ ] `/ledger`
- [ ] `/polls` + poll detail
- [ ] `/login` (already lean; verify intent banner placement)
- [ ] `/feedback` (creation path; see Phase 7 for the new community discussion list)

Pattern for every page: page-name + eyebrow + filters + actions occupy under 96px vertical on desktop. Content owns the screen below that.

---

## Phase 6 — New `/intro` page from the old homepage

> **Current state (2026-06-05):** Phase 2 v0 moved the new search-surface homepage to `/`. `HomeClient.js` is no longer rendered anywhere but is intentionally kept in the repo as **the canonical source for the photo-driven steps section** that this phase merges into `/intro`. The existing `/intro` route currently renders `IntroCinematic` (a 5-act narrative) — Phase 6 decides whether `IntroCinematic` stays, gets photo-stripped from `HomeClient`, or is replaced wholesale.

- [ ] Decide intro shape: keep `IntroCinematic` as-is and graft the photo-driven steps section in, OR replace `IntroCinematic` with a stripped-down `HomeClient`.
- [ ] Move the relevant sections of `HomeClient.js` body into `/intro` (the photo steps + community collaboration section; do NOT bring the brochure cheese).
- [ ] **Strip** sections: "join us" rally copy, government-partnership claims, "small hands together" duplicate, redundant "five steps one journey" duplicate.
- [ ] **Keep** the photo-driven steps section (the one with the actual photos of the steps) — this is the load-bearing reason `HomeClient.js` is still in the repo.
- [ ] **Add** a new section: community collaboration — maintenance, funding, non-profit framing, no-one-owns-it, all funds go to the work and the app itself.
- [ ] Add a fixed right-side jump navigation that lists the section titles and scrolls to each on click; highlight current section using `IntersectionObserver`.
- [ ] Link to `/intro` from a discreet corner of the new homepage (e.g. the org block in the top-left) so newcomers can still find the philosophy.
- [ ] **Delete `HomeClient.js`** as the final step of this phase — only after the photo-driven section has been confirmed live on `/intro`. Until then it stays.

---

## Phase 7 — Discussions + member profiles

The community self-evolution loop.

- [ ] **Member profiles.** Member icons in comments, rosters, contribution lists become click-throughs to `/members/[id]`. Public profile shows: display name (or anonymous), recent activity, supported issues, events participated, leader nominations, etc.
- [ ] **`/discussions` surface.** List of community topics. Two sub-streams: general topics, and feature proposals.
- [ ] **Feature voting.** Each proposal accepts upvotes. Threshold logic (configurable; start at `votes ≥ 20 AND distinct_supporters ≥ 10`) promotes the proposal to the roadmap as `[ ] ... ← promoted from discussion #N`.
- [ ] **Anonymity toggle** when posting feedback or starting a discussion.
- [ ] **Discussion presence on event pages.** Active thread count + last-activity timestamp on each event page, linking to the thread filtered by that event.

**Backend asks:**
- `docs/api-requirements/discussions.md` (new) — topic, message, vote, anonymity flag, link-to-entity (issue/event/null).
- `docs/api-requirements/members.md` — extend with `publicProfile` shape (display fields, opt-in toggle).
- `docs/api-requirements/feature-votes.md` (new) — proposal entity + vote semantics + promotion event.

---

## Phase 8 — Backend roll-up + spec sweep

After Phases 2–7 ship UI, do one sweep to ensure every `docs/api-requirements/*.md` file reflects what the UI actually consumes now.

- [ ] Re-run the API sync (`node scripts/refresh-api-docs.mjs`).
- [ ] Diff each updated file against current UI usage.
- [ ] Open backend-ready flags for everything where the spec is ready but the backend isn't.

---

## Phase 9 — Verification + polish

- [ ] Playwright sweep across every reshaped page at three widths.
- [ ] Reduced-motion audit on the new entrance animations (corner blocks, pill nav, stream reveal).
- [ ] Lighthouse run on the homepage; the no-scroll-on-first-paint thesis should pay off in CLS + LCP.
- [ ] Final visual pass — corner alignment, sticky behaviour, scroll-pass-through fix verified live.

---

## Open questions to resolve as we go

1. **Curated stream ranking** — proximity is the v1 signal. Should "support count" or "freshness" weight in? Decide after Phase 2 ships.
2. **Issue ↔ event lifecycle copy** — "support continues until event finishes" needs a single clear UI affordance. Mock options during Phase 3.
3. **Feature-voting threshold** — start at a guess; tune from real usage.
4. **Header on the smallest screens** — corner-blocks have no good mobile analogue. Single compact bar + drawer is the current plan; revisit during Phase 1.
5. **SEO continuity** for the `/` → `/intro` move. Need a canonical + redirect strategy decided before Phase 2 ships.
