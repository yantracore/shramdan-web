# Role-based join model — everywhere, one source of truth

**Date:** 2026-06-23
**Status:** Approved design, ready for implementation plan

## Problem

The "new" role-based join model — pick from all roles with their live counts visible by
default (`ParticipantsPanel` shown inside `SupportRolesModal`) — only runs on the full
**detail pages**. Every preview surface either:

- falls back to the **old** radio-picker modal baked into `IssueVoteButton` (pick a role
  first, then the role grid is revealed) — e.g. `PublicIssueCard`, `IssuePreviewPane`; or
- has **no** join/support action at all — e.g. the glassy map popups
  (`IssueMap`, `EventMap`), event preview pane, event cards.

### Root cause

`ParticipantsPanel` / `SupportRolesModal` are presentational only. The **page** assembles
every input and hands it down:

- **Issue:** `fetchMyIssueVotes` → resolve `myVote`; `fetchIssueParticipants` → roster;
  issue's `eventRoleCounts` / `conversionThreshold` / `attendingCount` / `status`; and the
  handlers `onJoin` (`voteOnIssue(id,"GOING",role)`), `onLead` (`voteOnIssue(id,"WANT_TO_LEAD")`),
  `onInterested` (`voteOnIssue(id,"INTERESTED")`), `onLeave` (`retractVoteOnIssue(id)`).
- **Event:** `GET /events/{id}` (+ `/participants`, aggregated via `buildRolesNeeded`) and
  `/participants/me`; handlers `onJoin` (`POST /events/{id}/participants {role}`), `onLeave`
  (`DELETE /events/{id}/participants/{participantId}`).

Preview surfaces lack that wiring, so they can't render the new model — and because the
wiring lives inline in each page, it is duplicated and free to drift. This is structural:
without a single owner of the wiring, the two models will keep diverging.

## Goal

One self-contained, data-owning trigger for issue support and one for event join, used by
**every** surface **and** by the detail pages — so the role-based model is identical
everywhere and the old model is deleted. Approved scope: **both issues and events**, and the
shared hook is used **everywhere including the detail pages** (strongest divergence guard).

## Architecture

### 1. `useRoleSupport(issueId, { seed })` — issue support owner (new)

A hook that owns everything the issue detail page does today:

- **Lazy load** on first open (not on mount — a map with many markers must not fan out
  requests). When `seed` (issue object already on the card/page) is provided, render
  immediately from it and refresh in the background; otherwise fetch `GET /issues/{id}`,
  `fetchMyIssueVotes`, `fetchIssueParticipants` in parallel.
- **Derive** the exact `panelProps` the page builds today: `roles` (from `eventRoleCounts`
  + roster names, COORDINATOR pulled into the leader slot), `viewer`, `progress`
  (`variant:"conversion"`), `joinableRoles` (`isOpen && !myVote ? null : []`), `canLeave`,
  `leaderSlot`, `canLeaveLead`.
- **Handlers:** `join(role)`, `lead()`, `interested()`, `leave()` — identical bodies to the
  page handlers (same apiClient calls, same 403/409 handling, same optimistic update +
  roster refetch via an internal `applyVoteChange`).
- Returns `{ open, setOpen, panelProps, onInterested, loading, voteCount, voted, ... }`.

### 2. `IssueVoteButton` — refactor (keep the button, swap the modal)

- Keep the button face (count + label, voted/withdraw `Popconfirm`).
- Unvoted authenticated click **always** opens the **new** `SupportRolesModal` driven by
  `useRoleSupport`. **Delete** the old `pickerOpen` radio `Modal`, `ROLE_COPY.options`
  radio flow, and the `onRequestSupport` fork. The detail page no longer needs its own
  page-level `SupportRolesModal`.
- Optional `seed` prop lets surfaces that already hold the issue (cards, detail page) avoid
  a redundant fetch.

### 3. `useEventJoin(eventId, { seed })` + `EventJoinButton` — event owner (new)

- Mirror of the issue path for the participant model: lazy load `GET /events/{id}` +
  `/participants` (aggregate with `buildRolesNeeded`) + `/participants/me`; derive event
  `panelProps` (`target` per role, `variant:"fill"`, status gating via
  `EVENT_JOINABLE_STATUSES`, leader read-only); handlers `join(role)` / `leave()`.
- `EventJoinButton` renders a button + the same `ParticipantsPanel` modal shell (event
  variant: no "interested" / "want to lead" — role-fill only).

### 4. Modal shell

Reuse `SupportRolesModal` for issues. For events, render `ParticipantsPanel` (embedded)
in a `Modal` without the "I'm interested" header (events have no INTERESTED concept). Keep
one shared modal-shell component if the two converge cleanly; otherwise a thin event
wrapper that reuses the panel.

### 5. Surfaces

| Surface | Today | After |
| --- | --- | --- |
| `PublicIssueCard`, `IssuePreviewPane` | old radio modal | new model (auto, via `IssueVoteButton` fix) |
| Issue map popup (`IssueMap`) | "View" link only | + role-based support button |
| Event map popup (`EventMap`) | "View" link only | + role-based join button |
| Event preview pane / event cards | no action | + join button |
| Issue detail page, event detail page | inline wiring | consume the shared hooks |

## Divergence prevention

- Issue-support wiring lives **only** in `useRoleSupport`; event-join wiring lives **only**
  in `useEventJoin`. Both detail pages consume these hooks — there is exactly one
  implementation of each.
- The old radio modal is **deleted**, so the superseded model cannot render anywhere.
- Note in the hook module header: "every surface that offers support/join renders
  `IssueVoteButton` / `EventJoinButton`; never re-implement the wiring."

## Risks & verification

- **Leaflet popup + antd Modal:** clicks inside a Leaflet `<Popup>` can be swallowed; the
  trigger must `stopPropagation`, and the antd `Modal` (portaled to `body`) must open and be
  interactive from within a popup. Verify in a real browser.
- **No eager fetch on maps:** confirm opening N markers fires 0 participation requests until
  a modal is opened.
- **Detail-page regression:** the detail pages currently work; after they consume the hook,
  re-verify join / withdraw / lead / interested + the body roster on both pages.
- **Verification method (per project norm):** drive each surface in Playwright with a real
  logged-in member (QA account) and assert the visible artifact — open modal shows all roles
  by default, join lands, withdraw works, voted chip updates. Lint/HTTP-200 is not enough.

## Out of scope

- No backend changes; existing endpoints + enums (`INTERESTED|GOING|WANT_TO_LEAD`,
  event roles `WORKER|PHOTOGRAPHER|LIVESTREAMER|MEDIC|SAFETY_LEAD|COORDINATOR|LOGISTICS`)
  are reused as-is.
- Navigation-only surfaces (home for-you stream cards, coverflow carousel, list cards) keep
  their tap-to-navigate behavior; no action buttons added there in this pass.
