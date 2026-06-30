import { Suspense } from "react";
import { notFound } from "next/navigation";
import CampaignsListClient from "../CampaignsListClient";
import { buildMetadata, BRAND } from "@/lib/seo";
import {
  CAMPAIGN_STATUS_SLUGS,
  campaignSlugToStatus,
  campaignStatusLabel
} from "@/lib/campaignStatus";

// One static page per lifecycle stage: /campaigns/open, /campaigns/planning,
// /campaigns/scheduled, /campaigns/ongoing, /campaigns/complete. The slug maps
// to a backend status that the shared client renders; an unknown slug 404s.
// (The bare /campaigns index renders the "All" section — see ../page.js.)

export function generateStaticParams() {
  return Object.values(CAMPAIGN_STATUS_SLUGS).map((status) => ({ status }));
}

// SSR can't read the client's language preference, so metadata is single-locale
// (Nepali — the public site's primary audience); the page re-renders
// bilingually in-app.
const STATUS_DESCRIPTION = {
  OPEN: "समुदायले उठाएका खुला समस्याहरू — समर्थन जुटाउँदै, अभियान बन्ने पर्खाइमा।",
  DRAFT: "तयारीमा रहेका अभियानहरू — योजना बन्दै, मिति तय हुने क्रममा।",
  SCHEDULED: "मिति तय भइसकेका आउँदै गरेका श्रमदान अभियानहरू।",
  ACTIVE: "अहिले चलिरहेका श्रमदान अभियानहरू — लाइभ प्रसारणसहित।",
  COMPLETED: "सम्पन्न भएका अभियानहरू — परिणाम, तस्बिर र प्रभाव।"
};

export async function generateMetadata({ params }) {
  const { status: slug } = await params;
  const status = campaignSlugToStatus(slug);
  if (!status) return buildMetadata({ noindex: true });
  const labelNp = campaignStatusLabel(status, "np");
  const labelEn = campaignStatusLabel(status, "en");
  return buildMetadata({
    title: `${labelNp} अभियानहरू · ${labelEn} Campaigns`,
    description: `${STATUS_DESCRIPTION[status]} ${BRAND}.`,
    path: `/campaigns/${slug}`
  });
}

export default async function CampaignsStatusPage({ params }) {
  const { status: slug } = await params;
  const status = campaignSlugToStatus(slug);
  if (!status) notFound();

  return (
    <Suspense fallback={null}>
      <CampaignsListClient status={status} />
    </Suspense>
  );
}
