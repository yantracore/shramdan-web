# API Requirements

> Source of truth for the backend API contracts that the frontend depends on.
> Written by AI agents based on what the UI actually exercises against mock data.
> Backend developers review each file manually with their own AI assistance.

The methodology that produced this folder is recorded in [`../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md`](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md). Read that ADR first if you are new to this folder.

---

## How to read this folder

### If you are the backend developer

Pick a domain file (for example, `events.md`). Read the opening paragraph first — it explains what the entity represents in business terms. Then scan fields, operations, RBAC, and the state machine. Skip sections you do not need.

You do not have to read every file. Each domain file is self-contained except for explicit relationship callouts to other files.

Treat this folder as the **starting point of a conversation**, not a unilateral spec. If a field or operation is technically impractical, push back; the spec will be revised. Implementation details (indexes, query optimization, caching strategy) are intentionally absent — those are your domain.

### If you are an AI agent (Shramesh or others)

When you ship a UI feature that introduces or changes a field, an operation, an RBAC rule, or a state transition, **update the matching domain file in the same working session.** The marginal cost is small while context is already loaded; bulk regeneration later is significantly more expensive.

Follow [`_template.md`](_template.md) section ordering exactly so files remain AI-parseable and diffs stay clean.

If a new entity emerges (a genuinely new noun in the product, not just a new field on an existing entity), create a new file using the template and add a row to the status table below in the same edit.

---

## Conventions

- **English only.** No Nepali prose anywhere in this folder.
- **No UI file references.** The backend does not need to know that an event field is consumed by a particular React component. The spec is independent of the consuming code.
- **No mock data references.** The mock data in `src/lib/devMockData.js` is a private implementation detail of the frontend.
- **Prose-first.** Lead each section with business meaning. Type information is supporting.
- **Strict section order.** Follow `_template.md` so version diffs stay clean and AI agents can parse files predictably.
- **No backwards-compatibility shims.** When a field is renamed or removed in the spec, the file reflects the new shape; the `Recent changes` section at the bottom records the transition.

---

## Status table

**Spec status values:**

- `draft` — initial version, may change as the UI matures.
- `stable` — UI is shipping against this shape and the spec is unlikely to change without notice.
- `frozen` — backend has implemented this and the file is now a record, not a request.

**Backend implementation status values:**

- `not-started` — no endpoints yet.
- `partial` — some endpoints are live; gaps documented inline in the domain file.
- `complete` — all operations in the file are live in production.

| Domain               | Spec        | Backend impl  | Notes |
|----------------------|-------------|---------------|-------|
| events               | _pending_   | partial       | First Phase C deliverable. Existing endpoints live; gaps tracked in [`../engineering/09-backend-admin-gaps.md`](../engineering/09-backend-admin-gaps.md). |
| event-participants   | _pending_   | not-started   | Includes role assignment per event, signup, and roster reads. |
| meetings             | _pending_   | not-started   | New entity introduced by the two-meeting flow pivot. |
| members              | _pending_   | partial       | Existing `/users` endpoints are the rough equivalent; spec will name the product-side noun explicitly. |
| comments             | _pending_   | not-started   | Includes live-event comment streams; transport considerations (SSE or WebSocket) captured in-file. |
| live-streams         | _pending_   | not-started   | YouTube wrapper plus viewer-count and reaction streams. |
| notifications        | _pending_   | not-started   | Reminder cadence (kickoff → signup → pre-execution → event day) and incident alerts. |

Spec files will populate during Phase C of the rollout described in the ADR.

---

## Update protocol

1. **In-session update.** When an AI agent ships a UI feature that touches an entity covered in this folder, the same agent updates the matching file before closing the session. The marginal cost is small when the agent is already loaded with context; bulk-regenerating later requires re-exploring every feature from scratch.

2. **Sync sweep.** Approximately every ten UI feature ships, a maintenance pass scans the mock data and UI components against the spec files and lists any drift. The drift list goes to the project lead for triage.

3. **Recent changes log.** Each domain file ends with a `Recent changes` section listing the last several mutations with dates and brief descriptions. Backend developers reading an updated file see what is new without re-reading the whole document.

---

## Related

- [`../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md`](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md) — the methodology ADR.
- [`../engineering/09-backend-admin-gaps.md`](../engineering/09-backend-admin-gaps.md) — backend gaps reported from the admin side. Older and narrower in scope; this folder is the broader successor and the two will overlap during the transition.
- [`../engineering/10-frontend-api-usage.md`](../engineering/10-frontend-api-usage.md) — frontend-side API usage map.
- [`../ops/00-master-roadmap.md`](../ops/00-master-roadmap.md) — the master roadmap; individual leaves may reference per-domain spec files here.
