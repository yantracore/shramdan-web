import { BRAND, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo";

const TITLE = "श्रमदान प्रभाव | Shramdan Impact";
const DESCRIPTION =
  "श्रमदान सदस्यहरूले मिलेर पूरा गरेका अभियानको कुल योगफल — कति अभियान सम्पन्न, कति सहभागी, कति श्रम-मिनेट। The running total of campaigns Shramdan members have completed together: events done, total participants, sites covered, labour-minutes spent.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/impact",
    languages: {
      "ne-NP": "/impact",
      "en-US": "/impact",
      "x-default": "/impact"
    }
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/impact`,
    siteName: BRAND,
    type: "website",
    locale: "ne_NP",
    alternateLocale: ["en_US"],
    images: [DEFAULT_OG_IMAGE]
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url]
  }
};

export default function ImpactLayout({ children }) {
  return children;
}
