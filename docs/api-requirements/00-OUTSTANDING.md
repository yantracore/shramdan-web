# Outstanding Backend Requirements — handoff

> The short list of what the frontend still needs from the backend.
> **Everything not listed here is already live** on `api.shramdan.org`.
> **Re-verified 2026-06-30** — not just against the docs: each item was matched against the **live API** (`api.shramdan.org`, authenticated member calls), the refreshed OpenAPI spec (`../engineering/07-api-reference.json`, 89 paths), **and** the frontend code. Items confirmed done since the last sweep were removed (see "Closed this sweep" below).
> Per-field prose + state machines live in each domain file; this is just the punch list.
> Owner: Pranish (backend).

---

## P1 — blocks shipped UX (frontend workaround in place today)

1. **events** — embed the linked issue's `translations` (or a localized `title`) on `GET /events` + `GET /events/{id}`. The embedded `issue` arrives with **no** `translations` (live-verified 2026-06-30: `event.issue` has no `translations`/`title` key), so event cards fall back to a humanized slug — English-only in both locales. The one remaining blocker to a bilingual events surface. → [events.md](events.md)
2. **issues** — add `isVoted` + `voterRole` + `eventRole` to the `GET /issues/{id}` **detail** read. Live-verified 2026-06-30 (authenticated): the detail read returns **none** of the three; the **list** read (`GET /issues`) returns only `isVoted`, still **no** `voterRole`/`eventRole`. So FE pays an extra `GET /issues/me/votes` round-trip to seed "Supported / Joined-as-role / Leading" on refresh. Smallest unlock: echo what `POST /issues/{id}/vote` already stored. → [issues.md](issues.md)
3. **events** — add `viewerParticipation { id, role, status }` (null when not joined; terminal `LEFT`/`NO_SHOW` → null) to `GET /events` + `GET /events/{id}`. Live-verified 2026-06-30 (authenticated): no `viewerParticipation` key on the events list. Removes one `/participants/me` call per card. → [events.md](events.md)

## P2 — functionality gaps

4. **issues** — accept `uploadIds: string[]` on `PATCH /issues/{id}` (mirror the POST validator: caller-owned, confirmed, not attached elsewhere). Spec-verified 2026-06-30: PATCH body still has no `uploadIds` (POST does). FE image editor is locked because the PATCH schema rejects the key (400 fails the whole save). Do **not** reuse `/after-uploads` (wrong semantics). → [issues.md](issues.md)
5. **issues** — author withdraw: `POST /issues/{id}/withdraw` or let the reporter set a `WITHDRAWN` status on their own OPEN issue. Spec-verified 2026-06-30: no `/withdraw` route, and the `/issues/{id}/status` enum is `OPEN|COMPLETED|REJECTED|DUPLICATE` (no `WITHDRAWN`); `DELETE` is moderator-only. Completes My-issues CRUD. → [issues.md](issues.md)
6. **notifications** — add `GET /notifications/preferences` → `{ sms, email, push }`. Live-verified 2026-06-30: `GET` returns **404**; only `PUT` exists, so channel toggles can't reflect saved state. → [notifications.md](notifications.md)
7. **notifications** — add `GET /notifications/stream` (SSE) to the OpenAPI spec. Spec-verified 2026-06-30: absent (`/comments/stream` is documented as the sibling pattern — mirror it). Works on staging; just undocumented. → [notifications.md](notifications.md)
8. **members** — admin `PATCH /users/{id}` (edit name / username / phone / verification for support). Spec-verified 2026-06-30: `/users/{id}` exposes only `get` + `delete` (plus `/role`, `/leader-eligibility`, `/verify-medical-credential` sub-routes) — no general edit PATCH. Still needs a behavioural confirm: the `GET /users` `take` Int-cast bug, and that `DELETE /users/{id}` soft-deletes + cascades ownership to a tombstone. → [members.md](members.md)
9. **events** — `POST /events/{id}/activate` (SCHEDULED→ACTIVE, safety-gated; 412 if checklist unmet) and a reminder-cadence PATCH. Spec-verified 2026-06-30: no `/activate` route, no reminder-cadence field. Both FE panels exist but are demo-only. → [events.md](events.md)
10. **campaigns feed** — server-side support for the unified `/campaigns` surface (live-verified 2026-06-30: `GET /campaigns` returns **404**): (a) `GET /campaigns` cursor-paginated, lifecycle-ordered merged feed (OPEN issues + DRAFT/SCHEDULED/ACTIVE/COMPLETED events) — today the FE fires 5 capped fetches and fakes infinite-scroll by slicing in memory, so the loader never resolves and the list silently stops at the cap; (b) `GET /campaigns/counts` **exact** per-stage totals — chip badges are capped at 100 today and wrong beyond it; (c) `GET /campaigns/map` lightweight all-markers endpoint for map mode (**shape still under discussion**). → [campaigns-feed.md](campaigns-feed.md)

## P3 — entities not started (frontend stubbed / future)

- **discussions** + **feature-votes** — full specs ready; `/discussions` is a live nav surface running on a stub. → [discussions.md](discussions.md), [feature-votes.md](feature-votes.md)
- **live-streams** — home live rail uses mock data. → [live-streams.md](live-streams.md)
- **incidents** — FE panels exist (roadmap 4.2); also unblocks events pause/resume + `riskLevel`. → [incidents.md](incidents.md)
- **donations** — Phase 6 transparency ledger (`/ledger`). Future. → [donations.md](donations.md)

## P4 — minor / nice-to-have

- **applications — `ApplicationRole` enum mismatch (now a real 400, not just a nicety).** The FE application form offers `QA_ENGINEER` / `DEVOPS_ENGINEER` / `CONTENT_WRITER` (`siteContent.js`, both locales), but the live `POST /applications` `role` enum is `FRONTEND_DEVELOPER | BACKEND_DEVELOPER | UI_UX_DESIGNER | GRAPHICS_DESIGNER | LEGAL | FINANCE | DONOR | COMMUNITY_MANAGER | VOLUNTEER | OTHER` — picking one of the three FE-only values is rejected. **Either add the three to the enum, or prune them from the form.** (Decision needed; FE currently offers them.)
- **applications / feedback** — multi-attachment arrays (`resumeIds` / `portfolioIds` / `screenshotIds`, ≤5 each). Live-verified 2026-06-30: requests still take **singular** `resumeId` / `portfolioId` / `screenshot` only.
- **comments** — admin **pin** + flag-management endpoints (pin is a localStorage overlay today). _(Flagging already exists via `POST /comments/{id}/report`.)_
- **issues** — `wantToLeadCount` (+ a `WANT_TO_LEAD` roster); per-role target counts on the OPEN issue. Live-verified 2026-06-30: no `wantToLeadCount` on the issue read.
- **events / event-participants** — optional SSE: roster-changes + risk-level streams; publish the notifications `type` enum.

---

## Closed this sweep (2026-06-30) — confirmed done, removed from the punch list

- **issues — event embed on `GET /issues/{id}`** ✅ — detail read now embeds `event { id, slug, status, scheduledAt, leaderId }` on promoted issues (live-verified, authenticated). The `resolveEventForIssue` band-aid can retire; Phase 4 unblocked. (Was P1 #2.)
- **comments — per-viewer `myReactions` on reads** ✅ — the live spec documents it: "Reactions are returned as an aggregate map; `myReactions` is included for authenticated viewers." (Was part of the P4 comments line.)
- **applications — `additionalInfo` optional** ✅ — not in the `POST /applications` `required` set (`name, email, otp, password, role, motivation`), so it already accepts being omitted / `"n/a"`. (Was part of the P4 applications line.)
- **event-participants — SCHEDULED = WORKER-only** ✅ (closed 2026-06-26) — `POST /events/{id}/participants` documents `DRAFT → any role · SCHEDULED → WORKER only · ACTIVE → WORKER only · PAUSED/COMPLETED/CANCELLED → closed`. → [event-participants.md](event-participants.md)

> **Doc-hygiene note (not a backend ask):** the live issue `status` enum is now `OPEN | EVENT_DRAFT | COMPLETED | REJECTED | DUPLICATE` — `issues.md` still says `EVENT_SCHEDULED`. Frontend already reads `EVENT_DRAFT`; the domain doc just needs a terminology pass.

---

## Deferred to v2 — not part of this handoff

- **meetings** — two-meeting kickoff / pre-execution flow; no UI consumes it and the TV-app pivot reshaped the planning model. → [meetings.md](meetings.md)
- **app-development** — task board folded into `/discussions` for now. → [app-development.md](app-development.md)
