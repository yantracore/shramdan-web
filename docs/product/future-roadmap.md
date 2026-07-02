# Future Roadmap

> What श्रमदान could become beyond v1. Five-year horizon.
>
> Status: vision doc. Items here are *what we'd like to build if the movement grows*; nothing in this file is a commitment or a near-term plan. The active roadmap is at [`../ops/00-master-roadmap.md`](../ops/00-master-roadmap.md).

---

## Why this doc exists

The active roadmap tracks the next 6–12 months. It cannot contain the long horizon without losing focus. But the long horizon shapes the design: if we know we'll someday run vehicles, we model the data accordingly *today* even if we don't ship the feature for years.

This doc captures those load-bearing future bets so present decisions can honor them.

---

## Horizon 1 — community infrastructure (2–3 years)

### Vehicles + transportation

For events that require moving tools, materials, or people across the city: a small fleet (or a network of member-owned vehicles) coordinated through the platform.

- **Pick-and-drop for members.** Volunteers in distant wards can opt-in for shared rides to events. Driver compensation flows through the platform.
- **Material transport.** Plants for tree-planting, sand for repairs, tools for cleanups — coordinated truck rentals or member-owned vehicle use, transparently funded.
- **Disposal logistics.** Trash from cleanups needs to *go somewhere* — municipality transfer stations, recycling facilities, composting sites. Trip coordination + receipts in the platform.

Data implications today: events should already model `materialNeeds` and `transportNeeds` separately so future fleet integration has a place to land.

### Tool libraries

A physical inventory of cleanup tools (shovels, brooms, gloves, sieves, water tanks) stored in a shared community space, checked out for events. Multiple regional inventories across major cities. Tracked in the platform.

Lifecycle: borrow → use → clean → return. Receipts for replacement when broken.

### Storage + staging spaces

Donated or rented physical spaces in each operational city: a small room where tools live, post-event materials wait for pickup, and pre-event briefings can happen. Becomes the local face of श्रमदान.

---

## Horizon 2 — operational scale (3–5 years)

### Regional chapters

Each city / region with consistent activity develops its own coordinator team, its own event calendar, its own local Outreach Shramdans. The platform stays one — central data model, central account system, central transparency ledger — but operations decentralize.

### Multilingual beyond Nepali

The architecture is already bilingual EN/NE. Future:
- Maithili, Bhojpuri, Newar — Nepal's other major languages
- Hindi — for cross-border collaboration with similar movements
- Bilingual UX for tribal/indigenous-language communities

This needs translation infrastructure (already partly designed; see backend translation initiative referenced in 9.11 of the master roadmap).

### Cross-community lending

A community in Pokhara that has spare gloves shares them with a community in Biratnagar planning a cleanup. The platform tracks the loan, the return, and the gratitude.

This is the bigger inventory model — beyond a single city's tool library.

### Annual public report

A real annual report — events, hours, funds, outcomes — distributed publicly. Not as a marketing piece; as the ledger writ large. The Transparency Surface (Phase 13 / Phase 14 of the active roadmap) provides the data; this is the editorial layer.

---

## Horizon 3 — scale paradigms (5+ years)

### Government partnership without dependency

Local governments use the platform as a citizen-engagement layer (issues that hit the platform become signals to ward offices). Funding partnerships stay project-tied, never platform-tied — see sustenance anti-patterns.

### School and youth programs

श्रमदान as part of school civics curriculum — students participate in events for community-service credit, the platform issues verified certificates. Designed carefully to avoid coercion (no required participation, no grade pressure to outperform peers in vote counts).

### Cross-border movement export

Other communities — in Bhutan, Sikkim, the diaspora — fork the model. The platform open-sources the schema and component vocabulary; sister deployments emerge with the same ethos. Not federation; convergent evolution.

### AI assistance scales

By this horizon, श्रमेश handles a meaningful portion of citizen interactions — orientation, event navigation, FAQ — leaving human coordinators free for the labor that needs human presence. The character canon remains intact.

---

## Things we will deliberately NOT pursue

The future-roadmap is also where we capture what we've considered and ruled out:

- **Becoming a registered NGO.** श्रमदान operates as a movement; corporate structure invites mission drift.
- **App-store-led growth.** Citizen apps live on phones, but the entry point stays the web. Native apps serve members, not strangers.
- **For-profit subsidiary.** No premium subscriptions for citizen features. Operating revenue lanes are listed in sustenance-strategy.
- **Becoming an influencer platform.** No follower counts, no "top organizer" leaderboards beyond the unavoidable participation-count surfacing.
- **Becoming a delivery platform.** We coordinate community labor; we don't dispatch gig workers.

---

## How to use this doc

When making a design decision that could foreclose a future direction listed here, flag it explicitly:

- *"This schema choice makes Horizon 1 vehicle integration awkward — is that OK?"*
- *"This API contract assumes single-city operation; Horizon 2 regional chapters would need it cross-city."*

The active roadmap tracks the build. This doc tracks the destinations we'd like the build to be compatible with.

---

## Related

- [`../ops/00-master-roadmap.md`](../ops/00-master-roadmap.md) — the active roadmap
- [`./sustenance-strategy.md`](./sustenance-strategy.md) — financial sustainability vision
- [`./roles.md`](./roles.md) — role lanes that scale into Horizon 1+
- [`../public/philosophy.md`](../public/philosophy.md) — the values that anchor every future decision
