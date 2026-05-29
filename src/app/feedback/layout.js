import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "प्रतिक्रिया | Feedback",
  description:
    "श्रमदानको बारेमा सुझाव, समस्या, प्रश्न वा सामान्य प्रतिक्रिया हामीसँग बाँड्नुहोस्। Share suggestions, bug reports, questions or general feedback to help shape Shramdan.",
  path: "/feedback"
});

export default function FeedbackLayout({ children }) {
  return children;
}
