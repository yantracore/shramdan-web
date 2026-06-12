"use client";

// Phase 7 v1 — /discussions/[slug] detail. Enabled composer + vote + anonymity
// utilizing gracefully-degrading API client fallback to demo-mode stub helpers.

import {
  ArrowLeftOutlined,
  CommentOutlined,
  EnvironmentOutlined,
  LikeOutlined,
  LikeFilled,
  ThunderboltFilled
} from "@ant-design/icons";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Button } from "antd";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { getDiscussionTopicBySlug } from "@/lib/discussionsStub";
import { apiCastVote, apiWithdrawVote, apiPostMessage } from "@/lib/discussionsApi";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

export default function DiscussionDetailPage({ params }) {
  const { slug } = use(params);
  const { language } = usePreferences();
  const t = (copy[language] && copy[language].discussions) || copy.np.discussions;
  const [topic, setTopic] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const [upvoteCount, setUpvoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [localMessageCount, setLocalMessageCount] = useState(0);
  const [replyBody, setReplyBody] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [localReplies, setLocalReplies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await getDiscussionTopicBySlug(slug);
        if (cancelled) return;
        setTopic(row);
        setUpvoteCount(row.upvoteCount ?? 0);
        setLocalMessageCount(row.messageCount ?? 0);
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
    const isDemoId = true;
    try {
      if (hasVoted) {
        await apiWithdrawVote(topic.slug ?? topic.id, { isDemoId });
        setUpvoteCount((n) => Math.max(0, n - 1));
        setHasVoted(false);
      } else {
        await apiCastVote(topic.slug ?? topic.id, { isDemoId });
        setUpvoteCount((n) => n + 1);
        setHasVoted(true);
      }
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  const handleReply = async () => {
    if (!replyBody.trim() || !topic) return;
    setReplySubmitting(true);
    try {
      const isDemoId = true;
      const newMsg = await apiPostMessage(
        topic.slug ?? topic.id,
        { body: replyBody.trim(), anonymous: replyAnonymous },
        { isDemoId }
      );
      setReplyBody("");
      setReplyAnonymous(false);
      setLocalMessageCount((n) => n + 1);
      setLocalReplies((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error("Failed to reply:", err);
    } finally {
      setReplySubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <SiteShell pageTitle={t.pageTitle}>
        <section className="page-section discussion-detail-section" aria-busy="true" />
      </SiteShell>
    );
  }

  if (!topic) {
    return (
      <SiteShell pageTitle={t.pageTitle}>
        <section className="page-section discussion-detail-section">
          <p>{t.emptyMessage}</p>
          <Link href="/discussions">
            <Button icon={<ArrowLeftOutlined />}>{t.backToList}</Button>
          </Link>
        </section>
      </SiteShell>
    );
  }

  const isAnonymous = !!topic.anonymous || topic.authorDisplay?.anonymous;
  const authorName = isAnonymous
    ? (t.anonymousAuthor || (language === "np" ? "अज्ञात सदस्य" : "Anonymous member"))
    : (topic.authorDisplay?.name || topic.authorDisplay?.displayName);
  const authorAvatar = !isAnonymous ? topic.authorDisplay?.avatarUrl : null;
  const authorSlug = !isAnonymous ? topic.authorDisplay?.slug : null;
  const isProposal = topic.kind === "FEATURE_PROPOSAL";

  return (
    <SiteShell pageTitle={topic.title}>
      <section className="page-section discussion-detail-section">
        <Link href="/discussions" className="discussion-detail-back">
          <ArrowLeftOutlined aria-hidden="true" /> {t.backToList}
        </Link>

        <header className="discussion-detail-header">
          <div className="discussion-detail-kind-row">
            <span className={`discussion-card-kind discussion-card-kind--${topic.kind?.toLowerCase().replace(/_/g, "-")}`}>
              {isProposal ? <ThunderboltFilled aria-hidden="true" /> : <CommentOutlined aria-hidden="true" />}
              {isProposal ? (language === "np" ? "फिचर अनुरोध" : "Feature proposal") : (language === "np" ? "छलफल" : "Discussion")}
            </span>
            {isProposal && topic.proposalStatus === "PROMOTED" ? (
              <span className="discussion-card-promotion discussion-card-promotion--promoted">{t.promotionPromoted}</span>
            ) : null}
            {isProposal && topic.promotionEligible ? (
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

          <div className="discussion-detail-author">
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatar} alt="" className="discussion-detail-author-avatar" />
            ) : (
              <span className="discussion-detail-author-avatar discussion-detail-author-avatar--anon" aria-hidden="true">?</span>
            )}
            {authorSlug ? (
              <Link href={`/members/${authorSlug}`} className="discussion-detail-author-name">{authorName}</Link>
            ) : (
              <span className="discussion-detail-author-name">{authorName}</span>
            )}
          </div>

          <div className="discussion-detail-stats">
            <span>
              {hasVoted ? <LikeFilled aria-hidden="true" /> : <LikeOutlined aria-hidden="true" />}{" "}
              {localizeDigits(upvoteCount, language)}
            </span>
            <span>
              <CommentOutlined aria-hidden="true" /> {localizeDigits(localMessageCount, language)}
            </span>
            <Button
              type={hasVoted ? "primary" : "default"}
              icon={hasVoted ? <LikeFilled /> : <LikeOutlined />}
              title={t.upvote}
              onClick={handleVote}
            >
              {t.upvote}
            </Button>
          </div>
        </header>

        <article className="discussion-detail-body">
          <p>{topic.body}</p>
        </article>

        {isProposal && (topic.votesUntilThreshold > 0 || topic.supportersUntilThreshold > 0) ? (
          <aside className="discussion-detail-threshold">
            {topic.votesUntilThreshold > 0 ? (
              <p>{t.votesUntilThreshold?.replace("{n}", localizeDigits(topic.votesUntilThreshold, language))}</p>
            ) : null}
            {topic.supportersUntilThreshold > 0 ? (
              <p>{t.supportersUntilThreshold?.replace("{n}", localizeDigits(topic.supportersUntilThreshold, language))}</p>
            ) : null}
          </aside>
        ) : null}

        <section className="discussion-detail-replies" aria-label={t.sections?.recentActivity || "Replies"}>
          <h2>{language === "np" ? "जवाफहरू" : "Replies"}</h2>

          {localReplies.length > 0 ? (
            <ul className="discussion-local-replies">
              {localReplies.map((reply) => {
                const replyAuthorName = reply.anonymous
                  ? (t.anonymousAuthor || (language === "np" ? "अज्ञात सदस्य" : "Anonymous member"))
                  : (language === "np" ? "तपाईं" : "You");
                return (
                  <li key={reply.id} className="discussion-local-reply">
                    <div className="discussion-local-reply-author">{replyAuthorName}</div>
                    <div className="discussion-local-reply-body">{reply.body}</div>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <p className="discussion-detail-replies-empty">
            {language === "np"
              ? "जवाफ list backend तयार भएपछि देखाइनेछ।"
              : "Replies appear here once the backend is live."}
          </p>

          <div className="discussion-detail-composer">
            <textarea
              className="discussion-detail-composer-input"
              placeholder={t.replyComposerPlaceholder}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={3}
            />
            <div className="discussion-detail-composer-anon">
              <label className="discussions-anon-label">
                <input
                  type="checkbox"
                  checked={replyAnonymous}
                  onChange={(e) => setReplyAnonymous(e.target.checked)}
                />
                <span>
                  {language === "np" ? "अज्ञात रूपमा पठाउनुहोस्" : "Reply anonymously"}
                </span>
              </label>
            </div>
            <Button
              type="primary"
              loading={replySubmitting}
              disabled={!replyBody.trim()}
              onClick={handleReply}
            >
              {t.composerCta}
            </Button>
          </div>
        </section>
      </section>
    </SiteShell>
  );
}
