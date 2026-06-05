# App Development Tasks

> Public, community-driven task board for building the Shramdan app itself.
> Each entry is a proposal — a feature, fix, design exploration, or learning
> opportunity that needs developers, designers, writers, testers, or other
> skilled contributors to pick up. Community members upvote what should be
> built next; comments capture the discussion; a leader (the contributor
> who takes the work) is assigned the way an event gets a leader. Think of
> it as the "Shramdan of the builders" — issues that are also community
> events, decided and executed in public. Surfaced at `/app-development`,
> linked from the top pill nav at the current build-the-app phase.
>
> Distinct from `Issues` (which are real-world community problems — broken
> streetlight, blocked drain, etc.). App-development tasks live on the
> codebase / product / docs / community side of the project. The two
> entities share UX patterns (vote, comment, leader-pick) but never mix
> data.

**Spec status:** `draft`
**Last updated:** 2026-06-05

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **slug** (`string`, required, public) — lowercase, hyphen-separated; used in URLs (`/app-development/<slug>`). Server-generated from title at create time, never mutates.
- **title** (`string`, required, public) — one-line summary of the proposal. Max 140 chars.
- **summary** (`string`, optional, public) — short tagline shown in the list view. Max 240 chars. Plain text.
- **body** (`string`, required, public) — full proposal description. Markdown. Includes context, the desired outcome, and any open questions.
- **category** (`enum`, required, public) — broad area the task belongs to. Initial set: `frontend`, `backend`, `design`, `content`, `docs`, `qa`, `ops`, `community`. New values added by Admin without code change (`category` is a soft enum stored as a string).
- **branches** (`array of string`, optional, public) — finer-grained tags within a category (for instance `frontend → /events`, `backend → notifications`). Free-form labels, lowercased, max 12 per task. The product evolves these into a real taxonomy later.
- **status** (`enum`, required, public) — one of `proposed`, `discussion`, `accepted`, `in_progress`, `shipped`, `parked`. See state machine.
- **proposedBy** (`object`, required, public) — `{ id, name, avatar }` snapshot of the member who created the proposal. Avatar may be a Representative Image URL for non-uploaded profiles.
- **leader** (`object`, optional, public) — `{ id, name, avatar }` of the contributor who has taken the work. Null until status is `accepted`.
- **voteCount** (`number`, required, public) — current upvotes. See computed fields.
- **hasVoted** (`boolean`, required, public) — whether the requesting authenticated user has voted. `false` for anonymous requests.
- **commentCount** (`number`, required, public) — current comment count. Comments themselves live under the shared `comments` entity (target type `app-development-task`).
- **representativeImageUrl** (`string`, optional, public) — single hero image URL for the task. Falls back to a category-based default image; the field is always present in the response so the frontend never has to handle "no image".
- **difficulty** (`enum`, optional, public) — one of `easy`, `medium`, `hard`. Optional; surfaced as a chip on the task card. Helps newcomers self-select.
- **skillTags** (`array of string`, optional, public) — recommended skills (`react`, `node`, `figma`, `writing`, `qa`, etc.). Used by the "Skills" sidebar to filter.
- **createdAt** (`datetime`, required, public) — ISO 8601.
- **updatedAt** (`datetime`, required, public) — ISO 8601.
- **acceptedAt** (`datetime`, optional, public) — set when status transitions to `accepted`.
- **shippedAt** (`datetime`, optional, public) — set when status transitions to `shipped`.
- **shippedRef** (`string`, optional, public) — free-form pointer to the work that shipped this task. Commit hash, PR URL, doc link.
- **internalNote** (`string`, optional, internal) — admin-side note; never surfaced in public responses.

---

## Validation rules

- `title` is required at create; min 8 characters.
- `body` is required at create; min 40 characters.
- `slug` is server-generated from `title`; uniqueness enforced server-side; never accepted from the client.
- `status` transitions only as allowed by the state machine below.
- `leader` may only be set when `status` is `accepted` or later.
- `voteCount` is never written directly; it is recomputed from the vote table.
- `hasVoted` is per-request, computed against the requesting user.
- A member may vote at most once per task. Voting again toggles the vote off.
- Anonymous users cannot vote, comment, propose, or take leader. Read is fully public.

---

## Operations

| Operation       | Transport    | RBAC          | Description |
|-----------------|--------------|---------------|-------------|
| List            | REST GET     | Public        | Paginated, filterable list of tasks. |
| Get by id/slug  | REST GET     | Public        | Single task by id or slug. |
| Create          | REST POST    | Authenticated | Member proposes a new task. |
| Update          | REST PATCH   | Author or Admin | Edit title/summary/body/category/branches/skillTags/difficulty pre-acceptance. After acceptance, only Admin or the assigned Leader may edit. |
| Delete          | REST DELETE  | Admin         | Soft delete. |
| Vote            | REST POST    | Authenticated | Cast or toggle an upvote. Endpoint: `POST /app-development/<id>/vote`. |
| Take leader     | REST POST    | Authenticated | Volunteer as the leader of the task. Endpoint: `POST /app-development/<id>/leader`. Server moves status to `accepted` and stamps `leader` + `acceptedAt`. |
| Release leader  | REST DELETE  | Leader or Admin | Step down from the leader role. Status drops back to `discussion`. |
| Transition      | REST POST    | Leader or Admin | Move the task along the state machine. Endpoint: `POST /app-development/<id>/transition` with target status. |
| Subscribe feed  | SSE          | Public        | Optional — push vote-count and status changes for a single task or the whole list. Useful for the live build phase. |

---

## Filters (for List operations)

- **category** (`enum`) — `frontend`, `backend`, `design`, `content`, `docs`, `qa`, `ops`, `community`.
- **status** (`enum`) — single value or comma-separated list. Defaults to `proposed,discussion,accepted,in_progress` (active set).
- **branch** (`string`) — exact match against an entry in `branches`.
- **skillTag** (`string`) — exact match against an entry in `skillTags`.
- **proposedBy** (`string`) — member id.
- **leader** (`string`) — member id. Special value `unassigned` returns tasks without a leader.
- **difficulty** (`enum`) — `easy`, `medium`, `hard`.
- **q** (`string`) — free-text search across `title`, `summary`, `body`.
- **sort** (`enum`) — `top` (default; voteCount desc, then createdAt desc), `new`, `updated`, `discussed` (commentCount desc).
- Pagination: cursor-based. `limit` (default 20, max 50). `nextCursor` in the response.

---

## Relationships

- A task is **proposed by** exactly one member, and may have at most one **leader** (also a member).
- A task has many **votes** (1:N, one row per member-task pair, unique).
- A task has many **comments**, stored in the shared comments entity with target type `app-development-task`.
- A task references at most one **category** (soft enum) and zero or more **branches** (free-form labels).
- A task does not reference Issues or Events. The two systems intentionally do not cross.

---

## Computed fields

- **voteCount** — derived from the votes table for this task.
- **hasVoted** — derived per request from the votes table and the requesting member id.
- **commentCount** — derived from the comments table for this task (target type `app-development-task`).

---

## State machine

```
proposed   → discussion  (auto when commentCount >= 1, or admin override)
discussion → accepted    (trigger: member takes leader, OR admin moves it)
accepted   → in_progress (trigger: Leader, when they start the work)
in_progress → shipped    (trigger: Leader or Admin; requires shippedRef)
any active → parked      (trigger: Admin; reason captured in internalNote)
parked     → discussion  (trigger: Admin; revives a parked task)
```

The frontend's discussion page lists tasks in the active set (`proposed`,
`discussion`, `accepted`, `in_progress`) by default. `shipped` and
`parked` are reachable through filters.

---

## Future-proofing notes

- `organizationId` field — for future multi-tenant operation.
- `linkedShramdanEventId` (nullable, optional) — for the case where a task gets executed as a real-life Shramdan working session (a hackathon, a doc sprint). Leave the column in but unused until that feature lands.
- `parentTaskId` (nullable, optional) — for breaking a large task into sub-tasks once the taxonomy under `branches` proves insufficient.
- `translations` shape on `title`, `summary`, `body` — so the page can later display each task in NP + EN side by side. Not in MVP.
- `representativeImageUrl` — staging convention: server always returns a real-looking demo image, even when no image is uploaded. The frontend never handles "no image" placeholders.

---

## Recent changes

- `2026-06-05` — initial draft. Spec written alongside the new `/app-development` page (Phase 1 of the TV-app pivot: the 5th highlighted pill item, tooltip "Participate"). Backend not yet implemented — frontend ships against a curated staging stub that mirrors this shape.
