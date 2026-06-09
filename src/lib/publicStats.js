import { getJson } from "@/lib/apiClient";
import { getResponseData } from "@/lib/adminUtils";

const PUBLIC_COUNT_LIMIT = 500;
const PUBLIC_COUNT_MAX_PAGES = 20;
const PUBLIC_COUNT_CACHE_MS = 5 * 60 * 1000;
const LIVE_SCHEDULED_WINDOW_MS = 6 * 60 * 60 * 1000;

let publicCountsCache = null;
let publicCountsPromise = null;

export async function getFallbackPublicCounts() {
  if (process.env.NODE_ENV === "production") return null;

  const { getDemoAllEvents, getDemoIssues } = await import("@/lib/devMockData");
  const eventGroups = getDemoAllEvents();

  return {
    events:
      eventGroups.live.length +
      eventGroups.upcoming.length,
    issues: getDemoIssues().length
  };
}

function getItems(response) {
  const data = getResponseData(response, []);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getReportedTotal(response) {
  const data = getResponseData(response, null);
  const candidates = [
    data?.total,
    data?.totalCount,
    data?.count,
    data?.pagination?.total,
    data?.meta?.total,
    response?.total,
    response?.totalCount
  ];
  const found = candidates.find((value) => Number.isFinite(Number(value)));
  return found == null ? null : Number(found);
}

async function countPublicList(path, params = {}, filterItem = null) {
  let cursor = null;
  let total = 0;

  for (let page = 0; page < PUBLIC_COUNT_MAX_PAGES; page += 1) {
    const response = await getJson(path, {
      params: {
        ...params,
        limit: PUBLIC_COUNT_LIMIT,
        ...(cursor ? { cursor } : {})
      }
    });
    const reportedTotal = getReportedTotal(response);
    if (!filterItem && reportedTotal != null) return reportedTotal;

    const items = getItems(response);
    total += filterItem ? items.filter(filterItem).length : items.length;

    const data = getResponseData(response, null);
    cursor = data?.nextCursor || response?.nextCursor || null;
    if (!cursor || items.length === 0) break;
  }

  return total;
}

function isLiveOrUpcomingScheduledEvent(event) {
  if (!event?.scheduledAt) return false;
  const scheduledAt = new Date(event.scheduledAt).getTime();
  if (!Number.isFinite(scheduledAt)) return false;

  const now = Date.now();
  return scheduledAt > now || now - scheduledAt <= LIVE_SCHEDULED_WINDOW_MS;
}

async function countOngoingEvents() {
  const [active, scheduled] = await Promise.all([
    countPublicList("/events", { status: "ACTIVE" }),
    countPublicList("/events", { status: "SCHEDULED" }, isLiveOrUpcomingScheduledEvent)
  ]);

  return active + scheduled;
}

async function loadPublicCounts() {
  const fallback = await getFallbackPublicCounts();
  const [eventsResult, issuesResult] = await Promise.allSettled([
    countOngoingEvents(),
    countPublicList("/issues")
  ]);

  return {
    events:
      eventsResult.status === "fulfilled"
        ? eventsResult.value
        : fallback?.events ?? null,
    issues:
      issuesResult.status === "fulfilled"
        ? issuesResult.value
        : fallback?.issues ?? null
  };
}

export function getCachedPublicCounts() {
  const now = Date.now();
  if (publicCountsCache && now - publicCountsCache.timestamp < PUBLIC_COUNT_CACHE_MS) {
    return Promise.resolve(publicCountsCache.value);
  }

  if (!publicCountsPromise) {
    publicCountsPromise = loadPublicCounts()
      .then((value) => {
        publicCountsCache = { value, timestamp: Date.now() };
        return value;
      })
      .finally(() => {
        publicCountsPromise = null;
      });
  }

  return publicCountsPromise;
}
