import HomeSearchView from "@/components/HomeSearchView";
import { getRoadmapSummary } from "@/lib/roadmap";

export default function Page() {
  const summary = getRoadmapSummary();
  return <HomeSearchView overallPercent={summary?.overallPercent ?? null} />;
}
