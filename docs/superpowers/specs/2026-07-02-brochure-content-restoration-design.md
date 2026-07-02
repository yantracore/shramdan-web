# Brochure Content Restoration — Home Hero, /intro, /invitations, Open Resources

**Date:** 2026-07-02
**Status:** Approved direction, pending implementation plan

## Context

The 2026-06-05 pivot (`63fd42b`, "Phase 2 v0") replaced the brochure-style
`HomeClient.js` at `/` with `HomeSearchView`. The pivot commit explicitly said
*"HomeClient.js stays in the repo as reference content for future merger into
/intro"* — but the same-day commit `3d66f5b` deleted HomeClient after building
the photo-driven `IntroCinematic`, and the brochure content was never migrated.

That content properly introduced श्रमदान to the world (hero with video
backgrounds, core idea, activity types, open volunteer invitations, open
development resources). This restoration brings it back — decomposed across
dedicated pages instead of one maximal homepage.

**Source of truth for all restored content:** `3d66f5b^` (= `e300b0c`,
2026-06-05) — the last full version of the old homepage. It postdates both the
video-background work (`93ff0c4`, 2026-06-03) and the live-backend swap
(`ea2b652`), so it is the best version that ever existed.

### Old homepage section inventory (at `3d66f5b^:src/app/HomeClient.js`)

| # | Section | Disposition |
| --- | --------- | ------------- |
| 1 | `hero-section` — video bg, TimeOfDayGreeting, title/subtitle/support, Join CTA | → Home **and** /intro |
| 1b | `hero-panel` action hub aside — progress %, quick links, 12PM LIVE badge | **Dropped** (its links live on in Open Resources) |
| 2 | `EventsHomeRail` (mid-page) | **Dropped** (current home already owns live rails) |
| 3 | `live-issues-section` — top-voted active issues | **Dropped** (same reason) |
| 4 | `event-types-section` (video bg) | → /intro |
| 5 | `cleanup-areas-section` (video bg) | → /intro |
| 6 | `core-idea-section` (video bg) | → /intro |
| 7 | `volunteer-invite-section` — 11 roles, `/join?role=` CTAs | → **new /invitations** |
| 8 | `building-now-section` — roadmap progress cards | → /intro |
| 9 | `resources-section` — खुला स्रोतहरू, playlist embed + real links | → **/resources** (retitled Open Resources) |

## Decisions (confirmed 2026-07-02)

1. **Home hero scope:** hero copy + video background + two CTAs only. The
   glassy action-hub panel (progress bar, quick links, LIVE badge) does not
   return; its links are all present on Open Resources.
2. **/intro scope:** timeless intro — hero + event types + cleanup areas +
   core idea + building-now. Dynamic sections (events rail, live issues)
   stay off /intro; the homepage owns live data.
3. **Invitations route:** `/invitations` — "खुला निम्तो / Open Invitations".
4. **Resources route:** stays `/resources` (no redirect needed); title, nav
   label, and content change to "खुला स्रोतहरू / Open Resources".

## Design

### 1. Home (`/`) — one change only

`HomeSearchView` keeps its layout and all current sections (events rail,
stats + map panel, discovery rails). The minimal brand band
(`home-search-hero`: logo mark + name + slogan + small intro link) is
replaced by the restored hero:

- `SectionVideoBackground` (`bagmati-cleanup.mp4`, hero overlay, existing
  component) — video background is back on home.
- TimeOfDayGreeting eyebrow, `t.hero.title` / `subtitle` / `support`.
- CTAs: **जोडिने/Join → `/join`** (primary) and **थप जान्ने/Learn More →
  `/intro`** (secondary). The old hero's Join pointed at the on-page
  `#we-need-you` anchor; that panel now lives on /invitations, and home's
  Join goes straight to the join form.
- NP button copy uses agentive -ने form; EN CTAs use Title Case.

### 2. `/intro` — full brochure body in the current layout

Replace the `IntroCinematic` two-chapter content with the restored brochure
sections, in this order, inside the current `SiteShell` (no layout-element
changes — body content only):

1. Hero (same restored hero; on /intro the Learn More CTA is omitted as
   self-referential — Join CTA only, matching the old single-CTA hero)
2. `event-types-section` (video bg)
3. `cleanup-areas-section` (video bg)
4. `core-idea-section` (video bg)
5. `building-now-section` (live roadmap progress via `getRoadmapSummary()`
   from `src/lib/roadmap.js` — still in the repo, used by /development)

`IntroCinematic.js` + `intro.css` stay in the repo unused (v1 defer pattern:
keep components, cut wiring).

### 3. New `/invitations` — Open Invitations

New page carrying the old `volunteer-invite-section` content exactly:

- Brand card (logo + brand line), copy block (eyebrow, split title, intro),
  primary CTA → `/join`, secondary CTA → `/feedback`.
- Goal card (`volunteerInvite.goal`).
- Roles panel (`id="we-need-you"` kept for deep links): 11 role cards —
  frontend, backend, qa, devops, uiux, graphics, content, legal, finance,
  donors, leaders — each linking `/join?role=<value>`.
- Page chrome: eyebrow/title "खुला निम्तो / Open Invitations".

### 4. `/resources` — Open Resources

Replace the current placeholder directory (every href is a dead `#`) with the
old homepage `resources-section` content:

- YouTube playlist card with embed (`youtube-nocookie` iframe) + watch-on-
  YouTube button.
- Resource cards from `siteContent.resources.items` — all real links:
  participate (Google Meet), watchLive (YouTube streams), discord,
  presentation (Drive), roadmap (GitHub), documents (GitHub docs), github
  (repo).
- Retitle page + nav label from "स्रोत भण्डार / Resource library" to
  "खुला स्रोतहरू / Open Resources" (`t.nav.resources`, page title, eyebrow).

### 5. Copy blocks (`src/lib/siteContent.js`)

Already present (reuse as-is): `hero`, `eventTypes`, `coreIdea`, `resources`,
`liveIssues` (unused here), `homeSearch`.
Restore from `3d66f5b^:src/lib/siteContent.js` (NP + EN): `cleanupAreas`,
`volunteerInvite`, `buildInPublic`. (`heroPanel` stays deleted — panel is not
coming back.)
New copy needed: hero secondary CTA label (थप जान्ने / Learn More),
/invitations page chrome, Open Resources retitle.

### 6. Wiring

- Footer: add `/intro` to the Learn column, `/invitations` to the
  Get Involved column, `/resources` (Open Resources) to the Learn column.
- Mobile drawer (`appsGridItems`): `/resources` already present (label
  updates via `t.nav.resources`); add `/invitations` and `/intro`.
- Home hero Learn More is the primary entry to `/intro`.

### 7. Styling

`src/styles/home.css` still contains the old section styles (hero-section,
event-types, cleanup-areas, core-idea, volunteer-invite, building-now,
resources — ~79 references). Sections render on /intro, /invitations, and
/resources with those classes; audit for drift against the current
design-token/glass system rather than rewriting. `home-search.css` brand-band
styles become unused on home once the hero replaces the band.

## Out of scope

- No `SiteShell` / layout-element changes anywhere.
- No backend or API changes.
- No deletion of `IntroCinematic`/`intro.css` (defer pattern).
- Old mid-page dynamic sections (events rail, live issues) are not restored.

## Verification

Browser-verify (Playwright) before "done", per project rule: home hero with
playing video + both CTAs; /intro full section flow NP + EN; /invitations
role cards deep-linking to `/join?role=`; /resources real links + playlist
embed; footer/drawer wiring; no layout regressions on rail/map/discovery
sections.
