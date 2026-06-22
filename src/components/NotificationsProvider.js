"use client";

// App-wide live notifications store. Mounted once at the root (see
// src/app/providers.js). It owns the canonical unread count and the recent
// feed, then both surfaces — the topbar NotificationsBell and the
// /me/notifications inbox — read from here via useNotifications(), so they
// stay in lockstep with each other and with live events.
//
// On login it pulls one REST page (so the badge is correct even if the live
// channel is down) and opens the SSE stream. The four server events are
// folded into local state; a freshly *created* notification also raises an
// Ant toast. The inner store is keyed on the user id, so logging out (or
// switching accounts) remounts it with clean state — no cross-account leakage.

import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LikeOutlined,
  PlayCircleOutlined,
  UserOutlined
} from "@ant-design/icons";
import { App } from "antd";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import {
  getStoredAccessToken,
  getStoredUser,
  subscribeAuthSession
} from "@/lib/authSession";
import {
  fetchNotificationFeed,
  mapNotification,
  markAllNotificationsRead,
  markNotificationRead
} from "@/lib/notificationsApi";
import { openNotificationsStream } from "@/lib/notificationsStream";

// How many recent notifications we keep in memory. The inbox renders up to
// this many; the bell slices the first few.
const FEED_LIMIT = 50;

const KIND_ICON = {
  vote: LikeOutlined,
  schedule: CalendarOutlined,
  result: CheckCircleOutlined,
  live: PlayCircleOutlined,
  welcome: UserOutlined
};

const EMPTY_VALUE = {
  items: [],
  unreadCount: 0,
  status: "idle",
  connected: false,
  markRead: () => {},
  markAllRead: () => {},
  refresh: () => {}
};

const NotificationsContext = createContext(null);

// Outer shell: tracks who's logged in and remounts the store per user.
export function NotificationsProvider({ children }) {
  const userId = useSyncExternalStore(
    subscribeAuthSession,
    () => getStoredUser()?.id ?? null,
    () => null
  );

  return (
    <NotificationsStore key={userId || "anon"} userId={userId}>
      {children}
    </NotificationsStore>
  );
}

// Inner store: fresh state per mount, so login/logout get a clean slate.
function NotificationsStore({ userId, children }) {
  const { notification: notify } = App.useApp();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("idle");

  // Live-only mirrors so the long-lived stream handlers never read stale
  // closures: the notify/router instances, the set of ids we've already
  // accounted for (seeded from the REST feed, used to dedupe `created`), and
  // whether we've connected at least once (to detect a reconnect).
  const notifyRef = useRef(notify);
  const routerRef = useRef(router);
  const seenIdsRef = useRef(null);
  const wasOpenRef = useRef(false);
  if (seenIdsRef.current === null) seenIdsRef.current = new Set();

  // Keep the instance refs current without touching them during render.
  useEffect(() => {
    notifyRef.current = notify;
    routerRef.current = router;
  });

  const pushToast = useCallback((mapped) => {
    const instance = notifyRef.current;
    if (!instance || !mapped) return;
    const Icon = KIND_ICON[mapped.kind] || BellOutlined;
    const title = mapped.title?.np || mapped.title?.en || "नयाँ सूचना";
    const body = mapped.body?.np || mapped.body?.en || "";
    instance.open({
      key: mapped.id,
      message: title,
      description: body,
      icon: <Icon style={{ color: "var(--accent, #e75f1b)" }} />,
      placement: "bottomRight",
      duration: 6,
      className: "notification-live-toast",
      onClick: () => {
        instance.destroy(mapped.id);
        if (mapped.href) routerRef.current?.push(mapped.href);
      }
    });
  }, []);

  // Apply a fetched REST page to state and remember its ids (so live `created`
  // events for already-known notifications don't double-count).
  const applyFeed = useCallback((feed) => {
    feed.items.forEach((n) => seenIdsRef.current.add(n.id));
    setItems(feed.items);
    setUnreadCount(feed.unreadCount);
  }, []);

  // Reconnect catch-up: re-pull the list. An empty result here is more likely a
  // transient fetch failure than a genuinely empty inbox, so don't let it wipe
  // the list — an explicit snapshot still corrects the count.
  const refreshFeed = useCallback(async () => {
    const feed = await fetchNotificationFeed({ limit: FEED_LIMIT });
    if (feed.items.length === 0) return;
    applyFeed(feed);
  }, [applyFeed]);

  const handleEvent = useCallback(
    (evt) => {
      const type = String(evt?.data?.type || evt?.event || "");
      const payload = evt?.data || {};

      switch (type) {
        case "notification.snapshot":
          // Authoritative count, sent once per (re)connect — resyncs any drift.
          if (Number.isFinite(payload.unreadCount)) {
            setUnreadCount(payload.unreadCount);
          }
          break;

        case "notification.created": {
          const mapped = mapNotification(payload.notification);
          if (!mapped || seenIdsRef.current.has(mapped.id)) break;
          seenIdsRef.current.add(mapped.id);
          setItems((prev) =>
            prev.some((n) => n.id === mapped.id)
              ? prev
              : [mapped, ...prev].slice(0, FEED_LIMIT)
          );
          setUnreadCount((c) => c + 1);
          pushToast(mapped);
          break;
        }

        case "notification.read":
          setItems((prev) =>
            prev.map((n) => (n.id === payload.id ? { ...n, isRead: true } : n))
          );
          if (Number.isFinite(payload.unreadCount)) {
            setUnreadCount(payload.unreadCount);
          }
          break;

        case "notification.read_all":
          setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
          setUnreadCount(
            Number.isFinite(payload.unreadCount) ? payload.unreadCount : 0
          );
          break;

        default:
          break;
      }
    },
    [pushToast]
  );

  // Load the feed and open the live stream. Runs once per mount; the outer
  // provider remounts this component when the logged-in user changes.
  useEffect(() => {
    if (!userId) return undefined;

    let alive = true;
    // Initial load — applies even when empty (the real, renderable state), so
    // the badge is correct even if the live channel never connects.
    fetchNotificationFeed({ limit: FEED_LIMIT }).then((feed) => {
      if (alive) applyFeed(feed);
    });

    const close = openNotificationsStream({
      getToken: getStoredAccessToken,
      onStatus: (next) => {
        if (!alive) return;
        setStatus(next);
        if (next === "open") {
          // A reconnect can have missed `created` events while we were down;
          // the snapshot only carries the count, so re-pull the list too.
          if (wasOpenRef.current) refreshFeed();
          wasOpenRef.current = true;
        }
      },
      onEvent: (evt) => {
        if (alive) handleEvent(evt);
      }
    });

    return () => {
      alive = false;
      close();
    };
  }, [userId, applyFeed, handleEvent, refreshFeed]);

  const markRead = useCallback((id) => {
    setItems((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    });
    markNotificationRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    markAllNotificationsRead().catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      status,
      connected: status === "open",
      markRead,
      markAllRead,
      refresh: refreshFeed
    }),
    [items, unreadCount, status, markRead, markAllRead, refreshFeed]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

// Read the live notifications store. Falls back to an inert value if used
// outside the provider so stray callers degrade quietly instead of throwing.
export function useNotifications() {
  return useContext(NotificationsContext) || EMPTY_VALUE;
}
