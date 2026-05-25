# Backend Admin API Gaps

This document tracks backend endpoints that the admin UI needs but that are not yet exposed by the API (`docs/07-api-reference.json`). The admin frontend treats these modules as read-only until the endpoints land.

Gaps tracked here typically appear as `[!]` blocked leaves in [00-master-roadmap.md](00-master-roadmap.md). When a gap is closed, both files should be updated in the same change.

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
