# Campaign Unification — Design Spec

- **Date:** 2026-06-25
- **Status:** Approved (design). Backend-dependent work deferred until the backend is reachable again.
- **Owner:** Frontend (the project lead) + श्रमेश. Backend handoff items go to Pranish.
- **Supersedes/extends:** `docs/design/06-state-color-system.md`, the partial `/campaigns` unification, and `docs/superpowers/specs/2026-06-24-status-gated-inline-join-design.md`.

---

## Implementation status (updated 2026-06-25)

Plan: `docs/superpowers/plans/2026-06-25-campaign-unification-frontend.md`.

- ✅ **Phase 1 — status model** (§4, §6): labels relabelled (Scheduled/Ongoing/Complete; मिति तय/चलिरहेको), PAUSED added as a detail-only state, PAUSED no-join fix, `--state-paused` colour. Verified: node assertions (`scripts/checks/campaign-status.mjs`) + production compile + browser (labels render at `/campaign`).
- ✅ **Phase 2 — colour propagation** (§5): filter chips + dropdown now carry per-status colour. **Browser-verified** via computed-style read — every chip badge ink + every dropdown dot matches its canonical `--state-*` hex (the "orange for everything" complaint is resolved).
- ✅ **Phase 3 — routing** (§8.1, §8.4): `/campaigns`→`/campaign` (singular) + 307 redirects from `/campaigns`,`/issues`,`/events`; mobile nav merged to one अभियान tab; desktop nav, command palette, 404, onboarding, FAB, sitemap, dashboard, impact, and detail back-to-list links all target `/campaign`. Browser-verified (route 200, redirects 307, single nav tab).
- ✅ **Phase 0 (docs half)**: backend asks A (issue→event link, already P1 #2) + B (SCHEDULED=WORKER-only enforce, new) recorded in `docs/api-requirements/{00-OUTSTANDING,event-participants}.md`.
- ⏸️ **Phase 4 — unified `/campaign/[id]` detail merge** — DEFERRED, hard-blocked on backend item A.
- ⏸️ **Backend A/B verification** — DEFERRED, backend unreachable (staging down + last devtunnel rotated). Needs the current devtunnel URL.
- ⏭️ **Open decisions:** map-pin label wording (keep "LIVE"/"अहिले लाइभ" punchy vs unify to चलिरहेको) — user's call. Cards/pane unification left (entangled with pre-existing working-tree WIP).
- 🐞 **Out-of-scope blocker found:** `next build` fails prerendering `/` (`useSearchParams` needs a Suspense boundary, Next 16) — pre-existing, unrelated to this work, but blocks production deploy.

All commits are local on branch `stage` (not pushed), per the project's local-only commit rule.

---

## 1. Goal & principles

Issues and events are **one entity: a "campaign"** — a single continuum from a reported problem
(issue, gathering votes) to a finished cleanup (event, completed). The words "issue" and "event"
disappear from the **UI**; they survive only as backend/storage/technical vocabulary.

Principles:
- **One vocabulary.** Status, label, colour, and joinability each come from **one source of truth**;
  no surface hardcodes its own.
- **Unify in the frontend.** The backend stays two resources (issues + events) linked one-way
  (`event.linkedIssueId`). The frontend bridges them. (Per the issue↔event convergence ADR.)
- **No regressions, no redo.** This spec is the authoritative reference so implementation is
  unambiguous and we do not repeat this alignment step.

---

## 2. Current state (grounded facts as of 2026-06-25)

What **already exists** (do not rebuild):
- **Single colour source** — `--state-*` CSS variables in `src/app/globals.css` (`:root` lines 37–46,
  dark `:root[data-theme="dark"]` 69–78), plus the design doc `docs/design/06-state-color-system.md`.
  Cards/pills/spines colour by a `data-status` attribute, not hardcoded hex.
- **Single participants component** — `src/components/ParticipantsPanel.js` is reused identically in
  the modal **and** the detail body, on both issue and event surfaces, and reflows columns by width
  (`repeat(auto-fit, minmax(320px,1fr))`, collapses < 620px). No issue-vs-event branching inside it.
- **Single status map** — `src/lib/campaignStatus.js` (`CAMPAIGN_STATUSES`, `CAMPAIGN_STATUS_LABELS`,
  `CAMPAIGN_STATUS_SEQUENCE`, `campaignStatusLabel`, `campaignVisualStatus`, `campaignStatusKind`).
- **Status→role join gating** — `eventJoinPhase()` in `src/lib/issueActions.js` already implements
  SCHEDULED/ACTIVE = WORKER-only, COMPLETED/CANCELLED = no-join.
- **Partial routing unification** — `/campaigns` (plural) list exists (`CampaignsListClient`,
  `CampaignsMap`, `useCampaignFeed`, `useCampaignCounts`). **No `/campaigns/[id]` detail.** Detail
  still lives at `/issues/[id]` and `/events/[id]`.
- **Forward link already consumed** — `getIssueEventId(issue)` in `issueActions.js` already reads
  `issue.eventId | issue.event.slug | issue.event.id | issue.eventSlug`, so the unified join CTA wires
  itself up automatically **the moment the backend ships the issue→event link** (backend item A).

Gaps this spec closes: PAUSED missing everywhere; labels scattered/drifted across three files;
status filter tabs/badges + filter dropdown use brand colour instead of status colour; detail pages
not merged; route is plural `/campaigns` not singular `/campaign`.

---

## 3. The unified Campaign model (single source of truth)

| Backend status   | Campaign   | UI (EN)   | UI (NP)     | Colour (light hex)        | Who can join   | Show progress | In filter/pills? |
|------------------|-----------|-----------|-------------|---------------------------|----------------|---------------|------------------|
| `ISSUE.OPEN`     | OPEN      | Open      | खुला        | indigo `#4f5bd5`          | all roles      | yes           | **yes**          |
| `EVENT.DRAFT`    | DRAFT     | Planning  | तयारीमा     | amber `#d98309`           | all roles      | yes           | **yes**          |
| `EVENT.SCHEDULED`| SCHEDULED | Scheduled | मिति तय     | teal `#176b5c` (=brand)   | WORKER only    | yes           | **yes**          |
| `EVENT.ACTIVE`   | ACTIVE    | Ongoing   | चलिरहेको    | red `#e23b2e`             | WORKER only    | yes           | **yes**          |
| `EVENT.COMPLETED`| COMPLETED | Complete  | सम्पन्न     | slate-green `#5f7a72`     | no one         | no            | **yes**          |
| `EVENT.PAUSED`   | PAUSED    | Paused    | रोकिएको     | **stone-grey `#9a8f86`**  | no one         | yes           | **NO — detail-only** |

**PAUSED is circumstantial.** It is shown **only on a campaign's detail page** when that campaign is
currently paused (rare). It must **never** appear as a filter tab, a status chip in any list/rail, or a
card pill. It still needs a label, a colour, and join-gating for the detail surface.

The five filterable statuses (OPEN, DRAFT, SCHEDULED, ACTIVE, COMPLETED) are unchanged in count and
order; only their **labels** change (see §4).

---

## 4. Status taxonomy & labels — exact changes to `src/lib/campaignStatus.js`

4.1 **Re-label the five filterable statuses** (EN + NP) in `CAMPAIGN_STATUS_LABELS`:

| status    | EN: from → to            | NP: from → to            |
|-----------|--------------------------|--------------------------|
| OPEN      | Open → Open (unchanged)  | खुला → खुला (unchanged)  |
| DRAFT     | Planning → Planning      | तयारीमा → तयारीमा        |
| SCHEDULED | **Upcoming → Scheduled** | **आउँदै → मिति तय**      |
| ACTIVE    | **Live → Ongoing**       | **लाइभ → चलिरहेको**      |
| COMPLETED | **Completed → Complete** | सम्पन्न → सम्पन्न        |

4.2 **Add PAUSED as a known status but keep it out of the sequence.**
- Add to `CAMPAIGN_STATUSES`: `PAUSED: { key: "PAUSED", kind: "event", visual: "paused" }`.
- Add to `CAMPAIGN_STATUS_LABELS`: np `रोकिएको`, en `Paused`.
- **Do NOT add PAUSED to `CAMPAIGN_STATUS_SEQUENCE`.** Because `CAMPAIGN_FILTER_VALUES` and the chip
  row both derive from the sequence, this keeps PAUSED out of every filter/pill automatically, while
  `campaignStatusLabel("PAUSED", …)` and `campaignVisualStatus("PAUSED")` still resolve for the
  detail page.

4.3 **Consolidate the scattered label sets.** `src/components/IssueStatusTimeline.js` and the event
status labels in `src/lib/siteContent.js` currently define their own EN/NP strings that drift from
the above. Point them at `campaignStatusLabel()` (the single source) instead of redefining. Keep the
timeline's distinct *journey* node names only where they are genuinely a different concept; status
words must come from `campaignStatus.js`.

4.4 **Note on visual keys (intentional, documented).** The `visual` field keeps its historical names
(`open | planning | upcoming | live | past`) decoupled from the status name. A label change does NOT
touch CSS because CSS keys on `data-status="<visual>"`. PAUSED introduces a new visual key `paused`.
A future rename of visual keys to match status names is **out of scope** (logged as known debt).

---

## 5. Colour system — exact changes + propagation

5.1 **Add the PAUSED colour to `src/app/globals.css`.**
- `:root` (light): `--state-paused: #9a8f86; --state-paused-ink: #5f574e;`
- `:root[data-theme="dark"]`: `--state-paused: #b3aaa0; --state-paused-ink: #e2dcd5;`
- Add a `data-status="paused"` rule to every surface ruleset that already switches on `data-status`
  (status pill, detail status chip), using `--state-paused` / `--state-paused-ink`.

5.2 **`campaignVisualStatus()` must cover all six.** With PAUSED in `CAMPAIGN_STATUSES` (§4.2),
`campaignVisualStatus("PAUSED")` returns `"paused"`. Keep the `|| "upcoming"` fallback only as a
last-resort guard; it must never be the path PAUSED takes.

5.3 **Propagate status colour to the surfaces that currently use the brand colour.** Single source
stays `--state-*` keyed by `data-status`. Fix:

| Surface | File (approx) | Now | Change to |
|---|---|---|---|
| Campaigns status rail — active tab highlight | `src/styles/campaigns.css` (~7–104) | `--primary` (brand) | the active status's `--state-*` |
| Campaigns status rail — per-status count badge | `src/styles/campaigns.css` (~58–79) | `--muted` / `--primary` | that status's `--state-*` |
| Status **filter dropdown** options (Ant Select) | locate in `CampaignsListClient` / filter component + `src/styles/antd-dropdown.css` | no per-status colour | a per-option status-colour dot keyed on visual status |

5.4 **Already correct, leave as-is (just confirm PAUSED rule reaches the detail surface):** home
status reel/rail, thumbnails (home portrait, campaigns rectangular, map small), small status tags.

5.5 **"Orange everywhere" reconciliation.** Static reads show list cards/pills are correctly
status-coloured; the brand-colour tabs/badges/filter dropdown in 5.3 are the likely surfaces the user
perceived as wrong. This MUST be confirmed in a real browser once data is available — do not close it
on a code read alone.

---

## 6. Joinability gating — exact change to `src/lib/issueActions.js`

`eventJoinPhase()` currently lets PAUSED fall through to the `default` branch
(`roleScope: null, joinable: true` = **all roles joinable** — a correctness bug vs the model). Add an
explicit case **before** `default`:

```js
case "PAUSED":
  return { label: "paused", roleScope: [], joinable: false };
```

SCHEDULED and ACTIVE remain WORKER-only; COMPLETED/CANCELLED remain no-join. **No frontend change to
SCHEDULED gating** — the frontend already matches the chosen model (WORKER-only). The
backend currently allows all roles at SCHEDULED; aligning it is backend item B (deferred, §9).

---

## 7. Participants component

`ParticipantsPanel` already satisfies the "one component, modal + body, reflow by width" requirement.
The only change is behavioural and comes for free from §6: at PAUSED the panel renders read-only
(`joinable: false`, `roleScope: []`) **but still shows the progress** (PAUSED = show-progress: yes).
No structural refactor of the panel.

---

## 8. Routing & detail-page merge

8.1 **Routes**
- `/campaign` — list. Rename the `/campaigns` directory; keep `CampaignsListClient`, `CampaignsMap`,
  `useCampaignFeed`, `useCampaignCounts`.
- `/campaign/[id]` — **new** unified detail (merges `/issues/[id]` + `/events/[id]`).
- `/issues`, `/issues/[id]`, `/events`, `/events/[id]` → **301 redirect** into `/campaign…`.

8.2 **Canonical identity = the originating issue (`issueSlug`).** Every event has `linkedIssueId`;
issues have no event id until backend A ships. So the campaign's stable, lifetime URL is
`/campaign/[issueSlug]`:
- Load `/campaign/[issueSlug]` → fetch the issue.
  - status `OPEN` → render the **OPEN zone** (support/vote + conversion progress + ParticipantsPanel).
  - promoted → resolve the linked event via `getIssueEventId(issue)` and render the **event zones**.
- Old `/events/[eventSlug]` → resolve `linkedIssueId` → 301 to `/campaign/[issueSlug]`.
- **The forward resolve (issue → its event) depends on backend item A** (§9). Until A ships, the
  detail-merge phase (Phase 4) stays deferred; the current district-match workaround is not trusted
  at scale.

8.3 **Detail zones by status** (one page, conditional zones):
- **Map** — visible in **all** statuses (a campaign always has a location). Universal zone.
- OPEN → support/vote + conversion progress + roster.
- DRAFT / SCHEDULED / ACTIVE → roster/join + schedule.
- COMPLETED → recap / before-after / testimonials (no join).
- PAUSED → "रोकिएको / Paused" banner + read-only roster (no join, progress shown).

8.4 **Navigation & components**
- `src/components/MobileBottomNav.js` — merge the separate "Events" + "Issues" tabs into one
  **"अभियान / Campaign"** tab → `/campaign`.
- Update all internal hrefs to `/issues*` and `/events*` (~28 occurrences across ~13 files: app/app,
  signup, not-found, impact, OnboardingSpotlight, EventsHomeRail, EventsListClient, IssuesListClient,
  CampaignsListClient, card/preview components, and the detail back-links).
- Unify cards: `IssueListCard` + `EventListCard` → one `CampaignCard`; `IssuePreviewPane` +
  `EventPreviewPane` → one pane. Both already colour via `data-status`.
- `/issues/new` route stays; its UI entry label stays "समस्या रिपोर्ट / Report a problem" (the natural
  start of a campaign).

---

## 9. Backend dependencies (DEFERRED — backend currently unreachable)

Both `backend.shramdan.org` (staging) and the last known devtunnel are unreachable as of 2026-06-25
(`http=000`). These items are **not started**; they need a live backend to verify/implement.

| # | Item | Why | Status |
|---|---|---|---|
| **A** | `GET /issues/{id}` returns the linked event (`issue.event { id, slug, status, scheduledAt, leaderId }`) or `GET /events?issueId=` | Unblocks `/campaign/[id]` forward resolve + join CTA; retires district-match workaround | **P1 — gates Phase 4. Verify if already done (backend dev says 1–2 items shipped).** |
| **B** | `POST /events/{id}/participants` rejects non-WORKER at SCHEDULED (like ACTIVE) | The chosen model is WORKER-only at SCHEDULED; backend currently allows all roles → drift | **P1 — verify if already done.** |
| ~~C~~ | ~~PAUSED in the feed~~ | **DROPPED** — PAUSED is detail-only (§3), never in the feed | n/a |

**To resume backend verification:** the current devtunnel URL (or staging back up). Then fetch a fresh
`api-docs.json`, inspect the `GET /issues/{id}` response shape (item A) and the
`POST /events/{id}/participants` description (item B), and hand Pranish the **reduced remaining list**.
Update `docs/api-requirements/{issues,events,event-participants}.md` in the same session.

---

## 10. Phasing

**Backend-independent — do now (this is the current scope):**
- **Phase 1 — Status model single source** (`campaignStatus.js`, `issueActions.js`): re-label five
  statuses (§4.1), add PAUSED as known-but-unfiltered (§4.2), consolidate scattered labels (§4.3),
  add PAUSED join case (§6). Add `--state-paused` vars + `data-status="paused"` rules (§5.1–5.2).
- **Phase 2 — Colour propagation** (§5.3): status rail active-tab + count badge + filter dropdown →
  status colour. Confirm the "orange" surface is resolved (§5.5, browser when data available).
- **Phase 3 — Routing rename + redirects** (§8, excluding the detail merge): `/campaigns` → `/campaign`,
  301 redirects for old routes, update ~28 internal hrefs, merge mobile nav tab, ensure list/map show
  the five statuses (map universal). Card/pane unification may ride here or split into 3b.

**Deferred — needs a live backend:**
- **Phase 0 — Backend handoff & docs** (items A, B; update api-requirements).
- **Phase 4 — Unified `/campaign/[id]` detail merge** (§8.2–8.3) — gated on backend A.

Phases 1→2→3 are independently shippable in order. Phase 4 is the only piece that hard-depends on the
backend; Phase 3 deliberately stops short of the detail merge so all of Phases 1–3 ship without it.

---

## 11. Verification strategy (backend-down constraint)

The "verify in a real browser before done" rule still holds, but live data is currently unavailable.
So:
- **Pure logic (Phase 1):** a one-off `node` assertion script (this repo has no unit-test framework)
  asserting, for each status, the exact label (EN+NP), visual key, colour var name, and
  `eventJoinPhase` result — including PAUSED no-join and PAUSED absent from `CAMPAIGN_STATUS_SEQUENCE`.
- **Build & lint:** `npm run build` + `npm run lint` must pass after each phase.
- **Visual (Phases 2–3):** verify against **mocked/seeded** component state where feasible; **full
  live-data browser sign-off is deferred** until the backend returns. Any phase whose visual proof is
  deferred is reported as "implemented, pending live visual verification" — never as "done".
- Commit per phase (conventional prefix, task-scoped files only; local, no push).

---

## 12. Risks, non-goals, open items

- **Risk:** PAUSED leaking into a list/filter. Mitigated by keeping it out of `CAMPAIGN_STATUS_SEQUENCE`
  and asserting its absence in the Phase 1 test.
- **Risk:** label change silently breaking a surface that string-matches old labels. Mitigation:
  grep for literal "Upcoming"/"Live"/"Completed"/"आउँदै"/"लाइभ" before/after and route all through
  `campaignStatusLabel()`.
- **Risk:** route rename breaking deep links / SEO. Mitigation: 301 redirects + update sitemap/robots;
  fix the events breadcrumb that currently says "Issues".
- **Non-goals:** merging issue/event in the backend; renaming `--state-*` visual keys to status names;
  gamification surfaces; the live-stream feature.
- **Open (needs backend):** verify A & B are already shipped; confirm exact `issue.event` shape.
