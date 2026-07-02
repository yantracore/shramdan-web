# Analytics & Observability Scaffold — 2026-06-03

> Roadmap leaf: `11.5 Analytics + observability`. The frontend ships a lightweight event-name registry today so any analytics platform can plug in without touching every call site later.

## Decision

We are **not** picking a vendor yet (Plausible / Umami / PostHog / in-house). The frontend exposes a thin contract; the sink is swapped in via `registerAnalyticsSink(fn)` once the project lead commits to a vendor.

## Contract

[`src/lib/analytics.js`](../../src/lib/analytics.js)

```js
import { dispatchAnalyticsEvent, ANALYTICS_EVENTS } from "@/lib/analytics";

dispatchAnalyticsEvent(ANALYTICS_EVENTS.EVENT_JOIN, { eventId, role });
```

- `dispatchAnalyticsEvent(name, payload)` — wrapped in try/catch so analytics can never break UI code.
- Today: no-op on production, `console.debug` in development. Sink registration is a no-op until a platform is wired in.
- `ANALYTICS_EVENTS` is a frozen registry of canonical event names. New events extend this object; call sites must not invent new names ad hoc.

## Canonical events shipped today

| Event | Trigger | Payload |
|-------|---------|---------|
| `issue_view` | `/issues/[id]` mount | `{ issueId }` |
| `issue_vote` | Vote button confirm | `{ issueId, voterRole }` |
| `issue_create` | `/issues/new` submit success | `{ issueId, category }` |
| `event_view` | `/events/[id]` mount | `{ eventId, status }` |
| `event_join` | `EventJoinPanel` confirm | `{ eventId, role }` |
| `event_nominate_leader` | `LeaderNominationPanel` self-nominate | `{ eventId }` |
| `event_vote_nomination` | `LeaderNominationPanel` support / withdraw | `{ eventId, nominationId, action }` |
| `event_report_incident` | `IncidentPanel` submit | `{ eventId, type, severity }` |
| `event_contribution_intent` | `ContributionIntentPanel` submit | `{ eventId, kind }` |
| `event_share` | `ShareAsContribution` social click | `{ eventId, channel }` |
| `leader_schedule` | `LeaderScheduleEditor` save | `{ eventId }` |
| `leader_activate` | `SafetyChecklistPanel` activate | `{ eventId }` |
| `leader_complete` | `LeaderCompleteEditor` save | `{ eventId }` |
| `reminder_cadence_change` | `ReminderCadencePanel` toggle | `{ eventId, cadence: array }` |
| `app_signup_otp_request` | `/app/signup` step 1 send | `{ phoneCountryCode }` (no phone digits) |
| `app_signup_otp_verify` | `/app/signup` step 2 verify | none |
| `app_kyc_submit` | `/app/kyc` submit | `{ idType }` |
| `ledger_view` | `/ledger` mount | none |
| `story_view` | `/stories/[slug]` mount | `{ slug }` |

## Privacy posture

- Never dispatch raw phone numbers, OTP codes, or address strings as analytics payloads.
- `voterRole` is fine (it's a public-facing intent label, not PII).
- Donor identity in the ledger is already nullable; analytics must not re-leak it.

## Observability (server side)

Out of scope for this scaffold. Backend will need:

- Request-rate / error-rate / latency per route
- Auth-failure rate (refresh-token churn)
- Image-upload pipeline health (presign + R2 PUT success rate)
- SSE connection health (planned 4.4 + comments live stream)

Tracked separately in [09-backend-admin-gaps.md](09-backend-admin-gaps.md).

## Wiring a vendor (when ready)

```js
// In app/providers.js or equivalent client-only init point:
import { registerAnalyticsSink } from "@/lib/analytics";
registerAnalyticsSink((name, payload) => {
  if (typeof window === "undefined" || !window.plausible) return;
  window.plausible(name, { props: payload });
});
```

Pick one. Plausible is the safest for the launch phase — Nepal-hostable, no cookies, simple event API. PostHog is heavier but supports session replay if needed later.

## Status

Scaffold shipped 2026-06-03; instrumentation of the 19 canonical events across call sites will follow as polish. Currently the registry exists and is callable; no call sites are wired yet.
