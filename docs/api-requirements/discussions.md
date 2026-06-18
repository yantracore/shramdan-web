# Discussion Topic + Message + Vote

> A `DiscussionTopic` is a community-authored thread that lives on the new `/discussions` surface introduced in the 2026-06-05 TV-app pivot (Phase 7). Topics come in two kinds: `GENERAL` (open conversation, comments, member chatter) and `FEATURE_PROPOSAL` (a structured ask for the app to do something new). Topics can optionally link to an `Issue` or `Event` so the conversation surfaces on that entity's page too. Messages are replies posted by members; votes are upvotes/downvotes the community uses to surface what's worth attention. Both topics and messages support an `anonymous` flag — when set, the authoring member's identity is suppressed from public responses but still recorded server-side for moderation. Feature proposals that cross a configurable threshold are promoted to the master roadmap (see [`feature-votes.md`](feature-votes.md)).

**Spec status:** `draft`
**Last updated:** 2026-06-05

---

## DiscussionTopic — Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **slug** (`string`, required, public) — URL-safe slug derived from title. Lowercase alphanumeric and hyphens, max 80 chars.
- **kind** (`enum`, required, public) — one of `GENERAL`, `FEATURE_PROPOSAL`.
- **category** (`enum`, required, public) — subject taxonomy that drives the left-rail navigation on `/discussions`: one of `DESIGN`, `FRONTEND`, `BACKEND`, `OTHER`. `OTHER` is the catch-all (a residual bucket for anything outside the dev lanes; it can graduate to a dedicated category once one theme piles up). Orthogonal to `kind` (a `FEATURE_PROPOSAL` can be a `DESIGN` topic). Defaults to `OTHER` when the author does not pick one. Author-set at creation; editable by author within the same 5-minute grace as `title`/`body`, and by moderators thereafter (for re-filing mis-categorised topics).
- **title** (`string`, required, public) — short topic headline. Max 140 chars.
- **body** (`string`, required, public) — opening message body (markdown allowed; sanitized on read). Min 20 chars, max 8000 chars.
- **authorMemberId** (`string`, required, internal) — id of the member who opened the topic. Always recorded server-side, even when `anonymous` is `true`, so moderators can act.
- **authorDisplay** (`object`, required, public) — derived shape: `{ name, avatarUrl, slug }` when not anonymous, `{ anonymous: true }` when the author opted in to anonymity. The UI never sees `authorMemberId` directly; this object is the public projection.
- **anonymous** (`boolean`, required, public) — true when the author chose to hide their identity at posting time. Cannot be flipped after creation — anonymity is a posting-time choice, not a toggle.
- **linkedEntity** (`object`, optional, public) — when set, references a related `Issue` or `Event`: `{ kind: 'issue' | 'event', id, slug, title }`. Topics with `linkedEntity.kind === 'event'` surface on that event's page (see "Discussion presence" below).
- **status** (`enum`, required, public) — `OPEN` (active discussion), `CLOSED` (locked by moderator), `PROMOTED` (only valid for `FEATURE_PROPOSAL`; transitioned by the feature-votes promotion event).
- **messageCount** (`number`, required, public) — computed; number of `DiscussionMessage` rows referencing this topic.
- **upvoteCount** (`number`, required, public) — computed; net `UPVOTE - DOWNVOTE` vote count.
- **distinctSupporters** (`number`, required, public) — computed; count of distinct member ids who upvoted. Used for feature-proposal promotion threshold.
- **lastActivityAt** (`datetime`, required, public) — most recent of: topic created, last message posted, last vote. Drives the "Active threads" sort on `/discussions`.
- **createdAt** (`datetime`, required, public) — when the topic was opened.
- **closedAt** (`datetime`, optional, public) — set when status moves to `CLOSED`.
- **promotedAt** (`datetime`, optional, public) — set when a `FEATURE_PROPOSAL` is promoted (see [`feature-votes.md`](feature-votes.md)).

---

## DiscussionMessage — Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **topicId** (`string`, required, public) — parent topic id.
- **body** (`string`, required, public) — markdown-allowed message body. Min 1 char, max 8000 chars.
- **authorMemberId** (`string`, required, internal) — author id (always recorded; suppressed from public response when `anonymous`).
- **authorDisplay** (`object`, required, public) — same shape as `DiscussionTopic.authorDisplay`.
- **anonymous** (`boolean`, required, public) — posting-time decision; immutable after creation.
- **upvoteCount** (`number`, required, public) — computed.
- **createdAt** (`datetime`, required, public).
- **editedAt** (`datetime`, optional, public) — set when the author edits within the 5-minute grace window. After grace expires, edits are blocked server-side.

---

## DiscussionVote — Fields

- **id** (`string`, required, internal) — vote-row id; not surfaced.
- **targetKind** (`enum`, required, internal) — `TOPIC` or `MESSAGE`.
- **targetId** (`string`, required, internal) — id of the target.
- **memberId** (`string`, required, internal) — who voted.
- **valence** (`enum`, required, internal) — `UPVOTE` or `DOWNVOTE`. `DOWNVOTE` is optional for v1; v0 backend may reject it.
- **createdAt** (`datetime`, required, internal).

A member can hold at most one vote per `(targetKind, targetId)`. Posting a new vote with the opposite valence replaces the previous row; posting the same valence twice is a no-op (idempotent).

---

## Validation rules

- `body` is sanitized server-side on read — the UI receives safe HTML or markdown-rendered output, not raw user input.
- A topic with `kind: FEATURE_PROPOSAL` cannot link to an `Issue` or `Event` (proposals are about the platform itself).
- A topic with `linkedEntity.kind: 'event'` cannot be created if the event is in `cancelled` or `completed > 30 days ago` status.
- `anonymous` is a posting-time choice; flipping it on an existing topic or message is rejected with HTTP 422.
- Edits to topic `body` are not allowed after 5 minutes from creation; edits to message `body` follow the same 5-minute grace.
- Verified members only — `isVerified=false` members cannot create topics or messages, only read.
- Vote actions require `isVerified=true`. Anonymous browsing receives 401 on POST.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List topics | REST GET | Public | Paginated; filter + sort. |
| Get topic by id-or-slug | REST GET | Public | Single topic with first page of messages embedded. |
| Create topic | REST POST | Authenticated + verified | `kind`, `title`, `body`, optional `linkedEntity`, `anonymous`. |
| Update topic | REST PATCH | Author (≤ 5 min) or Admin | Edit `title`/`body`; immutable after grace. |
| Close topic | REST PATCH | Admin or Moderator | Sets `status: CLOSED`, `closedAt`. |
| List messages | REST GET | Public | Paginated by topic. |
| Post message | REST POST | Authenticated + verified | `topicId`, `body`, `anonymous`. Rejected when parent topic is `CLOSED`. |
| Update message | REST PATCH | Author (≤ 5 min) or Admin | Same grace as topic. |
| Cast vote | REST POST | Authenticated + verified | `targetKind`, `targetId`, `valence`. Idempotent / replace-on-flip. |
| Withdraw vote | REST DELETE | Author | Removes the row. |
| Subscribe to topic | SSE | Authenticated | Stream of new messages + vote count updates for the topic. |

---

## Filters (for List topics)

- **kind** (`enum`) — `GENERAL` or `FEATURE_PROPOSAL`.
- **category** (`enum`) — `DESIGN`, `FRONTEND`, `BACKEND`, `OTHER`. Powers the left-rail category filter. Combinable with `kind` and `sort`. The UI also derives per-category counts client-side; a future `GET /discussions/category-counts` (faceted counts honouring the active `kind` + search) would remove that round-trip.
- **linkedEntityKind** (`enum`) — `issue`, `event`, or `none`.
- **linkedEntityId** (`string`) — restrict to topics tied to a specific issue/event id or slug.
- **authorMemberId** (`string`) — restrict to a specific author (used by member profile pages to show "topics started").
- **sort** (`enum`) — `recentActivity` (default; orders by `lastActivityAt` desc), `upvotes`, `createdAt`.
- Pagination: cursor-based, `limit` (default 20, max 50), `nextCursor` returned.

---

## Relationships

- A `DiscussionTopic` has many `DiscussionMessage` rows (parent-child).
- A `DiscussionTopic` may reference exactly one `Issue` or `Event` via `linkedEntity` — or none.
- A `DiscussionTopic` of kind `FEATURE_PROPOSAL` has at most one related row in `feature-votes` (the promotion record; see that file).
- Every `DiscussionMessage` belongs to exactly one `DiscussionTopic`.
- `DiscussionVote` rows reference either a topic or a message via `(targetKind, targetId)`.

---

## Computed fields

- **messageCount** — count of non-deleted messages on the topic.
- **upvoteCount** — `sum(UPVOTE) - sum(DOWNVOTE)` across vote rows targeting the topic (or message, for the message-level field).
- **distinctSupporters** — `count(distinct memberId where valence=UPVOTE)` on the topic. This is the field the feature-votes promotion logic compares against the threshold.
- **lastActivityAt** — `max(topic.createdAt, max(message.createdAt), max(vote.createdAt))`.
- **authorDisplay** — projection from `authorMemberId` + `anonymous` flag; the backend builds this on read and never returns `authorMemberId` itself in public responses.

---

## State machine

```
OPEN → CLOSED      (trigger: Admin or Moderator; soft — messages still readable, no new posts)
OPEN → PROMOTED    (trigger: feature-votes threshold cross; only valid for kind=FEATURE_PROPOSAL)
CLOSED → OPEN      (trigger: Admin only; reverts moderation)
PROMOTED → CLOSED  (trigger: Admin; locks the thread after roadmap absorption)
```

---

## Discussion presence on event pages

When a topic has `linkedEntity.kind === 'event'`, the linked event's detail page surfaces:

- The topic's active message count (last 7 days).
- `lastActivityAt` timestamp.
- A click-through link to the topic.

The backend exposes this via a thin computed field on the `Event` read response (`event.discussion.{topicId, activeMessageCount, lastActivityAt}`) so the event page does not need an extra round-trip. This field is optional — events with no linked discussion omit it.

---

## Future-proofing notes

- A `parentMessageId` field on `DiscussionMessage` for nested replies — not in v0; deferred until usage patterns show it's needed.
- `mentions` — array of member ids extracted from message body — deferred; v0 surfaces mentions via plain text only.
- `attachments` — image/file uploads on messages — deferred to a separate `discussion-attachments.md` spec.
- `language` field per topic/message for cross-locale moderation when shramdan expands beyond NP+EN.
- A `reportedAt` / `reportCount` shape for community moderation — deferred until first abuse signal.

---

## Recent changes

- `2026-06-18` — added the `category` field + filter backing the new left-rail taxonomy on the redesigned `/discussions` list: `DESIGN`/`FRONTEND`/`BACKEND` + an `OTHER` catch-all (default). (An earlier draft of this change had `PRODUCT` + `COMMUNITY` instead of `OTHER`; collapsed to a single residual bucket per product call.) Noted a possible faceted `category-counts` endpoint.
- `2026-06-05` — initial draft, derived from Phase 7 UI mocks and the 2026-06-05 pivot ADR.
