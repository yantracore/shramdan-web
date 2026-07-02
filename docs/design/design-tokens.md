# Design Tokens

> The atomic vocabulary of the visual layer — shadows, glass, motion timing, radii, z-layers.
>
> Implementation: [`../../src/styles/design-tokens.css`](../../src/styles/design-tokens.css)

---

## Principle — *pleasing to use*

श्रमदान optimizes for **pleasant**, not "efficient" or "minimal." Every motion is soft, every shadow is gentle, every radius rounds without being aggressive. The visual layer should feel like a breath in, not a stab forward.

This commitment shapes every token below.

---

## Depth — `--shadow-1` / `--shadow-2` / `--shadow-3` / `--shadow-hero`

Three resting levels plus one hero-scale shadow.

| Token | Where to use | Visual feel |
|---|---|---|
| `--shadow-1` | Resting cards, list rows | "Sitting on the page" |
| `--shadow-2` | Cards on hover, raised panels | "Lifted just a bit" |
| `--shadow-3` | Modals, dropdowns, floating chrome | "Detached, hovering" |
| `--shadow-hero` | Hero panels, big landing visuals | "Almost ambient" |

**Rules:**
- Never `box-shadow: 0 0 10px black` or similar hard-shadow. Our shadows are tinted (`rgba(23, 33, 28, ...)`) so they harmonize with the brand greens.
- Theme-aware: dark mode shadows use `rgba(0, 0, 0, ...)` because the surface is already dark.
- Compose with elevation: a card going from rest → hover should increment by one level (`shadow-1` → `shadow-2`), not jump.

---

## Glass — `--glass-bg` / `--glass-border` / `--glass-blur` / `--glass-saturate`

Apply via the `.glass-panel` utility class.

```css
.glass-panel {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2);
}
```

**Rules:**
- **Chrome only.** Use for nav, side rails, hero panels — never for content blocks. Glass on glass becomes a fog. Glass over patterned/photographic background is where it shines.
- **One layer at a time.** Two glass-panels stacked = visual noise.
- **Dark mode auto-adjusts.** Token re-declared in `[data-theme="dark"]` selector.

---

## Radii — `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-xl` / `--radius-pill`

| Token | Pixel | Use |
|---|---|---|
| `--radius-sm` | 6px | Inputs, chips |
| `--radius-md` | 10px | Cards, list rows |
| `--radius-lg` | 16px | Panels, hero containers |
| `--radius-xl` | 24px | Modals, big sheets |
| `--radius-pill` | 999px | Tag badges, segmented controls |

**Rule:** never mix two adjacent radii on the same element. A card uses one radius for the outer shape; inner buttons can use one step smaller, not larger.

---

## Motion — `--ease-out-soft` / `--duration-*` / `--stagger-default`

**One easing curve for the entire app:** `cubic-bezier(0.16, 1, 0.3, 1)`.

This is an ease-out-expo with no overshoot. Soft entry, soft exit, predictable. Animations should feel like *breath*, not *bounce*.

| Token | Value | When |
|---|---|---|
| `--duration-fast` | 150ms | Press, hover, focus — micro-interactions |
| `--duration-base` | 250ms | Card transitions, shadow elevation |
| `--duration-slow` | 450ms | Entrance reveals, page transitions |
| `--stagger-default` | 60ms | Children stagger interval (lists, grids) |

**Rules:**
- One curve, period. No `ease-in-out`, no spring physics, no custom bezier per component. The whole app uses `--ease-out-soft`.
- Children that stagger use `--stagger-default` unless the design intent is *deliberately faster* (rare).
- Hard interactions (press) use `--duration-fast`. Decorative animations use `--duration-base` or `--duration-slow`.

This grammar is enforced in `src/lib/motion.js` for Framer Motion variants — same curve, same durations.

---

## Z-layers — `--z-*`

A small registry so layers compose predictably.

| Token | Value | Use |
|---|---|---|
| `--z-base` | 1 | Default content stacking |
| `--z-elevated` | 10 | Resting raised elements (sticky cards in lists) |
| `--z-sticky` | 100 | Sticky headers, sticky filter bars |
| `--z-overlay` | 1000 | Backdrops behind modals |
| `--z-modal` | 1100 | Modal dialogs |
| `--z-toast` | 1200 | Toast notifications (top of stack) |

**Rule:** never hardcode `z-index: 9999`. If you need a layer above modals, the answer is "use the next token in the registry" — or add a new token here with a comment.

---

## Utility classes provided

- `.glass-panel` — see Glass above
- `.pressable` — adds the scale-on-press feel to any clickable element; honors `prefers-reduced-motion`

The AntD button transition timing is globally overridden to use `--ease-out-soft`, and gains a subtle `scale(0.98)` on `:active`. No need to add `.pressable` on AntD buttons explicitly.

---

## Future tokens (not yet declared)

When we add these, they go in `design-tokens.css` and get a section here:

- **Typography scale** — `--text-xs` through `--text-display`, plus line-height pairs. (Currently uses inline AntD Typography + clamp() — works but is not codified.)
- **Spacing scale** — 4px / 8px / 12px / 16px / ... rhythm. Currently ad-hoc.
- **Color tokens** — primary, accent, etc. live in globals.css today; should migrate here once we're sure the names are stable.

---

## Related

- [`../../src/styles/design-tokens.css`](../../src/styles/design-tokens.css) — implementation
- [`../../src/lib/motion.js`](../../src/lib/motion.js) — Framer Motion variants using the same timing grammar
- [`../public/philosophy.md`](../public/philosophy.md) — *pleasing to use* principle
- [`./05-design-language-guide.md`](./05-design-language-guide.md) — narrative-level design direction
