import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin · Shramdan Control Center",
  description: "Internal Shramdan admin control center. Not for public indexing.",
  path: "/admin",
  noindex: true
});

export default function AdminLayout({ children }) {
  return children;
}
