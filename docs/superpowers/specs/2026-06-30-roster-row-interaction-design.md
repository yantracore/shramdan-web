# Participant Roster — True Unification + Row Interaction + Core Highlight

> Date: 2026-06-30 · Status: design approved ("do it"), pending implementation.
> Makes the roster **render identically** in the modal
> ([CampaignParticipationModal](../../../src/components/CampaignParticipationModal.js))
> and the detail body ([CampaignDetailView](../../../src/components/CampaignDetailView.js)),
> then adds the clickable-row + core-highlight changes — all in the shared
> [`ParticipantsPanel`](../../../src/components/ParticipantsPanel.js).

---

## Root cause: same component, different DATA

`ParticipantsPanel` is already the single roster component. But what feeds it
(`panelProps`) differs by surface, so it renders differently:

| Surface | Hook feeding the roster | Roster data |
|---|---|---|
| Detail **body** (`CampaignDetailView`) | `useRoleSupport` (issue) — **always** | issue `eventRoleCounts` (votes); sparse/empty once promoted |
| Join **modal** (`IssueJoinButton` / `EventJoinButton`) | `useEventJoin` (event) | the event's real roster — counts, filled chips, open/Full pills |

So on a promoted/ONGOING campaign the body shows a bare role list (no counts /
chips / pills) while the modal shows the rich event roster — **two different
rosters on the same page**. Separately, the "I'm interested" block lives in the
modal *wrapper*, not in the shared panel, so the OPEN body never shows it.

## Goals

1. **Body roster === modal roster** for every status (same data + same content).
2. The **"I'm interested"** affordance lives in the shared panel (both surfaces).
3. **Whole role row clickable** to join (pill kept as a cue).
4. **Core roles (Cleaner + Coordinator) highlighted** as the priority roles.

## Non-goals

- No API/endpoint changes. No change to join/leave/vote logic.
- "Additional" roles stay quiet (soft wash); only core is lifted.

---

## Part A — feed the body the same data as the modal

`CampaignDetailView` already owns `support = useRoleSupport(issueId, {eager})`
(for OPEN) and separately fetches `eventData` (only for schedule/meetup/recap).
It must also drive the **event roster** for promoted campaigns:

- Add `eventJoin = useEventJoin(eventId, { seed: eventData, language, eager })`
  where `eventId = support.resolvedEventId || getIssueEventId(rawIssue)` and
  `eager = Boolean(eventId) && campaignStatus !== "OPEN"`.
- `const isPromoted = campaignStatus !== "OPEN" && Boolean(eventId);`
- Feed the body panel from `rosterProps = isPromoted ? eventJoin.panelProps :
  support.panelProps` — drop the current `totalOverride` / `progress={null}`
  overrides (each hook's panelProps already carries the right total + progress).
- Pass that same `eventJoin` to the topline `IssueJoinButton` as a controlled
  `join` prop (mirroring how `support` is already shared with `IssueVoteButton`)
  so the topline modal and the body roster are one live-synced instance.
- Remove the body's separate topline `CompactConversionProgress` — the panel
  heading now shows progress in both surfaces (no duplicate).

`IssueJoinButton` gains an optional controlled `join` prop:
`const ownJoin = useEventJoin(...); const join = controlledJoin ?? ownJoin;`
(unconditional hook call, controlled value preferred — exactly the
`IssueVoteButton` `support` pattern).

For OPEN, the body keeps `support.panelProps` (already identical to the OPEN
modal, which is `IssueVoteButton`'s own `useRoleSupport`).

## Part B — "I'm interested" moves into ParticipantsPanel

The interested block (and its already-interested → withdraw toggle) moves from
`CampaignParticipationModal` into `ParticipantsPanel`, rendered at the top of the
panel body **when `onInterested` is provided**:

- `ParticipantsPanel` gains props `onInterested`, `interestedActive`,
  `onWithdraw`, plus the interested copy (moved from the modal's COPY) and the
  `interestedPending` / `withdrawPending` state + handlers.
- `CampaignParticipationModal` stops rendering its own interested block; it
  forwards `onInterested` / `interestedActive` / `onWithdraw` into the panel
  (via the spread panelProps or explicit props).
- `CampaignDetailView` passes `onInterested` (OPEN only) + `interestedActive`
  (`support.voted && support.voterRole === "INTERESTED"`) + `onWithdraw`
  (`support.retract`) to the body panel.

Result: the interested block appears identically in modal + body for OPEN, and
not at all for events (no `onInterested`).

## Part C — identical panel content (chrome)

`embedded` must control only **outer spacing** (top margin/padding/divider), not
content. The intro line and the heading+progress render in **both** surfaces:

- Stop gating the intro on `embedded` (`{embedded ? null : <p>{t.intro}</p>}` →
  always render the intro).
- Both surfaces show the heading "सहभागीहरू N" + the progress bar (Part A makes
  the body pass real `progress`).

## Part D — whole role row clickable (from the approved row-interaction design)

A role row is **joinable** when it renders the open/Join pill (`canJoinThis &&
!isFullTargetRow`); the leader row is joinable when `leaderSlot.canLead`.

- The joinable `<li>` becomes the click target: `onClick` → `handleJoin(role)` /
  `handleLead()`, `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space),
  `aria-label`, class `is-clickable`, `aria-busy`/non-interactive while pending.
- The inner pill is demoted from `<button>` to a decorative `<span>` (same
  `event-roster-open-pill` look) to avoid nested interactives — the row owns the
  click; the pill stays visible as the cue.
- **Not** whole-row clickable: the viewer's own role row (keeps the
  `participants-joined-toggle` / lead withdraw toggle), Full rows, and a
  read-only leader ("led by X" / "Coordinator open").

## Part E — core role highlight (from the approved design)

Core group rows (Cleaner full-width row + Coordinator/leader row) get a
role-tinted card:

- background `color-mix(var(--role-color) 8%, var(--surface))`,
  `1.5px solid color-mix(var(--role-color) 38%, var(--line))`.
- `renderRoleRow` sets `style={{ "--role-color": roleColor }}` on the `<li>` (the
  leader row already does). Cleaner → green, Coordinator → gold.
- Scoped `.participants-group--core .event-roster-row:not(.is-own-role)` so the
  own-role green wash still wins; additional rows (soft wash) unchanged.
- `.is-clickable` rows get pointer + hover lift + focus ring (core starts from a
  stronger resting state).

---

## Files

- `src/components/ParticipantsPanel.js` — interested block + state (Part B); row
  click target + pill→span (Part D); `--role-color` on `<li>` (Part E); intro
  always shown (Part C).
- `src/components/CampaignParticipationModal.js` — drop own interested block;
  forward interested props to the panel.
- `src/components/CampaignDetailView.js` — add `useEventJoin`; feed body from the
  status-correct `panelProps`; pass controlled `join` to `IssueJoinButton`;
  pass interested props; remove topline conversion duplicate + the
  `totalOverride`/`progress={null}` overrides.
- `src/components/IssueJoinButton.js` — accept optional controlled `join` prop.
- `src/styles/event-roster.css` — `.is-clickable` (cursor/hover/focus); core
  role-tint card; ensure the open pill renders as a `<span>`.

No other files — the single component propagates to the modal + every body.

## Verification

Drive the browser and assert the roster block is byte-identical in the modal and
the `/campaign/<slug>` body for:
1. **OPEN** (`drain-blockage-…`) — both show "I'm interested" + conversion
   progress + all roles with the same counts/pills; clicking a row joins; core
   highlighted.
2. **ONGOING/SCHEDULED** (`southern-shore-of-fewa-lake-…`) — body now shows the
   **event** roster (2/8 Cleaner, filled chips, "open"/"Full" pills, "Coordinated
   by …") identical to the modal; Cleaner-only join where gated; core highlighted.
3. Joining via the topline modal updates the body roster (shared instance); the
   own-role row keeps its withdraw toggle. Clean up test joins via withdraw.
