# Participant Roster Row — Interaction + Core Highlight Design

> Date: 2026-06-30 · Status: design approved, pending spec review.
> All changes live in the ONE shared roster component
> [`ParticipantsPanel`](../../../src/components/ParticipantsPanel.js), so they
> apply identically in the modal ([CampaignParticipationModal](../../../src/components/CampaignParticipationModal.js))
> and in every detail body ([CampaignDetailView](../../../src/components/CampaignDetailView.js),
> legacy issue/event pages).

---

## Context (already unified)

`ParticipantsPanel` is the single roster component everywhere — there is **no
separate "EventRosterPanel"** (those are only `event-roster-*` CSS class names).
The role rows are produced by one `renderRoleRow` / `renderLeaderRow`, so they
already look and behave the same in the modal and the body. The only modal-vs-
body differences are contextual chrome driven by props (`embedded` drops the
intro line; the body passes `progress={null}` and shows conversion in its
topline). Per the approved scope, **that chrome stays contextual** — we change
only the role items, which keeps them byte-identical across both surfaces.

## Goals

1. **Whole role row is clickable to join** — not just the inner pill. Pointer
   cursor + hover affordance. The Join pill stays as a visual cue.
2. **Core roles (Cleaner + Coordinator) are visually highlighted** as the
   priority roles to fill.

## Non-goals

- No API/data changes (`handleJoin` / `handleLead` / `onJoin` / `onLead` /
  `onLeave` unchanged).
- No change to the modal/body chrome (intro line, progress placement).
- The "additional" roles stay quiet (soft wash) — only core is lifted.

---

## Change 1 — whole row clickable

A role row is **joinable** when it currently renders the open/Join pill
(`canJoinThis && !isFullTargetRow`, i.e. the viewer is not committed and the
role isn't full). The leader row is **joinable** when `leaderSlot.canLead`.

For a joinable row, the row container itself becomes the click target:

- `<li>` gets `onClick` → `handleJoin(role)` (role rows) / `handleLead()` (leader).
- `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space → same handler.
- `aria-label` = the join label (e.g. "जोडिने — सफाइकर्मी" / "संयोजक बन्छु").
- class `is-clickable`; `cursor: pointer`; hover/focus = subtle lift + border
  emphasis; `aria-busy` + non-interactive while that role's join is pending.

To avoid an invalid nested-interactive (button-in-button), the inner pill is
demoted from `<button>` to a decorative `<span>` (same `event-roster-open-pill`
look) for joinable rows — the row owns the click now. The pill remains visible
as the affordance the user asked to keep.

**Rows that are NOT whole-row clickable** (unchanged):
- The viewer's **own** role row — keeps its `participants-joined-toggle` /
  lead toggle (Popconfirm withdraw). Making the whole row leave-on-click risks
  accidental withdrawal.
- **Full** rows (`event-roster-full-pill`) and a **read-only** leader
  ("led by X" / "Coordinator open") — nothing to join, so not interactive.

Keyboard + SR: each joinable row is a single focusable `button`-role element
with a clear `aria-label`; the decorative pill is `aria-hidden`.

## Change 2 — core role highlight

The core group (`participants-group--core`: the Cleaner full-width row + the
Coordinator/leader row) gets a **role-tinted card** treatment so it out-weighs
the quiet "additional" group:

- background `color-mix(var(--role-color) 8%, var(--surface))`
- `1.5px solid color-mix(var(--role-color) 38%, var(--line))`
- Cleaner → green (`ROLE_COLORS.WORKER`), Coordinator → gold (`LEAD_COLOR`).

`--role-color` must be present on the row `<li>` for the tint to resolve. The
leader row already sets it; `renderRoleRow` will set `style={{ "--role-color":
roleColor }}` on its `<li>` too.

Interaction with existing row states (CSS specificity / scoping):
- The own-role green wash wins — the core tint is scoped
  `.participants-group--core .event-roster-row:not(.is-own-role)`.
- The additional group's soft wash is unchanged (it doesn't use `--role-color`).
- The existing `.participants-leader-row` gold rules become redundant but
  harmless; the unified core rule produces the same gold via `--role-color`.

Hover lift applies to any `.is-clickable` row (core or additional); core just
starts from a stronger resting state.

---

## Files

- Modify: `src/components/ParticipantsPanel.js`
  - `renderRoleRow`: add `--role-color` to the `<li>`; when joinable, make the
    `<li>` a `role="button"` click/keydown target with `is-clickable`; demote
    the open pill to a `<span>`.
  - `renderLeaderRow`: when `canLead`, make the `<li>` the click/keydown target;
    demote the "be coordinator" CTA to a `<span>`.
- Modify: `src/styles/event-roster.css`
  - `.event-roster-row.is-clickable` (cursor + hover lift + focus ring).
  - `.participants-group--core .event-roster-row:not(.is-own-role)` (role-tint
    card + border), reading `--role-color`.
  - Pill-as-span: ensure `.event-roster-open-pill` renders correctly as a span
    (drop reliance on `:disabled`; row owns disabled/pending).

No other files change — the single component propagates to modal + all bodies.

## Verification

Drive the browser at OPEN (modal + `/campaign` body) and a DRAFT/SCHEDULED
event (modal + body), asserting:
1. Clicking anywhere on a joinable role row joins that role (and on the leader
   row, offers to lead) — verified by the roster updating + the CTA → committed.
2. Joinable rows show pointer cursor + hover lift; the Join pill is still
   visible; Enter/Space on a focused row joins.
3. Core rows (Cleaner + Coordinator) read as highlighted role-tinted cards;
   additional rows stay quiet; the viewer's own row still shows the green
   "joined" toggle (not the core tint), and withdraw still works.
4. The roster looks identical in the modal and the body (same role-item design).
Clean up any test joins via the withdraw toggle.
