# 08 · Mobile-first responsive sweep

**Status:** active · started 2026-07-01 with `/campaigns` as the first surface.
**Why:** listing pages were authored desktop-first (big px values, then crushed with
`max-width` overrides). On phones that reads as "squeezed from a bigger screen" —
overflowing rows, oversized controls, one giant thumbnail per screen. This doc is
the reusable recipe book so every remaining page gets the SAME treatment without
re-deriving it. Read it before touching any page in the sweep.

Companion docs: [06-state-color-system](./06-state-color-system.md),
[07-responsive-ui-scale](./07-responsive-ui-scale.md). Tokens live in
`src/styles/design-tokens.css` + `src/app/globals.css`.

---

## 0 · The one principle

**Author base styles for the phone; scale UP with `min-width`.** Never write a
desktop value and shrink it with `max-width`. The base (no media query) rule is
the mobile rule. Add `@media (min-width: …)` to *grow* spacing/type/columns on
bigger screens.

Everything compact-by-default: heights, paddings, gaps, image sizes, type. Consume
the existing tokens (`--space-*`, `--text-*`, component-scale vars, `--tap-min`,
`--page-gutter`) instead of ad-hoc px.

**Exception — a page whose desktop is already finalized.** Some surfaces (e.g.
`/campaigns`, done desktop-first) must stay byte-identical on large screens. There,
do the reverse: leave the desktop rules alone and add **`@media (max-width: 720px)`
overrides only**. Crucially, do NOT swap a component or restructure the JSX to get
the mobile look — that renders on every width and silently changes desktop. Restyle
the *existing* markup inside the mobile query instead (see §3.6). Screenshot desktop
before/after to prove it didn't move.

## 1 · The geometry law (why filters "break")

At ~360px you cannot show N word-labels + N counts on one row. Every good app
*spends* that shortage deliberately — one of:

- give up "one row" → wrap (usually the worst: looks unfinished)
- give up "no scroll" → horizontal scroller **done right** (see §3)
- give up "full labels" → abbreviate / iconify
- give up "all-visible-at-once" → dropdown / sheet

Pick the trade **on purpose** and make it read as intentional. A truncated
mid-word label + a hard edge-fade reads as *broken*; a peeking next chip reads as
*swipe*. Same scroll, opposite perception.

## 2 · Heading band

Phone (≤640px): **eyebrow + compact title only.** Drop long marketing intro
paragraphs — a 2-line clamp mid-sentence looks broken. Bring the intro back at
`min-width: 641px`. Keep the heading `gap` tight (`4px`).

## 3 · Horizontal chip scroller — done right  ⭐ (the `/campaigns` status filter)

The industry-default filter row (YouTube / Gmail / Play Store / Maps). It only
looks broken when built wrong. Rules that make it read as intentional:

1. **Atomic chips** — `flex: 0 0 auto; white-space: nowrap`. A chip is never cut
   mid-word.
2. **Full-bleed peek** — the row bleeds to the true screen edge so the *next* chip
   peeks ~24px. On our pages the mobile gutter is exactly 16px
   (`.page-section { width: min(1180px, calc(100% - 32px)) }`), so:
   ```css
   .chip-scroller { margin-inline: -16px; padding-inline: 16px; }
   ```
3. **No fade mask.** Delete `mask-image` edge-fades — the peek is the affordance.
4. **Hidden scrollbar + snap:** `overflow-x:auto; scrollbar-width:none;
   scroll-snap-type:x proximity;` chips `scroll-snap-align:start`.
5. **Compact height** ~38px; active chip = its lifecycle-colour fill (see doc 06),
   the neutral "All" = `--primary`. Count badge stays on every chip.
6. **Restyle, don't replace (preserve finalized desktop).** On `/campaigns` the
   filter is an AntD `<Segmented>` that desktop already ships. Swapping it for
   custom buttons changed desktop too — wrong. Instead, inside
   `@media (max-width: 720px)` only: make the `.ant-segmented` track transparent,
   `display:none` the `.ant-segmented-thumb`, give each `.ant-segmented-item` a
   chip border + radius + gap, and colour the `.ant-segmented-item-selected`
   directly (per-status via `:has(.campaign-chip[data-status="…"])`). Same peek +
   discrete-chip + lifecycle-fill look on phones; desktop untouched. If you build
   a NET-NEW page, real buttons (`role="group"` + `aria-pressed`) are cleaner.

## 4 · Compact cards (2-col grid)

"Compact" means **reduce everything**, not just width:

- Grid: `grid-template-columns: 1fr 1fr` on phone; gap `10px`.
- Image: fixed hero height → `~100px` (was 168px). Shorter aspect.
- Body: padding `8–9px`, inner gap `5–6px`, title `12.5–13px` (2-line clamp),
  meta `10.5px`.
- Footer (consistent across every status): **left** = a small people icon + just
  the number (drop the avatar stack AND the "supporters/participants" word — a full
  phrase is noise on a thumbnail); **right** = the CTA for *every* status, but
  **icon-only** so it always fits beside the count on a ~170px card (keep the label
  as `sr-only`, not `display:none`, so it stays accessible). Full-word CTA labels do
  NOT fit at this width — that's the flaw to design around, not truncate. Split the
  count into `num` + `word` spans in JSX (hide the word on phones) rather than
  restructuring the footer wrappers, so desktop stays byte-identical.
- Horizontal list cards: shrink the thumb (`~110px`) + padding on phone so the
  list view is dense too.

## 5 · Single search pill

One clean pill: `[🔍  input  ⚙filters]`. **No separate submit button** (Enter +
debounced type-ahead already search). **No inline "＋ New" CTA on phone** — the
bottom-nav "New" tab already covers it; a duplicate just bloats the row. Compact
height (~46–48px). The ⚙ button toggles the advanced filter panel.

## 6 · Compact segmented (view / mode toggles)

Icon-first, ~34px tall on phone, icon-only when space is tight, right-aligned on
its own thin row. It must never out-weigh the primary filter next to it.

## 7 · Tap + rhythm

Anything tappable ≥ `--tap-min` (44px) hit area even if the visual is smaller.
Section vertical rhythm from `--space-section-sm`; horizontal gutter always
`--page-gutter` (never a one-sided margin → that caused the clipped right edge).

---

## Per-page checklist

For each page: heading (§2) · primary filter (§3) · cards (§4) · search (§5) ·
toggles (§6) · tap/rhythm (§7) · **verify in a real browser at 360 & 390px before
"done"** (lint / HTTP-200 is not enough).

| Page | Status |
| --- | --- |
| `/campaigns` (+ `/campaigns/<stage>`) | **in progress** — first application of this doc |
| `/issues`, `/events` | pending — share `.public-search-*`, `.event-list-card`, `.campaign-card`, `.section-heading`; partly improved for free by the campaigns work, but audit each |
| `/me` + `/me/*` | pending |
| `/event-types`, `/resources`, `/learn` | pending |
| detail pages (`/issues/[id]`, `/events/[id]`) | pending |
| home `/` | mostly done earlier; re-audit against this doc |

## Shared-class caution

`/campaigns` reuses classes owned across listing pages (`.public-search-bar`,
`.public-issues-*`, public-issues `.section-heading`, `.campaign-card`,
`.event-list-card`). Editing them here **also moves /issues + /events** — desired
for the sweep, but screenshot those two after each shared-class change.
