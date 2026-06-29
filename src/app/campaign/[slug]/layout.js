import { API_BASE_URL } from "@/lib/apiClient";
import { getIssueCoverImageUrl, getResponseData, localizeIssue } from "@/lib/adminUtils";
import {
  articleSchema,
  breadcrumbSchema,
  buildMetadata,
  BRAND
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

// Resolve a /campaign/{slug} to its canonical issue. The slug may be an issue
// slug (canonical) or an event slug (old /events/:slug redirect): try the issue
// first, then fall back to the event's linked issue for metadata. SSR can't read
// the client language preference, so metadata is single-locale (Nepali — the
// public site's primary audience); the page re-renders bilingually in-app.
async function fetchCampaignIssue(slug) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/issues/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } }
    );
    if (response.ok) {
      const body = await response.json();
      const issue = getResponseData(body, null);
      if (issue) return issue;
    }
  } catch {
    // fall through to the event lookup
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/events/${encodeURIComponent(slug)}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return null;
    const body = await response.json();
    const event = getResponseData(body, null);
    const linkedSlug = event?.issue?.slug;
    if (!linkedSlug) return event?.issue || null;
    const issueResponse = await fetch(
      `${API_BASE_URL}/issues/${encodeURIComponent(linkedSlug)}`,
      { next: { revalidate: 300 } }
    );
    if (!issueResponse.ok) return event?.issue || null;
    const issueBody = await issueResponse.json();
    return getResponseData(issueBody, null) || event?.issue || null;
  } catch {
    return null;
  }
}

function localizedIssue(issue) {
  return issue ? localizeIssue(issue, "np") : null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const issue = localizedIssue(await fetchCampaignIssue(slug));
  const path = `/campaign/${slug}`;

  if (!issue) {
    return buildMetadata({
      title: "Campaign not found",
      description: `यो अभियान भेटिएन। ${BRAND} मा अरू अभियानहरू हेर्नुहोस्। This campaign could not be found — browse other campaigns on Shramdan.`,
      path,
      noindex: true
    });
  }

  return buildMetadata({
    title: issue.title,
    description: issue.description,
    path,
    image: getIssueCoverImageUrl(issue),
    imageAlt: issue.title,
    type: "article"
  });
}

export default async function CampaignDetailLayout({ children, params }) {
  const { slug } = await params;
  const issue = localizedIssue(await fetchCampaignIssue(slug));

  if (!issue) return children;

  const path = `/campaign/${slug}`;
  const breadcrumb = breadcrumbSchema([
    { name: "श्रमदान", path: "/" },
    { name: "Campaigns", path: "/campaigns" },
    { name: issue.title || slug, path }
  ]);

  const article = articleSchema({
    headline: issue.title,
    description: issue.description,
    path,
    image: getIssueCoverImageUrl(issue),
    imageAlt: issue.title,
    datePublished: issue.createdAt || issue.created_at,
    dateModified: issue.updatedAt || issue.updated_at,
    inLanguage: "ne"
  });

  return (
    <>
      <JsonLd data={[breadcrumb, article]} />
      {children}
    </>
  );
}
