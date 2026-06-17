// Consumer-side notifications layer. Maps the backend `/notifications` shape
// onto the { id, kind, title:{np,en}, body:{np,en}, href, isRead, createdAt }
// shape that NotificationsBell and /me/notifications render.
//
// Backend notification text is server-generated and single-language, so we
// mirror it into both locales rather than inventing a translation.

import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "@/lib/apiClient";

// Map a backend notification `type` to one of the bell's icon kinds
// (vote / schedule / result / live / welcome). Unknown types fall back to a
// generic bell icon via the consumer's KIND_ICON lookup.
export function notificationKind(type) {
  const v = String(type || "").toUpperCase();
  if (v.includes("VOTE") || v.includes("SUPPORT")) return "vote";
  if (v.includes("SCHEDUL")) return "schedule";
  if (v.includes("COMPLET") || v.includes("RESULT")) return "result";
  if (v.includes("LIVE") || v.includes("STREAM")) return "live";
  if (v.includes("WELCOME") || v.includes("ACCOUNT")) return "welcome";
  return "bell";
}

// Build an in-app href from the notification's `data` payload. Prefers a slug
// over the raw id so links are human-readable; falls back to the inbox.
export function notificationHref(data) {
  if (!data || typeof data !== "object") return "/me/notifications";
  const ref = data.slug || data.targetId;
  if (!ref) return "/me/notifications";
  switch (String(data.targetType || "").toLowerCase()) {
    case "event":
      return `/events/${ref}`;
    case "issue":
      return `/issues/${ref}`;
    default:
      return "/me/notifications";
  }
}

export function mapNotification(raw) {
  if (!raw) return null;
  const mirror = (s) => ({ np: s || "", en: s || "" });
  return {
    id: raw.id,
    kind: notificationKind(raw.type),
    title: mirror(raw.title),
    body: mirror(raw.body),
    href: notificationHref(raw.data),
    isRead: Boolean(raw.readAt),
    createdAt: raw.createdAt
  };
}

// Fetch a normalized page of notifications for the UI. Returns
// { items, unreadCount, nextCursor }. Soft-fails to an empty feed so the bell
// and inbox degrade quietly instead of throwing.
export async function fetchNotificationFeed(params = {}) {
  try {
    const res = await fetchNotifications(params);
    const data = res?.data ?? res ?? {};
    const items = Array.isArray(data.items)
      ? data.items.map(mapNotification).filter(Boolean)
      : [];
    const unreadCount = Number.isFinite(data.unreadCount)
      ? data.unreadCount
      : items.filter((n) => !n.isRead).length;
    return { items, unreadCount, nextCursor: data.nextCursor ?? null };
  } catch {
    return { items: [], unreadCount: 0, nextCursor: null };
  }
}

export { markNotificationRead, markAllNotificationsRead };
