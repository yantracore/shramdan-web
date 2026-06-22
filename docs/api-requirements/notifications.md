# Notifications

> A notification is a per-user message about something that happened on the
> platform — an event the user joined got scheduled, an issue they reported
> reached a milestone, a campaign they care about went live, or a welcome on
> sign-up. The backend creates them as side-effects of other actions; users
> only read them and mark them read. They are never created or edited by the
> client. Each notification optionally points at a target entity (an event or
> issue) so the UI can deep-link to it.

**Spec status:** `stable` (live on staging as of 2026-06-17; live SSE channel verified on staging 2026-06-22)
**Last updated:** 2026-06-22

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **type** (`enum`, required, public) — notification category, e.g. `EVENT_SCHEDULED`. The frontend maps it to an icon kind (vote / schedule / result / live / welcome) via substring heuristics in `src/lib/notificationsApi.js`; unknown types fall back to a generic bell. The full enum is not yet published — see Future-proofing.
- **title** (`string`, required, public) — short headline. Server-generated, single-language. The client mirrors it into both locales (NE prose rule does not apply — this is backend-authored text).
- **body** (`string`, required, public) — one or two sentences of detail.
- **data** (`object`, optional, public) — deep-link payload: `{ targetType, targetId, slug }`. `targetType` is `event` or `issue`; the client builds `/events/{slug|id}` or `/issues/{slug|id}` and falls back to `/me/notifications`.
- **readAt** (`datetime | null`, required, public) — when the user marked it read; `null` means unread.
- **createdAt** (`datetime`, required, public) — ISO 8601.

---

## Validation rules

- Notifications are read-only to clients. There is no create/update/delete from the frontend; only read-state mutations (`/{id}/read`, `read-all`).
- `markRead` is idempotent — marking an already-read notification is a no-op success.
- All operations are scoped to the authenticated user; a user can only see and mutate their own notifications.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List | REST GET `/notifications` | Authenticated | Cursor-paginated. Returns `{ items, unreadCount, nextCursor }`. |
| Unread count | REST GET `/notifications/unread-count` | Authenticated | Returns `{ unreadCount }` for the badge without pulling items. |
| Mark one read | REST PATCH `/notifications/{id}/read` | Authenticated | Idempotent single read. |
| Mark all read | REST POST `/notifications/read-all` | Authenticated | Marks every notification read. |
| Update preferences | REST PUT `/notifications/preferences` | Authenticated | Body `{ sms, email, push }` (booleans). Sets which channels deliver notifications. |
| Live stream | SSE GET `/notifications/stream?token=<jwt>` | Authenticated | Server-Sent-Events channel. Pushes the four realtime events below. Auth is the access token as a **query param** (not the `Authorization` header), so it works with native `EventSource`; the frontend uses a `fetch`-based reader instead so a token refresh heals the connection on reconnect. |

---

## Realtime channel (SSE)

The stream emits four named events (each `data:` line also carries a `type`
field mirroring the event name, so consumers can switch on either):

| Event | Payload | Meaning |
| ----- | ------- | ------- |
| `notification.snapshot` | `{ unreadCount }` | Sent once right after connect (and again on every reconnect). Authoritative count — resyncs the badge. |
| `notification.created` | `{ notification }` | A new notification arrived. `notification` is the exact shape `GET /notifications` returns, so it renders directly. Badge +1; the frontend also raises a toast. |
| `notification.read` | `{ id, unreadCount }` | One notification was marked read (e.g. from another tab/device). Mark that id read locally; set the badge to the authoritative `unreadCount`. |
| `notification.read_all` | `{ unreadCount }` | All marked read. Clear the badge. |

The server also sends `: connected` and periodic `:` comment lines as
keepalive; clients ignore comment lines.

### `notification.type` values (inside `notification.created`)

`EVENT_NEEDS_LEADER`, `LEADER_VOTING_OPENED`, `LEADER_VOTING_PENDING_ADMIN`
(moderators/admins only), `EVENT_SCHEDULED`, `EVENT_COMPLETED`,
`EVENT_CANCELLED`, `CONTENT_REPORT_RECEIVED` (moderators), `GENERAL`. These are
the first published `type` values — see the icon-mapping note under
Future-proofing; `data.slug` + `data.targetType` give the deep link.

---

## Filters (for List operations)

- **unreadOnly** (`boolean`) — when true, returns only notifications with `readAt === null`.
- **limit** (`number`) — page size. The bell requests 8; the inbox requests 50.
- Pagination: cursor-based. `cursor` parameter in, `nextCursor` returned in the payload (`null` when exhausted).

---

## Relationships

- A notification belongs to exactly one user (the recipient).
- A notification optionally references one target entity (an event or an issue) through its `data` payload — a soft reference by id/slug, not a hard foreign key the client depends on.

---

## Computed fields

- **unreadCount** — count of the user's notifications with `readAt === null`. Returned both on the list payload and standalone via `/unread-count`. May exceed the number of `items` returned on a single page; the badge trusts `unreadCount`, not `items.length`.

---

## Future-proofing notes

- **`type` enum is not published.** The client maps types to icons by substring (`SCHEDUL` → schedule, `VOTE`/`SUPPORT` → vote, `COMPLET`/`RESULT` → result, `LIVE`/`STREAM` → live, `WELCOME`/`ACCOUNT` → welcome). Publishing the full enum would let the client map exactly instead of heuristically.
- **No `GET /notifications/preferences`.** Only the PUT exists, so `NotificationChannelPrefs` cannot show the user's current channel settings — it starts from defaults (`email: true, push: true, sms: false`) and overwrites on Save. **Requested:** add `GET /notifications/preferences` returning `{ sms, email, push }` so the toggles reflect persisted state.
- A future `data.targetType` beyond `event`/`issue` (e.g. `meeting`, `discussion`) should be added to `notificationHref` when those deep-links exist.

---

## Consumers (frontend)

- `src/components/NotificationsProvider.js` — app-wide store mounted at the root. Owns the canonical unread count + recent feed; does the initial `GET /notifications?limit=50`, opens the SSE stream, folds the four events into state, and raises a toast on `notification.created`. The bell and inbox both read it via `useNotifications()`, so they stay in lockstep and update live.
- `src/lib/notificationsStream.js` — `fetch`-based SSE client (manual `text/event-stream` parser) with token-refresh-aware reconnect/backoff.
- `src/components/NotificationsBell.js` — topbar dropdown (authenticated only); now a thin view over the provider (slices the first 8), optimistic `markRead` / `markAllRead`.
- `src/app/me/notifications/page.js` — full inbox with all/unread/read tabs; reads the provider's feed.
- `src/components/NotificationChannelPrefs.js` — channel toggles; `PUT /notifications/preferences`.
- `src/lib/notificationsApi.js` — maps the backend shape onto the UI shape and soft-fails to an empty feed.

---

## Recent changes

- `2026-06-22` — Wired the live SSE channel (`GET /notifications/stream?token=`). Added `NotificationsProvider` as the single source of truth so the bell + inbox share one feed/count and update in realtime; new notifications raise a toast. Verified end-to-end on staging (snapshot frame received, connection stable). **Requested:** the `/notifications/stream` SSE endpoint is not yet in `07-api-reference.json` (the OpenAPI spec) — please add it so the contract is documented alongside the REST endpoints.
- `2026-06-17` — Initial spec. Documented the live endpoints (list, unread-count, mark read, mark-all, preferences) and wired the bell + inbox + channel prefs off the demo data. Flagged the missing `GET /notifications/preferences`.
