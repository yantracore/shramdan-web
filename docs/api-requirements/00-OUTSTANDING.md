# Outstanding Backend Requirements — handoff

> The short list of what the frontend still needs from the backend.
> **Everything not listed here is already live** on `api.shramdan.org`.
> **Re-verified 2026-06-30 (round 2, after Pranish's deploy)** — each item matched against the **live API** (`api.shramdan.org`, authenticated member + admin calls), the refreshed OpenAPI spec (`../engineering/07-api-reference.json`, 91 paths), **and** the frontend code. Seven items shipped in this deploy and were closed (see "Closed 2026-06-30 (round 2)" below); the FE is being rewired onto them now.
> Per-field prose + state machines live in each domain file; this is just the punch list.
> Owner: Pranish (backend).

---

## P1 — blocks shipped UX (frontend workaround in place today)

1. **issues — per-viewer echo on the `GET /issues/{id}` DETAIL read** (`isVoted` + `voterRole` + `eventRole`). Live-verified 2026-06-30 (authenticated): the **list** read (`GET /issues`) now returns all three ✅, but the **detail** read still returns **none** of them. So an opened issue page still pays one extra `GET /issues/me/votes` round-trip to seed "Supported / Joined-as-role / Leading" on refresh. Smallest unlock: echo on the detail read what `POST /issues/{id}/vote` already stored (same shape the list now returns). → [issues.md](issues.md)

## P2 — functionality gaps

2. **issues** — author withdraw: `POST /issues/{id}/withdraw` or let the reporter set a `WITHDRAWN` status on their own OPEN issue. Spec-verified 2026-06-30: no `/withdraw` route, and the `/issues/{id}/status` enum is `OPEN|COMPLETED|REJECTED|DUPLICATE` (no `WITHDRAWN`); `DELETE` is moderator-only. Completes My-issues CRUD. → [issues.md](issues.md)
3. **notifications** — add `GET /notifications/preferences` → `{ sms, email, push }`. Live-verified 2026-06-30: `GET` returns **404**; only `PUT` exists, so channel toggles can't reflect saved state. → [notifications.md](notifications.md)
4. **notifications** — add `GET /notifications/stream` (SSE) to the OpenAPI spec. Spec-verified 2026-06-30: absent (`/comments/stream` is documented as the sibling pattern — mirror it). Works on staging; just undocumented. → [notifications.md](notifications.md)
5. **events** — reminder-cadence config so participants get pre-event reminders (the `activate` half of this old item was dropped — SCHEDULED→ACTIVE is time-derived, see "Closed (round 1)"). Genuinely backend (scheduled notifications); group with notifications. Spec-verified 2026-06-30: no reminder-cadence field. → [events.md](events.md), [notifications.md](notifications.md)
6. **campaigns — exact per-stage COUNTS** (the feed + map shipped; see closed list). The unified feed `GET /campaigns` returns `{ data: { items, nextCursor } }` but **no per-stage totals**, and there is no `GET /campaigns/counts`. The status-chip badges still can't show a true count beyond the page size. **Requested:** either a `GET /campaigns/counts` honoring the same filters (`{ OPEN, DRAFT, SCHEDULED, ACTIVE, COMPLETED, total }`), or a `counts` block on the `GET /campaigns` response. Until then the FE keeps its capped (≤100) badge workaround. → [campaigns-feed.md](campaigns-feed.md)
7. **members** — behavioural confirms on the now-shipped admin user routes (`PATCH /users/{id}` landed ✅): confirm the `GET /users` `take` Int-cast bug is fixed, and that `DELETE /users/{id}` soft-deletes + cascades ownership to a tombstone. → [members.md](members.md)
8. **event-participants** — confirm `POST /events/{id}/participants/{id}/check-in` is **not** gated on stored `status === ACTIVE`. Since SCHEDULED→ACTIVE is now time-derived on the FE (no activate endpoint), the stored status may stay `SCHEDULED` through the event window unless a backend cron flips it — check-in must still work in that window. → [event-participants.md](event-participants.md)

## P3 — entities not started (frontend stubbed / future)

- **incidents** — FE panels exist (roadmap 4.2); also unblocks events pause/resume + `riskLevel`. The panel already degrades gracefully on a 404/501, so this is non-blocking. → [incidents.md](incidents.md)

## P4 — minor / nice-to-have

- **issues** — `wantToLeadCount` (+ a `WANT_TO_LEAD` roster); per-role target counts on the OPEN issue. Live-verified 2026-06-30: no `wantToLeadCount` on the issue read.
- **applications / feedback** — multi-attachment arrays (`resumeIds` / `portfolioIds` / `screenshotIds`, ≤5 each). Live-verified 2026-06-30: requests still take **singular** `resumeId` / `portfolioId` / `screenshot` only.
- **comments** — admin **pin** + flag-management endpoints (pin is a localStorage overlay today). _(Flagging already exists via `POST /comments/{id}/report`.)_
- **events / event-participants** — optional SSE: roster-changes + risk-level streams; publish the notifications `type` enum.
- **campaigns** — feed item is minimal (`{ slug, status, lat, lng, title, addressText, image }`) — **no `voteCount` / `participantCount`**, so a card can't show "N supporters / N joined" without a per-item refetch. Nice-to-have: add those two counts to the feed item. (Not blocking — cards render without the meta badge.)
- **applications — `ApplicationRole` enum mismatch — NOT a backend ask (FE-side dead config).** `siteContent.js` lists three values the backend rejects (`QA_ENGINEER` / `DEVOPS_ENGINEER` / `CONTENT_WRITER`), but `ContributorForm.js` hard-codes `role: "VOLUNTEER"` on submit, so they're never sent. FE cleanup only — logged so it isn't mistaken for a Pranish item.

---

## Closed 2026-06-30 (round 2) — shipped by Pranish's deploy, FE rewiring onto them

- **events — issue `translations` embed** ✅ — `GET /events` now embeds `issue.translations` (live-verified, len 2). Bilingual event titles work; the `humanizeSlug` fallback becomes a true last resort. (Was P1 #1.)
- **events — `viewerParticipation`** ✅ — `GET /events` is now auth-aware (`auth false→true`); authenticated reads carry `viewerParticipation` (null when not joined), public reads omit it. Drops the per-event `/participants/me` round-trip. (Was P1 #3.)
- **issues — `uploadIds[]` on `PATCH /issues/{id}`** ✅ — request schema now accepts `uploadIds: string[]:uuid`. Unlocks the photo editor on the issue edit forms. (Was P2 #4.)
- **members — admin `PATCH /users/{id}`** ✅ — landed with body `{ name, email, phone, username, avatar, city, bio, isVerified }` (bearerAuth). Unlocks the read-only admin users page. (Was P2 #8; behavioural confirms moved to P2 #7.)
- **campaigns — unified feed `GET /campaigns`** ✅ — `{ data: { items, nextCursor } }`, true cursor pagination (verified page-to-page), filters `status / category / municipality / ward / provinceId / districtId / search / locale / sort / order / limit / cursor`, **plus bbox `north/south/east/west`**. Items are card-ready: `{ slug, status, lat, lng, title (localized), addressText, image }`. (Was P2 #10a.)
- **campaigns — map covered by the same endpoint** ✅ — the feed item carries `lat`/`lng` and `GET /campaigns` accepts a bbox, so map mode uses `/campaigns` directly; no separate `/campaigns/map` needed. (Was P2 #10c.)
- **campaigns — unified detail `GET /campaigns/{slug}`** ✅ — `{ slug, status, issue, event, eventRoleCounts }`.
- **issues — `voterRole` + `eventRole` on the LIST read** ✅ — `GET /issues` now returns both alongside `isVoted` (previously `isVoted` only). The page-wide `me/votes` decoration round-trip can drop for list surfaces (detail still needs it until P1 #1 ships).

## Closed (round 1, earlier 2026-06-30)

- **issues — event embed on `GET /issues/{id}`** ✅ — detail read embeds `event { id, slug, status, scheduledAt, leaderId }` on promoted issues.
- **comments — per-viewer `myReactions` on reads** ✅ — documented in the live spec.
- **applications — `additionalInfo` optional** ✅ — not in the `POST /applications` `required` set.
- **event-participants — SCHEDULED = WORKER-only** ✅ (2026-06-26) — `POST /events/{id}/participants` documents `DRAFT → any role · SCHEDULED → WORKER only · ACTIVE → WORKER only · PAUSED/COMPLETED/CANCELLED → closed`. → [event-participants.md](event-participants.md)
- **events — `POST /events/{id}/activate` DROPPED** 🚫 (product call) — SCHEDULED→ACTIVE is **time-derived** (`scheduledAt ≤ now ≤ scheduledAt + durationMinutes`), no admin force, no endpoint. `COMPLETED` stays a deliberate `POST /events/{id}/complete`. The check-in caveat is tracked as P2 #8.

> **Doc-hygiene note (not a backend ask):** the live issue `status` enum is `OPEN | EVENT_DRAFT | COMPLETED | REJECTED | DUPLICATE` — `issues.md` still says `EVENT_SCHEDULED`. Frontend already reads `EVENT_DRAFT`; the domain doc just needs a terminology pass.

---

## Deferred to v2 — not part of this handoff

> **Moved to v2 on 2026-06-30** (product decision): the four entities below are dropped from v1. The frontend has been de-wired from the v1 surfaces — components/routes stay in the repo but no v1 page links into them, and no mock data feeds a shipped surface (all-live, zero-dummy v1).

- **live-streams** — **the home rail no longer means "livestream"; it now shows real _ongoing_ (ACTIVE) events** ("Happening now"), fed by live `GET /events?status=ACTIVE` — no mock, no `liveStream` field reads. The actual live-video playback feature (stream URL, viewer count, player) is the v2 item. → [live-streams.md](live-streams.md)
- **discussions** + **feature-votes** — discontinued from v1. Already out of the main nav; the remaining v1 entry point (the "Related Discussion" presence block on `/events/[id]`, which read the stub) was removed 2026-06-30. The `/discussions` + `/members/[slug]` routes/components stay but are reachable only directly. → [discussions.md](discussions.md), [feature-votes.md](feature-votes.md)
- **donations** — Phase 6 transparency ledger (`/ledger`). The `/ledger` route/component stays (dev-only demo data, `isDev()`-gated) but the v1 link into it (the intro "public ledger" tile link) was removed 2026-06-30. → [donations.md](donations.md)
- **meetings** — two-meeting kickoff / pre-execution flow; no UI consumes it and the TV-app pivot reshaped the planning model. → [meetings.md](meetings.md)
- **app-development** — task board folded into `/discussions` (also v2 now). → [app-development.md](app-development.md)
