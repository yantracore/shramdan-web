# API-Down Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect when the backend is unreachable/down in one place and surface it
with a single global glassy banner plus consistent inline section states, with
automatic backoff recovery.

**Architecture:** A tiny in-memory singleton (`apiHealth`) is fed by `apiClient`
on every request (fetch-reject + 5xx ⇒ down; any server answer ⇒ up). A global
`ApiHealthWatcher` (mounted in `providers.js`, beside `SessionExpirationWatcher`)
renders the banner and runs a backoff poll while down; on recovery it broadcasts
an event the unified campaign feed re-fetches from. This mirrors the existing
session-expiry pattern (`expireAuthSession` → window event → watcher).

**Tech Stack:** Next.js App Router (client components), React
`useSyncExternalStore`, AntD, plain CSS (glassmorphism), window CustomEvents.

## Global Constraints

- **Frontend only.** No backend change is required to ship this.
- **Detection rule:** a request is "down" when `fetch()` rejects (network/DNS/
  cert) **or** the response status is `502/503/504`. Ordinary `4xx`
  (404/validation/401/429) is **not** down.
- **Recovery:** auto-poll `GET /issues?limit=1` with backoff `5s → 10s → 20s →
  cap 30s` while down; a success flips health up and clears the banner.
- **Health is in-memory, per-tab.** No localStorage — a reload starts clean
  (`status: "up"`).
- **Colour:** the banner must NOT use the campaign state-color-system tokens
  (`docs/design/06-state-color-system.md`). Use a neutral/amber warning
  treatment, visually distinct from the red live badge and teal CTA.
- **Copy/i18n rules (verbatim from project memory):** NE prose is Devanagari;
  brand renders as श्रमदान in NE; NE clickable labels use the agentive `-ने`
  form (e.g. फेरि जोड्ने); EN CTA labels use Title Case.
- **Commits:** never `git add -A`; stage only the files named in the task;
  commit locally, do not push.
- **No unit-test runner exists** in this repo (no jest/vitest). Each task is
  verified by `npm run lint`; the integration milestone (Task 9) is verified in
  a real browser via the Playwright MCP and a final `npm run build`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/lib/apiHealth.js` (new) | The singleton signal: state, report up/down, subscribe, event constants. |
| `src/lib/apiClient.js` (modify) | Report up/down from one wrapped fetch helper. |
| `src/lib/useApiHealth.js` (new) | React binding over the singleton. |
| `src/components/ApiHealthWatcher.js` (new) | Global banner + backoff poll. |
| `src/styles/api-health-banner.css` (new) | Glassy banner styling. |
| `src/app/globals.css` (modify) | `@import` the banner CSS. |
| `src/app/providers.js` (modify) | Mount `ApiHealthWatcher`. |
| `src/lib/siteContent.js` (modify) | `apiDown` copy block (NE + EN). |
| `src/lib/useCampaignFeed.js` (modify) | Outage-aware error + recovery re-fetch. |
| `src/app/campaign/CampaignsListClient.js` (modify) | Outage-aware section copy. |
| `docs/api-requirements/*.md` (modify) | Record the `/health` endpoint ask. |

---

## Task 1: `apiHealth` singleton signal

**Files:**
- Create: `src/lib/apiHealth.js`

**Interfaces:**
- Produces:
  - `API_HEALTH_EVENT: string`, `API_RECOVERED_EVENT: string`
  - `getApiHealth(): { status: "up"|"down", reason: "unreachable"|"service_unavailable"|null }` (stable reference between unchanged reads)
  - `reportApiDown(reason?: "unreachable"|"service_unavailable"): void`
  - `reportApiUp(): void`
  - `subscribeApiHealth(cb: () => void): () => void`
  - `subscribeApiRecovered(cb: () => void): () => void`

- [ ] **Step 1: Create the module**

```js
// src/lib/apiHealth.js
// Backend reachability signal — a tiny singleton mirroring authSession.js.
// apiClient reports up/down here on every request; the global ApiHealthWatcher
// and the campaign feed subscribe. In-memory and per-tab (no localStorage): a
// reload with a live backend starts clean at "up".

export const API_HEALTH_EVENT = "shramdan-api-health";
export const API_RECOVERED_EVENT = "shramdan-api-recovered";

// One frozen "up" object so useSyncExternalStore sees a stable reference and
// never loops. The "down" snapshot is rebuilt only when status/reason changes.
const UP = Object.freeze({ status: "up", reason: null });

let current = UP;

function emit(name) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(name));
  }
}

export function getApiHealth() {
  return current;
}

export function reportApiDown(reason = "unreachable") {
  if (current.status === "down" && current.reason === reason) {
    return; // no change — don't spam events on a burst of failures
  }
  current = Object.freeze({ status: "down", reason });
  emit(API_HEALTH_EVENT);
}

export function reportApiUp() {
  if (current.status === "up") {
    return; // already up — idempotent
  }
  current = UP;
  emit(API_HEALTH_EVENT);
  emit(API_RECOVERED_EVENT);
}

export function subscribeApiHealth(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(API_HEALTH_EVENT, callback);
  return () => window.removeEventListener(API_HEALTH_EVENT, callback);
}

export function subscribeApiRecovered(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(API_RECOVERED_EVENT, callback);
  return () => window.removeEventListener(API_RECOVERED_EVENT, callback);
}
```

- [ ] **Step 2: Lint the new file**

Run: `npm run lint`
Expected: completes with no errors referencing `src/lib/apiHealth.js`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/apiHealth.js
git commit -m "feat(api-health): add backend reachability singleton signal"
```

---

## Task 2: Report health from `apiClient`

**Files:**
- Modify: `src/lib/apiClient.js`

**Interfaces:**
- Consumes: `reportApiDown`, `reportApiUp` from Task 1.
- Produces: `ApiError` instances with `errorCode: "SERVER_UNREACHABLE"` (status `0`)
  on network failure and `errorCode: "SERVICE_UNAVAILABLE"` on 502/503/504.

- [ ] **Step 1: Add the import** at the top of `src/lib/apiClient.js`, after the
  existing `authSession` import block (after line 7):

```js
import { reportApiDown, reportApiUp } from "@/lib/apiHealth";
```

- [ ] **Step 2: Add a tracked-fetch helper.** Insert immediately above
  `async function parseResponse(response) {` (currently line 142):

```js
const UNAVAILABLE_STATUSES = new Set([502, 503, 504]);

// One choke point for every network call. Translates a dead/unreachable backend
// (fetch reject) and gateway 5xx into ApiError + a health "down" report, and
// reports "up" whenever the server actually answers (even a normal 4xx).
async function trackedFetch(url, init) {
  let response;
  try {
    response = await fetch(url, init);
  } catch {
    reportApiDown("unreachable");
    throw new ApiError("Can't reach the server right now.", {
      errorCode: "SERVER_UNREACHABLE",
      status: 0
    });
  }

  if (UNAVAILABLE_STATUSES.has(response.status)) {
    reportApiDown("service_unavailable");
    throw new ApiError("The server is temporarily unavailable.", {
      errorCode: "SERVICE_UNAVAILABLE",
      status: response.status
    });
  }

  reportApiUp();
  return response;
}
```

- [ ] **Step 3: Route the refresh call through it.** In `performRefresh`,
  replace (currently lines 90-94):

```js
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
```

with:

```js
  const response = await trackedFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
```

- [ ] **Step 4: Route the main request through it.** In `apiRequest`, replace
  (currently lines 186-190):

```js
  const response = await fetch(createApiUrl(path, params), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(compactPayload(body))
  });
```

with:

```js
  const response = await trackedFetch(createApiUrl(path, params), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(compactPayload(body))
  });
```

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no errors referencing `src/lib/apiClient.js`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/apiClient.js
git commit -m "feat(api-health): report up/down from apiClient fetch choke point"
```

---

## Task 3: `useApiHealth` hook

**Files:**
- Create: `src/lib/useApiHealth.js`

**Interfaces:**
- Consumes: `getApiHealth`, `subscribeApiHealth` from Task 1.
- Produces: `useApiHealth(): { status, reason }`.

- [ ] **Step 1: Create the hook**

```js
// src/lib/useApiHealth.js
"use client";

import { useSyncExternalStore } from "react";
import { getApiHealth, subscribeApiHealth } from "@/lib/apiHealth";

// Stable server snapshot so SSR markup matches the first client paint (always
// "up" — the banner only ever appears after a real failed request).
const SERVER_SNAPSHOT = { status: "up", reason: null };

export function useApiHealth() {
  return useSyncExternalStore(
    subscribeApiHealth,
    getApiHealth,
    () => SERVER_SNAPSHOT
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors referencing `src/lib/useApiHealth.js`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/useApiHealth.js
git commit -m "feat(api-health): add useApiHealth hook"
```

---

## Task 4: `apiDown` copy (NE + EN)

**Files:**
- Modify: `src/lib/siteContent.js`

**Interfaces:**
- Produces: `copy[lang].apiDown = { bannerTitle, bannerHint, sectionTitle, sectionBody, retry }`.

- [ ] **Step 1: Add the NE block.** Find the Nepali `messages` block that ends
  with `consentRequired: "जारी राख्न शर्तहरूमा सहमत हुनुपर्छ।"` followed by `    },`
  (around line 848-849). Insert the `apiDown` block immediately after that
  closing `},`:

```js
    apiDown: {
      bannerTitle: "सर्भर अहिले विश्राममा",
      bannerHint: "फेरि जोड्दैछौँ…",
      sectionTitle: "सर्भर भेटिएन",
      sectionBody: "केही बेरमा आफैं फेरि जोड्ने प्रयास गर्छौं।",
      retry: "फेरि जोड्ने"
    },
```

- [ ] **Step 2: Add the EN block.** Find the English `messages` block that ends
  with `consentRequired: "You must agree to the terms to continue."` followed by
  `    },` (around line 2660-2661). Insert immediately after that closing `},`:

```js
    apiDown: {
      bannerTitle: "Our servers are taking a breather",
      bannerHint: "Reconnecting…",
      sectionTitle: "Couldn't reach the server",
      sectionBody: "We'll keep trying to reconnect automatically.",
      retry: "Try Again"
    },
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors referencing `src/lib/siteContent.js`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/siteContent.js
git commit -m "feat(api-health): add bilingual apiDown copy"
```

---

## Task 5: Banner styles

**Files:**
- Create: `src/styles/api-health-banner.css`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: class `.api-health-banner` (+ `-dot`, `-title`, `-hint`) consumed by Task 6.

- [ ] **Step 1: Create the stylesheet.** A glassy amber pill pinned bottom-center
  (bottom-center clears the sticky navbar and causes no layout shift — a small,
  deliberate change from the top mock shown in brainstorming).

```css
/* src/styles/api-health-banner.css */
/* Outage banner. Neutral/amber warning treatment — deliberately NOT a
   campaign state-color token, and distinct from the red live badge + teal CTA.
   Bottom-center glassy pill: visible without covering the navbar. */

.api-health-banner {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 1200;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100vw - 32px);
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 0.9rem;
  line-height: 1.2;
  color: #7a4f00;
  background: color-mix(in srgb, #f5a623 14%, rgba(255, 255, 255, 0.72));
  border: 1px solid color-mix(in srgb, #f5a623 38%, transparent);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  animation: api-health-rise 240ms ease-out;
}

.api-health-banner-title {
  font-weight: 700;
}

.api-health-banner-hint {
  opacity: 0.82;
}

.api-health-banner-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #e8870b;
  box-shadow: 0 0 0 0 rgba(232, 135, 11, 0.55);
  animation: api-health-pulse 1.6s ease-out infinite;
}

[data-theme="dark"] .api-health-banner {
  color: #ffd89b;
  background: color-mix(in srgb, #f5a623 20%, rgba(20, 22, 26, 0.74));
  border-color: color-mix(in srgb, #f5a623 42%, transparent);
}

@keyframes api-health-pulse {
  0% { box-shadow: 0 0 0 0 rgba(232, 135, 11, 0.55); }
  70% { box-shadow: 0 0 0 10px rgba(232, 135, 11, 0); }
  100% { box-shadow: 0 0 0 0 rgba(232, 135, 11, 0); }
}

@keyframes api-health-rise {
  from { opacity: 0; transform: translate(-50%, 12px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .api-health-banner { animation: none; }
  .api-health-banner-dot { animation: none; }
}
```

- [ ] **Step 2: Import it.** In `src/app/globals.css`, add after the existing
  `@import "../styles/contribute.css";` line (currently line 17):

```css
@import "../styles/api-health-banner.css";
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/api-health-banner.css src/app/globals.css
git commit -m "feat(api-health): glassy outage banner styles"
```

---

## Task 6: `ApiHealthWatcher` (banner + backoff poll), mounted globally

**Files:**
- Create: `src/components/ApiHealthWatcher.js`
- Modify: `src/app/providers.js`

**Interfaces:**
- Consumes: `useApiHealth` (Task 3), `copy` + `usePreferences` for language,
  `getJson` (apiClient), `.api-health-banner` styles (Task 5), `apiDown` copy (Task 4).
- Produces: a globally-mounted `<ApiHealthWatcher />`.

- [ ] **Step 1: Create the component**

```js
// src/components/ApiHealthWatcher.js
"use client";

import { useEffect } from "react";
import { getJson } from "@/lib/apiClient";
import { useApiHealth } from "@/lib/useApiHealth";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

// Backoff schedule while down: 5s → 10s → 20s → 30s (capped).
const POLL_STEPS = [5000, 10000, 20000, 30000];

export function ApiHealthWatcher() {
  const { status } = useApiHealth();
  const { language } = usePreferences();
  const down = status === "down";

  useEffect(() => {
    if (!down) return undefined;

    let cancelled = false;
    let attempt = 0;
    let timer = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        // A successful response flips health to "up" via apiClient, which
        // re-renders this component to null and tears the loop down. The
        // payload is irrelevant — we only care that the server answered.
        await getJson("/issues", { params: { limit: 1 } });
      } catch {
        // Still unreachable — apiClient already re-reported "down".
      }
      if (cancelled) return;
      const delay = POLL_STEPS[Math.min(attempt, POLL_STEPS.length - 1)];
      attempt += 1;
      timer = window.setTimeout(poll, delay);
    };

    timer = window.setTimeout(poll, POLL_STEPS[0]);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [down]);

  if (!down) return null;

  const t = (copy[language] ?? copy.np).apiDown;

  return (
    <div className="api-health-banner" role="status" aria-live="polite">
      <span className="api-health-banner-dot" aria-hidden="true" />
      <span className="api-health-banner-title">{t.bannerTitle}</span>
      <span className="api-health-banner-hint">{t.bannerHint}</span>
    </div>
  );
}
```

- [ ] **Step 2: Import it in providers.** In `src/app/providers.js`, add after
  the `SessionExpirationWatcher` import (currently line 7):

```js
import { ApiHealthWatcher } from "@/components/ApiHealthWatcher";
```

- [ ] **Step 3: Mount it.** In the same file, inside `<AntdApp>`, add the watcher
  right after `<SessionExpirationWatcher />` (currently line 273):

```jsx
          <SessionExpirationWatcher />
          <ApiHealthWatcher />
```

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors referencing the new component or `providers.js`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ApiHealthWatcher.js src/app/providers.js
git commit -m "feat(api-health): global outage banner with backoff recovery poll"
```

---

## Task 7: Outage-aware error + recovery re-fetch in the campaign feed

**Files:**
- Modify: `src/lib/useCampaignFeed.js`

**Interfaces:**
- Consumes: `getApiHealth`, `subscribeApiRecovered` (Task 1).
- Produces: `error` is `"offline"` when the failure is an outage (else
  `"load_failed"`); the feed re-runs its load when `API_RECOVERED_EVENT` fires.

- [ ] **Step 1: Add the import.** In `src/lib/useCampaignFeed.js`, after the
  existing `import { getJson } from "@/lib/apiClient";` line (currently line 20):

```js
import { getApiHealth, subscribeApiRecovered } from "@/lib/apiHealth";
```

- [ ] **Step 2: Add a reload trigger + recovery subscription.** Inside
  `useCampaignFeed`, right after the three `useState` declarations (currently
  lines 65-67), add:

```js
  const [reloadKey, setReloadKey] = useState(0);

  // When the backend comes back, re-run the current load so the page fills in
  // without the user having to navigate or hit retry.
  useEffect(() => subscribeApiRecovered(() => setReloadKey((k) => k + 1)), []);
```

- [ ] **Step 3: Make the error outage-aware and depend on the reload trigger.**
  Replace the load effect (currently lines 88-110):

```js
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    (async () => {
      try {
        const { merged, anyError } = await load();
        if (cancelled) return;
        setItems(merged);
        if (anyError && merged.length === 0) setError("load_failed");
      } catch {
        if (cancelled) return;
        setItems([]);
        setError("load_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);
```

with:

```js
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    (async () => {
      try {
        const { merged, anyError } = await load();
        if (cancelled) return;
        setItems(merged);
        if (anyError && merged.length === 0) {
          setError(getApiHealth().status === "down" ? "offline" : "load_failed");
        }
      } catch {
        if (cancelled) return;
        setItems([]);
        setError(getApiHealth().status === "down" ? "offline" : "load_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, reloadKey]);
```

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors referencing `src/lib/useCampaignFeed.js`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/useCampaignFeed.js
git commit -m "feat(api-health): campaign feed shows offline state + auto re-fetch on recovery"
```

---

## Task 8: Outage-aware section copy on the campaign list

**Files:**
- Modify: `src/app/campaign/CampaignsListClient.js`

**Interfaces:**
- Consumes: `copy[lang].apiDown` (Task 4), `error === "offline"` (Task 7).

- [ ] **Step 1: Bind the apiDown copy.** In `CampaignsListClient.js`, after the
  line `const issuesCopy = (copy[language] || copy.np).issues;` (currently line
  120), add:

```js
  const apiDownCopy = (copy[language] || copy.np).apiDown;
```

- [ ] **Step 2: Branch the error block on the offline state.** Replace the
  `showError` block (currently lines 657-669):

```jsx
        {showError ? (
          <div className="public-issues-error" role="alert">
            <h2>{issuesCopy.states.errorTitle}</h2>
            <p>{issuesCopy.states.errorBody}</p>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setFilter("status", filters.status)}
              type="primary"
            >
              {issuesCopy.states.retry}
            </Button>
          </div>
        ) : null}
```

with:

```jsx
        {showError ? (
          <div className="public-issues-error" role="alert">
            <h2>{error === "offline" ? apiDownCopy.sectionTitle : issuesCopy.states.errorTitle}</h2>
            <p>{error === "offline" ? apiDownCopy.sectionBody : issuesCopy.states.errorBody}</p>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => setFilter("status", filters.status)}
              type="primary"
            >
              {error === "offline" ? apiDownCopy.retry : issuesCopy.states.retry}
            </Button>
          </div>
        ) : null}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors referencing `CampaignsListClient.js`.

- [ ] **Step 4: Commit**

```bash
git add src/app/campaign/CampaignsListClient.js
git commit -m "feat(api-health): campaign list shows outage-aware section copy"
```

---

## Task 9: Integration verification (browser) + build

**Files:** none (verification only).

This task proves the whole loop end-to-end, per the project's verify-in-browser
norm. Use the Playwright MCP browser tools.

- [ ] **Step 1: Start the dev server pointed at a dead backend.** In one shell:

```bash
NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:9/api/v1" npm run dev
```

(`127.0.0.1:9` is the discard port — connections are refused, so every request
rejects, exercising the `unreachable` path. On Windows PowerShell:
`$env:NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:9/api/v1"; npm run dev`.)

- [ ] **Step 2: Load the campaign page and assert the outage UI.**
  - Navigate to `http://localhost:7777/campaign`.
  - Assert the `.api-health-banner` is visible with the NE title `सर्भर अहिले विश्राममा`.
  - Assert the list section shows the offline copy `सर्भर भेटिएन` (not the
    generic error title).
  - Take a screenshot for the record.

- [ ] **Step 3: Assert auto-recovery.**
  - Stop the dev server and restart it WITHOUT the override (real/valid
    `NEXT_PUBLIC_API_BASE_URL`, i.e. the current working backend).
  - Reload `/campaign`; within one poll cycle (≤ ~5s after the backend answers)
    the banner must disappear on its own and the list must populate.
  - Take a screenshot showing the banner gone and content present.

  (To watch recovery live without restarting, you can instead start with a valid
  backend, block its host via the browser's request interception to force
  `down`, then unblock and confirm the banner clears within a poll cycle.)

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: build succeeds with no type/lint errors.

- [ ] **Step 5: Commit any incidental fixes** surfaced by the build, each with a
  focused message. If none, skip.

---

## Task 10: Record the `/health` endpoint follow-up

**Files:**
- Modify: the matching `docs/api-requirements/<domain>.md` (pick the
  infra/platform-level doc; create a short section if none fits).

**Interfaces:** docs only.

- [ ] **Step 1: Add a requirement note** asking backend (Pranish) for a
  dedicated lightweight, unauthenticated `GET /health` (or `/ping`) endpoint
  that returns a tiny `200` quickly, so the recovery poll stops leaning on
  `GET /issues?limit=1`. Note the current temporary use and the desired
  contract (no auth, no DB heavy work, cache-bust friendly).

- [ ] **Step 2: Commit**

```bash
git add docs/api-requirements
git commit -m "docs(api-requirements): request lightweight /health endpoint for outage poll"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** singleton signal (T1), apiClient detection (T2), hook (T3),
  banner + auto-poll/backoff (T6), graceful inline + recovery re-fetch (T7/T8),
  bilingual copy (T4), glassy non-state colour (T5), follow-up `/health` (T10),
  browser verification (T9). All spec sections map to a task.
- **Deliberate deviations from spec, noted for the reviewer:**
  1. Banner is bottom-center (not top) to avoid navbar overlap / layout shift.
  2. The spec's `EmptyState kind="offline"` art is **dropped** as YAGNI: the
     unified `/campaign` surface renders its own `.public-issues-error` block,
     so a new `EmptyState` kind would be dead code this round. The standardized
     offline state is delivered via that existing block + `apiDown` copy (T8).
     If another surface later needs the illustration, add it then.
- **Placeholder scan:** no TBD/TODO; every code step shows full code.
- **Type consistency:** `reportApiDown`/`reportApiUp`/`getApiHealth`/
  `subscribeApiHealth`/`subscribeApiRecovered`/`API_HEALTH_EVENT`/
  `API_RECOVERED_EVENT` and the `{status, reason}` shape and the `"offline"`
  error sentinel are used identically across T1–T8.
