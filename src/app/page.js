import HomeClient from "./HomeClient";
import { getRoadmapSummary } from "@/lib/roadmap";

export default function Page() {
  const summary = getRoadmapSummary();
  return <HomeClient summary={summary} />;
}
