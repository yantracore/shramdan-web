# Frontend API Usage Map

The authoritative source for backend endpoint contracts (request bodies, response shapes, status codes, auth) is `docs/07-api-reference.json` — the OpenAPI 3.0 spec generated from the backend. This document is the consumer-side index: which frontend page or component calls which endpoint, and through which `apiClient` helper.

This map is maintained by hand. Do **not** auto-generate it from the OpenAPI spec — the value here is showing real call sites, which the spec cannot describe.

## Freshness protocol

The backend deploys outside our working hours, so the local `docs/07-api-reference.json` can be stale at the start of a new working session. Agents enforce freshness via a 6-hour TTL stored in `docs/07-api-reference.meta.json`:

- Before consulting `07-api-reference.json` or citing any endpoint contract, read `07-api-reference.meta.json` and compare `lastFetchedAt` (NPT, UTC+05:45) against the current time.
- If the gap is **≥ `stalenessThresholdHours`** (currently 6), silently run the `fetchCommand` (`curl -fsSL https://backend.shramdan.org/api-docs.json -o docs/07-api-reference.json`), then update `lastFetchedAt` + `lastFetchedAtDisplay` in the meta file to the new fetch moment, and announce the refresh in one line (`API docs were Xh stale — refreshed from backend.`).
- Inside the 6h window, trust the local copy and skip the network call.
- Do not prompt the user; freshness is automatic. An explicit "update the API docs" from the user still triggers an immediate fetch regardless of the timestamp.

The 6h threshold lives in the meta file, not in code, so it can be adjusted in one place.

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

Mutations beyond create/edit (status change, notes, delete) are still blocked by missing backend endpoints — see `docs/09-backend-admin-gaps.md`.

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /issues` | `getJson` | Initial load; params: `status`, `category`, `sort`, `limit=100` |
| `GET /issues/{id}` | `getJson` | "View detail" on a row (fetches uploads + reporter info) |

### `src/app/admin/issues/create/page.js`

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `POST /issues` | `postJson` | Submit of the shared `IssueForm` |

### `src/app/admin/issues/[id]/edit/page.js`

Uses the same `IssueForm` component as the create page (see "One shared form component per entity" in `docs/05-design-language-guide.md`).

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /issues/{id}` | `getJson` | Initial load to populate `initialValues` |
| `PATCH /issues/{id}` | `patchJson` | Submit of the shared `IssueForm` — currently blocked by missing backend endpoint, see `docs/09-backend-admin-gaps.md` |

### Public issue pages

| Page | Method + path | apiClient fn | Notes |
| --- | --- | --- | --- |
| `src/app/issues/page.js` | `GET /issues` | `getJson` | Anonymous; params: `status`, `category`, `sort`, `limit=50`; client-side filters out non-public statuses |
| `src/app/issues/[id]/page.js` | `GET /issues/{id}` | `getJson` | Anonymous; loads detail + a second `GET /issues` call (by category) for "Other issues in this category" |

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
