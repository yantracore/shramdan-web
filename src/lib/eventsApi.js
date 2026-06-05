// Thin events API client. Adapts the backend's `/events` shape into the
// flatter shape the legacy `getDemo*` consumers expect, so swap sites
// can keep their existing render logic.
//
// Backend event:
//   { id, slug, status, scheduledAt, durationMinutes, ..., issue: { ..., translations: [...] }, eventLeader, rolePlan }
//
// Normalised event surfaces:
//   - title, addressText, category, latitude, longitude (lifted from issue + translations)
//   - thumbnailUrl (issue.coverImage.url)
//   - participantCount (filled in by /events/[id]/page.js via /participants merge — left undefined here)
//   - rolesNeeded (also filled in client-side from rolePlan + participants)
//
// `liveStream` (mp4 URL / viewer count) is NOT present in backend events;
// `injectMockLiveStream()` continues to enrich the 5 known LIVE events
// with a deterministic YouTube fallback for now.

import { getJson } from "@/lib/apiClient";
import { getListItems, getIssueCoverImageUrl, localizeIssue } from "@/lib/adminUtils";

// Backend gap: GET /events embeds `issue` without its `translations` array,
// so localizeIssue() returns no title and the card renders blank. Until the
// backend includes translations (or events expose their own title), fall
// back to a humanized slug so users see *something* readable.
function humanizeSlug(slug) {
  if (!slug || typeof slug !== "string") return "";
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickEventTitle(rawEvent, language) {
  const localized = rawEvent?.issue ? localizeIssue(rawEvent.issue, language) : null;
  return (
    localized?.title ||
    rawEvent?.title ||
    humanizeSlug(rawEvent?.issue?.slug) ||
    humanizeSlug(rawEvent?.slug) ||
    ""
  );
}

// Normalise a backend event into the shape the home rail / list pages /
// detail page consume. Idempotent for already-normalised payloads.
export function normalizeEvent(rawEvent, language = "np") {
  if (!rawEvent) return rawEvent;
  const issue = rawEvent.issue || null;
  const localizedIssue = issue ? localizeIssue(issue, language) : null;
  return {
    ...rawEvent,
    title: pickEventTitle(rawEvent, language),
    addressText: issue?.addressText || rawEvent.addressText || "",
    category: issue?.category || rawEvent.category || null,
    latitude: rawEvent.meetupLatitude ?? issue?.latitude ?? null,
    longitude: rawEvent.meetupLongitude ?? issue?.longitude ?? null,
    thumbnailUrl: getIssueCoverImageUrl(issue) || rawEvent.thumbnailUrl || null,
    linkedIssue: localizedIssue,
    rolePlan: Array.isArray(rawEvent.rolePlan) ? rawEvent.rolePlan : []
  };
}

const DEFAULT_LIMIT = 50;

// Raw list — single status filter.
async function fetchEvents({ status, limit = DEFAULT_LIMIT, fromDate, toDate, language = "np" } = {}) {
  const params = { limit };
  if (status) params.status = status;
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  const response = await getJson("/events", { params });
  return getListItems(response).map((ev) => normalizeEvent(ev, language));
}

// "Live now" = ACTIVE + SCHEDULED-with-past-scheduledAt (backend doesn't
// auto-transition SCHEDULED→ACTIVE in staging, so we derive client-side).
// Window: events whose scheduledAt is within the last 6h and not yet
// completed — anything older than that is treated as past and surfaces
// via listPastEvents instead.
export async function listLiveEvents({ language = "np" } = {}) {
  const SIX_HOURS = 6 * 60 * 60_000;
  const now = Date.now();
  const [active, scheduled] = await Promise.all([
    fetchEvents({ status: "ACTIVE", language }),
    fetchEvents({ status: "SCHEDULED", language })
  ]);
  const live = [...active];
  for (const ev of scheduled) {
    const at = ev.scheduledAt ? new Date(ev.scheduledAt).getTime() : null;
    if (at != null && at <= now && now - at <= SIX_HOURS && !ev.completedAt) {
      live.push(ev);
    }
  }
  // De-dup by id (an event could in theory hit both filters)
  const seen = new Set();
  return live.filter((ev) => {
    if (seen.has(ev.id)) return false;
    seen.add(ev.id);
    return true;
  });
}

export async function listUpcomingEvents({ language = "np", limit = DEFAULT_LIMIT } = {}) {
  const now = Date.now();
  const scheduled = await fetchEvents({ status: "SCHEDULED", limit, language });
  return scheduled.filter((ev) => {
    if (!ev.scheduledAt) return false;
    return new Date(ev.scheduledAt).getTime() > now;
  });
}

export async function listPastEvents({ language = "np", limit = DEFAULT_LIMIT } = {}) {
  return fetchEvents({ status: "COMPLETED", limit, language });
}

// All buckets in parallel — handy for /events page + /calendar.
export async function listAllEvents({ language = "np" } = {}) {
  const [live, upcoming, past] = await Promise.all([
    listLiveEvents({ language }),
    listUpcomingEvents({ language }),
    listPastEvents({ language })
  ]);
  return { live, upcoming, past };
}

export async function getEventById(eventId, { language = "np" } = {}) {
  const response = await getJson(`/events/${eventId}`);
  const data = response?.data;
  return data ? normalizeEvent(data, language) : null;
}
