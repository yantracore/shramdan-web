import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "लगइन | Log in",
  description:
    "श्रमदान खाताबाट लगइन गरेर समस्या रिपोर्ट गर्नुहोस्, भोट गर्नुहोस् र अभियानमा सहभागी हुनुहोस्। Log in to your Shramdan account to report issues, vote and join campaigns.",
  path: "/login",
  noindex: true
});

export default function LoginLayout({ children }) {
  return children;
}
