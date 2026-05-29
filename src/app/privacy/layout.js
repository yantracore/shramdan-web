import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "गोपनीयता नीति | Privacy Policy",
  description:
    "श्रमदानले तपाईंको व्यक्तिगत जानकारी कसरी सङ्कलन, प्रयोग र सुरक्षित गर्छ। How Shramdan collects, uses and protects your personal information.",
  path: "/privacy"
});

export default function PrivacyLayout({ children }) {
  return children;
}
