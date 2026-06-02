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

- [ ] P2 [from 0.3.3] Playlist autoplay-next when a video ends — effort:S
- [ ] P3 [from 0.3] Subtle scroll-reveal animation on homepage sections — effort:M
- [x] P1 [from 0.4.1] Honeypot / spam protection on `/join` and `/feedback` — effort:S ← done: 2026-05-28 *(shared `Honeypot` component renders an off-screen `website` field with `tabIndex={-1}` + `autoComplete="off"`; page-level submit silently returns success without calling the API when the field is filled)*
- [ ] P3 [from 0.4] Success state with shareable confirmation link — effort:S
- [x] P1 [from 0.5.1] Token-expiry / refresh UX (currently a stale token can hit 401 silently) — effort:M ← done: 2026-05-28 *(new `AUTH_SESSION_EXPIRED_EVENT` fires from `apiClient` on 401 / INVALID_TOKEN / AUTH_REQUIRED; global `SessionExpirationWatcher` mounted inside `Providers` shows a bilingual "session expired" toast and replaces the route to `/login?next=<currentPath>`; login page consumes `?next=` to bounce the user back where they were)*
- [x] P2 [from 0.5.1] Silent access-token refresh via `POST /auth/refresh` + server-side revoke via `POST /auth/logout` — effort:M ← done: 2026-05-29 *(`authSession` now persists `refreshToken` alongside `accessToken`; `apiClient.apiRequest` intercepts 401 / INVALID_TOKEN / AUTH_REQUIRED, calls a deduped `refreshAccessToken()` singleton, stores the rotated token pair atomically, and retries the original request once — the session-expired toast now only fires when refresh itself fails. `logoutAndClearSession()` posts to `/auth/logout` to revoke the refresh token server-side before clearing storage; SiteShell and AdminShell logout handlers use it)*
- [ ] P3 [from 0.7] Smoother visual transition on language switch — effort:S
- [ ] P3 [from 0.3.2] Post-launch: add Mobile App Dev, Translator (EN↔NE), Social Media, Photographer/Videographer, Event Coordinator roles to the volunteer invite — effort:S *(deferred until app release; current dev-phase roles are sufficient)*
- [ ] P2 [from 0.3.2] Backend `applicationRoles` enum must accept `QA_ENGINEER`, `DEVOPS_ENGINEER`, `CONTENT_WRITER` — frontend cards link to `/join?role=` with these values but the API still rejects them (see [09-backend-admin-gaps.md](../engineering/09-backend-admin-gaps.md)) — effort:S

## Phase 1 — Public Issue Discovery & Voting

- [x] P1 [from 1.1] Skeleton loader on `/issues` list (currently just `<Spin />`) — effort:S ← done: 2026-06-02 *(`PublicIssueCardSkeleton` shimmer cards render inside a `role="status"` container while issues are loading; verified during light-mode a11y sweep)*
- [x] P1 [from 1.1] Pagination / load-more beyond the initial 50 — effort:M ← done: 2026-06-02 *(`public-issues-pagination` nav with prev/next + numbered page buttons is in `/issues/page.js`; bilingual aria labels)*
- [ ] P2 [from 1.1.2] Persist filters in URL query params (shareable filtered views) — effort:S
- [ ] P3 [from 1.1] Map-preview thumbnail on issue cards — effort:M
- [ ] P2 [from 1.2.1] Lightbox / fullscreen for the evidence gallery — effort:S
- [ ] P2 [from 1.2.3] Related-issues ranking weighted by geo-distance, not category alone — effort:M
- [ ] P3 [from 1.2] Scroll-progress indicator on long issue descriptions — effort:S
- [x] P1 [from 1.1] Public issue card images had no alt fallback when `issue.title` was null — Next.js Image stripped the empty alt and headings rendered empty — effort:S ← done: 2026-06-02 *(`PublicIssueCard` now uses an `accessibleLabel` fallback chain: title → addressText → categoryLabel → statusLabel; applied to both `<Image alt>` and the `<h3>` link)*

## Phase 9 — Admin Control Center

- [ ] P2 [from 9.1] Bulk actions on applications (approve / reject multiple at once) — effort:M
- [ ] P3 [from 9.1] Export applications to CSV — effort:S
- [ ] P2 [from 9.4] Calendar view for events (currently list-only) — effort:M
- [ ] P2 [from 9.5a] Auto-save draft on issue create / edit (avoid lost work on reload) — effort:M
- [ ] P2 [from 9.10] Search + filter users by role / name — effort:S

## Phase 11 — Cross-cutting

- [ ] P2 [from 11.1] `AdminResponsiveList`: column-visibility toggle — effort:S
- [x] P1 [from 11] `StickyActionBar` was tab-reachable while visually hidden — effort:S ← done: 2026-06-02 *(added `tabIndex={visible ? 0 : -1}` to the inner Link and `inert={!visible || undefined}` on the wrapper, including the React 19 boolean-attribute correction)*
- [x] P1 [from 11] Leaflet `Marker` pins had no accessible name (axe `name-role-value`) — effort:S ← done: 2026-06-02 *(`IssueMap.IssueMarker` now passes `title` + `alt` + `keyboard` derived from `issue.title || issue.addressText || statusLabel`)*

## Phase 13 — Live Events Rail

- [ ] P3 [from 13] Persist `/events` filter pill state in URL query (`?show=live|upcoming|past`) for shareable filtered views — effort:S

## Phase 14 — Live Event Detail

- [x] P2 [from 14] Promote viewer counter from muted inline span to prominent breathing counter + Devanagari digit localization on `EventLiveStreamPlayer` — effort:S ← done: 2026-06-02 *(big accent-coloured eye + clamp(22–30px) tabular-num number with 3.2s breathe; digit transform respects `language=np`; duration also localized; reduced-motion fallback)*
- [ ] P2 [from 14] `/events/[id]` document title flashes "Event not found" during initial load before the event fetch resolves — effort:S *(title is computed from `eventData?.title` while it's still `undefined`; needs an explicit loading-state fallback in `SiteShell` pageTitle prop)*

## Phase 15 — Event Detail Polish

- [x] P2 [from 15] `EventRosterPanel`: each role row now carries a one-line description under the title so volunteers understand what the role entails before clicking — effort:S ← done: 2026-06-02 *(7 NP + 7 EN descriptions for WORKER/PHOTOGRAPHER/LIVESTREAMER/MEDIC/SAFETY_LEAD/COORDINATOR/LOGISTICS)*

---

# How Polish Feeds "What's Next?"

When the user asks for the next task, the agent reads both files together and proposes a mix:

1. The highest-leverage unblocked `[ ]` leaf from [00-master-roadmap.md](00-master-roadmap.md) (new feature work)
2. Any open `P1` items from this file (urgent polish)
3. A concrete suggestion that combines them, e.g.: *"Ship roadmap 1.4 today (small), then close two P1 polish items in the same session."*

Polish never gates new feature work, but if `P1` polish items are accumulating faster than they are getting shipped, the agent should call that out before adding more `P3` items.

---

# How To Update This Document

Same spirit as the roadmap: update inline as work progresses. Add, flip status, mark done, cancel — without asking. Do not let this file drift behind reality.

A stale polish backlog is worse than no polish backlog, because it gives the false sense that someone is watching the rough edges.
