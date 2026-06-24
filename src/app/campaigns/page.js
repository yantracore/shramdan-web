import { Suspense } from "react";
import CampaignsListClient from "./CampaignsListClient";

export default function CampaignsListPage() {
  return (
    <Suspense fallback={null}>
      <CampaignsListClient />
    </Suspense>
  );
}
