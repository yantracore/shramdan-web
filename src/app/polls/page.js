"use client";

// /polls — community polls index (roadmap 14.3.2).

import { useMemo } from "react";
import { SiteShell } from "@/components/SiteShell";
import { PollCard } from "@/components/PollCard";
import { usePreferences } from "@/app/providers";
import { getDemoPolls } from "@/lib/devMockData";

const COPY = {
  np: {
    pageTitle: "समुदायिक मतदान",
    eyebrow: "खुला छनोटहरू",
    title: "श्रमदानको दिशा — तपाईंकै हातमा",
    intro:
      "मञ्चसँग जोडिएका खुला छनोटहरूमा तपाईंको मत राख्नुहोस्। हरेक मतले निर्णयलाई आकार दिन्छ।",
    emptyState: "अहिले कुनै खुला मतदान छैन।"
  },
  en: {
    pageTitle: "Community polls",
    eyebrow: "Open community votes",
    title: "Steer Shramdan — your vote",
    intro:
      "Cast your vote on open decisions about the platform. Every vote shapes a choice.",
    emptyState: "No open polls right now."
  }
};

export default function PollsIndexPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const polls = useMemo(() => getDemoPolls(), []);

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="polls-page page-section">
        <header className="polls-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        {polls.length === 0 ? (
          <p className="polls-empty">{t.emptyState}</p>
        ) : (
          <ul className="polls-list">
            {polls.map((poll) => (
              <li key={poll.slug} className="polls-list-item">
                <PollCard poll={poll} language={language} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
