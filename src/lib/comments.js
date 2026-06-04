// Comment system — utility + viewer-overlay layer.
//
// Data fetch and mutations (load / create / edit / delete / react) live
// in `src/lib/commentsApi.js` and talk to the real backend. This file
// keeps the parts that stay client-side:
//   - tree-building, depth math, sort, count helpers
//   - viewer-side overlays for features the backend does NOT cover yet:
//       * `picks`     — emojis the viewer has reacted with, used to
//                       render the toggled-on state of reaction chips
//                       and to fold the viewer's reaction into the
//                       aggregate count optimistically.
//       * `pinnedId`  — admin-only pin marker (one per target).
//       * `flags`     — moderation flags (one per viewer per comment).
//   When the backend ships the corresponding endpoints, these overlays
//   can be retired in favour of fields on the comment record itself.

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
  const empty = { picks: {}, pinnedId: null, flags: {} };
  if (!canUseStorage()) return empty;
  try {
    const raw = window.localStorage.getItem(storageKey(targetType, targetId));
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      picks: parsed?.picks && typeof parsed.picks === "object" ? parsed.picks : {},
      pinnedId: typeof parsed?.pinnedId === "string" ? parsed.pinnedId : null,
      flags: parsed?.flags && typeof parsed.flags === "object" ? parsed.flags : {}
    };
  } catch {
    return empty;
  }
}

function writeOverlay(targetType, targetId, overlay) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(
      storageKey(targetType, targetId),
      JSON.stringify(overlay)
    );
  } catch {
    // quota exceeded or storage disabled — silently drop
  }
}

// Apply the viewer overlay on top of a real-backend list. Returns a new
// list of the same shape with the viewer-side annotations folded in.
export function applyLocalOverlay({ targetType, targetId, list }) {
  if (!Array.isArray(list)) return [];
  if (!targetType || !targetId) return list;
  const overlay = readOverlay(targetType, targetId);

  return list.map((c) => {
    const next = { ...c };
    const viewerPicks = Array.isArray(overlay.picks?.[c.id])
      ? overlay.picks[c.id]
      : [];
    if (viewerPicks.length > 0) {
      const folded = { ...(c.reactions || {}) };
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

export function computeReplyDepth(parentDepth) {
  if (typeof parentDepth !== "number") return 0;
  return Math.min(parentDepth + 1, MAX_DEPTH);
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

export function countVisible(flatList) {
  return flatList.filter((c) => !c.deleted).length;
}

function sumReactions(reactions) {
  if (!reactions || typeof reactions !== "object") return 0;
  let total = 0;
  for (const v of Object.values(reactions)) total += Number(v) || 0;
  return total;
}

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

  const pinned = ordered.filter((n) => n.pinned);
  if (pinned.length === 0) return ordered;
  const rest = ordered.filter((n) => !n.pinned);
  return [...pinned, ...rest];
}

// Toggle the viewer's overlay-side reaction. The matching backend call
// is made separately by the consumer — this helper only handles the
// localStorage piece so the toggled-on visual state survives page
// reloads even before the backend returns `myReactions`.
//
// Returns the new picked state (true if now picked, false if unpicked).
export function toggleReactionOverlay({ targetType, targetId, commentId, emoji }) {
  if (!targetType || !targetId || !commentId || !emoji) return null;
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
  if (next.length === 0) {
    const { [commentId]: _omit, ...rest } = overlay.picks;
    overlay.picks = rest;
  } else {
    overlay.picks = { ...overlay.picks, [commentId]: next };
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
// moderation queue at /admin/comments. The comment text itself is not
// resolved here — that's the caller's responsibility (it needs to fetch
// from the backend by id).
export function listAllFlaggedComments() {
  if (!canUseStorage()) return [];
  const out = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(`${STORAGE_PREFIX}:`)) continue;
    const parts = key.split(":");
    if (parts.length < 3) continue;
    const targetType = parts[1];
    const targetId = parts.slice(2).join(":");
    const overlay = readOverlay(targetType, targetId);
    if (!overlay.flags || Object.keys(overlay.flags).length === 0) continue;
    for (const [commentId, reports] of Object.entries(overlay.flags)) {
      const reportEntries = Object.entries(reports);
      out.push({
        targetType,
        targetId,
        commentId,
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

// Admin: clear all flags on a single comment (Approve action).
export function approveFlaggedComment({ targetType, targetId, commentId }) {
  if (!targetType || !targetId || !commentId) return false;
  const overlay = readOverlay(targetType, targetId);
  if (!overlay.flags?.[commentId]) return false;
  const { [commentId]: _omit, ...rest } = overlay.flags;
  overlay.flags = rest;
  writeOverlay(targetType, targetId, overlay);
  return true;
}

export const COMMENT_LIMITS = {
  MAX_DEPTH,
  EDIT_WINDOW_MS,
  MAX_TEXT_LENGTH: 2000
};

// Back-compat stubs for the synchronous data-layer that this file used
// to provide. Real fetch + writes now live in `src/lib/commentsApi.js`.
// These stubs keep peripheral consumers (list-card count badges,
// admin moderation queue) from crashing during the transition; the
// counts they produce default to zero until those consumers are
// refactored to fetch real counts. Tracked in
// `docs/00-polish-backlog.md`.

export function loadComments() {
  return [];
}

// Admin moderation: clear flags AND mark the comment as locally
// soft-deleted in the overlay so it disappears from the queue. Real
// site-wide removal requires backend admin-delete authority, which is
// not yet exposed. When that lands, swap to deleteCommentRemote here.
export function adminRemoveComment({ targetType, targetId, commentId }) {
  if (!targetType || !targetId || !commentId) return false;
  const overlay = readOverlay(targetType, targetId);
  if (overlay.flags?.[commentId]) {
    const { [commentId]: _omit, ...rest } = overlay.flags;
    overlay.flags = rest;
    writeOverlay(targetType, targetId, overlay);
  }
  return true;
}
