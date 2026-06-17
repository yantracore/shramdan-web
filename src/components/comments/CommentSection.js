"use client";

import { MessageOutlined } from "@ant-design/icons";
import { Segmented } from "antd";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { CommentFlagModal } from "@/components/comments/CommentFlagModal";
import { CommentSkeleton } from "@/components/comments/CommentSkeleton";
import { CommentThread } from "@/components/comments/CommentThread";
import {
  applyLocalOverlay,
  buildTree,
  countVisible,
  flagComment,
  sortTopLevel,
  toggleReactionOverlay,
  togglePin,
  viewerFlagged
} from "@/lib/comments";
import {
  addReactionRemote,
  createComment,
  deleteCommentRemote,
  fetchComments,
  removeReactionRemote,
  reportCommentRemote,
  updateComment
} from "@/lib/commentsApi";
import { getAuthSession, isAdminUser, subscribeAuthSession } from "@/lib/authSession";
import { useToast } from "@/lib/toast";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    headingIssue: "छलफल",
    headingEvent: "टिप्पणी र समन्वय",
    introIssue: "स्थानीयहरूको साझा र समाधानमा हात बढाउन तत्पर सदस्यहरूको आवाज।",
    introEvent: "सहभागीहरूको आपसी समन्वय — प्रश्न, सुझाव, र भेटको योजना।",
    countLabel: "टिप्पणी",
    emptyTitle: "पहिलो टिप्पणी तपाईंको होस्",
    emptyBody: "तपाईंको विचारले छलफल सुरु गर्न मद्दत गर्छ।",
    emptyMineTitle: "तपाईंको कुनै टिप्पणी छैन",
    emptyMineBody: "जब तपाईं टिप्पणी वा जवाफ राख्नुहुन्छ, यहाँ देखिने छन्।",
    successPosted: "टिप्पणी पठाइयो।",
    successReplied: "जवाफ पठाइयो।",
    successEdited: "टिप्पणी अद्यावधिक भयो।",
    successDeleted: "टिप्पणी मेटाइयो।",
    successPinned: "टिप्पणी पिन गरियो।",
    successUnpinned: "पिन हटाइयो।",
    successFlagged: "रिपोर्ट दर्ता भयो।",
    errorGeneric: "केही गडबड भयो। फेरि कोसिस गर्नुहोस्।",
    sortLabel: "क्रम",
    sortTop: "लोकप्रिय",
    sortNewest: "नयाँ",
    sortMine: "मेरा"
  },
  en: {
    headingIssue: "Discussion",
    headingEvent: "Comments & Coordination",
    introIssue: "Voices from people on the ground and members ready to help.",
    introEvent: "Coordination among participants — questions, suggestions, and meetup plans.",
    countLabel: "comments",
    emptyTitle: "Be the first to comment",
    emptyBody: "Your thought helps start the conversation.",
    emptyMineTitle: "You haven't commented yet",
    emptyMineBody: "Comments and replies you post will show up here.",
    successPosted: "Comment posted.",
    successReplied: "Reply posted.",
    successEdited: "Comment updated.",
    successDeleted: "Comment deleted.",
    successPinned: "Comment pinned.",
    successUnpinned: "Comment unpinned.",
    successFlagged: "Report received.",
    errorGeneric: "Something went wrong. Please try again.",
    sortLabel: "Sort",
    sortTop: "Top",
    sortNewest: "Newest",
    sortMine: "Mine"
  }
};

export function CommentSection({
  targetType,
  targetId,
  language = "np",
  // External mention pool from the parent page (event roster on
  // /events/[id], supporter chips on /issues/[id]). Names from comment
  // authors are merged in automatically below.
  mentionPool: externalMentionPool = []
}) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const pathname = usePathname();
  const session = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSession,
    () => null
  );
  const currentUser = session?.user || null;
  const isAuthenticated = Boolean(currentUser);

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [sortMode, setSortMode] = useState("top");
  const [flagTarget, setFlagTarget] = useState(null);
  const isAdmin = isAdminUser(currentUser);

  const reload = useCallback(async () => {
    if (!targetType || !targetId) return;
    try {
      const list = await fetchComments({
        targetType,
        targetId,
        limit: 200,
        requireAuth: isAuthenticated
      });
      setComments(applyLocalOverlay({ targetType, targetId, list }));
    } catch (error) {
      // Leave previous state in place so a transient error doesn't blank
      // out the conversation. The toast only fires on user-initiated
      // actions below; silent refresh failures are noise.
      console.warn("Comment fetch failed", error);
    }
  }, [targetType, targetId, isAuthenticated]);

  useEffect(() => {
    if (!targetType || !targetId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const list = await fetchComments({
          targetType,
          targetId,
          limit: 200,
          requireAuth: isAuthenticated
        });
        if (cancelled) return;
        setComments(applyLocalOverlay({ targetType, targetId, list }));
      } catch {
        if (!cancelled) setComments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId, isAuthenticated]);

  const tree = useMemo(() => buildTree(comments), [comments]);
  const effectiveSort = !isAuthenticated && sortMode === "mine" ? "top" : sortMode;
  const sortedTopLevel = useMemo(
    () => sortTopLevel(tree, effectiveSort, currentUser?.id),
    [tree, effectiveSort, currentUser?.id]
  );
  const visibleCount = useMemo(() => countVisible(comments), [comments]);

  const mentionPool = useMemo(() => {
    const seen = new Set();
    const out = [];
    const push = (entry) => {
      if (!entry?.name) return;
      const key = entry.name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ id: entry.id || entry.name, name: entry.name, role: entry.role || null });
    };
    externalMentionPool.forEach(push);
    for (const c of comments) {
      if (c.deleted) continue;
      push({ id: c.author?.id, name: c.author?.name, role: c.author?.role });
    }
    return out.sort((a, b) => b.name.length - a.name.length);
  }, [externalMentionPool, comments]);

  const handleSubmitTop = useCallback(
    async (text) => {
      if (!currentUser) return;
      try {
        await createComment({
          targetType,
          targetId,
          parentId: null,
          text
        });
        await reload();
        messageApi.success(t.successPosted);
      } catch (error) {
        messageApi.error(error?.message || t.errorGeneric);
      }
    },
    [currentUser, targetType, targetId, reload, messageApi, t]
  );

  const handleStartReply = useCallback(
    (comment) => {
      if (!isAuthenticated) return;
      setEditingId(null);
      setReplyingTo(comment.id);
    },
    [isAuthenticated]
  );

  const handleCancelReply = useCallback(() => setReplyingTo(null), []);

  const handleSubmitReply = useCallback(
    async (text) => {
      if (!currentUser || !replyingTo) return;
      try {
        await createComment({
          targetType,
          targetId,
          parentId: replyingTo,
          text
        });
        setReplyingTo(null);
        await reload();
        messageApi.success(t.successReplied);
      } catch (error) {
        messageApi.error(error?.message || t.errorGeneric);
      }
    },
    [currentUser, replyingTo, targetType, targetId, reload, messageApi, t]
  );

  const handleStartEdit = useCallback((comment) => {
    setReplyingTo(null);
    setEditingId(comment.id);
  }, []);

  const handleCancelEdit = useCallback(() => setEditingId(null), []);

  const handleSubmitEdit = useCallback(
    async (text) => {
      if (!currentUser || !editingId) return;
      try {
        await updateComment({ id: editingId, text });
        setEditingId(null);
        await reload();
        messageApi.success(t.successEdited);
      } catch (error) {
        messageApi.error(error?.message || t.errorGeneric);
      }
    },
    [currentUser, editingId, reload, messageApi, t]
  );

  const handleDelete = useCallback(
    async (comment) => {
      if (!currentUser) return;
      try {
        await deleteCommentRemote({ id: comment.id });
        await reload();
        messageApi.success(t.successDeleted);
      } catch (error) {
        messageApi.error(error?.message || t.errorGeneric);
      }
    },
    [currentUser, reload, messageApi, t]
  );

  const handleTogglePin = useCallback(
    (comment) => {
      if (!isAdmin || !comment?.id) return;
      const result = togglePin({
        targetType,
        targetId,
        commentId: comment.id
      });
      if (result === null) {
        messageApi.error(t.errorGeneric);
        return;
      }
      // togglePin only touches localStorage — re-apply the overlay so
      // the pinned chip flips without re-fetching from the backend.
      setComments((prev) => applyLocalOverlay({ targetType, targetId, list: prev }));
      messageApi.success(result ? t.successPinned : t.successUnpinned);
    },
    [isAdmin, targetType, targetId, messageApi, t]
  );

  const handleStartFlag = useCallback(
    (comment) => {
      if (!currentUser?.id || !comment?.id) return;
      setFlagTarget(comment);
    },
    [currentUser]
  );

  const handleSubmitFlag = useCallback(
    async ({ reason, note }) => {
      if (!currentUser?.id || !flagTarget?.id) return;
      const commentId = flagTarget.id;
      // Send the real moderation report. 409 means the backend already has a
      // report from this viewer — treat it as success and fall through to the
      // local overlay so the button still flips to "Reported".
      try {
        await reportCommentRemote({ id: commentId, reason, details: note || undefined });
      } catch (error) {
        if (error?.status !== 409) {
          messageApi.error(error?.message || t.errorGeneric);
          return;
        }
      }
      // Local overlay carries the viewer-flagged state + auto-hide threshold
      // (the backend doesn't echo a per-viewer "reported" flag yet).
      flagComment({
        targetType,
        targetId,
        commentId,
        reason,
        note,
        userId: currentUser.id
      });
      setFlagTarget(null);
      setComments((prev) => applyLocalOverlay({ targetType, targetId, list: prev }));
      messageApi.success(t.successFlagged);
    },
    [currentUser, flagTarget, targetType, targetId, messageApi, t]
  );

  const viewerFlags = useMemo(() => {
    if (!currentUser?.id) return new Set();
    const out = new Set();
    for (const c of comments) {
      if (viewerFlagged({
        targetType,
        targetId,
        commentId: c.id,
        userId: currentUser.id
      })) {
        out.add(c.id);
      }
    }
    return out;
  }, [comments, currentUser, targetType, targetId]);

  const handleToggleReaction = useCallback(
    async (comment, emoji) => {
      if (!currentUser || !comment?.id || !emoji) return;
      // Flip the local overlay immediately so the chip's pressed
      // state updates without waiting for the network round-trip.
      // applyLocalOverlay re-runs against the existing list so the
      // aggregate count reflects the optimistic toggle too.
      const nowPicked = toggleReactionOverlay({
        targetType,
        targetId,
        commentId: comment.id,
        emoji
      });
      if (nowPicked === null) return;
      setComments((prev) => applyLocalOverlay({ targetType, targetId, list: prev }));

      try {
        if (nowPicked) {
          await addReactionRemote({ id: comment.id, emoji });
        } else {
          await removeReactionRemote({ id: comment.id, emoji });
        }
        // Refresh from backend so the aggregate count converges with
        // truth (other users' reactions, server-side rate-limiting,
        // etc.). The local overlay is reapplied inside reload().
        await reload();
      } catch (error) {
        // Revert the optimistic overlay flip on failure.
        toggleReactionOverlay({
          targetType,
          targetId,
          commentId: comment.id,
          emoji
        });
        setComments((prev) => applyLocalOverlay({ targetType, targetId, list: prev }));
        messageApi.error(error?.message || t.errorGeneric);
      }
    },
    [currentUser, targetType, targetId, reload, messageApi, t]
  );

  if (!targetType || !targetId) return null;

  const heading = targetType === "event" ? t.headingEvent : t.headingIssue;
  const intro = targetType === "event" ? t.introEvent : t.introIssue;

  return (
    <section className="comment-section" aria-labelledby="comment-section-title">
      <header className="comment-section-header">
        <MessageOutlined aria-hidden="true" />
        <h2 id="comment-section-title">{heading}</h2>
        <span className="comment-section-count">
          {localizeDigits(visibleCount, language)} {t.countLabel}
        </span>
      </header>
      <p className="comment-section-intro">{intro}</p>

      <CommentComposer
        mode="top"
        language={language}
        isAuthenticated={isAuthenticated}
        loginRedirect={pathname || "/"}
        onSubmit={handleSubmitTop}
        mentionPool={mentionPool}
      />

      {tree.length > 0 ? (
        <div className="comment-section-sort" role="group" aria-label={t.sortLabel}>
          <Segmented
            value={effectiveSort}
            onChange={setSortMode}
            options={[
              { label: t.sortTop, value: "top" },
              { label: t.sortNewest, value: "newest" },
              ...(isAuthenticated ? [{ label: t.sortMine, value: "mine" }] : [])
            ]}
            size="small"
          />
        </div>
      ) : null}

      {loading ? (
        <CommentSkeleton rows={3} />
      ) : tree.length === 0 ? (
        <div className="comment-empty">
          <strong>{t.emptyTitle}</strong>
          <p>{t.emptyBody}</p>
        </div>
      ) : sortedTopLevel.length === 0 ? (
        <div className="comment-empty">
          <strong>{t.emptyMineTitle}</strong>
          <p>{t.emptyMineBody}</p>
        </div>
      ) : (
        <CommentThread
          nodes={sortedTopLevel}
          depth={0}
          language={language}
          currentUser={currentUser}
          isAdmin={isAdmin}
          viewerFlags={viewerFlags}
          replyingTo={replyingTo}
          editingId={editingId}
          mentionPool={mentionPool}
          onStartReply={handleStartReply}
          onCancelReply={handleCancelReply}
          onSubmitReply={handleSubmitReply}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onSubmitEdit={handleSubmitEdit}
          onDelete={handleDelete}
          onToggleReaction={handleToggleReaction}
          onTogglePin={handleTogglePin}
          onStartFlag={handleStartFlag}
        />
      )}

      <CommentFlagModal
        open={Boolean(flagTarget)}
        language={language}
        onCancel={() => setFlagTarget(null)}
        onSubmit={handleSubmitFlag}
      />
    </section>
  );
}
