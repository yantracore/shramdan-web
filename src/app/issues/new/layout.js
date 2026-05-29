import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "नयाँ समस्या रिपोर्ट गर्नुहोस् | Report a New Issue",
  description:
    "तपाईंको टोल, सडक वा सार्वजनिक स्थानको समस्या श्रमदानमा रिपोर्ट गर्नुहोस् — समुदायले मिलेर समाधानतर्फ काम गर्नेछ। Report a community issue from your neighbourhood — Shramdan helps citizens coordinate the fix.",
  path: "/issues/new"
});

export default function NewIssueLayout({ children }) {
  return children;
}
