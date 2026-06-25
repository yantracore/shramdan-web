# Outstanding Backend Requirements — handoff

> The short list of what the frontend still needs from the backend.
> **Everything not listed here is already live** on `backend.shramdan.org`.
> Verified 2026-06-23 against the refreshed OpenAPI spec (`../engineering/07-api-reference.json`, 110 endpoints).
> Per-field prose + state machines live in each domain file; this is just the punch list.
> Owner: Pranish (backend).

---

## P1 — blocks shipped UX (frontend workaround in place today)

1. **events** — embed the linked issue's `translations` (or a localized `title`) on `GET /events` + `GET /events/{id}`. The embedded `issue` arrives with **no** `translations`, so event cards fall back to a humanized slug — English-only in both locales. The one remaining blocker to a bilingual events surface. → [events.md](events.md)
2. **issues** — expose the scheduled event on `GET /issues/{id}`: embed `event { id, slug, status, scheduledAt, leaderId, viewerParticipation }` on `EVENT_SCHEDULED` issues. A `GET /events?issueId=` filter is an acceptable fallback. FE band-aid (`resolveEventForIssue`) costs an extra `/events` fetch per promoted-issue view. **Now also the hard blocker for the unified `/campaign/[id]` detail merge (Phase 4) — the merged detail page needs to resolve a promoted issue's event without the district-match workaround.** → [issues.md](issues.md), [campaign-unification spec](../superpowers/specs/2026-06-25-campaign-unification-design.md)
3. **issues** — add `isVoted` (+ `voterRole`, `eventRole`) to the `GET /issues/{id}` **detail** read (already returned on the list read). FE pays an extra `GET /issues/me/votes` round-trip to seed the "Supported" state on refresh. → [issues.md](issues.md)
4. **events** — add `viewerParticipation { id, role, status }` (null when not joined; terminal `LEFT`/`NO_SHOW` → null) to `GET /events` + `GET /events/{id}`. Removes one `/participants/me` call per card. → [events.md](events.md)

## P2 — functionality gaps

5. **issues** — accept `uploadIds: string[]` on `PATCH /issues/{id}` (mirror the POST validator: caller-owned, confirmed, not attached elsewhere). FE image editor is locked because the PATCH schema rejects the key (400 fails the whole save). Do **not** reuse `/after-uploads` (wrong semantics). → [issues.md](issues.md)
6. **issues** — author withdraw: `POST /issues/{id}/withdraw` or let the reporter set a `WITHDRAWN` status on their own OPEN issue. Completes My-issues CRUD (delete is moderator-only today). → [issues.md](issues.md)
7. **notifications** — add `GET /notifications/preferences` → `{ sms, email, push }`. PUT exists but there is no GET, so channel toggles can't reflect saved state. → [notifications.md](notifications.md)
8. **notifications** — add `GET /notifications/stream` (SSE) to the OpenAPI spec. Works on staging; just undocumented. → [notifications.md](notifications.md)
9. **members** — admin `PATCH /users/{id}` (edit name / username / phone / verification for support). Confirm the `GET /users` `take` Int-cast bug is fixed, and that `DELETE /users/{id}` soft-deletes + cascades ownership to a tombstone. → [members.md](members.md)
10. **events** — `POST /events/{id}/activate` (SCHEDULED→ACTIVE, safety-gated; 412 if checklist unmet) and a reminder-cadence PATCH. Both FE panels exist but are demo-only. → [events.md](events.md)

## P3 — entities not started (frontend stubbed / future)

- **discussions** + **feature-votes** — full specs ready; `/discussions` is a live nav surface running on a stub. → [discussions.md](discussions.md), [feature-votes.md](feature-votes.md)
- **live-streams** — home live rail uses mock data. → [live-streams.md](live-streams.md)
- **incidents** — FE panels exist (roadmap 4.2); also unblocks events pause/resume + `riskLevel`. → [incidents.md](incidents.md)
- **donations** — Phase 6 transparency ledger (`/ledger`). Future. → [donations.md](donations.md)

## P4 — minor / nice-to-have

- **applications / feedback** — multi-attachment arrays (`resumeIds` / `portfolioIds` / `screenshotIds`, ≤5 each); applications `additionalInfo` optional (accept `"n/a"`); prune or add the `ApplicationRole` values `QA_ENGINEER` / `DEVOPS_ENGINEER` / `CONTENT_WRITER`.
- **comments** — per-viewer `myReactions` on reads; admin pin / flag-management endpoints (pin is a localStorage overlay today).
- **issues** — `wantToLeadCount` (+ a `WANT_TO_LEAD` roster); per-role target counts on the OPEN issue.
- **events / event-participants** — optional SSE: roster-changes + risk-level streams; publish the notifications `type` enum.
- **event-participants** — enforce `SCHEDULED` = WORKER-only on `POST /events/{id}/participants` (reject non-WORKER, matching `ACTIVE`). FE already gates the join modal to WORKER, so this is consistency / defense-in-depth, not a UX blocker. Per the 2026-06-25 campaign-unification decision; verify on the next API refresh (backend unreachable 2026-06-25). → [event-participants.md](event-participants.md)

---

## Deferred to v2 — not part of this handoff

- **meetings** — two-meeting kickoff / pre-execution flow; no UI consumes it and the TV-app pivot reshaped the planning model. → [meetings.md](meetings.md)
- **app-development** — task board folded into `/discussions` for now. → [app-development.md](app-development.md)
