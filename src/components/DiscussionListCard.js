"use client";

// Compact card for a discussion topic in the /discussions list.
//
// Leads with a Canny/ProductBoard-style vote rail (support without opening
// the thread) and, for feature proposals, a live progress meter toward the
// roadmap-promotion threshold. The 2026-06-18 makeover adds a category chip
// (left-rail taxonomy) and moves all formatting to the shared
// components/discussions/discussionFormat.js module.
//
// Anonymous topics render with the "अज्ञात सदस्य" / "Anonymous member"
// placeholder; clicking the author chip does NOT navigate.

import {
  ArrowRightOutlined,
  CaretUpFilled,
  CaretUpOutlined,
  CommentOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useState } from "react";
import { apiCastVote, apiWithdrawVote } from "@/lib/discussionsApi";
import {
  THRESHOLD_VOTES,
  categoryMeta,
  formatRelative,
  localizeDigits
} from "@/components/discussions/discussionFormat";

export function DiscussionListCard({ topic, language = "np", copy }) {
  const t = copy ?? {};
  const np = language === "np";
  const isProposal = topic.kind === "FEATURE_PROPOSAL";
  const isAnonymous = !!topic.anonymous || topic.authorDisplay?.anonymous;
  const authorName = isAnonymous
    ? (t.anonymousAuthor || (np ? "अज्ञात सदस्य" : "Anonymous member"))
    : (topic.authorDisplay?.name || topic.authorDisplay?.displayName);
  const authorAvatar = !isAnonymous ? topic.authorDisplay?.avatarUrl : null;
  const authorSlug = !isAnonymous ? topic.authorDisplay?.slug : null;

  const [voteCount, setVoteCount] = useState(topic.upvoteCount ?? 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [pulse, setPulse] = useState(0);

  const handleVote = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const key = topic.slug ?? topic.id;
    if (hasVoted) {
      setHasVoted(false);
      setVoteCount((n) => Math.max(0, n - 1));
      try { await apiWithdrawVote(key, { isDemoId: true }); } catch {}
    } else {
      setHasVoted(true);
      setVoteCount((n) => n + 1);
      setPulse((p) => p + 1);
      try { await apiCastVote(key, { isDemoId: true }); } catch {}
    }
  };

  const isPromoted = topic.proposalStatus === "PROMOTED";
  const isDeclined = topic.proposalStatus === "DECLINED";
  const isEligible = !!topic.promotionEligible;
  const showMeter = isProposal && !isPromoted && !isDeclined;
  const meterPct = Math.min(100, Math.round((voteCount / THRESHOLD_VOTES) * 100));
  const meterMod = isEligible || meterPct >= 100 ? "eligible" : "";

  const cat = categoryMeta(topic.category);
  const catLabel = topic.category ? t.categories?.[topic.category] : null;

  const promotionBadge = (() => {
    if (!isProposal) return null;
    if (isPromoted) return { kind: "promoted", label: t.promotionPromoted };
    if (isDeclined) return { kind: "declined", label: t.promotionDeclined };
    if (isEligible) return { kind: "eligible", label: t.promotionEligible };
    return null;
  })();

  return (
    <article className={`discussion-card discussion-card--${topic.kind?.toLowerCase().replace(/_/g, "-")}`}>
      <button
        type="button"
        className={`discussion-vote-rail${hasVoted ? " is-voted" : ""}`}
        onClick={handleVote}
        aria-pressed={hasVoted}
        title={hasVoted ? (t.upvoted || (np ? "समर्थन गरिएको" : "Supported")) : (t.upvote || (np ? "समर्थन गर्ने" : "Support"))}
      >
        {hasVoted ? (
          <CaretUpFilled aria-hidden="true" className="discussion-vote-rail-arrow" />
        ) : (
          <CaretUpOutlined aria-hidden="true" className="discussion-vote-rail-arrow" />
        )}
        <span
          key={pulse}
          className={`discussion-vote-rail-count${pulse > 0 ? " vote-tickup" : ""}`}
        >
          {localizeDigits(voteCount, language)}
        </span>
        <span className="discussion-vote-rail-label">{np ? "समर्थन" : "Vote"}</span>
      </button>

      <div className="discussion-card-link">
        <header className="discussion-card-header">
          {catLabel ? (
            <span className="discussion-card-cat" style={{ "--cat-accent": cat?.accent || "var(--primary)" }}>
              <span className="discussion-card-cat-dot" aria-hidden="true" />
              {catLabel}
            </span>
          ) : null}
          <span className={`discussion-card-kind discussion-card-kind--${topic.kind?.toLowerCase().replace(/_/g, "-")}`}>
            {isProposal ? (np ? "फिचर अनुरोध" : "Feature proposal") : (np ? "छलफल" : "Discussion")}
          </span>
          {promotionBadge ? (
            <span className={`discussion-card-promotion discussion-card-promotion--${promotionBadge.kind}`}>
              {promotionBadge.label}
            </span>
          ) : null}
          <span className="discussion-card-when">
            <ClockCircleOutlined aria-hidden="true" /> {formatRelative(topic.lastActivityAt, language)}
          </span>
        </header>

        <h3 className="discussion-card-title">
          <Link
            href={`/discussions/${topic.slug ?? topic.id}`}
            className="discussion-card-title-link"
            aria-label={topic.title}
          >
            {topic.title}
          </Link>
        </h3>
        <p className="discussion-card-body">{topic.body}</p>

        {showMeter ? (
          <div className={`threshold-meter${meterMod ? ` threshold-meter--${meterMod}` : ""}`}>
            <div className="threshold-meter-head">
              <strong>
                {localizeDigits(voteCount, language)}<span style={{ fontWeight: 600 }}> / {localizeDigits(THRESHOLD_VOTES, language)}</span>
              </strong>
              <span>
                {meterPct >= 100 || isEligible
                  ? (np ? "रोडम्यापको दहलीजमा 🎯" : "At the roadmap threshold 🎯")
                  : (np ? "रोडम्यापसम्म" : "to the roadmap")}
              </span>
            </div>
            <div className="threshold-meter-track">
              <span className="threshold-meter-fill" style={{ width: `${meterPct}%` }} />
            </div>
          </div>
        ) : null}

        {topic.linkedEntity ? (
          <div className="discussion-card-linked">
            <EnvironmentOutlined aria-hidden="true" />
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
            <span><CommentOutlined aria-hidden="true" /> {localizeDigits(topic.messageCount ?? 0, language)}</span>
            <span className="discussion-card-cta">
              {np ? "खोल्ने" : "Open"}
              <ArrowRightOutlined aria-hidden="true" />
            </span>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default DiscussionListCard;
