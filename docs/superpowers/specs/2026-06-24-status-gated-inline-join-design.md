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

| Lifecycle phase | Signal | Button label | Actions in picker |
|---|---|---|---|
| Issue open | `issue.status === OPEN` | **Support** | Interested · Join as Role · Lead |
| Promoted, not yet scheduled | promoted + `event.status === DRAFT` | **Join** | Join as Role · Lead |
| Scheduled | `event.status === SCHEDULED` | **Join** | Join as Cleaner (WORKER) |
| Active | `event.status === ACTIVE` | **Join** | Join as Cleaner (WORKER) |
| Completed | `event.status === COMPLETED` or `issue.status === COMPLETED` | **"Contributed as {role}"** | — (read-only) |
| Cancelled | `event.status === CANCELLED` | **"Cancelled"** | — (read-only) |

**Status taxonomy note.** The lead's clean taxonomy names the promoted-but-draft
phase `EVENT_DRAFT`; the backend currently reports `issue.status = EVENT_SCHEDULED`
for it. The frontend does NOT depend on the issue carrying a fine-grained status:
once an issue is promoted it resolves the linked event (`resolveEventForIssue` →
`resolvedEventStatus`) and gates on **`event.status`**. Issue status is used only
to tell `OPEN` (vote) apart from "promoted" (join).

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
