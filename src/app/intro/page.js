import IntroClient from "./IntroClient";
import { getRoadmapSummary } from "@/lib/roadmap";

export default function Page() {
  const summary = getRoadmapSummary();
  return <IntroClient summary={summary} />;
}
