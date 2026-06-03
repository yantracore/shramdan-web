# Backend Admin API Gaps

This document tracks backend endpoints that the admin UI needs but that are not yet exposed by the API (`07-api-reference.json`). The admin frontend treats these modules as read-only until the endpoints land.

Gaps tracked here typically appear as `[!]` blocked leaves in [00-master-roadmap.md](../ops/00-master-roadmap.md). When a gap is closed, both files should be updated in the same change.

> **2026-06-03 migration note.** Per the [UI-first pivot ADR](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md), per-domain API contracts now live in [`../api-requirements/`](../api-requirements/). That folder is the **canonical** spec the backend should implement against. This file remains useful as a quick "what's still missing" scratchpad — the two are not contradictory. When this file says a gap exists, the corresponding domain file in `api-requirements/` carries the full prose spec.
>
> **Recent gaps surfaced by UI ships (2026-06-03):**
>
> - `POST /events/{id}/complete` payload: confirm backend accepts `{ resultSummary: string, completedAt: ISO datetime }`. Frontend now sends this shape; the operation is consumed by [`LeaderCompleteEditor`](../../src/components/LeaderCompleteEditor.js). Spec: [`../api-requirements/events.md`](../api-requirements/events.md).
> - `POST /events/{id}/join` accepting `{ role: ParticipantRole }` — UI surface [`EventJoinPanel`](../../src/components/EventJoinPanel.js) currently degrades 404/501 to an info toast. Spec: [`../api-requirements/event-participants.md`](../api-requirements/event-participants.md).
> - `GET /events/{id}/participants` (or roster echo on `GET /events/{id}`) — UI renders the roster from `rolesNeeded` + `filledNames` aggregates; backend must populate the same shape. Spec: [`../api-requirements/event-participants.md`](../api-requirements/event-participants.md).
> - `POST /events/{id}/activate` to transition `SCHEDULED → ACTIVE` once the pre-event safety checklist is satisfied (roadmap 4.6, shipping after this entry). Spec landing in [`../api-requirements/events.md`](../api-requirements/events.md).

## Issues

Current API only exposes:

- `GET /issues` — list with filters (`status`, `category`, `sort`, `limit`, `cursor`)
- `POST /issues` — create (verified user)
- `GET /issues/{id}` — detail with attached uploads
- `POST /issues/{id}/vote` — upvote
- `DELETE /issues/{id}/vote` — remove vote

### Admin create

Admin issue creation is wired against the existing `POST /issues` endpoint via
`/admin/issues/create`. Because the endpoint only requires a verified user (not an
admin role specifically), no new backend contract is needed — admins are verified by
definition. If a future product decision needs admin-only creation semantics (e.g.
skipping verification gates, attaching admin-only metadata), a dedicated
`POST /admin/issues` endpoint should be introduced rather than overloading the public
route.

### Missing for admin CRUD

The `/admin/issues` page is otherwise read-only because the API does not yet provide:

- `PATCH /issues/{id}/status` — set lifecycle status (e.g. `OPEN` → `EVENT_SCHEDULED`, `REJECTED`, `DUPLICATE`, `COMPLETED`)
- `PATCH /issues/{id}` — edit title, description, category, location, or merge metadata (needed for `/admin/issues/{id}/edit`)
- `PATCH /issues/{id}/notes` — store admin-side notes (parallel to `applications` / `feedback` admin notes)
- `DELETE /issues/{id}` — remove spam, abusive, or duplicate reports
- Optional: `GET /issues/{id}/votes` — list voters with their `voterRole` so admins can plan event roles

### `isVoted` missing on `GET /issues/{id}`

When the caller sends a bearer token, `GET /issues` (list) returns a per-issue
`isVoted` boolean — used by `IssueVoteButton` to render the "already supported"
state without a separate round-trip. The detail endpoint `GET /issues/{id}` does
not include this field even when authenticated, so the issue-detail page falls
back to `voted=false` until the user clicks and the `POST /issues/{id}/vote` 409
handler flips the state. Add `isVoted` to the detail response for parity.

### Response shape change: `translations[]` instead of top-level `title`/`description`

The live `/issues` and `/issues/{id}` responses now nest title/description inside
a `translations: [{ locale, title, description }]` array per locale (`en`, `ne`),
instead of returning them at the top level. `07-api-reference.json` was
regenerated 2026-05-28 but still shows the old top-level shape, so this is a
spec-vs-backend drift the OpenAPI export needs to pick up. Frontend currently
reads `issue.title` directly (see `PublicIssueCard`, `IssueDetailPage`) and will
need a small helper (`pickIssueTranslation(issue, language)`) once we adopt the
new shape.

When these arrive, mirror the patterns already in `src/app/admin/applications/page.js` and `src/app/admin/feedback/page.js`:

- Status `Select` per row using `patchJson(`/issues/${id}/status`, { status })`
- Notes modal using `patchJson(`/issues/${id}/notes`, { adminNotes })`
- Delete `Popconfirm` using `deleteJson(`/issues/${id}`)`
- Edit page at `/admin/issues/{id}/edit` reusing the same form layout as `/admin/issues/create`, calling `patchJson(`/issues/${id}`, values)`

### Cover image (uploads) wiring

Both `/admin/issues/create` and `/admin/issues/[id]/edit` ship a drag-and-drop
cover field via the shared `IssueCoverUpload` component. It follows the same
three-step `/uploads/presign` → R2 PUT → `/uploads/{id}/confirm` flow exposed by
`uploadImage` in `src/lib/uploads.js`.

- **Create:** if a cover is set, `POST /issues` includes `uploadIds: [coverId]`.
- **Edit:** the page diffs cover id against the prefilled one and only sends
  `uploadIds` when it changed — an array of one id when a new image was uploaded
  or replaced, or an empty array when the user cleared an existing cover. When
  `PATCH /issues/{id}` lands, the backend should accept both shapes as a full
  replacement of attached uploads (similar to how arrays replace, not append, in
  REST PATCH bodies for this entity).

## Users

Current API exposes:

- `GET /users` — admin-only paginated list with filters (`role`, `isVerified`, `search`, `limit`, `cursor`)
- `GET /users/{id}` — admin-only detail
- `PATCH /users/{id}/role` — admin-only role change (USER ↔ ADMIN; cannot change own role)

### Known backend bugs (staging)

- `GET /users` currently returns `500 UNKNOWN_ERROR` on staging because the handler
  passes `take` to Prisma as a string instead of an integer
  (`Invalid prisma.user.findMany() invocation — Argument 'take': Invalid value
  provided. Expected Int, provided String.`). The `/admin/users` page is wired
  correctly and will start working as soon as the handler casts `limit + 1` to
  an integer.

### Missing for admin CRUD

The `/admin/users` page currently renders a read-only browse view. To make it a
full admin surface, the backend should provide:

- Stable, paginated `GET /users` (fix the `take` Int cast bug above)
- `PATCH /users/{id}` — edit profile fields the admin is allowed to correct
  (name, username, phone, verification flag) for support cases
- `DELETE /users/{id}` — remove abusive accounts; should soft-delete and
  cascade ownership of issues/uploads to a tombstone user, not hard-delete
- Optional: `POST /users/{id}/verify` — admin-side verification override for
  cases where a real user cannot complete the OTP flow

When `PATCH /users/{id}/role` is exercised from the UI, wire a small confirm
modal per row using `patchJson(`/users/${id}/role`, { role })` and refresh the
list on success. Do not surface the action for the currently-logged-in admin
(the backend forbids self-role-change anyway, but hiding the control avoids a
confusing error).

## Events

### Missing: volunteer join + roster endpoints (blocks roadmap 3.6)

The public campaign detail page at `/events/[id]` (shipped 2026-05-29 for 3.2.1)
has nowhere to send a "I'm joining" click and nothing to render as a roster,
because the API currently exposes no participation endpoints. The only
volunteer-side surface is `GET /api/v1/events/me`, which lists events the
authenticated user is *already* involved in — there is no way to *become*
involved.

Specifically needed before 3.6 can ship:

- `POST /api/v1/events/{id}/join` — current authenticated user opts in as a
  volunteer; may take an optional `role` (e.g. `VOLUNTEER`, `CAMERAMAN`,
  `MEDIC`, `SAFETY_LEAD`) and an optional `note`. Returns the participant
  record. Idempotent (joining twice returns 200 with the existing record).
- `DELETE /api/v1/events/{id}/join` — current authenticated user retracts
  their commitment (or `DELETE /events/{id}/participants/me` if that reads
  better).
- `GET /api/v1/events/{id}/participants` — list of `{userId, name, role,
  joinedAt, status}` for the campaign page roster. Public-readable, with
  display-safe fields only (no phone/email). Cursor-paginated like other
  list endpoints.
- Optional: `myParticipation` field echoed on `GET /events/{id}` so the page
  can render the join button's already-joined state without an extra
  round-trip (mirrors the `isVoted` pattern on issues).

Once these land, the campaign page can ship the join button + roster, and
3.2.3 (volunteer-count progress indicator) becomes trivial — it just counts
participants.

### Missing: `rolesNeeded` shape on event resource (blocks roadmap 3.2.2)

For the campaign detail page's "Help needed" breakdown (3.2.2), the event
resource needs a structured way to express "we need N volunteers, M
cameramen, L medics, etc." Currently nothing on the event distinguishes
roles or counts. A minimal shape:

```json
"rolesNeeded": [
  { "role": "VOLUNTEER", "count": 12, "filled": 4 },
  { "role": "CAMERAMAN", "count": 2,  "filled": 0 }
]
```

Filled-count would derive from `participants` if their `role` is recorded
on join, so the join endpoint should accept and persist a `role` from a
shared enum.

## Applications

### Application role enum expansion

The homepage "We need you" section now invites three additional dev-phase roles
that the backend `ApplicationRole` enum does not yet accept:

- `QA_ENGINEER`
- `DEVOPS_ENGINEER`
- `CONTENT_WRITER`

The frontend cards link to `/join?role=<VALUE>` and the join-form dropdown
(`src/lib/siteContent.js → options.applicationRoles`) lists them, but
`POST /applications` will reject submissions with one of these values until
the backend enum is extended. Add the three values to the enum (and to the
admin filter list) when convenient — no other contract change is needed.
