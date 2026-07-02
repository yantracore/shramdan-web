# API-Down Handling — Design

**Date:** 2026-06-26
**Status:** Approved (design); pending implementation plan
**Scope:** Frontend (shramdan-web) only — no backend changes required to ship.

## Problem

Every page fetches its data client-side through `getJson`/`apiRequest`
(`src/lib/apiClient.js`). When the backend is fully down, two things go wrong:

1. **No central signal.** Each surface invents its own ad-hoc failure UI
   (e.g. `useCampaignFeed` sets `error = "load_failed"`), so the experience is
   inconsistent across pages and the user can't tell "the whole backend is
   down" from "this one section failed."
2. **Network failures escape the error model.** When the server is unreachable
   (DNS, refused connection, expired TLS cert), `fetch()` rejects with a raw
   `TypeError` ("Failed to fetch") — **not** an `ApiError`. Nothing catches it
   centrally, so pages blank out or show a stray error.

This is not hypothetical: the staging backend (`backend.shramdan.org`) and the
temporary devtunnel both flap and go down regularly, so the outage state is a
first-class state the UI must handle gracefully.

## Decisions (locked)

- **Presentation:** A single global glassy **banner** + **graceful inline
  section states**. Non-blocking — page chrome and any cached content stay
  visible; nothing takes over the screen.
- **Detection:** A request counts as "backend down" when `fetch()` rejects
  (network/DNS/cert) **or** the response status is `502/503/504`. Ordinary
  `4xx` (404, validation, 401-auth, 429) do **not** count as down — those are
  handled by their existing flows.
- **Recovery:** **Auto-poll with backoff** while down. When the backend
  answers again, the banner clears itself and the main list surfaces re-fetch.

## Architecture

The design mirrors the existing, proven session-expiry pattern:
`expireAuthSession()` (`src/lib/authSession.js`) dispatches a window event that
`SessionExpirationWatcher` (mounted in `providers.js`) listens for and reacts
to globally. API health follows the same shape.

```
apiClient.apiRequest()  ──reports──►  apiHealth (singleton + window event)
                                            │
                                  subscribeApiHealth / useApiHealth
                                            │
                          ┌─────────────────┴───────────────────┐
                   ApiHealthWatcher                      list hooks / sections
                   (global banner +                      (inline EmptyState +
                    auto-poll loop)                        recovery re-fetch)
```

### 1. `src/lib/apiHealth.js` — the singleton signal

A small module mirroring `authSession.js`. Module-scoped in-memory state (no
localStorage — health is per-tab and should reset on reload).

- State: `{ status: "up" | "down", reason: "unreachable" | "service_unavailable" | null }`
- `reportApiDown(reason)` — set `down`; dispatch `API_HEALTH_EVENT` **only when
  state actually changes** (status up→down, or reason changes) to avoid event
  spam on a burst of failing requests.
- `reportApiUp()` — set `up`; dispatch `API_HEALTH_EVENT` only on down→up. Also
  dispatch a one-shot `API_RECOVERED_EVENT` so live surfaces can re-fetch.
- `getApiHealth()` — current snapshot (stable reference between unchanged
  reads, so `useSyncExternalStore` doesn't loop).
- `subscribeApiHealth(cb)` / `subscribeApiRecovered(cb)` — window-event
  subscriptions; SSR-safe (no-op when `window` is undefined).
- Constants: `API_HEALTH_EVENT = "shramdan-api-health"`,
  `API_RECOVERED_EVENT = "shramdan-api-recovered"`.

Default status is `"up"`, so there is no first-paint flash of the banner; it
only appears after a real failed request.

### 2. `src/lib/apiClient.js` — detection in one place

Wrap the two `fetch()` call sites (`apiRequest` and `performRefresh`) so every
hook and page is covered without touching them individually:

- `fetch()` throws (rejected promise) → `reportApiDown("unreachable")`, then
  rethrow as `new ApiError("…", { errorCode: "SERVER_UNREACHABLE", status: 0 })`
  so callers see a normal `ApiError` instead of a raw `TypeError`.
- Got a response with status ∈ `{502, 503, 504}` →
  `reportApiDown("service_unavailable")` and throw `ApiError` code
  `SERVICE_UNAVAILABLE`.
- Got **any** response the server produced (2xx, or an ordinary 4xx) →
  `reportApiUp()`. The server is reachable even if this particular request
  failed for app reasons.

Keep this DRY with a tiny internal helper (e.g. `trackedFetch(url, init)`) used
by both call sites. The poll's own request flows through `getJson`, so a
successful poll reports `up` automatically — the watcher does not need to call
`reportApiUp()` itself.

### 3. `src/lib/useApiHealth.js` — thin React binding

```js
useApiHealth() // = useSyncExternalStore(subscribeApiHealth, getApiHealth, () => UP_SNAPSHOT)
```

Returns the current `{ status, reason }`. Server snapshot is always `up` so SSR
markup matches the initial client paint.

### 4. `src/components/ApiHealthWatcher.js` — global banner + poll

Mounted in `providers.js` next to `SessionExpirationWatcher`. Behavior:

- Reads `useApiHealth()`. When `status === "down"`, render the banner; when
  `"up"`, render nothing.
- **Banner:** sticky at the top, glassmorphism treatment consistent with the
  project's design language. Content: a warning glyph + title +
  reconnecting hint + a subtle pulse. Bilingual copy from `siteContent`.
  Honors `prefers-reduced-motion` (no pulse animation when reduced).
- **Colour:** this is **not** a campaign-lifecycle state, so it must **not**
  use the state-color-system tokens (`docs/design/06-state-color-system.md`).
  Use a neutral/amber warning treatment, visually distinct from the live-events
  rail so "live" and "outage" never read alike.
- **Auto-poll with backoff:** while down, poll a cheap public endpoint
  (`GET /issues?limit=1`) on an interval that backs off `5s → 10s → 20s →
  cap 30s`. A successful poll flips health to `up` via apiClient, which hides
  the banner and fires `API_RECOVERED_EVENT`. The poll loop starts when the
  banner mounts (down) and is fully torn down on unmount/recovery (no leaked
  timers; guard against overlapping polls).

No manual retry button on the banner (auto-poll was chosen); the inline section
state still carries a retry affordance (below) for users who want to act now.

### 5. Graceful inline section states

- Add a new `kind="offline"` illustration to `src/components/EmptyState.js`
  (a cloud-with-slash / lost-signal mark, `currentColor` like the others).
- Replace the ad-hoc `"load_failed"` rendering in the **main public list
  surfaces** (campaign feed, events list, issues list) with this standardized
  state: offline art + bilingual title/body + a retry button that re-runs the
  hook's loader.
- Those same surfaces subscribe to `API_RECOVERED_EVENT`
  (via `subscribeApiRecovered`) and auto re-fetch on recovery. Surfaces not
  wired this round recover naturally on the next navigation/interaction.

### 6. Copy — `src/lib/siteContent.js`

Add a `copy[lang].apiDown` block in both languages:

- `bannerTitle` — NE: "सर्भर अहिले विश्राममा", EN: "Our servers are taking a breather"
- `bannerHint` — NE: "फेरि जोड्दैछौँ…", EN: "Reconnecting…"
- `sectionTitle` — NE: "सर्भर भेटिएन", EN: "Couldn't reach the server"
- `sectionBody` — short reassurance that it'll retry automatically
- `retry` — NE: "फेरि जोड्ने" (agentive form), EN: "Try Again" (Title Case)

Brand/language rules apply: NE renders the brand as श्रमदान; NE prose is
Devanagari; NE clickable labels use the agentive `-ने` form; EN CTA labels use
Title Case.

## Out of scope (YAGNI)

- Full-page takeover / blocking outage screen.
- PWA / service-worker offline caching changes.
- Per-failed-mutation toast spam — the global banner is the single outage
  signal; individual mutation failures keep their existing inline form errors.
- Wiring recovery auto-reload into *every* hook — only the main public list
  surfaces this round.

## Follow-ups

- **API requirements:** record a request to Pranish (backend) for a dedicated
  lightweight, unauthenticated `GET /health` (or `/ping`) endpoint so the poll
  doesn't lean on `/issues?limit=1`. Update the matching
  `docs/api-requirements/<domain>.md` in the implementing session
  (per the api-requirements workflow).

## Testing & verification

- **Logic:** simulate `fetch` reject → health flips `down` (reason
  `unreachable`); 503 response → `down` (reason `service_unavailable`); 200 →
  `up`. Verify the event fires only on state change.
- **Browser (required before "done"):** point `NEXT_PUBLIC_API_BASE_URL` at a
  dead URL, load a page in Playwright, assert the banner appears and a section
  shows the offline state; restore the URL, assert the banner auto-clears
  within a poll cycle and the section re-fetches.

## New / touched files

**New:** `src/lib/apiHealth.js`, `src/lib/useApiHealth.js`,
`src/components/ApiHealthWatcher.js`, `src/styles/api-health-banner.css`,
this spec.

**Touched:** `src/lib/apiClient.js`, `src/app/providers.js`,
`src/components/EmptyState.js`, `src/lib/siteContent.js`, and the main public
list hooks (campaign feed / events / issues).
