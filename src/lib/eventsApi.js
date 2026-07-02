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
// `liveStream` (mp4 URL / viewer count) is NOT present in backend events
// and is no longer mocked here — the live-stream player only renders once
// the live-streams backend ships (see docs/api-requirements/live-streams.md).

import { getJson } from "@/lib/apiClient";
import { getListItems, getIssueCoverImageUrl, localizeIssue, resolveUsableImage } from "@/lib/adminUtils";

// Backend caps list `limit` at 100 — a higher value 400s, and the catch below
// nulls the promise, so every cover lookup would re-fire the failing request
// (a flood of 400s + constant re-renders that destabilised the home carousels
// on navigation). Index the first 100; misses fall back to per-id detail reads.
const ISSUE_COVER_INDEX_LIMIT = 100;
let issueCoverIndexPromise = null;
const issueCoverDetailPromises = new Map();

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
    // rawEvent.thumbnailUrl can carry a dead-host seed URL — route it through
    // the guard so it becomes a demo fallback instead of a broken request.
    thumbnailUrl:
      getIssueCoverImageUrl(issue) ||
      resolveUsableImage(rawEvent.thumbnailUrl, issue?.category || rawEvent.category) ||
      null,
    linkedIssue: localizedIssue,
    rolePlan: Array.isArray(rawEvent.rolePlan) ? rawEvent.rolePlan : []
  };
}

function addIssueCoverIndexEntry(index, issue) {
  const url = getIssueCoverImageUrl(issue);
  if (!url) return;
  if (issue?.id) index.set(`id:${issue.id}`, url);
  if (issue?.slug) index.set(`slug:${issue.slug}`, url);
}

async function getIssueCoverIndex() {
  if (!issueCoverIndexPromise) {
    issueCoverIndexPromise = getJson("/issues", {
      params: { limit: ISSUE_COVER_INDEX_LIMIT }
    }).then((response) => {
      const index = new Map();
      getListItems(response).forEach((issue) => addIssueCoverIndexEntry(index, issue));
      return index;
    }).catch((error) => {
      issueCoverIndexPromise = null;
      throw error;
    });
  }
  return issueCoverIndexPromise;
}

function getEventIssueKeys(event) {
  const issue = event?.issue || event?.linkedIssue || null;
  return [
    issue?.id ? `id:${issue.id}` : null,
    issue?.slug ? `slug:${issue.slug}` : null,
    event?.slug ? `slug:${event.slug}` : null
  ].filter(Boolean);
}

function getEventIssueId(event) {
  return event?.issue?.id || event?.linkedIssue?.id || null;
}

function getIndexedIssueCoverUrl(index, event) {
  for (const key of getEventIssueKeys(event)) {
    const url = index.get(key);
    if (url) return url;
  }
  return null;
}

async function getIssueCoverById(issueId) {
  if (!issueId) return null;
  if (!issueCoverDetailPromises.has(issueId)) {
    issueCoverDetailPromises.set(
      issueId,
      getJson(`/issues/${issueId}`)
        .then((response) => getIssueCoverImageUrl(response?.data ?? response))
        .catch(() => null)
    );
  }
  return issueCoverDetailPromises.get(issueId);
}

async function enrichEventsWithIssueCovers(events) {
  const missing = events.filter((event) => !event.thumbnailUrl);
  if (missing.length === 0) return events;

  let issueCoverIndex = new Map();
  try {
    issueCoverIndex = await getIssueCoverIndex();
  } catch {
    issueCoverIndex = new Map();
  }

  const indexed = events.map((event) => {
    if (event.thumbnailUrl) return event;
    const indexedCover = getIndexedIssueCoverUrl(issueCoverIndex, event);
    return indexedCover ? { ...event, thumbnailUrl: indexedCover } : event;
  });

  const detailIds = [
    ...new Set(
      indexed
        .filter((event) => !event.thumbnailUrl)
        .map(getEventIssueId)
        .filter(Boolean)
    )
  ];

  if (detailIds.length === 0) return indexed;

  const detailEntries = await Promise.all(
    detailIds.map(async (issueId) => [issueId, await getIssueCoverById(issueId)])
  );
  const detailCovers = new Map(detailEntries.filter(([, url]) => Boolean(url)));

  return indexed.map((event) => {
    if (event.thumbnailUrl) return event;
    const detailCover = detailCovers.get(getEventIssueId(event));
    return detailCover ? { ...event, thumbnailUrl: detailCover } : event;
  });
}

const DEFAULT_LIMIT = 50;

// Raw list — single status filter.
async function fetchEvents({ status, limit = DEFAULT_LIMIT, fromDate, toDate, provinceId, districtId, category, search, sort, order, language = "np" } = {}) {
  const params = { limit };
  if (status) params.status = status;
  if (fromDate) params.fromDate = fromDate;
  if (toDate) params.toDate = toDate;
  if (provinceId) params.provinceId = provinceId;
  if (districtId) params.districtId = districtId;
  // Backend-side filtering — GET /events accepts `category` + `search` (the
  // event inherits the linked issue's category). No client-side narrowing.
  if (category) params.category = category;
  if (search) params.search = search;
  // Backend-side ordering — GET /events accepts `sort` (scheduledAt | voteCount
  // | createdAt) + `order` (asc | desc). Only forwarded when the caller asks;
  // otherwise the list keeps the endpoint's default order.
  if (sort) {
    params.sort = sort;
    params.order = order || "desc";
  }
  const response = await getJson("/events", { params });
  const events = getListItems(response).map((ev) => normalizeEvent(ev, language));
  return enrichEventsWithIssueCovers(events);
}

// "Live now" = ACTIVE + SCHEDULED-with-past-scheduledAt (backend doesn't
// auto-transition SCHEDULED→ACTIVE in staging, so we derive client-side).
// Window: events whose scheduledAt is within the last 6h and not yet
// completed — anything older than that is treated as past and surfaces
// via listPastEvents instead.
export async function listLiveEvents({ language = "np", provinceId, districtId } = {}) {
  const SIX_HOURS = 6 * 60 * 60_000;
  const now = Date.now();
  const [active, scheduled] = await Promise.all([
    fetchEvents({ status: "ACTIVE", language, provinceId, districtId }),
    fetchEvents({ status: "SCHEDULED", language, provinceId, districtId })
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

export async function listUpcomingEvents({ language = "np", limit = DEFAULT_LIMIT, provinceId, districtId } = {}) {
  const now = Date.now();
  const scheduled = await fetchEvents({ status: "SCHEDULED", limit, language, provinceId, districtId });
  return scheduled.filter((ev) => {
    if (!ev.scheduledAt) return false;
    return new Date(ev.scheduledAt).getTime() > now;
  });
}

export async function listPastEvents({ language = "np", limit = DEFAULT_LIMIT, provinceId, districtId } = {}) {
  return fetchEvents({ status: "COMPLETED", limit, language, provinceId, districtId });
}

// DRAFT events — promoted from an issue, leader/schedule still being settled
// (leaderVotingStatus + leaderCandidateIds are present; scheduledAt is usually
// null). Surfaced on the unified /campaigns "तयारीमा / Planning" stage. Cards
// must render gracefully without a date — see EventListCard's draft handling.
export async function listDraftEvents({ language = "np", limit = DEFAULT_LIMIT, provinceId, districtId } = {}) {
  return fetchEvents({ status: "DRAFT", limit, language, provinceId, districtId });
}

// Raw single-status event list (enriched with issue covers), used by the
// unified /campaigns feed where each lifecycle stage maps 1:1 to a backend
// event status. Unlike listLive/Upcoming/PastEvents it does NO client-side date
// re-bucketing — the status the user filters by IS the status fetched. This
// keeps the feed and the chip-row counts in lock-step.
export async function listEventsByStatus(status, { language = "np", limit = DEFAULT_LIMIT, provinceId, districtId, category, search, sort, order } = {}) {
  return fetchEvents({ status, limit, language, provinceId, districtId, category, search, sort, order });
}

// All lifecycle buckets in parallel — handy for /campaigns + /calendar. Keys use
// the technical status vocabulary (active = ongoing now, scheduled = upcoming,
// completed = past). The backend status strings passed to fetchEvents above are
// unchanged — this is only our frontend grouping name.
export async function listAllEvents({ language = "np", provinceId, districtId } = {}) {
  const [active, scheduled, completed] = await Promise.all([
    listLiveEvents({ language, provinceId, districtId }),
    listUpcomingEvents({ language, provinceId, districtId }),
    listPastEvents({ language, provinceId, districtId })
  ]);
  return { active, scheduled, completed };
}

export async function getEventById(eventId, { language = "np" } = {}) {
  const response = await getJson(`/events/${eventId}`);
  const data = response?.data;
  return data ? normalizeEvent(data, language) : null;
}

// Interim issue→event resolver. Once an issue is promoted to EVENT_SCHEDULED a
// campaign event exists, but the issue read does NOT embed it and there is no
// `GET /events?issueId=` filter (both confirmed live 2026-06-22 — see
// docs/api-requirements/issues.md "Gaps"). The link only runs the other way:
// every event payload carries `issueId`. So we narrow the event list by the
// issue's own district (province as fallback) — which cuts the candidate set
// hard — and match `issueId` client-side to recover the routing target.
//
// Returns `{ id, slug, status, eventLeaderId, eventLeader }` for the linked
// event, or null. Routing uses slug-or-id; `status` lets callers pick the right
// join affordance (DRAFT → Join+Lead, SCHEDULED → Join-as-Role, ACTIVE →
// Join-as-Worker); `eventLeader` (+ id) lets the issue surface show its
// resolved Coordinator filled (the event list carries the leader inline). Drop
// this the moment `GET /issues/{id}` embeds `event { id, slug, status, ... }`.
export async function resolveEventForIssue(issue) {
  if (!issue?.id) return null;
  // Forward-compatible: if the backend ever lands the link on the issue, use it
  // straight away and skip the lookup entirely.
  const embedded = issue.event;
  if (embedded?.id || embedded?.slug) {
    return {
      id: embedded.id || null,
      slug: embedded.slug || null,
      status: embedded.status || null,
      eventLeaderId: embedded.eventLeaderId ?? null,
      eventLeader: embedded.eventLeader ?? null
    };
  }
  const districtId = issue.districtId || issue.district?.id || null;
  const provinceId = issue.provinceId || issue.province?.id || null;
  const params = { limit: 100 };
  if (districtId) params.districtId = districtId;
  else if (provinceId) params.provinceId = provinceId;
  try {
    const response = await getJson("/events", { params });
    const match = getListItems(response).find((ev) => ev.issueId === issue.id);
    if (!match) return null;
    return {
      id: match.id || null,
      slug: match.slug || null,
      status: match.status || null,
      eventLeaderId: match.eventLeaderId ?? null,
      eventLeader: match.eventLeader ?? null
    };
  } catch {
    return null;
  }
}

// Events the authenticated caller is involved in (GET /events/me). `as`
// scopes to leader | voter | all (default all). Each normalized item keeps
// the caller-relationship decorations the backend adds — `isLeader` and
// `voterRole` (their commitment on the linked issue, or null).
export async function listMyEvents({ language = "np", as = "all", status, limit = DEFAULT_LIMIT } = {}) {
  const params = { as, limit };
  if (status) params.status = status;
  const response = await getJson("/events/me", { params, requireAuth: true });
  return getListItems(response).map((ev) => normalizeEvent(ev, language));
}
