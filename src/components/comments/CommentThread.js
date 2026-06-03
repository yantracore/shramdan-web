"use client";

import { CommentNode } from "@/components/comments/CommentNode";
import { COMMENT_LIMITS } from "@/lib/comments";

// Recursive renderer. `nodes` is the children list at the current depth;
// each node carries its own `children` array (already nested by
// buildTree). Visual depth is capped at MAX_DEPTH — a node at depth 2's
// children (if any seed has them) render alongside as siblings on the
// same level.
export function CommentThread({
  nodes,
  depth = 0,
  language,
  currentUser,
  replyingTo,
  editingId,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  onDelete,
  onToggleReaction
}) {
  if (!Array.isArray(nodes) || nodes.length === 0) return null;

  return (
    <ul className={`comment-list comment-list-depth-${depth}`}>
      {nodes.map((node) => {
        const childNodes = Array.isArray(node.children) ? node.children : [];
        const canNestVisually = depth < COMMENT_LIMITS.MAX_DEPTH;
        return (
          <CommentNode
            key={node.id}
            comment={node}
            depth={depth}
            language={language}
            currentUser={currentUser}
            isReplying={replyingTo === node.id}
            isEditing={editingId === node.id}
            onStartReply={onStartReply}
            onCancelReply={onCancelReply}
            onSubmitReply={onSubmitReply}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSubmitEdit={onSubmitEdit}
            onDelete={onDelete}
            onToggleReaction={onToggleReaction}
          >
            {childNodes.length > 0 && canNestVisually ? (
              <CommentThread
                nodes={childNodes}
                depth={depth + 1}
                language={language}
                currentUser={currentUser}
                replyingTo={replyingTo}
                editingId={editingId}
                onStartReply={onStartReply}
                onCancelReply={onCancelReply}
                onSubmitReply={onSubmitReply}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSubmitEdit={onSubmitEdit}
                onDelete={onDelete}
                onToggleReaction={onToggleReaction}
              />
            ) : null}
          </CommentNode>
        );
      })}
    </ul>
  );
}
