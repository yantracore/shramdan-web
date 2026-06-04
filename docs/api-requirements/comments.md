# Comment

> A comment is a threaded message attached to either an issue or an event. Comments support replies up to a fixed depth, optional @-mentions of other members, and emoji reactions. Comments on issues are part of the community discussion around a problem; comments on events are part of the real-time coordination around a campaign — and on live events they take on a chat-like quality during the broadcast. The same canonical comment shape serves both target types so the rendering and moderation surfaces can be shared.

**Spec status:** `draft`
**Last updated:** 2026-06-03

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **targetType** (`enum`, required, public) — one of `issue` or `event`. Indicates which kind of target this comment attaches to.
- **targetId** (`string`, required, public) — the id of the issue or event this comment is attached to.
- **parentId** (`string`, optional, public) — id of the parent comment when this is a reply. Null for top-level comments.
- **depth** (`number`, required, public) — nesting depth, zero for top-level. Capped at two; replies to a depth-2 comment are flattened to depth 2 with the parent set to the depth-2 ancestor.
- **author** (`object`, required, public) — `{ id, name, role }`. The `id` is the author's member id. The `name` is the display name at the time the comment was created. The `role` is an optional free-form descriptor (e.g. "स्थानीय बासिन्दा", "स्वयंसेवक", "संयोजक") that the UI surfaces beside the name when present.
- **text** (`string`, required, public) — the comment body. Markdown-light formatting (line breaks, light emphasis) may be supported in the future; current MVP is plain text.
- **mentions** (`array of object`, optional, public) — each `{ memberId, name }` referenced by an @-mention in the text. The backend may extract these from the text or accept them from the client; either is acceptable as long as they round-trip.
- **reactions** (`object`, optional, public) — map of emoji to count, for example `{ "👏": 12, "🌱": 4 }`. Stored as an aggregate; the per-member reaction state is a separate (optional) read for the current viewer.
- **myReactions** (`array of string`, optional, public) — for authenticated reads, the list of emoji the current viewer has reacted with. Used to render the toggled-on state of reaction chips. Absent for unauthenticated reads.
- **createdAt** (`datetime`, required, public) — when the comment was created.
- **editedAt** (`datetime`, optional, public) — when the comment was last edited, if at all.
- **isDeleted** (`boolean`, required, public) — soft-delete flag. When true, `text` is replaced with a tombstone placeholder ("[deleted]") and `author` may be redacted depending on policy.
- **canEdit** (`boolean`, optional, public) — convenience for the current viewer: true if they can edit this comment. Derived from authorship plus an edit-window timeout. Absent for unauthenticated reads.
- **canDelete** (`boolean`, optional, public) — similarly for delete. Derived from authorship or moderation rights.

---

## Validation rules

- A comment must reference either an issue or an event (`targetType` plus `targetId`). The target must exist.
- `text` must not be empty or whitespace-only.
- `text` has a maximum length of two thousand characters.
- Reply depth is capped at two. Backend enforces this on create; a request to reply to a depth-2 comment should be silently re-parented to that ancestor.
- Edits are allowed within a five-minute window from creation (configurable). Outside the window, only deletion is allowed.
- Soft-delete is the only delete operation surfaced to authors. Hard-delete is available to admins for spam and abuse cases.
- Emoji reactions are drawn from a curated set: `👏 🌱 ❤️ 🙏 💪 🎉 🌟 🔥`. Backend may reject reactions outside this set or accept and silently coerce; either is acceptable.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List comments for a target | REST GET | Public | Returns the flat canonical list of comments for the given target. Pagination is cursor-based on creation order; the client assembles the tree. |
| Get a single comment | REST GET | Public | Single comment by id. Useful for permalink resolution. |
| Create a comment | REST POST | Authenticated | Accepts `targetType`, `targetId`, optional `parentId`, and `text`. Mentions are parsed server-side or accepted from the client. |
| Edit a comment | REST PATCH | Author (within edit window) or Admin | Updates `text` and bumps `editedAt`. |
| Delete a comment | REST DELETE | Author or Admin | Soft-delete by default. Admin may hard-delete via a query parameter. |
| Add or remove a reaction | REST POST and REST DELETE | Authenticated | Toggles the current viewer's reaction. Updates the aggregate `reactions` map and the per-viewer `myReactions` list. |
| Stream new comments | SSE | Public | For live events specifically, pushes new comments and reactions as they arrive. The client merges the SSE stream into its locally-rendered tree. |
| Stream reaction updates | SSE | Public | Pushes aggregate reaction updates so reaction counters animate in real time without the client having to re-fetch. Often multiplexed with the new-comments stream on the same connection. |

---

## Filters (for List operations)

- **parentId** (`string`) — restrict to direct children of a given comment. Useful for lazy-loading deep threads.
- **sort** (`enum`) — `newest` (default) or `oldest`.
- **includeDeleted** (`boolean`) — for admin moderation. Off by default.
- Pagination: cursor-based on creation order, default `limit` of one hundred.

---

## Relationships

- A comment belongs to exactly one target — either an issue or an event, indicated by `targetType` and `targetId`. There is no foreign key column for both; backend should model this as a polymorphic association or two parallel tables, depending on preference.
- A comment may have a parent comment (`parentId`), forming a tree limited to depth two.
- A comment is authored by exactly one member (`author.id`).
- A comment's mentions reference zero or more other members.
- A comment's reactions reference zero or more reacting members. The members themselves are not surfaced in the read response by default; an admin-only "who reacted" endpoint may exist for moderation.

---

## Computed fields

- **replyCount** — number of direct children. May be cached for performance; surfaced on top-level comments so the UI can show "12 replies" without expanding.
- **totalDescendants** — total number of descendant comments, recursively. Useful for top-level summary; cheap to derive at write time.
- **canEdit** and **canDelete** — see Fields section. Computed per-viewer.

---

## State machine

Comments do not have a meaningful status field beyond the soft-delete flag:

```
(none)   → ACTIVE      (created)
ACTIVE   → EDITED      (one or more edits within the window; conceptual, not a separate state)
ACTIVE   → DELETED     (soft-delete; text replaced with tombstone)
DELETED  → (terminal in normal flow; admin may hard-delete from here)
```

---

## Real-time considerations

The comment shape and operations above are shared between issue comments and event comments. Their real-time needs differ:

- **Issue comments** are mostly asynchronous; polling on page focus is sufficient. REST list and create are the primary operations. Reaction updates are best-effort and not latency-critical.
- **Event comments**, especially during a live event broadcast, behave like a chat stream. The SSE operations above are recommended for live events: clients subscribe when the event status is `ACTIVE` and the live stream is on, and unsubscribe when either condition ends. WebSocket is an acceptable alternative if the backend already runs a socket server for live-stream coordination; the surface contract is the same.

Reaction updates may be batched server-side (a small delay before broadcasting to all subscribers) to avoid update storms on popular comments.

---

## Future-proofing notes

- `language` field on a comment — for automatic translation across EN and NE. Out of scope for MVP; comments are stored as written.
- `replyToMemberId` field — denormalized convenience for "X replied to Y" surfacing. Currently derivable from the parent comment's `author.id`.
- Attachment uploads on comments (images, voice notes) — out of scope for MVP. If added later, the comment record would reference upload ids similar to how the event record does.
- Threaded mute/follow per comment — out of scope. A future "follow this thread for notifications" feature would attach to the comment subscription, not the comment record.

---

## Recent changes

- `2026-06-04` — Spec status flipped to `partial`. Issue + event `CommentSection` now talks to the real backend via the new `src/lib/commentsApi.js` wrappers: `GET /comments` (list with `targetType` + `targetId`), `POST /comments` (top-level + replies), `PATCH /comments/{id}` (edit within window), `DELETE /comments/{id}` (soft delete), `POST /comments/{id}/reactions` (add), `DELETE /comments/{id}/reactions?emoji=…` (remove). Pin + flag remain a localStorage overlay (admin-only, backend does not expose them yet) and the consumer normalizes the backend's `isDeleted` flag onto the canonical `deleted` field. Backend does not yet return `myReactions`; the frontend keeps a `picks` overlay so the viewer's reaction-pressed state survives reloads and folds optimistically into the displayed count. SSE (`GET /comments/stream`) remains unwired — deferred to Phase B-2.
- `2026-06-03` — initial spec draft. Captures the canonical comment shape consumed by both issue and event detail pages, the reaction emoji palette, the depth-two threading cap, and the SSE recommendation for live-event chat behavior.
