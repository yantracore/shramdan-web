# "Full" CTA state + eager preview roster — Design

> Date: 2026-06-30 · Status: design approved, pending spec review.
> When a campaign's joinable roles are all filled, the participation CTA must
> read **"Full"** (not a misleading "Join"), on the `/campaigns` preview and the
> `/campaign/<slug>` detail, across every status.

---

## Root cause

The CTA's act/committed state is decided only by `eventJoinPhase().joinable` +
`viewerRole`, never by whether any slot is actually open. Worse, the **preview**
button (`EventPreviewPane` → `EventJoinButton`) is **lazy** (`useEventJoin`
without `eager`), so before the modal opens it knows neither the roster nor the
viewer's participation. Result on the preview:

- All roles full → it still shows "Join now"; opening the modal → nothing
  joinable (the reported dead-end).
- The viewer is already committed → it still shows "Join now" (verified live: a
  Photographer-committed viewer sees "अहिले जोडिने" on the bagmati preview, while
  the detail page — which is eager — correctly shows the committed chip).

The detail page is correct because `CampaignDetailView` drives an eager
`useEventJoin`. The preview is wrong because its button is lazy.

## Goals

1. A **"Full"** CTA state when the campaign is joinable-by-phase but has no open
   slot for the viewer. Label: NP `सबै भरियो`, EN `Full` (reuses the roster's
   `compactFull` vocabulary). Clicking it **opens the modal (view-only roster)**.
2. The **preview** CTA reflects reality — eager-load its roster so it shows
   committed / Full / Join correctly without opening the modal first.
3. Works on **preview + detail**, across **DRAFT / SCHEDULED / ACTIVE**
   (COMPLETED/CANCELLED already have no Join; OPEN roles are unlimited → never
   Full).

## Non-goals

- No API changes. No change to OPEN (`useRoleSupport`) — issue votes are
  unlimited, never "Full".
- Grid cards (`PublicIssueCard`) stay lazy (no eager fetch per card); only the
  single-at-a-time preview panes eager-load.

---

## Part A — `useEventJoin` exposes `hasOpenSlot`

Compute from the already-built `participantRoles` + `participantJoinableRoles`
(the phase's `roleScope`):

```js
const hasOpenSlot = participantRoles.some((r) => {
  const inScope =
    participantJoinableRoles === null ||
    (Array.isArray(participantJoinableRoles) && participantJoinableRoles.includes(r.role));
  if (!inScope) return false;
  const target = Number(r.target);
  if (!Number.isFinite(target) || target <= 0) return true; // no cap → open
  return (Number(r.count) || 0) < target;
});
```
Expose `hasOpenSlot` from the hook's return. (Leadership is read-only on events,
so it's not counted as an open slot — `participantRoles` already excludes it.)

## Part B — eager preview

`EventJoinButton` and `IssueJoinButton` gain an `eager` prop (default `false`,
forwarded into `useEventJoin`'s `eager`). The preview panes pass `eager`:

- `EventPreviewPane` → `<EventJoinButton … eager />`
- `IssuePreviewPane` → `<IssueJoinButton … eager />`

So the preview button loads the roster + the viewer's participation on mount and
shows the correct state. Grid cards and other callers omit `eager` (stay lazy).
`CampaignDetailView` already passes a controlled, eager `join`, so it's covered.

`EventJoinButton` currently has no `eager` at all; add the prop and thread it:
`useEventJoin(eventId, { seed, language: lang, eager })`.

## Part C — the "Full" CTA mode

`CampaignActionButton` gains a `mode="full"`:

- **Interactive** (it's a `<button>` that opens the modal) — so `interactive`
  includes `"full"` alongside `act`/`committed`.
- Muted/neutral styling (not the solid action colour, not a role tint): a quiet
  "no spots left" chip. It does **not** force the check icon (that stays for
  `committed`/`readonly`).
- CSS `.campaign-action-btn--full`: `color: var(--muted)`, background
  `color-mix(var(--muted) 12%, var(--surface))`, `1px solid var(--line)`, with a
  subtle hover deepen.

## Part D — wire the buttons

In both `EventJoinButton` and `IssueJoinButton`, the join-phase branch decides:

```text
viewerRole            → committed chip            (existing)
!viewerRole && !hasOpenSlot → mode="full", label "सबै भरियो"/"Full", onClick=openModal
!viewerRole && hasOpenSlot  → act CTA (Join / Join now)   (existing)
```

- `EventJoinButton`: still `return null` when `!joinable && !viewerRole`. When
  joinable, branch committed / full / act as above.
- `IssueJoinButton`: inside the existing join-phase return (after the no-event /
  cancelled / contributed branches), add the `full` case before `act`.
- "Full" passes `onClick={join.openModal}` so the view-only roster is reachable.

The "Full" label comes from the button copy: NP `सबै भरियो`, EN `Full`.

---

## Files

- `src/lib/useEventJoin.js` — compute + return `hasOpenSlot`.
- `src/components/CampaignActionButton.js` — `mode="full"` (interactive + muted).
- `src/components/EventJoinButton.js` — `eager` prop; `full` branch.
- `src/components/IssueJoinButton.js` — `eager` prop; `full` branch.
- `src/components/EventPreviewPane.js` — pass `eager` to `EventJoinButton`.
- `src/components/IssuePreviewPane.js` — pass `eager` to `IssueJoinButton`.
- `src/styles/event-roster.css` — `.campaign-action-btn--full`.

## Verification

In the browser, on a fully-filled ACTIVE/SCHEDULED campaign (e.g. bagmati, as a
non-committed viewer) and a fully-filled DRAFT:
1. The `/campaigns` **preview** CTA reads **"सबै भरियो / Full"** (not "Join now");
   clicking opens the modal showing the all-full roster (view-only).
2. The `/campaign` **detail** topline CTA matches.
3. A campaign with open slots still shows Join / Join now; a committed viewer
   shows the committed chip — on the preview too (eager fix).
4. COMPLETED/CANCELLED unchanged; OPEN still shows Support.
