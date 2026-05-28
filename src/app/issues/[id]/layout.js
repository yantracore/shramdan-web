import { API_BASE_URL } from "@/lib/apiClient";
import { getIssueCoverImageUrl, getResponseData } from "@/lib/adminUtils";

const BRAND = "श्रमदान | Shramdan";
const FALLBACK_DESCRIPTION =
  "Citizen-led issue tracking and collective action for Nepal. श्रमदान — हाम्रो श्रम, हाम्रो समाज, हाम्रो भविष्य।";

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

function truncate(text, max = 200) {
  const trimmed = String(text ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const issue = await fetchIssue(id);

  if (!issue) {
    return {
      title: BRAND,
      description: FALLBACK_DESCRIPTION
    };
  }

  const title = `${issue.title} · ${BRAND}`;
  const description = truncate(issue.description || FALLBACK_DESCRIPTION);
  const image = getIssueCoverImageUrl(issue);
  const ogImages = image ? [{ url: image, alt: issue.title }] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: BRAND,
      images: ogImages,
      locale: "ne_NP",
      alternateLocale: ["en_US"]
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export default function IssueDetailLayout({ children }) {
  return children;
}
