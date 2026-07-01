# Home "currently happening" rail — flat 3-up redesign

**Date:** 2026-07-01
**Status:** Approved, implementing
**Component:** `src/components/EventsHomeRail.js`, `src/styles/live-events-rail.css`

## Problem

The homepage "currently happening / live events" rail is the highest-attention
section — it surfaces the 1–5 ongoing shramdan activities and is where a future
live-video embed would live. Today it renders as a Swiper `EffectCoverflow`
slider (`rotate: 50`, `depth: 100`). The heavy 3D tilt reads as a "music-stage /
concert display" — too fancy for a civic activity feed. The user wants to keep
the size and prominence but replace the tilt with something simpler and calmer.

## Decision

Keep the exact same **3-up centered slider** (big center card, autoplay cycle
across 1–5 items, loop, glassy nav, pagination, LIVE badge, keyboard + a11y).
Remove only the 3D coverflow geometry. Focus is expressed **flat**: the center
card sits at full size/opacity; the side cards are flat but scaled down and
dimmed so attention stays centered.

This is the most literal reading of "slightly change, still nice" and the
lowest-risk path — no structural/layout change, only the effect layer.

The prior `DESIGN CONTRACT` comment in the component locked coverflow as the
only render path ("do not branch"). This redesign intentionally supersedes that
lock per direct user direction; the comment is rewritten to describe the flat
model.

## Changes

### `EventsHomeRail.js`
- Drop `EffectCoverflow` from the `swiper/modules` import and from the Swiper
  `modules` array.
- Drop `import "swiper/css/effect-coverflow"`.
- Remove the `effect="coverflow"` and `coverflowEffect={…}` props → default
  slide effect.
- Remove the `COVERFLOW_PARAMS` constant. Rename `COVERFLOW_SPEED_*` →
  `SLIDE_SPEED_*`; drop the default transition to ~600ms (a flat slide feels
  snappier than the 900ms coverflow glide). Reduced-motion stays at 0 (snap).
- Rewrite the DESIGN CONTRACT header comment to describe the flat 3-up model.

### `live-events-rail.css`
- On `.events-home-rail-slide.swiper-slide`: keep the explicit
  `height: clamp(280px, 30vw, 560px)`; add `transform: scale(0.86)`,
  `opacity: 0.5`, and a `transform`/`opacity` transition.
- Add `.events-home-rail-slide.swiper-slide-active` override → `scale(1)`,
  `opacity: 1`.
- Reduce `.events-home-rail-swiper` `padding-block` from
  `clamp(64px, 10vw, 160px) clamp(48px, 6vw, 96px)` (which existed only to clear
  the tilted side cards' projected "lift") to `clamp(24px, 3.5vw, 56px)
  clamp(20px, 3vw, 44px)`. Tighter, cleaner section.
- Add a `prefers-reduced-motion: reduce` rule that disables the slide
  transition (the scaled/dimmed geometry stays static — it just snaps).
- Update the two stale comments that reference coverflow geometry / tilt lift.

Side-card `scale 0.86` / `opacity 0.5` are starting defaults, tuned in-browser.

## Preserved (untouched)
3-up centered layout, card height, autoplay (5s, pause-on-hover), loop, glassy
nav buttons, pagination dots, LIVE/date badges, business-image strip, CTA pill,
overlay gradients, data flow, empty/loading states, a11y messages.

## Verification
Run the dev server, open `/`, screenshot the rail. Assert: no 3D tilt, flat
3-up with a dominant center card and scaled/dimmed side cards, tighter vertical
padding. Tune scale/opacity from the real render if needed.

## Follow-up — click a side slide to focus it (2026-07-01)

Clicking a dimmed side card previously followed its `<Link>` straight to the
detail page (or, when the click landed on a clipped area, did nothing useful).
Expected carousel behaviour: clicking a side (non-active) card should slide it
to center; only the already-centered card opens its detail page.

Implemented with Swiper's `slideToClickedSlide` plus a `handlePosterClick`
guard on each card `<Link>`: on a genuine pointer click (`event.detail >= 1`)
of a slide that lacks `.swiper-slide-active`, we `preventDefault()` so Swiper
focuses it instead of navigating. Next's `<Link>` respects `defaultPrevented`.
Keyboard activation (Enter → `click` with `detail === 0`) still follows the
link, since `slideToClickedSlide` is pointer-only.

Verified in-browser (1440): clicking the right neighbour advanced the active
card by one with the URL staying `/`; clicking the left neighbour moved it
back; clicking the centered card navigated to its detail page.
