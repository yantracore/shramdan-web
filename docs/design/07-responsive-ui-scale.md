# 07 — Responsive UI Scale (the principle)

**Status:** active · **Owner:** frontend · **Applies to:** the public site + `/app`
(admin control center is EN-only and desktop-first, but should still consume
these tokens where practical).

## Why this exists

For a long time every section hardcoded its own font sizes, button padding and
spacing (`font-size: clamp(34px, 5vw, 56px)`, `padding: 8px 14px`, `12px`, …).
The result on phones: titles, eyebrows and buttons that were all *slightly
different* and mostly *too big*, because each one was tuned for desktop and only
squeezed down.

The fix is **one shared, fluid scale that every component consumes** via CSS
custom properties. Change a token once → the whole site scales identically.
Because the values are `clamp(min, preferred, max)`, **desktop stays where it
was and only the phone end shrinks** — so adopting a token is low-risk.

> Rule of thumb: **never write a raw `px`/`clamp()` font-size or button padding
> in a component.** Reach for a token below. If none fits, add a token here
> first, then use it.

## The tokens (defined in `src/styles/design-tokens.css`)

### Type
| Token | Mobile → Desktop | Use for |
| --- | --- | --- |
| `--text-eyebrow` | 11 → 13px | kickers / eyebrows (uppercase labels above a title) |
| `--text-title-sm` | 20 → 30px | **section & rail headings** (`h2`), card-group titles |
| `--text-title-lg` | 26 → 44px | **page / hero headings** (`h1`) |
| `--text-card-title` | 15 → 17px | card titles inside lists/rails |
| `--text-lead` | 15 → 17px | section intro paragraphs |
| `--text-xs … --text-hero` | see tokens | general body/label steps when the semantic ones don't fit |

### Buttons / pills
| Token | Mobile → Desktop | Notes |
| --- | --- | --- |
| `--btn-font` | 13 → 14px | label size for tertiary / view-all / pill buttons |
| `--btn-pad-y` | 8 → 10px | vertical padding |
| `--btn-pad-x` | 12 → 18px | horizontal padding |

Anything genuinely tappable (a primary CTA, a nav target) also gets
`min-height: var(--tap-min)` (44px). Compact utility/tertiary buttons may stay
below 44px because they are secondary and we deliberately want them small on
phones.

### Spacing / layout (already in tokens)
`--space-1…12` (4pt rhythm), `--space-section` / `--space-section-sm` /
`--space-section-y` (fluid vertical rhythm — tighter on phones), `--page-gutter`
(symmetric horizontal gutter), `--container-max`, `--tap-min`.

### Breakpoints (the canonical set — write media queries only against these)
`480 · 640 · 768 · 1024 · 1280 · 1536`. Navigation switches at **1024/1025**:
`<=1024` = bottom tab bar only (corners removed); `>=1025` = top pill + corners.
(CSS custom props can't be read inside an `@media` condition, so these live as
documentation + `--bp-*` vars for JS; the discipline is human-enforced.)

## Shared classes already wired to the scale

Changing these cascades to every page that reuses them (which is most of them):

- `.eyebrow` → `--text-eyebrow`
- `.section-heading h1` → `--text-title-lg`, `.section-heading h2` → `--text-title-sm`
- `.tertiary-button` → `--btn-font` + `--btn-pad-*`
- `.discovery-strip-title` → `--text-title-sm`, `.discovery-strip-viewall` → button tokens

When you build or touch a section, prefer these classes. If you must introduce a
new heading/button class, point its `font-size`/`padding` at the tokens above
rather than a fresh literal.

## Rail / carousel edge-bleed (mobile)

Horizontal card strips (`.discovery-strip-*`) should, on phones, let the
scrolling row **bleed to the screen edges** with the gradient fade sitting *at*
those edges — while the strip's header (eyebrow / title / view-all) keeps a
normal side gutter so text never touches the edge. This reads as "there's more
to swipe" instead of a boxed-in row. (Implementation lives in
`discovery-strip.css`; the header gutter and track edge treatment are tuned
there.)

## Adoption plan

1. **Foundation** — tokens defined here. ✅
2. **Shared classes** — retrofit the handful of cross-cutting classes above so
   the bulk of the site inherits the scale in one shot. ✅ (ongoing)
3. **Outliers** — grep for surviving hardcoded large `font-size:`/`padding:` in
   per-section headers/eyebrows and repoint them at tokens, section by section,
   as those areas are touched.
4. **New work** — always consume the tokens; add a token before a literal.
