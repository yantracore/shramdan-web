"use client";

// Custom 404 — branded, bilingual, with three exit lanes. Hit any time
// Next.js can't match a route or a server component throws notFound().

import Link from "next/link";
import { ArrowRightOutlined, HomeOutlined } from "@ant-design/icons";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

const COPY = {
  np: {
    pageTitle: "पृष्ठ भेटिएन",
    eyebrow: "४०४",
    title: "यो पृष्ठ भेटिएन।",
    body: "लिङ्क पुरानो हुनसक्छ, टाइप त्रुटि भएको हुनसक्छ, वा पृष्ठ हटाइएको हुनसक्छ। तलका लिङ्कबाट अघि बढ्नुहोस्।",
    home: "गृहपृष्ठमा फर्किनुहोस्",
    issues: "समस्याहरू हेर्नुहोस्",
    events: "अभियानहरू हेर्नुहोस्"
  },
  en: {
    pageTitle: "Page not found",
    eyebrow: "404",
    title: "We couldn't find that page.",
    body: "The link may be outdated, mistyped, or the page may have been removed. Try one of the routes below.",
    home: "Return home",
    issues: "Browse issues",
    events: "Browse campaigns"
  }
};

export default function NotFoundPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="not-found-section">
        <span className="not-found-eyebrow">{t.eyebrow}</span>
        <h1 className="not-found-title">{t.title}</h1>
        <p className="not-found-body">{t.body}</p>
        <div className="not-found-actions">
          <Link className="not-found-action not-found-action-primary" href="/">
            <HomeOutlined aria-hidden="true" />
            <span>{t.home}</span>
          </Link>
          <Link className="not-found-action" href="/issues">
            <span>{t.issues}</span>
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
          <Link className="not-found-action" href="/events">
            <span>{t.events}</span>
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
