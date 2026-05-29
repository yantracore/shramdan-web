import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "उपयोग शर्तहरू | Terms of Use",
  description:
    "श्रमदान प्लेटफर्म प्रयोगका शर्त र मार्गनिर्देशन। The terms and conditions for using the Shramdan platform.",
  path: "/terms"
});

export default function TermsLayout({ children }) {
  return children;
}
