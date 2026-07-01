# Outstanding Backend Requirements — handoff

> The short list of what the frontend still needs from the backend.
> **Everything not listed here is already live** on `api.shramdan.org`.
> **Re-verified 2026-07-01 (round 3, against the LIVE API)** — each item was matched against live authenticated calls, not just the OpenAPI spec. ⚠️ **The spec is currently out of sync with live** (it lists `GET /campaigns` as removed, but live serves it — enriched). Trust the live API. Seven-plus items shipped across the last two deploys and were closed (see "Closed" below); the FE is wired onto them.
> Owner: Pranish (backend).

---

## P1 — blocks shipped UX

_(none open — the issue-detail per-viewer echo shipped 2026-07-01.)_

## P2 — functionality gaps

1. **campaigns — enrich the `GET /campaigns` LIST item so the FE can switch the main feed onto it.** Today the list item is minimal: `{ slug, status, lat, lng, title, addressText, image, supporterCount, myVote }`. The unified `/campaigns` feed is otherwise ready (cursor pagination, filters, bbox, `supporterCount`, `myVote`), but the FE list still uses the older per-status `GET /issues` + `GET /events` calls because the card needs a few fields the item lacks. **Requested on the list item:** `kind` (`issue|event`), `category`, `scheduledAt`, `completedAt`, and `participantCount` (events' joined count — `supporterCount` only covers issue supporters). With those, the FE swaps 5 calls → 1 with no card regression. → [campaigns-feed.md](campaigns-feed.md)
2. **campaigns — dedicated all-markers map endpoint** (no pagination, minimal record incl. `participantCount` + viewer role). Confirmed being built; **not live yet** — live-probed `/campaigns/map`, `/campaigns/all`, `/campaigns/markers`, `/map/campaigns`, etc. → all 404/400. Interim: `GET /campaigns?limit=<max>` already returns every campaign with `lat`/`lng` in one shot. FE map wiring waits for the dedicated endpoint (per product call). → [campaigns-feed.md](campaigns-feed.md)
3. **events** — reminder-cadence config so participants get pre-event reminders (scheduled notifications; backend-owned). Spec-verified: no reminder-cadence field. → [events.md](events.md), [notifications.md](notifications.md)
4. **members** — behavioural confirms on the shipped admin user routes (`PATCH /users/{id}` landed ✅): confirm the `GET /users` `take` Int-cast bug is fixed, and that `DELETE /users/{id}` soft-deletes + cascades ownership to a tombstone. → [members.md](members.md)
5. **event-participants** — confirm `POST /events/{id}/participants/{id}/check-in` is **not** gated on stored `status === ACTIVE` (SCHEDULED→ACTIVE is time-derived on the FE; status may stay SCHEDULED through the event window). → [event-participants.md](event-participants.md)

## P3 — entities not started (frontend stubbed / future)

- **incidents** — FE panels exist (roadmap 4.2); degrade gracefully on 404/501, so non-blocking. → [incidents.md](incidents.md)

## P4 — minor / nice-to-have

- **issues** — `wantToLeadCount` (+ a `WANT_TO_LEAD` roster); per-role target counts on the OPEN issue. Live-verified: no `wantToLeadCount` on the issue read.
- **applications / feedback** — multi-attachment arrays (`resumeIds` / `portfolioIds` / `screenshotIds`, ≤5 each). Requests still take singular `resumeId` / `portfolioId` / `screenshot`.
- **comments** — admin **pin** + flag-management endpoints (pin is a localStorage overlay today; flag exists via `POST /comments/{id}/report`).
- **notifications** — publish the notification `type` enum; optional event/roster/risk SSE streams. (Channel prefs GET/PUT + `GET /notifications/stream` are all live now.)
- **applications — `ApplicationRole` enum mismatch — NOT a backend ask (FE dead config).** `siteContent.js` lists three values the backend rejects (`QA_ENGINEER`/`DEVOPS_ENGINEER`/`CONTENT_WRITER`) but the form hard-codes `role: "VOLUNTEER"`, so they're never sent. FE cleanup only.

---

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
