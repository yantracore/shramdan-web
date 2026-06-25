# Campaign Unification (Frontend, Phases 1–3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the backend-independent half of the issue/event→"campaign" unification: one status taxonomy (6 states, incl. PAUSED) with consolidated EN/NP labels, status-colour propagated to every surface, and singular `/campaign` routing — without touching the backend or the deferred detail-page merge.

**Architecture:** Single source of truth stays `src/lib/campaignStatus.js` (status→label→visual) + `--state-*` CSS variables keyed by a `data-status` attribute. Join gating stays `eventJoinPhase()` in `src/lib/issueActions.js`. The unified list already lives at `/campaigns`; we re-label, colour the lagging surfaces, and rename the route to singular `/campaign`. Detail pages (`/issues/[id]`, `/events/[id]`) are LEFT AS-IS (their merge is Phase 4, backend-gated).

**Tech Stack:** Next.js App Router (React, "use client"), Ant Design (`Segmented`, `Select`), plain-JS ESM libs, CSS variables. No unit-test framework — pure changes are checked with a one-off `node` assertion over source content; integration is `npm run build` + `npm run lint`; live-data browser sign-off is deferred until the backend is reachable.

## Global Constraints

- **Reference spec:** `docs/superpowers/specs/2026-06-25-campaign-unification-design.md` — every task's requirements implicitly include it.
- **Backend untouched.** No new API field, endpoint, or contract change. Items A/B in the spec §9 are deferred.
- **Detail pages untouched.** Do NOT redirect or delete `/issues/[id]`, `/events/[id]`, `/issues/new`. Only list-level routing changes here.
- **Canonical model (spec §3):** OPEN=Open/खुला/indigo `#4f5bd5` · DRAFT=Planning/तयारीमा/amber `#d98309` · SCHEDULED=Scheduled/मिति तय/teal `#176b5c` · ACTIVE=Ongoing/चलिरहेको/red `#e23b2e` · COMPLETED=Complete/सम्पन्न/slate `#5f7a72` · PAUSED=Paused/रोकिएको/stone-grey `#9a8f86` (**detail-only, never in filter/pills**).
- **Join gating:** OPEN/DRAFT=all roles · SCHEDULED/ACTIVE=WORKER only · COMPLETED/PAUSED=no join.
- **Copy rules:** EN buttons/CTAs Title Case; NP clickable labels use action form; brand in NP is always श्रमदान. Status labels here are nouns/adjectives, not buttons.
- **Commits:** conventional prefix, task-scoped files only (never `git add -A`), local only (no push).
- **Verification honesty:** any task whose visual proof is deferred is reported "implemented, pending live visual verification," never "done."

---

## File Structure

| File | Responsibility | Phase |
|---|---|---|
| `src/lib/campaignStatus.js` | status taxonomy, EN/NP labels, visual map, sequence | 1 |
| `src/lib/issueActions.js` | `eventJoinPhase()` join gating | 1 |
| `src/app/globals.css` | `--state-*` colour variables | 1 |
| `src/components/IssueStatusTimeline.js` | journey timeline — must read labels from campaignStatus | 1 |
| `src/lib/siteContent.js` | event status labels — must not drift from campaignStatus | 1 |
| `src/styles/campaigns.css` | status chip row (active tab + count badge) | 2 |
| `src/app/campaigns/CampaignsListClient.js` | chip/dropdown render; intro prose | 2, 3 |
| `src/styles/antd-dropdown.css` | status filter dropdown option dot | 2 |
| `src/app/campaigns/**` → `src/app/campaign/**` | route rename to singular | 3 |
| `next.config.mjs` | list redirects → singular destination | 3 |
| `src/components/MobileBottomNav.js` | merge Events+Issues tab → one Campaign tab | 3 |
| various (list-level hrefs) | point list links at `/campaign` | 3 |

`scripts/checks/campaign-status.mjs` (new, kept) holds the Phase-1 node assertions.

---

# PHASE 1 — Status model single source of truth

### Task 1.1: Re-label statuses + add PAUSED (known-but-unfiltered) in `campaignStatus.js`

**Files:**
- Modify: `src/lib/campaignStatus.js`
- Test: `scripts/checks/campaign-status.mjs` (create)

**Interfaces:**
- Produces: `CAMPAIGN_STATUSES.PAUSED = { key:"PAUSED", kind:"event", visual:"paused" }`; `CAMPAIGN_STATUS_LABELS.{np,en}.PAUSED`; relabelled SCHEDULED/ACTIVE/COMPLETED. `CAMPAIGN_STATUS_SEQUENCE` UNCHANGED (5 entries, no PAUSED).

- [ ] **Step 1: Write the failing assertion test**

Create `scripts/checks/campaign-status.mjs`:

```js
// One-off source-content assertions for the campaign status model. Run with:
//   node scripts/checks/campaign-status.mjs
// (The lib modules use the Next "@/" alias-free pure-ESM style but the repo is
//  not type:module, so we assert over source text rather than importing.)
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => readFile(resolve(root, p), "utf8");
let failures = 0;
const ok = (cond, msg) => { if (!cond) { failures++; console.error("FAIL:", msg); } };

const cs = await read("src/lib/campaignStatus.js");

// EN labels re-mapped
ok(/SCHEDULED:\s*"Scheduled"/.test(cs), 'EN SCHEDULED label is "Scheduled"');
ok(/ACTIVE:\s*"Ongoing"/.test(cs), 'EN ACTIVE label is "Ongoing"');
ok(/COMPLETED:\s*"Complete"/.test(cs), 'EN COMPLETED label is "Complete"');
ok(!/"Upcoming"|"Live"|"Completed"/.test(cs), "no stale EN labels (Upcoming/Live/Completed)");
// NP labels re-mapped
ok(/SCHEDULED:\s*"मिति तय"/.test(cs), "NP SCHEDULED label is मिति तय");
ok(/ACTIVE:\s*"चलिरहेको"/.test(cs), "NP ACTIVE label is चलिरहेको");
ok(!/"आउँदै"|"लाइभ"/.test(cs), "no stale NP labels (आउँदै/लाइभ)");
// PAUSED present as a known status + label, but NOT in the sequence
ok(/PAUSED:\s*\{\s*key:\s*"PAUSED",\s*kind:\s*"event",\s*visual:\s*"paused"\s*\}/.test(cs),
  "PAUSED entry in CAMPAIGN_STATUSES with visual paused");
ok(/PAUSED:\s*"रोकिएको"/.test(cs) && /PAUSED:\s*"Paused"/.test(cs), "PAUSED labels np+en");
const seqMatch = cs.match(/CAMPAIGN_STATUS_SEQUENCE\s*=\s*\[([\s\S]*?)\]/);
ok(seqMatch && !/PAUSED/.test(seqMatch[1]), "CAMPAIGN_STATUS_SEQUENCE does NOT contain PAUSED");

if (failures) { console.error(`\n${failures} assertion(s) failed.`); process.exit(1); }
console.log("campaign-status checks passed.");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/checks/campaign-status.mjs`
Expected: FAIL (e.g. `FAIL: EN SCHEDULED label is "Scheduled"`), exit 1.

- [ ] **Step 3: Apply the source edits to `src/lib/campaignStatus.js`**

In `CAMPAIGN_STATUSES`, add the PAUSED entry after COMPLETED:

```js
export const CAMPAIGN_STATUSES = {
  OPEN: { key: "OPEN", kind: "issue", visual: "open" },
  DRAFT: { key: "DRAFT", kind: "event", visual: "planning" },
  SCHEDULED: { key: "SCHEDULED", kind: "event", visual: "upcoming" },
  ACTIVE: { key: "ACTIVE", kind: "event", visual: "live" },
  COMPLETED: { key: "COMPLETED", kind: "event", visual: "past" },
  // PAUSED is circumstantial — shown only on a campaign's detail page when it is
  // paused. Deliberately ABSENT from CAMPAIGN_STATUS_SEQUENCE so it never appears
  // as a filter chip / pill, while its label + visual still resolve for detail.
  PAUSED: { key: "PAUSED", kind: "event", visual: "paused" }
};
```

Replace `CAMPAIGN_STATUS_LABELS` with the relabelled set + PAUSED:

```js
export const CAMPAIGN_STATUS_LABELS = {
  np: {
    all: "सबै",
    OPEN: "खुला",
    DRAFT: "तयारीमा",
    SCHEDULED: "मिति तय",
    ACTIVE: "चलिरहेको",
    COMPLETED: "सम्पन्न",
    PAUSED: "रोकिएको"
  },
  en: {
    all: "All",
    OPEN: "Open",
    DRAFT: "Planning",
    SCHEDULED: "Scheduled",
    ACTIVE: "Ongoing",
    COMPLETED: "Complete",
    PAUSED: "Paused"
  }
};
```

Leave `CAMPAIGN_STATUS_SEQUENCE`, `CAMPAIGN_FILTER_VALUES`, and the functions unchanged. Update the file's top comment line that reads `खुला (OPEN) -> ... -> सम्पन्न (COMPLETED)` only if it names old labels (आउँदै/लाइभ) — change to `मिति तय … चलिरहेको` for accuracy.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/checks/campaign-status.mjs`
Expected: `campaign-status checks passed.`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/campaignStatus.js scripts/checks/campaign-status.mjs
git commit -m "feat(campaigns): relabel statuses + add PAUSED as detail-only state"
```

---

### Task 1.2: Add PAUSED join case in `eventJoinPhase()`

**Files:**
- Modify: `src/lib/issueActions.js:44-57`
- Test: `scripts/checks/campaign-status.mjs` (extend)

**Interfaces:**
- Consumes: nothing new.
- Produces: `eventJoinPhase("PAUSED") === { label:"paused", roleScope:[], joinable:false }`.

- [ ] **Step 1: Extend the failing test**

Append to `scripts/checks/campaign-status.mjs` before the final `if (failures)` block:

```js
const ia = await read("src/lib/issueActions.js");
ok(/case\s+"PAUSED":\s*\n\s*return\s*\{\s*label:\s*"paused",\s*roleScope:\s*\[\],\s*joinable:\s*false\s*\};/.test(ia),
  "eventJoinPhase has explicit PAUSED no-join case");
```

- [ ] **Step 2: Run to verify it fails**

Run: `node scripts/checks/campaign-status.mjs`
Expected: FAIL `eventJoinPhase has explicit PAUSED no-join case`, exit 1.

- [ ] **Step 3: Add the PAUSED case**

In `src/lib/issueActions.js`, inside `eventJoinPhase`, add the case BEFORE `case "DRAFT":` so PAUSED no longer falls through to the joinable default:

```js
    case "PAUSED":
      return { label: "paused", roleScope: [], joinable: false };
    case "DRAFT":
    default:
      return { label: "join", roleScope: null, joinable: true };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node scripts/checks/campaign-status.mjs`
Expected: passes, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/issueActions.js scripts/checks/campaign-status.mjs
git commit -m "fix(campaigns): PAUSED events are not joinable (was falling through to all-roles)"
```

---

### Task 1.3: Add the PAUSED colour variables + `data-status="paused"` rules

**Files:**
- Modify: `src/app/globals.css:37-46` (light) and `:69-78` (dark)
- Modify: the status-pill / detail-status rulesets that switch on `data-status` (in `src/styles/events-split-view.css` and `src/styles/home.css`)

**Interfaces:**
- Produces: CSS vars `--state-paused`, `--state-paused-ink` (light + dark); `[data-status="paused"]` styling on the status pill + detail status chip.

- [ ] **Step 1: Add the variables (light)**

In `src/app/globals.css` `:root`, after `--state-completed-ink: #3f5650;` add:

```css
  --state-paused: #9a8f86;
  --state-paused-ink: #5f574e;
```

- [ ] **Step 2: Add the variables (dark)**

In `:root[data-theme="dark"]`, after `--state-completed-ink: #d4e0db;` add:

```css
  --state-paused: #b3aaa0;
  --state-paused-ink: #e2dcd5;
```

- [ ] **Step 3: Add `data-status="paused"` to the surfaces that switch on it**

Find each ruleset that already has rules for `[data-status="past"]` / `[data-status="live"]` on the status pill and detail status chip (grep: `data-status="past"` in `src/styles/events-split-view.css` and `src/styles/home.css`). For each such block, add a sibling rule mirroring the `past` one but using the paused vars. Example for the detail status chip in `src/styles/home.css` (match the existing selector shape exactly):

```css
.campaign-detail-status[data-status="paused"] {
  color: var(--state-paused-ink);
  background: color-mix(in srgb, var(--state-paused) 14%, var(--surface));
}
```

And for the list/preview status pill in `src/styles/events-split-view.css`:

```css
.event-list-card-status-pill[data-status="paused"] {
  color: var(--state-paused-ink);
  background: color-mix(in srgb, var(--state-paused) 14%, var(--surface));
}
```

(Use the exact selectors found in the file; the two above are the known ones from the spec §5.)

- [ ] **Step 4: Verify build compiles the CSS**

Run: `npm run build`
Expected: build succeeds (CSS is valid; no broken `var()`).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/styles/events-split-view.css src/styles/home.css
git commit -m "feat(campaigns): PAUSED stone-grey state colour (detail surface)"
```

---

### Task 1.4: Consolidate scattered status labels onto `campaignStatusLabel()`

**Files:**
- Modify: `src/components/IssueStatusTimeline.js`
- Modify: `src/lib/siteContent.js` (event status label block, if it duplicates SCHEDULED/ACTIVE wording)
- Modify: `src/app/campaigns/CampaignsListClient.js:50,64` (intro prose mentions old labels)

**Interfaces:**
- Consumes: `campaignStatusLabel(status, language)` from `src/lib/campaignStatus.js`.

- [ ] **Step 1: Audit current drift**

Run: `grep -rn "Upcoming\|Ongoing\|आउँदै\|लाइभ\|चलिरहेको\|Underway" src/components/IssueStatusTimeline.js src/lib/siteContent.js src/app/campaigns/CampaignsListClient.js`
Note every literal status word that should instead come from `campaignStatusLabel`.

- [ ] **Step 2: Fix the campaigns intro prose**

In `src/app/campaigns/CampaignsListClient.js`, update the two intro strings so they no longer name stale labels:
- Line ~50 (np): change `…खुला, तयारीमा, आउँदै, लाइभ र सम्पन्न…` → `…खुला, तयारीमा, मिति तय, चलिरहेको र सम्पन्न…`
- Line ~64 (en): change `…Open, Planning, Upcoming, Live and Completed.` → `…Open, Planning, Scheduled, Ongoing and Complete.`

- [ ] **Step 3: Point IssueStatusTimeline status words at the single source**

In `src/components/IssueStatusTimeline.js`, where the timeline renders a status WORD that duplicates a campaign status (e.g. an "Ongoing"/"Scheduled"/"Complete" node), import `campaignStatusLabel` and render `campaignStatusLabel("ACTIVE", language)` etc. Keep genuinely-different journey node names (e.g. "Selected"/"छानिएको") as-is — only the status words that must match the model are routed through the helper. Add at top: `import { campaignStatusLabel } from "@/lib/campaignStatus";`

- [ ] **Step 4: De-drift siteContent event labels**

In `src/lib/siteContent.js`, if the event status label map hardcodes SCHEDULED/ACTIVE/COMPLETED EN/NP words, change ONLY those three to match the model (`Scheduled/Ongoing/Complete`, `मिति तय/चलिरहेको/सम्पन्न`). Leave DRAFT/PAUSED/CANCELLED admin wording intact (admin surface, EN-only per language-scope memory). If a surface can use `campaignStatusLabel` instead, prefer that.

- [ ] **Step 5: Verify no stale public labels remain + build**

Run: `grep -rn '"Upcoming"\|"Live"\|"Completed"\|"आउँदै"\|"लाइभ"' src/lib src/components/IssueStatusTimeline.js src/app/campaigns`
Expected: no public-surface matches (admin-only EN strings excepted).
Run: `npm run build && npm run lint`
Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/IssueStatusTimeline.js src/lib/siteContent.js src/app/campaigns/CampaignsListClient.js
git commit -m "refactor(campaigns): route status words through the single label source"
```

---

# PHASE 2 — Colour propagation to lagging surfaces

### Task 2.1: Status chips — per-status count badge + active-tab tint

**Files:**
- Modify: `src/app/campaigns/CampaignsListClient.js` (`StatusChip`, `chipOptions`)
- Modify: `src/styles/campaigns.css:58-79`

**Interfaces:**
- Consumes: `campaignVisualStatus(value)` (already imported in this file).
- Produces: a `data-status` attribute on `.campaign-chip` (`"open"|"planning"|"upcoming"|"live"|"past"`, or absent for `all`); CSS that tints the count badge per status and the selected segment per status.

- [ ] **Step 1: Pass the visual status into `StatusChip`**

In `src/app/campaigns/CampaignsListClient.js`, change `StatusChip` to set a `data-status`:

```js
function StatusChip({ text, count, loading, language, status }) {
  return (
    <span className="campaign-chip" data-status={status || undefined}>
      <span className="campaign-chip-text">{text}</span>
      <span className="campaign-chip-count">
        {loading ? (
          <LoadingOutlined className="campaign-chip-spin" aria-label="loading" />
        ) : (
          localizeDigits(Number.isFinite(count) ? count : 0, language)
        )}
      </span>
    </span>
  );
}
```

- [ ] **Step 2: Feed `status` from `chipOptions`**

In `chipOptions.make`, pass the visual status (omit for "all"):

```js
    const make = (value, count) => ({
      value,
      label: (
        <StatusChip
          text={campaignStatusLabel(value, language)}
          count={count}
          loading={countsLoading || (filters.status === value && loading)}
          language={language}
          status={value === "all" ? null : campaignVisualStatus(value)}
        />
      )
    });
```

- [ ] **Step 3: Tint the count badge per status (always-on) + active segment**

In `src/styles/campaigns.css`, REPLACE the selected-badge block (lines ~73-79) with per-status rules. Each stage's badge always carries its own state colour; the selected segment background picks it up too via `:has()`:

```css
/* Per-stage badge tint — every stage's tally carries its lifecycle colour, so
   the status is glanceable on the chip row even before selection. */
.campaign-chip[data-status="open"] .campaign-chip-count { color: var(--state-open-ink); background: color-mix(in srgb, var(--state-open) 16%, var(--surface)); }
.campaign-chip[data-status="planning"] .campaign-chip-count { color: var(--state-planning-ink); background: color-mix(in srgb, var(--state-planning) 16%, var(--surface)); }
.campaign-chip[data-status="upcoming"] .campaign-chip-count { color: var(--state-upcoming-ink); background: color-mix(in srgb, var(--state-upcoming) 16%, var(--surface)); }
.campaign-chip[data-status="live"] .campaign-chip-count { color: var(--state-live-ink); background: color-mix(in srgb, var(--state-live) 16%, var(--surface)); }
.campaign-chip[data-status="past"] .campaign-chip-count { color: var(--state-completed-ink); background: color-mix(in srgb, var(--state-completed) 16%, var(--surface)); }

/* Selected segment: solid badge + a faint status wash on the segment itself. */
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="open"]) { background: color-mix(in srgb, var(--state-open) 14%, var(--surface)); }
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="planning"]) { background: color-mix(in srgb, var(--state-planning) 14%, var(--surface)); }
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="upcoming"]) { background: color-mix(in srgb, var(--state-upcoming) 14%, var(--surface)); }
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="live"]) { background: color-mix(in srgb, var(--state-live) 14%, var(--surface)); }
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="past"]) { background: color-mix(in srgb, var(--state-completed) 14%, var(--surface)); }
.campaigns-status-chips .ant-segmented-item-selected .campaign-chip-count,
.campaigns-status-chips .ant-segmented-item:hover .campaign-chip-count { color: #fff; }
.campaigns-status-chips .ant-segmented-item-selected .campaign-chip[data-status="open"] ~ .campaign-chip-count { }
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="open"]) .campaign-chip-count { background: var(--state-open); }
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="planning"]) .campaign-chip-count { background: var(--state-planning); }
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="upcoming"]) .campaign-chip-count { background: var(--state-upcoming); }
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="live"]) .campaign-chip-count { background: var(--state-live); }
.campaigns-status-chips .ant-segmented-item-selected:has(.campaign-chip[data-status="past"]) .campaign-chip-count { background: var(--state-completed); }
```

(The "all" segment keeps the neutral `--muted` badge from the untouched base rule at lines ~58-71.)

- [ ] **Step 4: Build + lint**

Run: `npm run build && npm run lint`
Expected: pass. (`:has()` and `color-mix()` are already used in this codebase.)

- [ ] **Step 5: Commit**

```bash
git add src/app/campaigns/CampaignsListClient.js src/styles/campaigns.css
git commit -m "feat(campaigns): status filter chips carry their lifecycle colour"
```

---

### Task 2.2: Status filter dropdown — per-option colour dot

**Files:**
- Modify: `src/app/campaigns/CampaignsListClient.js` (`dropdownOptions`)
- Modify: `src/styles/antd-dropdown.css`

**Interfaces:**
- Consumes: `campaignVisualStatus(value)`.
- Produces: each status option in the filter `Select` renders a leading colour dot keyed on `data-status`.

- [ ] **Step 1: Render a dot in each dropdown option label**

In `src/app/campaigns/CampaignsListClient.js`, change `dropdownOptions` so each non-"all" option's label is a node with a status dot:

```js
  const dropdownOptions = useMemo(
    () => [
      { value: "all", label: campaignStatusLabel("all", language) },
      ...CAMPAIGN_STATUS_SEQUENCE.map((value) => ({
        value,
        label: (
          <span className="campaign-filter-opt" data-status={campaignVisualStatus(value)}>
            <span className="campaign-filter-dot" aria-hidden="true" />
            {campaignStatusLabel(value, language)}
          </span>
        )
      }))
    ],
    [language]
  );
```

- [ ] **Step 2: Style the dot per status**

Append to `src/styles/antd-dropdown.css`:

```css
/* Status filter dropdown: a leading lifecycle-colour dot per option. */
.campaign-filter-opt { display: inline-flex; align-items: center; gap: 8px; }
.campaign-filter-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--muted); flex: 0 0 auto; }
.campaign-filter-opt[data-status="open"] .campaign-filter-dot { background: var(--state-open); }
.campaign-filter-opt[data-status="planning"] .campaign-filter-dot { background: var(--state-planning); }
.campaign-filter-opt[data-status="upcoming"] .campaign-filter-dot { background: var(--state-upcoming); }
.campaign-filter-opt[data-status="live"] .campaign-filter-dot { background: var(--state-live); }
.campaign-filter-opt[data-status="past"] .campaign-filter-dot { background: var(--state-completed); }
```

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/app/campaigns/CampaignsListClient.js src/styles/antd-dropdown.css
git commit -m "feat(campaigns): status colour dot in the filter dropdown"
```

> **Verification note (Phases 1–2):** full visual sign-off (the "orange everywhere" reconciliation, spec §5.5) requires a live backend to render real chip counts/cards and is DEFERRED. Until then these tasks are "implemented, pending live visual verification."

---

# PHASE 3 — Singular `/campaign` route + nav + list hrefs

> The list-merge redirect (`/issues`,`/events` → `/campaigns`) ALREADY exists in `next.config.mjs`. This phase only (a) renames the route to singular and (b) finishes nav/list-link unification. Detail routes stay.

### Task 3.1: Rename `/campaigns` → `/campaign` (route + internal refs + redirects)

**Files:**
- Move: `src/app/campaigns/` → `src/app/campaign/` (`page.js`, `CampaignsListClient.js`)
- Modify: `src/app/campaign/CampaignsListClient.js` (4 hardcoded `/campaigns` router URLs)
- Modify: `next.config.mjs` (redirect destinations → `/campaign`; add `/campaigns` → `/campaign`)

**Interfaces:**
- Produces: working `/campaign` list; `/campaigns`, `/issues`, `/events` all 307 → `/campaign`.

- [ ] **Step 1: Move the directory**

```bash
git mv src/app/campaigns src/app/campaign
```

- [ ] **Step 2: Update the 4 hardcoded router URLs**

In `src/app/campaign/CampaignsListClient.js`, replace every `/campaigns` literal (lines ~189, 191, 211, 376 — inside `router.replace(... "/campaigns" ...)` and `updateUrl`) with `/campaign`. Verify none remain:
Run: `grep -n '"/campaigns"\|`/campaigns?' src/app/campaign/CampaignsListClient.js`
Expected: no matches after the edit.

- [ ] **Step 3: Update redirects in `next.config.mjs`**

Change the two list redirects' destination to `/campaign` and add a plural→singular redirect:

```js
      { source: "/issues", destination: "/campaign", permanent: false },
      { source: "/events", destination: "/campaign", permanent: false },
      { source: "/campaigns", destination: "/campaign", permanent: false }
```

Update the dated comment above them to note the singular rename (2026-06-25).

- [ ] **Step 4: Build + smoke the route**

Run: `npm run build`
Expected: build succeeds; `/campaign` appears in the route manifest, `/campaigns` does not (it is now a redirect).

- [ ] **Step 5: Commit**

```bash
git add src/app/campaign next.config.mjs
git commit -m "feat(campaigns): rename route to singular /campaign; redirect /campaigns,/issues,/events"
```

---

### Task 3.2: Merge the Events + Issues bottom-nav tabs into one Campaign tab

**Files:**
- Modify: `src/components/MobileBottomNav.js`

**Interfaces:**
- Produces: one nav slot labelled अभियान / Campaign → `/campaign`, matching `/campaign*`.

- [ ] **Step 1: Read the current nav model**

Run: `grep -n "/events\|/issues\|समस्या\|अभियान\|label\|href\|match" src/components/MobileBottomNav.js`
Identify the two separate Events and Issues tab descriptors and their active-match logic.

- [ ] **Step 2: Replace the two tabs with one Campaign tab**

Collapse the Events tab and the Issues tab into a single descriptor: `href: "/campaign"`, NP label `अभियान`, EN label `Campaign`, and an active-match that matches `/campaign` (and, defensively, legacy `/issues`/`/events` so a redirect-in-flight still highlights it). Keep the total slot count visually balanced (the freed slot may be left as 4 tabs or filled per existing layout — do NOT invent a new destination; if a 5th slot is structurally required, keep Home/Campaign/Me/More and let the layout reflow).

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/MobileBottomNav.js
git commit -m "feat(nav): single Campaign tab replaces split Events/Issues tabs"
```

---

### Task 3.3: Point list-level links at `/campaign` (leave detail links alone)

**Files (list-level hrefs only — from the grep audit):**
- Modify: `src/components/EventsHomeRail.js:214` (`href="/events"` → `/campaign`)
- Modify: `src/app/not-found.js:47,51` (collapse the two `/issues` + `/events` actions into one `/campaign`, or point both at `/campaign`)
- Modify: `src/components/OnboardingSpotlight.js:137,144` (`/issues`,`/events` → `/campaign`)
- Modify: `src/app/signup/page.js:325` (`/events` → `/campaign`)
- Modify: `src/app/app/page.js:235,270,338` (`/events?show=upcoming`, `/issues`, `/events?show=upcoming` → `/campaign`)
- Modify: `src/app/impact/page.js:316,441` (`/events?show=past&category=…` → `/campaign?category=…`; `/events?show=upcoming` → `/campaign`)

**Do NOT touch** detail links (`/events/${slug}`, `/issues/${slug}`), `/issues/new`, or the `/issues/${id}`/`/events/${id}` back-links in the detail pages — those routes still exist.

**Interfaces:** none (pure href swaps).

- [ ] **Step 1: Apply the list-href swaps**

Edit each line above to its `/campaign` form. For the `?show=` params, drop them (the unified list ignores `show=` and defaults to "all"); keep `category=` where present since `/campaign` supports it. Example: `app/app/page.js:235` `href="/events?show=upcoming"` → `href="/campaign"`; `impact/page.js:316` `href={`/events?show=past&category=${encodeURIComponent(row.key)}`}` → `href={`/campaign?category=${encodeURIComponent(row.key)}`}`.

- [ ] **Step 2: Verify only list-level links changed**

Run: `grep -rn 'href="/issues"\|href="/events"\|/events?show=\|href="/campaigns"' src`
Expected: no matches remain.
Run: `grep -rn '/events/\${\|/issues/\${' src | wc -l`
Expected: unchanged from before this task (detail links preserved).

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/EventsHomeRail.js src/app/not-found.js src/components/OnboardingSpotlight.js src/app/signup/page.js src/app/app/page.js src/app/impact/page.js
git commit -m "feat(campaigns): list-level links point at unified /campaign"
```

---

## Self-Review

**Spec coverage:**
- §4.1 relabel → Task 1.1 ✅ · §4.2 PAUSED known-but-unfiltered → Task 1.1 ✅ · §4.3 consolidate labels → Task 1.4 ✅ · §4.4 visual keys unchanged → respected (Task 1.1 keeps `visual` values) ✅
- §5.1 `--state-paused` → Task 1.3 ✅ · §5.2 `campaignVisualStatus` covers PAUSED → Task 1.1 (PAUSED in `CAMPAIGN_STATUSES`) ✅ · §5.3 brand→status surfaces (rail tab, count badge, dropdown) → Tasks 2.1, 2.2 ✅ · §5.5 browser reconciliation → flagged deferred ✅
- §6 PAUSED no-join → Task 1.2 ✅
- §7 ParticipantsPanel PAUSED read-only → comes for free from Task 1.2 (no structural change) ✅
- §8.1 singular route + list redirects → Task 3.1 ✅ · §8.4 nav merge → Task 3.2; list hrefs → Task 3.3 ✅
- §8.2–8.3 detail merge, §9 backend A/B → DEFERRED (out of this plan, by design) ✅
- §11 verification (node assertion + build/lint; browser deferred) → embedded per task ✅

**Placeholder scan:** no TBD/TODO; every code step shows the code. The two surfaces in Task 1.3 and the nav layout in Task 3.2 say "use the exact selector/structure found in the file" — these are find-then-mirror instructions with the target rule fully written, not placeholders.

**Type/name consistency:** `campaignVisualStatus`, `campaignStatusLabel`, `CAMPAIGN_STATUS_SEQUENCE`, `data-status` visual keys (`open|planning|upcoming|live|past|paused`), and `StatusChip`'s new `status` prop are used identically across Tasks 1.1, 2.1, 2.2. `--state-paused`/`--state-paused-ink` names match between Task 1.3 and any future use.

**Known limitation:** visual verification is deferred while the backend is down; Phase-1 logic and build/lint are the only hard gates available now. This is stated in Global Constraints and per task.
