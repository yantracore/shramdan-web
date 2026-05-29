import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "जोडिनुहोस् | Join Shramdan",
  description:
    "आफ्नो सीप, समय र ऊर्जा प्रयोग गरेर श्रमदान निर्माणमा साथ दिनुहोस् — डेभलपर, डिजाइनर, QA, समुदाय अगुवा र थप भूमिकामा योगदान गर्नुहोस्। Join Shramdan as a contributor — engineering, design, QA, community leadership and more.",
  path: "/join"
});

export default function JoinLayout({ children }) {
  return children;
}
