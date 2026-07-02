"use client";

// Homepage discovery section: four intent-grouped campaign strips, fed by the
// curated shelves the parent fetched (one GET /campaigns/curated). Strips hide
// themselves (DiscoveryStrip returns null) when their bucket is empty, so a
// thin DB never shows broken empty strips.
//
// Shelf → strip composition (sizes fixed by the API):
//   near      = nearby                                  (≤12, server-ranked)
//   happening = ongoing + upcoming[:3] + planning[:3]   (6+3+3 = 12 Active/Upcoming)
//   support   = closestToThreshold + newest             (8+4 = 12 OPEN)
//   impact    = completed                               (≤6)
//
// `upcoming` is sliced client-side: the API returns up to 6 but the agreed
// happening mix is 6/3/3.
//
// The geolocation prompt fires once, the first time the strips scroll into
// view — the "signalled intent to browse" moment useGeolocation's docs call
// for. Granted → parent refetches curated with coords → `nearby` fills and the
// near strip appears. Denied/ignored → the strip simply stays hidden.

import { useEffect, useMemo, useRef } from "react";
import DiscoveryStrip from "@/components/DiscoveryStrip";

const RAIL_COPY = {
  np: {
    near: { eyebrow: "तपाईंको क्षेत्र वरपर", title: "नजिकैका अभियान", viewAll: "सबै हेर्ने", href: "/campaigns" },
    happening: { eyebrow: "अहिले हुँदै", title: "सक्रिय र आउँदै गरेका अभियान", viewAll: "सबै हेर्ने", href: "/campaigns" },
    support: { eyebrow: "साथ चाहिएको", title: "खुला अभियान", viewAll: "सबै हेर्ने", href: "/campaigns?status=OPEN" },
    impact: { eyebrow: "हालै सम्पन्न भएका", title: "सकिएका अभियान", viewAll: "सबै हेर्ने", href: "/campaigns?status=COMPLETED" }
  },
  en: {
    near: { eyebrow: "In your area", title: "Campaigns Near You", viewAll: "View All", href: "/campaigns" },
    happening: { eyebrow: "Happening now", title: "Active & Upcoming Campaigns", viewAll: "View All", href: "/campaigns" },
    support: { eyebrow: "Needs Your Support", title: "Open Issues", viewAll: "View All", href: "/campaigns?status=OPEN" },
    impact: { eyebrow: "Recently Completed", title: "Completed Events", viewAll: "View All", href: "/campaigns?status=COMPLETED" }
  }
};

const toStripItem = (it) => ({ entry: it, distanceKm: it.distanceKm ?? null });

export default function HomeDiscoveryRails({ language = "np", shelves, requestLocation }) {
  const c = RAIL_COPY[language] || RAIL_COPY.np;
  const rootRef = useRef(null);
  const askedRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!requestLocation || askedRef.current || !el) return undefined;
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (askedRef.current || !entries.some((entry) => entry.isIntersecting)) return;
        askedRef.current = true;
        observer.disconnect();
        requestLocation();
      },
      // Ask only once the strips are properly on screen, not on a 1px graze.
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [requestLocation]);

  const strips = useMemo(() => {
    const shelf = (key) => (Array.isArray(shelves?.[key]) ? shelves[key] : []);
    return {
      near: shelf("nearby").map(toStripItem),
      happening: [
        ...shelf("ongoing"),
        ...shelf("upcoming").slice(0, 3),
        ...shelf("planning").slice(0, 3)
      ].map(toStripItem),
      support: [...shelf("closestToThreshold"), ...shelf("newest")].map(toStripItem),
      impact: shelf("completed").map(toStripItem)
    };
  }, [shelves]);

  return (
    <div className="home-discovery-rails" ref={rootRef}>
      <DiscoveryStrip
        eyebrow={c.near.eyebrow}
        title={c.near.title}
        viewAllHref={c.near.href}
        viewAllLabel={c.near.viewAll}
        items={strips.near}
        language={language}
      />
      <DiscoveryStrip
        eyebrow={c.happening.eyebrow}
        title={c.happening.title}
        viewAllHref={c.happening.href}
        viewAllLabel={c.happening.viewAll}
        items={strips.happening}
        language={language}
      />
      <DiscoveryStrip
        eyebrow={c.support.eyebrow}
        title={c.support.title}
        viewAllHref={c.support.href}
        viewAllLabel={c.support.viewAll}
        items={strips.support}
        language={language}
      />
      <DiscoveryStrip
        eyebrow={c.impact.eyebrow}
        title={c.impact.title}
        viewAllHref={c.impact.href}
        viewAllLabel={c.impact.viewAll}
        items={strips.impact}
        language={language}
      />
    </div>
  );
}
