# Frontend API Usage Map

The authoritative source for backend endpoint contracts (request bodies, response shapes, status codes, auth) is `docs/07-api-reference.json` — the OpenAPI 3.0 spec generated from the backend. This document is the consumer-side index: which frontend page or component calls which endpoint, and through which `apiClient` helper.

This map is maintained by hand. Do **not** auto-generate it from the OpenAPI spec — the value here is showing real call sites, which the spec cannot describe.

## API Client

All requests go through `src/lib/apiClient.js`:

- `getJson(path, { params, requireAuth })`
- `postJson(path, values, { requireAuth })`
- `patchJson(path, values, { requireAuth })`
- `deleteJson(path, { requireAuth })`
- `loginWithPassword(credentials)` — convenience wrapper over `postJson("/auth/login", ...)`

Base URL: `process.env.NEXT_PUBLIC_API_BASE_URL` (falls back to `https://backend.shramdan.org/api/v1`). Bearer token is attached automatically when `requireAuth: true` and the session has a stored token.

## Auth flow

| Page | Method + path | apiClient fn | Notes |
| --- | --- | --- | --- |
| `src/app/login/page.js` | `POST /auth/login` | `loginWithPassword` | Stores `accessToken` + `user` via `setAuthSession`; routes `ADMIN` to `/admin` |

## Public submission pages

| Page | Method + path | apiClient fn | Notes |
| --- | --- | --- | --- |
| `src/app/join/page.js` | `POST /applications` | `postJson` | Anonymous; role selected from `copy.en.options.applicationRoles` |
| `src/app/feedback/page.js` | `POST /feedback` | `postJson` | Anonymous; type from `copy.en.options.feedbackTypes` |

## Admin pages

All admin requests are sent with `requireAuth: true`.

### `src/app/admin/applications/page.js`

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /applications` | `getJson` | Initial load and on filter change (role, status) |
| `PATCH /applications/{id}/status` | `patchJson` | Status `Select` change on a row |
| `PATCH /applications/{id}/notes` | `patchJson` | "Save notes" in admin notes modal |
| `DELETE /applications/{id}` | `deleteJson` | Delete `Popconfirm` confirm |

### `src/app/admin/feedback/page.js`

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /feedback` | `getJson` | Initial load and on filter change (type, status) |
| `PATCH /feedback/{id}/status` | `patchJson` | Status `Select` change on a row |
| `PATCH /feedback/{id}/reply` | `patchJson` | "Save reply" in admin reply modal |
| `DELETE /feedback/{id}` | `deleteJson` | Delete `Popconfirm` confirm |

### `src/app/admin/issues/page.js`

Read-only. Mutations are blocked by missing backend endpoints — see `docs/09-backend-admin-gaps.md`.

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /issues` | `getJson` | Initial load; params: `status`, `category`, `sort`, `limit=100` |
| `GET /issues/{id}` | `getJson` | "View detail" on a row (fetches uploads + reporter info) |

### `src/app/admin/events/page.js`

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /events` | `getJson` | Initial load; params: `status`, `fromDate`, `toDate`, `limit=100` |
| `GET /events/{id}` | `getJson` | "View detail" on a row (fetches linked issue, leader, uploads) |
| `GET /events/{id}/leader-voting` | `getJson` | Opening detail modal; refreshed after leader/tie-break/settle mutations |
| `PATCH /events/{id}/leader` | `patchJson` | "Assign leader" modal — admin picks a verified user via `GET /users` search |
| `PATCH /events/{id}/leader-voting/tie-break` | `patchJson` | "Tie-break voting" modal — admin picks from tied candidates when voting status is `PENDING_ADMIN` |
| `POST /events/{id}/leader-voting/settle` | `postJson` | "Settle voting" `Popconfirm` — time-driven, safe to re-call |
| `GET /users` | `getJson` | Leader assignment modal search — params: `search`, `isVerified=true`, `limit=20` |

Scheduling (`PATCH /events/{id}/schedule`) and completion (`POST /events/{id}/complete`) are restricted to the assigned event leader by the API, so they are not exposed in the admin UI.

## Keeping this updated

When you add a page or component that calls a backend endpoint:

1. Append a row to the relevant section above with the file path, HTTP method + path, `apiClient` function, and a one-line trigger description.
2. If the endpoint is not yet present in `docs/07-api-reference.json`, also list it in `docs/09-backend-admin-gaps.md` so the gap is tracked.
3. Do not regenerate this file from the OpenAPI spec. The OpenAPI spec describes the backend surface; this map describes which frontend call sites use that surface. Both are needed.

When an endpoint is renamed or removed on the backend, update both `docs/07-api-reference.json` (via the backend export) and the matching rows here.
