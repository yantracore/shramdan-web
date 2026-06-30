"use client";

// Homepage discovery section: four intent-grouped campaign rails. Rails 2-4
// hide themselves (CampaignRail returns null) when their bucket is empty, so a
// thin DB never shows broken empty rails.

import { useHomeRails } from "@/lib/useHomeRails";
import CampaignRail from "@/components/CampaignRail";

const RAIL_COPY = {
  np: {
    near: { eyebrow: "तपाईंका लागि", title: "तपाईं नजिकैका अभियान", viewAll: "सबै हेर्ने", href: "/campaigns" },
    happening: { eyebrow: "सक्रिय", title: "अहिले र चाँडैका अभियान", viewAll: "सबै हेर्ने", href: "/campaigns?status=ACTIVE" },
    support: { eyebrow: "साथ चाहिएको", title: "साथ खोज्दै", viewAll: "सबै हेर्ने", href: "/campaigns?status=OPEN" },
    impact: { eyebrow: "प्रभाव", title: "भइसकेका काम", viewAll: "सबै हेर्ने", href: "/campaigns?status=COMPLETED" }
  },
  en: {
    near: { eyebrow: "In your area", title: "Campaigns Near You", viewAll: "View All", href: "/campaigns" },
    happening: { eyebrow: "Happening now", title: "Active Campaigns", viewAll: "View All", href: "/campaigns?status=ACTIVE" },
    support: { eyebrow: "Needs Your Support", title: "Open Issues", viewAll: "View All", href: "/campaigns?status=OPEN" },
    impact: { eyebrow: "Recently Completed", title: "Completed Events", viewAll: "View All", href: "/campaigns?status=COMPLETED" }
  }
};

export default function HomeDiscoveryRails({ language = "np", provinceId, districtId }) {
  const { near, happening, support, impact } = useHomeRails({
    language,
    provinceId,
    districtId
  });
  const c = RAIL_COPY[language] || RAIL_COPY.np;

  return (
    <div className="home-discovery-rails">
      <CampaignRail
        eyebrow={c.near.eyebrow}
        title={c.near.title}
        viewAllHref={c.near.href}
        viewAllLabel={c.near.viewAll}
        items={near}
        language={language}
      />
      <CampaignRail
        eyebrow={c.happening.eyebrow}
        title={c.happening.title}
        viewAllHref={c.happening.href}
        viewAllLabel={c.happening.viewAll}
        items={happening}
        language={language}
      />
      <CampaignRail
        eyebrow={c.support.eyebrow}
        title={c.support.title}
        viewAllHref={c.support.href}
        viewAllLabel={c.support.viewAll}
        items={support}
        language={language}
      />
      <CampaignRail
        eyebrow={c.impact.eyebrow}
        title={c.impact.title}
        viewAllHref={c.impact.href}
        viewAllLabel={c.impact.viewAll}
        items={impact}
        language={language}
      />
    </div>
  );
}
