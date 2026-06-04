// Real-backend wrappers for the comments domain. The UI consumes a
// canonical shape (see `normalize` below) that matches what
// `src/lib/comments.js` produced for the mock layer, so consumers only
// have to swap data-fetch — not data-shape.
//
// Endpoints exercised:
//   GET    /comments?targetType&targetId&parentId&sort&includeDeleted&limit&cursor
//   POST   /comments                            { targetType, targetId, parentId?, text, mentions? }
//   PATCH  /comments/{id}                       { text, mentions? }
//   DELETE /comments/{id}?hard=true|false
//   POST   /comments/{id}/reactions             { emoji }
//   DELETE /comments/{id}/reactions?emoji=X
//
// Two backend → frontend shape gaps to bridge:
//   - backend uses `isDeleted`; frontend canonical uses `deleted`
//   - backend does not return `myReactions`; we leave it undefined here
//     and let the consumer fold in a localStorage overlay for the
//     viewer's reaction-pressed state (same pattern as the mock layer).
//
// Admin-only fields (`pinned`, `flagged`) stay at their canonical
// defaults — they're handled by the localStorage overlay in
// `src/lib/comments.js`, because the backend does not expose those
// concepts yet.

import { deleteJson, getJson, patchJson, postJson } from "@/lib/apiClient";

function unwrap(response) {
  if (!response || typeof response !== "object") return response ?? null;
  return response.data ?? response;
}

export function normalizeComment(raw) {
  if (!raw || typeof raw !== "object") return null;
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
    reactions:
      raw.reactions && typeof raw.reactions === "object" ? raw.reactions : {},
    createdAt: raw.createdAt,
    editedAt: raw.editedAt ?? null,
    deleted: Boolean(raw.isDeleted ?? raw.deleted),
    pinned: Boolean(raw.pinned),
    flagged: Number(raw.flagged) || 0,
    replyCount: Number.isFinite(raw.replyCount) ? raw.replyCount : 0
  };
}

export async function fetchComments({
  targetType,
  targetId,
  parentId,
  sort,
  includeDeleted = false,
  limit = 100,
  cursor,
  requireAuth = false
}) {
  if (!targetType || !targetId) return [];
  const params = { targetType, targetId, limit };
  if (parentId) params.parentId = parentId;
  if (sort) params.sort = sort;
  if (includeDeleted) params.includeDeleted = true;
  if (cursor) params.cursor = cursor;
  const response = await getJson("/comments", { params, requireAuth });
  const data = unwrap(response);
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];
  return items.map(normalizeComment).filter(Boolean);
}

export async function createComment({
  targetType,
  targetId,
  parentId,
  text,
  mentions
}) {
  const body = { targetType, targetId, text: String(text || "").trim() };
  if (parentId) body.parentId = parentId;
  if (Array.isArray(mentions) && mentions.length > 0) body.mentions = mentions;
  const response = await postJson("/comments", body, { requireAuth: true });
  return normalizeComment(unwrap(response));
}

export async function updateComment({ id, text, mentions }) {
  if (!id) return null;
  const body = { text: String(text || "").trim() };
  if (Array.isArray(mentions)) body.mentions = mentions;
  const response = await patchJson(`/comments/${id}`, body, {
    requireAuth: true
  });
  return normalizeComment(unwrap(response));
}

export async function deleteCommentRemote({ id, hard = false } = {}) {
  if (!id) return false;
  const params = hard ? { hard: true } : undefined;
  await deleteJson(`/comments/${id}`, { params, requireAuth: true });
  return true;
}

export async function addReactionRemote({ id, emoji }) {
  if (!id || !emoji) return false;
  await postJson(`/comments/${id}/reactions`, { emoji }, { requireAuth: true });
  return true;
}

export async function removeReactionRemote({ id, emoji }) {
  if (!id || !emoji) return false;
  await deleteJson(`/comments/${id}/reactions`, {
    params: { emoji },
    requireAuth: true
  });
  return true;
}
