// Which primary action an issue surfaces, decided by its lifecycle status.
//
//   OPEN                          → "support"      voting is open.
//   EVENT_SCHEDULED / EVENT_DRAFT → "join"         promoted into a campaign
//                                event; the call to action is to take part.
//                                Both are accepted while the backend renames
//                                the promoted status; the issue status stays
//                                coarse across event DRAFT/SCHEDULED/ACTIVE/
//                                CANCELLED — the fine phase comes from the
//                                linked event, see eventJoinPhase.
//   COMPLETED                     → "contributed"  campaign done; show the
//                                viewer's contribution.
//   anything else → "none"
//
// Single source of truth shared by every issue surface (detail page, grid card,
// preview pane) so they all agree on Support-vs-Join-vs-Contributed.
export function issueActionMode(status) {
  if (status === "OPEN") return "support";
  // Accept both the legacy (EVENT_SCHEDULED) and new (EVENT_DRAFT) promoted
  // status so the Join CTA works against either backend during the rename.
  if (status === "EVENT_SCHEDULED" || status === "EVENT_DRAFT") return "join";
  if (status === "COMPLETED") return "contributed";
  return "none";
}

// Role grid order, shared by the issue + event participation surfaces.
// COORDINATOR is excluded — leadership is its own slot (WANT_TO_LEAD / event
// leader), never a role-grid row.
export const PARTICIPANT_ROLE_ORDER = [
  "WORKER",
  "PHOTOGRAPHER",
  "LIVESTREAMER",
  "MEDIC",
  "SAFETY_LEAD",
  "LOGISTICS"
];

// The fine-grained join behaviour for a promoted issue, keyed on the linked
// EVENT's status (issue.status is too coarse — it's EVENT_DRAFT for all of
// DRAFT/SCHEDULED/ACTIVE/CANCELLED). Returns the CTA label kind, the role scope
// the picker may offer (null = all roles; [] = none; ["WORKER"] = cleaner only),
// and whether a join is possible at all. A null/unknown status is treated as
// DRAFT-like so a freshly-resolved event is joinable rather than dead.
export function eventJoinPhase(eventStatus) {
  switch (eventStatus) {
    case "SCHEDULED":
    case "ACTIVE":
      return { label: "join", roleScope: ["WORKER"], joinable: true };
    case "COMPLETED":
      return { label: "contributed", roleScope: [], joinable: false };
    case "CANCELLED":
      return { label: "cancelled", roleScope: [], joinable: false };
    case "PAUSED":
      return { label: "paused", roleScope: [], joinable: false };
    case "DRAFT":
    default:
      return { label: "join", roleScope: null, joinable: true };
  }
}

// Resolve a link to the scheduled campaign event from an issue, if the backend
// exposes one. Issues do NOT yet carry their event id — the link is event →
// issue, never the reverse. This reads whichever field the backend eventually
// lands on so the Join CTA wires itself up the moment the link ships.
export function getIssueEventId(issue) {
  return (
    issue?.eventId ||
    issue?.event?.slug ||
    issue?.event?.id ||
    issue?.eventSlug ||
    null
  );
}
