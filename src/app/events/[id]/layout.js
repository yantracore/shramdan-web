import { API_BASE_URL } from "@/lib/apiClient";
import { getResponseData } from "@/lib/adminUtils";
import {
  articleSchema,
  breadcrumbSchema,
  buildMetadata,
  BRAND
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

async function fetchEvent(id) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/events/${encodeURIComponent(id)}`,
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return null;
    const body = await response.json();
    return getResponseData(body, null);
  } catch {
    return null;
  }
}

function firstImageUrl(event) {
  const uploads = event?.uploads || event?.images || [];
  for (const upload of uploads) {
    const url = upload?.url || upload?.fileUrl || upload?.path;
    if (url && /\.(png|jpe?g|webp|gif)$/i.test(url)) return url;
  }
  return null;
}

function isDemoEventId(id) {
  return typeof id === "string" && id.startsWith("demo-");
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const path = `/events/${id}`;

  // Demo-* IDs only exist in client-side mock data, never in the backend.
  // Don't pre-render a 'not found' title — the client will hydrate with the
  // real event title once the mock resolves.
  if (isDemoEventId(id)) {
    return buildMetadata({
      title: "Shramdan campaign",
      description: "",
      path
    });
  }

  const event = await fetchEvent(id);

  if (!event) {
    return buildMetadata({
      title: "Event not found",
      description: `यो अभियान भेटिएन। ${BRAND} मा अरू अभियानहरू हेर्नुहोस्। This campaign could not be found — browse other campaigns on Shramdan.`,
      path,
      noindex: true
    });
  }

  const title = event.title || event.name || "Shramdan campaign";
  return buildMetadata({
    title,
    description: event.description || event.summary || "",
    path,
    image: firstImageUrl(event),
    imageAlt: title,
    type: "article"
  });
}

export default async function EventDetailLayout({ children, params }) {
  const { id } = await params;

  // Demo-* IDs only exist in client-side mock data — skip the backend fetch
  // and the JSON-LD payload (the client will hydrate with the real data).
  if (isDemoEventId(id)) return children;

  const event = await fetchEvent(id);

  if (!event) return children;

  const path = `/events/${id}`;
  const title = event.title || event.name || "Shramdan campaign";

  const breadcrumb = breadcrumbSchema([
    { name: "श्रमदान", path: "/" },
    { name: "Issues", path: "/issues" },
    { name: title, path }
  ]);

  const article = articleSchema({
    headline: title,
    description: event.description || event.summary || "",
    path,
    image: firstImageUrl(event),
    imageAlt: title,
    datePublished: event.scheduledAt || event.createdAt || event.created_at,
    dateModified: event.updatedAt || event.updated_at,
    inLanguage: "ne"
  });

  return (
    <>
      <JsonLd data={[breadcrumb, article]} />
      {children}
    </>
  );
}
