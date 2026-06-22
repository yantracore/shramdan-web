"use client";

// Topbar notifications bell — a thin view over the app-wide notifications
// store (NotificationsProvider). The store owns the REST page, the live SSE
// updates, and the read-state mutations; the bell just renders the most recent
// few and reflects the authoritative unread count, which can exceed the items
// shown here. New notifications and reads arriving over SSE update it live.

import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LikeOutlined,
  PlayCircleOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Badge, Dropdown } from "antd";
import Link from "next/link";
import { useState } from "react";
import { useNotifications } from "@/components/NotificationsProvider";

const BELL_FEED_LIMIT = 8;

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const KIND_ICON = {
  vote: LikeOutlined,
  schedule: CalendarOutlined,
  result: CheckCircleOutlined,
  live: PlayCircleOutlined,
  welcome: UserOutlined
};

const COPY = {
  np: {
    aria: "सूचनाहरू",
    heading: "सूचनाहरू",
    empty: "कुनै नयाँ सूचना छैन।",
    markAll: "सबै पढिएको",
    viewAll: "सबै हेर्नुहोस्",
    minutesAgo: "{n} मि. अघि",
    hoursAgo: "{n} घण्टा अघि",
    daysAgo: "{n} दिन अघि",
    justNow: "अहिले"
  },
  en: {
    aria: "Notifications",
    heading: "Notifications",
    empty: "No new notifications.",
    markAll: "Mark all read",
    viewAll: "View all",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    daysAgo: "{n} d ago",
    justNow: "Just now"
  }
};

function relativeTime(iso, t, language) {
  if (!iso) return "";
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return t.justNow;
  const min = Math.floor(ms / 60_000);
  if (min < 1) return t.justNow;
  if (min < 60) return t.minutesAgo.replace("{n}", localizeDigits(min, language));
  const hr = Math.floor(min / 60);
  if (hr < 24) return t.hoursAgo.replace("{n}", localizeDigits(hr, language));
  const days = Math.floor(hr / 24);
  return t.daysAgo.replace("{n}", localizeDigits(days, language));
}

export function NotificationsBell({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const {
    items: allItems,
    unreadCount: unread,
    markRead,
    markAllRead
  } = useNotifications();
  const [open, setOpen] = useState(false);
  // Snapshot of the feed as it stood when the panel opened. Opening the panel
  // auto-marks everything read (clearing the badge), so without this freeze the
  // list would lose its "new" highlight the instant it appears. We render from
  // the frozen copy while open, so the user can still see what just arrived.
  const [frozenItems, setFrozenItems] = useState(null);
  const items = (open && frozenItems ? frozenItems : allItems).slice(
    0,
    BELL_FEED_LIMIT
  );

  const handleOpenChange = (next) => {
    setOpen(next);
    if (next) {
      setFrozenItems(allItems);
      if (unread > 0) markAllRead();
    } else {
      setFrozenItems(null);
    }
  };

  const closePanel = () => handleOpenChange(false);

  const panel = (
    <div className="notifications-panel" role="region" aria-label={t.heading}>
      <header className="notifications-panel-header">
        <h3>{t.heading}</h3>
        {unread > 0 ? (
          <button type="button" className="notifications-mark-all" onClick={markAllRead}>
            {t.markAll}
          </button>
        ) : null}
      </header>
      {items.length === 0 ? (
        <p className="notifications-empty">{t.empty}</p>
      ) : (
      <ul className="notifications-list">
        {items.map((n) => {
          const Icon = KIND_ICON[n.kind] || BellOutlined;
          const title = n.title?.[language] || n.title?.np || "";
          const body = n.body?.[language] || n.body?.np || "";
          return (
            <li
              key={n.id}
              className={`notifications-item${n.isRead ? "" : " is-unread"}`}
            >
              <Link
                href={n.href || "#"}
                onClick={() => {
                  markRead(n.id);
                  closePanel();
                }}
                className="notifications-item-link"
              >
                <span
                  className={`notifications-item-icon notifications-item-icon--${n.kind}`}
                  aria-hidden="true"
                >
                  <Icon />
                </span>
                <span className="notifications-item-text">
                  <strong>{title}</strong>
                  <span className="notifications-item-body">{body}</span>
                  <span className="notifications-item-time">
                    {relativeTime(n.createdAt, t, language)}
                  </span>
                </span>
                {!n.isRead ? (
                  <span className="notifications-item-dot" aria-hidden="true" />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      )}
      <footer className="notifications-panel-footer">
        <Link
          href="/me/notifications"
          className="notifications-panel-view-all"
          onClick={closePanel}
        >
          {t.viewAll} →
        </Link>
      </footer>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => panel}
      open={open}
      onOpenChange={handleOpenChange}
      placement="bottomRight"
      trigger={["click"]}
    >
      <button
        type="button"
        className="notifications-trigger"
        aria-label={t.aria}
        title={t.aria}
      >
        <Badge
          className="notifications-badge"
          count={unread > 0 ? localizeDigits(unread, language) : 0}
          offset={[-2, 2]}
          showZero={false}
          color="#d2360b"
        >
          <BellOutlined />
        </Badge>
      </button>
    </Dropdown>
  );
}
