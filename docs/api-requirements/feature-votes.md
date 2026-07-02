# Feature Proposal + Promotion

> A `FeatureProposal` is a specialised `DiscussionTopic` (see [`discussions.md`](discussions.md)) whose `kind` is `FEATURE_PROPOSAL`. Members open proposals to ask the platform to do something — add a sub-category, change a workflow, surface a new metric, launch a new lane, anything. Other members upvote. When a proposal crosses a configured threshold (default: `upvotes ≥ 20` AND `distinctSupporters ≥ 10`), the server fires a `Promotion` event that appends a roadmap row in `docs/ops/00-master-roadmap.md` (with a back-link to the discussion thread), marks the topic `PROMOTED`, and freezes the body so the agreed wording survives any later edits to the original discussion. The promotion threshold is admin-configurable per environment so staging can use a tighter threshold for testing without disturbing production. Declined proposals are closed by an admin with a `declineReason` recorded on the row.

**Spec status:** `draft`
**Last updated:** 2026-06-05

---

## FeatureProposal — Fields

A feature proposal is not a separate top-level entity; it is the projection of a `DiscussionTopic` where `kind = 'FEATURE_PROPOSAL'`. The public API exposes a thin convenience read at `/feature-proposals` that filters the topic table on this kind and adds the proposal-specific computed fields below.

- **topicId** (`string`, required, public) — id of the underlying `DiscussionTopic`. Everything topic-level (title, body, authorDisplay, anonymous, messageCount, upvoteCount, distinctSupporters, lastActivityAt, createdAt) reads through to the topic spec.
- **proposalStatus** (`enum`, required, public) — proposal-specific status overlay: `OPEN`, `PROMOTED`, `DECLINED`. Distinct from `DiscussionTopic.status` because a proposal can be `PROMOTED` and the underlying topic can still be `OPEN` for follow-up discussion.
- **promotionEligible** (`boolean`, required, public) — computed; `true` when `upvoteCount >= threshold.upvotes` AND `distinctSupporters >= threshold.distinctSupporters` AND `proposalStatus === 'OPEN'`. The UI surfaces this so members can see "this is on the edge of promotion" without needing to know the absolute numbers.
- **promotedAt** (`datetime`, optional, public) — timestamp the promotion event fired.
- **promotedBy** (`enum`, optional, public) — `SYSTEM` when the threshold cross fired the promotion, `ADMIN` when an admin force-promoted before the threshold.
- **promotedRoadmapAnchor** (`string`, optional, public) — markdown anchor in `docs/ops/00-master-roadmap.md` (e.g. `#discussions-feature-1234`) where the proposal lives now. Optional only because the master roadmap append is async — the field is set within a few seconds of `promotedAt`.
- **declineReason** (`string`, optional, public) — set when an admin moves the proposal to `DECLINED`. Members deserve a reason, even a short one.
- **declinedAt** (`datetime`, optional, public).
- **declinedBy** (`string`, optional, internal) — admin member id.

---

## Promotion threshold (configurable)

The promotion thresholds are server-side configuration, not constants in the schema. Backend exposes them through a public read at `/feature-proposals/threshold`:

- **upvotes** (`number`) — minimum net upvote count required. Default: `20`.
- **distinctSupporters** (`number`) — minimum count of distinct member ids who upvoted. Default: `10`.
- **gracePeriodHours** (`number`) — after the threshold is first crossed, a grace window before the promotion event fires, so a brief vote bomb does not push something through. Default: `48`.

The UI uses these values to render the "promotionEligible" progress affordance ("$N more upvotes needed" / "Eligible — promotes in $H hours").

---

## Validation rules

- A `DiscussionTopic` with `kind: FEATURE_PROPOSAL` is read-only in `proposalStatus` from the client side. Status moves are server-driven (threshold cross) or admin-driven.
- `declineReason` is required when an admin transitions the proposal to `DECLINED`.
- A proposal that has been `PROMOTED` cannot be edited (body/title freeze on promotion) — this protects the wording that the community actually upvoted.
- Voting is closed when `proposalStatus !== 'OPEN'`. Casting a vote on a non-open proposal returns 409.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List proposals | REST GET | Public | Convenience view; filters proposalStatus + sort by lastActivityAt or upvotes. |
| Get proposal by topicId | REST GET | Public | Single proposal with threshold overlay. |
| Get threshold | REST GET | Public | Returns the current threshold config. |
| Force-promote | REST POST | Admin | Fires the promotion event manually (e.g. an obvious-win admin shortcut). Required body: `topicId`. |
| Decline | REST PATCH | Admin | Body: `{ proposalStatus: 'DECLINED', declineReason }`. |
| Promotion event stream | SSE | Public | Stream of `{ topicId, promotedAt, roadmapAnchor }` events as proposals promote. UI surfaces these as activity-ticker entries. |

Topic-level CRUD (create proposal, post message, cast upvote, withdraw vote, close, etc.) reuses the [`discussions.md`](discussions.md) operations table. Creating a proposal is exactly creating a `DiscussionTopic` with `kind: FEATURE_PROPOSAL`.

---

## Filters (for List proposals)

- **proposalStatus** (`enum`) — `OPEN`, `PROMOTED`, `DECLINED`.
- **sort** (`enum`) — `upvotes` (default), `recentActivity`, `nearThreshold` (special — orders open proposals by `(threshold - upvotes)` ascending so the closest-to-eligible bubble to the top).
- Pagination: cursor-based, default `limit` 20, max 50.

---

## Relationships

- A `FeatureProposal` projects from exactly one `DiscussionTopic`. There is no separate proposal table — the proposal-specific fields are stored as a nullable JSON sub-object on the topic row, surfaced as top-level fields only on the `/feature-proposals` reads.
- A promoted proposal references exactly one anchor in `docs/ops/00-master-roadmap.md` via `promotedRoadmapAnchor`. The roadmap append is performed by a server-side script (not a manual editor action) so the link is durable.
- Promotion events MAY trigger a `Notification` to the proposal author and to every member who upvoted — that part of the contract lives in `notifications.md` (future).

---

## Computed fields

- **promotionEligible** — defined above.
- **votesUntilThreshold** — `max(0, threshold.upvotes - upvoteCount)`. Surfaced so the UI can render "5 more upvotes needed."
- **supportersUntilThreshold** — `max(0, threshold.distinctSupporters - distinctSupporters)`.
- **graceWindowEndsAt** — when `promotionEligible` is true, the timestamp at which the promotion event fires (set when the threshold is first crossed and reset to null if vote count drops back below threshold during the grace window).

---

## Promotion state machine

```
OPEN  →  PROMOTED  (trigger: SYSTEM threshold cross + grace window elapsed, OR ADMIN force-promote)
OPEN  →  DECLINED  (trigger: ADMIN; requires declineReason)
PROMOTED →  (frozen — no further transitions; topic comments can still flow)
DECLINED →  OPEN   (trigger: ADMIN; reverses decline if it was an error. Resets declineReason / declinedAt to null.)
```

The discussion topic's own `status` (`OPEN`/`CLOSED`/`PROMOTED`) tracks alongside; admin can `CLOSED` a topic without changing `proposalStatus`, and vice versa.

---

## Roadmap append shape

When a proposal promotes, the server appends a line at the bottom of the relevant phase section in `docs/ops/00-master-roadmap.md`:

```
- [ ] <Proposal title> `w:1` ← promoted from discussion #<topicId> on <YYYY-MM-DD>
```

This is the link target that `promotedRoadmapAnchor` references. The roadmap commit message follows the convention `chore(roadmap): promote feature proposal #<topicId> — <title>`.

---

## Future-proofing notes

- A `roadmapPhaseHint` field on the topic so the proposal author can suggest which phase the work belongs in — deferred until the master roadmap is more than 12 phases deep.
- `relatedProposals` array — for cross-referencing similar asks before they fragment the vote pool.
- `cost` and `effort` estimates added by admins post-promotion — likely lives on the roadmap node itself, not back-ported to this entity.
- Threshold per-kind (e.g. lower bar for copy fixes, higher bar for architecture changes) — deferred until use shows it's needed.

---

## Recent changes

- `2026-06-05` — initial draft, derived from Phase 7 design synthesis and the 2026-06-05 pivot ADR.
