import { API_BASE_URL } from "@/lib/apiClient";
import { getIssueCoverImageUrl, getResponseData, localizeIssue } from "@/lib/adminUtils";
import {
  articleSchema,
  breadcrumbSchema,
  buildMetadata,
  BRAND
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

async function fetchIssue(id) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/issues/${encodeURIComponent(id)}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return null;
    const body = await response.json();
    return getResponseData(body, null);
  } catch {
    return null;
  }
}

// Metadata is single-locale per page; SSR can't read the user's
// language preference (client cookie/localStorage), so we pick Nepali
// by default — the public site's primary audience. The detail page
// itself re-renders bilingually based on the in-app language toggle.
function localizedIssue(issue) {
  return issue ? localizeIssue(issue, "np") : null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const issue = localizedIssue(await fetchIssue(id));
  const path = `/issues/${id}`;

  if (!issue) {
    return buildMetadata({
      title: "Issue not found",
      description: `यो समस्या भेटिएन। ${BRAND} मा अरू समस्याहरू हेर्नुहोस्। This issue could not be found — browse other issues on Shramdan.`,
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

export default async function IssueDetailLayout({ children, params }) {
  const { id } = await params;
  const issue = localizedIssue(await fetchIssue(id));

  if (!issue) return children;

  const path = `/issues/${id}`;
  const breadcrumb = breadcrumbSchema([
    { name: "श्रमदान", path: "/" },
    { name: "Issues", path: "/issues" },
    { name: issue.title || id, path }
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
