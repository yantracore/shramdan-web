"use client";

// Phase 7 — /discussions/[slug] detail.
//
// 2026-06-16 makeover: two-column layout with a sticky "support card"
// sidebar (big vote, threshold-to-roadmap meter, share) and a real reply
// thread (seed messages from the stub + optimistic local replies). Writes
// gracefully degrade to demo-mode stub helpers until the backend ships.

import {
  ArrowLeftOutlined,
  CaretUpFilled,
  CaretUpOutlined,
  CheckOutlined,
  CommentOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  LikeFilled,
  LikeOutlined,
  RocketFilled,
  ShareAltOutlined,
  ThunderboltFilled
} from "@ant-design/icons";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { getDiscussionTopicBySlug, listDiscussionMessages } from "@/lib/discussionsStub";
import { apiCastVote, apiWithdrawVote, apiPostMessage } from "@/lib/discussionsApi";

const THRESHOLD_VOTES = 20;
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
  if (diffMin < 1) return language === "np" ? "भर्खरै" : "just now";
  if (diffMin < 60) {
    if (language === "np") return `${localizeDigits(diffMin, "np")} मि. अघि`;
    return `${diffMin}m ago`;
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

function CommentLike({ initial = 0, language }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initial);
  return (
    <button
      type="button"
      className={`discussion-comment-like${liked ? " is-liked" : ""}`}
      onClick={() => {
        setLiked((v) => !v);
        setCount((n) => (liked ? n - 1 : n + 1));
      }}
      aria-pressed={liked}
    >
      {liked ? <LikeFilled aria-hidden="true" /> : <LikeOutlined aria-hidden="true" />}
      {localizeDigits(count, language)}
    </button>
  );
}

function Comment({ comment, language }) {
  const np = language === "np";
  const isAnon = comment.anonymous || comment.authorDisplay?.anonymous;
  const name = comment.mine
    ? (np ? "तपाईं" : "You")
    : isAnon
      ? (np ? "अज्ञात सदस्य" : "Anonymous member")
      : comment.authorDisplay?.name || comment.authorDisplay?.displayName;
  const avatar = !isAnon && !comment.mine ? comment.authorDisplay?.avatarUrl : null;
  const slug = !isAnon && !comment.mine ? comment.authorDisplay?.slug : null;

  return (
    <li className={`discussion-comment${comment.mine ? " discussion-comment--mine" : ""}`}>
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="discussion-comment-avatar" loading="lazy" />
      ) : (
        <span className="discussion-comment-avatar" aria-hidden="true">
          {isAnon || comment.mine ? "?" : (name?.[0] ?? "?")}
        </span>
      )}
      <div className="discussion-comment-body">
        <div className="discussion-comment-meta">
          {slug ? (
            <Link href={`/members/${slug}`} className="discussion-comment-author discussion-comment-author--link">
              {name}
            </Link>
          ) : (
            <span className="discussion-comment-author">{name}</span>
          )}
          {comment.createdAt ? (
            <span className="discussion-comment-when">{formatRelative(comment.createdAt, language)}</span>
          ) : null}
        </div>
        <p className="discussion-comment-text">{comment.body}</p>
        <div className="discussion-comment-foot">
          <CommentLike initial={comment.upvoteCount ?? 0} language={language} />
        </div>
      </div>
    </li>
  );
}

export default function DiscussionDetailPage({ params }) {
  const { slug } = use(params);
  const { language } = usePreferences();
  const np = language === "np";
  const t = (copy[language] && copy[language].discussions) || copy.np.discussions;
  const [topic, setTopic] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const [upvoteCount, setUpvoteCount] = useState(0);
  const [supporterCount, setSupporterCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [votePulse, setVotePulse] = useState(0);
  const [seedReplies, setSeedReplies] = useState([]);
  const [localReplies, setLocalReplies] = useState([]);
  const [replyBody, setReplyBody] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await getDiscussionTopicBySlug(slug);
        if (cancelled) return;
        setTopic(row);
        setUpvoteCount(row?.upvoteCount ?? 0);
        setSupporterCount(row?.distinctSupporters ?? 0);
        if (row) {
          const msgs = await listDiscussionMessages(row.slug ?? row.id);
          if (!cancelled) setSeedReplies(msgs.items ?? []);
        }
      } catch {
        if (cancelled) return;
        setTopic(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleVote = async () => {
    if (!topic) return;
    const key = topic.slug ?? topic.id;
    if (hasVoted) {
      setHasVoted(false);
      setUpvoteCount((n) => Math.max(0, n - 1));
      setSupporterCount((n) => Math.max(0, n - 1));
      try { await apiWithdrawVote(key, { isDemoId: true }); } catch (err) { console.error(err); }
    } else {
      setHasVoted(true);
      setUpvoteCount((n) => n + 1);
      setSupporterCount((n) => n + 1);
      setVotePulse((p) => p + 1);
      try { await apiCastVote(key, { isDemoId: true }); } catch (err) { console.error(err); }
    }
  };

  const handleReply = async () => {
    if (!replyBody.trim() || !topic) return;
    setReplySubmitting(true);
    try {
      const newMsg = await apiPostMessage(
        topic.slug ?? topic.id,
        { body: replyBody.trim(), anonymous: replyAnonymous },
        { isDemoId: true }
      );
      setLocalReplies((prev) => [
        ...prev,
        { ...newMsg, mine: true, createdAt: new Date().toISOString(), upvoteCount: 0 }
      ]);
      setReplyBody("");
      setReplyAnonymous(false);
    } catch (err) {
      console.error("Failed to reply:", err);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // ignore
    }
  };

  const replies = useMemo(() => [...seedReplies, ...localReplies], [seedReplies, localReplies]);
  const replyCount = replies.length;

  if (!loaded) {
    return (
      <SiteShell pageTitle={t.pageTitle}>
        <section className="page-section discussion-detail-section">
          <ul className="discussions-skeleton" aria-hidden="true">
            <li className="discussion-skel" style={{ height: 160 }} />
            <li className="discussion-skel" style={{ height: 120 }} />
          </ul>
        </section>
      </SiteShell>
    );
  }

  if (!topic) {
    return (
      <SiteShell pageTitle={t.pageTitle}>
        <section className="page-section discussion-detail-section">
          <div className="discussions-empty" role="status">
            <span className="discussions-empty-icon" aria-hidden="true"><CommentOutlined /></span>
            <p>{t.emptyMessage}</p>
            <Link href="/discussions">
              <Button icon={<ArrowLeftOutlined />}>{t.backToList}</Button>
            </Link>
          </div>
        </section>
      </SiteShell>
    );
  }

  const isAnonymous = !!topic.anonymous || topic.authorDisplay?.anonymous;
  const authorName = isAnonymous
    ? (t.anonymousAuthor || (np ? "अज्ञात सदस्य" : "Anonymous member"))
    : (topic.authorDisplay?.name || topic.authorDisplay?.displayName);
  const authorAvatar = !isAnonymous ? topic.authorDisplay?.avatarUrl : null;
  const authorSlug = !isAnonymous ? topic.authorDisplay?.slug : null;
  const isProposal = topic.kind === "FEATURE_PROPOSAL";
  const isPromoted = topic.proposalStatus === "PROMOTED";
  const isEligible = !!topic.promotionEligible;
  const meterPct = Math.min(100, Math.round((upvoteCount / THRESHOLD_VOTES) * 100));
  const meterMod = isPromoted ? "promoted" : isEligible || meterPct >= 100 ? "eligible" : "";
  const showMeter = isProposal && !isPromoted;

  return (
    <SiteShell pageTitle={topic.title}>
      <section className="page-section discussion-detail-section">
        <Link href="/discussions" className="discussion-detail-back">
          <ArrowLeftOutlined aria-hidden="true" /> {t.backToList}
        </Link>

        <div className="discussion-detail-grid">
          <div className="discussion-detail-main">
            <header className="discussion-detail-header">
              <div className="discussion-detail-kind-row">
                <span className={`discussion-card-kind discussion-card-kind--${topic.kind?.toLowerCase().replace(/_/g, "-")}`}>
                  {isProposal ? <ThunderboltFilled aria-hidden="true" /> : <CommentOutlined aria-hidden="true" />}
                  {isProposal ? (np ? "फिचर अनुरोध" : "Feature proposal") : (np ? "छलफल" : "Discussion")}
                </span>
                {isPromoted ? (
                  <span className="discussion-card-promotion discussion-card-promotion--promoted">{t.promotionPromoted}</span>
                ) : isEligible ? (
                  <span className="discussion-card-promotion discussion-card-promotion--eligible">{t.promotionEligible}</span>
                ) : null}
              </div>

              <h1 className="discussion-detail-title">{topic.title}</h1>

              {topic.linkedEntity ? (
                <div className="discussion-detail-linked">
                  <EnvironmentOutlined aria-hidden="true" />
                  <span>{topic.linkedEntity.kind === "event" ? t.linkedEvent : t.linkedIssue}</span>
                  <Link href={`/${topic.linkedEntity.kind === "event" ? "events" : "issues"}/${topic.linkedEntity.slug ?? topic.linkedEntity.id}`}>
                    {topic.linkedEntity.title}
                  </Link>
                </div>
              ) : null}

              <div className="discussion-detail-byline">
                <div className="discussion-detail-author">
                  {authorAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={authorAvatar} alt="" className="discussion-detail-author-avatar" />
                  ) : (
                    <span className="discussion-detail-author-avatar" aria-hidden="true">?</span>
                  )}
                  {authorSlug ? (
                    <Link href={`/members/${authorSlug}`} className="discussion-detail-author-name">{authorName}</Link>
                  ) : (
                    <span className="discussion-detail-author-name">{authorName}</span>
                  )}
                </div>
                <span className="discussion-detail-byline-dot">{formatRelative(topic.createdAt, language)}</span>
                <span className="discussion-detail-byline-dot">
                  {localizeDigits(replyCount, language)} {np ? "जवाफ" : replyCount === 1 ? "reply" : "replies"}
                </span>
              </div>
            </header>

            {isPromoted ? (
              <div className="discussion-detail-promoted">
                <RocketFilled aria-hidden="true" />
                <div>
                  <strong>{np ? "यो अनुरोध रोडम्यापमा सारियो 🎉" : "This proposal made the roadmap 🎉"}</strong>
                  {topic.promotedRoadmapAnchor ? (
                    <a href={`/development${topic.promotedRoadmapAnchor}`}>
                      {np ? "रोडम्यापमा हेर्ने" : "See it on the roadmap"}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            <article className="discussion-detail-body">
              <p>{topic.body}</p>
            </article>

            <section className="discussion-detail-replies" aria-label={np ? "जवाफहरू" : "Replies"}>
              <div className="discussion-detail-replies-head">
                <h2>{np ? "जवाफहरू" : "Replies"}</h2>
                <span className="discussion-detail-replies-count">{localizeDigits(replyCount, language)}</span>
              </div>

              <div className="discussion-detail-composer">
                <textarea
                  className="discussion-detail-composer-input"
                  placeholder={t.replyComposerPlaceholder}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={3}
                />
                <div className="discussion-detail-composer-foot">
                  <label className="discussions-anon-label">
                    <input
                      type="checkbox"
                      checked={replyAnonymous}
                      onChange={(e) => setReplyAnonymous(e.target.checked)}
                    />
                    <span>{np ? "अज्ञात रूपमा पठाउने" : "Reply anonymously"}</span>
                  </label>
                  <Button
                    type="primary"
                    loading={replySubmitting}
                    disabled={!replyBody.trim()}
                    onClick={handleReply}
                  >
                    {t.composerCta}
                  </Button>
                </div>
              </div>

              {replyCount > 0 ? (
                <ul className="discussion-thread">
                  {replies.map((reply) => (
                    <Comment key={reply.id} comment={reply} language={language} />
                  ))}
                </ul>
              ) : (
                <p className="discussions-result-meta">
                  {np ? "अहिले कुनै जवाफ छैन — पहिलो जवाफ तपाईंकै होस्।" : "No replies yet — be the first to weigh in."}
                </p>
              )}
            </section>
          </div>

          <aside className="discussion-detail-aside">
            <div className="discussion-support-card">
              <div className="discussion-support-metrics">
                <div className="discussion-support-metric">
                  <strong>
                    <span key={votePulse} className={votePulse > 0 ? "vote-tickup" : undefined}>
                      {localizeDigits(upvoteCount, language)}
                    </span>
                  </strong>
                  <span>{np ? "समर्थन" : "Votes"}</span>
                </div>
                <div className="discussion-support-metric">
                  <strong>{localizeDigits(supporterCount, language)}</strong>
                  <span>{np ? "समर्थक" : "Supporters"}</span>
                </div>
              </div>

              <Button
                className="discussion-support-vote"
                type={hasVoted ? "primary" : "default"}
                block
                icon={hasVoted ? <CaretUpFilled /> : <CaretUpOutlined />}
                onClick={handleVote}
              >
                {hasVoted ? (t.upvoted || (np ? "समर्थन गरिएको" : "Supported")) : (t.upvote || (np ? "समर्थन गर्ने" : "Support"))}
              </Button>

              {showMeter ? (
                <div className={`threshold-meter${meterMod ? ` threshold-meter--${meterMod}` : ""}`}>
                  <div className="threshold-meter-head">
                    <strong>{localizeDigits(upvoteCount, language)} / {localizeDigits(THRESHOLD_VOTES, language)}</strong>
                    <span>{np ? "रोडम्यापसम्म" : "to roadmap"}</span>
                  </div>
                  <div className="threshold-meter-track">
                    <span className="threshold-meter-fill" style={{ width: `${meterPct}%` }} />
                  </div>
                  <p className="threshold-meter-caption">
                    {meterPct >= 100 || isEligible
                      ? (np ? "दहलीजमा पुग्यो — प्रवर्द्धनको प्रतीक्षामा।" : "Threshold reached — awaiting promotion.")
                      : topic.votesUntilThreshold > 0
                        ? (t.votesUntilThreshold?.replace("{n}", localizeDigits(topic.votesUntilThreshold, language)))
                        : (np ? "समर्थन बढ्दै।" : "Support is building.")}
                  </p>
                </div>
              ) : null}

              <div className="discussion-support-divider" />

              <div className="discussion-support-actions">
                <Button
                  icon={copied ? <CheckOutlined /> : <ShareAltOutlined />}
                  onClick={handleShare}
                  block
                >
                  {copied ? (np ? "लिङ्क कपी भयो" : "Link copied") : (np ? "साझा गर्ने" : "Share")}
                </Button>
              </div>

              {isProposal && !isPromoted ? (
                <div className="discussion-support-note">
                  <InfoCircleOutlined aria-hidden="true" />
                  <span>
                    {np
                      ? `${localizeDigits(THRESHOLD_VOTES, language)} समर्थन पुगेपछि यो अनुरोध रोडम्यापमा जान योग्य हुन्छ।`
                      : `Once this reaches ${THRESHOLD_VOTES} votes it becomes eligible for the roadmap.`}
                  </span>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}
