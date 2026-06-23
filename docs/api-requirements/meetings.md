# Meeting

> A meeting is a planning gathering attached to an event. Every event runs through two meetings on the canonical happy path — a kickoff meeting shortly after the event is promoted from an issue, and a pre-execution review meeting shortly before the event date. Additional meetings are allowed when reality demands but are uncommon. The meeting record holds the schedule, the attendee list, the agenda, the decisions reached, and the action items that come out of the meeting; the event itself reflects the meeting's outputs through its scheduled time, role plan, and final roster.

> This entity is introduced by the [2026-06-03 pivot ADR](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md). No frontend currently consumes it; this spec is the design that the UI will be built against. Backend implementation is gated on UI surface design landing.

**Spec status:** `draft` — **deferred to v2 (2026-06-23).** Not part of the active backend handoff; kept as a record. No UI consumes this entity and the 2026-06-05 TV-app pivot reshaped the planning model.
**Last updated:** 2026-06-23

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **eventId** (`string`, required, public) — the event this meeting belongs to.
- **type** (`enum`, required, public) — one of:
  - `KICKOFF` — the first meeting after event promotion. Decides role counts, logistics, target date.
  - `PRE_EXECUTION` — the final review meeting shortly before execution. Confirms roster and readiness.
  - `OTHER` — any additional meeting outside the canonical two. Should carry a descriptive `title`.
- **title** (`string`, optional, public) — short label for the meeting. Defaults to a localized version of the type ("Kickoff meeting" or "Pre-execution review") if omitted.
- **status** (`enum`, required, public) — one of `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. See the state machine section.
- **scheduledAt** (`datetime`, required, public) — ISO 8601 timestamp for the meeting start.
- **durationMinutes** (`number`, optional, public) — planned duration. Used for calendar display; backend does not enforce.
- **location** (`string`, optional, public) — physical location for in-person meetings.
- **virtualLink** (`string`, optional, public) — URL for virtual meetings (video call, conference bridge). Either `location` or `virtualLink` should be present; both is allowed for hybrid.
- **convenerId** (`string`, required, public) — the member calling the meeting. Typically the event leader.
- **attendees** (`array of object`, required, public) — each entry `{ memberId, status }` where `status` is one of:
  - `INVITED` — invited, has not responded.
  - `CONFIRMED` — accepted the invitation.
  - `DECLINED` — explicitly declined.
  - `ATTENDED` — was present at the meeting.
  - `ABSENT` — confirmed but did not attend.
- **agendaItems** (`array of object`, optional, public) — each `{ id, title, description, owner }`. The pre-meeting agenda.
- **decisionsRecorded** (`array of object`, optional, public) — each `{ id, summary, decidedAt, decisionType }`. Captured during or after the meeting. `decisionType` examples: `ROLE_PLAN_SET`, `DATE_CONFIRMED`, `ROSTER_FINAL`, `EVENT_GREEN_LIT`.
- **actionItems** (`array of object`, optional, public) — each `{ id, description, assigneeId, dueAt, completedAt }`. Tasks emitted by the meeting.
- **minutesText** (`string`, optional, internal) — full free-form notes from the meeting. Leader-and-attendees-only by default.
- **createdAt** (`datetime`, required, public) — when the meeting record was created.
- **completedAt** (`datetime`, optional, public) — when status transitioned to `COMPLETED`.

---

## Validation rules

- An event must have a `KICKOFF` meeting in `SCHEDULED` or `COMPLETED` status before the event itself can transition to `SCHEDULED`. The system should surface a clear error if a leader attempts to schedule the event without first completing the kickoff.
- An event must have a `PRE_EXECUTION` meeting in `COMPLETED` status before the event can transition to `ACTIVE`. Same guardrail principle as above. (The pre-execution meeting may be scheduled later than the kickoff, but must complete before execution.)
- `scheduledAt` must be in the future when status is `SCHEDULED`.
- For `KICKOFF` meetings, `scheduledAt` must be before the event's `scheduledAt` (when the event has one).
- For `PRE_EXECUTION` meetings, `scheduledAt` should be no more than seven days before the event's `scheduledAt` and no later than the event itself.
- Either `location` or `virtualLink` is required when status is `SCHEDULED`.
- `convenerId` must reference a member who has at least the Coordinator or Leader role on the event, or be a platform admin.
- An event may have at most one `KICKOFF` meeting and at most one `PRE_EXECUTION` meeting in non-cancelled status at any time. Additional meetings of the same type require the previous one to be cancelled first.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List meetings for an event | REST GET | EventLeader, Coordinator, Admin (full); Public (sees only scheduled time and type for kickoff meetings) | Returns meetings ordered by `scheduledAt`. |
| Get meeting by id | REST GET | EventLeader, Coordinator, Admin, or any attendee | Returns the meeting with full agenda, decisions, and action items. |
| Schedule a meeting | REST POST | EventLeader or Admin | Creates a new meeting in `SCHEDULED` status. Type, scheduledAt, location/virtualLink, and initial attendees are accepted. |
| Update meeting | REST PATCH | EventLeader, convener, or Admin | Updates scheduledAt, agenda, attendees. Decisions and action items are appended through dedicated operations, not this one. |
| Record a decision | REST POST | EventLeader, convener, or Admin | Appends a decision to `decisionsRecorded`. Server timestamps it. |
| Add an action item | REST POST | EventLeader, convener, or Admin | Appends an action item; assigns to a member; sets a due date. |
| Mark action item complete | REST POST | The assignee, EventLeader, or Admin | Sets `completedAt` on the action item. |
| Start meeting | REST POST | EventLeader, convener, or Admin | Transitions status to `IN_PROGRESS`. |
| Complete meeting | REST POST | EventLeader, convener, or Admin | Transitions status to `COMPLETED`. Some decisions (e.g. role plan set, event green-lit) may trigger event-side effects. |
| Cancel meeting | REST POST | EventLeader, convener, or Admin | Transitions status to `CANCELLED`. |
| Stream action-item updates | SSE | Authenticated attendees and leader | Optional. Pushes action-item additions and completions for in-flight events. |

---

## Filters (for List operations)

- **type** (`enum` or array) — filter to one or more meeting types.
- **status** (`enum` or array) — filter by lifecycle status.
- Pagination: cursor-based; meetings per event are typically few, so default `limit` is twenty.

---

## Relationships

- A meeting belongs to exactly one event.
- A meeting has one convener (a member, usually the event leader).
- A meeting has many attendees (members), each with their own attendance status.
- A meeting has many action items, each assigned to one member with a due date.
- Decisions emitted by a meeting may trigger updates on the parent event (for example, a `ROLE_PLAN_SET` decision updates the event's role plan; an `EVENT_GREEN_LIT` decision is a precondition for the event transitioning to `ACTIVE`). These cross-entity effects should be implemented as backend service functions, not scattered frontend writes.

---

## Computed fields

- **decisionsCount** — count of entries in `decisionsRecorded`. Display convenience.
- **actionItemsOpen** — count of action items where `completedAt` is null. Used in the leader's task summary.
- **attendanceRate** — percentage of confirmed attendees who actually attended. Recorded after the meeting completes, used in retrospectives.

---

## State machine

```
SCHEDULED   → IN_PROGRESS  (trigger: convener or leader at the scheduled time)
SCHEDULED   → CANCELLED    (trigger: convener, leader, or admin)
IN_PROGRESS → COMPLETED    (trigger: convener or leader; may cascade to event-side effects)
IN_PROGRESS → CANCELLED    (trigger: convener, leader, or admin)
COMPLETED   → (terminal)
CANCELLED   → (terminal)
```

A meeting may not skip `IN_PROGRESS` when transitioning from `SCHEDULED` to `COMPLETED`. The intermediate state captures the fact that a meeting was actually held, distinguishing real meetings from meetings that were cancelled before they began.

---

## Visibility

- The existence and `scheduledAt` of a `KICKOFF` meeting may be public, so that role candidates can plan to attend.
- `PRE_EXECUTION` meetings are typically leader-and-coordinator-only; their existence does not appear on the public event surface, though the meeting's outcome (event green-lit) does.
- `agendaItems`, `decisionsRecorded`, `actionItems`, and `minutesText` are restricted to the convener, attendees, leader, and platform admins.

---

## Future-proofing notes

- `recurringMeetingTemplateId` field — for recurring weekly or monthly meetings (community leadership sync, all-hands). Out of scope for MVP, where meetings are always event-scoped.
- `externalCalendarEventId` field — for syncing to Google Calendar, Outlook, etc. Out of scope for MVP.
- `recordingUrl` field — for archived video recordings of important meetings. Out of scope for MVP.

---

## Recent changes

- `2026-06-03` — initial spec draft. Introduces meetings as a first-class entity per the pivot ADR. No UI surface exists yet; backend implementation gated on the leader meeting UI being designed.
