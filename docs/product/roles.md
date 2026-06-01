# Shramdan Roles

> श्रमदान is not "volunteers doing work." It is a constellation of distinct roles, each contributing labor in its own form. The app itself is built by these same roles.
>
> Status: v0 draft (Phase 11). Names and surface mappings will evolve.

---

## Why roles matter

The word "volunteer" flattens distinctions. A photographer at an event is not doing the same labor as someone clearing drains. A developer adding a feature is not doing the same labor as the leader coordinating timing. Distinct roles let each person:

- Know what they're committing to before they show up
- Get credit appropriate to their contribution
- Connect with others doing the same role across events
- Build skill over time in a recognizable lane

The architectural rule: **every role is श्रमदान**. There is no "core team" and "volunteers" hierarchy. The Developer Shramdan and the Worker Shramdan are equally श्रमदान members; what differs is the lane.

---

## Event-day roles

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

## Platform-side roles *(building the app itself)*

These exist because श्रमदान is also a software platform. Every role here contributes labor in code, design, or coordination form. Same dignity as the event-day roles.

### Developer Shramdan

Writes, reviews, and maintains the code. Frontend, backend, infra, QA, devops — all under this lane. Public attribution via git history and the dev series.

### Designer Shramdan

Visual and interaction design. Iconography, illustration, animation, typography, color systems. Outputs feed both the platform and the event collateral (event posters, share images).

### Financial Advisor Shramdan

Oversees the public ledger. Reviews donation flows, expense receipts, surplus allocation, partnership financial structures. See [`sustenance-strategy.md`](./sustenance-strategy.md). This role is on the operations side — its labor is keeping the money trustworthy.

### Translator Shramdan

Maintains EN↔NE parity across the platform. New copy lands with both languages; this role keeps that promise. Devanagari rendering, locale-specific phrasing, transliteration of borrowed terms — all here. ([`../engineering/06-implementation-notes.md`](../engineering/06-implementation-notes.md) for the technical layer; this role is the human side.)

### Content Writer Shramdan

Drafts copy, articles for the dev series, narrative pieces around impact stories. Often handed off to Translator Shramdan for the second-language version. Tone matches [`../ai-agents/01-shramesh.md`](../ai-agents/01-shramesh.md) — humane, never cheesy.

### Legal Shramdan

Pro-bono or volunteer legal counsel for the platform — terms of service review, donation compliance, land permission for events, incident-related questions. Engaged ad-hoc, not always-on.

### Outreach Shramdan

Talks to communities considering using श्रमदान. Onboards new neighborhoods, fields questions from elder organizers who aren't comfortable with the app, runs the human side of "did you see what they did in Ratnapark?" Counterpart to the Content Writer; one writes, the other talks.

---

## AI lane

### श्रमेश

The named AI shramdan member. Two modes — developer-facing (current) and user-facing (planned). Treated as a team member with a real role, not a tool. Full character canon at [`../ai-agents/01-shramesh.md`](../ai-agents/01-shramesh.md).

---

## Role mechanics

### Selection

- **Self-selection** is the default. People sign up for the role they want on `/join` or via the event's role panel.
- **Verification** scales by role weight. Anyone can be a Worker Shramdan. Medic Shramdan requires credentials. Leader Shramdan requires community trust (vote or admin nomination).
- **Skill development** is tracked at the personal level — a Worker Shramdan who has attended five events can step into Coordinator Shramdan for the sixth.

### Temporary promotion

For a specific event, some roles get **temporary additional rights** without permanent status change. Example: Worker Shramdan promoted to Coordinator Shramdan for one event, gaining the ability to update the participant roster mid-event. Rights revert at event close. This is built into the role-assignment system.

### Workflow: Issue → 1 meeting → fix

The norm we aim for: any issue that reaches campaign-ready status gets **one planning meeting** (in-person or virtual) where roles are filled, logistics are agreed, and a date is set. The next interaction is the event itself. No protracted committee work.

The Leader Shramdan calls the meeting. The meeting may produce a sub-list of pre-event preparation (Logistics Shramdan ordering tools, Outreach Shramdan inviting neighbors, etc.) — but the meeting itself doesn't repeat. If a second meeting becomes necessary, that's a signal something's wrong: the issue is too big, the scope is unclear, or the wrong people are in the room.

### Connectivity

Each role connects with others doing the same role across the platform — a Photographer Shramdan from Pokhara can ask a Photographer Shramdan from Kathmandu about lens choice. This is *not* a feature in v1 (no role-based forums yet), but the data model assumes it: every participation record carries the role, so cross-event role discovery becomes possible later.

Roles work **independently within the group**. A Photographer Shramdan does not need the Worker Shramdan's permission to compose a shot; they coordinate at the event-day level (where to stand, what to capture), not at the labor level.

---

## What this doc is NOT

- Not a backend role enum. The API has its own `ApplicationRole` and event-participant role types — see [`../engineering/09-backend-admin-gaps.md`](../engineering/09-backend-admin-gaps.md) for the current contract. This doc is the *narrative*; the schema is the *implementation*.
- Not exhaustive. Roles will emerge as the platform meets real communities. New ones get added here when they earn a stable shape.

---

## Related

- [`../ai-agents/01-shramesh.md`](../ai-agents/01-shramesh.md) — श्रमेश as a role
- [`./sustenance-strategy.md`](./sustenance-strategy.md) — Financial Advisor Shramdan context
- [`../ops/00-master-roadmap.md`](../ops/00-master-roadmap.md) — Phase 3 (event execution), Phase 4 (safety + roles), Phase 11 (role system expansion)
- `../public/the-people.md` — public-facing summary of who we are
