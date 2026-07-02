# Brochure Content Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the pre-pivot brochure homepage content across four surfaces: hero on `/`, full intro body on `/intro`, volunteer invitations on new `/invitations`, and the old "खुला स्रोतहरू" section as the retitled Open Resources page at `/resources`.

**Architecture:** All restored content is extracted verbatim from git ref `3d66f5b^` (the last full version of the deleted `src/app/HomeClient.js` and its `siteContent.js` blocks), then transplanted into a shared `BrochureHero` component plus three page bodies. Zero data-layer changes — everything is static copy, static `public/` assets, and one frontend-local roadmap read that already powers `/development`.

**Tech Stack:** Next.js App Router (JS, not TS), antd v6, `@ant-design/icons`, existing in-repo components (`MotionSection`, `SectionVideoBackground`, `TimeOfDayGreeting`, `SiteShell`), global CSS in `src/styles/home.css`.

**Spec:** `docs/superpowers/specs/2026-07-02-brochure-content-restoration-design.md`

## Global Constraints

- **Zero frontend dummy data.** Never import from `@/lib/devMockData`. No fetches of any kind are added — the restored sections are static. (The old rail/live-issues sections that fetched data are NOT restored.)
- **API wiring untouched.** No changes to `src/lib/apiClient.js`, any `*Api.js` lib, env files, or Vercel config. Final task audits `git diff` for this.
- **Source of truth is `3d66f5b^`.** Extract blocks with `git show`; never retype content by hand (Devanagari copy is easy to corrupt).
- **Decorative static assets are allowed:** `public/images/demo-events/*.mp4` + posters, `public/images/event-types/`, `public/images/homepage/` (all verified present on disk).
- **NP copy rules:** clickable labels use agentive -ने form (थप जान्ने), prose stays -नुहोस्; brand always श्रमदान in NP copy; EN buttons Title Case.
- **No layout-element changes:** `SiteShell` header/corners/footer structure stays; only the footer/drawer *link lists* gain entries (Task 7).
- **No test harness exists.** Verification = `npm run lint`, `npm run build`, and browser assertions against the dev server (`npm run dev`, port 7777). UI changes are NOT done until browser-verified.
- **Commits:** conventional prefix, task-scoped files only (never `git add -A`), local `stage` branch only, no push.
- **Language check:** every restored/added copy key must exist in BOTH `np` and `en` trees of `siteContent.js`.

## Reference extraction (used by several tasks)

Each task that transplants code first runs its own extraction into the scratchpad
(any writable temp dir works; `$SCRATCH` below means that dir):

```bash
git show 3d66f5b^:src/app/HomeClient.js > "$SCRATCH/old-HomeClient.js"
git show 3d66f5b^:src/lib/siteContent.js > "$SCRATCH/old-siteContent.js"
```

Verified line map of `old-HomeClient.js` (954 lines total):

| Lines | Content |
| --- | --- |
| 117–126 | `resourceIcons` map |
| 128–140 | `volunteerRoleIcons` map |
| 142–148 | `workflowStepIcons` map (used by the core-idea section) |
| 150–182 | `buildingNowIconByKey` + `buildingNowIconByPhase` maps |
| 184–254 | `pickBuildingNowIcon`, `relativeShippedLabel`, `buildBuildingNowItems` |
| 356–377 | hero: `<MotionSection …"hero-section">` + video + `hero-copy` div (aside/panel at 378–440 is NOT restored) |
| 586–649 | `event-types-section` |
| 650–681 | `cleanup-areas-section` |
| 682–738 | `core-idea-section` |
| 739–821 | `volunteer-invite-section` |
| 821–892 | `building-now-section` (conditional block, opener `{buildingNowCards.length > 0 ? (` included) |
| 893–952 | `resources-section` |

Verified line map of `old-siteContent.js`:

| Lines | Block |
| --- | --- |
| 93–194 | `buildInPublic` (np) |
| 665–714 | `cleanupAreas` (np) |
| 757–856 | `volunteerInvite` (np) |
| 2111–2220 | `buildInPublic` (en) |
| 2691–2740 | `cleanupAreas` (en) |
| 2783–2882 | `volunteerInvite` (en) |

Component signatures confirmed current (no adaptation needed):
`SectionVideoBackground({ src, poster, overlay = "soft", objectPosition = "center" })`,
`MotionSection({ as = "section", children, className, ...rest })`,
`TimeOfDayGreeting({ language = "np" })`.

---

### Task 1: Restore and extend copy blocks in siteContent.js

**Files:**
- Modify: `src/lib/siteContent.js` (current: 3666 lines; np tree starts line 2, en tree starts ~1820)

**Interfaces:**
- Produces (consumed by Tasks 2–7): `copy[lang].cleanupAreas`, `copy[lang].volunteerInvite` (with added `pageTitle`), `copy[lang].buildInPublic`, `copy[lang].hero.learnMore`, `copy[lang].nav.intro`, `copy[lang].nav.invitations`, retitled `copy[lang].nav.resources`, `copy[lang].resources.pageTitle`.

- [ ] **Step 1: Extract the three deleted blocks from git**

```bash
git show 3d66f5b^:src/lib/siteContent.js | sed -n '93,194p'   > "$SCRATCH/np-buildInPublic.txt"
git show 3d66f5b^:src/lib/siteContent.js | sed -n '665,714p'  > "$SCRATCH/np-cleanupAreas.txt"
git show 3d66f5b^:src/lib/siteContent.js | sed -n '757,856p'  > "$SCRATCH/np-volunteerInvite.txt"
git show 3d66f5b^:src/lib/siteContent.js | sed -n '2111,2220p' > "$SCRATCH/en-buildInPublic.txt"
git show 3d66f5b^:src/lib/siteContent.js | sed -n '2691,2740p' > "$SCRATCH/en-cleanupAreas.txt"
git show 3d66f5b^:src/lib/siteContent.js | sed -n '2783,2882p' > "$SCRATCH/en-volunteerInvite.txt"
```

Sanity-check each file: first line must be the block opener (`buildInPublic: {` / `cleanupAreas: {` / `volunteerInvite: {`, each at 4-space indent), last line must be `},` at 4-space indent.

- [ ] **Step 2: Insert the blocks into the current file**

Read `src/lib/siteContent.js`. Insert each extracted block verbatim at these anchors (do the **en** tree first so np line numbers stay valid while you work, or simply use unique-string Edit anchors):

- `buildInPublic` (np) → immediately before the np `eventTypes: {` key (currently line 69, right after the np `hero` block closes).
- `buildInPublic` (en) → immediately before the en `eventTypes: {` key (currently line 1883).
- `cleanupAreas` (np) → immediately before the np `coreIdea: {` key (currently line 539).
- `cleanupAreas` (en) → immediately before the en `coreIdea: {` key (currently line 2353).
- `volunteerInvite` (np) → immediately before the np `resources: {` key (currently line 581, i.e. right after np `coreIdea` closes).
- `volunteerInvite` (en) → immediately before the en `resources: {` key (currently line 2395).

Each key appears once per tree — after insertion, `grep -c "cleanupAreas: {" src/lib/siteContent.js` must print `2` (same for the other two).

- [ ] **Step 3: Add the new keys**

In BOTH trees:

np `hero` block (add after the `join:` line):

```js
      join: "योगदान गर्ने",
      learnMore: "थप जान्ने"
```

en `hero` block:

```js
      join: "Contribute",
      learnMore: "Learn More"
```

np `nav` block — change the existing `resources` value and add two keys (keep alphabetic-ish placement near it):

```js
      resources: "खुला स्रोतहरू",
      intro: "परिचय",
      invitations: "खुला निम्तो",
```

en `nav` block:

```js
      resources: "Open Resources",
      intro: "Intro",
      invitations: "Open Invitations",
```

np `volunteerInvite` block (first line inside the block, right after `    volunteerInvite: {`):

```js
      pageTitle: "खुला निम्तो",
```

en `volunteerInvite` block:

```js
      pageTitle: "Open Invitations",
```

np `resources` block (first line inside the block):

```js
      pageTitle: "खुला स्रोतहरू",
```

en `resources` block:

```js
      pageTitle: "Open Resources",
```

- [ ] **Step 4: Verify the file parses and keys exist in both trees**

```bash
node -e "
const {copy}=require('./src/lib/siteContent.js');
for (const l of ['np','en']) {
  const t=copy[l];
  const ok=t.cleanupAreas&&t.volunteerInvite&&t.volunteerInvite.pageTitle&&t.buildInPublic&&t.buildInPublic.taskOverrides&&t.hero.learnMore&&t.nav.intro&&t.nav.invitations&&t.resources.pageTitle;
  console.log(l, ok? 'OK':'MISSING'); if(!ok) process.exit(1);
}
console.log('np roles:', copy.np.volunteerInvite.roles.length, 'en roles:', copy.en.volunteerInvite.roles.length);
"
```

Expected: `np OK`, `en OK`, `np roles: 11 en roles: 11`.

- [ ] **Step 5: Lint and commit**

```bash
npm run lint
git add src/lib/siteContent.js
git commit -m "feat(content): restore cleanupAreas/volunteerInvite/buildInPublic copy + intro/invitations/open-resources labels"
```

---

### Task 2: BrochureHero shared component + solo-layout CSS

**Files:**
- Create: `src/components/BrochureHero.js`
- Modify: `src/styles/home.css` (append after the `.hero-section > *:not(.section-video-bg)` rule, currently ending line 915)

**Interfaces:**
- Consumes: Task 1's `copy[lang].hero.learnMore`.
- Produces: `BrochureHero({ variant })` — named export; `variant: "home" | "intro"`, default `"home"`. `"home"` renders Join + Learn More CTAs; `"intro"` renders Join only.

- [ ] **Step 1: Create the component**

The hero-copy markup below is the verbatim old block (`old-HomeClient.js` 356–377) with exactly three changes: added `hero-section--solo` class, Join `href` `#we-need-you` → `/join`, and the new conditional Learn More button.

```jsx
"use client";

import { ArrowRightOutlined, HeartOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { MotionSection } from "@/components/MotionSection";
import { SectionVideoBackground } from "@/components/SectionVideoBackground";
import { TimeOfDayGreeting } from "@/components/TimeOfDayGreeting";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

export function BrochureHero({ variant = "home" }) {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;

  return (
    <MotionSection as="section" id="top" className="hero-section hero-section--solo">
      <SectionVideoBackground
        src="/images/demo-events/bagmati-cleanup.mp4"
        poster="/images/demo-events/bagmati-cleanup.jpg"
        overlay="hero"
        objectPosition="center right"
      />
      <div className="hero-copy">
        {t.hero.eyebrow ? (
          <span className="eyebrow">
            <TimeOfDayGreeting language={language} /> {t.hero.eyebrow}
          </span>
        ) : null}
        <h1>{t.hero.title}</h1>
        <p className="hero-subtitle">{t.hero.subtitle}</p>
        <p>{t.hero.support}</p>
        <div className="hero-actions">
          <Button type="primary" size="large" href="/join" icon={<HeartOutlined />}>
            {t.hero.join}
          </Button>
          {variant === "home" ? (
            <Button size="large" href="/intro" icon={<ArrowRightOutlined />}>
              {t.hero.learnMore}
            </Button>
          ) : null}
        </div>
      </div>
    </MotionSection>
  );
}
```

- [ ] **Step 2: Add solo-layout CSS**

The old `.hero-section` is a two-column grid (copy + panel, `src/styles/home.css:899-910`). The panel is gone, so add after the `.hero-section > *:not(.section-video-bg)` rule:

```css
/* Hero without the old action-hub aside — single column, copy width capped. */
.hero-section--solo {
  grid-template-columns: minmax(0, 1fr);
}

.hero-section--solo .hero-copy {
  max-width: 760px;
}
```

- [ ] **Step 3: Lint and commit**

```bash
npm run lint
git add src/components/BrochureHero.js src/styles/home.css
git commit -m "feat(home): shared BrochureHero component — restored video hero, Join + Learn More CTAs"
```

(Browser verification lands in Task 3 when the hero is first wired to a page.)

---

### Task 3: Wire the hero into the homepage

**Files:**
- Modify: `src/components/HomeSearchView.js` (brand-band section is lines 96–117)

**Interfaces:**
- Consumes: `BrochureHero` from Task 2.

- [ ] **Step 1: Replace the brand band with the hero**

In `src/components/HomeSearchView.js`:

Remove the entire `home-search-hero` section (the JSX from `<section className="home-search-hero" …>` through its closing `</section>`, currently lines 96–117 — brand logo, `h1`, slogan, and the small "श्रमदान के हो?" intro link, which the hero's Learn More CTA replaces). Insert in its place:

```jsx
      <BrochureHero variant="home" />
```

Add the import (with the other `@/components` imports):

```js
import { BrochureHero } from "@/components/BrochureHero";
```

Then remove now-unused imports: `Image` and `Link` are only used by the removed block — delete both import lines. `search` stays (still used by `search.mapEyebrow`, `search.map`, `search.mapEmpty`). Run lint to confirm nothing else went unused.

- [ ] **Step 2: Browser-verify the homepage**

```bash
npm run dev   # port 7777, leave running for all later tasks
```

Load `http://localhost:7777/` and assert:

1. Hero renders with the Bagmati video playing (autoplay muted) — `document.querySelector(".hero-section video")` exists and `.paused === false`.
2. Two CTAs: primary "योगदान गर्ने" → `/join`, secondary "थप जान्ने" → `/intro` (NP default). Switch language → "Contribute" / "Learn More".
3. Everything below is untouched: events rail, stats funnel + map, discovery rails all render.
4. No console errors.
5. Screenshot the fold for the record.

- [ ] **Step 3: Commit**

```bash
git add src/components/HomeSearchView.js
git commit -m "feat(home): old brochure hero replaces brand band — video bg + Join/Learn More CTAs"
```

---

### Task 4: Rebuild /intro with the brochure body

**Files:**
- Rewrite: `src/app/intro/page.js` (server wrapper; its current inline two-chapter copy is discarded per spec)
- Create: `src/app/intro/IntroClient.js`
- NOT touched: `src/components/IntroCinematic.js`, `src/styles/intro.css` (stay in repo unused — defer pattern)

**Interfaces:**
- Consumes: `BrochureHero` (Task 2), Task 1 copy blocks, `getRoadmapSummary()` from `@/lib/roadmap` (existing; returns `{ overallPercent, inProgress, upcoming, recentlyDone }`).
- Produces: `/intro` route rendering hero + event-types + cleanup-areas + core-idea + building-now.

- [ ] **Step 1: Rewrite the server wrapper**

`src/app/intro/page.js` becomes exactly:

```jsx
import IntroClient from "./IntroClient";
import { getRoadmapSummary } from "@/lib/roadmap";

export default function Page() {
  const summary = getRoadmapSummary();
  return <IntroClient summary={summary} />;
}
```

- [ ] **Step 2: Create IntroClient.js**

Scaffold (connective code complete below; the four marked slots are verbatim transplants from `$SCRATCH/old-HomeClient.js` — do not retype them):

```jsx
"use client";

import {
  ApiOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  BuildOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HeartOutlined,
  HomeOutlined,
  LikeOutlined,
  LineChartOutlined,
  LoadingOutlined,
  MessageOutlined,
  MobileOutlined,
  SafetyOutlined,
  ShareAltOutlined,
  TeamOutlined,
  ToolOutlined,
  TranslationOutlined,
  UnorderedListOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import Image from "next/image";
import Link from "next/link";
import { BrochureHero } from "@/components/BrochureHero";
import { MotionSection } from "@/components/MotionSection";
import { SectionVideoBackground } from "@/components/SectionVideoBackground";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

// ── SLOT A: lines 142–254 of old-HomeClient.js, verbatim ──
// (workflowStepIcons, buildingNowIconByKey, buildingNowIconByPhase,
//  pickBuildingNowIcon, relativeShippedLabel, buildBuildingNowItems)

export default function IntroClient({ summary }) {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const buildingNowCards = buildBuildingNowItems({
    inProgress: summary?.inProgress ?? [],
    upcoming: summary?.upcoming ?? [],
    recentlyDone: summary?.recentlyDone ?? [],
    t
  });

  return (
    <SiteShell pageTitle={t.pageTitles?.intro ?? "परिचय"}>
      <BrochureHero variant="intro" />

      {/* ── SLOT B: lines 586–738 of old-HomeClient.js, verbatim ──
          (event-types-section, cleanup-areas-section, core-idea-section) */}

      {/* ── SLOT C: lines 821–892 of old-HomeClient.js, verbatim ──
          (building-now-section conditional, incl. the line-821 opener) */}
    </SiteShell>
  );
}
```

Extraction commands for the slots:

```bash
sed -n '142,254p' "$SCRATCH/old-HomeClient.js"   # SLOT A
sed -n '586,738p' "$SCRATCH/old-HomeClient.js"   # SLOT B
sed -n '821,892p' "$SCRATCH/old-HomeClient.js"   # SLOT C
```

After pasting, verify no dropped-era identifiers slipped in:

```bash
grep -n "devMockData\|injectMockLiveStream\|listLiveEvents\|getJson\|TertiaryButton\|liveIssues\|EventsHomeRail\|heroPanel" src/app/intro/IntroClient.js
```

Expected: no output. (SLOT B/C reference only `t.eventTypes`, `t.cleanupAreas`, `t.coreIdea`, `t.buildInPublic`, `Link`, `Button`, `Image`, `MotionSection`, `SectionVideoBackground` — all imported above.)

pageTitle: `pageTitles.intro` doesn't exist yet — add `intro: "परिचय",` to the np `pageTitles` block and `intro: "Intro",` to the en one in `src/lib/siteContent.js`, then simplify the prop to `pageTitle={t.pageTitles.intro}` (drop the inline fallback).

- [ ] **Step 3: Lint, then browser-verify /intro**

```bash
npm run lint
```

Load `http://localhost:7777/intro` and assert, in both NP and EN:

1. Hero shows with video, Join CTA only (no Learn More).
2. Sections in order: event types (8 image cards), cleanup areas (6 image cards), core idea (5 steps with images), building-now (≥1 progress card — roadmap currently has in-progress ids 2.1/14.2/14.3 with overrides, so the section must NOT be empty; if it renders empty, the conditional is wired wrong).
3. Section video backgrounds play (kamalpokhari, suryabinayak).
4. No fetch to `/issues` or `/events` fires from this page (Network tab) — the page makes no API calls.
5. No console errors. Screenshot top and bottom.

- [ ] **Step 4: Commit**

```bash
git add src/app/intro/page.js src/app/intro/IntroClient.js src/lib/siteContent.js
git commit -m "feat(intro): restore brochure body — hero, event types, cleanup areas, core idea, building-now"
```

---

### Task 5: New /invitations page

**Files:**
- Create: `src/app/invitations/page.js`

**Interfaces:**
- Consumes: Task 1's `copy[lang].volunteerInvite` (incl. `pageTitle`).
- Produces: `/invitations` route; roles panel keeps `id="we-need-you"` for deep links.

- [ ] **Step 1: Create the page**

Scaffold (SLOT D = lines 739–821 of `old-HomeClient.js` verbatim; SLOT E = lines 128–140, the `volunteerRoleIcons` map, verbatim):

```jsx
"use client";

import {
  ArrowRightOutlined,
  BankOutlined,
  BgColorsOutlined,
  BugOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  EditOutlined,
  HeartOutlined,
  LineChartOutlined,
  RocketOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import Image from "next/image";
import { MotionSection } from "@/components/MotionSection";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

// ── SLOT E: lines 128–140 of old-HomeClient.js, verbatim (volunteerRoleIcons) ──

export default function InvitationsPage() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;

  return (
    <SiteShell pageTitle={t.volunteerInvite.pageTitle}>
      {/* ── SLOT D: lines 739–821 of old-HomeClient.js, verbatim (volunteer-invite-section) ── */}
    </SiteShell>
  );
}
```

SLOT D needs zero edits — its CTAs already point at `/join`, `/feedback`, and `/join?role=…`, and it only uses `t.volunteerInvite`, `Image`, `Button`, `MotionSection`, `TeamOutlined`, `HeartOutlined`, `ArrowRightOutlined`, and `volunteerRoleIcons`.

- [ ] **Step 2: Lint, then browser-verify /invitations**

```bash
npm run lint
```

Load `http://localhost:7777/invitations`, both languages:

1. Brand card + goal card + 11 role cards render with icons.
2. A role card CTA navigates to `/join?role=<value>` (click one, confirm the query param lands on the join form).
3. `document.getElementById("we-need-you")` exists.
4. No API calls, no console errors. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add src/app/invitations/page.js
git commit -m "feat(invitations): open-invitations page — restored volunteer-invite roles grid"
```

---

### Task 6: /resources becomes Open Resources

**Files:**
- Rewrite: `src/app/resources/page.js` (current placeholder directory — every href is `#` — is discarded per spec)

**Interfaces:**
- Consumes: existing `copy[lang].resources` (playlist + 7 real-link items incl. `roadmap`) + Task 1's `resources.pageTitle`.

- [ ] **Step 1: Rewrite the page**

Scaffold (SLOT F = lines 893–952 of `old-HomeClient.js` verbatim — the `resources-section` MotionSection):

```jsx
"use client";

import {
  ApiOutlined,
  FilePptOutlined,
  FileTextOutlined,
  GithubOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
  YoutubeOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import { MotionSection } from "@/components/MotionSection";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

const resourceIcons = {
  participate: VideoCameraOutlined,
  watchLive: YoutubeOutlined,
  discord: MessageOutlined,
  apiDocs: ApiOutlined,
  presentation: FilePptOutlined,
  documents: FileTextOutlined,
  github: GithubOutlined,
  roadmap: UnorderedListOutlined
};

export default function ResourcesPage() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;

  return (
    <SiteShell pageTitle={t.resources.pageTitle}>
      {/* ── SLOT F: lines 893–952 of old-HomeClient.js, verbatim ── */}
    </SiteShell>
  );
}
```

Two mandatory edits inside SLOT F after pasting:

1. The map line `const Icon = resourceIcons[item.id];` → `const Icon = resourceIcons[item.id] ?? FileTextOutlined;` (the current siteContent `resources.items` includes a `roadmap` entry the old map didn't know; the map above adds it, the fallback protects future items).
2. No other edits — playlist iframe, buttons, and hrefs come from siteContent and are all real external links.

The icon map is `old-HomeClient.js` 117–126 plus the added `roadmap` key.

- [ ] **Step 2: Lint, then browser-verify /resources**

```bash
npm run lint
```

Load `http://localhost:7777/resources`, both languages:

1. Page title/eyebrow read खुला स्रोतहरू / Open Resources.
2. YouTube playlist iframe renders (youtube-nocookie embed) + "युट्युबमा पूरै प्लेलिस्ट हेर्ने" button.
3. All resource cards render; **zero `href="#"` anchors on the page**: `document.querySelectorAll('a[href="#"]').length === 0`.
4. Spot-check two external links (Meet, GitHub) have correct hrefs.
5. No console errors. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add src/app/resources/page.js
git commit -m "feat(resources): replace placeholder library with restored Open Resources (खुला स्रोतहरू)"
```

---

### Task 7: Nav, footer, and drawer wiring

**Files:**
- Modify: `src/components/SiteShell.js` — `appsGridItems` (lines 198–206), `pagesLinks`/`learnLinks`/`footerLinks` (lines 345–378)

**Interfaces:**
- Consumes: Task 1's `t.nav.intro`, `t.nav.invitations`, retitled `t.nav.resources`.

- [ ] **Step 1: Extend the link lists**

`learnLinks` (currently event-types + documents→/learn) — add intro first and Open Resources last:

```js
  const learnLinks = [
    { href: "/intro", label: t.nav.intro },
    { href: "/event-types", label: t.nav.eventTypes },
    { href: "/learn", label: t.footer.links.documents },
    { href: "/resources", label: t.nav.resources }
  ];
```

Get Involved column — add invitations before join:

```js
      links: [
        { href: "/invitations", label: t.nav.invitations },
        { href: "/join", label: t.footer.links.contributor },
        { href: "/feedback", label: t.footer.links.feedback }
      ]
```

`appsGridItems` (mobile drawer) — add intro and invitations after event-types (`/resources` is already there and picks up the new label automatically). Icons: reuse already-imported ones — check the import block at the top of SiteShell.js; `BookOutlined`/`TeamOutlined`/`FolderOpenOutlined` are imported. Use:

```js
    { href: "/intro", label: t.nav.intro, icon: <BookOutlined /> },
    { href: "/invitations", label: t.nav.invitations, icon: <TeamOutlined /> },
```

(If you prefer distinct icons, import e.g. `InfoCircleOutlined`/`UserAddOutlined` from `@ant-design/icons` — `UserAddOutlined` is already imported for the guest popover.)

- [ ] **Step 2: Lint, then browser-verify wiring**

```bash
npm run lint
```

1. Footer on `http://localhost:7777/` shows: परिचय + खुला स्रोतहरू in the Learn column, खुला निम्तो in Get Involved; each navigates correctly.
2. Mobile viewport (≤720px): drawer lists intro, invitations, and the retitled खुला स्रोतहरू entry.
3. Language toggle: all three labels switch (Intro / Open Invitations / Open Resources).

- [ ] **Step 3: Commit**

```bash
git add src/components/SiteShell.js
git commit -m "feat(nav): wire intro, open invitations, and open resources into footer + drawer"
```

---

### Task 8: Full verification sweep + provenance audit

**Files:** none new (fixes only if the sweep finds issues)

- [ ] **Step 1: Static checks**

```bash
npm run lint
npm run build
```

Expected: both clean. Build must show `/intro` as dynamic-or-static per its server wrapper without errors, and `/invitations` + `/resources` as static client pages.

- [ ] **Step 2: Data-provenance audit (hard rule from spec)**

```bash
git diff 0aaca2d --stat            # since the spec commit — only expected files
git diff 0aaca2d -- src/lib/apiClient.js src/lib/*Api.js .env* vercel.json next.config.mjs
grep -rn "devMockData" src/app/intro src/app/invitations src/app/resources src/components/BrochureHero.js src/components/HomeSearchView.js
```

Expected: second command prints nothing (API wiring untouched); grep prints nothing.

- [ ] **Step 3: Full browser pass, both languages**

Walk `/` → Learn More → `/intro` → footer → `/invitations` → role card → `/join?role=…` → back → `/resources`. Assert per-page checks from Tasks 3–7 still hold together, dark mode included if the shell offers it, and capture final screenshots: `verify-restore-home.jpeg`, `verify-restore-intro.jpeg`, `verify-restore-invitations.jpeg`, `verify-restore-resources.jpeg`.

- [ ] **Step 4: Docs + close-out**

- `docs/api-requirements/`: no update needed — no entity API touched this session (static content only); state this in the close-out summary.
- If building-now card pairings look stale against today's roadmap (overrides date to 2026-06-05), add a P2 line to `docs/00-polish-backlog.md`: "refresh buildInPublic.taskOverrides against current roadmap in-progress ids" — do not fix in this plan (YAGNI).
- Commit any sweep fixes with `fix(...)` prefix; screenshots stay untracked like the existing `verify-*.jpeg` files.
