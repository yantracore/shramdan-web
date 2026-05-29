import { Providers } from "./providers";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";
import {
  BRAND,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  SITE_URL
} from "@/lib/seo";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap"
});

const baloo2 = Baloo_2({
  subsets: ["devanagari", "latin"],
  variable: "--font-baloo-2",
  display: "swap"
});

const HOME_TITLE =
  "श्रमदान: हाम्रो श्रम, हाम्रो समाज, हाम्रो भविष्य। | Shramdan: Our labor, our society, our future.";
const HOME_DESCRIPTION =
  "देशका हरेक समस्या सरकारको प्रतीक्षा गरेर समाधान हुँदैन। हामी नागरिकहरू आफैं मिलेर सरसफाइ, मर्मत, वृक्षारोपण, टोल सुधार जस्ता आधारभूत काम अघि बढाउन सक्छौँ। श्रमदान त्यही सामूहिक जिम्मेवारीको सुरुवात हो। साना साना हातहरू मिलेर ठूला परिवर्तन सम्भव हुन्छ। आज हाम्रो श्रमदान, भोलि सुन्दर समाजको निर्माण।";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: `%s · ${BRAND}`
  },
  description: HOME_DESCRIPTION,
  applicationName: BRAND,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: "Shramdan" }],
  creator: "Shramdan",
  publisher: "Shramdan",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: {
    canonical: "/",
    languages: {
      "ne-NP": "/",
      "en-US": "/",
      "x-default": "/"
    }
  },
  openGraph: {
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: BRAND,
    type: "website",
    locale: "ne_NP",
    alternateLocale: ["en_US"],
    images: [DEFAULT_OG_IMAGE]
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url]
  },
  icons: {
    icon: [
      { url: "/branding/favicon/favicon.ico", sizes: "any" },
      { url: "/branding/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/branding/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" }
    ],
    apple: [{ url: "/branding/favicon/apple-touch-icon.png", sizes: "180x180" }]
  },
  manifest: "/branding/favicon/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#176b5c" },
    { media: "(prefers-color-scheme: dark)", color: "#0f4f44" }
  ],
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${baloo2.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
