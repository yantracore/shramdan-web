"use client";

import {
  DeleteOutlined,
  EditOutlined,
  MessageOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { CommentReactions } from "@/components/comments/CommentReactions";
import { canDeleteComment, canEditComment } from "@/lib/comments";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    minutesAgo: "{n} मि. अघि",
    hoursAgo: "{n} घण्टा अघि",
    daysAgo: "{n} दिन अघि",
    justNow: "भर्खर",
    edited: "सम्पादित",
    deletedBody: "लेखकले यो टिप्पणी मेटाएका छन्।",
    reply: "जवाफ",
    edit: "सम्पादन",
    delete: "मेटाउने"
  },
  en: {
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    daysAgo: "{n} d ago",
    justNow: "just now",
    edited: "edited",
    deletedBody: "The author deleted this comment.",
    reply: "Reply",
    edit: "Edit",
    delete: "Delete"
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

function initialOf(name) {
  if (!name) return "—";
  return Array.from(name.trim())[0] || "—";
}

export function CommentNode({
  comment,
  depth,
  language = "np",
  currentUser,
  isReplying,
  isEditing,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  onToggleReaction,
  children
}) {
  const t = COPY[language] || COPY.np;
  const canEdit = canEditComment(comment, currentUser?.id);
  const canDelete = canDeleteComment(comment, currentUser?.id);

  return (
    <li
      className={`comment-node comment-depth-${depth}${
        comment.deleted ? " is-deleted" : ""
      }`}
      data-comment-id={comment.id}
    >
      <span className="comment-avatar" aria-hidden="true">
        {initialOf(comment.author?.name)}
      </span>
      <div className="comment-body">
        <div className="comment-attrib">
          <strong className="comment-author-name">{comment.author?.name}</strong>
          {comment.author?.role ? (
            <span className="comment-author-role">{comment.author.role}</span>
          ) : null}
          <span className="comment-time">
            · {relativeTime(comment.createdAt, t, language)}
          </span>
          {comment.editedAt && !comment.deleted ? (
            <span className="comment-edited-pill">{t.edited}</span>
          ) : null}
        </div>

        {comment.deleted ? (
          <p className="comment-text comment-text-deleted">{t.deletedBody}</p>
        ) : isEditing ? (
          <CommentComposer
            mode="edit"
            language={language}
            initialText={comment.text}
            isAuthenticated
            autoFocus
            onCancel={onCancelEdit}
            onSubmit={onSubmitEdit}
          />
        ) : (
          <p className="comment-text">{comment.text}</p>
        )}

        {!comment.deleted && !isEditing ? (
          <>
            <CommentReactions
              reactions={comment.reactions}
              myReactions={comment.myReactions}
              language={language}
              isAuthenticated={Boolean(currentUser?.id)}
              onToggle={(emoji) => onToggleReaction?.(comment, emoji)}
            />
            <div className="comment-actions" role="group">
              <Button
                type="text"
                size="small"
                icon={<MessageOutlined />}
                onClick={() => onStartReply?.(comment)}
              >
                {t.reply}
              </Button>
              {canEdit ? (
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onStartEdit?.(comment)}
                >
                  {t.edit}
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete?.(comment)}
                >
                  {t.delete}
                </Button>
              ) : null}
            </div>
          </>
        ) : null}

        {isReplying ? (
          <div className="comment-reply-composer">
            <CommentComposer
              mode="reply"
              language={language}
              isAuthenticated
              autoFocus
              onCancel={onCancelReply}
              onSubmit={onSubmitReply}
            />
          </div>
        ) : null}

        {children ? <div className="comment-children">{children}</div> : null}
      </div>
    </li>
  );
}
