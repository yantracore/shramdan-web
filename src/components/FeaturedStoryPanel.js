"use client";

// FeaturedStoryPanel — picks one past demo event and renders it as a
// cinematic story card on the homepage: cover image + headline + a
// pulled testimonial quote + a result one-liner + a "read the full
// story" CTA into /events/[id]. Position: between the live rail and the
// event-types grid so the cold-load page has an immediate "see what we
// did" pulse.

import { ArrowRightOutlined, TrophyOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useMemo } from "react";
import { getDemoPastEvents } from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    eyebrow: "तपाईंलाई थाहै नहोला",
    cta: "पूरा कथा पढ्नुहोस्",
    participants: "सहभागी"
  },
  en: {
    eyebrow: "You may have missed",
    cta: "Read the full story",
    participants: "participants"
  }
};

function pickFeatured() {
  const all = getDemoPastEvents();
  if (all.length === 0) return null;
  // Highest-participant past event — usually the most photogenic.
  return [...all].sort(
    (a, b) => (b.participantCount || 0) - (a.participantCount || 0)
  )[0];
}

export function FeaturedStoryPanel({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const event = useMemo(() => pickFeatured(), []);
  if (!event) return null;

  const quote = event.testimonials?.[0];

  return (
    <section
      className="featured-story-section"
      aria-labelledby="featured-story-title"
    >
      <article className="featured-story-card">
        <div
          className="featured-story-cover"
          style={{ backgroundImage: `url(${event.thumbnailUrl || ""})` }}
          aria-hidden="true"
        />
        <div className="featured-story-body">
          <span className="featured-story-eyebrow">
            <TrophyOutlined aria-hidden="true" /> {t.eyebrow}
          </span>
          <h2 id="featured-story-title">{event.title}</h2>
          {event.resultSummary ? (
            <p className="featured-story-result">{event.resultSummary}</p>
          ) : null}
          {quote ? (
            <blockquote className="featured-story-quote">
              <p>{quote.quote}</p>
              <footer>
                — <strong>{quote.name}</strong>
                {quote.role ? `, ${quote.role}` : ""}
              </footer>
            </blockquote>
          ) : null}
          <div className="featured-story-meta">
            {event.addressText ? <span>{event.addressText}</span> : null}
            {Number.isFinite(event.participantCount) ? (
              <span>
                · {localizeDigits(event.participantCount, language)} {t.participants}
              </span>
            ) : null}
          </div>
          <Link
            className="featured-story-cta"
            href={`/events/${event.id}`}
          >
            {t.cta} <ArrowRightOutlined />
          </Link>
        </div>
      </article>
    </section>
  );
}
