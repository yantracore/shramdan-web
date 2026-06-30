import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import CampaignsListClient from "../CampaignsListClient";
import { buildMetadata, BRAND } from "@/lib/seo";
import {
  campaignSlugToStatus,
  campaignStatusToSlug,
  campaignStatusLabel
} from "@/lib/campaignStatus";

// ONE optional-catch-all segment serves the whole surface:
//   /campaigns                 -> All
//   /campaigns/<slug>          -> a single stage (open|planning|scheduled|ongoing|complete)
// Folding both into a single route (rather than page.js + [status]/page.js)
// keeps the SAME component mounted across a status switch — React preserves the
// tree, so the page chrome (heading, chips, toolbar) no longer unmounts and
// blinks; only the list body refetches. An unknown / nested slug 404s.

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
  const { status } = await params;
  const slug = status?.[0];
  if (!slug) {
    return buildMetadata({
      title: "अभियानहरू · Campaigns",
      description: `समस्या उठेदेखि सम्पन्न अभियानसम्म — सबै एकै ठाउँमा। ${BRAND}.`,
      path: "/campaigns"
    });
  }
  const resolved = campaignSlugToStatus(slug);
  if (!resolved) return buildMetadata({ noindex: true });
  const labelNp = campaignStatusLabel(resolved, "np");
  const labelEn = campaignStatusLabel(resolved, "en");
  return buildMetadata({
    title: `${labelNp} अभियानहरू · ${labelEn} Campaigns`,
    description: `${STATUS_DESCRIPTION[resolved]} ${BRAND}.`,
    path: `/campaigns/${slug}`
  });
}

export default async function CampaignsPage({ params, searchParams }) {
  const { status } = await params;

  // Bare index (/campaigns) → "All". It also keeps OLD query-based URLs alive:
  // a `?status=<STATUS>` link (bookmarks, pre-path-routing internal links) is
  // redirected once to its canonical `/campaigns/<slug>`, carrying the rest of
  // the query.
  if (!status || status.length === 0) {
    const sp = (await searchParams) || {};
    const legacy = Array.isArray(sp.status) ? sp.status[0] : sp.status;
    if (legacy && legacy !== "all") {
      const slug = campaignStatusToSlug(legacy);
      if (slug) {
        const params2 = new URLSearchParams();
        for (const [key, value] of Object.entries(sp)) {
          if (key === "status" || value == null) continue;
          if (Array.isArray(value)) value.forEach((v) => params2.append(key, v));
          else params2.set(key, value);
        }
        const query = params2.toString();
        redirect(query ? `/campaigns/${slug}?${query}` : `/campaigns/${slug}`);
      }
    }
    return (
      <Suspense fallback={null}>
        <CampaignsListClient status="all" />
      </Suspense>
    );
  }

  // A stage path — exactly one valid slug segment, else 404.
  if (status.length > 1) notFound();
  const resolved = campaignSlugToStatus(status[0]);
  if (!resolved) notFound();

  return (
    <Suspense fallback={null}>
      <CampaignsListClient status={resolved} />
    </Suspense>
  );
}
