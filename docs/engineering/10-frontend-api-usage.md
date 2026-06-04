# Frontend API Usage Map

The authoritative source for backend endpoint contracts (request bodies, response shapes, status codes, auth) is `07-api-reference.json` — the OpenAPI 3.0 spec generated from the backend. This document is the consumer-side index: which frontend page or component calls which endpoint, and through which `apiClient` helper.

This map is maintained by hand. Do **not** auto-generate it from the OpenAPI spec — the value here is showing real call sites, which the spec cannot describe.

## Freshness protocol

The backend deploys outside our working hours, so the local `07-api-reference.json` can be stale at the start of a new working session. Agents enforce freshness via a 6-hour TTL stored in `07-api-reference.meta.json`:

- Before consulting `07-api-reference.json` or citing any endpoint contract, read `07-api-reference.meta.json` and compare `lastFetchedAt` (NPT, UTC+05:45) against the current time.
- If the gap is **≥ `stalenessThresholdHours`** (currently 6), run the `fetchCommand` (`node scripts/refresh-api-docs.mjs`). That single command does everything: backs up the current spec to `07-api-reference.prev.json`, fetches the new spec into `07-api-reference.json`, writes a shape-level diff to `07-api-reference.changes.json`, and rewrites the `lastFetchedAt` + `lastFetchedAtDisplay` fields in the meta file. Agents do **not** hand-edit those timestamp fields anymore.
- Announce the refresh in one line, with the diff totals folded in: `API docs were Xh stale — refreshed (+A new endpoints, -R removed, ~M modified).`
- Inside the 6h window, trust the local copy and skip the refresh.
- Do not prompt the user; freshness is automatic. An explicit "update the API docs" from the user still triggers an immediate refresh regardless of the timestamp.

The 6h threshold lives in the meta file, not in code, so it can be adjusted in one place.

### What the diff captures

`07-api-reference.changes.json` is rewritten on every refresh. Shape comparison is done at the `METHOD /path` level. An endpoint is flagged `modified` when any of these change between refreshes: parameter count, presence of a request body, set of response status codes, or auth requirement. Deep request/response body field renames are **not** tracked — by design, to keep noise low. Three buckets:

- `added` — endpoints that exist now but did not before.
- `removed` — endpoints that existed before but no longer do.
- `modified` — endpoints whose shape (per the rules above) shifted, each row carries the specific `params N→M`, `requestBody true→false`, `responses […]→[…]`, or `auth false→true` notes.

The `acknowledgedAt` field starts as `null` after a refresh. The agent surfaces the diff in its next start-of-day briefing (or current reply if a refresh fires mid-session), then writes an ISO timestamp into `acknowledgedAt` so it doesn't get re-announced on every subsequent message inside the same TTL window. The next refresh resets it to `null` again.

### How the diff lands in the briefing

Each diff entry is surfaced with an *actionable* hint — not a raw list. Before writing the briefing, the agent cross-references every endpoint in the diff against the consumer map in this file (the tables below). Both path forms are checked (`POST /applications` and `POST /api/v1/applications`) because this file lists endpoints relative to the apiClient base URL while the OpenAPI spec uses the absolute form.

- **`added`** — if no caller is found here, the entry is labelled `not yet wired` with a suggested call-site path based on the URL segment (e.g. `/admin/foo` → `src/app/admin/foo/page.js`). If a caller already exists (the frontend was anticipating it), the entry is labelled `wired in <file> (now unblocked)`.
- **`removed`** — if a caller exists here, the entry is labelled `WILL BREAK <file>` so the user can decide to update or remove that consumer. If no caller, `no current consumers`.
- **`modified`** — if a caller exists, the entry is labelled with the change list and the affected file(s): `consumers in <file> may need updates: params 1→2`. If no caller, `not yet wired (no callers to update)`.

The diff section ends with a one-line next-step prompt when anything is `added` (unwired) or `removed` (breaking), inviting the user to wire it up or fix the break. The agent never silently drops `removed` entries from the briefing, even if the bucket overflows the scannability cap — those are the riskiest.

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

Mutations beyond create/edit (status change, notes, delete) are still blocked by missing backend endpoints — see `09-backend-admin-gaps.md`.

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /issues` | `getJson` | Initial load; params: `status`, `category`, `sort`, `limit=100` |
| `GET /issues/{id}` | `getJson` | "View detail" on a row (fetches uploads + reporter info) |

### `src/app/admin/issues/create/page.js`

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `POST /issues` | `postJson` | Submit of the shared `IssueForm` |

### `src/app/admin/issues/[id]/edit/page.js`

Uses the same `IssueForm` component as the create page (see "One shared form component per entity" in `../design/05-design-language-guide.md`).

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /issues/{id}` | `getJson` | Initial load to populate `initialValues` |
| `PATCH /issues/{id}` | `patchJson` | Submit of the shared `IssueForm` — currently blocked by missing backend endpoint, see `09-backend-admin-gaps.md` |

### Public event pages

| Page / component | Method + path | apiClient fn | Notes |
| --- | --- | --- | --- |
| `src/app/events/[id]/page.js` | `GET /events/{id}` | `getJson` | Anonymous; primary event payload. Returns the raw `rolePlan`, not the derived `rolesNeeded` aggregation. |
| `src/app/events/[id]/page.js` | `GET /events/{id}/participants?limit=200` | `getJson` | Anonymous; loaded once per visit when the event payload carries a `rolePlan`. The page composes `rolesNeeded` (with `filled` / `filledNames`) and `participantCount` client-side via `src/lib/eventParticipants.js`. Soft-fails to zero-fill if the request errors. Skipped for demo events. |
| `src/components/EventJoinPanel.js` | `GET /events/{id}/participants/me` | `getJson` | Authenticated; called on mount to detect whether the viewer is already a participant. 404 means "not joined yet" — handled silently. Drives the `joined / waitlisted / checked-in` label states. |
| `src/components/EventJoinPanel.js` | `POST /events/{id}/participants` | `postJson` | Authenticated; body `{ role }`. 201 = joined (CONFIRMED) or waitlisted (INVITED). 403 surfaces a medic-credential error toast; 409 re-pulls the participation record so the UI flips to "joined" state. |

### Comments (issue + event detail pages)

All comment requests funnel through `src/lib/commentsApi.js` (`fetchComments` / `createComment` / `updateComment` / `deleteCommentRemote` / `addReactionRemote` / `removeReactionRemote`). The consumer is `src/components/comments/CommentSection.js`, mounted from both `src/app/issues/[id]/page.js` and `src/app/events/[id]/page.js`.

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /comments?targetType&targetId&limit=200` | `getJson` | Mount and after every successful mutation. Bearer token attached when the viewer is authenticated so the response includes any per-viewer fields. |
| `POST /comments` | `postJson` | Composer submit (top-level or reply); body `{ targetType, targetId, parentId?, text, mentions? }`. |
| `PATCH /comments/{id}` | `patchJson` | Edit composer submit within the five-minute window; body `{ text, mentions? }`. |
| `DELETE /comments/{id}` | `deleteJson` | "Delete" action on own comment (soft delete by default). |
| `POST /comments/{id}/reactions` | `postJson` | Emoji picker selection — fires when the local overlay flip records a new pick; body `{ emoji }`. |
| `DELETE /comments/{id}/reactions?emoji=…` | `deleteJson` | Same handler reverses the toggle when the viewer's pick flips off. |

Pin and flag remain a localStorage overlay (`src/lib/comments.js`) — admin-only features the backend does not yet expose. The `myReactions` field is also not returned by staging, so the local overlay also keeps a per-viewer `picks` list so reaction chips can render their toggled-on state across reloads.

### Public issue pages

| Page | Method + path | apiClient fn | Notes |
| --- | --- | --- | --- |
| `src/app/issues/page.js` | `GET /issues` | `getJson` | Anonymous; params: `status`, `category`, `sort`, `limit=50`; client-side filters out non-public statuses. When the user is logged in, `apiClient` attaches the bearer token automatically and the response includes a per-issue `isVoted` boolean used to seed the "already supported" state |
| `src/app/issues/[id]/page.js` | `GET /issues/{id}` | `getJson` | Anonymous; loads detail + a second `GET /issues` call (by category) for "Other issues in this category". `isVoted` is **not** returned on this endpoint today — see `09-backend-admin-gaps.md` |
| `src/components/IssueVoteButton.js` (via `useIssueVote`) | `POST /issues/{id}/vote` | `voteOnIssue` | Authenticated; verified users only; hard-coded `voterRole: "INTERESTED"`; flips local `voted` state on success/409 |

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

## Public URL filter convention (roadmap 13.4)

KPI tiles, activity strips, and impact summaries deep-link into the public list pages with a shared query-param contract. The contract is intentionally short — only what the frontend list pages already honor.

### `/events`

| Param | Values | Meaning |
| --- | --- | --- |
| `show` | `live`, `upcoming`, `past`, `all` (default) | Filter pill on the events list |
| `category` | one of the event-type slugs (`cleanup`, `afforestation`, `beautification`, `trail`, `dam`, `infrastructure`, `seasonal`, `disaster`) | Restrict to a single category |
| `range` | `today`, `week`, `month` | Reserved — not yet honored on `/events`. Logged as a follow-up. |

### `/issues`

| Param | Values | Meaning |
| --- | --- | --- |
| `status` | one of the status enums (`OPEN`, `PROMOTED`, `EVENT_SCHEDULED`, `COMPLETED`, `REJECTED`, `DUPLICATE`) | Filter pill on the issues list |
| `category` | string | Category filter |
| `sort` | `voteCount` (default), `newest` | Sort order |

### Where the convention is applied today

- `/impact` category-mix rows link to `/events?show=past&category=<key>` (shipped 2026-06-03 with 13.2.2).
- `/events` ImpactPulseStrip tiles link to `/events?show=<live|upcoming>`, `/issues?status=OPEN`, `/impact` (shipped 2026-06-03 with 13.3).
- `/app` member dashboard "Browse" links use the same conventions.

When you ship a new KPI tile or summary link, point it at one of these contracts; if you need a new query param, extend the table above first and then update the list pages to honor it.

## Keeping this updated

When you add a page or component that calls a backend endpoint:

1. Append a row to the relevant section above with the file path, HTTP method + path, `apiClient` function, and a one-line trigger description.
2. If the endpoint is not yet present in `07-api-reference.json`, also list it in `09-backend-admin-gaps.md` so the gap is tracked.
3. Do not regenerate this file from the OpenAPI spec. The OpenAPI spec describes the backend surface; this map describes which frontend call sites use that surface. Both are needed.

When an endpoint is renamed or removed on the backend, update both `07-api-reference.json` (via the backend export) and the matching rows here.
