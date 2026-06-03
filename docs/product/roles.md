# Shramdan Roles

> श्रमदान is not "volunteers doing work." It is a constellation of distinct roles, each contributing labor in its own form. The app itself is built by these same roles.
>
> Status: v0.2 draft. Names and surface mappings will evolve.
> Restructured 2026-06-03 to use three top-level lanes — see [`../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md`](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md).

---

## Why roles matter

The word "volunteer" flattens distinctions. A photographer at an event is not doing the same labor as someone clearing drains. A developer adding a feature is not doing the same labor as the leader coordinating timing. Distinct roles let each person:

- Know what they're committing to before they show up
- Get credit appropriate to their contribution
- Connect with others doing the same role across events
- Build skill over time in a recognizable lane

The architectural rule: **every role is श्रमदान**. There is no "core team" and "volunteers" hierarchy. The Developer Shramdan and the Worker Shramdan are equally श्रमदान members; what differs is the lane.

---

## Three lanes

Roles group into three top-level lanes, each with its own crowd of people and (in time) its own signup surface:

1. **Event-Participation Shramdan** — people doing labor in service of a specific campaign event.
2. **Development Shramdan** — people building the platform itself (code, design, copy, community outreach).
3. **Company-Management Shramdan** — people keeping the operation accountable, legal, and financially sound.

Plus one AI lane that stands apart from the human ones.

People may belong to more than one lane over time — a Developer Shramdan can show up on event day as a Worker Shramdan, and that crossover is part of the design, not an exception.

---

## Event-Participation Shramdan

The lane for roles tied to a specific real-world event. A person signs up for one of these per event; the assignment is confirmed at the pre-execution review meeting (see [`../ops/08-operational-safety-and-event-model.md`](../ops/08-operational-safety-and-event-model.md)).

### Leader Shramdan

The person who took ownership of converting an issue into an event. Owns scheduling, meetup logistics, safety checklist, role assignment for the event, and the completion record. Selected via community vote (or admin assignment in v1). Temporary by event — leadership does not accumulate as status.

### Worker Shramdan

The hands-on labor. Clearing drains, planting trees, painting walls, removing trash. *(Working name; "Worker" carries dignified weight in Nepali but may not be the final term. Candidate alternatives under consideration: Field Shramdan, Frontline Shramdan, श्रम-कर्मी. Open.)*

### Photographer Shramdan

Captures stills before, during, and after the event. Hands-off the cleanup itself; their labor is documentation. Photos feed the impact story, the event archive, and the social shareables.

### Livestreamer Shramdan

Runs the YouTube Live stream from the event site. Equipment is their phone + optionally a tripod. Brief technical onboarding pre-event. Stays through to event close. Their labor is enabling everyone who couldn't attend to *be there*.

### Medic Shramdan

Trained first-aiders (or qualified medical professionals) present at events involving real risk — heavy lifting, traffic-adjacent work, monsoon-season operations. Pre-event safety checklist (roadmap 4.6) explicitly requires medic confirmation for high-risk categories.

### Safety Lead Shramdan

Manages real-world risk: traffic, permissions, weather contingency, conflict de-escalation. Runs the safety checklist gate. Distinct from medic — the safety lead's job is to prevent incidents; the medic's job is to respond to them.

### Coordinator Shramdan

The on-site flow controller during the event itself. Where do new arrivals report? When does the break happen? Who is on the next tool rotation? This is the Leader's deputy, often picked from people who have led before.

### Logistics Shramdan

Pre-event procurement and post-event return. Tools, gloves, masks, water, refreshments, disposal arrangements. Often overlaps with material donations — the donor who brings gloves *is* the Logistics Shramdan for that line item.

---

## Development Shramdan

The lane for roles building the platform itself — its code, its design, its copy, and the community around it. Same dignity as the event-day roles; the work is just continuous rather than tied to a single event.

### Developer Shramdan

Writes, reviews, and maintains the code. Frontend, backend, infra, QA, devops — all under this lane. Public attribution via git history and the dev series.

### Designer Shramdan

Visual and interaction design. Iconography, illustration, animation, typography, color systems. Outputs feed both the platform and the event collateral (event posters, share images).

### Translator Shramdan

Maintains EN↔NE parity across the platform. New copy lands with both languages; this role keeps that promise. Devanagari rendering, locale-specific phrasing, transliteration of borrowed terms — all here. ([`../engineering/06-implementation-notes.md`](../engineering/06-implementation-notes.md) for the technical layer; this role is the human side.)

### Content Writer Shramdan

Drafts copy, articles for the dev series, narrative pieces around impact stories. Often handed off to Translator Shramdan for the second-language version. Tone matches [`../ai-agents/01-shramesh.md`](../ai-agents/01-shramesh.md) — humane, never cheesy.

### Outreach Shramdan

Talks to communities considering using श्रमदान. Onboards new neighborhoods, fields questions from elder organizers who aren't comfortable with the app, runs the human side of "did you see what they did in Ratnapark?" Counterpart to the Content Writer; one writes, the other talks. Sits in the Development lane because the labor is platform-growth, not event-day execution.

---

## Company-Management Shramdan

The lane for roles that keep the operation accountable, legal, and financially sound. Less visible than event-day or platform work, but the platform cannot run without them.

### Financial Advisor Shramdan

Oversees the public ledger. Reviews donation flows, expense receipts, surplus allocation, partnership financial structures. See [`./sustenance-strategy.md`](./sustenance-strategy.md). The labor is keeping the money trustworthy.

### Legal Shramdan

Pro-bono or volunteer legal counsel for the platform — terms of service review, donation compliance, land permission for events, incident-related questions, future organization-partnership contracts. Engaged ad-hoc, not always-on.

Additional management roles — HR, operations admin, partnership lead — will be added here as the platform grows. The lane is kept thin in v0.2 because most management labor today is absorbed by the project lead directly.

---

## AI Lane

### श्रमेश

The named AI shramdan member. Two modes — developer-facing (current) and user-facing (planned). Treated as a team member with a real role, not a tool. Full character canon at [`../ai-agents/01-shramesh.md`](../ai-agents/01-shramesh.md).

---

## Role mechanics

### Selection

- **Self-selection** is the default. People sign up for the role they want via the relevant signup surface (event role panel for Event-Participation, `/join` for Development, direct outreach for Company-Management).
- **Verification** scales by role weight. Anyone can be a Worker Shramdan. Medic Shramdan requires credentials. Leader Shramdan requires community trust (vote or admin nomination). Financial Advisor and Legal require established credentials and direct vetting.
- **Skill development** is tracked at the personal level — a Worker Shramdan who has attended five events can step into Coordinator Shramdan for the sixth.

### Temporary promotion

For a specific event, some roles get **temporary additional rights** without permanent status change. Example: Worker Shramdan promoted to Coordinator Shramdan for one event, gaining the ability to update the participant roster mid-event. Rights revert at event close. This is built into the role-assignment system.

### Workflow: kickoff meeting → signup window → pre-execution review → event

Every event runs through two planning meetings on the canonical happy path:

- A **kickoff meeting** convened by the Leader Shramdan shortly after the issue is promoted to an event. It decides how many people are needed in each role, sets logistics ownership, and confirms the target date and meetup point.
- A **public signup window** of one to two weeks during which the event is highlighted on the home page and member portals, and people sign up for roles.
- A **pre-execution review meeting** convened shortly before the event date. It confirms the final roster, reviews logistics readiness, and surfaces any last-minute changes.

The full lifecycle and data shape are documented in [`../ops/08-operational-safety-and-event-model.md`](../ops/08-operational-safety-and-event-model.md). The shift from a single-meeting norm to this two-meeting model is recorded in [`../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md`](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md).

### Connectivity

Each role connects with others doing the same role across the platform — a Photographer Shramdan from Pokhara can ask a Photographer Shramdan from Kathmandu about lens choice. This is *not* a feature in v1 (no role-based forums yet), but the data model assumes it: every participation record carries the role, so cross-event role discovery becomes possible later.

Roles work **independently within the group**. A Photographer Shramdan does not need the Worker Shramdan's permission to compose a shot; they coordinate at the event-day level (where to stand, what to capture), not at the labor level.

---

## What this doc is NOT

- Not a backend role enum. The API has its own `ApplicationRole` and event-participant role types — see [`../engineering/09-backend-admin-gaps.md`](../engineering/09-backend-admin-gaps.md) for the current contract and [`../api-requirements/event-participants.md`](../api-requirements/event-participants.md) (when written) for the forward-looking shape. This doc is the *narrative*; the schema is the *implementation*.
- Not exhaustive. Roles will emerge as the platform meets real communities. New ones get added here when they earn a stable shape.

---

## Related

- [`../ai-agents/01-shramesh.md`](../ai-agents/01-shramesh.md) — श्रमेश as a role
- [`./sustenance-strategy.md`](./sustenance-strategy.md) — Financial Advisor Shramdan context
- [`../ops/08-operational-safety-and-event-model.md`](../ops/08-operational-safety-and-event-model.md) — event lifecycle including meetings, safety, and incidents
- [`../ops/00-master-roadmap.md`](../ops/00-master-roadmap.md) — Phase 3 (event execution), Phase 4 (safety + roles), Phase 11 (role system expansion)
- [`../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md`](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md) — the structural change recorded here
- `../public/the-people.md` — public-facing summary of who we are
