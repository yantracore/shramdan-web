import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "श्रमदानको कार्यक्षेत्र | What Shramdan can do",
  description:
    "श्रमदान के-कस्ता सामुदायिक काममा प्रयोग हुनसक्छ — सरसफाइ, वृक्षारोपण, ट्रेल मर्मत, सौन्दर्यीकरण लगायत आठ कार्यक्षेत्र। The full range of citizen-led community work Shramdan can power — cleanups, afforestation, trail repair, beautification, and more.",
  path: "/event-types"
});

export default function EventTypesLayout({ children }) {
  return children;
}
