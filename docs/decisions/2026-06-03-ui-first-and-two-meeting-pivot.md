# 2026-06-03 — UI-first development methodology, two-meeting event flow, and API requirements as a separate documentation domain

**Status:** Adopted
**Decision makers:** विवेक (project lead), श्रमेश (AI member)
**Supersedes:**
- The "Issue → 1 meeting → fix" workflow rule in [docs/product/roles.md](../product/roles.md) (the *Workflow* subsection under *Role mechanics*)

**Related roadmap:** kicks off `12.4 Decision log / ADRs` as the first ADR file in this repository.

---

## Context

Through May and early June 2026, the team — one human project lead working alongside AI coding agents — shipped substantial slices of the platform: public issues with voting, event scaffolding, the admin control center, the roles narrative, the operational safety model, and the early home-page surfaces. Across this period two patterns emerged that the conventional "backend contract first → frontend builds against it" sequencing did not handle well.

**Pattern 1 — backend-first sequencing was slowing the work down.** Every API boundary became a communication round-trip between the human lead and the AI agents, and the contract debates frequently outweighed the value of the contracts themselves while the product shape was still being discovered. Agreed shapes had to be re-debated when the UI later surfaced a need that had been invisible at contract-design time.

**Pattern 2 — mock data was already acting as a de-facto contract.** The frontend, driven by AI, was perfectly capable of moving at full velocity against the structured mock data in [`src/lib/devMockData.js`](../../src/lib/devMockData.js). Whatever shape the UI consumed turned out to be the real requirement; speculative schema design done in advance of a UI surface was usually wrong by the time the surface shipped.

In parallel, a product reality also surfaced that the existing operational docs do not capture: real-world events need **two** distinct meetings on the canonical happy path, not one. A single meeting collapses planning and final-readiness into the same session and loses the gap during which member signups actually accumulate. The current [docs/product/roles.md](../product/roles.md) frames a second meeting as a *signal that something is wrong*; in practice it is a signal that the event is healthy enough to need a final review.

This document records the pivot that addresses both shifts together.

---

## Decisions

### 1. UI-first development is the default methodology

The frontend builds against typed mock data first. As UI features stabilize, an AI agent (typically श्रमेश) writes a corresponding API requirements file in [docs/api-requirements/](../api-requirements/) capturing the data contract the UI now expects. The backend developer reads these files, reviews with their own AI assistance, and implements.

This is **not** a one-way constraint. Backend feedback may surface real-world considerations (query cost, indexing, multi-table joins) that send a field back to the UI for renegotiation. But the starting point of the conversation is "this is what the UI consumed in production-like mock data," not a speculative schema discussion.

Spec updates are **incremental**, not batched. When an AI agent ships a UI feature that introduces or changes a field, the same agent updates the matching domain file in the same working session. Bulk regeneration later is significantly more expensive because each feature must be re-explored from scratch.

### 2. Two-meeting event flow replaces the single-meeting norm

Every event now has two meetings on the canonical happy path:

- **Meeting 1 — Kickoff.** Convened by the leader shortly after the event is promoted from an issue. Decides: maximum participants per role, logistics ownership, target date, meetup point, and any pre-event preparation tasks. Output: a confirmed event plan that goes live for public participation signup.
- **Public signup window — typically one to two weeks.** The event surface is highlighted on the home page and in member portals, encouraging signups. Whether existing supporters of the linked issue auto-populate as candidate participants is an open question (see below).
- **Meeting 2 — Pre-execution review.** Convened shortly before the event execution date. Confirms the final roster, reviews logistics readiness, surfaces any last-minute changes. Output: green light for the event to proceed.

A third or further meeting is allowed but not the norm — and not the failure signal the previous documentation framed it as.

### 3. API requirements live in `docs/api-requirements/`

A new sibling folder to `docs/engineering/`. Conventions:

- **One file per domain entity** (events.md, meetings.md, members.md, etc.). Not a monolithic file.
- **English only.** This folder is read by backend developers and their AI assistants; no Nepali prose.
- **No UI file references and no mock data references.** Backend does not need to know which React component consumes a field. The spec stands on its own.
- **Prose-first, schema-second.** Business meaning leads each section; type information is supporting.
- **Strict template structure** at [_template.md](../api-requirements/_template.md) so AI agents can parse and update files consistently.

---

## Consequences

### Positive

- Frontend velocity is no longer gated on backend handshakes for shape decisions.
- Mock data → spec → backend is a one-direction information flow; less back-and-forth.
- API requirements are written by an agent that has just exercised the UI, so the spec reflects real product needs rather than speculative ones.
- The two-meeting flow surfaces the signup-window dynamic that the single-meeting model hid, which downstream affects reminder cadence, public visibility windows, and role-fill progress indicators.
- Establishes ADR practice. Future architectural decisions get their own dated files in `docs/decisions/`.

### Negative / risks

- Mock data does not reveal pagination edge cases, real-time update needs, RBAC scoping, or multi-tenant assumptions. The spec template forces these to be captured explicitly under named sections.
- Spec/mock drift is possible if an agent ships a UI change without updating the spec. Mitigated by periodic sync sweeps (approximately every ten UI feature ships).
- Backend developer may receive a spec that is technically impractical (for example, an expensive aggregate). This is acceptable and the feedback flows back to the spec, not silently into a divergent backend.
- The two-meeting flow expands the event lifecycle and touches reminder rules, leader UI affordances, and the existing scheduling endpoint set. Phase B of the rollout will update affected docs.

---

## Out of scope (deferred)

- **Organization partnerships.** Multi-tenant schema where external organizations (schools, NGOs, social-work organizations) run their own campaigns on the platform is a real future need but is not scoped here. Single-org behavior is the current MVP. A future ADR will revisit this when the first real events have run and partnership conversations begin.
- **Workflow enforcement of incremental spec updates.** Whether incremental spec updates should be enforced via a git hook or a settings.json rule is left to a follow-up session.

---

## Open questions

- Do supporters of a linked issue auto-populate as candidate participants for the resulting event, or do they need to sign up explicitly? Defer to a meetings-flow discussion during Phase C.
- Will spec/mock drift be machine-checked via a comparison script? Logged for the polish backlog.

---

## Affected files

This ADR introduces:

- [docs/api-requirements/](../api-requirements/) — new folder
- [docs/api-requirements/README.md](../api-requirements/README.md) — methodology, index, status table
- [docs/api-requirements/_template.md](../api-requirements/_template.md) — strict template

This ADR will cause the following files to be updated in Phase B of the rollout:

- [docs/product/roles.md](../product/roles.md) — restructure role categorization into three top-level lanes; remove the "one meeting only" rule.
- [docs/ops/08-operational-safety-and-event-model.md](../ops/08-operational-safety-and-event-model.md) — add the two-meeting flow section.
- [docs/ops/00-master-roadmap.md](../ops/00-master-roadmap.md) — Phase 3 leaves acknowledge two meetings; add a pointer to the new api-requirements folder.
