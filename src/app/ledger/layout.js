import { BRAND, DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/seo";

const TITLE = "पारदर्शिता ल्याज | Transparency Ledger";
const DESCRIPTION =
  "हरेक रुपैयाँको प्रवाह सार्वजनिक — दान, खर्च, रसिद। Every rupee in, every rupee out — donations, expenses, receipts.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/ledger",
    languages: {
      "ne-NP": "/ledger",
      "en-US": "/ledger",
      "x-default": "/ledger"
    }
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/ledger`,
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

export default function LedgerLayout({ children }) {
  return children;
}
