import { BRAND, SITE_URL } from "@/lib/seo";

const TITLE = "श्रमदान सदस्य ड्यासबोर्ड | Shramdan Member Dashboard";
const DESCRIPTION =
  "तपाईंका अभियान, समस्या र योगदानको एकै ठाउँमा सारांश। Your campaigns, issues, and contributions in one place — the Shramdan member portal.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/app",
    languages: {
      "ne-NP": "/app",
      "en-US": "/app",
      "x-default": "/app"
    }
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/app`,
    siteName: BRAND,
    type: "website",
    locale: "ne_NP",
    alternateLocale: ["en_US"]
  },
  robots: {
    // Member surface — auth-gated content. Don't index by default.
    index: false,
    follow: false
  }
};

export default function AppLayout({ children }) {
  return children;
}
