# Shramdaan Operational Safety And Event Model

## Purpose

This document captures planning decisions for turning supported issues into real cleanup events or campaigns while handling safety, legal, medical, conflict, and urgent operational cases.

Use this document before implementing event/campaign APIs, incident reporting, volunteer role assignment, or notification workflows. `docs/07-api-reference.md` remains the source of truth for exact API contracts once those endpoints exist.

## Core Recommendation

Keep three separate concepts:

- `Issue`: the community problem and voting lifecycle.
- `Event` or `Campaign`: the execution plan for solving a promoted issue.
- `Incident` or `EventAlert`: safety, legal, conflict, weather, medical, or urgent operational cases during planning or execution.

Do not put every state into one primary status field. Primary status should describe the normal flow. Risk and incident handling should be a separate operational layer.

## Recommended Entity Split

### Issue

Represents the reported problem.

Suggested responsibilities:

- Title, description, category, address, latitude, longitude.
- Reporter and public evidence uploads.
- Vote count and promotion readiness.
- Public lifecycle status such as `OPEN`, `PROMOTED`, `EVENT_SCHEDULED`, `COMPLETED`, `REJECTED`, or `DUPLICATE`.

### Event Or Campaign

Represents the organized cleanup execution created from a promoted issue.

Suggested responsibilities:

- `issueId` reference.
- Meeting point, schedule, expected duration, organizer notes.
- Required help, safety checklist, materials, logistics, and permissions.
- Operational status such as `DRAFT`, `SCHEDULED`, `ACTIVE`, `PAUSED`, `COMPLETED`, or `CANCELLED`.
- Summary risk level such as `NORMAL`, `WATCH`, `URGENT`, or `CRITICAL`.

Prefer the term `Campaign` if the product treats cleanup work as a planned community campaign with preparation, participation, documentation, and result publishing. Prefer `Event` only if the backend model is intentionally a single calendar occurrence.

### Incident Or EventAlert

Represents something that needs attention outside the normal event flow.

Possible incident types:

- `INJURY`: cuts, falls, illness, or medical problems.
- `THEFT`: stolen items, suspected theft, or missing property.
- `CONFLICT`: arguments, fights, harassment, or unsafe crowd behavior.
- `LAND_PERMISSION`: private land, disputed access, or property-owner objection.
- `WEATHER`: heavy rain, heat, lightning, or unsafe conditions.
- `FLOOD`: river rise, flash flood, or water-related emergency.
- `PROPERTY_DAMAGE`: damage to private or public property.
- `MISSING_PERSON`: participant cannot be located.
- `LEGAL`: police, ward, municipal, or liability concern.
- `OTHER`: anything not covered above.

Suggested fields:

```ts
type Incident = {
  id: string;
  eventId: string;
  type: IncidentType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED" | "ESCALATED" | "CLOSED";
  reportedById: string;
  assignedToId?: string;
  description: string;
  locationNote?: string;
  evidenceUploadIds?: string[];
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
};
```

## Status Strategy

Keep lifecycle status and risk state independent.

Recommended rule:

- `Issue.status` describes the problem lifecycle.
- `Event.status` describes execution progress.
- `Event.riskLevel` summarizes current operational risk.
- `Incident.status` describes how a specific case is being handled.

Example flow:

```txt
Issue OPEN
-> votes reach threshold
-> server transaction creates Event/Campaign and sets Issue.status = PROMOTED
-> organizer schedules details and sets Event.status = SCHEDULED
-> Issue.status becomes EVENT_SCHEDULED
-> event starts and Event.status = ACTIVE
-> incident reported, Event.riskLevel becomes URGENT or CRITICAL
-> incident resolved, Event.riskLevel recalculates
-> event completed and Issue.status = COMPLETED
```

Status synchronization should happen through backend service functions, not scattered frontend updates. Examples:

- `promoteIssueToCampaign(issueId)`
- `scheduleCampaign(campaignId, details)`
- `pauseCampaignForSafety(campaignId, incidentId)`
- `completeCampaign(campaignId, result)`

## Roles And Assignments

Separate platform-level permissions from event-specific responsibilities.

Platform roles:

- `USER`
- `ADMIN`
- `MODERATOR`

Volunteer or application roles:

- `VOLUNTEER`
- `MEDICAL_PROFESSIONAL`
- `EVENT_LEAD`
- `SAFETY_LEAD`
- `LOGISTICS_LEAD`
- `LEGAL_COORDINATOR`
- `DOCUMENTATION_LEAD`
- `COMMUNITY_MANAGER`
- `DONOR`
- `OTHER`

Event-specific assignment should track who is actually responsible for a specific campaign:

```ts
type EventParticipant = {
  eventId: string;
  userId: string;
  role: EventRole;
  status: "INVITED" | "CONFIRMED" | "CHECKED_IN" | "LEFT" | "NO_SHOW";
};
```

A user may be a medical professional in their profile or application, but the event still needs to know whether a medical professional is confirmed for that specific cleanup.

## Safety And Incident Examples

Minor injury:

- Incident type `INJURY`, severity `LOW` or `MEDIUM`.
- Notify event lead and medical professional if assigned.
- Keep event active unless the safety lead pauses it.
- Record first-aid action and close after resolved.

Serious injury:

- Incident type `INJURY`, severity `HIGH` or `CRITICAL`.
- Notify event lead, safety lead, medical professional, and admins immediately.
- Show urgent instructions to checked-in participants if needed.
- Event may move to `PAUSED` or `CANCELLED`.

Land permission dispute:

- Incident type `LAND_PERMISSION`.
- Notify event lead, legal coordinator, and admins.
- Public status can say "paused due to permission review" without exposing private details.
- Event resumes only after organizer/admin confirmation.

Theft or accusation:

- Incident type `THEFT`.
- Keep details private to leaders/admins.
- Avoid public accusations or suspect names.
- Track evidence and escalation notes carefully.

Flood or severe weather:

- Incident type `FLOOD` or `WEATHER`, severity `HIGH` or `CRITICAL`.
- Notify all checked-in participants with evacuation or safe-point instructions.
- Event should normally move to `PAUSED` or `CANCELLED`.

Conflict or fight:

- Incident type `CONFLICT`.
- Notify event lead, safety lead, and admins.
- Escalate if there is violence, harassment, or participant safety concern.

## Notification Rules

Urgent notifications should be rule-based and tied to incident severity.

Suggested defaults:

- `LOW`: notify assigned lead in app.
- `MEDIUM`: notify event lead and relevant role in app/SMS.
- `HIGH`: notify event lead, safety lead, admins, and relevant specialists.
- `CRITICAL`: notify event lead, safety lead, admins, relevant specialists, and checked-in participants when participant action is required.

Avoid broadcasting sensitive incident details publicly. Public messages should focus on safe instructions, event status, and next steps.

## Public And Private Visibility

Public visitors may see:

- Event scheduled, active, paused, cancelled, completed.
- General safety notices.
- Result summaries and impact proof.

Leaders/admins may see:

- Incident details.
- Reporter and assigned responder.
- Evidence uploads.
- Medical, legal, or conflict notes.
- Escalation trail and resolution history.

Sensitive data should be access-controlled. Theft, injury, harassment, private land disputes, and legal notes should not be public by default.

## API Planning Checklist

Before implementing APIs, decide:

- Entity name: `Event` or `Campaign`.
- Whether promotion creates the event/campaign automatically.
- Exact status enums for issue, event/campaign, incident, and participant assignment.
- Which transitions require admin, organizer, safety lead, or automated service logic.
- Whether `riskLevel` is stored or derived from open incidents.
- Which incident types and severities trigger notifications.
- Which notification channels are available in MVP.
- Which incident fields are public, leader-only, admin-only, or audit-only.
- How evidence uploads are attached to issue reports, campaign progress, and incidents.
- What minimum safety checklist is required before an event can become active.

## Frontend Planning Notes

Until APIs exist, frontend can represent this safely with mock data:

- A campaign card with normal status and a separate risk badge.
- A safety notice area that does not expose private incident details.
- Role labels such as event lead, logistics lead, and medical professional.
- A simulated incident escalation state for design planning only.

Do not implement real emergency handling, medical claims, legal workflows, or participant tracking without confirmed backend endpoints and access-control rules.
