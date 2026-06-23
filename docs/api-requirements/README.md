# API Requirements

> Source of truth for the backend API contracts that the frontend depends on.
> Written by AI agents based on what the UI actually exercises against mock data.
> Backend developers review each file manually with their own AI assistance.

The methodology that produced this folder is recorded in [`../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md`](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md). Read that ADR first if you are new to this folder.

> **📌 Start here:** [`00-OUTSTANDING.md`](00-OUTSTANDING.md) is the consolidated punch list of what the backend still needs to build — everything not on that list is already live. The per-domain files below carry the full prose; the punch list is the short handoff. Last reconciled against the live spec on **2026-06-23**.

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
- `partial` — some endpoints are live; gaps documented inline in the domain file (and in [`00-OUTSTANDING.md`](00-OUTSTANDING.md)).
- `complete` — all operations in the file are live; only optional / nice-to-have items remain.
- `deferred` — pulled out of the active build (v2); the file stays as a record, not a current request.

Table reconciled against the live spec on **2026-06-23**. The single punch list of what's left is [`00-OUTSTANDING.md`](00-OUTSTANDING.md).

| Domain | Spec | Backend impl | Notes |
| --- | --- | --- | --- |
| [issues](issues.md) | stable | complete | All ten operations live (incl. participants roster). Read-side gaps only: `isVoted`/event embed on the detail read, `uploadIds` on PATCH, author withdraw — see [00-OUTSTANDING](00-OUTSTANDING.md) P1/P2. |
| [events](events.md) | draft | partial | List/get/schedule/complete/cancel/leader-\*/role-plan live; **server-side filters now resolved** (category/municipality/ward/sort/order/bbox). Pending: activate, reminder cadence, pause/resume, `viewerParticipation` echo, embedded issue `translations` — P1/P2. |
| [event-participants](event-participants.md) | draft | complete | Join/leave/role/invite/check-in/role-plan PUT + my-participation all live; re-join reactivation fixed (2026-06-19); self-nominate (SEEKING) shipped (2026-06-22). Only the optional SSE roster stream remains. |
| [comments](comments.md) | draft | complete | CRUD + reactions + report + replies + the SSE `/comments/stream` endpoint all live. Minor: per-viewer `myReactions`, admin pin/flag-management. |
| [members](members.md) | draft | partial | Profile/role/medical-credential/leader-eligibility/delete live. Pending: admin `PATCH /users/{id}` profile edit, public-profile-preferences endpoint — P2. |
| [applications](applications.md) | draft | partial | Public submission + account-creating signup live. Pending: multi-attachment arrays, optional token-withdraw — P4. |
| [feedback](feedback.md) | draft | partial | Public submission + admin triage live. Pending: multi-attachment `screenshotIds` array — P4. |
| [notifications](notifications.md) | stable | partial | REST (list/unread-count/read/read-all/preferences PUT) + live SSE on staging. Pending: `GET /notifications/preferences`, OpenAPI doc for the SSE endpoint — P2. |
| [discussions](discussions.md) | draft | not-started | `/discussions` is a live nav surface running on a stub; full spec ready. P3. |
| [feature-votes](feature-votes.md) | draft | not-started | Projection of discussion topics (`kind: FEATURE_PROPOSAL`); pending alongside discussions. P3. |
| [live-streams](live-streams.md) | draft | not-started | Home live rail uses mock data; broadcast metadata + viewer-count SSE. P3. |
| [incidents](incidents.md) | draft | not-started | FE panels exist (roadmap 4.2); also unblocks events pause/resume + `riskLevel`. P3. |
| [donations](donations.md) | draft | not-started | Phase 6 transparency ledger (`/ledger`). Future. P3. |
| [meetings](meetings.md) | draft | deferred | Two-meeting kickoff/pre-execution flow; no UI consumes it after the 2026-06-05 TV-app pivot reshaped the planning model. |
| [app-development](app-development.md) | draft | deferred | Standalone task board folded into `/discussions` for now; nav points there. |

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
