# Event Participant

> An event participant is a member who has joined a specific event in a specific role. Participation is per-event and per-role; the same member may participate in many events over time, possibly in different roles, but a single (member, event, role) combination is unique. The participant record is the link between the abstract roles described in the product narrative and the concrete labor performed at a real-world event.

**Spec status:** `draft`
**Last updated:** 2026-06-03

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **eventId** (`string`, required, public) — the event the participant has joined.
- **memberId** (`string`, required, public) — the member who is participating.
- **role** (`enum`, required, public) — the role this participant has signed up for. One of:
  - `WORKER` — Worker Shramdan, the hands-on labor role.
  - `PHOTOGRAPHER` — Photographer Shramdan.
  - `LIVESTREAMER` — Livestreamer Shramdan.
  - `MEDIC` — Medic Shramdan (requires credential verification on the member record).
  - `SAFETY_LEAD` — Safety Lead Shramdan.
  - `COORDINATOR` — Coordinator Shramdan, the on-site flow controller.
  - `LOGISTICS` — Logistics Shramdan.
  - `LEADER` — Event leader. Only one participant per event may hold this role; the event's `leaderId` field mirrors this participant's `memberId`.
- **status** (`enum`, required, public) — lifecycle status of this participation:
  - `INVITED` — the leader or coordinator has invited this member but they have not yet accepted.
  - `CONFIRMED` — the member has accepted and is expected at the event.
  - `CHECKED_IN` — the member has confirmed presence at the event location on the day.
  - `LEFT` — the member checked in but left before the event completed; recorded for safety auditing.
  - `NO_SHOW` — the member was confirmed but did not appear. Recorded after the event concludes.
- **joinedAt** (`datetime`, required, public) — ISO 8601 timestamp when this participation record was created.
- **confirmedAt** (`datetime`, optional, public) — when `status` transitioned to `CONFIRMED`.
- **checkedInAt** (`datetime`, optional, public) — when `status` transitioned to `CHECKED_IN`. Captured at the event.
- **note** (`string`, optional, public) — optional free-form note submitted at signup time (for example "I can bring my own tools" or "Available only for the first two hours").
- **promotedFromRole** (`enum`, optional, internal) — for temporary in-event promotions (e.g. a Worker temporarily acting as Coordinator). Records the original role so rights can revert at event close.

---

## Validation rules

- A given `(eventId, memberId, role)` triple must be unique. Joining twice with the same role returns the existing record (idempotent join).
- A given `(eventId, memberId)` pair may have only one role at a time. To change roles, the member updates the existing record rather than creating a second one.
- An event may have at most one participant with `role = LEADER`.
- `role = MEDIC` requires the member to have a verified medical credential on file. The backend should reject this role transition for unverified members and surface a clear error.
- `status` may not move backwards in the natural sequence (`INVITED → CONFIRMED → CHECKED_IN → LEFT or NO_SHOW`). Transition to `LEFT` is only valid from `CHECKED_IN`; transition to `NO_SHOW` is only valid from `CONFIRMED` and is set after the event completes.
- Role counts are subject to the event's `rolesNeeded` plan set at the kickoff meeting. Joining a role that has reached its target count is allowed (waitlist), but the participant is flagged as `INVITED` rather than `CONFIRMED` and surfaces in a waitlist section of the leader UI.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List participants for an event | REST GET | Public (display-safe fields only) | Returns the roster shown on the event detail page. |
| Get my participation for an event | REST GET | Authenticated | Returns the current user's participation record for the given event, or 404 if not joined. Used by the join-button to render its "already joined" state. |
| Join event | REST POST | Authenticated | Current user opts in. Accepts `role` and optional `note`. Returns the participant record. Idempotent for the same role. |
| Update role on an event | REST PATCH | Authenticated (own record) or EventLeader | Changes the role of an existing participation. |
| Leave event | REST DELETE | Authenticated (own record) | Removes the participation. After event start, leaving sets status to `LEFT` rather than hard-deleting. |
| Invite a member | REST POST | EventLeader | Creates an `INVITED` participant record for another member. |
| Check in a participant | REST POST | EventLeader or Coordinator | Transitions an `INVITED` or `CONFIRMED` participant to `CHECKED_IN`. |
| Set the event's role plan | REST PUT | EventLeader (typically at the kickoff meeting) | Replaces the event's `rolesNeeded` plan. Existing participants are not affected; future joiners are matched against the new plan. |
| Stream roster changes | SSE | Public (display-safe fields only) | Optional. Pushes participant additions, role changes, and check-ins. Useful for the live rail and the leader's roster panel during the event. |

---

## Filters (for List operations)

- **role** (`enum` or array) — filter the roster to one or more roles.
- **status** (`enum` or array) — filter by participation status. Public reads typically restrict to `CONFIRMED` and `CHECKED_IN`.
- Pagination: cursor-based on insertion order; default `limit` of fifty since rosters are usually small.

---

## Relationships

- A participation belongs to exactly one event and references exactly one member.
- The event's `leaderId` mirrors the `memberId` of the participation whose role is `LEADER`.
- Comments authored on an event detail page may carry a participant context if the author is a confirmed participant — this is a display-side enrichment, not a foreign key.

---

## Computed fields

- **isLeader** — boolean shortcut for `role === 'LEADER'`. Computed for convenience.
- **canCheckIn** — boolean indicating whether the current viewer (typically a leader or coordinator) may transition this participant to `CHECKED_IN`. Derived from RBAC plus event status.
- **displayName** — the member's display name, joined for convenience. Backend may strip this from public responses if the member has not opted into public attribution.

---

## State machine

```
(none)     → INVITED      (trigger: EventLeader invitation, OR self-signup waitlist)
(none)     → CONFIRMED    (trigger: self-signup when role has open slots)
INVITED    → CONFIRMED    (trigger: invited member accepts)
INVITED    → (deleted)    (trigger: invited member declines or leader rescinds)
CONFIRMED  → CHECKED_IN   (trigger: EventLeader or Coordinator on event day)
CHECKED_IN → LEFT         (trigger: EventLeader or Coordinator records early departure)
CONFIRMED  → NO_SHOW      (trigger: system at event close, for confirmed participants who never checked in)
```

`LEFT` and `NO_SHOW` are terminal. Re-joining after either is a new participation record.

---

## Role plan sub-shape

The event's `rolesNeeded` aggregation (described in `events.md`) is conceptually a derived view over participants. The role plan that drives it has this shape:

```
[
  { role: 'WORKER',       count: 18, filled: 12 },
  { role: 'PHOTOGRAPHER', count: 2,  filled: 1  },
  ...
]
```

`count` is set during the kickoff meeting and represents the target headcount per role. `filled` is recomputed from the participants table whenever a participant joins, leaves, or changes role. Display names are not part of the plan itself; the events list response may include a denormalized `filledNames` array for thumbnail rendering, but this is a display convenience derived from the participants table.

---

## Future-proofing notes

- `arrivalEstimate` field — for events where participants commit to a specific arrival window. Useful for staggered events.
- `skillTags` field on a participation — for matching specialists (e.g. "operates a chainsaw") to events that need them. Out of scope for MVP but worth flagging.
- `transportNeeds` field — for coordinating shared transport from a meet-up point.

---

## Recent changes

- `2026-06-03` — UI now exercises the `Join event` operation through an in-page modal on `/events/[id]` (`EventJoinPanel`). The modal lists open roles from the event's role plan, filters out fully-staffed roles, and submits `{ role }` to POST `/events/{id}/join`. Demo events with `demo-` id prefix simulate the join locally; real events that 404 / 501 surface a "backend pending" toast rather than a hard error. Viewer detection uses the auth session display name against `filledNames` to render an "already joined as X" state.
- `2026-06-03` — initial spec draft. Captures the role enum surfaced in the UI roster, the join/leave operations needed by the campaign detail page, and the role-plan aggregation that drives the "help-needed" breakdown.
