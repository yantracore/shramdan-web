# 2026-06-05 — TV-like app pivot: homepage becomes a Google-style search surface for a unified Issues + Events stream

**Status:** Adopted
**Decision makers:** विवेक (project lead) with friends in group discussion, श्रमेश (AI member)
**Related:**
- Companion plan with phased work: [ops/01-tv-app-pivot-plan.md](../ops/01-tv-app-pivot-plan.md)
- Methodology this builds on: [2026-06-03 UI-first ADR](2026-06-03-ui-first-and-two-meeting-pivot.md)

---

## Context

The product has been built UI-first for several weeks, and the team's metaphor for what the surface *is* has shifted three times: brochure → Google-style sourcer → Airbnb-style sourcer → Netflix-style movie sourcer. Each shift was driven by a group conversation among shramdan members and friends, and each one reshaped enough of the surface that no single "polish" pass could absorb it. The current site, while bilingual and feature-rich, still reads as a marketing brochure with app components embedded inside it.

The 2026-06-05 group conversation produced a clearer thesis than any prior reshape:

- **The site is an app, not a brochure.** Pages should optimize for usability, not readability. The only page that optimizes for readability is the introduction; everything else is operational surface.
- **Issues and Events are the same thing.** An issue gains supporters, gets promoted, becomes an event, runs, and finishes. The "support" affordance continues from issue creation until the event actually closes. There is no useful separation between the two streams.
- **The homepage is a search engine.** No vertical scrollbar by default — a Google-like landing. The four corners of the screen carry the organization, the user, the app, and quick actions. On scroll or on a "Participate" click, a location-aware curated stream appears.
- **The current homepage is a good *intro* page, not a good *home* page.** Repurpose, don't discard.

---

## Decisions

### 1. The homepage becomes a search surface

- No vertical scrollbar on first paint. Big search box centered. Filters button beside it. Stats pills + a decent-size map immediately below the search row. Nothing else competes for the first viewport.
- On scroll-down (or on `Participate` click), a curated for-you stream appears, scoped by location.
- The site header stops being a full-width band. It splits into four corner blocks: organization (top-left), user (top-right), app (bottom-left), `+`/quick-icons (bottom-right). On the largest screens, an optional curved top-center pill navigation animates in on first load.

### 2. Issues and Events are presented as one stream

- The same list/thumbnails/map component renders both. A tabbed switch toggles the active view. Support actions persist on issues that have already promoted to events, until the event finishes.
- The stats pills (currently a glanceable count) become tabbed filter chips driven by the public reports API. The active pill is highlighted; clicking a pill scopes the stream and acts as an extension of the existing status filter.
- Slogan-candidate framing: "Many to come together to solve problems — events of events to solve problems in the society."

### 3. Three views, tabbed: List · Thumbnails · Map

- **List** = the current split-view layout (preview on one side, list on the other).
- **Thumbnails** = a denser variant of List. The preview shrinks; two rows of smaller thumbnails appear.
- **Map** = a map-first view, with results stacked below the map on the homepage variant.
- The view switch is a tabbed control. Active view is highlighted.

### 4. The current homepage is repurposed as `/intro`

- Strip the brochure cheese: "join us" rally copy, government-partnership claims, redundant "small hands together" / "five steps one journey" copy duplicated elsewhere.
- Keep the photo-driven steps section that still earns its place.
- Add one new section: **community collaboration** — maintenance, funding, non-profit framing, no-one-owns-it, all funds go to the work and the app.
- Add a fixed right-side jump navigation listing the section titles, so the intro is genuinely browsable.

### 5. Pages must feel like apps, not brochures

- All non-intro pages shrink their chrome. No tall title bands. No thick filter rails. No oversize action buttons. Content first.
- Each page typically gets: small eyebrow, lean title + description, compact filter row, single primary action on the right.
- Sticky preview behaviour (e.g. `.events-split-preview`) must pass scroll through to the body once the preview has scrolled to its end — sticky, not scroll-trap.

### 6. Members get a discussion surface and visible profiles

- Member icons in comments and rosters become click-throughs to a member profile.
- A new `/discussions` surface lists community topics; some topics are **feature proposals** that members vote on. Votes above a threshold promote the feature to the roadmap. This is the app's own self-evolution loop.
- Feedback is listed per-person with an optional anonymity toggle.
- Discussion presence (active thread count, last activity) appears on relevant event pages.

---

## Consequences

### Positive

- The site stops apologizing for being an app. It is an app.
- One stream component instead of two reduces maintenance and lets future view modes (e.g. calendar-in-result, timeline) drop in cleanly.
- The intro page can finally tell the philosophical story without competing with the operational surface.
- Discussions + feature-voting close the loop on "the app evolves by what members want," which is consistent with the way this project has been built so far.

### Negative / risks

- Several mid-build feature surfaces (split-view UX, header band, current homepage rails) are partially-shipped. Removing or restructuring them mid-flight means some recent polish work will be retired.
- The unified Issues + Events stream changes URL semantics: existing `/issues` and `/events` pages need to remain navigable for SEO + bookmarks, even when the canonical entry point is the homepage stream.
- Backend asks will grow: discussions, feature-voting, member profiles, and refined participation lifecycle each need API contracts. Capture each in `docs/api-requirements/*.md` per the 2026-06-03 pivot.
- The four-corner header is a non-conventional layout. Reduced-motion + small-screen behaviour need explicit design — corners collapse to a single compact bar below tablet width.

### Mitigations

- Roll the pivot out in phases (see [ops/01-tv-app-pivot-plan.md](../ops/01-tv-app-pivot-plan.md)). Each phase ships independently and can be paused.
- Keep `/issues` and `/events` as valid routes after the homepage stream lands — they become deep-link entry points to the same stream component.
- Treat each backend ask as a `docs/api-requirements/*.md` update in the session that ships the UI, not later.

---

## Out of scope (deferred)

- **Organization partnerships.** Still deferred from the 2026-06-03 ADR; multi-tenant remains future scope.
- **Mobile app shell.** This pivot is for the web surface. The native app inherits the metaphor but its phasing is separate.
- **Curated stream ranking algorithm.** Phase 2 ships location-based proximity ranking; richer personalization is a later phase.
