# Incident

> An incident is a real-world safety, legal, conflict, weather, or operational concern that needs handling outside the normal event flow. Each incident is bound to one event and carries a severity that contributes to the event's summary `riskLevel`. Incident details (reporter identity, evidence, response notes) are restricted to the event leader, safety lead, and platform admins; the public surface sees only an event-level risk banner and any generically-worded safety notice the leader chooses to publish.

**Spec status:** `draft`
**Last updated:** 2026-06-03

Background reading: [`../ops/08-operational-safety-and-event-model.md`](../ops/08-operational-safety-and-event-model.md).

---

## Fields

- **id** (`string`, required, public) — unique identifier, server-generated.
- **eventId** (`string`, required, public) — the event this incident is bound to.
- **type** (`enum`, required, public) — one of:
  - `INJURY` — cuts, falls, illness, medical problem
  - `THEFT` — stolen items, suspected theft, missing property
  - `CONFLICT` — argument, fight, harassment, unsafe crowd behaviour
  - `LAND_PERMISSION` — private land, disputed access, owner objection
  - `WEATHER` — heavy rain, heat, lightning, unsafe conditions
  - `FLOOD` — river rise, flash flood, water-related emergency
  - `PROPERTY_DAMAGE` — damage to public or private property
  - `MISSING_PERSON` — participant cannot be located
  - `LEGAL` — police, ward, municipal, liability concern
  - `OTHER` — anything else
- **severity** (`enum`, required, public) — `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Drives the event-level `riskLevel` aggregation and notification cascade.
- **status** (`enum`, required, public) — `OPEN`, `ACKNOWLEDGED`, `IN_PROGRESS`, `RESOLVED`, `ESCALATED`, `CLOSED`.
- **reportedById** (`string`, required, internal) — member who filed the report.
- **reportedByName** (`string`, optional, leader-visible) — display name; redacted for non-leader reads.
- **assignedToId** (`string`, optional, internal) — member assigned to respond.
- **description** (`string`, required, leader-visible) — free-form narrative of what happened. Never returned in public reads.
- **locationNote** (`string`, optional, leader-visible) — where on site, additional context.
- **evidenceUploadIds** (`array of string`, optional, leader-visible) — references to upload records (photos, audio).
- **publicNote** (`string`, optional, public) — leader-curated, generically-worded safety message the public may see ("paused due to weather, resuming once safe"). Distinct from the private `description`.
- **createdAt** (`datetime`, required, public).
- **acknowledgedAt** (`datetime`, optional, public).
- **resolvedAt** (`datetime`, optional, public).

---

## Validation rules

- `description` is required at creation and may not be empty.
- `severity` of `CRITICAL` may trigger an automatic `Event.status` transition to `PAUSED`; backend may enforce, frontend may anticipate.
- `status` transitions follow `OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED`. `ESCALATED` is reachable from any non-terminal state and routes attention to admins.
- `publicNote` may only be set or updated by the event leader or platform admin; non-leader reads do not include it before it is set.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List incidents for an event | REST GET | EventLeader, SafetyLead, Admin (full); Public (count only) | Returns the per-event incident list. Public callers receive an aggregate count + risk-level summary, no incident bodies. |
| Get incident by id | REST GET | EventLeader, SafetyLead, Admin | Single incident with all leader-visible fields. |
| Report an incident | REST POST | Authenticated participant, EventLeader, SafetyLead, or Admin | Creates a new incident. Body: `{ type, severity, description, locationNote?, evidenceUploadIds? }`. |
| Acknowledge / assign | REST PATCH | EventLeader, SafetyLead, or Admin | Updates status, assignedToId, and may set acknowledgedAt. |
| Resolve | REST POST | EventLeader, SafetyLead, or Admin | Sets status to `RESOLVED` + stamps resolvedAt. |
| Escalate | REST POST | Anyone authenticated | Sets status to `ESCALATED`. Notifies admins per the [notification rules](../ops/08-operational-safety-and-event-model.md#notification-rules). |
| Publish public note | REST PATCH | EventLeader or Admin | Sets `publicNote` for the citizen-facing safety surface. Idempotent. |
| Stream incident updates | SSE | EventLeader, SafetyLead, Admin (full feed); Public (riskLevel-only feed) | Optional. Real-time updates during an active event. |

---

## Relationships

- An incident belongs to exactly one event.
- An incident is reported by one member; reporter identity is leader-visible only.
- An incident may be assigned to one responder (typically the safety lead or medic).
- Multiple incidents per event aggregate into `Event.riskLevel`: any `CRITICAL` open incident sets riskLevel to `CRITICAL`; any `HIGH` to `URGENT`; any `MEDIUM` to `WATCH`; otherwise `NORMAL`.
- Evidence uploads are stored as separate upload records.

---

## Computed fields

- **isPublic** — derived from the public-visibility rules per type and the presence of `publicNote`. A frontend convenience.
- **canResolve** — per-viewer flag indicating whether the current viewer may move the incident to `RESOLVED`.

---

## State machine

```
(none)        → OPEN          (created)
OPEN          → ACKNOWLEDGED  (leader / safety-lead picks it up)
ACKNOWLEDGED  → IN_PROGRESS   (response under way)
IN_PROGRESS   → RESOLVED      (issue handled; resolvedAt stamped)
any non-terminal → ESCALATED  (any authenticated user; notifies admins)
RESOLVED      → CLOSED        (admin sweeps closed once recorded)
ESCALATED     → IN_PROGRESS   (admin re-engages)
ESCALATED     → CLOSED        (admin closes after review)
```

---

## Visibility rules (public vs leader vs admin)

| Field | Public | EventLeader / SafetyLead | Admin |
|-------|--------|--------------------------|-------|
| Count of open incidents | yes (aggregate) | yes | yes |
| `Event.riskLevel` | yes | yes | yes |
| `publicNote` | yes | yes | yes |
| `type`, `severity` | no | yes | yes |
| `description`, `locationNote` | no | yes | yes |
| `reportedById`, `reportedByName` | no | yes | yes |
| `evidenceUploadIds` | no | yes | yes |
| `status`, `assignedToId` | no | yes | yes |

Theft, injury, harassment, land-permission, and legal incidents have an additional rule: even leader-visible reads should redact identifying personal details by default; an explicit "show full" toggle (requires Admin) reveals them.

---

## Future-proofing notes

- `incidentChannelTags` field for routing automatic notifications to specific Slack / SMS templates. Out of scope for MVP.
- `attestedBy` field for a second witness signature on serious incidents. Out of scope for MVP.

---

## Recent changes

- `2026-06-03` — initial spec draft. Captures the entity and operations needed by the new `IncidentReportPanel` + `IncidentListPanel` UI on `/events/[id]` (roadmap 4.2). Visibility rules tightened to match the 2026-06-03 pivot's "publish minimal, retain full audit trail" stance.
