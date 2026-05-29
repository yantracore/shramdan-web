import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "समस्याहरू | Issues",
  description:
    "स्थानीय समस्या, समुदायको साथ। नेपालभरका सार्वजनिक समस्याहरू हेर्नुहोस्, भोट गर्नुहोस् र अभियानमा सहभागी हुनुहोस्। Browse, vote on and join citizen-reported issues across Nepal — local problems, community-powered.",
  path: "/issues"
});

export default function IssuesLayout({ children }) {
  return children;
}
