"use client";

// /stories/[slug] — prose narrative detail (roadmap 7.2).
// Reads DEMO_STORIES via getDemoStoryBySlug. Long-form layout with
// reading-friendly typography. Links back to the source event when
// available.

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { useMemo } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getDemoEventById, getDemoStoryBySlug } from "@/lib/devMockData";

function formatDate(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

const COPY = {
  np: {
    backToStories: "सबै कथाहरू",
    eventLink: "सम्बन्धित अभियान हेर्नुहोस्",
    notFoundTitle: "कथा भेटिएन",
    notFoundBody: "तपाईंले खोज्नुभएको कथा अहिले उपलब्ध छैन।"
  },
  en: {
    backToStories: "All stories",
    eventLink: "View the source campaign",
    notFoundTitle: "Story not found",
    notFoundBody: "The story you requested is not available."
  }
};

export default function StoryDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;

  const story = useMemo(() => getDemoStoryBySlug(slug), [slug]);
  const linkedEvent = useMemo(
    () => (story?.coverEvent ? getDemoEventById(story.coverEvent) : null),
    [story?.coverEvent]
  );

  if (!story) {
    return (
      <SiteShell pageTitle={t.notFoundTitle}>
        <section className="story-detail page-section">
          <Link href="/stories" className="story-detail-back">
            <ArrowLeftOutlined aria-hidden="true" /> {t.backToStories}
          </Link>
          <h1>{t.notFoundTitle}</h1>
          <p>{t.notFoundBody}</p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell pageTitle={story.title}>
      <article className="story-detail page-section">
        <Link href="/stories" className="story-detail-back">
          <ArrowLeftOutlined aria-hidden="true" /> {t.backToStories}
        </Link>

        <header className="story-detail-header">
          <h1>{story.title}</h1>
          <div className="story-detail-meta">
            <span>
              <UserOutlined aria-hidden="true" /> {story.author}
            </span>
            <span>
              <CalendarOutlined aria-hidden="true" />{" "}
              {formatDate(story.publishedAt, language)}
            </span>
          </div>
        </header>

        <div className="story-detail-body">
          {story.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {linkedEvent ? (
          <aside className="story-detail-source">
            <Link href={`/events/${linkedEvent.slug ?? linkedEvent.id}`}>
              <Button type="primary" icon={<ArrowRightOutlined />}>
                {t.eventLink}
              </Button>
            </Link>
          </aside>
        ) : null}
      </article>
    </SiteShell>
  );
}
