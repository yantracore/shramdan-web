# Issues

> An **issue** is a community-reported problem at a physical location (an
> overgrown roadside, a clogged drain, a littered riverbank). Any verified
> member can report one with a cover photo, description, category and a map
> pin. Other members vote to support it; once support crosses a threshold the
> issue is promoted to a scheduled cleanup **event**. Moderators and admins
> triage issues — overriding status, force-converting to events, or taking
> down spam. The original reporter can refine their own issue while it is
> still open.

**Spec status:** `stable` (live on `backend.shramdan.org`)
**Last updated:** 2026-06-17

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **slug** (`string`, required, public) — URL-friendly identifier; resolvable by the get-by-id route alongside the raw id.
- **translations** (`array of object`, required, public) — one entry per locale (`en`, `ne`), each `{ locale, title, description }`. The client picks the active locale and falls back en → ne → first.
- **category** (`enum`, required, public) — one of `ROADSIDE`, `VACANT_LAND`, `RIVERBANK`, `DRAINAGE`, `PARK_PUBLIC_SPACE`, `HIKING_TRAIL`, `OTHER`.
- **status** (`enum`, required, public) — one of `OPEN`, `EVENT_SCHEDULED`, `COMPLETED`, `REJECTED`, `DUPLICATE`.
- **addressText** (`string`, required, public) — human-readable address shown under the title.
- **latitude / longitude** (`number`, required, public) — map pin. On update the server re-resolves `provinceId` / `districtId` from these.
- **municipality / ward** (`string`, optional, public) — administrative location refinements.
- **coverImageId** (`string`, optional, public) — upload id used as the cover; surfaced via `uploads[]`.
- **uploads** (`array of object`, optional, public) — attached images/files; `coverImageId` points into this list.
- **voteCount** (`number`, required, public) — total supporters (every vote, any `voterRole`).
- **attendingCount** (`number`, required, public) — supporters who committed to **show up** (`voterRole = GOING`). This — not `voteCount` — is what's measured against `conversionThreshold`, so the UI's conversion progress is GOING-driven ("when N people commit to join, the cleanup is scheduled").
- **conversionThreshold** (`number`, required, public) — `attendingCount` needed to promote the issue to a scheduled event.
- **eventRoleCounts** (`array of object`, public, present on the detail read) — per-role tally of GOING voters: `[{ eventRole, voterCount }]` across all six participation roles (zeros included; `COORDINATOR` removed from the enum 2026-06-23 — see Recent changes). Powers the issue-side roster breakdown without a participants round-trip.
- **reportedById** (`string`, required, public) — the member who authored the issue. Used to scope `GET /issues/me` and to authorize edits.
- **createdAt / updatedAt** (`datetime`, required, public) — ISO 8601.

---

## Validation rules

- A report requires a **verified** user. Attached uploads must be owned by the caller, confirmed, and not yet attached to another issue.
- **Edit (`PATCH /issues/{id}`) is allowed only for the original reporter, and only while `status = OPEN`.** At least one field must be provided. When `title` or `description` is edited, a `language` (`ne` | `en`) must accompany the update so the backend re-translates the other locale.
- Editing `latitude`/`longitude` re-resolves province/district; coordinates outside Nepal boundaries are rejected.
- `status` cannot be set to `EVENT_SCHEDULED` via the moderation status route — that state is reached only through the vote-threshold (or admin force-convert) flow.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List | REST GET | Public | Paginated, sorted by `voteCount` desc by default. |
| List mine | REST GET `/issues/me` | Authenticated | Issues authored by the caller; default `sort=createdAt`. Powers the member **My issues** surface. |
| Get by id | REST GET | Public | Single issue by id or slug. |
| List participants | REST GET `/issues/{id}/participants` | Public | GOING voters who picked a participation role, with `{ voteId, eventRole, joinedAt, user }`. The issue-stage roster — paginated, `limit`/`cursor`, optional `role` filter, resolves slug or id. |
| Create | REST POST | Authenticated (verified) | Reports a new issue. |
| Update | REST PATCH | Reporter (author) | Author-only, OPEN-only partial update. |
| Set status | REST PATCH `/issues/{id}/status` | Moderator or Admin | Lifecycle override. |
| Convert to event | REST POST `/issues/{id}/convert-to-event` | Admin | Force-promote an OPEN issue. |
| Flag for moderation | REST POST `/issues/{id}/report` | Authenticated | One report per reporter; feeds the moderator queue. |
| Delete | REST DELETE | Moderator or Admin | Hard takedown for spam/abuse. **Not available to authors.** |

---

## Filters (for List operations)

Both `GET /issues` and `GET /issues/me` accept:

- **status** (`enum`) — `OPEN` | `EVENT_SCHEDULED` | `COMPLETED` | `REJECTED` | `DUPLICATE`.
- **category** (`enum`) — the category set above.
- **municipality** (`string`), **provinceId / districtId / reportedById** (`uuid`) — location / author scoping.
- **minVoteCount** (`number`), **sort** (`voteCount` | `createdAt`).
- Pagination: cursor-based, `limit` (≤ 100), `nextCursor` returned in the payload.

---

## State machine

```
OPEN → EVENT_SCHEDULED   (trigger: vote threshold, or Admin force-convert; not settable via /status)
OPEN → COMPLETED         (trigger: Moderator/Admin via /status)
OPEN → REJECTED          (trigger: Moderator/Admin via /status)
OPEN → DUPLICATE         (trigger: Moderator/Admin via /status)
any  → OPEN              (re-open; trigger: Moderator/Admin via /status)
```

The reporter can only edit content while the issue sits in `OPEN`.

---

## Gaps / requested capabilities

### Unified Support / Join — per-viewer participation reads (requested 2026-06-19) — ⚠️ PARTIALLY RESOLVED 2026-06-22

> Backs the unified Support/Join control shared by every issue + event surface.
> An issue is a not-yet-scheduled event; the frontend reconciles both into one UX
> while the backend split stays (`POST /issues/{id}/vote` for issues,
> `POST /events/{id}/participants` for events). These read fields are what the UI
> needs to pick the right button + render the persisted "already done" state by
> lifecycle, on refresh, without a click.

> **Status (2026-06-22):** The frontend now ships the full issue-side participation
> surface (`IssueParticipationPanel` on `/issues/[id]`: conversion progress + "your
> role" + GOING roster) using what the backend **has** shipped:
> `GET /issues/{id}/participants` (named roster), `attendingCount` +
> `conversionThreshold` + `eventRoleCounts` on the issue reads, and `voterRole` +
> `eventRole` decorating each `GET /issues/me/votes` row (the FE derives the
> viewer's own role from there). **Still open** — the per-viewer echo on the
> detail read itself (`isVoted` / `voterRole` / `eventRole` on `GET /issues/{id}`)
> and the issue→event link (`event` embed), both below. Until they land the FE
> pays one `GET /issues/me/votes` round-trip per detail view to recover the
> viewer's role.

**Per-viewer support echo — on `GET /issues/{id}` (detail) AND `GET /issues` (list), authenticated:**

- **isVoted** (`boolean`) — already returned on the list; **must also be added to `GET /issues/{id}`.** Without it the detail page shows "Support" (un-voted) on every refresh and only flips after a click trips `ALREADY_VOTED (409)`. _Interim (2026-06-22): the FE derives this on the detail page from `GET /issues/me/votes`; that extra round-trip can be dropped once the field ships here._
- **voterRole** (`enum`, nullable) — the caller's stored vote intent (`INTERESTED | GOING | WANT_TO_LEAD`). Needed to render "Supported" vs the specific role. _Interim (2026-06-30): the homepage rails + `/campaigns` feed (`useCampaignFeed`) now pay ONE page-wide `GET /issues/me/votes` and decorate each OPEN issue with `voterRole`/`eventRole`, so a refreshed card reads the true label (Supported/Joined/Leading) without opening the modal. Echoing these two fields on the `GET /issues` list lets that extra round-trip be dropped._
- **eventRole** (`enum`, nullable) — the participation role chosen when `voterRole = GOING` (`WORKER | PHOTOGRAPHER | LIVESTREAMER | MEDIC | SAFETY_LEAD | LOGISTICS` — six values; `COORDINATOR` removed from the enum 2026-06-23, see Recent changes). Just echo back what `POST /issues/{id}/vote { voterRole, eventRole }` stored.

**Linked event — on the issue read once promoted (`status = EVENT_SCHEDULED`):**

- **event** (`object`, nullable, public) — embed `{ id, slug, status, scheduledAt, leaderId }`. The **event `status`** (`DRAFT | SCHEDULED | ACTIVE | PAUSED | COMPLETED | CANCELLED`) is essential: the issue stays `EVENT_SCHEDULED` permanently after promotion, so the UI derives the correct action row from `event.status` — Join **+ Lead** while the event is `DRAFT`, Join-as-Role at `SCHEDULED`, Join-as-Worker at `ACTIVE`. (Supersedes the older "No link from an EVENT_SCHEDULED issue back to its event" gap below — same ask, now with the required sub-shape.)
- **event.viewerParticipation** (`object`, nullable, authenticated) — `{ id, role, status }` for the caller on the linked event, or null. Lets the issue surface show "Joined as X" without a separate `/events/{id}/participants/me` round-trip. (Mirrors the events-side `viewerParticipation` ask in `events.md`.)

**Coordinator ≡ Leader — ✅ RESOLVED BY BACKEND 2026-06-23 (was: frontend convention flagged for backend 2026-06-22):**

- **Resolved.** The backend removed `COORDINATOR` from the participation `eventRole`/`role` enum across all six endpoints (refreshed live spec 2026-06-23 12:31 NPT — see Recent changes + `event-participants.md`). The model divergence is gone: coordination ≡ leadership end-to-end. Leadership is expressed by the `WANT_TO_LEAD` vote (issue) → resolved `eventLeader` / `leaderId` (event); there is no separate coordinator participation seat.
- **Original FE convention (now matched by the API):** the FE already treated the `COORDINATOR` eventRole as leadership and showed **only one** seat for it — a dedicated leadership slot — dropping `COORDINATOR` from the participation-role grid on both surfaces. That convention is now the contract, not just a frontend choice. The COORDINATOR display label is retained only where it titles that leadership slot and for rendering legacy records (labels are decoupled from the now-six-value submit enum).

**Would-be-leader (WANT_TO_LEAD) tally — _gap_ (surfaced 2026-06-22):**

- **wantToLeadCount** (`number`, public) **and ideally a `voterRole=WANT_TO_LEAD` roster** — the FE now renders a dedicated **leadership ("Coordinator") slot** on the issue, separated from the participation roles, driven by the `WANT_TO_LEAD` vote (tap → `POST /issues/{id}/vote { voterRole: WANT_TO_LEAD }`). The viewer's own offer is recovered from `GET /issues/me/votes`, but **there is no per-issue count or roster of people who offered to lead**: `eventRoleCounts` is GOING-driven (participation roles only), and `GET /issues/{id}/participants` lists GOING voters, not WANT_TO_LEAD ones. So the leader slot can show "You're leading" for the caller but **cannot show how many others want to lead, or their names**. **Requested:** a `WANT_TO_LEAD` count on the issue read (mirroring `attendingCount` for GOING), and optionally a `role`/`voterRole` filter on `GET /issues/{id}/participants` (or a sibling endpoint) that returns WANT_TO_LEAD voters. Until then the slot reflects only the caller's own offer. Low-stakes but needed for an honest "N want to lead" on the issue.

**Per-role target counts on the issue — _nice-to-have_ (requested 2026-06-22):**

- **roleTargets / eventRoleCounts[].target** (`number`, optional, public) — a per-role *target* headcount alongside the existing `eventRoleCounts[].voterCount`. **Why:** the issue's `IssueParticipationPanel` roster now shows all seven roles event-style, but unlike the event roster (which renders `filled / needed` + `+N open` from the event's `rolePlan`), the issue has **no target denominator** — the role plan is only set post-conversion at the kickoff meeting. So the issue roster shows just "N committed" / "Open" per role, never "3 / 18 · +15 open". If the backend exposed a sensible default/expected target per role on the OPEN issue (even a flat suggested split, or letting the reporter set one at create time), the issue roster could show the same fill-progress framing as the event one cradle-to-grave. Strictly cosmetic — joining already works (tap a role → `POST /issues/{id}/vote { voterRole: GOING, eventRole }`); this only upgrades "Open" to "+N open". Low priority; logged so the issue/event roster parity gap is tracked.

**Live verification (2026-06-22) — this is THE blocker for the unified Support/Join plan, confirmed against `backend.shramdan.org`:**

The agreed action matrix and what the live API supports for each row:

| Lifecycle | Btn | Actions | Join mechanism (live) | In sync? |
| --- | --- | --- | --- | --- |
| issue `OPEN` | Support | Interested · Join-as-Role · Lead | `POST /issues/{id}/vote { voterRole: INTERESTED\|GOING\|WANT_TO_LEAD, eventRole }` | ✅ yes |
| issue `EVENT_SCHEDULED` (event `DRAFT`) | Join | Join-as-Role · Lead | event-side only: `POST /events/{eventId}/participants` + `…/leader-volunteer` | ⚠️ **blocked — no issue→event link** |
| event `SCHEDULED` | Join | Join-as-Role | `POST /events/{id}/participants { role }` | ✅ yes (on event page) |
| event `ACTIVE` | Join | Join-as-Worker | `POST /events/{id}/participants { role: WORKER }` | ✅ yes (on event page) |
| event `COMPLETED` | "Contributed as" | — | read `viewerParticipation` | ⚠️ needs `viewerParticipation` echo |

- **The API is NOT wrong** — `POST /issues/{id}/vote` correctly returns **`400 ISSUE_NOT_OPEN`** once the issue leaves `OPEN` (verified live), so joining a promoted issue MUST go through its event. That is the right contract. The single missing piece is the **read-side link** from the issue to that event.
- **Confirmed live:** `GET /issues/{id}` for an `EVENT_SCHEDULED` issue returns **no** `event` / `eventId` field. And `GET /events?issueId=…` / `?linkedIssueId=…` both return **0** (no such filter). The link only runs event→issue: every **event** payload carries `issueId`.
- **Interim FE workaround shipped (2026-06-22):** `resolveEventForIssue(issue)` in `lib/eventsApi.js` recovers the event by listing `/events` narrowed to the issue's `districtId` (≤100, then matching `issueId` client-side) and the Join CTA on `/issues/[id]` now routes to `/events/{slug}` — verified against staging (district narrowing → 8 candidates → clean match). This is a band-aid: it costs one extra `/events` fetch per promoted-issue detail view and is only reliable while a district holds ≤100 events. **It auto-drops the moment `issue.event` ships** (the resolver checks `issue.event` first).
- **Smallest backend unlock:** embed `event { id, slug, status, scheduledAt, leaderId, viewerParticipation }` on `GET /issues/{id}` (and ideally `GET /issues` for the grid/preview Join buttons, which currently degrade to a "joining opens shortly" cue because a per-card `/events` fetch is too costly). A `GET /events?issueId=` filter would be an acceptable fallback. Owner: Pranish (backend).

> Surfaced 2026-06-19 while wiring inline backend-validation display on the issue edit forms.

- **`PATCH /issues/{id}` rejects `uploadIds` as an unrecognized key.** Editing an issue and changing its attachment set sends `uploadIds: string[]` — the same key `POST /issues` accepts on create — but the update endpoint runs a strict schema and returns `400` with `body: Unrecognized key: "uploadIds"`. That fails the **entire** patch, so a member who also edits text/category in the same save loses all of it. The Fields/Validation sections document `uploads[]` + `coverImageId` but say nothing about **mutating** attachments on update. **Requested:** accept `uploadIds` (and ideally a `coverImageId` re-point) on `PATCH /issues/{id}` so an author can add/remove images while the issue is OPEN, matching the create contract. Until then the edit forms should not send `uploadIds` on patch — it only breaks the whole save, while cover/text/category edits work fine without it.
  - **Live-spec verification (2026-06-19):** PATCH `/issues/{id}` request schema = `title, description, language, coverImageId, category, latitude, longitude, addressText, municipality, ward, provinceId, districtId` — **no `uploadIds`.** POST `/issues` has it (`...uploadIds, conversionThreshold`). Confirmed against the refreshed `07-api-reference.json`, not just the code comment.
  - **Smallest unlock:** add `uploadIds: string[]` (optional) to the existing PATCH schema — mirror the POST validator (caller-owned, confirmed, not attached elsewhere; resolve removals by replacing the set). No new route needed; `coverImageId` re-point already works on PATCH.
  - **Near-miss already on the API, do NOT reuse:** `POST /issues/{id}/after-uploads { uploadIds }` exists but is semantically *"after the cleanup"* photos (before/after documentation, post-resolution) — wrong bucket for editing an OPEN issue's general gallery, and it would mis-tag the images. Listing it here so it isn't mistaken for the fix.
  - **Frontend state:** the additional-images field on both edit forms is locked (`extraImagesLocked` → read-only thumbnails of the existing set + "Photo editing isn't available yet — your other changes still save."). It upgrades to a live add/remove/reorder picker the moment PATCH accepts `uploadIds`. Owner: Pranish (backend).

> Surfaced 2026-06-17 while building the member **My issues** (`/me/issues`) CRUD.

- **Author withdraw / delete is missing.** `DELETE /issues/{id}` is Moderator/Admin-only (a moderation takedown). A member has no way to retract or soft-delete their own report. The member My-issues UI therefore ships **Create + Read + Update only** — no delete affordance. **Requested:** an author-scoped withdraw — e.g. `POST /issues/{id}/withdraw` or letting the reporter set a `WITHDRAWN`/closed status on their own OPEN issue — so the "D" of the CRUD can be completed client-side without a moderator.

- **No link from an `EVENT_SCHEDULED` issue back to its event.** The link is one-directional today — an event carries `linkedIssueId`, but the issue payload exposes no `eventId` / embedded `event`, and `GET /events` has no `linkedIssueId` (or `issueId`) filter. So once an issue is promoted, the frontend cannot route a supporter from the issue to the joinable campaign. The issue lifecycle now flips its primary CTA from **Support** (vote) to **Join** at `EVENT_SCHEDULED`, but that Join button has nowhere to point. **Requested (smallest unlock):** expose the scheduled event on the issue read — either a bare **`eventId`** (`string`, public, present only when `status = EVENT_SCHEDULED`/`COMPLETED`) or, preferably, an embedded **`event`** summary `{ id, slug, status, scheduledAt }`. That alone makes the Join CTA live, because it reuses the **existing** event-participants join (`POST /events/{id}/participants` + roster) — **no separate "join on issue" endpoint is needed.** A `linkedIssueId` filter on `GET /events` would also work as a fallback. (Frontend reads `issue.eventId` / `issue.event` already via `getIssueEventId` — the CTA upgrades itself the moment the field ships.)

---

## Recent changes

- `2026-06-23` — **🔗 Participation counts kept in sync end-to-end (FE).** The issue detail's topline conversion progress (`attendingCount / conversionThreshold`, "5/10 joined") and the participation panel's "Participants N" count badge had drifted apart — the badge re-derived its own total by summing the per-role `eventRoleCounts` buckets plus the viewer's lead offer, a *different, smaller* set than `attendingCount`. Live-confirmed on `backend.shramdan.org` why they can't match that way: `attendingCount` counts **all** GOING voters, but GOING voters who picked **no** `eventRole` never land in a bucket (seeded OPEN Sarangkot issue: `attendingCount=5` vs `Σ eventRoleCounts=2`). Fix: the badge now reads the same `attendingCount` the bar reads (`totalOverride` on the shared `ParticipantsPanel`), so headline ≡ badge by construction; the role rows stay a breakdown of those who chose a role. **Confirmed vote contract (this is what made the counts stale):** `POST /issues/{id}/vote` returns **`201` no body** and `DELETE …/vote` **`200` no body** — **no echo of the fresh tallies**. So the FE can no longer trust a response payload (the old code's optimistic `payload.attendingCount`/`eventRoleCounts` reads were always `undefined`, and `eventRoleCounts` in particular was *never* refreshed → joining a role never moved its per-role tally, exactly the bug the screenshot caught). After every vote/retract the page now re-reads `GET /issues/{id}` (`voteCount`/`attendingCount`/`conversionThreshold`/`eventRoleCounts`/`status`) **plus** `GET /issues/{id}/participants`, reconciling the whole surface from one server snapshot; an optimistic GOING-only delta keeps the bar/badge snappy until the refetch lands. Verified live across withdraw, join-as-role, and interested (interested bumps `voteCount` only, leaves `attendingCount`/badge put). **Nice-to-have for backend:** echo the updated `{ voteCount, attendingCount, conversionThreshold, eventRoleCounts, status }` on the vote/retract responses → the FE could drop the extra `GET /issues/{id}` per vote.
- `2026-06-23` — **🔁 Backend dropped `COORDINATOR` from the `eventRole` enum — the Coordinator ≡ Leader divergence we flagged 2026-06-22 is now resolved API-side.** `POST /issues/{id}/vote` (`eventRole`) and `GET /issues/{id}/participants` (`data.items[].eventRole`) now accept/return six values: `WORKER | PHOTOGRAPHER | LIVESTREAMER | MEDIC | SAFETY_LEAD | LOGISTICS`. (Same enum change hit four event-side endpoints — see `event-participants.md`.) The FE was already aligned on the detail surfaces (the `/issues/[id]` roster + `SupportRolesModal` filter `COORDINATOR` out), so no detail-page change was needed. **One live break, fixed this session:** `IssueVoteButton`'s built-in role picker (issue **cards / preview**) still listed `COORDINATOR` in `EVENT_ROLE_ORDER`, so a GOING voter there could POST `eventRole: COORDINATOR` — now rejected by the API. Dropped it from the picker; leadership on those surfaces stays available via the `WANT_TO_LEAD` (offer-to-lead) option. The `wantToLeadCount` / WANT_TO_LEAD-roster gap below is unaffected and still open.
- `2026-06-22` — **Join CTA on `EVENT_SCHEDULED` issues now works (interim resolver).** The Join button was hitting a dead "joining opens shortly" cue because the issue read exposes no link to its scheduled event. Root-caused live: it is a **backend read-side gap, not a FE logic bug** — `POST /issues/{id}/vote` correctly returns `400 ISSUE_NOT_OPEN` past `OPEN`, so a promoted issue must join via its event, but neither `issue.event` nor a `GET /events?issueId=` filter exists. Shipped `resolveEventForIssue()` (`lib/eventsApi.js`) — recovers the event by district-narrowed `/events` list + client-side `issueId` match — and wired its result into `IssueJoinButton` (new `eventId` prop) on `/issues/[id]`, so the CTA routes to the real join flow on `/events/{slug}`. Auto-removes once `issue.event` ships. Full plan↔API sync matrix + the backend ask logged in Gaps above.
- `2026-06-22` — **✅ Issue-side participation surface shipped (FE).** `/issues/[id]` now renders `IssueParticipationPanel` below the description — the issue-stage twin of the event page's join/roster surfaces, since an issue is a not-yet-scheduled event. Three blocks, all live-verified against `backend.shramdan.org`: **(1) conversion progress** — `attendingCount / conversionThreshold` (GOING-driven, not raw `voteCount`); **(2) your participation** — reflects the viewer's own vote back (Interested / Going-as-`<role>` / Want-to-lead), derived from `GET /issues/me/votes` (`voterRole` + `eventRole`), so it persists across refresh; **(3) roster** — GOING voters grouped by `eventRole` from the new `GET /issues/{id}/participants`, cross-checked with `eventRoleCounts`, viewer's own role highlighted. The Support button (`IssueVoteButton`) now bubbles each vote/retract up via `onVoteChange` so the panel + counts update without a refetch, and takes `initialVoterRole` (from the same `me/votes` read) to show role-tiered withdraw-confirmation copy. Backend endpoints consumed: `GET /issues/{id}/participants`, `GET /issues/me/votes` (now decorated with `voterRole`/`eventRole`/`votedAt`), and `attendingCount`/`conversionThreshold`/`eventRoleCounts` on the issue reads. Remaining backend asks (per-viewer echo on the detail read; issue→event link) logged in Gaps above.
- `2026-06-19` — **Status-gated primary CTA: Support → Join.** Issue surfaces (detail page, grid card, preview pane) now switch their primary action by lifecycle: `OPEN` → Support (vote), `EVENT_SCHEDULED` → Join, `COMPLETED`/`REJECTED`/`DUPLICATE` → no action. Decision centralized in `lib/issueActions.js` (`issueActionMode`). The Join CTA (`IssueJoinButton`) is forward-compatible — it routes to `/events/{eventId}` via `getIssueEventId(issue)` once the backend exposes the link, and shows a graceful "joining opens shortly" cue until then. Logged the issue→event link gap above.
- `2026-06-17` — Documented entity to back the member My-issues surface (`GET /issues/me` consumed; OPEN-only author edit wired). Logged the author withdraw/delete gap.
