import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "आचारसंहिता | Code of Conduct",
  description:
    "श्रमदान समुदायको आचारसंहिता — सम्मान, सुरक्षा र सहकार्यका मूल आधार। The Shramdan community code of conduct — the basics of respect, safety and collaboration.",
  path: "/code-of-conduct"
});

export default function CodeOfConductLayout({ children }) {
  return children;
}
