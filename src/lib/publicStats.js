import { getJson } from "@/lib/apiClient";
import { getResponseData } from "@/lib/adminUtils";

const PUBLIC_COUNT_LIMIT = 500;
const PUBLIC_COUNT_MAX_PAGES = 20;
const PUBLIC_COUNT_CACHE_MS = 5 * 60 * 1000;

let publicCountsCache = null;
let publicCountsPromise = null;

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

async function countPublicList(path) {
  let cursor = null;
  let total = 0;

  for (let page = 0; page < PUBLIC_COUNT_MAX_PAGES; page += 1) {
    const response = await getJson(path, {
      params: {
        limit: PUBLIC_COUNT_LIMIT,
        ...(cursor ? { cursor } : {})
      }
    });
    const reportedTotal = getReportedTotal(response);
    if (reportedTotal != null) return reportedTotal;

    const items = getItems(response);
    total += items.length;

    const data = getResponseData(response, null);
    cursor = data?.nextCursor || response?.nextCursor || null;
    if (!cursor || items.length === 0) break;
  }

  return total;
}

async function loadPublicCounts() {
  const [events, issues] = await Promise.all([
    countPublicList("/events"),
    countPublicList("/issues")
  ]);

  return { events, issues };
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
