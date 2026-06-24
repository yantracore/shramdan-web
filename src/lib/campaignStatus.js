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
//   खुला (OPEN) -> तयारीमा (DRAFT) -> आउँदै (SCHEDULED) -> लाइभ (ACTIVE) -> सम्पन्न (COMPLETED)

// Lifecycle order — also the render order of the "all" view's grouped sections.
export const CAMPAIGN_STATUS_SEQUENCE = [
  "OPEN",
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "COMPLETED"
];

// kind  = which API the stage is read from (issue | event).
// visual = the data-status hook the list/preview components already style.
//          DRAFT borrows the "upcoming" visual (it is being organized but has
//          no firm date yet) so no new CSS is required for v1.
export const CAMPAIGN_STATUSES = {
  OPEN: { key: "OPEN", kind: "issue", visual: "open" },
  DRAFT: { key: "DRAFT", kind: "event", visual: "upcoming" },
  SCHEDULED: { key: "SCHEDULED", kind: "event", visual: "upcoming" },
  ACTIVE: { key: "ACTIVE", kind: "event", visual: "live" },
  COMPLETED: { key: "COMPLETED", kind: "event", visual: "past" }
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
    SCHEDULED: "आउँदै",
    ACTIVE: "लाइभ",
    COMPLETED: "सम्पन्न"
  },
  en: {
    all: "All",
    OPEN: "Open",
    DRAFT: "Planning",
    SCHEDULED: "Upcoming",
    ACTIVE: "Live",
    COMPLETED: "Completed"
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

// The card/preview visual hook for a campaign status (live | upcoming | past).
export function campaignVisualStatus(status) {
  return CAMPAIGN_STATUSES[status]?.visual || "upcoming";
}

export function campaignStatusKind(status) {
  return CAMPAIGN_STATUSES[status]?.kind || "event";
}
