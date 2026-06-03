"use client";

// /polls/[slug] — poll detail page (roadmap 14.3.2).

import { ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { SiteShell } from "@/components/SiteShell";
import { PollCard } from "@/components/PollCard";
import { usePreferences } from "@/app/providers";
import { getDemoPollBySlug } from "@/lib/devMockData";

const COPY = {
  np: {
    pageTitle: "मतदान",
    backToPolls: "सबै मतदान",
    notFoundTitle: "मतदान भेटिएन",
    notFoundBody: "तपाईंले खोज्नुभएको मतदान अहिले उपलब्ध छैन।"
  },
  en: {
    pageTitle: "Poll",
    backToPolls: "All polls",
    notFoundTitle: "Poll not found",
    notFoundBody: "The poll you requested is not available."
  }
};

export default function PollDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;

  const poll = useMemo(() => getDemoPollBySlug(slug), [slug]);

  if (!poll) {
    return (
      <SiteShell pageTitle={t.notFoundTitle}>
        <section className="poll-detail page-section">
          <Link href="/polls" className="poll-detail-back">
            <ArrowLeftOutlined aria-hidden="true" /> {t.backToPolls}
          </Link>
          <h1>{t.notFoundTitle}</h1>
          <p>{t.notFoundBody}</p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell pageTitle={poll.titleNp}>
      <section className="poll-detail page-section">
        <Link href="/polls" className="poll-detail-back">
          <ArrowLeftOutlined aria-hidden="true" /> {t.backToPolls}
        </Link>
        <PollCard poll={poll} language={language} showDetailCta={false} />
      </section>
    </SiteShell>
  );
}
