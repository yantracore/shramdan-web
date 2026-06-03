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
  buildTree,
  countVisible,
  editComment,
  flagComment,
  loadComments,
  saveComment,
  softDeleteComment,
  sortTopLevel,
  toggleReaction,
  togglePin,
  viewerFlagged
} from "@/lib/comments";
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
  // Sort modes: "top" (reactions desc), "newest" (createdAt desc), "mine"
  // (filter to threads viewer participates in). "top" feels like the
  // best default for casual readers — it surfaces the conversations
  // already gaining traction.
  const [sortMode, setSortMode] = useState("top");
  const [flagTarget, setFlagTarget] = useState(null);
  const isAdmin = isAdminUser(currentUser);

  // Hydration — load on mount and on every target change. The
  // `setLoading(true)` on target change is intentional so the skeleton
  // re-shows during a target swap; same pattern as
  // [src/app/issues/[id]/page.js:151-154](src/app/issues/[id]/page.js#L151-L154).
  useEffect(() => {
    if (!targetType || !targetId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const handle = window.setTimeout(() => {
      setComments(loadComments({ targetType, targetId }));
      setLoading(false);
    }, 80);
    return () => window.clearTimeout(handle);
  }, [targetType, targetId]);

  // Memoized tree of top-level → children based on the flat list.
  const tree = useMemo(() => buildTree(comments), [comments]);
  // The "Mine" filter requires a logged-in viewer. If logged out while
  // "mine" is selected, fall back to "top" silently — surfacing an
  // empty thread list with a "log in" prompt would be confusing.
  const effectiveSort = !isAuthenticated && sortMode === "mine" ? "top" : sortMode;
  const sortedTopLevel = useMemo(
    () => sortTopLevel(tree, effectiveSort, currentUser?.id),
    [tree, effectiveSort, currentUser?.id]
  );
  const visibleCount = useMemo(() => countVisible(comments), [comments]);

  // Mention pool = external (roster/supporters) merged with distinct
  // comment-author names. Dedup by name (case-insensitive). The pool is
  // sorted longest-name-first so longest-prefix matching in the body
  // renderer chooses the most specific mention available.
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

  const reload = useCallback(() => {
    setComments(loadComments({ targetType, targetId }));
  }, [targetType, targetId]);

  const handleSubmitTop = useCallback(
    (text) => {
      if (!currentUser) return;
      const created = saveComment({
        targetType,
        targetId,
        parentId: null,
        parentDepth: -1,
        text,
        author: currentUser
      });
      if (created) {
        reload();
        messageApi.success(t.successPosted);
      } else {
        messageApi.error(t.errorGeneric);
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
    (text) => {
      if (!currentUser || !replyingTo) return;
      const parent = comments.find((c) => c.id === replyingTo);
      if (!parent) return;
      const created = saveComment({
        targetType,
        targetId,
        parentId: parent.id,
        parentDepth: parent.depth,
        text,
        author: currentUser
      });
      if (created) {
        setReplyingTo(null);
        reload();
        messageApi.success(t.successReplied);
      } else {
        messageApi.error(t.errorGeneric);
      }
    },
    [
      currentUser,
      replyingTo,
      comments,
      targetType,
      targetId,
      reload,
      messageApi,
      t
    ]
  );

  const handleStartEdit = useCallback((comment) => {
    setReplyingTo(null);
    setEditingId(comment.id);
  }, []);

  const handleCancelEdit = useCallback(() => setEditingId(null), []);

  const handleSubmitEdit = useCallback(
    (text) => {
      if (!currentUser || !editingId) return;
      const ok = editComment({
        targetType,
        targetId,
        commentId: editingId,
        text,
        userId: currentUser.id
      });
      if (ok) {
        setEditingId(null);
        reload();
        messageApi.success(t.successEdited);
      } else {
        messageApi.error(t.errorGeneric);
      }
    },
    [currentUser, editingId, targetType, targetId, reload, messageApi, t]
  );

  const handleDelete = useCallback(
    (comment) => {
      if (!currentUser) return;
      const ok = softDeleteComment({
        targetType,
        targetId,
        commentId: comment.id,
        userId: currentUser.id
      });
      if (ok) {
        reload();
        messageApi.success(t.successDeleted);
      } else {
        messageApi.error(t.errorGeneric);
      }
    },
    [currentUser, targetType, targetId, reload, messageApi, t]
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
      reload();
      messageApi.success(result ? t.successPinned : t.successUnpinned);
    },
    [isAdmin, targetType, targetId, reload, messageApi, t]
  );

  const handleStartFlag = useCallback(
    (comment) => {
      if (!currentUser?.id || !comment?.id) return;
      setFlagTarget(comment);
    },
    [currentUser]
  );

  const handleSubmitFlag = useCallback(
    ({ reason, note }) => {
      if (!currentUser?.id || !flagTarget?.id) return;
      const count = flagComment({
        targetType,
        targetId,
        commentId: flagTarget.id,
        reason,
        note,
        userId: currentUser.id
      });
      if (count === null) {
        messageApi.error(t.errorGeneric);
        return;
      }
      setFlagTarget(null);
      reload();
      messageApi.success(t.successFlagged);
    },
    [currentUser, flagTarget, targetType, targetId, reload, messageApi, t]
  );

  // viewerFlags: Set of commentIds the current viewer already flagged.
  // Computed once per (comments, currentUser) so the per-node check is
  // O(1) at render. Reads the raw overlay via viewerFlagged() helper.
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

  // Reactions intentionally skip optimistic UI: the localStorage write
  // is synchronous, so reload() is effectively instant. Saves a state
  // hop and keeps the count-source-of-truth in one place.
  const handleToggleReaction = useCallback(
    (comment, emoji) => {
      if (!currentUser || !comment?.id || !emoji) return;
      const result = toggleReaction({
        targetType,
        targetId,
        commentId: comment.id,
        emoji,
        userId: currentUser.id
      });
      if (result === null) {
        messageApi.error(t.errorGeneric);
        return;
      }
      reload();
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
