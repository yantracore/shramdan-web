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
  const empty = {
    added: [],
    edits: {},
    deletes: [],
    picks: {},
    pinnedId: null,
    flags: {}
  };
  if (!canUseStorage()) return empty;
  try {
    const raw = window.localStorage.getItem(storageKey(targetType, targetId));
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      added: Array.isArray(parsed?.added) ? parsed.added : [],
      edits: parsed?.edits && typeof parsed.edits === "object" ? parsed.edits : {},
      deletes: Array.isArray(parsed?.deletes) ? parsed.deletes : [],
      // picks: { [commentId]: ["👏", "🌱", ...] } — emojis this viewer has
      // toggled on. Seed reactions live on the comment itself; picks add
      // +1 each on top (or surface a new emoji at count 1 if not seeded).
      picks: parsed?.picks && typeof parsed.picks === "object" ? parsed.picks : {},
      // pinnedId: at most one pinned comment per target. Admin-only
      // action; pinning a new comment unpins the previous one.
      pinnedId: typeof parsed?.pinnedId === "string" ? parsed.pinnedId : null,
      // flags: { [commentId]: { [reporterUserId]: {reason, note, at} } }
      // Same user can't double-flag. Visible-flag count = unique keys.
      flags: parsed?.flags && typeof parsed.flags === "object" ? parsed.flags : {}
    };
  } catch {
    return empty;
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

// Apply the overlay (added/edits/deletes/picks) on top of the seed list.
// Returns a flat array of normalized comments. Reactions are folded so
// that the viewer's picks add +1 to seeded counts (or surface unseeded
// emojis at count 1) and `myReactions` exposes which emojis the viewer
// currently picked — that's what the UI uses for `is-picked` state.
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

    const viewerPicks = Array.isArray(overlay.picks?.[c.id])
      ? overlay.picks[c.id]
      : [];
    if (viewerPicks.length > 0) {
      const folded = { ...c.reactions };
      for (const emoji of viewerPicks) {
        folded[emoji] = (folded[emoji] || 0) + 1;
      }
      next.reactions = folded;
    }
    next.myReactions = viewerPicks;

    next.pinned = overlay.pinnedId === c.id;
    const flagRecord = overlay.flags?.[c.id] || {};
    next.flagged = Object.keys(flagRecord).length;
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

function sumReactions(reactions) {
  if (!reactions || typeof reactions !== "object") return 0;
  let total = 0;
  for (const v of Object.values(reactions)) total += Number(v) || 0;
  return total;
}

// True if any comment in this subtree (root or descendant) was written
// by `userId`. Used by the "Mine" filter so a user's own reply on
// someone else's top-level keeps the whole thread visible.
function threadHasAuthor(node, userId) {
  if (!node || !userId) return false;
  if (node.author?.id === userId) return true;
  const kids = Array.isArray(node.children) ? node.children : [];
  for (const kid of kids) {
    if (threadHasAuthor(kid, userId)) return true;
  }
  return false;
}

// Top-level sort modes. Children are always chronological (set by
// buildTree) — sorting deeper would break conversational flow.
//
//   "top"    — descending by total reactions on the depth-0 node, ties
//              broken by newer-first
//   "newest" — descending by createdAt on the depth-0 node
//   "mine"   — filters to threads that contain `currentUserId` anywhere
//              (preserves natural chronological order)
export function sortTopLevel(tree, mode, currentUserId) {
  if (!Array.isArray(tree)) return [];
  const filtered =
    mode === "mine" && currentUserId
      ? tree.filter((n) => threadHasAuthor(n, currentUserId))
      : tree;

  let ordered;
  if (mode === "top") {
    ordered = [...filtered].sort((a, b) => {
      const diff = sumReactions(b.reactions) - sumReactions(a.reactions);
      if (diff !== 0) return diff;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  } else if (mode === "newest") {
    ordered = [...filtered].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  } else {
    ordered = filtered;
  }

  // Pinned comments always float to the top regardless of sort mode.
  // Only one comment can be pinned per target (enforced by togglePin),
  // but the partition is general so multiple sequential pins (e.g.
  // from a future enhancement) would still group correctly.
  const pinned = ordered.filter((n) => n.pinned);
  if (pinned.length === 0) return ordered;
  const rest = ordered.filter((n) => !n.pinned);
  return [...pinned, ...rest];
}

// Toggle one emoji reaction on a comment, on behalf of the viewer. The
// caller is expected to have already checked `userId` (login wall) —
// this layer doesn't gate, it just persists. Returns the new pick
// state (true = now picked, false = now unpicked). Soft-deleted
// comments cannot be reacted to.
export function toggleReaction({ targetType, targetId, commentId, emoji, userId }) {
  if (!targetType || !targetId || !commentId || !emoji || !userId) return null;
  const all = loadComments({ targetType, targetId });
  const target = all.find((c) => c.id === commentId);
  if (!target || target.deleted) return null;

  const overlay = readOverlay(targetType, targetId);
  const current = Array.isArray(overlay.picks[commentId])
    ? overlay.picks[commentId]
    : [];
  const idx = current.indexOf(emoji);
  let next;
  let nowPicked;
  if (idx >= 0) {
    next = current.filter((_, i) => i !== idx);
    nowPicked = false;
  } else {
    next = [...current, emoji];
    nowPicked = true;
  }
  overlay.picks = {
    ...overlay.picks,
    [commentId]: next
  };
  // Drop the key entirely if empty — keeps the localStorage payload lean.
  if (next.length === 0) {
    const { [commentId]: _omit, ...rest } = overlay.picks;
    overlay.picks = rest;
  }
  writeOverlay(targetType, targetId, overlay);
  return nowPicked;
}

// Admin-only: pin a single comment on a target. Passing the same id
// again unpins it. Pinning a different id replaces the previous.
// Returns true if pinned now, false if unpinned, null on invalid input.
// The auth/role check is the caller's responsibility (isAdminUser).
export function togglePin({ targetType, targetId, commentId }) {
  if (!targetType || !targetId || !commentId) return null;
  const overlay = readOverlay(targetType, targetId);
  const nowPinned = overlay.pinnedId !== commentId;
  overlay.pinnedId = nowPinned ? commentId : null;
  writeOverlay(targetType, targetId, overlay);
  return nowPinned;
}

// One flag per user per comment. Subsequent flags from the same user
// update the reason/note. Returns the new unique-user flag count, or
// null on invalid input.
export function flagComment({
  targetType,
  targetId,
  commentId,
  reason,
  note,
  userId
}) {
  if (!targetType || !targetId || !commentId || !userId || !reason) return null;
  const overlay = readOverlay(targetType, targetId);
  const existing = overlay.flags?.[commentId] || {};
  overlay.flags = {
    ...overlay.flags,
    [commentId]: {
      ...existing,
      [userId]: {
        reason,
        note: note || "",
        at: new Date().toISOString()
      }
    }
  };
  writeOverlay(targetType, targetId, overlay);
  return Object.keys(overlay.flags[commentId]).length;
}

export function hasViewerFlagged(comment, userId) {
  if (!comment || !userId) return false;
  // Comment came through applyOverlay, so we can't reach the raw flags
  // map from here. Caller should peek at the raw overlay for this.
  // Provided as a stub; CommentSection uses raw overlay access via
  // readPicksForViewer-style helper below.
  return false;
}

// Cheap viewer-flagged lookup so the UI can render the flag button as
// "Reported" instead of "Report". Reads localStorage directly.
export function viewerFlagged({ targetType, targetId, commentId, userId }) {
  if (!targetType || !targetId || !commentId || !userId) return false;
  const overlay = readOverlay(targetType, targetId);
  return Boolean(overlay.flags?.[commentId]?.[userId]);
}

// Threshold above which comment bodies auto-hide for non-admin viewers
// pending moderation review (Phase 6's queue).
export const FLAG_AUTO_HIDE_THRESHOLD = 3;

// Walk every comment-overlay key in localStorage and return one entry
// per flagged comment, sorted by flag count desc. Used by the admin
// moderation queue at /admin/comments. In production this becomes a
// single API call (GET /admin/comments/flags) — shape is identical.
export function listAllFlaggedComments() {
  if (!canUseStorage()) return [];
  const out = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(`${STORAGE_PREFIX}:`)) continue;
    const parts = key.split(":");
    // shramdan-comments:<targetType>:<targetId>
    if (parts.length < 3) continue;
    const targetType = parts[1];
    const targetId = parts.slice(2).join(":");
    const overlay = readOverlay(targetType, targetId);
    if (!overlay.flags || Object.keys(overlay.flags).length === 0) continue;
    const all = loadComments({ targetType, targetId });
    for (const [commentId, reports] of Object.entries(overlay.flags)) {
      const comment = all.find((c) => c.id === commentId);
      if (!comment) continue;
      const reportEntries = Object.entries(reports);
      out.push({
        targetType,
        targetId,
        commentId,
        comment,
        flagCount: reportEntries.length,
        reports: reportEntries.map(([userId, info]) => ({
          userId,
          reason: info?.reason || "",
          note: info?.note || "",
          at: info?.at || null
        }))
      });
    }
  }
  return out.sort((a, b) => b.flagCount - a.flagCount);
}

// Admin: clear all flags on a single comment (Approve action). Returns
// true if anything was cleared, false otherwise.
export function approveFlaggedComment({ targetType, targetId, commentId }) {
  if (!targetType || !targetId || !commentId) return false;
  const overlay = readOverlay(targetType, targetId);
  if (!overlay.flags?.[commentId]) return false;
  const { [commentId]: _omit, ...rest } = overlay.flags;
  overlay.flags = rest;
  writeOverlay(targetType, targetId, overlay);
  return true;
}

// Admin: remove a flagged comment (Remove action). Soft-deletes + clears
// the flag record so the queue empties for this id.
export function adminRemoveComment({ targetType, targetId, commentId }) {
  if (!targetType || !targetId || !commentId) return false;
  const overlay = readOverlay(targetType, targetId);
  if (!overlay.deletes.includes(commentId)) overlay.deletes.push(commentId);
  if (overlay.flags?.[commentId]) {
    const { [commentId]: _omit, ...rest } = overlay.flags;
    overlay.flags = rest;
  }
  writeOverlay(targetType, targetId, overlay);
  return true;
}

export const COMMENT_LIMITS = {
  MAX_DEPTH,
  EDIT_WINDOW_MS,
  MAX_TEXT_LENGTH: 2000
};
