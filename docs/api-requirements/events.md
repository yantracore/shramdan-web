# Event

> A श्रमदान event is the execution plan for solving a community issue that has been promoted past its voting threshold. An event represents a real-world gathering at a specific time and place, led by a member who has accepted leadership, attended by people in defined roles, and concluded with a result that can be reviewed publicly. Events are created automatically when an issue is promoted, are scheduled and executed by their leader, and remain visible after completion as part of the community record.

**Spec status:** `draft`
**Last updated:** 2026-06-03

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **slug** (`string`, optional, public) — URL-friendly handle. If omitted, callers route by `id`.
- **title** (`string`, required, public) — short event name. Bilingual support is planned via a future `translations` array; currently a single string in the consumer's locale.
- **status** (`enum`, required, public) — one of `DRAFT`, `SCHEDULED`, `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`. See the state machine section.
- **category** (`string`, required, public) — categorical tag derived from the linked issue. Examples: `cleanup`, `afforestation`, `beautification`, `trail`, `dam`, `infrastructure`, `seasonal`, `disaster`. The set is closed but extensible.
- **linkedIssueId** (`string`, required, public) — the community issue this event was promoted from. An event without a linked issue is not currently supported.
- **scheduledAt** (`datetime`, optional, public) — ISO 8601 timestamp for when the event begins. Required once `status` advances past `DRAFT`.
- **completedAt** (`datetime`, optional, public) — ISO 8601 timestamp recorded when the leader marks the event complete. Only present when `status` is `COMPLETED`.
- **durationMinutes** (`number`, optional, public) — planned duration. Used to compute end time client-side; the backend does not need to enforce it as a hard window.
- **meetupAddress** (`string`, optional, public) — human-readable address for the gathering point.
- **meetupLatitude** (`number`, optional, public) — meetup point latitude. Required if a map is to be rendered.
- **meetupLongitude** (`number`, optional, public) — meetup point longitude. Required if a map is to be rendered.
- **meetupNotes** (`string`, optional, public) — free-form notes about the meetup (what to bring, where to park, who to look for).
- **planningNotes** (`string`, optional, internal) — leader-only notes captured during planning. Not surfaced in public reads.
- **leaderId** (`string`, optional, public) — the member acting as Leader Shramdan for this event. Null while the event is in `DRAFT` and the leader has not yet been assigned.
- **leaderName** (`string`, optional, public) — display name of the leader for convenience. Backend may compute this from the member record at response time; consumers should not assume it is independently stored.
- **riskLevel** (`enum`, optional, public) — operational risk summary, one of `NORMAL`, `WATCH`, `URGENT`, `CRITICAL`. Derived from open incidents but stored on the event for fast read access.
- **resultSummary** (`string`, optional, public) — narrative summary of what the event accomplished. Set by the leader when marking the event complete.
- **thumbnailUrl** (`string`, optional, public) — image used as the event's card thumbnail across the site. Falls back to a category-specific illustration when absent.
- **photoUploadIds** (`array of string`, optional, public) — references to upload records associated with the event (cover, gallery, before/after pairs).
- **beforeAfter** (`object`, optional, public) — convenience pair with `{ before: uploadId, after: uploadId }` for the before/after impact display. Both ids must point to records inside `photoUploadIds`.
- **testimonialIds** (`array of string`, optional, public) — references to testimonial records (see relationships).
- **safetyChecklist** (`array of object`, optional, internal) — pre-event safety checklist for the SCHEDULED → ACTIVE gate. Each entry `{ id, label, required, checkedBy, checkedAt }`. Leader-and-admin-only by default; not returned in public reads. MVP shape may store only the boolean confirmation rather than per-item history if simpler — see the Operations section.
- **safetyChecklistCompletedAt** (`datetime`, optional, public) — timestamp captured when the leader satisfied the safety checklist and the event transitioned to ACTIVE. Public so the audit trail is visible.
- **reminderCadence** (`array of enum`, optional, public) — which reminder pulses the leader wants sent to confirmed participants. Each entry one of `3d`, `24h`, `1h`. Default is `["3d", "24h"]` when unset. Reminders are sent only to participants whose status is `CONFIRMED` or higher. Public-readable so participants can see what reminders to expect, but only the leader can edit.
- **nominations** (`array of object`, optional, public) — leader-nomination records for `DRAFT` events that have no assigned `leaderId`. Each entry `{ id, memberId, memberName, voteCount, votedByMe, createdAt }`. `votedByMe` is per-viewer and only present in authenticated reads. Empty / absent on non-DRAFT events or once a leader is selected.

---

## Validation rules

- An event cannot exist without a `linkedIssueId`. Issue promotion creates the event server-side; direct event creation outside that flow is not currently exposed.
- `scheduledAt` must be in the future at the moment `status` transitions from `DRAFT` to `SCHEDULED`. Past-dated scheduling is rejected.
- `status` may not move backwards in the lifecycle (e.g. `COMPLETED` cannot return to `ACTIVE`). The only one-way escape valve is `CANCELLED`, which can be reached from any prior state.
- `completedAt` must be present whenever `status` is `COMPLETED` and must not be present otherwise.
- `meetupLatitude` and `meetupLongitude` must either both be provided or both be omitted.
- `riskLevel` of `CRITICAL` should cause the event to surface a visible safety banner; the backend may emit this as a derived flag rather than expecting consumers to threshold-check the enum themselves.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List events | REST GET | Public | Returns a paginated list with filters described below. Used by the home page, the events index, and the member portal. |
| Get event by id or slug | REST GET | Public | Returns a single event with computed fields populated. |
| Promote issue to event | REST POST | Admin | Creates the event server-side from a promotion request on the issue. The event starts in `DRAFT`. |
| Update event schedule | REST PATCH | EventLeader or Admin | Updates schedule, meetup, and planning fields. Used by the leader scheduling UI. |
| Activate event (safety-gated) | REST POST | EventLeader or Admin | Transitions the event from `SCHEDULED` to `ACTIVE` after the leader has satisfied the pre-event safety checklist. Accepts `{ checklistConfirmed: true }` in MVP; richer per-item confirmation may follow. Returns 412 if the checklist gate is not satisfied. |
| Update reminder cadence | REST PATCH | EventLeader or Admin | Updates which reminder pulses (`3d`, `24h`, `1h`) the leader wants sent. Body: `{ reminderCadence: array of enum }`. Idempotent. |
| Nominate self as leader | REST POST | Authenticated | Creates a nomination on a `DRAFT` event with no assigned leader. Body may be empty (server uses the auth context). Returns the nomination record. Idempotent — re-nominating returns the existing record. |
| Vote for a nomination | REST POST | Authenticated | Adds a support vote on a nomination. Idempotent — voting twice returns 200 with no count change. |
| Withdraw vote for a nomination | REST DELETE | Authenticated | Removes a previously-cast support vote. |
| Mark event complete | REST POST | EventLeader or Admin | Transitions the event to `COMPLETED` and accepts `resultSummary`, photo uploads, and `completedAt`. |
| Pause for safety | REST POST | EventLeader, SafetyLead, or Admin | Transitions the event to `PAUSED` with a reference to the triggering incident. |
| Resume event | REST POST | EventLeader or Admin | Transitions a `PAUSED` event back to `ACTIVE` when the incident is resolved. |
| Cancel event | REST POST | EventLeader or Admin | One-way transition to `CANCELLED`. |
| Stream risk-level updates | SSE | Public | Optional. Pushes `riskLevel` changes for events the client is watching. Falls back to polling on clients that cannot SSE. |

---

## Filters (for List operations)

- **status** (`enum` or array of enums) — restrict to one or more lifecycle states. The home page's live rail filters to `ACTIVE`; the events index typically requests `SCHEDULED` and `ACTIVE`; the impact archive requests `COMPLETED`.
- **category** (`string` or array) — restrict to one or more categories. Same enum used by `GET /issues`.
- **municipality** (`string`) — exact-match district / municipality filter. Same semantics as the `municipality` filter on `GET /issues`. The `/events` index surfaces this as a "District" select populated from the addressText tail of loaded events.
- **provinceId** (`string`, UUID) — filter by the linked issue's province. Paired with `districtId` when a district is also selected. Source: `GET /provinces`.
- **districtId** (`string`, UUID) — filter by the linked issue's district. When provided without `provinceId`, backend filters by district alone. Source: `GET /districts?provinceId=`.
- **leaderId** (`string`) — restrict to events led by a specific member. Used by member portal pages.
- **search** (`string`) — case-insensitive substring match against issue title and address (any locale).
- **sort** (`enum`) — one of `scheduledAt` (default), `voteCount`, `createdAt`. `scheduledAt` sorts soonest-first; the other two sort descending.
- **order** (`enum`) — `asc` or `desc`. Applied to `sort` field; defaults to `asc` for `scheduledAt` and `desc` for others.
- **north** / **south** / **east** / **west** (`number`) — bounding box filter on the linked issue's coordinates. All four must be supplied together. Used by the map view to load only events visible in the current viewport.
- **fromDate** / **toDate** (`datetime`, ISO 8601) — filters `scheduledAt` range. Events without a `scheduledAt` are excluded when either is set.
- Pagination: cursor-based, `limit` defaults to twenty, response carries `nextCursor`.

---

## Relationships

- An event is promoted from exactly one issue. The link is captured by `linkedIssueId` and is immutable after creation; an event whose issue is deleted is itself cancelled.
- An event has many participants, each with a role drawn from the participant role enum. The participant collection is its own resource — see `event-participants.md`.
- An event has zero or more meetings (typically two on the canonical happy path — kickoff and pre-execution review). See `meetings.md`.
- An event has zero or more comments threaded against it. See `comments.md`.
- An event may have at most one active live stream attached. See `live-streams.md`.
- An event has zero or more uploads (photos, before/after pairs). The upload records are stored as a separate resource; the event references them by id.
- An event has zero or more incidents reported against it. Incident details are private to leaders, safety leads, and admins.
- Testimonials attached to a completed event reference both the event and the testifying member; their content surfaces publicly on the event detail page.

---

## Computed fields

- **participantCount** — total number of confirmed participants across all roles. Derived from the participants table; not stored on the event row.
- **rolesNeeded** — convenience aggregation `[{ role, count, filled, filledNames }]` summarizing role-fill progress. Derived from the event's role plan (set during the kickoff meeting) and the participants table. May be cached and refreshed periodically; consumers should treat it as eventually consistent.
- **isFull** — boolean indicating every role has reached its target count. Derived from `rolesNeeded`.
- **timeUntil** — convenience field expressing the time remaining until `scheduledAt`, recomputed on every read.

---

## State machine

```
DRAFT      → SCHEDULED   (requires: scheduledAt, meetupAddress, leaderId; trigger: EventLeader)
SCHEDULED  → ACTIVE      (requires: safety checklist confirmed; trigger: EventLeader via the Activate operation)
SCHEDULED  → CANCELLED   (trigger: EventLeader or Admin)
ACTIVE     → PAUSED      (trigger: EventLeader, SafetyLead, or Admin; on incident escalation)
ACTIVE     → COMPLETED   (trigger: EventLeader; requires: resultSummary)
ACTIVE     → CANCELLED   (trigger: EventLeader or Admin)
PAUSED     → ACTIVE      (trigger: EventLeader or Admin; on incident resolution)
PAUSED     → CANCELLED   (trigger: EventLeader or Admin)
COMPLETED  → (terminal)
CANCELLED  → (terminal)
```

A leader may not skip states. The system may auto-transition `SCHEDULED → ACTIVE` when the scheduled time arrives, but `ACTIVE → COMPLETED` is always an explicit leader action.

---

## Future-proofing notes

- `organizationId` field — for future multi-tenant support where partner organizations run their own campaigns. Safe to leave null; adding the column now avoids a backfill later.
- `translations` array on `title` and `resultSummary` — for bilingual storage once the translation pipeline is shipped. The current single-string shape will continue to work as the default locale's translation.
- `goalType` and `goalTarget` fields — for funded or material-driven events (Phase 5). Not needed for the current Worker-driven event model but worth leaving room for.

---

## Recent changes

- `2026-06-16` — **Translations gap re-verified, still open.** Live probe of `GET /events` and `GET /events/{id}` confirms the embedded `issue` object still arrives **without** its `translations` array (and there is still no localized `title` on the event itself), so `pickEventTitle` continues to fall back to a humanized `issue.slug` — English-only regardless of the selected locale. Issue reads (`GET /issues`, `GET /issues/{id}`) do include `translations` and localize correctly via `localizeIssue()`. This is the one remaining blocker to a fully bilingual events surface; the fix is backend-side (option (a) or (b) from the 2026-06-05 entry below). Tracking note: the 2026-06-05 entry stays authoritative for the required shape.
- `2026-06-10` — **Province/district server-side filters shipped.** Backend now accepts `provinceId` (UUID) and `districtId` (UUID) on `GET /events` (and `GET /issues`). Two new public reference endpoints: `GET /provinces` and `GET /districts?provinceId=`. Frontend `eventsApi.js` threads these params through `fetchEvents → listAllEvents`. `/events` and `/issues` pages now use a shared `ProvinceDistrictFilter` component (Province → District cascading selects backed by live API data) instead of the old text-based `municipality` heuristic. Filter state in URL uses `?province=<uuid>&district=<uuid>`.
- `2026-06-10` — `PATCH /api/v1/issues/{id}` added to backend — issue edit by owner or admin now live.
- `2026-06-05` — **Filter parity ask:** the public `/events` index now exposes the same filter toolbar as `/issues` (status, category, district, sort) plus a view-switch (list / map / thumbnails). The category, district, and sort filters currently fall back to client-side filtering because `GET /api/v1/events` only accepts `status`, `fromDate`, `toDate`, `limit`, and `cursor` today. To move all filters server-side (matching the user's stated intent that "all filters must be server side"), `GET /events` should accept: `category` (string, matches `IssueCategory` enum), `municipality` (string, exact match against the linked issue's municipality), `sort` (`participantCount` | `createdAt` | `scheduledAt`), and `order` (`asc` | `desc`). The `Filters (for List operations)` section above captures the canonical shape.
- `2026-06-05` — **Backend gap surfaced:** `GET /events` and `GET /events/{id}` embed the parent `issue` object **without** its `translations` array, so the consumer cannot resolve a localized `title` from `issue.translations[locale].title` even though `GET /issues` does include them. Frontend `pickEventTitle` was returning an empty string and `EventListCard` rendered blank `<h3>` headings in both locales. Two acceptable fixes on the backend side: (a) include `issue.translations` in the embedded issue payload on every events read, or (b) lift a localized `title` onto the event itself (per the existing future-proofing note below). Until either lands, the frontend humanizes `issue.slug` as a stopgap so cards show something readable; this is English-only and not acceptable as a permanent NP experience.
- `2026-06-04` — `LeaderNominationPanel` now wires to the real leader-voting endpoints exposed by staging. The panel calls `GET /events/{id}/leader-voting` on mount, then `POST /events/{id}/leader-vote { candidateId }` to cast support and `DELETE /events/{id}/leader-vote` to retract. The earlier speculative `/events/{id}/nominations` paths are retired. The data model shifted to match the backend: the panel consumes the voting state's `candidates` array (each `{ id, name, voteCount }`) and maps it into the existing nomination-shaped rows; `votedByMe` is tracked client-side until the backend includes a per-viewer flag in the response. The "self-nominate" CTA is now inert with a tooltip pointing back to the originating issue — post-promotion self-nomination has no backend endpoint, since candidates are seeded from `WANT_TO_LEAD` interest expressed during issue voting. Demo events with `demo-` id prefix continue to use the local `event.nominations` mock for offline demo flows.
- `2026-06-03` — UI now exercises three new leader-nomination operations through the `LeaderNominationPanel` (roadmap 3.4.2 + 3.4.3): `Nominate self as leader`, `Vote for a nomination`, `Withdraw vote`. Field `nominations` added to the Event entity (array of `{ id, memberId, memberName, voteCount, votedByMe, createdAt }`). The panel surfaces on `DRAFT` events with no assigned leader; tie detection between top candidates renders a "community decide" banner. Demo events update local state; real events POST / DELETE to `/events/{id}/nominations[/{id}/vote]` and degrade gracefully on 404/501.
- `2026-06-03` — UI now exercises the `Update reminder cadence` operation through the new `ReminderCadencePanel` (roadmap 3.7). Three independent checkboxes (`3d`, `24h`, `1h`) auto-save on toggle; demo events update local state, real events PATCH `/events/{id}/reminders` with `{ reminderCadence: array of enum }`. Field `reminderCadence` added to the Event entity. Default when unset is `["3d", "24h"]`.
- `2026-06-03` — UI now exercises the `Activate event (safety-gated)` operation via the new `SafetyChecklistPanel` (roadmap 4.6). The leader must tick seven safety items (pre-execution meeting completed, medic on site, safety lead identified, permits confirmed, weather contingency, logistics ready, participants re-notified) before the activate button enables. Frontend POSTs `{ checklistConfirmed: true }`; demo events flip status to ACTIVE locally and stamp `safetyChecklistCompletedAt`. Backend should return 412 if the checklist is not satisfied. Field `safetyChecklist` (array of items) and `safetyChecklistCompletedAt` (timestamp) added.
- `2026-06-03` — UI now exercises the `Mark event complete` operation through a leader-only modal on `/events/[id]`. Frontend sends `resultSummary` (required, ≥12 chars) and `completedAt` (defaults to now, must not be future) in the POST body. Demo events with `demo-` id prefix simulate the action locally without round-tripping.
- `2026-06-03` — initial spec draft. Captures the shape the UI consumes today against mock data, including the linkedIssue association, role-fill aggregation, and lifecycle states observed in `/events/[id]` and the home page live rail.
