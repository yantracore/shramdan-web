// Session-cached event roster reads, for surfaces that need per-role fill
// counts WITHOUT opening the participation modal (the card CTA has to read
// "Full" before any click — list payloads carry rolePlan targets but never
// the roster, so fills need one GET /events/{id}/participants per event).
//
// The cache is a module-level promise map keyed by eventId (same pattern as
// eventsApi's issueCoverDetailPromises): every card surface showing the same
// event shares one in-flight/settled request for the whole client session.
// Join/leave mutations call invalidateEventRoster so the next mount re-reads
// fresh fills instead of a pre-mutation snapshot.
//
// Interim until list payloads embed per-role fills server-side — see
// docs/api-requirements/campaigns-feed.md "Event card echo".

import { getJson } from "@/lib/apiClient";
import { getResponseData } from "@/lib/adminUtils";

const rosterPromises = new Map();

// Resolves to the participants array ([] on any failure — a card that can't
// learn the fills must fall back to the optimistic "Join" face, never break).
export function fetchEventRosterOnce(eventId) {
  if (!eventId) return Promise.resolve([]);
  if (!rosterPromises.has(eventId)) {
    rosterPromises.set(
      eventId,
      getJson(`/events/${eventId}/participants?limit=200`)
        .then((response) => {
          const data = getResponseData(response, null);
          return Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        })
        .catch(() => {
          // Don't cache failures — let a later mount retry.
          rosterPromises.delete(eventId);
          return [];
        })
    );
  }
  return rosterPromises.get(eventId);
}

export function invalidateEventRoster(eventId) {
  if (eventId) rosterPromises.delete(eventId);
}
