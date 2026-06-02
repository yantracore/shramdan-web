// Comment system data layer — target-agnostic (works for issues & events).
//
// Phase 1 (this file): mock + localStorage overlay. The seed thread per
// target comes from devMockData; user posts/edits/deletes live in
// localStorage at key `shramdan-comments:<targetType>:<targetId>`. The
// API surface here matches what a future backend swap-in (postJson /
// patchJson / deleteJson) will expose, so callers don't change later.
//
// Shape of a stored comment (canonical, used Phase 1 → Phase 6):
//   { id, targetType, targetId, parentId, depth, author:{id,name,role,avatar},
//     text, mentions:[], reactions:{}, createdAt, editedAt|null,
//     deleted:false, pinned:false, flagged:0 }

import { getDemoComments } from "@/lib/devMockData";

const STORAGE_PREFIX = "shramdan-comments";
const EDIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_DEPTH = 2;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function storageKey(targetType, targetId) {
  return `${STORAGE_PREFIX}:${targetType}:${targetId}`;
}

function readOverlay(targetType, targetId) {
  if (!canUseStorage()) return { added: [], edits: {}, deletes: [] };
  try {
    const raw = window.localStorage.getItem(storageKey(targetType, targetId));
    if (!raw) return { added: [], edits: {}, deletes: [] };
    const parsed = JSON.parse(raw);
    return {
      added: Array.isArray(parsed?.added) ? parsed.added : [],
      edits: parsed?.edits && typeof parsed.edits === "object" ? parsed.edits : {},
      deletes: Array.isArray(parsed?.deletes) ? parsed.deletes : []
    };
  } catch {
    return { added: [], edits: {}, deletes: [] };
  }
}

function writeOverlay(targetType, targetId, overlay) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(storageKey(targetType, targetId), JSON.stringify(overlay));
  } catch {
    // quota exceeded or storage disabled — silently drop
  }
}

// Normalize any source (seed or user-added) to the canonical shape.
function normalizeComment(raw) {
  return {
    id: String(raw.id),
    targetType: raw.targetType,
    targetId: raw.targetId,
    parentId: raw.parentId ?? null,
    depth: typeof raw.depth === "number" ? raw.depth : 0,
    author: {
      id: raw.author?.id ?? "anon",
      name: raw.author?.name ?? "—",
      role: raw.author?.role ?? null,
      avatar: raw.author?.avatar ?? null
    },
    text: String(raw.text ?? ""),
    mentions: Array.isArray(raw.mentions) ? raw.mentions : [],
    reactions: raw.reactions && typeof raw.reactions === "object" ? raw.reactions : {},
    createdAt: raw.createdAt,
    editedAt: raw.editedAt ?? null,
    deleted: Boolean(raw.deleted),
    pinned: Boolean(raw.pinned),
    flagged: Number(raw.flagged) || 0
  };
}

// Apply the overlay (added/edits/deletes) on top of the seed list.
// Returns a flat array of normalized comments.
function applyOverlay(seed, overlay) {
  const seedNormalized = seed.map(normalizeComment);
  const addedNormalized = overlay.added.map(normalizeComment);
  const all = [...seedNormalized, ...addedNormalized];

  const deletesSet = new Set(overlay.deletes);
  return all.map((c) => {
    const edit = overlay.edits[c.id];
    const next = { ...c };
    if (edit?.text != null) {
      next.text = String(edit.text);
      next.editedAt = edit.editedAt || c.editedAt || new Date().toISOString();
    }
    if (deletesSet.has(c.id)) {
      next.deleted = true;
    }
    return next;
  });
}

export function loadComments({ targetType, targetId }) {
  if (!targetType || !targetId) return [];
  const seed = getDemoComments({ targetType, targetId }) || [];
  const overlay = readOverlay(targetType, targetId);
  return applyOverlay(seed, overlay);
}

// Build a parentId → children map and a top-level list. Each level is
// sorted by createdAt ascending (oldest first → reads like a transcript).
export function buildTree(flatList) {
  const byParent = new Map();
  byParent.set(null, []);
  for (const c of flatList) {
    const key = c.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }
  for (const [, arr] of byParent) {
    arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  const attach = (node) => ({
    ...node,
    children: (byParent.get(node.id) || []).map(attach)
  });
  return (byParent.get(null) || []).map(attach);
}

// Compute the effective depth for a reply. Replies to depth-2 collapse
// back to depth 2 (sibling) — preserves the visual nesting cap while
// letting the conversation continue. Caller is responsible for prepending
// an "@parentAuthor " mention into the composer in that case.
export function computeReplyDepth(parentDepth) {
  if (typeof parentDepth !== "number") return 0;
  return Math.min(parentDepth + 1, MAX_DEPTH);
}

function makeCommentId(targetType, targetId) {
  // Stable enough for client-only persistence; avoids Math.random/Date.now
  // collisions when posting rapidly because the random component is
  // 36-base over 6 chars (~2 billion).
  const rand = Array.from({ length: 6 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 36)
    )
  ).join("");
  return `${targetType}:${targetId}:u-${rand}`;
}

export function saveComment({ targetType, targetId, parentId, parentDepth, text, author }) {
  if (!targetType || !targetId) return null;
  const trimmed = String(text || "").trim();
  if (!trimmed || !author?.id) return null;

  const overlay = readOverlay(targetType, targetId);
  const comment = normalizeComment({
    id: makeCommentId(targetType, targetId),
    targetType,
    targetId,
    parentId: parentId ?? null,
    depth: parentId == null ? 0 : computeReplyDepth(parentDepth),
    author,
    text: trimmed,
    createdAt: new Date().toISOString()
  });
  overlay.added.push(comment);
  writeOverlay(targetType, targetId, overlay);
  return comment;
}

// canEditComment: own + within 5-min window. The seed comments don't
// belong to the current viewer (no author.id match) so they're never
// editable, which is the correct behavior.
export function canEditComment(comment, userId) {
  if (!comment || !userId) return false;
  if (comment.deleted) return false;
  if (comment.author?.id !== userId) return false;
  const created = Date.parse(comment.createdAt);
  if (!Number.isFinite(created)) return false;
  return Date.now() - created <= EDIT_WINDOW_MS;
}

export function canDeleteComment(comment, userId) {
  if (!comment || !userId) return false;
  if (comment.deleted) return false;
  return comment.author?.id === userId;
}

export function editComment({ targetType, targetId, commentId, text, userId }) {
  if (!targetType || !targetId || !commentId) return false;
  const all = loadComments({ targetType, targetId });
  const target = all.find((c) => c.id === commentId);
  if (!target || !canEditComment(target, userId)) return false;

  const overlay = readOverlay(targetType, targetId);
  overlay.edits[commentId] = {
    text: String(text || "").trim(),
    editedAt: new Date().toISOString()
  };
  writeOverlay(targetType, targetId, overlay);
  return true;
}

export function softDeleteComment({ targetType, targetId, commentId, userId }) {
  if (!targetType || !targetId || !commentId) return false;
  const all = loadComments({ targetType, targetId });
  const target = all.find((c) => c.id === commentId);
  if (!target || !canDeleteComment(target, userId)) return false;

  const overlay = readOverlay(targetType, targetId);
  if (!overlay.deletes.includes(commentId)) {
    overlay.deletes.push(commentId);
  }
  writeOverlay(targetType, targetId, overlay);
  return true;
}

// Convenience for the section count: total non-deleted comments.
export function countVisible(flatList) {
  return flatList.filter((c) => !c.deleted).length;
}

export const COMMENT_LIMITS = {
  MAX_DEPTH,
  EDIT_WINDOW_MS,
  MAX_TEXT_LENGTH: 2000
};
