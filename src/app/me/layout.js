import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "मेरो प्रोफाइल | My Profile",
  description:
    "तपाईंको श्रमदान प्रोफाइल — आफ्ना रिपोर्ट, भोट र अभियान सहभागिता हेर्नुहोस्। Your Shramdan profile — reports, votes and campaign activity.",
  path: "/me",
  noindex: true
});

export default function MeLayout({ children }) {
  return children;
}
