# Campaign Action Button — Design

> Date: 2026-06-29 · Status: design approved, pending spec review.
> Companion to the unified [CampaignParticipationModal](2026-06-29-campaign-participation-modal-design.md):
> one button component for the support/join/participation action across every
> page and lifecycle status, all triggering that one modal.

---

## Problem

The button that opens the participation modal is built **three different ways**,
so the same action looks different on different pages and at different sizes:

- [`IssueVoteButton`](../../../src/components/IssueVoteButton.js) — AntD `Button` + `Popconfirm` + `Tooltip`; the committed ("voted") state is a **bland white default button**. OPEN issues, on cards / preview / detail.
- [`EventJoinButton`](../../../src/components/EventJoinButton.js) — a raw `<button>` with **inline styles** + `.event-join-btn` CSS. Events, on the preview pane.
- [`IssueJoinButton`](../../../src/components/IssueJoinButton.js) — AntD `Button` (primary / disabled). Promoted issues, on preview / detail.

CSS is scattered across `home.css` (`.public-issue-card-support`,
`.issue-topline-support-btn`) and `event-roster.css` (`.event-join-btn`), keyed
per page and size. Result: inconsistent styling page-to-page, wrong sizes in the
preview (LIVE/SCHEDULED "Join now" renders small), and the rejected white
committed buttons ("✓ Supported" / "✓ Leading").

Committed labels also live in three vocabularies: `Supported / Joining / Leading`
(vote side) · `Joined as {role}` (event side) · `Contributed as {role}`
(promoted).

## Goal

One presentational **`CampaignActionButton`** — the single participation CTA for
every page and status — fed by the three existing trigger wrappers (each keeps
its own hook wiring). Every instance:

- shares one visual design language and **one size system** (no per-page drift);
- is **solid and confident** when acting, a **tinted role-aware chip** (never
  white) when committed;
- **opens the unified modal** — act *and* committed; no inline page Popconfirm.

## Non-goals

- No change to participation data/logic — `useRoleSupport`, `useEventJoin`,
  `eventJoinPhase()`, and the modal stay as they are.
- The modal's per-role **dashed open-pills stay dashed** (`X open` / Join). That
  dashed style means "an open slot you can fill" — correct for the many in-modal
  role rows. The page CTA is the single primary action, so it is **solid**
  (hierarchy: one hero action solid, many slots dashed). They remain one family
  via shared shape / radius / color tokens / icon grammar.
- No new backend work.

---

## Decisions (locked)

1. **Committed button opens the modal** (single responsibility). Viewing the role
   and withdrawing both live in the modal's roster (which already has the
   withdraw toggle). The on-page `Popconfirm` is removed.
2. **Act CTA = solid + sheen + lift.** Solid fill in the action colour, a subtle
   top-sheen gradient, a soft colour-matched shadow, and a hover-lift / press
   micro-interaction.
3. **Dashed stays in the modal only**; the page CTA is solid.

---

## Component API

New file `src/components/CampaignActionButton.js` — purely presentational
(no hooks, no API). Renders a `<button>` (or read-only `<span>`).

```js
CampaignActionButton({
  mode,        // "act" | "committed" | "readonly" | "disabled"
  label,       // visible text (caller supplies the right copy)
  accent,      // "primary" | "live"  — act mode only (teal vs red)
  roleColor,   // committed-tint hue (CSS colour); default var(--primary),
               // gold (#b7791f) for the coordinator/leader
  icon,        // leading ReactNode (status/role icon)
  size = "lg", // "sm" (cards/preview) | "lg" (detail topline)
  count,       // optional trailing tally (kept for card vote counts); omit to hide
  loading,     // spinner + disabled
  block,       // full-width (mobile / card footer)
  onClick,     // open the modal (act + committed); omitted for readonly/disabled
  ariaLabel,
  language = "np",
})
```

### Visual spec by mode

| Mode | Fill | Text / icon | Border | Interaction |
|---|---|---|---|---|
| **act** | solid `var(--primary)` (accent `live` → `var(--state-live)`) | white | none | sheen overlay (white 12%→0), soft shadow `0 4px 14px color-mix(accent 35%, transparent)`; hover `translateY(-1px)` + deeper shadow; active `translateY(0)`. `live` adds a slow pulse ring. |
| **committed** | tint `color-mix(var(--role-color) 14%, var(--surface))` | `var(--role-color)` + leading check | `1.5px solid color-mix(role 38%, transparent)` | hover deepens tint slightly; opens modal. |
| **readonly** | tint `color-mix(var(--muted) 12%, surface)` | `var(--muted)` + check | none | non-interactive (COMPLETED "योगदान गरियो"). |
| **disabled** | `var(--surface-2)` | `var(--muted)` | none | non-interactive (Cancelled). |

- **Radius** 10px, **font-weight** 600, inline-flex, icon gap 6–8px — identical
  across modes and sizes so all states read as one family.
- **Sizes:** `sm` = padding 6px 14px / font 13px (cards, preview panes);
  `lg` = padding 10px 22px / font 15px (detail topline). Only scale differs.
- **Dark mode:** tints derive from `--surface`; solid uses the same tokens.
  No separate dark rules beyond what the tokens give.

### Why solid (not the modal's dashed)

The dashed pill is the modal's *per-role open-slot* language (many, secondary,
"fill me"). The page CTA is the *one primary action*. Primary = solid,
secondary/slot = dashed is correct hierarchy; a dashed primary borrows a
secondary convention and reads understated (the same weakness as the rejected
white outline buttons). Consistency comes from the shared design language, not
from making the hero action dashed.

---

## Wrapper → button mapping

The three wrappers compute `mode` + `label` + `accent` + `roleColor` from their
hook and render `<CampaignActionButton onClick={openModal}>` + the modal.

**`IssueVoteButton`** (OPEN, via `useRoleSupport`):
- not voted → `act`, accent `primary`, label `समर्थन गर्ने` / `Support`.
- voted → `committed`; label by `voterRole` (reuse `doneLabels`, normalized to a
  committed tone): INTERESTED → `समर्थन गरियो` / Supported · GOING → `जोडिनुभयो`
  / Joined · WANT_TO_LEAD → `नेतृत्वमा` / Leading. `roleColor` = gold for
  WANT_TO_LEAD, else `--primary`.
- Removes the `Popconfirm` + `Tooltip` wrapper; click always opens the modal.
- Keeps the optional `count` (card vote tally) via the `count` prop.

**`EventJoinButton`** (events, via `useEventJoin`):
- joinable & no viewerRole → `act`; accent `live` when `status === "active"` else
  `primary`; label `अहिले जोडिने` (live) / `सामेल हुने` (else).
- viewerRole → `committed`; label `{role}का रूपमा` / `Joined as {role}` (leader →
  `नेतृत्वमा` / Leading); `roleColor` = role colour (gold for coordinator).
- not joinable & no viewerRole → render nothing (unchanged).

**`IssueJoinButton`** (promoted issue, via `useEventJoin`):
- phase `join` → `act` (accent per the event status as above).
- phase `contributed` → `readonly`, label `योगदान: {role}` / `Contributed as {role}`.
- phase `cancelled` → `disabled`, label `रद्द भयो` / Cancelled.
- no resolved event → `act` that fires the existing "almost ready" info toast
  (unchanged behaviour).

All committed/act instances call the hook's `openModal`; readonly/disabled do not.

---

## CSS + cleanup

- Add one `.campaign-action-btn` block (+ `--act` / `--committed` / `--readonly`
  / `--disabled` modifiers, `data-accent`, `data-size`) in
  `src/styles/event-roster.css`, beside the modal/participation styles (one
  participation family in one place).
- Remove the superseded rules once no longer referenced: `.event-join-btn*`
  (event-roster.css), `.public-issue-card-support*` and
  `.issue-topline-support-btn*` (home.css). Grep first; only delete selectors
  with no remaining consumers.

## Verification

Drive the real browser (per the project rule) and screenshot the CTA in **both
places** (campaigns preview pane + campaign detail topline) at **OPEN, DRAFT,
SCHEDULED, ACTIVE**, plus a **committed** state (logged-in), asserting:
(a) identical design across both pages, (b) one size system (no small/large
mismatch), (c) act = solid teal / red-for-LIVE with hover-lift, (d) committed =
tinted role chip (never white) that opens the modal, (e) every instance opens the
one unified modal.
