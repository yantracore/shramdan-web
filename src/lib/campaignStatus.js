// Unified campaign lifecycle. A "campaign" is one continuum from a reported
// problem (issue, gathering votes) to a finished cleanup (event, completed).
// The status the user filters by maps to ONE backend fetch:
//   OPEN                                  -> GET /issues?status=OPEN
//   DRAFT | SCHEDULED | ACTIVE | COMPLETED -> GET /events?status=<status>
// No dedup needed: once an issue is promoted an event row exists, so issues
// only ever contribute the OPEN stage; every later stage lives in events.
//
// Confirmed live (devtunnel probe, 2026-06-24): all five statuses return items.
//
// "all" shows every stage, grouped in lifecycle order:
//   खुला (OPEN) -> तयारीमा (DRAFT) -> मिति तय (SCHEDULED) -> चलिरहेको (ACTIVE) -> सम्पन्न (COMPLETED)

// Lifecycle order — also the render order of the "all" view's grouped sections.
export const CAMPAIGN_STATUS_SEQUENCE = [
  "OPEN",
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "COMPLETED"
];

// kind  = which API the stage is read from (issue | event).
// visual = the data-status hook the list/preview components style. It is ALWAYS
//          the lower-cased technical status — ONE vocabulary across code, CSS
//          (`--state-<status>`), and `data-status`. No third set of words
//          (no planning/upcoming/live/past). UI words come from the labels
//          below; see docs/design/06-state-color-system.md.
export const CAMPAIGN_STATUSES = {
  OPEN: { key: "OPEN", kind: "issue", visual: "open" },
  DRAFT: { key: "DRAFT", kind: "event", visual: "draft" },
  SCHEDULED: { key: "SCHEDULED", kind: "event", visual: "scheduled" },
  ACTIVE: { key: "ACTIVE", kind: "event", visual: "active" },
  COMPLETED: { key: "COMPLETED", kind: "event", visual: "completed" },
  // PAUSED is circumstantial — shown only on a campaign's detail page when it is
  // paused. Deliberately ABSENT from CAMPAIGN_STATUS_SEQUENCE so it never appears
  // as a filter chip / pill, while its label + visual still resolve for detail.
  PAUSED: { key: "PAUSED", kind: "event", visual: "paused" }
};

// User-friendly labels. These drive the chip row, the dropdown, and the
// "all"-view section dividers — all from one source so they never drift.
// (NE words reuse the ones already shipped across /issues and /events;
// "तयारीमा / Planning" is the only new label, for DRAFT.)
export const CAMPAIGN_STATUS_LABELS = {
  np: {
    all: "सबै",
    OPEN: "खुला",
    DRAFT: "तयारीमा",
    SCHEDULED: "मिति तय",
    ACTIVE: "चलिरहेको",
    COMPLETED: "सम्पन्न",
    PAUSED: "रोकिएको"
  },
  en: {
    all: "All",
    OPEN: "Open",
    DRAFT: "Planning",
    SCHEDULED: "Scheduled",
    ACTIVE: "Ongoing",
    COMPLETED: "Complete",
    PAUSED: "Paused"
  }
};

// Valid values for the `?status=` URL param. "all" is a UI-only umbrella.
export const CAMPAIGN_FILTER_VALUES = new Set([
  "all",
  ...CAMPAIGN_STATUS_SEQUENCE
]);

export function campaignStatusLabel(status, language) {
  const dict = CAMPAIGN_STATUS_LABELS[language] || CAMPAIGN_STATUS_LABELS.np;
  return dict[status] || status;
}

// The card/preview visual hook for a campaign status — the lower-cased technical
// status (open | draft | scheduled | active | completed | paused), used as the
// `data-status` attribute that the `--state-<status>` colours key off.
export function campaignVisualStatus(status) {
  return CAMPAIGN_STATUSES[status]?.visual || String(status || "").toLowerCase();
}

export function campaignStatusKind(status) {
  return CAMPAIGN_STATUSES[status]?.kind || "event";
}

// Fold the issue's coarse status (OPEN | EVENT_DRAFT | EVENT_SCHEDULED |
// COMPLETED) and its linked event's fine status (DRAFT | SCHEDULED | ACTIVE |
// PAUSED | COMPLETED | CANCELLED) into ONE canonical campaign status key from
// CAMPAIGN_STATUS_SEQUENCE (+ PAUSED). The event status wins whenever present —
// the issue read is too coarse to tell DRAFT/SCHEDULED/ACTIVE apart, so a
// promoted issue (EVENT_DRAFT) only ever resolves the finer stage via its
// event. A COMPLETED issue with no resolvable event still reads COMPLETED.
// Returns a key in { OPEN, DRAFT, SCHEDULED, ACTIVE, COMPLETED, PAUSED }; the
// off-path terminal states (REJECTED/DUPLICATE/CANCELLED) keep their own key so
// callers can branch on them. Used by /campaign/[slug] for the status tag,
// data-status hook, and the progressive-disclosure gating.
export function resolveCampaignStatus(issueStatus, eventStatus) {
  if (eventStatus) {
    switch (eventStatus) {
      case "DRAFT":
        return "DRAFT";
      case "SCHEDULED":
        return "SCHEDULED";
      case "ACTIVE":
        return "ACTIVE";
      case "PAUSED":
        return "PAUSED";
      case "COMPLETED":
        return "COMPLETED";
      case "CANCELLED":
        return "CANCELLED";
      default:
        break;
    }
  }
  if (issueStatus === "OPEN") return "OPEN";
  if (issueStatus === "COMPLETED") return "COMPLETED";
  if (issueStatus === "REJECTED") return "REJECTED";
  if (issueStatus === "DUPLICATE") return "DUPLICATE";
  // Promoted issue (EVENT_DRAFT / EVENT_SCHEDULED) whose event hasn't resolved
  // yet — park at the earliest post-promotion stage rather than guess further.
  if (issueStatus === "EVENT_DRAFT" || issueStatus === "EVENT_SCHEDULED") {
    return "DRAFT";
  }
  return "OPEN";
}
