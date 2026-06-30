# Homepage Discovery Rails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's flat "Nearby issues" grid with four intent-grouped, Netflix-style horizontal campaign rails (Near you / Happening now & soon / Needs support / Impact so far).

**Architecture:** A new `useHomeRails` hook wraps the existing `useCampaignFeed({status:"all"})` and buckets its merged entries into four arrays by user-intent. A new reusable `CampaignRail` component renders one Swiper row of existing `CampaignCard`s with prev/next arrows and edge-fade. A new `HomeDiscoveryRails` container composes four rails and is swapped into `HomeSearchView` in place of `StreamList`.

**Tech Stack:** Next.js (App Router, JS), React client components, Swiper `^12.1.4` (already installed), AntD icons, plain CSS.

## Global Constraints

- Public site is bilingual EN + NE; `language` is `"np"` or `"en"` (NOT BCP-47).
- NE prose in Devanagari; brand renders as श्रमदान, never Latin.
- EN button/CTA labels use Title Case ("View All"); NE clickable labels use agentive `-ने` ("सबै हेर्ने").
- Status string values are exactly `OPEN | DRAFT | SCHEDULED | ACTIVE | COMPLETED` (from `src/lib/campaignStatus.js`).
- No backend changes (frontend-only).
- No unit-test harness exists in this repo. Per-task verification = `npm run lint` (and `npm run build` where noted); the final task adds a Playwright browser-verify of the live homepage.
- Dev server: `npm run dev` on port 7777. `NEXT_PUBLIC_*` bake at dev-start — restart after env edits (not needed here).
- Commits go to the current `stage` branch, local only (no push). Conventional-commit prefixes. End commit messages with the Co-Authored-By trailer.

---

### Task 1: `useHomeRails` data hook

**Files:**
- Create: `src/lib/useHomeRails.js`

**Interfaces:**
- Consumes: `useCampaignFeed({status, language, provinceId, districtId}) -> { items: Array<{kind,status,id,data}>, loading, error }` from `src/lib/useCampaignFeed.js`; `useGeolocation() -> { position }` from `src/lib/useGeolocation.js`; `distanceKmOrNull(origin, lat, lng)` from `src/lib/haversine.js`.
- Produces: `useHomeRails({language, provinceId, districtId}) -> { near, happening, support, impact, loading, error }`. Each of `near|happening|support|impact` is `Array<{ entry: {kind,status,id,data}, distanceKm: number|null }>`, capped at 10.

- [ ] **Step 1: Create the hook**

```js
// src/lib/useHomeRails.js
"use client";

// Buckets the unified campaign feed into intent-grouped rails for the homepage.
// Statuses are our backend lifecycle; users discover by intent, so we collapse:
//   happening = ACTIVE + SCHEDULED   (join now / soon)
//   support   = OPEN   + DRAFT       (vote / shape)
//   impact    = COMPLETED            (proof / inspiration)
//   near      = everything with coords, distance-sorted when location is known
// Upstream useCampaignFeed already orders each status (OPEN most-supported,
// SCHEDULED soonest, COMPLETED most-recent), so we only concatenate + slice.

import { useMemo } from "react";
import { useCampaignFeed } from "@/lib/useCampaignFeed";
import { useGeolocation } from "@/lib/useGeolocation";
import { distanceKmOrNull } from "@/lib/haversine";

const MAX_PER_RAIL = 10;

const wrap = (list) => list.map((entry) => ({ entry, distanceKm: null }));

export function useHomeRails({ language, provinceId, districtId } = {}) {
  const { items, loading, error } = useCampaignFeed({
    status: "all",
    language,
    provinceId,
    districtId
  });
  const { position } = useGeolocation();

  return useMemo(() => {
    const byStatus = (s) => items.filter((it) => it.status === s);

    const happening = wrap(
      [...byStatus("ACTIVE"), ...byStatus("SCHEDULED")].slice(0, MAX_PER_RAIL)
    );
    const support = wrap(
      [...byStatus("OPEN"), ...byStatus("DRAFT")].slice(0, MAX_PER_RAIL)
    );
    const impact = wrap(byStatus("COMPLETED").slice(0, MAX_PER_RAIL));

    const withDistance = items.map((entry) => ({
      entry,
      distanceKm: distanceKmOrNull(
        position,
        entry.data?.latitude,
        entry.data?.longitude
      )
    }));
    if (position) {
      withDistance.sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
    }
    const near = withDistance.slice(0, MAX_PER_RAIL);

    return { near, happening, support, impact, loading, error };
  }, [items, position, loading, error]);
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS (no new errors for `src/lib/useHomeRails.js`).

- [ ] **Step 3: Commit**

```bash
git add src/lib/useHomeRails.js
git commit -m "feat(home): useHomeRails hook buckets feed into intent rails

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `CampaignRail` component + styles

**Files:**
- Create: `src/components/CampaignRail.js`
- Create: `src/styles/campaign-rail.css`
- Reference (do not change): `src/components/EventsHomeRail.js` for the established Swiper import pattern; `src/components/CampaignCard.js` for the card props (`campaign={{kind,data}}`, `distanceKm`, `language`).

**Interfaces:**
- Consumes: rail item shape `{ entry: {kind,id,data}, distanceKm }` produced by Task 1; `CampaignCard` default export.
- Produces: `CampaignRail` default export with props `{ eyebrow, title, viewAllHref, viewAllLabel, items, language }`. Renders `null` when `items` is empty.

- [ ] **Step 1: Create the component**

```jsx
// src/components/CampaignRail.js
"use client";

// One horizontal, Netflix-style campaign rail. Flat row (NOT coverflow — that
// is EventsHomeRail's hero treatment). Peeks adjacent cards, fades at the edges,
// prev/next arrows, keyboard + a11y. No autoplay: this is a browse rail.

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard, A11y } from "swiper/modules";
import {
  ArrowRightOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons";
import CampaignCard from "@/components/CampaignCard";
import "swiper/css";
import "swiper/css/navigation";
import "@/styles/campaign-rail.css";

const BREAKPOINTS = {
  0: { slidesPerView: 1.2, spaceBetween: 14 },
  640: { slidesPerView: 2.2, spaceBetween: 16 },
  1024: { slidesPerView: 3.2, spaceBetween: 18 },
  1280: { slidesPerView: 4.2, spaceBetween: 20 }
};

export default function CampaignRail({
  eyebrow,
  title,
  viewAllHref,
  viewAllLabel,
  items,
  language
}) {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  if (!items || items.length === 0) return null;

  const prevClass = `rail-prev-${uid}`;
  const nextClass = `rail-next-${uid}`;
  const titleId = `rail-${uid}-title`;

  return (
    <section className="campaign-rail" aria-labelledby={titleId}>
      <header className="campaign-rail-header">
        <div className="campaign-rail-heading">
          {eyebrow ? (
            <span className="eyebrow campaign-rail-eyebrow">{eyebrow}</span>
          ) : null}
          <h2 id={titleId}>{title}</h2>
        </div>
        {viewAllHref ? (
          <Link className="campaign-rail-viewall" href={viewAllHref}>
            {viewAllLabel}
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
        ) : null}
      </header>

      <div className="campaign-rail-viewport">
        <button
          type="button"
          className={`campaign-rail-arrow campaign-rail-arrow--prev ${prevClass}`}
          aria-label={language === "np" ? "अघिल्लो" : "Previous"}
        >
          <LeftOutlined aria-hidden="true" />
        </button>

        <Swiper
          modules={[Navigation, Keyboard, A11y]}
          navigation={{ prevEl: `.${prevClass}`, nextEl: `.${nextClass}` }}
          keyboard={{ enabled: true }}
          speed={reduced ? 0 : 420}
          watchOverflow
          breakpoints={BREAKPOINTS}
          className="campaign-rail-swiper"
        >
          {items.map(({ entry, distanceKm }) => (
            <SwiperSlide
              key={`${entry.kind}-${entry.id}`}
              className="campaign-rail-slide"
            >
              <CampaignCard
                campaign={{ kind: entry.kind, data: entry.data }}
                distanceKm={distanceKm}
                language={language}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type="button"
          className={`campaign-rail-arrow campaign-rail-arrow--next ${nextClass}`}
          aria-label={language === "np" ? "अर्को" : "Next"}
        >
          <RightOutlined aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the styles**

```css
/* src/styles/campaign-rail.css */

.home-discovery-rails {
  display: grid;
  gap: clamp(28px, 4vw, 48px);
}

.campaign-rail {
  display: grid;
  gap: 16px;
}

.campaign-rail-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 16px;
}

.campaign-rail-heading {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.campaign-rail-header h2 {
  margin: 0;
  font-size: clamp(20px, 2.1vw, 30px);
  line-height: 1.18;
  color: var(--primary-dark);
}

.campaign-rail-eyebrow {
  color: color-mix(in srgb, var(--primary-dark) 70%, transparent);
}

.campaign-rail-viewall {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
  border-radius: 999px;
  color: var(--primary-dark);
  font-weight: 700;
  font-size: 14px;
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.campaign-rail-viewall:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--primary) 40%, var(--line));
}

.campaign-rail-viewport {
  position: relative;
}

/* Edge fade: cards "vanish" at the left/right boundaries. */
.campaign-rail-swiper {
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 28px,
    #000 calc(100% - 28px),
    transparent 100%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 0,
    #000 28px,
    #000 calc(100% - 28px),
    transparent 100%
  );
  padding-block: 4px;
}

.campaign-rail-slide {
  height: auto;
  display: flex;
}

.campaign-rail-slide > * {
  width: 100%;
}

.campaign-rail-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
  border-radius: 999px;
  color: var(--primary-dark);
  background: color-mix(in srgb, var(--surface) 86%, transparent);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: background 160ms ease, transform 160ms ease, opacity 160ms ease;
}

.campaign-rail-arrow--prev {
  left: -6px;
}
.campaign-rail-arrow--next {
  right: -6px;
}

.campaign-rail-arrow:hover {
  background: var(--surface);
}

/* Swiper toggles this class on the nav buttons when there is nowhere to go. */
.campaign-rail-arrow.swiper-button-disabled {
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 640px) {
  .campaign-rail-arrow {
    display: none;
  }
}
```

- [ ] **Step 3: Lint + build (component compiles, Swiper imports resolve)**

Run: `npm run lint && npm run build`
Expected: PASS. (Build confirms `swiper/react`, `swiper/modules`, and the CSS subpath imports resolve.)

- [ ] **Step 4: Commit**

```bash
git add src/components/CampaignRail.js src/styles/campaign-rail.css
git commit -m "feat(home): reusable CampaignRail Swiper carousel

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `HomeDiscoveryRails` container

**Files:**
- Create: `src/components/HomeDiscoveryRails.js`

**Interfaces:**
- Consumes: `useHomeRails` (Task 1); `CampaignRail` default export (Task 2).
- Produces: `HomeDiscoveryRails` default export with props `{ language, provinceId?, districtId? }`.

- [ ] **Step 1: Create the container**

```jsx
// src/components/HomeDiscoveryRails.js
"use client";

// Homepage discovery section: four intent-grouped campaign rails. Rails 2-4
// hide themselves (CampaignRail returns null) when their bucket is empty, so a
// thin DB never shows broken empty rails.

import { useHomeRails } from "@/lib/useHomeRails";
import CampaignRail from "@/components/CampaignRail";

const RAIL_COPY = {
  np: {
    near: { eyebrow: "तपाईंका लागि", title: "तपाईं नजिकैका अभियान", viewAll: "सबै हेर्ने", href: "/campaigns" },
    happening: { eyebrow: "सक्रिय", title: "अहिले र चाँडैका अभियान", viewAll: "सबै हेर्ने", href: "/campaigns?status=ACTIVE" },
    support: { eyebrow: "साथ चाहिएको", title: "साथ खोज्दै", viewAll: "सबै हेर्ने", href: "/campaigns?status=OPEN" },
    impact: { eyebrow: "प्रभाव", title: "भइसकेका काम", viewAll: "सबै हेर्ने", href: "/campaigns?status=COMPLETED" }
  },
  en: {
    near: { eyebrow: "For you", title: "Near You", viewAll: "View All", href: "/campaigns" },
    happening: { eyebrow: "Active", title: "Happening Now & Soon", viewAll: "View All", href: "/campaigns?status=ACTIVE" },
    support: { eyebrow: "Needs support", title: "Needs Your Support", viewAll: "View All", href: "/campaigns?status=OPEN" },
    impact: { eyebrow: "Impact", title: "Impact So Far", viewAll: "View All", href: "/campaigns?status=COMPLETED" }
  }
};

export default function HomeDiscoveryRails({ language = "np", provinceId, districtId }) {
  const { near, happening, support, impact } = useHomeRails({
    language,
    provinceId,
    districtId
  });
  const c = RAIL_COPY[language] || RAIL_COPY.np;

  return (
    <div className="home-discovery-rails">
      <CampaignRail
        eyebrow={c.near.eyebrow}
        title={c.near.title}
        viewAllHref={c.near.href}
        viewAllLabel={c.near.viewAll}
        items={near}
        language={language}
      />
      <CampaignRail
        eyebrow={c.happening.eyebrow}
        title={c.happening.title}
        viewAllHref={c.happening.href}
        viewAllLabel={c.happening.viewAll}
        items={happening}
        language={language}
      />
      <CampaignRail
        eyebrow={c.support.eyebrow}
        title={c.support.title}
        viewAllHref={c.support.href}
        viewAllLabel={c.support.viewAll}
        items={support}
        language={language}
      />
      <CampaignRail
        eyebrow={c.impact.eyebrow}
        title={c.impact.title}
        viewAllHref={c.impact.href}
        viewAllLabel={c.impact.viewAll}
        items={impact}
        language={language}
      />
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/HomeDiscoveryRails.js
git commit -m "feat(home): HomeDiscoveryRails composes the four intent rails

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Wire into the homepage + browser-verify

**Files:**
- Modify: `src/components/HomeSearchView.js` — replace the `<StreamList … defaultMode="issue" … />` block (≈ lines 177–183) with `<HomeDiscoveryRails language={language} />`; remove the now-unused `StreamList` import if nothing else in the file uses it.

**Interfaces:**
- Consumes: `HomeDiscoveryRails` default export (Task 3); the existing `language` value already in scope in `HomeSearchView`.

- [ ] **Step 1: Read the current usage**

Run: open `src/components/HomeSearchView.js`; confirm the exact `<StreamList … />` JSX block and its import line.

- [ ] **Step 2: Add the import**

Add near the other component imports at the top of `src/components/HomeSearchView.js`:

```jsx
import HomeDiscoveryRails from "@/components/HomeDiscoveryRails";
```

- [ ] **Step 3: Replace the StreamList block**

Replace this block:

```jsx
{/* Events live in the coverflow rail above; this stream lists issues only. */}
<StreamList
  language={language}
  copy={search.forYou}
  defaultMode="issue"
  showModeTabs={false}
/>
```

with:

```jsx
{/* Intent-grouped discovery rails (near / happening / support / impact). */}
<HomeDiscoveryRails language={language} />
```

Then delete the `StreamList` import line **only if** no other JSX in this file still references `StreamList` (grep the file first).

- [ ] **Step 4: Lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 5: Browser-verify the live homepage**

Start dev server if not running: `npm run dev` (port 7777). Then drive a real browser (Playwright) to `http://localhost:7777/` and assert the visible artifacts:

1. The old "Nearby issues" two-button header is gone; the coverflow hero rail above is unchanged.
2. At least the "Near You" rail renders a single horizontal row of `CampaignCard`s with adjacent cards peeking at the right edge.
3. Clicking the rail's **next** arrow advances the row; cards fade/vanish at the left edge (mask) and new cards appear at the right.
4. Status rails that have data (e.g. Happening / Support) render; any empty bucket renders **no** rail (no empty/broken row).
5. Each visible rail's "View all →" link points at the correct href (`/campaigns`, `/campaigns?status=ACTIVE`, `/campaigns?status=OPEN`, `/campaigns?status=COMPLETED`).
6. Switch language to EN and confirm Title-Case titles ("Near You", "Happening Now & Soon") and "View All" CTA; NE shows Devanagari titles.

Capture a screenshot of the homepage with the rails for the record.

- [ ] **Step 6: Commit**

```bash
git add src/components/HomeSearchView.js
git commit -m "feat(home): swap nearby grid for intent discovery rails

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Notes / follow-ups (out of this plan)

- `StreamList.js` may become dead once the homepage stops using it. Verify all usages across `src/` before deleting in a separate cleanup commit — other routes may still consume it.
- Re-adding an explicit "use my location" affordance to the Near You rail (the removed geolocation button) is deferred; the rail silently distance-sorts only when permission already exists.
- Combined-rail "View all" links resolve to the dominant status of each bucket (ACTIVE for happening, OPEN for support). If a multi-status `/campaigns` filter is added later, point them there.
