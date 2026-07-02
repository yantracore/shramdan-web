import { BRAND, SITE_URL } from "@/lib/seo";

const TITLE = "खुला मतदान | Community polls";
const DESCRIPTION =
  "श्रमदान मञ्चको दिशा सम्बन्धी खुला छनोटहरूमा समुदायको मत। Open community votes on the platform's direction.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/polls",
    languages: {
      "ne-NP": "/polls",
      "en-US": "/polls",
      "x-default": "/polls"
    }
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/polls`,
    siteName: BRAND,
    type: "website",
    locale: "ne_NP",
    alternateLocale: ["en_US"]
  }
};

export default function PollsLayout({ children }) {
  return children;
}
