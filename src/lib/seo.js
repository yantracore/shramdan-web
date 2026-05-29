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
