"use client";

// Compact discussion teaser shown inside EventPreviewPane (events split
// view). Pulls the same data layer the full /events/[id] comment
// section uses, but renders only the headline figure (count) + the
// single most recent non-deleted comment as a quote-snippet. Acts as a
// hook into the conversation without taking the user off the list.

import { ArrowRightOutlined, MessageOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchComments } from "@/lib/commentsApi";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    eyebrow: "छलफल",
    countOne: "टिप्पणी",
    countMany: "टिप्पणी",
    empty: "अहिलेसम्म कुनै टिप्पणी छैन — पहिलो तपाईं हुनुहोस्।",
    latestBy: "ताजा",
    openAll: "सबै हेर्ने",
    minutesAgo: "{n} मि. अघि",
    hoursAgo: "{n} घण्टा अघि",
    daysAgo: "{n} दिन अघि",
    justNow: "भर्खर"
  },
  en: {
    eyebrow: "Discussion",
    countOne: "comment",
    countMany: "comments",
    empty: "No comments yet — be the first.",
    latestBy: "Latest",
    openAll: "Open all",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    daysAgo: "{n} d ago",
    justNow: "just now"
  }
};

function relativeTime(iso, t, language) {
  if (!iso) return "";
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 60_000) return t.justNow;
  const min = Math.floor(ms / 60_000);
  if (min < 60) return t.minutesAgo.replace("{n}", localizeDigits(min, language));
  const hr = Math.floor(min / 60);
  if (hr < 24) return t.hoursAgo.replace("{n}", localizeDigits(hr, language));
  const days = Math.floor(hr / 24);
  return t.daysAgo.replace("{n}", localizeDigits(days, language));
}

function truncate(text, max) {
  const safe = String(text || "").replace(/\s+/g, " ").trim();
  if (safe.length <= max) return safe;
  return `${safe.slice(0, max - 1).trimEnd()}…`;
}

// Shared comments-summary used by both event and issue preview panes.
// `targetType` discriminates the localStorage bucket and the detail-page
// anchor; everything else is language-driven copy.
export function CommentsSummary({
  targetType,
  targetId,
  language = "np",
  detailHref
}) {
  const t = COPY[language] || COPY.np;
  const [hydrated, setHydrated] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!targetId || !targetType) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchComments({ targetType, targetId, limit: 100 });
        if (!cancelled) setComments(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setComments([]);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  const { count, latest } = useMemo(() => {
    const visible = comments.filter((c) => !c.deleted);
    if (!visible.length) return { count: 0, latest: null };
    const recent = [...visible].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];
    return { count: visible.length, latest: recent || null };
  }, [comments]);

  if (!targetId || !targetType) return null;
  if (!hydrated) return null;

  const noun = count === 1 ? t.countOne : t.countMany;
  const href =
    detailHref ||
    `/${targetType === "issue" ? "issues" : "events"}/${targetId}#comment-section-title`;

  return (
    <section className="event-preview-comments" aria-label={t.eyebrow}>
      <Link href={href} className="event-preview-comments-link">
        <header className="event-preview-comments-header">
          <span className="event-preview-comments-icon" aria-hidden="true">
            <MessageOutlined />
          </span>
          <strong className="event-preview-comments-count">
            {localizeDigits(count, language)} {noun}
          </strong>
          <span className="event-preview-comments-open">
            {t.openAll} <ArrowRightOutlined aria-hidden="true" />
          </span>
        </header>

        {count === 0 ? (
          <p className="event-preview-comments-empty">{t.empty}</p>
        ) : latest ? (
          <p className="event-preview-comments-latest">
            <span className="event-preview-comments-latest-meta">
              {t.latestBy} · <strong>{latest.author?.name || "—"}</strong>
              {" · "}
              {relativeTime(latest.createdAt, t, language)}
            </span>
            <span className="event-preview-comments-latest-text">
              “{truncate(latest.text, 140)}”
            </span>
          </p>
        ) : null}
      </Link>
    </section>
  );
}

export function EventCommentsSummary({ eventId, language = "np" }) {
  return (
    <CommentsSummary
      targetType="event"
      targetId={eventId}
      language={language}
    />
  );
}
