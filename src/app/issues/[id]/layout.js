import { API_BASE_URL } from "@/lib/apiClient";
import { getIssueCoverImageUrl, getResponseData } from "@/lib/adminUtils";
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

export async function generateMetadata({ params }) {
  const { id } = await params;
  const issue = await fetchIssue(id);
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
  const issue = await fetchIssue(id);

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
