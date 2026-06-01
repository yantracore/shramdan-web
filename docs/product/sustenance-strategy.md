# Sustenance Strategy

> श्रमदान a movement, not an NGO. But movements need oxygen. This doc captures how the platform pays for itself without compromising the ethos.
>
> Status: v0 stub, captures direction; numbers TBD.

---

## North star

श्रमदान does not exist to raise money. It exists to coordinate community labor. Sustenance funds operations *in service of* that coordination — never the other way around.

Two non-negotiables:

1. **Transparent by default.** Every rupee in, every rupee out, visible on the public ledger. Phase 6 (Transparency & Public Ledger) wires this into UI; sustenance design assumes that surface exists.
2. **No coercion.** Donations are invited, never required. Members never lose access to features by not paying.

---

## Lane 1 — Project-tied donations *(primary)*

People donate **for a specific event or issue**, not into a generic pool.

Flow:
- User opens an issue / event detail page.
- "Contribute" panel shows the specific need (tools, transport, refreshments, dispose fees).
- Donation routes (Esewa, Khalti, bank, foreign — Phase 5) tagged with the event ID.
- Receipt + public ledger entry per donation (Phase 6).
- Surplus after the event closes funnels into an explicitly-named **operations bucket** (described below) — not back into a different campaign without disclosure.

Why project-tied first: trust scales with specificity. "Help us clean Ratna Park on Saturday" is concrete; "Help श्रमदान" is abstract and asks for trust we haven't yet earned.

---

## Lane 2 — Operations bucket *(surplus + recurring)*

A clearly-labeled fund covering platform expenses that no single event can absorb:

- Server hosting (Vercel, backend infra)
- Domain + email + SMS provider
- Legal + accounting compliance
- Development hardware for contributors who need it
- Travel reimbursements for organizers visiting communities

Sources, in order of preference:
1. **Project surplus** — explicit user opt-in at donation time: *"Allocate any unused amount to श्रमदान operations."*
2. **Recurring contributions** — small monthly amounts from people who want to support the platform itself, not any one event.
3. **Service partnerships** — paid features for organizations using the platform (corporate CSR teams, NGOs, government partners) without compromising the open citizen surface.

Reported per quarter on the public ledger. Every expense gets a receipt.

---

## Lane 3 — YouTube channel monetization

Events live-streamed via YouTube Live (see Phase 13 + 14 architecture) generate ad revenue + Super Chat + channel memberships. Already verified: embedded YouTube videos on app pages count toward channel monetization same as direct YouTube views.

This is meaningful at scale but not load-bearing in the first year. Treat as bonus inflow into the operations bucket, declared on the ledger.

Sub-stream: **shramdan dev series** — the YouTube series covering the platform's own construction (see Phase 18). Educational + transparency content. Monetization here flows into operations bucket explicitly.

---

## Lane 4 — Future revenue streams *(brainstormed, not committed)*

Captured here so we don't pretend the list is closed:

- **Merch** — श्रमदान T-shirts / caps for sale at events; small margin into operations.
- **Corporate CSR sponsorship** — companies fund specific events; sponsorship attribution stays subtle on the event page.
- **NGO grants** — for specific operational capabilities (translation, accessibility, regional outreach).
- **Government partnerships** — local government as event partner, not as platform funder.
- **Per-event crowdfunding** — short campaigns for high-cost events (e.g. multi-day rural cleanups requiring equipment).
- **Premium organizer tools** — *(maybe later)* — advanced analytics, recurring event templates, custom branding for established community groups. Strict rule: never paywall citizen-facing features; only operational tooling for power organizers.

---

## Anti-patterns

We will not:

- **Run ads on the platform itself.** Ad-driven incentives misalign with calm, focused community use.
- **Sell user data.** Not even aggregated, not even anonymized "research insights." If it's a hard ask, refuse it.
- **Operate as a non-profit holding company.** श्रमदान coordinates community labor; it doesn't accumulate assets to deploy on the community's behalf.
- **Take government money tied to political mandates.** Local-government event partnership is fine; budget-line funding with strings is not.
- **Hide expenditures behind "operating costs" abstractions.** Every line on the ledger names something concrete.

---

## Why this doc exists now (Phase 10 ordering)

Sustenance gets formalized *before* the public donation surfaces (Phase 5 + 6) ship — so when those surfaces appear, they are wired to a strategy, not improvised. Premature: we are not collecting donations yet. Not premature: we are designing how we *will*, and that design needs to live in writing.

---

## Related

- `../ops/00-master-roadmap.md` — Phase 5 (donation channels), Phase 6 (public ledger)
- `./02-product-plan.md` — contribution model
- `../public/philosophy.md` — transparency by default principle
- `./roles.md` *(planned in Phase 11)* — Financial Advisor Shramdan role
