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
| `src/app/login/page.js` | `POST /auth/login` | `loginWithPassword` | Stores `accessToken` + `user` via `setAuthSession`; routes `ADMIN` to `/admin`. The "Forgot password?" link now points to `/reset-password` (was a `/feedback` dead-link) |
| `src/app/reset-password/page.js` | `POST /auth/forgot-password` | `forgotPassword` | Phase 1: email → emails a 6-digit reset code. 429 on cooldown |
| `src/app/reset-password/page.js` | `POST /auth/reset-password` | `resetPassword` | Phase 2: `{ email, otp, newPassword }` → success redirects to `/login`. 400 bad OTP, 404 no pending code, 429 too many attempts |
| `src/app/signup/page.js` | `POST /applications/request-otp` | `requestApplicationOtp` | Anonymous; emails a 6-digit code as the user leaves the details step. 409 `USER_ALREADY_EXISTS` / 429 cooldown keep the user on the step with the backend message |
| `src/app/signup/page.js` | `POST /applications` | `submitApplication` | Anonymous; body adds `otp` + `password` (+ default `role: VOLUNTEER`, default `motivation`). 201 creates a **verified** account and returns `{ user, application, accessToken, refreshToken }` → fed straight into `setAuthSession` (the user lands signed in) |

### Account security (`src/components/AccountSecurity.js`, mounted on `src/app/me/page.js`)

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /auth/sessions` | `fetchSessions` | Mount of the `/me` security card — lists active sessions (`{ id, userAgent, ip, createdAt, expiresAt }`) |
| `DELETE /auth/sessions/{id}` | `revokeSession` | Per-session "Revoke" `Popconfirm` |
| `POST /auth/logout-all` | `logoutAllSessions` | "Sign out everywhere" — clears the local session + redirects to `/login` |
| `DELETE /auth/me` | `deleteAccount` | Danger-zone "Delete account" modal; body `{ password }`, 403 on wrong password. Clears the session + redirects home |
| `POST /auth/phone/send-otp` | `sendPhoneOtp` | "Verify phone" card (`PhoneVerify`) on `/me` — sends an SMS code. 503 = SMS unavailable, surfaced as a soft notice |
| `POST /auth/phone/verify` | `verifyPhoneOtp` | OTP modal; body `{ otp }`. On success refreshes the profile so the verified state flips. Optional surface (only shown when a phone is on file and unverified) |

> **2026-06-17 signup rewrite.** `POST /auth/register` + `POST /auth/verify-otp` (the SMS-OTP member flow) were retired on the backend. Member signup now runs through the application-signup endpoints above (email OTP), which **create the account and the application together**. `/app/signup` still 302-redirects to `/signup`. The old `registerMember` / `verifyOtp` / `resendOtp` apiClient helpers were removed.

## Public submission pages

| Page | Method + path | apiClient fn | Notes |
| --- | --- | --- | --- |
| `src/app/join/page.js` | `POST /applications/request-otp` | `requestApplicationOtp` | Anonymous; `ContributorForm` calls it (via `onRequestOtp`) on the motivation→verify transition. Failure keeps the user on the motivation step |
| `src/app/join/page.js` | `POST /applications` | `submitApplication` | Anonymous; the contributor form now collects `password` + `otp` on a 5th "verify" step. Body is `{ name, email, phone, motivation, otp, password, role: VOLUNTEER, additionalInfo: "n/a", resumeId? }`. 201 creates a verified account + application and signs the applicant in (`setAuthSession`) |
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

Status change + delete landed 2026-06-17 (via `useAdminItemMutation`, mirroring the applications/feedback pattern). Edit + admin-notes are still blocked — see `09-backend-admin-gaps.md`.

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /issues` | `getJson` | Initial load; params: `status`, `category`, `sort`, `limit=100` |
| `GET /issues/{id}` | `getJson` | "View detail" on a row (fetches uploads + reporter info) |
| `PATCH /issues/{id}/status` | `patchStatus` (hook) | Per-row status `Select` (`OPEN`/`COMPLETED`/`REJECTED`/`DUPLICATE` only — `ISSUE_MODERATION_STATUSES`) |
| `DELETE /issues/{id}` | `deleteItem` (hook) | Delete `Popconfirm` (moderation takedown) |

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
| `src/app/events/[id]/page.js` | `GET /events/{id}` | `getJson` | Anonymous; primary event payload. Returns the raw `rolePlan`, not the derived `rolesNeeded` aggregation. The URL param may be a **slug**; all participant sub-resource calls below use the resolved `data.id` (UUID) instead — the sub-resources reject a slug with `400 Invalid UUID`. |
| `src/app/events/[id]/page.js` | `GET /events/{id}/participants?limit=200` | `getJson` | Anonymous; loaded once per visit when the event payload carries a `rolePlan`. The page composes `rolesNeeded` (with `filled` / `filledNames`) and `participantCount` client-side via `src/lib/eventParticipants.js`. Soft-fails to zero-fill if the request errors. Skipped for demo events. **Must use the event UUID** (see row above). |
| `src/app/events/[id]/page.js` | `GET /events/{id}/participants/me` | `getJson` | Authenticated; the page owns this fetch (single source of truth shared by `EventJoinPanel` + `EventRosterPanel` via `viewerRole` / `viewerStatus` props). 404 = "not joined yet", handled silently; soft-fails to a `filledNames` name-match. Drives the joined / waitlisted / checked-in states. **Must use the event UUID.** |
| `src/components/EventJoinPanel.js` | `POST /events/{id}/participants` | `postJson` | Authenticated; body `{ role }`. 201 = joined (CONFIRMED) or waitlisted (INVITED). 403 surfaces a medic-credential error toast; 409 asks the page to reconcile so the UI flips to "joined" state. (`EventRosterPanel` posts the same shape from its open-slot pills.) |
| `src/components/LeaderNominationPanel.js` | `GET /events/{id}/leader-voting` | `getJson` | Public; fetched on mount to populate the candidates list, voting status, and tie state. Skipped for demo events. |
| `src/components/LeaderNominationPanel.js` | `POST /events/{id}/leader-vote` | `postJson` | Authenticated; body `{ candidateId }`. Cast / change the viewer's support for one candidate. |
| `src/components/LeaderNominationPanel.js` | `DELETE /events/{id}/leader-vote` | `deleteJson` | Authenticated; retract the viewer's current support. |

### Comments (issue + event detail pages)

All comment requests funnel through `src/lib/commentsApi.js` (`fetchComments` / `createComment` / `updateComment` / `deleteCommentRemote` / `addReactionRemote` / `removeReactionRemote` / `reportCommentRemote` / `fetchCommentReplies`). `fetchCommentReplies` (`GET /comments/{id}/replies`, cursor-paginated) is wired in the API layer but not yet consumed — the section still fetches the whole tree at once via `fetchComments?limit=200`, so it's a future lazy-load hook for deep threads. The consumer is `src/components/comments/CommentSection.js`, mounted from both `src/app/issues/[id]/page.js` and `src/app/events/[id]/page.js`.

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /comments?targetType&targetId&limit=200` | `getJson` | Mount and after every successful mutation. Bearer token attached when the viewer is authenticated so the response includes any per-viewer fields. |
| `POST /comments` | `postJson` | Composer submit (top-level or reply); body `{ targetType, targetId, parentId?, text, mentions? }`. |
| `PATCH /comments/{id}` | `patchJson` | Edit composer submit within the five-minute window; body `{ text, mentions? }`. |
| `DELETE /comments/{id}` | `deleteJson` | "Delete" action on own comment (soft delete by default). |
| `POST /comments/{id}/reactions` | `postJson` | Emoji picker selection — fires when the local overlay flip records a new pick; body `{ emoji }`. |
| `DELETE /comments/{id}/reactions?emoji=…` | `deleteJson` | Same handler reverses the toggle when the viewer's pick flips off. |

| `POST /comments/{id}/report` | `reportCommentRemote` | "Report" on another user's comment — `CommentFlagModal` collects `{ reason, details }` (reason enum matches the backend). 409 = already reported (treated as success). |

Pin remains a localStorage overlay (`src/lib/comments.js`) — admin-only, not yet exposed by the backend. **Flag now hits the real `POST /comments/{id}/report`** (2026-06-17) and *also* keeps the local overlay for the per-viewer "Reported" state + auto-hide threshold, since staging doesn't echo a per-viewer report flag. The `myReactions` field is likewise not returned by staging, so the local overlay also keeps a per-viewer `picks` list so reaction chips can render their toggled-on state across reloads.

### Public issue pages

| Page | Method + path | apiClient fn | Notes |
| --- | --- | --- | --- |
| `src/app/issues/page.js` | `GET /issues` | `getJson` | Anonymous; params: `status`, `category`, `sort`, `limit=50`; client-side filters out non-public statuses. When the user is logged in, `apiClient` attaches the bearer token automatically and the response includes a per-issue `isVoted` boolean used to seed the "already supported" state |
| `src/app/issues/[id]/page.js` | `GET /issues/{id}` (+ `GET /issues/me/votes` when authenticated) | `getJson` / `fetchMyIssueVotes` | Anonymous: loads detail + a second `GET /issues` call (by category) for "Other issues in this category". `isVoted` is **not** returned on the detail endpoint today, so when logged in the page fetches `GET /issues/me/votes` in parallel and derives `isVoted` from membership to seed the "Supported" button state on refresh — see `09-backend-admin-gaps.md` |
| `src/components/IssueVoteButton.js` (via `useIssueVote`) | `POST /issues/{id}/vote` | `voteOnIssue` | Authenticated; verified users only; hard-coded `voterRole: "INTERESTED"`; flips local `voted` state on success/409 |
| `src/app/issues/[id]/page.js` (via `ReportDialog`) | `POST /issues/{id}/report` | `reportIssue` | Authenticated; "रिपोर्ट" trigger under the share row opens the shared `ReportDialog` (reason enum + optional details). 409 = already reported |

### `src/app/admin/events/page.js`

| Method + path | apiClient fn | Trigger |
| --- | --- | --- |
| `GET /events` | `getJson` | Initial load; params: `status`, `fromDate`, `toDate`, `limit=100` |
| `GET /events/{id}` | `getJson` | "View detail" on a row (fetches linked issue, leader, uploads) |
| `GET /events/{id}/leader-voting` | `getJson` | Opening detail modal; refreshed after leader/tie-break/settle mutations |
| `PATCH /events/{id}/leader` | `patchJson` | "Assign leader" modal — admin picks a verified user via `GET /users` search |
| `PATCH /events/{id}/leader-voting/tie-break` | `patchJson` | "Tie-break voting" modal — admin picks from tied candidates when voting status is `PENDING_ADMIN` |
| `POST /events/{id}/leader-voting/settle` | `postJson` | "Settle voting" `Popconfirm` — time-driven, safe to re-call |
| `PATCH /events/{id}` | `updateEvent` | "Edit logistics" modal — scheduledAt, durationMinutes, meetup coords/address/notes, coordinationLink, whatToBring, planningNotes, riskLevel (`NORMAL`/`WATCH`/`URGENT`/`CRITICAL`). Partial update; `compactPayload` drops blanks so it sets/edits but can't clear a field |
| `POST /events/{id}/cancel` | `cancelEvent` | "Cancel event" modal — optional reason (≤1000) rides along in the participant notification. Hidden for already-cancelled/completed events |
| `GET /users` | `getJson` | Leader assignment modal search — params: `search`, `isVerified=true`, `limit=20` |

Scheduling (`PATCH /events/{id}/schedule`) and completion (`POST /events/{id}/complete`) are restricted to the assigned event leader by the API, so they are not exposed in the admin UI. Edit-logistics + cancel landed 2026-06-17. Note: the backend `riskLevel` enum (`NORMAL`/`WATCH`/`URGENT`/`CRITICAL`) was reconciled into `adminUtils.EVENT_RISK_LEVELS` — the previous `NORMAL`/`ELEVATED`/`HIGH` was drift that left risk tags colourless.

## Notifications

All notification requests are authenticated and flow through
`src/lib/notificationsApi.js`, which maps the backend shape (`type`, plain
`title`/`body` strings, `data.{targetType,targetId,slug}`, `readAt`) onto the
`{ kind, title:{np,en}, body:{np,en}, href, isRead }` shape the UI renders, and
soft-fails to an empty feed. Full contract: [`../api-requirements/notifications.md`](../api-requirements/notifications.md).

| Page / component | Method + path | apiClient fn | Trigger |
| --- | --- | --- | --- |
| `src/components/NotificationsBell.js` | `GET /notifications?limit=8` | `fetchNotifications` (via `fetchNotificationFeed`) | Mount; topbar dropdown (authenticated only — mounted by `SiteShell`). Badge trusts the server `unreadCount` |
| `src/components/NotificationsBell.js` | `PATCH /notifications/{id}/read` | `markNotificationRead` | Optimistic on opening a notification link |
| `src/components/NotificationsBell.js` | `POST /notifications/read-all` | `markAllNotificationsRead` | "Mark all read" |
| `src/app/me/notifications/page.js` | `GET /notifications?limit=50` | `fetchNotificationFeed` | Mount; full inbox with all/unread/read tabs |
| `src/app/me/notifications/page.js` | `PATCH /notifications/{id}/read` · `POST /notifications/read-all` | `markNotificationRead` · `markAllNotificationsRead` | Per-row read + "Mark all as read" |
| `src/components/NotificationChannelPrefs.js` | `PUT /notifications/preferences` | `updateNotificationPreferences` | "Save" on the channel toggles. Starts from defaults (`email/push` on, `sms` off) — no backend GET to seed current state yet (gap noted in the api-requirements doc) |

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
