import { Suspense } from "react";
import { redirect } from "next/navigation";
import CampaignsListClient from "./CampaignsListClient";
import { campaignStatusToSlug } from "@/lib/campaignStatus";

// The bare index renders the "All" section. It also keeps the OLD query-based
// URLs alive: a `?status=<STATUS>` link (bookmarks, the pre-path-routing
// internal links, anything shared before the move) is redirected once to its
// canonical `/campaigns/<slug>` path, carrying the rest of the query along.
export default async function CampaignsListPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const legacyStatus = Array.isArray(sp.status) ? sp.status[0] : sp.status;

  if (legacyStatus && legacyStatus !== "all") {
    const slug = campaignStatusToSlug(legacyStatus);
    if (slug) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(sp)) {
        if (key === "status" || value == null) continue;
        if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
        else params.set(key, value);
      }
      const query = params.toString();
      redirect(query ? `/campaigns/${slug}?${query}` : `/campaigns/${slug}`);
    }
  }

  return (
    <Suspense fallback={null}>
      <CampaignsListClient status="all" />
    </Suspense>
  );
}
