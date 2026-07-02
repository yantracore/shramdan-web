# Outstanding Backend Requirements — handoff

> The short list of what the frontend still needs from the backend.
> **Everything not listed here is already live** on `api.shramdan.org`.
> **Re-verified 2026-07-01 (round 3, against the LIVE API)** — each item was matched against live authenticated calls, not just the OpenAPI spec. ⚠️ **The spec is currently out of sync with live** (it lists `GET /campaigns` as removed, but live serves it — enriched). Trust the live API. Seven-plus items shipped across the last two deploys and were closed (see "Closed" below); the FE is wired onto them.
> Owner: Pranish (backend).

---

## P1 — blocks shipped UX

1. **campaigns — `viewerParticipation` on event-stage `mode=maximum` items** (2026-07-02).
   Authenticated `GET /campaigns?mode=maximum` carries only the `myVote` vote echo; a
   direct event join (`POST /events/{id}/participants`) never sets it, so list cards
   can't show "Joined as …" after a refresh. Mirror the `GET /events` embed (caller's
   `EventParticipant` row or `null`) on every non-OPEN item. FE ships an interim bulk
   sweep over `GET /events?status=DRAFT|SCHEDULED|ACTIVE` (3 extra requests per feed
   mount, breaks past 100 events/stage) — remove it when this lands. → [campaigns-feed.md](campaigns-feed.md)

## P2 — functionality gaps

1. **events** — reminder-cadence config so participants get pre-event reminders (scheduled notifications; backend-owned). Spec-verified: no reminder-cadence field. → [events.md](events.md), [notifications.md](notifications.md)
2. **members** — behavioural confirms on the shipped admin user routes (`PATCH /users/{id}` landed ✅): confirm the `GET /users` `take` Int-cast bug is fixed, and that `DELETE /users/{id}` soft-deletes + cascades ownership to a tombstone. → [members.md](members.md)
3. **event-participants** — confirm `POST /events/{id}/participants/{id}/check-in` is **not** gated on stored `status === ACTIVE` (SCHEDULED→ACTIVE is time-derived on the FE; status may stay SCHEDULED through the event window). → [event-participants.md](event-participants.md)
4. **campaigns (nice-to-have)** — add a live `participantCount` (events' joined workers) to the `GET /campaigns` item; today only `supporterCount` (issue votes) + `attendingCount` (GOING voters) ride the feed, so event cards can't show "N joined" without a detail fetch. Non-blocking (the list never showed it). → [campaigns-feed.md](campaigns-feed.md)

## P3 — entities not started (frontend stubbed / future)

- **incidents** — FE panels exist (roadmap 4.2); degrade gracefully on 404/501, so non-blocking. → [incidents.md](incidents.md)

## P4 — minor / nice-to-have

- **issues** — `wantToLeadCount` (+ a `WANT_TO_LEAD` roster); per-role target counts on the OPEN issue. Live-verified: no `wantToLeadCount` on the issue read.
- **applications / feedback** — multi-attachment arrays (`resumeIds` / `portfolioIds` / `screenshotIds`, ≤5 each). Requests still take singular `resumeId` / `portfolioId` / `screenshot`.
- **comments** — admin **pin** + flag-management endpoints (pin is a localStorage overlay today; flag exists via `POST /comments/{id}/report`).
- **notifications** — publish the notification `type` enum; optional event/roster/risk SSE streams. (Channel prefs GET/PUT + `GET /notifications/stream` are all live now.)
- **applications — `ApplicationRole` enum mismatch — NOT a backend ask (FE dead config).** `siteContent.js` lists three values the backend rejects (`QA_ENGINEER`/`DEVOPS_ENGINEER`/`CONTENT_WRITER`) but the form hard-codes `role: "VOLUNTEER"`, so they're never sent. FE cleanup only.

---

## FE wired 2026-07-01 (round 4) — campaigns fully unified + SSE

- **campaigns LIST → `GET /campaigns?mode=maximum`** ✅ — the `mode=maximum` rich payload (category, both-locale `titles`, `event` block, `supporterCount`/`attendingCount`, `myVote`) removed the enrichment blocker. FE swapped the 5-call `/issues`+`/events` split for one call; a data-layer adapter maps items back to the existing card shapes (cards untouched).
- **campaigns MAP → `GET /campaigns?mode=minimal`** ✅ — no dedicated endpoint needed; `mode=minimal` is the all-markers payload. Map self-fetches it (limit 1000) so it plots every campaign, not just the list page.
- **campaigns counts → `GET /campaigns/counts`** ✅ (round 3) — exact per-stage totals.
- **notifications live stream (SSE)** ✅ — `GET /notifications/stream?token=` is live (`200 text/event-stream`); the pre-built `notificationsStream.js` + `NotificationsProvider` now connect (no code change needed).

## Closed 2026-07-01 (round 3) — shipped, FE wired

- **issues — per-viewer echo on `GET /issues/{id}` detail** ✅ — auth-aware; returns `isVoted + voterRole + eventRole`. FE dropped the extra `/issues/me/votes` round-trip on the detail page.
- **campaigns — `GET /campaigns/counts`** ✅ — exact per-stage totals `{ counts:{OPEN…CANCELLED}, total }`, honors filters. FE chip row switched to it (one call, no 100-cap).
- **notifications — `GET /notifications/preferences`** ✅ — `{ channels:{ sms, email, push } }`. FE toggles now hydrate from saved state.
- **notifications — `GET /notifications/stream` (SSE)** ✅ — now documented/live (FE live-inbox wiring is an optional follow-up).
- **issues — `POST /issues/{id}/withdraw`** ✅ — author soft-takedown (OPEN only). FE added a Withdraw action on My Issues.
- **campaigns — `GET /campaigns` list enriched with `supporterCount` + `myVote`** ✅ (still missing `kind`/`category`/`scheduledAt`/`participantCount` — see P2 #1).

## Closed earlier (rounds 1–2)

- events issue `translations` embed ✅ · events `viewerParticipation` (auth-aware) ✅ · `PATCH /issues/{id}` `uploadIds[]` ✅ · admin `PATCH /users/{id}` ✅ · `GET /campaigns` feed + `GET /campaigns/{slug}` detail ✅ · issues LIST `voterRole`/`eventRole` ✅ · issue→event embed on `GET /issues/{id}` ✅ · comments `myReactions` ✅ · applications `additionalInfo` optional ✅ · event-participants SCHEDULED=WORKER-only ✅ · `POST /events/{id}/activate` DROPPED 🚫 (time-derived).

> **Doc-hygiene:** live issue `status` enum is `OPEN | EVENT_DRAFT | COMPLETED | REJECTED | DUPLICATE` — `issues.md` still says `EVENT_SCHEDULED`. FE already reads `EVENT_DRAFT`.

---

## Deferred to v2 — not part of this handoff

- **live-streams** — home rail shows real _ongoing_ (ACTIVE) events now; live-video playback is v2. → [live-streams.md](live-streams.md)
- **discussions** + **feature-votes** — discontinued from v1; routes/components remain, no v1 wiring. → [discussions.md](discussions.md), [feature-votes.md](feature-votes.md)
- **donations** — `/ledger` route stays (dev-only demo data), no v1 link. → [donations.md](donations.md)
- **meetings** — no UI consumes it; TV-app pivot reshaped planning. → [meetings.md](meetings.md)
- **app-development** — folded into `/discussions` (also v2). → [app-development.md](app-development.md)
