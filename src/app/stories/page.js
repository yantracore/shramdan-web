"use client";

// /stories — long-form narrative cards stitched together from demo past
// events. Each card pulls cover image + headline + result + first two
// testimonials + addressText + completedAt. Full-bleed alternating
// left/right cover orientation for visual rhythm. Linked back into the
// event detail for the "read more" branch.

import {
  ArrowRightOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getDemoStories } from "@/lib/devMockData";
import { listPastEvents } from "@/lib/eventsApi";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(v, lang) {
  const s = String(v ?? "");
  return lang === "np" ? s.replace(/\d/g, (d) => NP_DIGITS[Number(d)]) : s;
}

const COPY = {
  np: {
    pageTitle: "श्रमदानका कथाहरू",
    eyebrow: "अभियानका कथा",
    title: "हाम्रो हातले के परिवर्तन गर्‍यो",
    intro:
      "हरेक श्रमदान अभियानको एउटा-एउटा कथा — स्थान, सहभागी, र समुदायको आवाजमार्फत।",
    participants: "सहभागी",
    readMore: "पूरा कथा हेर्ने",
    empty: "अहिले कुनै कथा प्रकाशित भएको छैन।",
    featuredEyebrow: "फिचर्ड कथा",
    featuredHeading: "सम्पादकको छनोट",
    featuredCta: "पढ्ने"
  },
  en: {
    pageTitle: "Shramdan stories",
    eyebrow: "Campaign stories",
    title: "What our hands have changed",
    intro:
      "A story for every Shramdan campaign — told through place, people, and the community's voice.",
    participants: "participants",
    readMore: "Read the full story",
    empty: "No stories published yet.",
    featuredEyebrow: "Featured",
    featuredHeading: "Editor's picks",
    featuredCta: "Read"
  }
};

function formatDate(iso, language) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export default function StoriesPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const [past, setPast] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await listPastEvents({ language });
        if (!cancelled) setPast(items);
      } catch {
        if (!cancelled) setPast([]);
      }
    })();
    return () => { cancelled = true; };
  }, [language]);
  const featuredStories = useMemo(() => getDemoStories().slice(0, 3), []);

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="stories-section page-section">
        <header className="stories-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        {featuredStories.length > 0 ? (
          <section className="stories-featured" aria-labelledby="stories-featured-title">
            <header className="stories-featured-header">
              <span className="eyebrow">{t.featuredEyebrow}</span>
              <h2 id="stories-featured-title">{t.featuredHeading}</h2>
            </header>
            <ul className="stories-featured-list">
              {featuredStories.map((story) => (
                <li key={story.slug} className="stories-featured-card">
                  <Link href={`/stories/${story.slug}`}>
                    <h3>{story.title}</h3>
                    <p>{story.excerpt}</p>
                    <span className="stories-featured-cta">
                      {t.featuredCta} <ArrowRightOutlined aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {past.length === 0 ? (
          <p className="stories-empty">{t.empty}</p>
        ) : (
          <ol className="stories-list">
            {past.map((event, i) => (
              <li
                key={event.id}
                className={`story-card${i % 2 === 1 ? " is-flipped" : ""}`}
              >
                <div
                  className="story-cover"
                  style={{ backgroundImage: `url(${event.thumbnailUrl || ""})` }}
                  aria-hidden="true"
                />
                <div className="story-body">
                  <h2>{event.title}</h2>
                  <div className="story-meta">
                    {event.addressText ? (
                      <span>
                        <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
                      </span>
                    ) : null}
                    {event.completedAt ? (
                      <span>
                        <CalendarOutlined aria-hidden="true" />{" "}
                        {formatDate(event.completedAt, language)}
                      </span>
                    ) : null}
                    {Number.isFinite(event.participantCount) ? (
                      <span>
                        <TeamOutlined aria-hidden="true" />{" "}
                        {localizeDigits(event.participantCount, language)}{" "}
                        {t.participants}
                      </span>
                    ) : null}
                  </div>
                  {event.resultSummary ? (
                    <p className="story-result">{event.resultSummary}</p>
                  ) : null}
                  {event.testimonials?.slice(0, 2).map((q, qi) => (
                    <blockquote key={qi} className="story-quote">
                      <p>{q.quote}</p>
                      <footer>
                        — <strong>{q.name}</strong>
                        {q.role ? `, ${q.role}` : ""}
                      </footer>
                    </blockquote>
                  ))}
                  <Link className="story-cta" href={`/events/${event.slug ?? event.id}`}>
                    {t.readMore} <ArrowRightOutlined />
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </SiteShell>
  );
}
