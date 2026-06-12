# TV-App Pivot — Status Snapshot (2026-06-05)

> One-pager produced at the close of the autonomous batch session.
> Companion to [01-tv-app-pivot-plan.md](01-tv-app-pivot-plan.md) and the
> [2026-06-05 ADR](../decisions/2026-06-05-tv-like-app-pivot.md).
> Each phase row links to the headline commit on `stage`.

## All 9 phases — v0 LIVE on `stage`

| Phase | Slot | Status | Headline commits |
| --- | --- | --- | --- |
| 0 | Pre-pivot snapshot | ✓ done | `9d5606f` → `35d53af` (clean tree + spec docs) |
| 1 | Four-corner TV shell | ✓ done | `580c9b5` shell, `3b974c6` glass polish |
| 2 | Homepage = search surface | ✓ v0–v4 | `63fd42b` v0 hero + carousel · `6fcfcaa` v1 pills · `29dc760` v2 map · `3a82141` v3 for-you grid · `c335681` v4 geolocation |
| 2.x | Real text search (`?q=`) | ✓ done | `af45fd9` |
| 3 | Unified Layout Switching | ✓ v1 | Wired view layouts (list-preview, thumbnails grid, map-primary) conditionally on `/events` and `/issues` |
| 4 | Sticky-preview scroll trap | ✓ fix | `2bee9a5` (`overscroll-behavior: contain → auto`) |
| 5 | Page chrome shrink-down | ✓ v0 batch (9 pages) | `461d427` /events + /issues · `0012271` /me /calendar /impact /stories /ledger /feedback /polls |
| 6 | `/intro` = photo-driven chapters + HomeClient.js retired | ✓ done | `3d66f5b` intro page · copy + CSS pruned · brand intro link |
| 7 | Discussions Write Paths | ✓ v1 | Enabled compose/reply, anonymous posting, voting, and discussion-presence labels |
| 8 | Backend api-requirements specs | ✓ drafts | `57bf09e` discussions.md + feature-votes.md + members.md publicProfile extension |
| 9 | A11y + reduced-motion verify | ✓ pass | `90bfea8` (homepage + /intro → 0 violations) |

## Headline outcomes

- **Homepage.** No vertical scrollbar at first paint. Brand title + slogan → glassy search bar with filters chip + submit → 4-tab stats pills → decent-size Leaflet map of Nepal with cluster pins → event coverflow carousel (1/2/3/5/7 cards by viewport) → for-you grid with mode-tab events↔issues + silent geolocation request → "X km दूर" badge once granted.
- **Shell.** Four glass-edged corner chips (TL brand · TR settings + user · BL apps grid · BR FAB stack) flush to the screen walls with inward-rounded corners. Top-center pill nav (Home · Events · Issues · Feedback) at ≥ 1180px with first-session entrance cinematic gated by `sessionStorage` + `prefers-reduced-motion`. Mobile collapses to a 56px top bar + drawer + MobileBottomNav. `--corner-clear-zone` token replaces `--header-height` for sticky offsets across 5 consumer files.
- **Real search.** Homepage search box posts to `/events?q=…`. The events page reads the query, filters by title + addressText (Devanagari-safe substring), URL-syncs the parameter, and surfaces a "खोज्दै: X ×" chip with one-click clear.
- **Unified stream.** `<StreamList defaultMode="event">` renders the homepage's for-you feed; mode tabs flip in place to issues. Same compact glass cards for both kinds. /events and /issues still ship their own page experiences for v0; v1 will collapse both into the same component (note in plan).
- **/intro.** Two photo-driven chapters: "Five steps, one journey" (sourced from the existing `coreIdea` block — single source of truth) + "Community runs it" (three new tiles linking to /ledger and /learn). Fixed right-rail jump-nav at ≥ 1180px. Brochure cheese stripped; HomeClient.js deleted. Full copy/CSS prune complete.
- **/discussions + /members/[slug].** New community surfaces — read-only in v0, populated from `src/lib/discussionsStub.js` mock. Mode-tabbed list (All / General / Feature proposals), detail page with disabled composer, public member profile honouring an opt-in `publicProfilePreferences` shape. Anonymous topics have no profile click-through by design.
- **API contracts.** Three docs/api-requirements files drafted ahead of the backend: `discussions.md`, `feature-votes.md`, and a publicProfile extension to `members.md`. Together they cover every Phase 7 backend ask listed in the ADR.
- **Accessibility.** axe-core scan returns 0 violations on `/` and `/intro` after Phase 9 fixes (live-badge contrast + Swiper pagination target size).

## Cross-cutting principles applied throughout

- **CC-1 Glassiness** — every overlay surface (corner chips, pill nav, search bar, stats pills, map frame, for-you cards, mode tabs, discussion cards, member-profile hero, intro community tiles, intro jump-nav) uses `color-mix(var(--surface) 70%, transparent)` + `blur(18px) saturate(1.2)` + faint white top inset + `prefers-reduced-transparency` fallback.
- **CC-2 Representative Image** — every new image surface (carousel posters, for-you cards, intro photo steps, intro community tiles, member-profile avatars, discussion thread thumbs) renders against a real demo image. No "TODO image" placeholders.

## What's NOT done (v1 follow-ups, queued)

- **Phase 8 followups** — backend implementation of the three new specs; spec sweep against any UI fields the v1 work surfaces.

## Session telemetry

- Workflows run: 3 design workflows (Phase 5 audit, Phase 6 intro merge, Phase 7 discussions). 36 agents total across the three; ~1.5M subagent tokens; combined wall-clock under 25 min.
- Commits landed on `stage`: 30+ across the session (initial pivot ADR + plan, principles, Phase 1, full Phase 2 v0-v4, real search, Phase 3 v0, Phase 4 fix, Phase 5 batch, Phase 6 v0, Phase 7 v0, Phase 8 specs, Phase 9 a11y, cleanup pass).
- Branches: everything on `stage` per the project's branch workflow. Origin push deferred to a manual end-of-day sweep.
