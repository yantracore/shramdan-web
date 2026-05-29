import { copy } from "@/lib/siteContent";
import {
  articleSchema,
  breadcrumbSchema,
  buildMetadata
} from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

function findItem(language, id) {
  const items = copy[language]?.eventTypes?.items || [];
  return items.find((entry) => entry.id === id) || null;
}

function combine(np, en, separator) {
  return [np, en].filter(Boolean).join(separator);
}

function buildContext(id) {
  const npItem = findItem("np", id);
  const enItem = findItem("en", id);
  if (!npItem && !enItem) return null;

  const npTitle = npItem
    ? combine(npItem.title, npItem.tagline, " — ")
    : "";
  const enTitle = enItem
    ? combine(enItem.title, enItem.tagline, " — ")
    : "";
  const title = combine(npTitle, enTitle, " | ");

  const npDesc = npItem?.overview || npItem?.body || "";
  const enDesc = enItem?.overview || enItem?.body || "";
  const description = combine(npDesc, enDesc, " — ");

  const image = npItem?.image || enItem?.image;
  const imageAlt = npItem?.imageAlt || enItem?.imageAlt || title;
  const path = `/event-types/${id}`;
  const indexTitle = copy.np?.eventTypes?.page?.pageTitle || "Event Types";
  const homeTitle = copy.np?.brand || "श्रमदान";

  return {
    npItem,
    enItem,
    title,
    description,
    image,
    imageAlt,
    path,
    indexTitle,
    homeTitle
  };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const ctx = buildContext(id);
  const path = `/event-types/${id}`;

  if (!ctx) {
    return buildMetadata({
      title: "कार्य-प्रकार भेटिएन | Event type not found",
      description:
        "यो कार्य-प्रकार उपलब्ध छैन। श्रमदानको कार्य-दायरा हेर्नुहोस्। This event type is not available — browse what Shramdan can do.",
      path,
      noindex: true
    });
  }

  return buildMetadata({
    title: ctx.title,
    description: ctx.description,
    path,
    image: ctx.image,
    imageAlt: ctx.imageAlt,
    type: "article"
  });
}

export default async function EventTypeDetailLayout({ children, params }) {
  const { id } = await params;
  const ctx = buildContext(id);

  if (!ctx) return children;

  const breadcrumb = breadcrumbSchema([
    { name: ctx.homeTitle, path: "/" },
    { name: ctx.indexTitle, path: "/event-types" },
    { name: ctx.npItem?.title || ctx.enItem?.title || id, path: ctx.path }
  ]);

  const article = articleSchema({
    headline: ctx.npItem?.title || ctx.enItem?.title,
    description: ctx.description,
    path: ctx.path,
    image: ctx.image,
    imageAlt: ctx.imageAlt,
    inLanguage: "ne"
  });

  return (
    <>
      <JsonLd data={[breadcrumb, article]} />
      {children}
    </>
  );
}
