import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "श्रमदानको कार्य-दायरा | What Shramdan can do",
  description:
    "श्रमदान कुन-कुन सामुदायिक काममा प्रयोग हुनसक्छ — सरसफाइ, वृक्षारोपण, ट्रेल मर्मत, सौन्दर्यीकरण लगायत आठ कार्य-प्रकार। The full range of citizen-led community work Shramdan can power — cleanups, afforestation, trail repair, beautification, and more.",
  path: "/event-types"
});

export default function EventTypesLayout({ children }) {
  return children;
}
