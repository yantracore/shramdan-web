import { copy } from "@/lib/siteContent";
import { buildMetadata } from "@/lib/seo";

function findItem(language, id) {
  const items = copy[language]?.eventTypes?.items || [];
  return items.find((entry) => entry.id === id) || null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const npItem = findItem("np", id);
  const enItem = findItem("en", id);
  const path = `/event-types/${id}`;

  if (!npItem && !enItem) {
    return buildMetadata({
      title: "कार्य-प्रकार भेटिएन | Event type not found",
      description:
        "यो कार्य-प्रकार उपलब्ध छैन। श्रमदानको कार्य-दायरा हेर्नुहोस्। This event type is not available — browse what Shramdan can do.",
      path,
      noindex: true
    });
  }

  const npTitle = npItem ? `${npItem.title} — ${npItem.tagline || ""}`.trim().replace(/—\s*$/, "").trim() : "";
  const enTitle = enItem ? `${enItem.title} — ${enItem.tagline || ""}`.trim().replace(/—\s*$/, "").trim() : "";
  const title = [npTitle, enTitle].filter(Boolean).join(" | ");

  const npDesc = npItem?.overview || npItem?.body || "";
  const enDesc = enItem?.overview || enItem?.body || "";
  const description = [npDesc, enDesc].filter(Boolean).join(" — ");

  const image = npItem?.image || enItem?.image;
  const imageAlt = npItem?.imageAlt || enItem?.imageAlt || title;

  return buildMetadata({
    title,
    description,
    path,
    image,
    imageAlt,
    type: "article"
  });
}

export default function EventTypeDetailLayout({ children }) {
  return children;
}
