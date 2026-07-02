# Shramdaan Polish Backlog

> Sister document to [00-master-roadmap.md](00-master-roadmap.md). The roadmap tracks **what is left to ship** (discrete, binary). This file tracks **how shipped features can get better** (continuous, infinite).
>
> Polish never blocks new feature work, but it prevents shipped features from rotting. Keeping it separate keeps the roadmap focused.
>
> **This file is maintained by coding agents** — same protocol style as the roadmap.

## How To Read This File

Each polish item is a single-line entry under a phase section:

```
- [ ] P1 [from 1.1] Skeleton loader on /issues list — effort:S
- [x] P2 [from 0.3.3] Playlist autoplay next — effort:S ← done: 2026-05-26
- [-] P3 [from 1.2] Read-time indicator — effort:S *(dropped: not worth the complexity)*
```

### Fields

| Field | Meaning |
| --- | --- |
| `[ ]` `[~]` `[x]` `[-]` | Same markers as roadmap (pending / in progress / done / cancelled) |
| `P1` / `P2` / `P3` | Priority — see below |
| `[from X.Y]` | The roadmap leaf this polishes — cross-reference for context |
| Title | Terse, one line, what the improvement is |
| `effort:S/M/L` | Rough size — `S`: under 2h, `M`: half-day, `L`: full day or more |
| `← done: YYYY-MM-DD` | When closed (same convention as roadmap) |

### Priority levels

- **P1** — *Should do soon.* Visible user pain or rough edge that hurts every interaction.
- **P2** — *Worth a session.* Meaningful upgrade; not painful today but the feature feels unfinished without it.
- **P3** — *Nice-to-have.* Idle-time polish; do when bored, or cancel after long neglect.

### Scope rules

- **Only for shipped features.** If the underlying leaf in the roadmap is not `[x]` yet, finish shipping first. Don't pre-load polish for unshipped work.
- **Not for backend dependencies.** Items waiting on a backend endpoint belong in [09-backend-admin-gaps.md](../engineering/09-backend-admin-gaps.md), not here. This file is for things we can ship from the web app alone.
- **Cancel freely.** If a P3 sits untouched for ~60 days and nobody has pushed for it, mark `[-]` with a one-line reason. Polish that nobody misses isn't real polish.

## Agent Update Protocol

When you (the coding agent) are working in this repo:

1. **Notice an improvement?** Add a polish item immediately, in the right phase section. Judgment-call the priority (P1/P2/P3) and effort (S/M/L). Better noisy than missed.
2. **Flip to `[~]` before starting** a polish item.
3. **Flip to `[x]` with `← done: <today>`** when done. Same ISO date convention as the roadmap.
4. **When the user asks "what's next?"** read *both* the roadmap and this file, then propose a mix: highest-leverage unblocked roadmap leaf + any open P1 polish items. Polish never blocks features, but P1 polish should not pile up.
5. **Prune P3s periodically.** Old P3s with no advocate get cancelled, not promoted.
6. **No fixed numbering.** Add items wherever they fit in the phase section; IDs are not load-bearing here (unlike the roadmap's `X.Y` tree).

---

# Phases

> Sections mirror the roadmap's phases. Add a phase section the first time it gets a polish item.

## Phase 0 — Foundation

- [x] P2 [from 0.3.3] Playlist autoplay-next when a video ends — effort:S ← done: 2026-06-02 *(YouTube `videoseries?list=…` embed already chains the next video natively; added `&rel=0&modestbranding=1` so when one episode ends the next one in the series plays — not a YouTube-recommended unrelated video — and the player chrome stays understated.)*
- [ ] P3 [from 0.3] Subtle scroll-reveal animation on homepage sections — effort:M
- [x] P1 [from 0.4.1] Honeypot / spam protection on `/join` and `/feedback` — effort:S ← done: 2026-05-28 *(shared `Honeypot` component renders an off-screen `website` field with `tabIndex={-1}` + `autoComplete="off"`; page-level submit silently returns success without calling the API when the field is filled)*
- [x] P3 [from 0.4] Success state with shareable confirmation link — effort:S ← done: 2026-06-02 *(new shared `SubmissionSuccessCard` replaces the form on /join and /feedback after submission — check seal, bilingual thank-you copy, Facebook/X/WhatsApp/Telegram + copy-link share row, and a "Submit another" reset. Soft entrance animation; share URL is window.location.origin-based.)*
- [x] P1 [from 0.5.1] Token-expiry / refresh UX (currently a stale token can hit 401 silently) — effort:M ← done: 2026-05-28 *(new `AUTH_SESSION_EXPIRED_EVENT` fires from `apiClient` on 401 / INVALID_TOKEN / AUTH_REQUIRED; global `SessionExpirationWatcher` mounted inside `Providers` shows a bilingual "session expired" toast and replaces the route to `/login?next=<currentPath>`; login page consumes `?next=` to bounce the user back where they were)*
- [x] P2 [from 0.5.1] Silent access-token refresh via `POST /auth/refresh` + server-side revoke via `POST /auth/logout` — effort:M ← done: 2026-05-29 *(`authSession` now persists `refreshToken` alongside `accessToken`; `apiClient.apiRequest` intercepts 401 / INVALID_TOKEN / AUTH_REQUIRED, calls a deduped `refreshAccessToken()` singleton, stores the rotated token pair atomically, and retries the original request once — the session-expired toast now only fires when refresh itself fails. `logoutAndClearSession()` posts to `/auth/logout` to revoke the refresh token server-side before clearing storage; SiteShell and AdminShell logout handlers use it)*
- [x] P3 [from 0.7] Smoother visual transition on language switch — effort:S ← done: 2026-06-02 *(setLanguage in providers.js now sets `data-language-switching="true"` on <html>, waits 160ms, swaps state, then clears the flag 60ms after. CSS on `.site-shell` transitions opacity to 0.35 during the swap → looks like a soft dim-and-recover, not a content snap. Reduced-motion users skip the animation entirely.)*
- [ ] P3 [from 0.3.2] Post-launch: add Mobile App Dev, Translator (EN↔NE), Social Media, Photographer/Videographer, Event Coordinator roles to the volunteer invite — effort:S *(deferred until app release; current dev-phase roles are sufficient)*
- [ ] P2 [from 0.3.2] Backend `applicationRoles` enum must accept `QA_ENGINEER`, `DEVOPS_ENGINEER`, `CONTENT_WRITER` — frontend cards link to `/join?role=` with these values but the API still rejects them (see [09-backend-admin-gaps.md](../engineering/09-backend-admin-gaps.md)) — effort:S

## Phase 1 — Public Issue Discovery & Voting

- [x] P1 [from 1.1] Skeleton loader on `/issues` list (currently just `<Spin />`) — effort:S ← done: 2026-06-02 *(`PublicIssueCardSkeleton` shimmer cards render inside a `role="status"` container while issues are loading; verified during light-mode a11y sweep)*
- [x] P1 [from 1.1] Pagination / load-more beyond the initial 50 — effort:M ← done: 2026-06-02 *(`public-issues-pagination` nav with prev/next + numbered page buttons is in `/issues/page.js`; bilingual aria labels)*
- [x] P2 [from 1.1.2] Persist filters in URL query params (shareable filtered views) — effort:S ← done: 2026-06-02 *(`/issues` page: status / category / sort filters now read from `?status=&category=&sort=`; `router.replace` keeps URL in sync without scroll; back/forward re-syncs state. `voteCount` is the implicit default and never written.)*
- [x] P3 [from 1.1] Map-preview thumbnail on issue cards — effort:M ← done: 2026-06-02 *(new `IssueMapThumb` component renders a single OSM raster tile + a CSS-positioned pin at the precise lon/lat (via `lonLatToTilePx` → percentage offset on the 256px tile). No leaflet on the cover thumbnail path. Renders when `coverImageUrl` is missing but `latitude`/`longitude` are valid; falls back to the original `PictureOutlined` placeholder otherwise. Discreet © OpenStreetMap attribution included)*
- [x] P2 [from 1.2.1] Lightbox / fullscreen for the evidence gallery — effort:S ← done: 2026-06-02 *(already shipped in `IssuePhotoGallery`: an Ant Design `Modal` with a Swiper inside opens on cover/slide click and supports keyboard navigation. Closing the polish item — was untracked in backlog.)*
- [ ] P2 [from 1.2.3] Related-issues ranking weighted by geo-distance, not category alone — effort:M
- [x] P3 [from 1.2] Scroll-progress indicator on long issue descriptions — effort:S ← done: 2026-06-02 *(new `ScrollProgressBar` component renders a fixed top bar with a primary→accent gradient that fills via `transform: scaleX(progress)`; rendered inside `/issues/[id]`; respects `prefers-reduced-motion`.)*
- [x] P1 [from 1.1] Public issue card images had no alt fallback when `issue.title` was null — Next.js Image stripped the empty alt and headings rendered empty — effort:S ← done: 2026-06-02 *(`PublicIssueCard` now uses an `accessibleLabel` fallback chain: title → addressText → categoryLabel → statusLabel; applied to both `<Image alt>` and the `<h3>` link)*
- [ ] P1 [from 1.1] Combined map on `/campaigns` (issues + events with coords) — the `/issues` map was dropped when the list pages merged; restore a unified map of the current filtered results — effort:M
- [ ] P2 [from 1.1] DRAFT card polish on `/campaigns` — DRAFT events have no `scheduledAt` and often carry junk slugs/titles on staging, so cards need a graceful "तयारीमा" treatment + a real title fallback — effort:S
- [ ] P2 [from 1.1.2] Cross-kind sort dropdown on `/campaigns` (votes / participants / nearest) — only lifecycle order ships today — effort:M
- [ ] P2 [from 1.1] Real cursor pagination across the merged `/campaigns` sources — currently each stage is capped ~50 and windowed client-side — effort:M

## Phase 9 — Admin Control Center

- [ ] P2 [from 9.1] Bulk actions on applications (approve / reject multiple at once) — effort:M
- [ ] P3 [from 9.1] Export applications to CSV — effort:S
- [ ] P2 [from 9.4] Calendar view for events (currently list-only) — effort:M
- [x] P2 [from 9.5a] Auto-save draft on issue create / edit (avoid lost work on reload) — effort:M ← done: 2026-06-02 *(localStorage-backed draft on `/issues/new`: debounced (800ms) write on every form change saves title/description/category/addressText/location to key `shramdan:issue-draft:v1` with 14d TTL. On mount a dashed banner surfaces if a non-empty draft is found, with "Restore" / "Discard" actions and a "X min ago" age hint; a live "Draft saved · X min ago" status pill below the submit button refreshes every 30s. Successful POST clears the draft. Cover/uploads are excluded — they reference server upload IDs and can't be safely restored. Bilingual NE+EN.)*
- [ ] P2 [from 9.10] Search + filter users by role / name — effort:S

## Phase 2 — Member Portal (UI-only, pre-backend)

- [x] P2 [from 2.1] Phone + OTP membership UI flow — effort:S ← done: 2026-06-02 *(new `/signup` page: 3-state machine (phone → otp → done), Nepali mobile validation, 6-digit OTP input, dev-dummy success path with ~500ms simulated delay; explicit "Dev mode" hint. Backend endpoints `/auth/otp/send` + `/auth/otp/verify` not wired yet — swap-ready. `/login` page links to it via a dashed accent-tinted CTA.)*

## Phase 8 — Notifications (UI-only, pre-backend)

- [x] P2 [from 8] Topbar notifications bell + dev-dummy inbox — effort:S ← done: 2026-06-02 *(new `NotificationsBell` + 5 sample notifications in `devMockData` covering vote / schedule / result / live / welcome kinds, each kind-tinted circular icon. Badge count localizes to Devanagari digits when language=np; "Mark all read" + per-item read-toggle in local state; backend swap-ready via getJson("/notifications").)*

## Phase 14 — Build-in-Public surfaces (cont.)

- [x] P2 [from 1.5.2] Vote count tick-up animation on `IssueVoteButton` — effort:S ← done: 2026-06-02 *(380ms spring-up via pulseKey state + CSS keyframes; reduced-motion safe)*
- [x] P2 [from 14] BeforeAfterSlider on past event detail — effort:M ← done: 2026-06-02 *(new component: mouse / touch / arrow-key dragable divider, 16:9 aspect, BEFORE/AFTER chips; each demo past event now carries a `beforeAfter` photo pair piped through `getDemoEventById`)*
- [x] P2 [from 2] `/me/preview` — auth-free profile stub — effort:S ← done: 2026-06-02 *(parallel route to the auth-gated /me; brand-gradient avatar, stat tiles, recent-activity timeline from `getDemoNotifications`, upcoming + past events; banner makes "demo" intent obvious; CTA back to `/signup`)*
- [x] P2 [from 6] `/impact` aggregate page — effort:M ← done: 2026-06-02 *(sums devMockData past-events into 4 headline tiles, per-event list with 3-stat clusters, primary CTA card. UI-only; bilingual.)*
- [x] P2 [from 6] `/leaderboard` — top contributors across 3 buckets (supporters/participants/organizers) — effort:M ← done: 2026-06-02 *(tabbed switcher, 10 demo rows per bucket, top-3 highlighted with crown + accent gradient, mobile-collapsible badge column)*
- [x] P3 [from 0.4] Confetti burst on submission success — effort:S ← done: 2026-06-02 *(new CSS-only ConfettiBurst on SubmissionSuccessCard + /signup done step; reduced-motion safe)*
- [x] P3 [from 0.3] Activity ticker below homepage hero — effort:S ← done: 2026-06-02 *(rotating one-liner of dummy supporter/joiner/organizer activity every ~4.2s)*
- [x] P3 [from 2] Achievement badges on /me/preview — effort:S ← done: 2026-06-02 *(6 emoji badge tiles with unlocked vs locked styling)*
- [x] P2 [from 1.2] `IssueComments` thread on /issues/[id] — effort:S ← done: 2026-06-02 *(deterministic 2-5 comments per issue from DEMO_COMMENT_POOL keyed off issueId hash; local-state composer with "Dev mode" hint)*
- [x] P2 [from 6] `/calendar` month-view of events — effort:M ← done: 2026-06-02 *(grid with kind-coded dots, prev/next/today nav, sticky day panel; bilingual NP weekdays/months)*
- [x] P2 [from 11] Cmd+K command palette — effort:M ← done: 2026-06-02 *(spotlight-style search across 15 routes + all demo events; arrow keys + Enter; topbar magnifier as the visible trigger)*
- [x] P3 [from 0.3] Live online widget — effort:S ← done: 2026-06-02 *(pulsing-dot chip with a drifting count in the 84-132 band; sits alongside ActivityTicker in a new home-pulse-row)*
- [x] P2 [from 1.1] Hover preview on issue cards — effort:S ← done: 2026-06-02 *(description peek panel slides in on :hover/:focus-within; mobile + touch devices skip via @media (hover: hover); card lifts -3px to mirror event-card polish)*
- [x] P2 [from 12] `/help` FAQ accordion page — effort:M ← done: 2026-06-02 *(12 Q&As / 4 sections / search filter / bilingual; native `<details>` so keyboard + no-JS work; "still stuck?" primary-gradient CTA card)*
- [x] P2 [from 5] `/donate` amount picker + impact preview + dev success — effort:M ← done: 2026-06-02 *(preset NPR buttons + custom input + frequency toggle + impact translator (rupees → tools/water/rides); confetti success state with receipt number; backend swap-ready)*
- [x] P3 [from 6] Activity heatmap on /me/preview — effort:S ← done: 2026-06-02 *(GitHub-style 12-week × 7-day grid with 5-step color scale)*
- [x] P2 [from 7] Featured story panel on homepage — effort:S ← done: 2026-06-02 *(cinematic past-event card pulled from highest-participant demo event; cover + headline + quote + result + CTA)*
- [x] P2 [from 1.1] Bookmark heart on issue cards — effort:S ← done: 2026-06-02 *(useSavedIssues hook with localStorage + useSyncExternalStore; backend swap-ready)*
- [x] P2 [from 11] Quick-action FAB — effort:S ← done: 2026-06-02 *(circular + button bottom-right with 3 expanded actions: report issue / join campaign / feedback; auto-hides on auth + admin + new-issue routes)*
- [x] P3 [from 0.3] Time-of-day greeting in hero — effort:S ← done: 2026-06-02 *(शुभप्रभात / नमस्कार / शुभ साँझ / शुभरात्रि anchored to Asia/Kathmandu hour via Intl; SSR-safe)*
- [x] P2 [from 11] Keyboard shortcuts dialog — effort:S ← done: 2026-06-02 *("?" opens centered Modal listing shortcuts across 4 groups; gated when an input is focused)*
- [x] P2 [from 1.1] `/me/saved` bookmarks list — effort:S ← done: 2026-06-02 *(reads from useSavedIssues; empty state + count chip + per-row remove)*
- [x] P2 [from 11] First-visit onboarding spotlight modal — effort:S ← done: 2026-06-02 *(localStorage-gated; 3 step rows; primary + secondary CTA + skip)*
- [x] P2 [from 1.2] Emoji reactions row on /issues/[id] — effort:S ← done: 2026-06-02 *(5 reactions with seeded counts + per-issue localStorage picks)*
- [x] P2 [from 12] `/resources` directory page — effort:M ← done: 2026-06-02 *(4 sections × 3 tiles, kind-tinted icons, bilingual; placeholder hrefs swap-ready)*
- [x] P2 [from 1.1] Demo public issues registry + `getDemoIssueById` — effort:S ← done: 2026-06-02 *(/me/saved now resolves saved ids to titles + addresses; sparkline + future surfaces lean on it)*
- [x] P3 [from 1.2] Vote-history sparkline on /issues/[id] — effort:S ← done: 2026-06-02 *(SVG path + area gradient + accent endpoint dot + "+N supports" delta)*
- [x] P3 [from 11] EmptyState component with 3 inline SVGs — effort:S ← done: 2026-06-02 *(no-results / no-saved / no-events kinds; currentColor flexes to primary/accent)*
- [x] P2 [from 13] City filter on /events list — effort:S ← done: 2026-06-02 *(Select next to the status filter, URL-synced as `?city=`)*
- [x] P2 [from 7] `/stories` long-form narrative cards — effort:M ← done: 2026-06-02 *(alternating cover/body layout; counter prefix; testimonial blockquotes pulled from past-event mock data)*
- [x] P3 [from 0.7] Accent color picker — effort:S ← done: 2026-06-02 *(5 presets in providers.js; round swatch row in Settings; live-tinted via --accent on documentElement)*
- [x] P2 [from 12] PDF / print export of event detail — effort:S ← done: 2026-06-02 *(window.print() + @media print rule that hides all chrome; PrintButton paired with the back link)*
- [x] P2 [from 10] Mobile bottom tab bar at ≤720px — effort:S ← done: 2026-06-02 *(5 slots: Home/Issues/Events/Me/More; the More tab opens the existing hamburger menu via ref)*
- [x] P2 [from 2] `/me/applications` dummy contribution applications list — effort:S ← done: 2026-06-02 *(3 demo apps with mixed statuses + decision notes)*
- [x] P2 [from 14] `/changelog` vertical release-notes timeline — effort:S ← done: 2026-06-02 *(5 hand-curated entries, added/improved/fixed groups, NP + EN)*
- [x] P3 [from 11] Recently viewed strip on homepage + useTrackVisit on detail pages — effort:S ← done: 2026-06-02 *(localStorage stack, up to 6 entries, useSyncExternalStore for cross-component sync)*
- [x] P3 [from 1.1] NearMeFilter — geolocation proximity sort on /issues — effort:S ← done: 2026-06-02 *(haversine sort over current page; opt-in browser geolocation prompt)*

## Phase 11 — Cross-cutting

- [ ] P2 [from 11.1] `AdminResponsiveList`: column-visibility toggle — effort:S
- [x] P2 [from 11] Page transitions: route fade-up — effort:S ← done: 2026-06-02 *(SiteShell keys children by pathname; 320ms `page-enter` animation with `animation-fill-mode: backwards`; reduced-motion safe)*
- [x] P1 [from 11] `StickyActionBar` was tab-reachable while visually hidden — effort:S ← done: 2026-06-02 *(added `tabIndex={visible ? 0 : -1}` to the inner Link and `inert={!visible || undefined}` on the wrapper, including the React 19 boolean-attribute correction)*
- [x] P1 [from 11] Leaflet `Marker` pins had no accessible name (axe `name-role-value`) — effort:S ← done: 2026-06-02 *(`IssueMap.IssueMarker` now passes `title` + `alt` + `keyboard` derived from `issue.title || issue.addressText || statusLabel`)*
- [x] P2 [from 11] Skip-to-main-content link (WCAG 2.1 SC 2.4.1 Bypass Blocks) — effort:S ← done: 2026-06-02 *(SiteShell now renders `<a class="skip-to-main">` as the first focusable element; visually hidden until Tab focus, targets a `tabIndex=-1` wrapper around children; bilingual label.)*
- [x] P2 [from 11] Devanagari line-height baseline (matras/reph were crowding descenders) — effort:S ← done: 2026-06-02 *(`:root[lang="ne"] body|p|li` now uses 1.7 line-height and 1.35 for h1/h2/h3; Latin pages unchanged.)*
- [x] P2 [from 11] Custom branded 404 page — effort:S ← done: 2026-06-02 *(`src/app/not-found.js` renders inside SiteShell with a "४०४/404" hero, friendly explanation, and three exit-lane buttons; bilingual via usePreferences.)*
- [ ] P3 [from 11] `docs/api-requirements/` drift-check script — scan `src/lib/devMockData.js` and consuming UI components against each domain spec, list mismatched fields / missing operations / new shapes. Run as a session routine step once a working cadence is established. — effort:M *(follow-up from the 2026-06-03 pivot ADR open questions)*
- [ ] P3 [from 11.7] Wrap `MarkdownReader` output with DOMPurify or switch to `react-markdown` — defense-in-depth in case user-generated Markdown ever flows to the surface. — effort:S *(logged by the 2026-06-03 security baseline audit)*
- [ ] P2 [from 11.7] Migrate auth token storage from `localStorage` to httpOnly cookies — requires backend cooperation; XSS would no longer leak tokens. — effort:M *(logged by the 2026-06-03 security baseline audit)*
- [ ] P3 [from 11.7] Mask raw backend error `message` in `apiClient.js` if/when backend starts returning verbose stack traces — currently no leak observed but a curated localized fallback would prevent regressions. — effort:S *(logged by the 2026-06-03 security baseline audit)*
- [ ] P2 [from 11.2] Run Playwright + axe-core scan against all public routes; integrate into CI when CI exists. — effort:M *(logged by the 2026-06-03 a11y baseline audit)*
- [ ] P3 [from 11.2] Verify WCAG AA contrast across the full palette in both themes with a real contrast tool; tweak `--muted` and primary fills if any fail. — effort:S *(logged by the 2026-06-03 a11y baseline audit)*
- [ ] P3 [from 11.2] Bump focus ring weight on primary action buttons from Antd's default (2 px) to 3 px for clearer keyboard focus. — effort:S *(logged by the 2026-06-03 a11y baseline audit)*
- [ ] P2 [from 11.6] Run real Lighthouse CI against staging + capture before/after numbers in `/development` once a CI environment is set up. — effort:M *(logged by the 2026-06-03 perf baseline)*
- [ ] P3 [from 11.6] Audit Antd imports — verify modular imports / babel-plugin-import shakes unused components. — effort:S
- [ ] P3 [from 11.6] Code-split `/events/[id]` leader-only panel bundles so unauthenticated viewers don't load them. — effort:M
- [ ] P3 [from 11.6] Local `/_dev/perf` route printing per-page client-component count to flag regressions. — effort:S
- [ ] P2 [from 11.5] Wire `registerAnalyticsSink` to a real platform (Plausible recommended for the launch phase). — effort:S *(logged by the 2026-06-03 analytics scaffold)*
- [ ] P2 [from 11.5] Instrument the 19 canonical events across call sites; today the scaffold exists but no surface dispatches yet. — effort:M
- [ ] P2 [from 11] Comment count badges on `IssueListCard` + `EventListCard` + `CommentsSummary` (preview pane) — currently show 0 because the data layer migrated to async backend fetch but the cards still call the deprecated sync `loadComments()` stub. Cheapest fix is a `commentCount` field on the issue/event resource (backend ask); fallback is async-fetch on card mount (N+1, acceptable for low-traffic list views). — effort:S *(regression introduced by Phase B comment wiring 2026-06-04)*
- [ ] P2 [from 11] `SiteShell` `document.title` effect loses to Next metadata on first hard load (title corrects on any re-render; affects `/intro`, `/resources`, `/calendar`, likely all pages passing `pageTitle`) — consider per-page `generateMetadata`/`export const metadata` instead of the client effect. — effort:M *(surfaced during 2026-07-02 brochure restoration verification)*
- [ ] P3 [from 11] Mobile drawer: `TeamOutlined` now doubles for `/event-types` and `/invitations` — give invitations a distinct icon (`UserAddOutlined` already imported). — effort:S *(2026-07-02 brochure restoration review note)*
- [ ] P3 [from 11] `home.css` media-query consolidation: the 2026-07-02 CSS restoration appended new `@media (max-width: 980px/620px)` blocks (additions-only constraint) whose few duplicate declarations mirror existing blocks — fold restored rules into the original breakpoints in a dedicated pass. — effort:S
- [ ] P3 [from 11] `home-search.css` dead rules: `.home-search-hero*`, `.home-search-brand*`, `.home-search-intro-link*` unused since BrochureHero replaced the brand band (2026-07-02) — delete after a settling period. — effort:S
- [ ] P3 [from 11] Restored brochure pages (`/intro`, `/invitations`, `/resources`) have no visible `<h1>` (top heading is `h2`, matching the old homepage markup) — decide on a heading-level pass for a11y/SEO. — effort:S *(2026-07-02 restoration review note)*
- [ ] P3 [from 14] `buildInPublic.taskOverrides` pairings date to 2026-06-05 — refresh titles/blurbs against current roadmap in-progress ids so `/intro` building-now shows the freshest work. — effort:S
- [ ] P2 [from 11] `/join?role=` prefill: `/invitations` role cards deep-link with a `role` query param but `ContributorForm` ignores it and hardcodes `role: "VOLUNTEER"` in the payload (pre-existing, verbatim-restored behavior) — read the param and preselect/submit the role; backend payload field already exists. — effort:S *(2026-07-02 final review note)*
- [ ] P3 [from 11] siteContent dead keys after restoration: `buildInPublic.heroLabel/heroAria/roadmapCta` (dropped hero-panel; NP `roadmapCta` still -नुहोस् form but unrendered) and `homeSearch.slogan` (brand band removed) — delete or convert in a copy-cleanup pass. — effort:S

## Phase 13 — Live Events Rail

- [x] P3 [from 13] Persist `/events` filter pill state in URL query (`?show=live|upcoming|past`) for shareable filtered views — effort:S ← done: 2026-06-02 *(reads `?show=` on mount, syncs state via `router.replace` on click, respects back/forward navigation; `all` is the implicit default and never written.)*
- [x] P2 [from 13] `/events` and homepage upcoming date pills emitted Latin digits in NP — Chromium's Intl `ne-NP` locale never honoured Devanagari numerals and also produced SSR/CSR hydration mismatch — effort:S ← done: 2026-06-02 *(replaced `Intl.DateTimeFormat("ne-NP", ...)` calls in `src/app/events/page.js` and `src/app/HomeClient.js` with a manual composition using `NP_MONTHS_SHORT` + `NP_WEEKDAYS_SHORT` tables and `localizeDigits` so output reads "बिहि, जुन ४, ६:५४" — deterministic across server and client.)*

- [ ] P2 [from 13] "अब N साथ बाँकी" urgency chip on the support strip's near-threshold cards — the curated shelf already ships `remaining` (votes left to auto-promotion) and `useCuratedCampaigns` carries it on every entry; `CampaignCard` just needs to render it for OPEN cards when present. — effort:S *(logged with the 2026-07-02 curated-shelves migration)*
- [ ] P2 [from 13] Unify the home rail's missing-thumbnail fallback: `LivePosterCard` renders a dark "श्रमदान" placeholder when `thumbnailUrl` is null while `UpcomingPosterCard` falls back to `FALLBACK_POSTER` — swap the live branch to the same poster (or `getCategoryFallbackImage`) so a coverless ACTIVE campaign never shows a black card (staging Representative-Image rule; surfaced by the since-deleted SAMPLE Bagmati campaign, backend cover-fallback requested in api-requirements/campaigns-feed.md) — effort:S

## Phase 14 — Live Event Detail

- [x] P2 [from 14] Promote viewer counter from muted inline span to prominent breathing counter + Devanagari digit localization on `EventLiveStreamPlayer` — effort:S ← done: 2026-06-02 *(big accent-coloured eye + clamp(22–30px) tabular-num number with 3.2s breathe; digit transform respects `language=np`; duration also localized; reduced-motion fallback)*
- [x] P2 [from 14] `/events/[id]` document title flashes "Event not found" during initial load before the event fetch resolves — effort:S ← done: 2026-06-02 *(root cause was server-side `generateMetadata` in `events/[id]/layout.js` falling into the `if (!event)` branch for `demo-*` IDs that only exist in client mock data. Now short-circuits demo IDs to a neutral "Shramdan campaign" title and skips the JSON-LD payload; production 404s still get the noindex'd "Event not found".)*

## Phase 15 — Event Detail Polish

- [x] P2 [from 15] `EventRosterPanel`: each role row now carries a one-line description under the title so volunteers understand what the role entails before clicking — effort:S ← done: 2026-06-02 *(7 NP + 7 EN descriptions for WORKER/PHOTOGRAPHER/LIVESTREAMER/MEDIC/SAFETY_LEAD/COORDINATOR/LOGISTICS)*
- [x] P2 [from 15] "दिनको आवाज / Voices from the day" testimonials section on past event detail — effort:S ← done: 2026-06-02 *(each demo past event now carries 2-3 testimonial entries; section gates on testimonials array length; responsive auto-fit grid of blockquote cards with opening quote glyph)*

## Phase 3 — Learn / Docs

- [x] P3 [from 3] Scroll-progress indicator on /learn/[slug] (parity with /issues/[id]) — effort:S ← done: 2026-06-02 *(reuses the same `ScrollProgressBar` component)*

## Phase 0 — Foundation (cont.)

- [x] P3 [from 0.7] Settings: reset-to-defaults button — effort:S ← done: 2026-06-02 *(Popconfirm-gated; flips theme→light, language→NP)*
- [x] P2 [from 0.5] `/login` polish — two-column with member-benefits panel + forgot-password link — effort:S ← done: 2026-06-02 *(was the last pivot-untouched public surface; left-side panel lists 3 benefits with icons, right-side card carries the form; stacks at ≤820px)*
- [x] P2 [from 11] Mobile menu missing Settings link — effort:S ← done: 2026-06-02 *(desktop toolbar gear icon hides under 980px; mobile menu now carries a Settings link between the Admin Center (admin only) and the preferences button row)*
- [x] P2 [from 1.2] `/issues/[id]` hero cover image alt fallback chain — effort:S ← done: 2026-06-02 *(same Next.js Image strip-alt bug as PublicIssueCard; new coverAlt cascade — title → addressText → categoryLabel → statusLabel → galleryAria → "Issue" — also flows into IssuePhotoGallery so lightbox images inherit it)*

## Phase 7 — Discussions & Feature Voting

- [x] P1 [from 7] `/discussions` list redesign — sticky left category rail (DESIGN/FRONTEND/BACKEND/PRODUCT/COMMUNITY), accessible proper tabs, reusable `components/discussions/*`, brochure hero + stats strip removed (app-not-brochure) — effort:M ← done: 2026-06-18 *(extracted `discussionFormat.js` shared utils, `DiscussionTabs` roving-tabindex tablist, `DiscussionCategoryRail`, `NewTopicModal` w/ category chips; added `category` field to topics + backend contract; faceted category/tab counts client-side)*
- [ ] P1 [from 7] `/discussions/[slug]` detail redesign (Phase 2 of the makeover) — apply the same app-style language: category chip in header, reuse `discussionFormat` utils (drop the duplicated localizeDigits/formatRelative in the detail page), tighten the support card, threaded replies polish — effort:M
- [ ] P3 [from 7] Animated sliding active-thumb under the proper tabs (currently a background pill swap, no slide) — effort:S
- [x] P1 [from 7] Nav "एप निर्माण / App Development · LIVE" now points to `/discussions` — effort:S ← done: 2026-06-18 *(2026-06-18 product call: "app development is happening **via** Shramdan, in public" → the LIVE nav entry must lead into the participatory build-Shramdan surface, which is the discussions / feature-voting board. Single `href` change in SiteShell `pillNavItems`, updates both the desktop pill nav and the mobile drawer. Label/LIVE badge/tooltip unchanged.)*
- [x] P1 [from 14] **Retire the standalone `/app-development` App Dev Tasks board** now that the nav routes to `/discussions` — effort:S ← done: 2026-06-18 *(product owner chose reversible retirement: temporary (307) redirects `/app-development` + `/app-development/:path*` → `/discussions` in `next.config.mjs`. The board code is intentionally KEPT in the repo — page, `/new`, `/[slug]`, `appDevStub.js`, `docs/api-requirements/app-development.md` — so the move is reversible and nothing is lost. ⚠️ It is NOT a throwaway intro: it's a full functional board (5-stage pipeline, vote, take-lead, skill tags, leader assignment) that `/discussions` does not replicate. Verified both `/app-development` and `/app-development/new` land on `/discussions`.)*
- [ ] P3 [from 14] Decide the long-term fate of the retired `/app-development` board code — either fully delete (route + stub + contract) or fold its task-board features (pipeline / take-lead / skill tags / leader assignment) into `/discussions`. Until then it stays redirected-but-present — effort:M

When the user asks for the next task, the agent reads both files together and proposes a mix:

1. The highest-leverage unblocked `[ ]` leaf from [00-master-roadmap.md](00-master-roadmap.md) (new feature work)
2. Any open `P1` items from this file (urgent polish)
3. A concrete suggestion that combines them, e.g.: *"Ship roadmap 1.4 today (small), then close two P1 polish items in the same session."*

Polish never gates new feature work, but if `P1` polish items are accumulating faster than they are getting shipped, the agent should call that out before adding more `P3` items.

---

# How To Update This Document

Same spirit as the roadmap: update inline as work progresses. Add, flip status, mark done, cancel — without asking. Do not let this file drift behind reality.

A stale polish backlog is worse than no polish backlog, because it gives the false sense that someone is watching the rough edges.
