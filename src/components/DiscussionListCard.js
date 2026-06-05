"use client";

// Phase 7 v0 — compact card for a discussion topic in the /discussions list
// (and in any future "discussions on this event" affordance).
//
// Anonymous topics render with the "अज्ञात सदस्य" / "Anonymous member"
// placeholder; clicking the author chip does NOT navigate (anonymous
// posts have no public profile page by design).

import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  CommentOutlined,
  LikeFilled,
  TagOutlined
} from "@ant-design/icons";
import Link from "next/link";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function formatRelative(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 60) {
    if (language === "np") return `${localizeDigits(Math.max(1, diffMin), "np")} मि. अघि`;
    return `${Math.max(1, diffMin)}m ago`;
  }
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) {
    if (language === "np") return `${localizeDigits(diffHr, "np")} घन्टा अघि`;
    return `${diffHr}h ago`;
  }
  const diffDay = Math.round(diffHr / 24);
  if (language === "np") return `${localizeDigits(diffDay, "np")} दिन अघि`;
  return `${diffDay}d ago`;
}

function formatTokenized(template, n, language) {
  if (!template) return "";
  return template.replace("{n}", localizeDigits(n, language));
}

export function DiscussionListCard({ topic, language = "np", copy }) {
  const t = copy ?? {};
  const isProposal = topic.kind === "FEATURE_PROPOSAL";
  const isAnonymous = !!topic.anonymous || topic.authorDisplay?.anonymous;
  const authorName = isAnonymous
    ? (t.anonymousAuthor || (language === "np" ? "अज्ञात सदस्य" : "Anonymous member"))
    : (topic.authorDisplay?.name || topic.authorDisplay?.displayName);
  const authorAvatar = !isAnonymous ? topic.authorDisplay?.avatarUrl : null;
  const authorSlug = !isAnonymous ? topic.authorDisplay?.slug : null;

  const promotionBadge = (() => {
    if (!isProposal) return null;
    if (topic.proposalStatus === "PROMOTED") return { kind: "promoted", label: t.promotionPromoted };
    if (topic.proposalStatus === "DECLINED") return { kind: "declined", label: t.promotionDeclined };
    if (topic.promotionEligible) return { kind: "eligible", label: t.promotionEligible };
    if (topic.votesUntilThreshold && topic.votesUntilThreshold > 0)
      return { kind: "near", label: formatTokenized(t.votesUntilThreshold, topic.votesUntilThreshold, language) };
    return null;
  })();

  return (
    <article className={`discussion-card discussion-card--${topic.kind?.toLowerCase().replace(/_/g, "-")}`}>
      <Link href={`/discussions/${topic.slug ?? topic.id}`} className="discussion-card-link" aria-label={topic.title}>
        <header className="discussion-card-header">
          <span className={`discussion-card-kind discussion-card-kind--${topic.kind?.toLowerCase().replace(/_/g, "-")}`}>
            <TagOutlined aria-hidden="true" />
            {isProposal
              ? (language === "np" ? "फिचर अनुरोध" : "Feature proposal")
              : (language === "np" ? "छलफल" : "Discussion")}
          </span>
          {promotionBadge ? (
            <span className={`discussion-card-promotion discussion-card-promotion--${promotionBadge.kind}`}>
              {promotionBadge.label}
            </span>
          ) : null}
        </header>

        <h3 className="discussion-card-title">{topic.title}</h3>
        <p className="discussion-card-body">{topic.body}</p>

        {topic.linkedEntity ? (
          <div className="discussion-card-linked">
            <span className="discussion-card-linked-label">
              {topic.linkedEntity.kind === "event" ? (t.linkedEvent || "Linked event:") : (t.linkedIssue || "Linked issue:")}
            </span>
            <span className="discussion-card-linked-title">{topic.linkedEntity.title}</span>
          </div>
        ) : null}

        <footer className="discussion-card-footer">
          <div className="discussion-card-author">
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatar} alt="" className="discussion-card-author-avatar" loading="lazy" />
            ) : (
              <span className="discussion-card-author-avatar discussion-card-author-avatar--anon" aria-hidden="true">
                ?
              </span>
            )}
            {authorSlug ? (
              <Link
                href={`/members/${authorSlug}`}
                className="discussion-card-author-name"
                onClick={(e) => e.stopPropagation()}
              >
                {authorName}
              </Link>
            ) : (
              <span className="discussion-card-author-name">{authorName}</span>
            )}
          </div>
          <div className="discussion-card-stats">
            <span><LikeFilled aria-hidden="true" /> {localizeDigits(topic.upvoteCount ?? 0, language)}</span>
            <span><CommentOutlined aria-hidden="true" /> {localizeDigits(topic.messageCount ?? 0, language)}</span>
            <span><ClockCircleOutlined aria-hidden="true" /> {formatRelative(topic.lastActivityAt, language)}</span>
          </div>
          <span className="discussion-card-cta" aria-hidden="true">
            {language === "np" ? "विवरण" : "View"}
            <ArrowRightOutlined aria-hidden="true" />
          </span>
        </footer>
      </Link>
    </article>
  );
}

export default DiscussionListCard;
