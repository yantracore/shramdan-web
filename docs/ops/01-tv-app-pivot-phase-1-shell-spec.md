# Phase 1 — Four-Corner TV Shell: Implementation Spec

> Buildable spec produced by the 2026-06-05 design workflow (3 design angles → 12 adversarial verifications → synthesis). Companion to [01-tv-app-pivot-plan.md](01-tv-app-pivot-plan.md) Phase 1.
>
> **Decision:** Hybrid Corner Shell with grafts from MINIMAL (`--corner-clear-zone` token, CSS-only pill visibility) and RADICAL (single `<header role="banner">` wrapper, FAB consolidation, `chromeMode` prop).

---

## Chosen approach

The current `.topbar` band is removed entirely. `SiteShell` renders a single `<header className="site-shell-banner" role="banner">` whose `display: contents` lets it be a landmark without a visual box. Four `<div className="site-shell-corner site-shell-corner--{tl|tr|bl|br}">` blocks are `position: fixed`. The pill nav lives inline inside the banner (no portal), CSS-only-shown at `min-width: 1180px`.

`--header-height` token drops to `0px` on desktop (`56px` on the `<= 1024px` collapsed bar). A new `--corner-clear-zone` token (`64px` universal) replaces every existing `--header-height` consumer that pins sticky elements.

## Layout (विवेक clarification baked in)

```
1440px desktop  (>= 1180px shows pill nav)
+------------------------------------------------------------------------+
|  +-----------+        .--------------------------.       +----------+ |
|  | LOGO      |       (  Home Events Issues       )       | EN  ⚙   | |
|  | shramdan  |        '--------------------------'       | bell  👤 | |
|  +-----------+         pill nav (4 items only)           +----------+ |
|     corner-tl             Feedback                          corner-tr |
|                                                                       |
|       +------------------------------------------------------+        |
|       |                                                      |        |
|       |               PAGE / "TV SCREEN" CONTENT             |        |
|       |               body owns the visual surface           |        |
|       |               — no header band                       |        |
|       |                                                      |        |
|       +------------------------------------------------------+        |
|                                                                       |
|  +-----------+                                          +----------+  |
|  | APPS GRID |                                          |   +      |  |
|  +-----------+                                          +----------+  |
|     corner-bl                                              corner-br  |
+------------------------------------------------------------------------+
```

**Corner contents (विवेक 2026-06-05 confirmation):**

| Corner | Anonymous | Authenticated |
| --- | --- | --- |
| **TL** | Brand logo + brand text linked to `/` | (same) |
| **TR** | `SettingsPopover` (lang + theme) + `UserIconDropdown` → `{Login, Join}` only | `SettingsPopover` + `NotificationsBell` + `Avatar` Dropdown (existing authed menu: `/me`, `/settings`, logout, admin shortcut for admins) |
| **BL** | `AppstoreOutlined` trigger → Dropdown `{Event Types, Calendar, Leaderboard, Help, Admin (admins only)}` | (same) |
| **BR** | `QuickActionFab` + `BackToTop` (existing components, inlined via `--inline` modifier class) | (same) |

**Pill nav at >= 1180px (विवेक 2026-06-05 confirmation):**

- Items: **Home, Events, Issues, Feedback** — exactly 4. **Login and Join are NOT in the pill**; they live inside the TR user-icon dropdown when anonymous.
- DOM order matches visual reading: skip-link → TL → pill → TR → BL → BR → mobile-menu → main → footer.
- Entrance animation: 420ms fade + slide-down + scale (`cubic-bezier(0.22, 1, 0.36, 1)`), per-link 80ms stagger. Gated by `sessionStorage["shramdan.pill.intro.v1"]` and `prefers-reduced-motion`. CSS-only display, never `aria-hidden`-toggled.

## Breakpoint strategy

| Range | Behavior |
| --- | --- |
| `<= 720px` | Backdrop-filter dropped (low-end Android jank). `MobileBottomNav` takes over for primary nav. `corner-br` offsets above bottom nav with `env(safe-area-inset-bottom)`. |
| `721–1024px` | Top corners collapse into a single 56px fixed bar (split 50/50: TL = logo+brand, TR = Settings + Bell + Avatar/UserIcon + Hamburger). `corner-bl` hidden (apps grid moves into the hamburger drawer). |
| `1025–1179px` | Four independent floating corner chips, no pill nav. Nav reachable via TR hamburger. |
| `>= 1180px` | Pill nav appears top-center. Four corner chips. iPad Pro 11" landscape (1194px) gets desktop layout — confirmed acceptable. |

## Glass treatment (CC-1)

Every `.site-shell-corner__inner` and the pill nav use the project glass recipe:

```css
background: color-mix(in srgb, var(--surface) 94%, transparent);
backdrop-filter: blur(14px);
-webkit-backdrop-filter: blur(14px);
border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
border-radius: 14px;        /* corners */ /* pill uses border-radius: 999px */
box-shadow: 0 8px 24px rgba(23, 33, 28, 0.08);
```

`@media (prefers-reduced-transparency: reduce)` and `forced-colors: active` drop the blur and raise the background alpha for legibility.

## Click-pass-through fix

Outer `.site-shell-corner` wrappers carry `pointer-events: none`; only the inner chip carries `pointer-events: auto`. Body content under the empty space around each corner remains clickable.

## File changes

| File | Change |
| --- | --- |
| [src/components/SiteShell.js](../../src/components/SiteShell.js) | JSX reshape: `<header className="site-shell-banner" role="banner">` wraps 4 corner blocks + pill nav + mobile-menu. New prop `chromeMode = "full" \| "corners-only" \| "none"`. Scroll-hide JS retained but now focus-within-aware. New `UserIconDropdown` sub-component for anon TR. `nav-links` array narrows to pill set (Home, Events, Issues, Feedback). |
| [src/components/QuickActionFab.js](../../src/components/QuickActionFab.js) | Outer className adds `quick-action-fab--inline` modifier. |
| [src/components/BackToTop.js](../../src/components/BackToTop.js) | Outer className adds `back-to-top--inline` modifier. |
| [src/styles/home.css](../../src/styles/home.css) | Delete `.topbar` / `.topbar-hidden` rules. Add `.site-shell-banner` (display:contents), `.site-shell-corner` family, `.site-shell-pill` family, `.user-icon-dropdown` family. Update `.site-shell` tokens: `--header-height: 0`, `--corner-clear-zone: 64px`, `--corner-inset: 18px`, `--corner-z: 50`, `--pill-z: 55`. Override `.mobile-menu-panel` to `position: fixed` (since banner is now `display:contents`). `prefers-reduced-motion` + `prefers-reduced-transparency` + `forced-colors` + `@media print` blocks. `[data-chrome-mode="none"]`, `[data-chrome-mode="corners-only"]` overrides. |
| [src/styles/event-roster.css](../../src/styles/event-roster.css) | Line 1099-ish: `var(--header-height, 74px)` → `var(--corner-clear-zone, 64px)`. |
| [src/components/EventPreviewPane.js](../../src/components/EventPreviewPane.js) | `getComputedStyle(...).getPropertyValue('--header-height')` → `'--corner-clear-zone'`; fallback `74` → `64`. |
| [src/components/IssuePreviewPane.js](../../src/components/IssuePreviewPane.js) | Same swap. |
| event-detail sticky CSS (find via grep) | `--header-height` → `--corner-clear-zone`. |
| `.calendar-day-panel`, `.section-heading` sticky offsets | Same. |

## Verify (Playwright + a11y MCP)

Critical asserts:

1. **No band:** `document.querySelector('.topbar')` returns null on every route.
2. **Single banner:** `document.querySelectorAll('header.site-shell-banner').length === 1`; its bounding box is `width=0 height=0` (display:contents).
3. **Corners visible at 1440:** all four `.site-shell-corner--*` blocks visible; `.site-shell-pill` visible.
4. **Corners collapse at 900:** top corners merge to 56px bar; `corner-bl` hidden; `corner-br` visible.
5. **Mobile 360:** `.mobile-bottom-nav` visible; `.site-shell-pill` hidden.
6. **Pill entrance:** first session adds `is-entering` within 50ms, removed within 600ms; second session never adds the class.
7. **Focus-not-obscured:** scroll 800px, focus brand link → top-left corner's `is-hidden` class is overridden (focus-within).
8. **Click pass-through:** click on empty space inside `.site-shell-corner--top-left` (outside `.site-shell-corner__inner`) lands on body content underneath.
9. **Sticky regression:** `.events-split-preview`, `.event-detail-side`, `.calendar-day-panel`, `IssuePreviewPane`, `EventPreviewPane` all use `--corner-clear-zone`.
10. **A11y MCP:** `mcp__a11y-scanner__scan_page_matrix` against `/`, `/events`, `/events/<id>`, `/issues`, `/issues/<id>`, `/stories/<slug>`, `/calendar` at both themes at 1440px AND 360px. Single banner landmark; contrast ≥ 4.5:1 on every corner chip; focus order matches DOM order.
11. **Reduced-motion:** `is-entering` never applied; corners never animate on scroll.
12. **Forced-colors:** chips render with solid surface + visible border (Windows High Contrast safe).
13. **Print:** `@media print` hides all corners, pill, MobileBottomNav.

## Open decisions (defaults taken — call out to override)

- **Pill items:** Home, Events, Issues, Feedback (4) — viवेक confirmed 2026-06-05.
- **TR anon dropdown items:** Login, Join — विवेक confirmed 2026-06-05.
- **Pill nav breakpoint:** `>= 1180px` (matches existing `.topbar` content max-width; covers the 1025–1179px laptop dead-zone via TR hamburger).
- **BL apps-grid items (anonymous):** Event Types, Calendar, Leaderboard, Help.
- **BL apps-grid items (admin only addition):** Admin shortcut to `/admin`.
- **Entrance motion:** 420ms + 80ms per-link stagger, `cubic-bezier(0.22, 1, 0.36, 1)`.
- **iPad Pro 11" landscape (1194px):** desktop layout (corners + pill).
- **`.nav-links` rule in home.css:** deleted entirely (header band is gone; pill uses its own selectors).
- **`chromeMode` prop:** introduced now with default `"full"`; not consumed yet, but available for `/intro` (Phase 6) and immersive map view (Phase 4).
- **Glass background formula:** `color-mix(in srgb, var(--surface) 94%, transparent)` + `blur(14px)` per [[feedback-glassy-design]].
- **Surface tokens stay theme-bound:** no per-component CSS variables; mode (light/dark) keeps driving the look.

If anything above is wrong, override before merge.
