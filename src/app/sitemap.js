import { API_BASE_URL } from "@/lib/apiClient";
import { getResponseData } from "@/lib/adminUtils";
import { copy } from "@/lib/siteContent";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/event-types", priority: 0.9, changeFrequency: "monthly" },
  { path: "/campaigns", priority: 0.9, changeFrequency: "daily" },
  { path: "/issues/new", priority: 0.6, changeFrequency: "yearly" },
  { path: "/join", priority: 0.7, changeFrequency: "monthly" },
  { path: "/feedback", priority: 0.5, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/code-of-conduct", priority: 0.3, changeFrequency: "yearly" }
];

async function fetchPublicList(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      next: { revalidate: 1800 }
    });
    if (!response.ok) return [];
    const body = await response.json();
    const data = getResponseData(body, []);
    return Array.isArray(data) ? data : data?.items || [];
  } catch {
    return [];
  }
}

function withLastMod(items) {
  return items
    .map((item) => {
      const slugOrId = item?.slug || item?.id || item?.uuid;
      if (!slugOrId) return null;
      const lastModRaw =
        item?.updatedAt || item?.modifiedAt || item?.createdAt || null;
      const lastModified = lastModRaw ? new Date(lastModRaw) : undefined;
      return { slugOrId, lastModified };
    })
    .filter(Boolean);
}

export default async function sitemap() {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority
  }));

  const eventTypeIds = (copy.np?.eventTypes?.items || []).map((item) => item.id);
  const eventTypeEntries = eventTypeIds.map((id) => ({
    url: `${SITE_URL}/event-types/${id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7
  }));

  // One minimal /campaigns call covers every detail URL. Canonical detail
  // route is /campaign/<slug> — the old /issues/<slug> and /events/<slug>
  // URLs are permanent redirects to it (next.config.mjs), and redirected URLs
  // don't belong in a sitemap. mode=minimal carries no updatedAt, so entries
  // use the crawl date; the 1800s revalidate keeps that honest enough.
  const campaigns = await fetchPublicList("/campaigns?mode=minimal&limit=1000");

  const campaignEntries = withLastMod(campaigns).map(
    ({ slugOrId, lastModified }) => ({
      url: `${SITE_URL}/campaign/${slugOrId}`,
      lastModified: lastModified || now,
      changeFrequency: "weekly",
      priority: 0.6
    })
  );

  return [...staticEntries, ...eventTypeEntries, ...campaignEntries];
}
