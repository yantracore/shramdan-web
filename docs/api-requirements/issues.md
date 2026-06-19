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
- **voteCount** (`number`, required, public) — number of supporters; drives the promotion threshold.
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

### Unified Support / Join — per-viewer participation reads (requested 2026-06-19)

> Backs the unified Support/Join control shared by every issue + event surface.
> An issue is a not-yet-scheduled event; the frontend reconciles both into one UX
> while the backend split stays (`POST /issues/{id}/vote` for issues,
> `POST /events/{id}/participants` for events). These read fields are what the UI
> needs to pick the right button + render the persisted "already done" state by
> lifecycle, on refresh, without a click.

**Per-viewer support echo — on `GET /issues/{id}` (detail) AND `GET /issues` (list), authenticated:**

- **isVoted** (`boolean`) — already returned on the list; **must also be added to `GET /issues/{id}`.** Without it the detail page shows "Support" (un-voted) on every refresh and only flips after a click trips `ALREADY_VOTED (409)`.
- **voterRole** (`enum`, nullable) — the caller's stored vote intent (`INTERESTED | GOING | WANT_TO_LEAD`). Needed to render "Supported" vs the specific role.
- **eventRole** (`enum`, nullable) — the participation role chosen when `voterRole = GOING` (`WORKER | PHOTOGRAPHER | LIVESTREAMER | MEDIC | SAFETY_LEAD | COORDINATOR | LOGISTICS`). Just echo back what `POST /issues/{id}/vote { voterRole, eventRole }` stored.

**Linked event — on the issue read once promoted (`status = EVENT_SCHEDULED`):**

- **event** (`object`, nullable, public) — embed `{ id, slug, status, scheduledAt, leaderId }`. The **event `status`** (`DRAFT | SCHEDULED | ACTIVE | PAUSED | COMPLETED | CANCELLED`) is essential: the issue stays `EVENT_SCHEDULED` permanently after promotion, so the UI derives the correct action row from `event.status` — Join **+ Lead** while the event is `DRAFT`, Join-as-Role at `SCHEDULED`, Join-as-Worker at `ACTIVE`. (Supersedes the older "No link from an EVENT_SCHEDULED issue back to its event" gap below — same ask, now with the required sub-shape.)
- **event.viewerParticipation** (`object`, nullable, authenticated) — `{ id, role, status }` for the caller on the linked event, or null. Lets the issue surface show "Joined as X" without a separate `/events/{id}/participants/me` round-trip. (Mirrors the events-side `viewerParticipation` ask in `events.md`.)

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

- `2026-06-19` — **Status-gated primary CTA: Support → Join.** Issue surfaces (detail page, grid card, preview pane) now switch their primary action by lifecycle: `OPEN` → Support (vote), `EVENT_SCHEDULED` → Join, `COMPLETED`/`REJECTED`/`DUPLICATE` → no action. Decision centralized in `lib/issueActions.js` (`issueActionMode`). The Join CTA (`IssueJoinButton`) is forward-compatible — it routes to `/events/{eventId}` via `getIssueEventId(issue)` once the backend exposes the link, and shows a graceful "joining opens shortly" cue until then. Logged the issue→event link gap above.
- `2026-06-17` — Documented entity to back the member My-issues surface (`GET /issues/me` consumed; OPEN-only author edit wired). Logged the author withdraw/delete gap.
