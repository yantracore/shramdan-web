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

### Missing for admin CRUD

The `/admin/issues` page is read-only because the API does not yet provide:

- `PATCH /issues/{id}/status` — set lifecycle status (e.g. `OPEN` → `EVENT_SCHEDULED`, `REJECTED`, `DUPLICATE`, `COMPLETED`)
- `PATCH /issues/{id}` — edit title, description, category, location, or merge metadata
- `PATCH /issues/{id}/notes` — store admin-side notes (parallel to `applications` / `feedback` admin notes)
- `DELETE /issues/{id}` — remove spam, abusive, or duplicate reports
- Optional: `GET /issues/{id}/votes` — list voters with their `voterRole` so admins can plan event roles

When these arrive, mirror the patterns already in `src/app/admin/applications/page.js` and `src/app/admin/feedback/page.js`:

- Status `Select` per row using `patchJson(`/issues/${id}/status`, { status })`
- Notes modal using `patchJson(`/issues/${id}/notes`, { adminNotes })`
- Delete `Popconfirm` using `deleteJson(`/issues/${id}`)`
