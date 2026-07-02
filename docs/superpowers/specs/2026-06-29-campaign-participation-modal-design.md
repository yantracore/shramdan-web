# Campaign Participation Modal — Design

> Date: 2026-06-29 · Status: design approved, implementation deferred ("move later").
> Supersedes the three divergent join/support modal shells with one unified,
> status-aware modal that carries the campaign's identity (cover + title + status)
> and is consistently centred at every lifecycle stage.

---

## Problem

Clicking **Support / Join** on a `/campaigns` item opens a modal that looks
different at every status — and not just because the inner controls differ. Two
root causes:

1. **Three separate modal shells** each render the *same* `<Modal> +
   <ParticipantsPanel embedded>` with their own title/copy and no shared chrome:
   - [`SupportRolesModal.js`](../../../src/components/SupportRolesModal.js) — OPEN issues, via `IssueVoteButton`. Title "How do you want to support?".
   - [`EventJoinButton.js`](../../../src/components/EventJoinButton.js) inline `<Modal>` — events (DRAFT/SCHEDULED/ACTIVE), via `EventPreviewPane`. Title "Join this campaign".
   - [`IssueJoinButton.js`](../../../src/components/IssueJoinButton.js) inline `<Modal>` — promoted issues, via `IssuePreviewPane` / `PublicIssueCard`. Title "Which role would you take?".

2. **No `centered` prop.** Ant Design's `<Modal>` pins its *top* at ~100px and
   grows downward with content. Because content height varies wildly by status
   (OPEN = 7 roles tall; SCHEDULED = 2 roles short), each modal's visual centre
   lands at a different vertical position — short ones float high, tall ones sag
   low. None is truly centred.

Beyond positioning, the modals carry **none** of the campaign's identity — no
cover, no title, no status, no when/where. A user who steps away and returns to
an open modal cannot tell what they are committing to. This contradicts the
lifecycle doc's whole "cover + title + status + progressive blocks" philosophy
([07-campaign-detail-lifecycle-blocks.md](../../design/07-campaign-detail-lifecycle-blocks.md)).

## Goal

One `CampaignParticipationModal` — the single participation surface for every
campaign status, on every entry point — that:

- is **consistently centred** with a scrollable body (no top-pinned drift);
- shows a compact **campaign header**: small cover + title + status chip + a
  **status-aware** one-line context (when/where/outcome);
- keeps the **participants list primary**, supporting actions secondary;
- reuses existing data helpers — no new fetches, no new backend work.

## Non-goals

- No change to join/leave/vote API logic — `ParticipantsPanel`, `useRoleSupport`,
  `useEventJoin`, and `eventJoinPhase()` gating stay as they are.
- No formal leader-nomination changes. "Be the coordinator" (the `WANT_TO_LEAD`
  vote) stays available on OPEN — it is a valid OPEN-stage vote, distinct from the
  detail page's formal `LeaderNominationPanel` (which the doc's matrix refers to).
- No detail-page redesign. This is the modal only.

---

## Lifecycle alignment (verified against the doc)

Join/roster gating already matches the doc and is **unchanged**:

| Status | Doc (roster / join) | Code (`eventJoinPhase` / `useRoleSupport`) | Aligned |
|---|---|---|:--:|
| OPEN | vote · all roles | `joinableRoles = null` + interested + lead | ✓ |
| DRAFT | join · all roles | `roleScope = null` | ✓ |
| SCHEDULED / ACTIVE | join · WORKER | `roleScope = ["WORKER"]` | ✓ |
| COMPLETED | no join | `phase = contributed`, `roleScope = []` | ✓ |
| CANCELLED / PAUSED | no join | `roleScope = []`, `joinable = false` | ✓ |

The gaps this design closes are the **header/context** rows the modals never
rendered (cover, title, status, schedule, meetup, recap).

---

## Component API

New file `src/components/CampaignParticipationModal.js` (rename of
`SupportRolesModal.js`); component `CampaignParticipationModal`. Purely
presentational — owns chrome + the "I'm interested" pending state only.

```js
CampaignParticipationModal({
  open, onClose, language = "np",
  campaign,            // normalized header (below) — may be partial pre-load
  panelProps,          // the exact object spread into <ParticipantsPanel>
  onInterested,        // OPEN only; omit elsewhere → the interested block hides
})
```

`campaign` (normalized header):

```js
{
  title,               // localized, via localizeIssue()
  coverUrl,            // via getIssueCoverImageUrl(); modal renders a
                       // representative fallback when null (staging rule)
  status,              // technical key: open|draft|scheduled|active|completed|cancelled|paused
  statusLabel,         // localized status chip text
  location,            // addressText / issue location, or null
  scheduledAt,         // ISO, or null
  durationMinutes,     // number, or null
  result,              // { summary, attendeeCount } for COMPLETED, or null
}
```

### Header layout

```
┌──────────────────────────────────────────────┐
│ ▓▓cover▓▓  {title}                       [×] │  small cover (thin strip) + title
│            ● {statusLabel} · {location}      │  status chip + location
├──────────────────────────────────────────────┤
│ {status-aware context line}                  │  see table below
├──────────────────────────────────────────────┤
│ ♡  मलाई रुचि छ           (OPEN only)          │  interested shortcut
│ ───────── वा भूमिकामा जोडिने ─────────         │
│ [ <ParticipantsPanel embedded> ]   ↕ scroll  │  PRIMARY
└──────────────────────────────────────────────┘
```

The cover is a **thin strip** (height ≈ 64–80px, full modal width, or a small
left thumbnail), never a large hero — primacy stays with the participants list.

### Status-aware context line

To avoid duplicating the progress bar (the panel already shows
conversion/fill progress next to its "Participants" heading), the header's
secondary line carries **context, not progress**:

| Status | Context line |
|---|---|
| OPEN | location (progress stays in the panel) |
| DRAFT | location + a short "planning" hint |
| SCHEDULED / ACTIVE | 📅 date · ⏱ duration · 📍 meetup location |
| COMPLETED | result summary + attendee count |
| CANCELLED / PAUSED | status reason, read-only |

### Positioning fix

`<Modal centered styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }} />`
(keep the header/title fixed above the scroll area where practical). Applied once
in the unified modal → every status is centred with a scrollable role list.

---

## Data flow

Each hook exposes a normalized `campaignHeader` alongside `panelProps`, so the
modal stays presentational and call sites don't duplicate resolution:

- **`useRoleSupport`** (OPEN / promoted issue): builds `campaignHeader` from its
  `issue` snapshot — `getIssueCoverImageUrl(issue)`, `localizeIssue(issue)`,
  `issue.status`, location, conversion. Already fetches `/issues/{id}`.
- **`useEventJoin`** (events): builds `campaignHeader` from `eventData`
  (+ the `seed` prop for instant pre-load paint). `getIssueCoverImageUrl()`
  already resolves event-shaped objects (see `EventMap.js`, `eventsApi.js`).

Buttons pass `campaign={hook.campaignHeader}`. Because cover + title come from
the `seed`/`issue` the call site already holds, the header paints **immediately**
on open; the roster fills in lazily as today.

## Call-site changes (the 3→1 consolidation)

1. Rename `SupportRolesModal.js` → `CampaignParticipationModal.js`; rename the
   component and all imports.
2. `EventJoinButton` and `IssueJoinButton`: delete their inline `<Modal>` +
   `<ParticipantsPanel>` blocks; render `<CampaignParticipationModal>` instead,
   feeding `campaign` + `panelProps` from their hook.
3. `useRoleSupport` / `useEventJoin`: add `campaignHeader` to their return.
4. Unify titles into status-aware copy inside the modal (one source of truth) so
   "How do you want to support?" / "Join this campaign" / "Which role would you
   take?" no longer diverge per shell.
5. CSS: keep `.support-roles-modal` rules (or rename the class to
   `.campaign-participation-modal`) + add header strip styles.

## Verification

Per the project rule, drive the real browser (Playwright) before "done":
open the modal at **OPEN, DRAFT, SCHEDULED, ACTIVE, COMPLETED** from
`/campaigns` and assert (a) the modal is vertically centred, (b) cover + title +
status chip render, (c) the status-aware context line matches the table, (d) the
correct join/role controls show per the lifecycle gating above.

## Open items

- COMPLETED recap fields (`event.resultSummary / attendeeCount`) — confirm
  availability when wiring that status's context line (already flagged in the
  lifecycle doc as the one field to confirm with Pranish).
