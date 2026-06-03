import { notFound } from "next/navigation";
import Link from "next/link";
import { DevelopmentClient } from "./DevelopmentClient";
import { getRoadmapSummary, getRoadmapFullTree } from "@/lib/roadmap";
import { SiteShell } from "@/components/SiteShell";

// /development — public build-in-public page (roadmap 14.2).
// Server-renders the roadmap summary parsed from
// docs/ops/00-master-roadmap.md; client component handles the
// language switch + interactive collapse. Gated by
// NEXT_PUBLIC_SHOW_DEVELOPMENT to keep staging-only until the
// surface stabilises.

export default async function DevelopmentPage() {
  if (process.env.NEXT_PUBLIC_SHOW_DEVELOPMENT !== "true") {
    // Default behaviour: hide on production until the env flag is on.
    // Returning notFound() renders the standard 404 surface.
    notFound();
  }

  const summary = getRoadmapSummary();
  const tree = getRoadmapFullTree();

  return (
    <SiteShell pageTitle="विकास प्रगति · Build in public">
      <DevelopmentClient summary={summary} tree={tree} />
    </SiteShell>
  );
}
