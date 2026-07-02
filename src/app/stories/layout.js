import { BRAND, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo";

const TITLE = "कथाहरू | Stories";
const DESCRIPTION =
  "श्रमदान अभियानहरूको कथा — जो श्रमदान गरे, तिनका शब्दमा। Stories from the campaigns — in the words of those who showed up.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/stories",
    languages: {
      "ne-NP": "/stories",
      "en-US": "/stories",
      "x-default": "/stories"
    }
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/stories`,
    siteName: BRAND,
    type: "website",
    locale: "ne_NP",
    alternateLocale: ["en_US"],
    images: [DEFAULT_OG_IMAGE]
  }
};

export default function StoriesLayout({ children }) {
  return children;
}
