import { API_BASE_URL } from "@/lib/apiClient";
import { getResponseData } from "@/lib/adminUtils";
import { buildMetadata, BRAND } from "@/lib/seo";

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

export async function generateMetadata({ params }) {
  const { id } = await params;
  const event = await fetchEvent(id);
  const path = `/events/${id}`;

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

export default function EventDetailLayout({ children }) {
  return children;
}
