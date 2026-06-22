// Which primary action an issue surfaces, decided by its lifecycle status.
//
//   OPEN            → "support"  voting is open; supporters can still pile on.
//   EVENT_SCHEDULED → "join"     voting has closed (the vote threshold promoted
//                                the issue into a scheduled campaign event); the
//                                call to action is now to show up and take part.
//   COMPLETED / REJECTED / DUPLICATE / anything else → "none"
//
// This is the single source of truth shared by every issue surface (detail
// page, grid card, preview pane) so they all agree on Support-vs-Join.
export function issueActionMode(status) {
  if (status === "EVENT_SCHEDULED") return "join";
  if (status === "OPEN") return "support";
  return "none";
}

// Resolve a link to the scheduled campaign event from an issue, if the backend
// exposes one. Issues do NOT yet carry their event id — the link is event →
// issue (`event.linkedIssueId`), never the reverse, and `GET /events` has no
// `linkedIssueId` filter (see docs/api-requirements/issues.md "Gaps"). This
// reads whichever field the backend eventually lands on so the Join CTA wires
// itself up the moment the link ships, with no further frontend change.
export function getIssueEventId(issue) {
  return (
    issue?.eventId ||
    issue?.event?.slug ||
    issue?.event?.id ||
    issue?.eventSlug ||
    null
  );
}
