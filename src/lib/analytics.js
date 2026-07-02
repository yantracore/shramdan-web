// Lightweight analytics shim — roadmap 11.5.
// The frontend names events in one place so any analytics platform
// (Plausible, Umami, PostHog, in-house) can plug in by overriding
// `dispatchAnalyticsEvent`. Today, dispatch is a no-op on prod and a
// console.debug in dev — the contract matters more than the sink.

const NO_OP = () => {};

let sink = NO_OP;

export function registerAnalyticsSink(fn) {
  if (typeof fn === "function") sink = fn;
}

export function dispatchAnalyticsEvent(name, payload) {
  try {
    sink(name, payload || {});
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", name, payload || {});
    }
  } catch {
    // analytics must never throw into UI code
  }
}

// Canonical event names. Add new events here so the platform layer
// stays the single source of truth.
export const ANALYTICS_EVENTS = Object.freeze({
  ISSUE_VIEW: "issue_view",
  ISSUE_VOTE: "issue_vote",
  ISSUE_VOTE_WITH_ROLE: "issue_vote_with_role",
  ISSUE_CREATE: "issue_create",
  EVENT_VIEW: "event_view",
  EVENT_JOIN: "event_join",
  EVENT_NOMINATE_LEADER: "event_nominate_leader",
  EVENT_VOTE_NOMINATION: "event_vote_nomination",
  EVENT_REPORT_INCIDENT: "event_report_incident",
  EVENT_CONTRIBUTION_INTENT: "event_contribution_intent",
  EVENT_SHARE: "event_share",
  LEADER_SCHEDULE: "leader_schedule",
  LEADER_ACTIVATE: "leader_activate",
  LEADER_COMPLETE: "leader_complete",
  REMINDER_CADENCE_CHANGE: "reminder_cadence_change",
  APP_SIGNUP_OTP_REQUEST: "app_signup_otp_request",
  APP_SIGNUP_OTP_VERIFY: "app_signup_otp_verify",
  APP_KYC_SUBMIT: "app_kyc_submit",
  LEDGER_VIEW: "ledger_view",
  STORY_VIEW: "story_view"
});
