# Status-Gated Inline Participation — Design

**Date:** 2026-06-24
**Status:** Draft for review
**Surfaces:** issue detail page, event detail page (the participant-facing "take part" CTA)

## Problem (evidence-backed)

While testing, clicking **Join** on a promoted issue's topline navigated the user
to `/events/{id}` ("a different events page") and they could not join. Live trace
of staging (`backend.shramdan.org`) confirmed three root causes:

1. **Issue status is coarse.** An issue flips to `EVENT_SCHEDULED` the moment it
   is promoted, regardless of the linked event's real sub-status. Every promoted
   `qa-*` issue read as `issue.status = EVENT_SCHEDULED` while its event was still
   `DRAFT` with `scheduledAt: null`.
2. **Join navigates instead of acting inline.** `IssueJoinButton` wraps the CTA in
   a `<Link href="/events/{eventId}">`, so the primary action bounces the user to
   the event page rather than opening the role picker in place.
3. **Join target often missing.** The event page's `ParticipantsPanel` renders
   joinable rows from `rolesNeeded` (derived from `rolePlan`). Only **8 of 39**
   live events carry a non-empty `rolePlan`; several `SCHEDULED` events have
   `rolePlan: 0`. With no rolePlan there are no rows to click → nothing to join.

## Intended model (from the project lead's spec)

One status-aware participation CTA, shown inline on whichever surface the viewer
is on, triggering the **same role-picker component**, with the available actions
limited by lifecycle phase. The participant sees one continuous lifecycle even
though the underlying entity transitions from issue → event.

These are the **only five phases** the CTA worries about. `OPEN` is sourced from
the issue; the other four are sourced from the **event's status** directly.

| Phase | Authoritative source | Button label | Actions in picker |
|---|---|---|---|
| `OPEN` | `/issues?status=OPEN` → `issue.status` | **Support** | Interested · Join as Role · Lead |
| `DRAFT` | `/events?status=DRAFT` → `event.status` | **Join** | Join as Role · Lead |
| `SCHEDULED` | `/events?status=SCHEDULED` → `event.status` | **Join** | Join as Cleaner (WORKER) |
| `ACTIVE` | `/events?status=ACTIVE` → `event.status` | **Join** | Join as Cleaner (WORKER) |
| `COMPLETED` | `/events?status=COMPLETED` → `event.status` | **"Contributed as {role}"** | — (read-only) |

`CANCELLED` (event) is not one of the five; it falls through to a read-only "no
action" state.

**Status taxonomy note (confirmed live 2026-06-24 via devtunnel).** The backend
now reports `issue.status = EVENT_DRAFT` on promotion (the old `EVENT_SCHEDULED`
is retired — that filter now 400s). Valid issue statuses: **`OPEN`,
`EVENT_DRAFT`, `COMPLETED`**. **Crucially, `issue.status` is still coarse:**
`EVENT_DRAFT` covers the linked event being `DRAFT`, `SCHEDULED`, `ACTIVE`, *and*
`CANCELLED` — only `COMPLETED` flips the issue to `COMPLETED`. So the rename did
NOT make the issue track the fine phase. The frontend therefore gates the
button/roles on **`event.status`**, resolved via `resolveEventForIssue` →
`resolvedEventStatus`; `issue.status` only distinguishes `OPEN` (vote) from
"promoted" (join) and the terminal `COMPLETED`.

`GET /issues/{id}` still does **not** embed an event link (`event` / `eventId`
absent), so `resolveEventForIssue` (district-list + `issueId` match) is retained.
A new `eventRoleCounts` field now appears on the issue read — worth exploring as a
rolePlan-independent source for the DRAFT role menu. A clean backend ask (embed
`event { id, slug, status }` on the issue read) would let us drop the lookup
entirely — route handoff to Pranish, out of scope here.

## Key decisions (confirm in review)

1. **Inline modal, no navigation.** (Approved.) Whichever surface the viewer is
   on gates the CTA by the resolved `event.status` and completes the join **in
   place** via the role-picker modal. The issue topline reflects the promoted
   event's phase (DRAFT/SCHEDULED/ACTIVE → inline join with the phase's role
   limit; COMPLETED → chip) instead of linking out to `/events/{id}`. The event
   page does the same. Cross-surface links may still exist for context, but no
   primary join action requires a route change.
2. **DRAFT shows the full role menu** even when `event.rolePlan` is empty. The
   picker's role list is **status-driven, not rolePlan-driven**, so a freshly
   promoted event is joinable immediately. (This is the direct fix for root cause #3.)
3. **SCHEDULED/ACTIVE collapse to "Join as Cleaner" (WORKER only).** Once
   scheduled, specialised roles and leadership are locked; newcomers join only as
   a general worker. This also means these phases never need a `rolePlan` to be
   joinable.

## Approach (recommended)

Minimal reuse of the two existing hooks, no new data layer:

- **`OPEN`** keeps `useRoleSupport` + `SupportRolesModal` (issue voting) — unchanged.
- **Promoted phases** keep `useEventJoin` + the role picker, but:
  - `IssueJoinButton` drops the `<Link>` and instead opens the picker **inline**
    (mounts `useEventJoin` for the resolved event id, opens its modal).
  - `useEventJoin` derives its joinable role list from **status** rather than only
    `rolesNeeded`: `DRAFT` → full role set; `SCHEDULED`/`ACTIVE` → `["WORKER"]`;
    `COMPLETED`/`CANCELLED` → `[]`.
  - `COMPLETED` renders a read-only "Contributed as {role}" chip from
    `myParticipation`.

*Alternative considered:* merge issue-vote and event-join into a single hook —
rejected (large refactor, high risk, no functional gain for this goal).

## Components touched (frontend only)

- `src/components/IssueJoinButton.js` — replace navigation with an inline
  `useEventJoin` modal trigger; keep the "almost ready" toast only when no event
  id can be resolved at all.
- `src/lib/useEventJoin.js` — status-driven `participantJoinableRoles` (fix
  `SCHEDULED` from "all roles" to WORKER-only); synthesise a default role list
  when `rolePlan` is empty for `DRAFT`.
- `src/app/issues/[id]/page.js` — `COMPLETED` → "Contributed as {role}" chip;
  ensure the resolved event id/status drive the topline CTA.
- `src/app/events/[id]/page.js` — apply the same gating so both surfaces agree;
  WORKER-only join must render even when `rolePlan` is empty.

## Backend dependency (verify before coding)

`POST /events/{id}/participants { role }` acceptance is unconfirmed for:
- a **specialised role on a DRAFT event** (does it require the role be in `rolePlan`?),
- **WORKER on a SCHEDULED event with empty `rolePlan`**.

A short live probe (one qa account joining a throwaway `qa-*`/`open15-*` event in
each phase) will confirm. If the backend rejects roles absent from `rolePlan`, the
gap is a route handoff to Pranish (seed a default `rolePlan` on promotion); the
frontend gating above is unaffected.

## Out of scope (YAGNI)

- No issue↔event backend merge (convergence stays frontend-only).
- Leader nomination keeps its existing `LeaderNominationPanel` path; "Lead" in the
  DRAFT picker reuses it rather than inventing a new flow.
- Notification testing (the original task) resumes after this lands.

## Testing

- Drive each phase in a real browser (Playwright) per the verify-before-done rule:
  OPEN → Support modal; DRAFT → Join-as-Role modal opens inline (no nav); SCHEDULED
  → Join-as-Cleaner only; COMPLETED → read-only chip.
- Assert the inline modal opens **without a route change** (the original bug).
- Confirm a join succeeds against a real DRAFT and SCHEDULED event on staging.
