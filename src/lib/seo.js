export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://shramdan.org"
).replace(/\/+$/, "");

export const BRAND = "श्रमदान | Shramdan";

export const DEFAULT_OG_IMAGE = {
  url: "/images/og-shramdan.jpg",
  width: 1200,
  height: 630,
  alt: "श्रमदान — हाम्रो श्रम, हाम्रो समाज, हाम्रो भविष्य। | Shramdan — Our labor, our society, our future."
};

export const DEFAULT_DESCRIPTION =
  "श्रमदान — नागरिक-नेतृत्वमा नेपालका सामुदायिक समस्या समाधान गर्ने प्लेटफर्म। सरसफाइ, वृक्षारोपण, ट्रेल मर्मत र थप अभियानमा सहभागी हुनुहोस्। Shramdan is a citizen-led platform to organise community work across Nepal — cleanups, afforestation, trail repair, and more.";

export const DEFAULT_KEYWORDS = [
  "श्रमदान",
  "Shramdan",
  "Nepal",
  "नेपाल",
  "community service",
  "सामुदायिक सेवा",
  "cleanup",
  "सरसफाइ",
  "volunteering",
  "स्वयंसेवा",
  "civic action",
  "citizen-led",
  "Kathmandu"
];

function absoluteUrl(path) {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function truncate(text, max = 200) {
  const trimmed = String(text ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function buildMetadata({
  title,
  description,
  path = "/",
  image,
  imageAlt,
  type = "website",
  keywords,
  noindex = false
} = {}) {
  const finalTitle = title ? `${title} · ${BRAND}` : BRAND;
  const finalDescription = truncate(description || DEFAULT_DESCRIPTION);
  const canonical = absoluteUrl(path);

  const ogImage = image
    ? { url: absoluteUrl(image), alt: imageAlt || finalTitle }
    : { ...DEFAULT_OG_IMAGE, url: absoluteUrl(DEFAULT_OG_IMAGE.url) };

  return {
    title: { absolute: finalTitle },
    description: finalDescription,
    keywords: keywords && keywords.length ? keywords : DEFAULT_KEYWORDS,
    alternates: {
      canonical,
      languages: {
        "ne-NP": canonical,
        "en-US": canonical,
        "x-default": canonical
      }
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: canonical,
      type,
      siteName: BRAND,
      locale: "ne_NP",
      alternateLocale: ["en_US"],
      images: [ogImage]
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [ogImage.url]
    },
    robots: noindex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : undefined
  };
}

export { absoluteUrl, truncate };

const ORGANIZATION_SAME_AS = [
  "https://www.facebook.com/profile.php?id=61589961623195"
];

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "श्रमदान",
    alternateName: "Shramdan",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/branding/logo.png"),
      width: 1024,
      height: 1024
    },
    image: absoluteUrl(DEFAULT_OG_IMAGE.url),
    description: DEFAULT_DESCRIPTION,
    sameAs: ORGANIZATION_SAME_AS,
    areaServed: {
      "@type": "Country",
      name: "Nepal"
    }
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "श्रमदान | Shramdan",
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: ["ne-NP", "en-US"],
    publisher: { "@id": `${SITE_URL}/#organization` }
  };
}

export function breadcrumbSchema(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path)
    }))
  };
}

export function articleSchema({
  headline,
  description,
  path,
  image,
  imageAlt,
  datePublished,
  dateModified,
  inLanguage = "ne"
}) {
  const url = absoluteUrl(path);
  const imageUrl = image
    ? absoluteUrl(image)
    : absoluteUrl(DEFAULT_OG_IMAGE.url);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: truncate(headline, 110),
    description: truncate(description, 250),
    image: [{ "@type": "ImageObject", url: imageUrl, caption: imageAlt || headline }],
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage,
    datePublished: datePublished || undefined,
    dateModified: dateModified || datePublished || undefined,
    publisher: { "@id": `${SITE_URL}/#organization` },
    isPartOf: { "@id": `${SITE_URL}/#website` }
  };
}
