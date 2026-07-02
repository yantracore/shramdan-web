# Campaign Unification — Corrections + Detail Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> This plan **supersedes** the routing parts of `2026-06-25-campaign-unification-frontend.md` (which shipped Phases 1–3 with two mistakes corrected here) and adds the deferred detail merge.

**Goal:** Fix three mistakes from the first pass (wrong route plurality, off-vocabulary status words/colours on the homepage funnel + map), enforce a single status vocabulary across the whole app, then build the unified `/campaign/[slug]` detail page.

**Verify against:** `https://api.shramdan.org/api/v1` (the working backend; staging `backend.shramdan.org` is degraded). Set `NEXT_PUBLIC_API_BASE_URL=https://api.shramdan.org/api/v1` for local runs; do **not** change the committed fallback.

## Global Constraints

- **ONE status vocabulary, no third set.** Code / data attributes / CSS names use the **backend technical status**: `OPEN DRAFT SCHEDULED ACTIVE COMPLETED PAUSED` (lower-cased for `data-status` + CSS: `open draft scheduled active completed paused`). User-facing display uses **only the chosen UI labels**: EN `Open / Planning / Scheduled / Ongoing / Complete / Paused`; NP `खुला / तयारीमा / मिति तय / चलिरहेको / सम्पन्न / रोकिएको`. **Never** introduce or keep any other word — banned: `FORMING`, `LIVE`, `Selected` / `छानिएको`, and the visual keys `planning`(as a key)`/upcoming/live/past`. (Unrelated features — live-streams, the live-events rail, "live development" — are a different domain and are OUT of scope.)
- **Route plurality:** list = **`/campaigns`** (plural, collection); single detail = **`/campaign/[slug]`** (singular, item).
- Display labels come from `campaignStatusLabel(status, language)` — the single source. No component re-defines status words.
- Colours come from `--state-<status>` CSS vars via `data-status="<status>"`. No hardcoded status hexes anywhere.
- Backend untouched (A + B already verified live on 2026-06-26). Commits: conventional prefix, task-scoped files only, never `git add -A`, local.
- Verification honesty: browser-verify each phase against api.shramdan.org; report "pending live verification" if a proof is deferred.

---

## Canonical mapping (the one table everything derives from)

| Technical (code / data-status / CSS) | UI EN | UI NP | `--state-*` var | colour |
|---|---|---|---|---|
| `open` | Open | खुला | `--state-open` | indigo `#4f5bd5` |
| `draft` | Planning | तयारीमा | `--state-draft` | amber `#d98309` |
| `scheduled` | Scheduled | मिति तय | `--state-scheduled` | teal `#176b5c` |
| `active` | Ongoing | चलिरहेको | `--state-active` | red `#e23b2e` |
| `completed` | Complete | सम्पन्न | `--state-completed` | slate `#5f7a72` |
| `paused` | Paused | रोकिएको | `--state-paused` | stone `#9a8f86` |

**Renames vs today:** `--state-planning → --state-draft`, `--state-upcoming → --state-scheduled`, `--state-live → --state-active`; `data-status` values `planning→draft`, `upcoming→scheduled`, `live→active`, `past→completed`. `open/completed/paused` keep their names.

---

# PHASE R1 — Single status vocabulary (foundation)

### Task R1.1: `campaignStatus.js` — make the visual key === the technical status

**Files:** Modify `src/lib/campaignStatus.js`; Test `scripts/checks/campaign-status.mjs`.

- Drop the `visual` indirection: in `CAMPAIGN_STATUSES`, set each `visual` to the lower-cased technical key (`OPEN→"open"`, `DRAFT→"draft"`, `SCHEDULED→"scheduled"`, `ACTIVE→"active"`, `COMPLETED→"completed"`, `PAUSED→"paused"`).
- `campaignVisualStatus(status)` now returns `status.toLowerCase()` for any known status (keep the function as the single mapping point; fallback `"scheduled"` → change fallback to `"draft"` or the literal lower-case — pick `String(status||"").toLowerCase()`).
- Labels are already correct (`campaignStatusLabel`); no label change here.

- [ ] **Step 1:** Extend `scripts/checks/campaign-status.mjs` to assert: no `"planning"|"upcoming"|"live"|"past"` substrings remain as `visual:` values in `campaignStatus.js`; `campaignVisualStatus("DRAFT")==="draft"`, `("ACTIVE")==="active"`, `("SCHEDULED")==="scheduled"`, `("COMPLETED")==="completed"`. (Import won't work — assert over source text + a tiny inline re-impl, as the existing checks do.)
- [ ] **Step 2:** Run `node scripts/checks/campaign-status.mjs` → expect FAIL.
- [ ] **Step 3:** Apply the edit (visual = technical lower-case; fallback lower-cases input).
- [ ] **Step 4:** Run → expect PASS.
- [ ] **Step 5:** Commit `refactor(campaigns): status visual key === technical status (drop planning/upcoming/live/past)`.

### Task R1.2: Rename `--state-*` vars + `data-status` values in CSS

**Files:** Modify `src/app/globals.css`, `src/styles/{home,events-split-view,campaigns,antd-dropdown,live-events-rail}.css`.

Mechanical rename across these files (search each before/after):
- `--state-planning` → `--state-draft` (incl. `-ink`), `--state-upcoming` → `--state-scheduled` (incl. `-ink`), `--state-live` → `--state-active` (incl. `-ink`). Both light + dark blocks in `globals.css`.
- `[data-status="planning"]` → `[data-status="draft"]`, `[data-status="upcoming"]` → `[data-status="scheduled"]`, `[data-status="live"]` → `[data-status="active"]`, `[data-status="past"]` → `[data-status="completed"]`.
- **Caution — `live-events-rail.css`:** only rename selectors/vars that are the campaign STATUS rail. The live-stream / "live now" eyebrow is a different concept — leave any `--state-live` that is the campaign ACTIVE colour renamed to `--state-active`, but do not touch unrelated `.live-*` class names.

- [ ] **Step 1:** `grep -rn "state-planning\|state-upcoming\|state-live\|data-status=\"\(planning\|upcoming\|live\|past\)\"" src/styles src/app/globals.css` — capture the full list.
- [ ] **Step 2:** Apply the renames file by file (var declarations in globals.css first, then every `var(--state-*)` use, then every `[data-status=...]` selector).
- [ ] **Step 3:** `grep` again — expect zero `state-planning|state-upcoming|state-live` and zero `data-status="planning|upcoming|live|past"`.
- [ ] **Step 4:** `npm run build` → expect "Compiled successfully" (CSS valid).
- [ ] **Step 5:** Commit `refactor(campaigns): rename state colour vars + data-status to technical names`.

### Task R1.3: Update every JS consumer that emits a visual `data-status` / branches on `past`

**Files:** Modify `src/app/campaign/CampaignsListClient.js`, `src/components/{EventListCard,EventPreviewPane,IssueListCard,CampaignsMap,EventMap}.js`, `src/app/events/[id]/page.js`, and any other file from the grep that passes `campaignVisualStatus(...)` into a `status=`/`data-status` prop or compares a status to `"past"|"planning"|"upcoming"|"live"`.

- Because R1.1 makes `campaignVisualStatus` return the technical key, callers that pass its result into `data-status` now emit the technical value automatically — **but** any caller that hardcodes `"live"|"past"|"upcoming"|"planning"` (e.g. `status="live"` fallback in `EventPreviewPane`, or `=== "past"` branches) must be changed to the technical value.

- [ ] **Step 1:** `grep -rn '"past"\|"planning"\|"upcoming"\|status: "live"\|status="live"\|=== "past"\|visual' src/components src/app | grep -vi livestream` — list each.
- [ ] **Step 2:** Fix each: `"live"→"active"`, `"past"→"completed"`, `"upcoming"→"scheduled"`, `"planning"→"draft"` (status contexts only; skip live-stream/live-events).
- [ ] **Step 3:** `npm run build` → "Compiled successfully".
- [ ] **Step 4:** Commit `refactor(campaigns): consumers emit/branch on technical status keys`.

### Task R1.4: Homepage activity-funnel — technical keys, canonical labels + colours, `/campaigns` links

**Files:** Modify `src/components/ActivityStatsRow.js`, `src/styles/home.css`.

- `STEPS`: keys `OPEN, FORMING, SCHEDULED, LIVE, COMPLETED` → `OPEN, DRAFT, SCHEDULED, ACTIVE, COMPLETED`. Each step's destination becomes the unified list with a status filter: `href = /campaigns?status=<STATUS>` (drop the `page: "issues"|"events"` + `param: ["show",...]` machinery; one page now). On the campaigns page itself, swap only the `status` param.
- Drop the local `COPY.steps`; render labels via `campaignStatusLabel(statusKey, language)` (DRAFT→Planning/तयारीमा, ACTIVE→Ongoing/चलिरहेको, etc.).
- `foldCounts`: rename result keys `FORMING→DRAFT`, `LIVE→ACTIVE` (logic unchanged: DRAFT = promoted issues whose event isn't yet upcoming/live; ACTIVE = live bucket).
- `home.css`: replace the hardcoded marker palette (`.step-open #d97706`, `.step-forming #7c3aed`, `.step-scheduled #2563eb`, `.step-live #e02b20`, `.step-completed #16a34a`) with the canonical `--state-*` vars keyed by the technical step class: `.activity-funnel .step-open .activity-funnel-marker { background: color-mix(in srgb, var(--state-open) 16%, var(--surface)); color: var(--state-open-ink); }` and the same pattern for `.step-draft`(→`--state-draft`), `.step-scheduled`(→`--state-scheduled`), `.step-active`(→`--state-active`), `.step-completed`(→`--state-completed`). Class names follow the JS `step-${key.toLowerCase()}` → `step-open/draft/scheduled/active/completed`.

- [ ] **Step 1:** Edit `ActivityStatsRow.js` (STEPS keys + `href`, label via `campaignStatusLabel`, `foldCounts` keys).
- [ ] **Step 2:** Edit `home.css` funnel marker rules to use `--state-*` (and `step-forming→step-draft`, `step-live→step-active`).
- [ ] **Step 3:** `grep -n "FORMING\|step-forming\|step-live\|/issues?status\|/events?show" src/components/ActivityStatsRow.js src/styles/home.css` → expect none.
- [ ] **Step 4:** `npm run build` → "Compiled successfully".
- [ ] **Step 5:** Commit `fix(home): activity-funnel uses canonical status labels + colours + /campaigns links`.

### Task R1.5: IssueStatusTimeline — drop FORMING/LIVE, use technical keys + canonical labels

**Files:** Modify `src/components/IssueStatusTimeline.js`.

- `STEP_KEYS`: `["OPEN","FORMING","SCHEDULED","LIVE","COMPLETED"]` → `["OPEN","DRAFT","SCHEDULED","ACTIVE","COMPLETED"]`; rename `STEP_ICONS` keys to match.
- Replace the local `STEP_COPY.steps` words with `campaignStatusLabel(key, language)` (so DRAFT→Planning/तयारीमा, ACTIVE→Ongoing/चलिरहेको). Keep `cancelledNote`.
- `resolveStepIndex`: the `EVENT_SCHEDULED` issue-status mapping stays, but its returned indices now point at DRAFT/ACTIVE steps (same positions). Verify the PAUSED→index-3 (active) branch still lands on the ACTIVE step.

- [ ] **Step 1:** Edit keys + labels-from-source.
- [ ] **Step 2:** `grep -n "FORMING\|LIVE\|छानिएको\|Selected" src/components/IssueStatusTimeline.js` → none.
- [ ] **Step 3:** `npm run build` → ok.
- [ ] **Step 4:** Commit `refactor(campaigns): timeline uses technical keys + canonical labels`.

### Task R1.6: Map infowindow — use canonical `campaignStatusLabel` (incl. Planning)

**Files:** Modify `src/components/EventMap.js` (infowindow status label) and/or `src/lib/siteContent.js` (the `map.statusLabels` dicts).

- The map infowindow currently labels a marker's status from `siteContent` `map.statusLabels { live, upcoming, past }` — missing `draft`(Planning) and `open`. Repoint the infowindow to `campaignStatusLabel(status, language)` (status already the technical key after R1.3), which covers all six incl. Planning=तयारीमा. Remove the now-dead `map.statusLabels` status entries (or leave them unused if other non-status copy shares the block — verify).

- [ ] **Step 1:** Find where the infowindow renders the status word in `EventMap.js`; switch it to `campaignStatusLabel(<technical status>, language)`.
- [ ] **Step 2:** Confirm a DRAFT marker now shows "तयारीमा / Planning" (browser, Task V).
- [ ] **Step 3:** `npm run build` → ok.
- [ ] **Step 4:** Commit `fix(map): infowindow status label from the single source (adds Planning/Open)`.

---

# PHASE R2 — Route plurality correction

### Task R2.1: Move the list back to `/campaigns`; reserve `/campaign/[slug]` for detail

**Files:** `git mv src/app/campaign → src/app/campaigns`; Modify `src/app/campaigns/CampaignsListClient.js` (router URLs `/campaign`→`/campaigns`); Modify `next.config.mjs`.

- `git mv src/app/campaign src/app/campaigns` (restores the plural list route).
- In `CampaignsListClient.js`, the 3 router URLs `/campaign` → `/campaigns`.
- `next.config.mjs` redirects:
  - `/issues → /campaigns`, `/events → /campaigns` (list).
  - **Remove** `/campaigns → /campaign`.
  - Add detail redirects (these only resolve once R5 ships the detail page): `/issues/:slug → /campaign/:slug`, `/events/:slug → /campaign/:slug`. **Order matters** — put the `:slug` rules so they don't shadow `/issues`/`/events` or `/issues/new`; exclude `/issues/new` (keep it). Use distinct `source` patterns: `/issues/:slug`, `/events/:slug`.
  - Bare `/campaign` (no slug) → `/campaigns`.

- [ ] **Step 1:** `git mv`; fix the 3 router URLs; rewrite the redirects block.
- [ ] **Step 2:** `grep -rn '"/campaign"\|/campaign?\|app/campaign\b' src` → only `/campaign/[slug]` detail refs (none yet) should remain; the list is `/campaigns`.
- [ ] **Step 3:** `npm run build` → ok; `/campaigns` in the route manifest.
- [ ] **Step 4:** Commit `fix(routing): list stays plural /campaigns; /campaign reserved for single detail`.

### Task R2.2: Re-point list-level links to `/campaigns` (revert the wrong singular sweep)

**Files:** the Phase-3 sweep set — `MobileBottomNav.js`, `SiteShell.js`, `CommandPalette.js`, `not-found.js`, `OnboardingSpotlight.js`, `EventsHomeRail.js`, `signup/page.js`, `app/page.js`, `impact/page.js`, `ImpactPulseStrip.js`, `StreamList.js`, `sitemap.js`, `me/saved/page.js`, `QuickActionFab.js`, plus the detail back-links in `issues/[id]/page.js` + `events/[id]/page.js`.

- Every **list** link `/campaign` (and `/campaign?status=…`) → `/campaigns` (and `/campaigns?status=…`). The status-param links from `ImpactPulseStrip` stay (`/campaigns?status=ACTIVE` etc.).
- Detail back-links (`issues/[id]`, `events/[id]`) → `/campaigns` (back to list).

- [ ] **Step 1:** `grep -rn 'href[=:].\{0,4\}["'"'"'`]/campaign\b' src` → list every `/campaign` (non-slug) link.
- [ ] **Step 2:** Change each to `/campaigns` (preserve any `?status=` query).
- [ ] **Step 3:** `grep -rn '/campaign\b' src` → only `/campaigns` + (later) `/campaign/[slug]`; no bare `/campaign` list links.
- [ ] **Step 4:** `npm run build` → ok.
- [ ] **Step 5:** Commit `fix(routing): list links point at /campaigns (plural)`.

---

# PHASE R3 — Verify corrections in the browser (api.shramdan.org)

### Task R3.1: Browser-verify vocabulary + routing + funnel + map

- [ ] Run dev: `NEXT_PUBLIC_API_BASE_URL=https://api.shramdan.org/api/v1 npm run dev` (port 7777).
- [ ] `/campaigns` 200; `/issues`,`/events` → 307 `/campaigns`; bare `/campaign` → 307 `/campaigns`.
- [ ] Playwright `browser_evaluate`: campaign chips + filter dropdown carry `data-status="open|draft|scheduled|active|completed"` and badge/dot colours match `--state-*` (no `planning|upcoming|live|past` in the DOM).
- [ ] Home funnel: 5 markers coloured from `--state-*` (indigo/amber/teal/red/slate), labels Open/Planning/Scheduled/Ongoing/Complete, links `/campaigns?status=…`. No orange/purple/blue/green.
- [ ] Map: a DRAFT marker's infowindow shows "तयारीमा / Planning".
- [ ] Report results; fix any miss before Phase 4.

---

# PHASE 4 — Unified `/campaign/[slug]` detail page

### Task 4.1: Resolver + route skeleton

**Files:** Create `src/app/campaign/[slug]/page.js` (+ `layout.js` for metadata).

- Canonical id = the **issue slug**. `/campaign/[slug]` fetches `GET /issues/{slug}`.
  - status `OPEN` → render the OPEN zone (support/vote).
  - promoted (`EVENT_DRAFT` / `EVENT_SCHEDULED`) → read the embedded `issue.event` (verified live: `{ id, slug, status, scheduledAt, leaderId }`) via `getIssueEventId()`, fetch `GET /events/{event.slug}`, render event zones by the event's status.
- Old detail routes stay as files but redirect (R2.1): `/issues/:slug`,`/events/:slug` → `/campaign/:slug`. For an event-origin slug, resolve `event.linkedIssueId`'s slug for the canonical URL.

- [ ] Steps: scaffold route → resolver (issue-first, event via embed) → loading/404 states → commit.

### Task 4.2: Compose zones by status (map always; reuse existing components)

- **Map** — visible in every status (campaign always has a location).
- `OPEN` → support/vote + conversion progress + `ParticipantsPanel`.
- `DRAFT/SCHEDULED/ACTIVE` → roster/join (`ParticipantsPanel`, gated by `eventJoinPhase`) + schedule.
- `COMPLETED` → recap / before-after / testimonials (no join).
- `PAUSED` → "रोकिएको / Paused" banner + read-only roster.
- Reuse the existing issue/event detail bodies' sub-components; do not duplicate.

- [ ] Steps per zone; commit per coherent group.

### Task 4.3: Unify card + preview into one campaign component (optional sub-phase 4b)

- `IssueListCard`+`EventListCard` → one `CampaignCard`; `IssuePreviewPane`+`EventPreviewPane` → one pane. **Caution:** these files carry pre-existing working-tree WIP — coordinate before editing; may defer.

### Task 4.4: Browser-verify the detail page (api.shramdan.org)

- [ ] Drive `/campaign/[slug]` for an OPEN issue, a promoted (event-stage) campaign, and a COMPLETED one; assert correct zones, status colour, label, map, and join gating. Assert `/issues/:slug` + `/events/:slug` 307 to `/campaign/:slug`.

---

## Self-review

- **Routing:** R2 restores `/campaigns` (list) + `/campaign/[slug]` (detail) with the correct redirects + link plurality. ✅
- **Vocabulary:** R1.1–R1.6 remove `FORMING/LIVE/Selected` + visual keys `planning/upcoming/live/past`; everything keys on technical `open/draft/scheduled/active/completed/paused`; display via `campaignStatusLabel`. ✅
- **Funnel:** R1.4 — canonical labels + `--state-*` colours + `/campaigns?status=` links. ✅
- **Map:** R1.6 — infowindow via `campaignStatusLabel` (adds Planning/Open). ✅
- **Detail merge:** Phase 4 — `/campaign/[slug]`, backend A consumed. ✅
- **Scope guard:** live-streams / live-events-rail / "live development" are explicitly excluded from the `live` rename. ✅
- **Placeholder scan:** the CSS/JS renames give exact from→to mappings + grep gates; no TBD.
