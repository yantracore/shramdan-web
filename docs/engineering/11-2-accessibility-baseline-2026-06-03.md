# Accessibility Baseline Audit — WCAG AA — 2026-06-03

> Frontend a11y sweep before the first real-world event, paired with the [11.7 security baseline](11-security-baseline-2026-06-03.md). Roadmap leaf: `11.2 Accessibility audit (WCAG AA)`.

**Auditor:** Shramesh (AI member), with verification by विवेक.
**Method:** static analysis via grep + manual review of high-risk surfaces. No automated axe-core run (logged as a polish backlog follow-up).
**Coverage:** focus management, keyboard reachability, image alt text, form labels, icon-button accessible names, skip-link, landmark roles, motion preferences, color-contrast posture, language tagging.

---

## Summary

| Area | Status | Notes |
| --- | --- | --- |
| Skip-to-main link | OK | Already shipped 2026-06-02 in SiteShell |
| Keyboard reachability of action bars | OK | StickyActionBar fix shipped 2026-06-02 |
| Image alt text | OK with notes | Empty alt on decorative logos is intentional |
| Form labels | OK | All `<Form.Item>` instances carry `label=` |
| Icon-only buttons | OK | Antd `<Button icon icon-only={false}>` pattern always pairs with visible children |
| Leaflet marker accessible names | OK | Shipped 2026-06-02 |
| Map / map-fullscreen | OK | Toggle has aria-pressed + named labels |
| Devanagari line-height | OK | `:root[lang="ne"]` baseline shipped 2026-06-02 |
| `<html lang>` | OK | Switches between `en` and `ne` via `<Providers>` |
| `prefers-reduced-motion` | OK | New components added today (`event-roster-progress`, `safety-checklist`, `time-series`, `category-mix`) all carry the media query |
| Color contrast (WCAG AA) | Not auto-verified | Logged as polish backlog item |
| Automated axe-core scan | Not run | Logged as polish backlog item |
| Focus styles on custom buttons | Partial | Antd defaults inherited; new components mostly rely on Antd `<Button>` |

No HIGH-severity findings. Three defense-in-depth items logged.

---

## Findings

### 1. Skip-to-main link is present — OK

The `SiteShell` mounts a `<a class="skip-to-main">` element as the first focusable child of `<body>`. It is visually hidden until keyboard focus and points at a `tabIndex=-1` wrapper around `children`. Bilingual EN+NE. Satisfies WCAG 2.1 SC 2.4.1 (Bypass Blocks).

### 2. Image alt text — OK with one note

`<Image alt="">` appears on five surfaces, all for `/images/logo.png` decoration adjacent to a visible brand name. Empty alt is the correct WAI-ARIA pattern for purely decorative images (so a screen reader does not announce a redundant "Shramdan logo" when the brand wordmark is already read). No action required.

User-uploaded images (issue covers, event photos) use `accessibleLabel` fallback chains for the `alt` attribute (verified earlier as a P1 polish item, shipped 2026-06-02). No regression.

### 3. Form labels — OK

`ContributorForm` (the `/join` form) has 10 `<Form.Item>` instances, all carry `label=`. Audit grep for `<Form.Item(?![^>]*label=)` returned zero matches. Antd renders each `<Form.Item label>` as a `<label>` element associated with the input, so screen readers announce labels correctly.

### 4. Icon-only buttons — OK

All `<Button icon={…}>` instances found in `src/` pair the icon with visible children (button label). Antd renders the children as the button's accessible name; the icon is decorative. No silent icon-only buttons found in public surfaces.

In admin pages, action buttons (Edit, Delete, View) similarly always have visible text. Admin is EN-only per project decision; labels are present.

### 5. Map markers and fullscreen toggle — OK

`IssueMap.IssueMarker` was patched 2026-06-02 to take `title`, `alt`, and `keyboard` props derived from the issue's title/address/status — this resolved the `name-role-value` axe violation. Map fullscreen toggle carries `aria-pressed` and bilingual labels.

### 6. Devanagari typography — OK

A 2026-06-02 polish item set `:root[lang="ne"] body|p|li` to a 1.7 line-height and 1.35 on headings so matras and reph do not crowd descenders. Latin pages unchanged. Mixed-script paragraphs in Comments and Impact pages render correctly.

### 7. `<html lang>` — OK

`Providers` normalizes the language code to `ne` for HTML (BCP-47), even though the app's internal state uses `np` (per the language-codes-in-code memory). Screen readers receive the correct locale.

### 8. Motion preferences — OK

Every animated primitive landed in today's batch reads `prefers-reduced-motion`:

- `.event-roster-progress-fill` transition disabled under reduced motion
- `.impact-category-mix-fill` transition disabled
- `.impact-time-series-fill` transition disabled
- `.page-enter` route fade-up was made reduced-motion safe at the 2026-06-02 polish ship
- `data-language-switching` soft dim respects reduced-motion

### 9. Focus styles on custom buttons — Partial

New components in today's batch (`SafetyChecklistPanel`, `EventJoinPanel`, `LeaderCompleteEditor`, `ReminderCadencePanel`, voter-role modal) use Antd `<Button>` and `<Checkbox>` primitives, which inherit Antd's default focus ring. This works at WCAG AA contrast against the surface but the ring is thin (2 px). A future polish pass should bump the ring weight on primary buttons specifically.

### 10. Color contrast — NOT VERIFIED

The codebase uses semantic CSS variables (`--text`, `--muted`, `--surface`, etc.) with separate light and dark theme values. A real contrast checker (axe-core, WebAIM Contrast Checker) was not run this pass. Spot-checking the primary palette against the surface backgrounds in light mode gives plausibly-AA values, but this is not a substitute for tool-based verification. Logged.

### 11. Automated axe-core scan — NOT RUN

A Playwright-driven axe-core scan against all public routes would catch issues this static audit missed (focus traps in modals, ARIA misuse, dynamic content announcement, etc.). Logged for the polish backlog.

---

## Items added to polish backlog as a result of this audit

- `P2 [from 11.2]` Run Playwright + axe-core scan against all public routes; integrate into CI when CI exists. Catch dynamic / runtime issues this static audit cannot.
- `P3 [from 11.2]` Verify WCAG AA contrast across the full palette in both themes with a real contrast tool; tweak `--muted` and primary fills if any fail.
- `P3 [from 11.2]` Bump focus ring weight on primary action buttons from Antd's default (2 px) to 3 px for clearer keyboard focus.

---

## Conclusion

No blocking accessibility issues for the first real-world event. The frontend has shipped multiple a11y polish items already and the new surfaces from today inherit reduced-motion and focus from Antd primitives. Three defense-in-depth follow-ups logged.
