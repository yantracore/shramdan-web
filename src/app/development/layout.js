import { BRAND, SITE_URL } from "@/lib/seo";

const TITLE = "विकास प्रगति | Build in Public";
const DESCRIPTION =
  "श्रमदान वेबसाइट कसरी बनिँदै छ — फेज, सम्पन्न र चलिरहेका काम सबै सार्वजनिक। What we've built, what we're building, what's next — all in public.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/development",
    languages: {
      "ne-NP": "/development",
      "en-US": "/development",
      "x-default": "/development"
    }
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/development`,
    siteName: BRAND,
    type: "website",
    locale: "ne_NP",
    alternateLocale: ["en_US"]
  },
  robots: {
    index: process.env.NEXT_PUBLIC_SHOW_DEVELOPMENT === "true",
    follow: process.env.NEXT_PUBLIC_SHOW_DEVELOPMENT === "true"
  }
};

export default function DevelopmentLayout({ children }) {
  return children;
}
