"use client";

// Topbar notifications bell (Phase 8 — UI-only, pre-backend).
//
// Demo notifications come from getDemoNotifications() in devMockData.
// Once the real `/notifications` endpoint lands, swap the useState seed
// for a useEffect + getJson("/notifications") call — the rest of the
// component (read-toggle, relative time, dropdown panel) carries over.
//
// `isRead` toggles live in component state so "Mark all read" has
// immediate effect, even though we're not persisting anywhere yet.

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
import { useMemo, useState } from "react";
import { getDemoNotifications } from "@/lib/devMockData";

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
  const seed = useMemo(() => getDemoNotifications(), []);
  const [items, setItems] = useState(seed);
  const [open, setOpen] = useState(false);

  if (!items || items.length === 0) return null;

  const unread = items.filter((n) => !n.isRead).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

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
                  setOpen(false);
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
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => panel}
      open={open}
      onOpenChange={setOpen}
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
          count={localizeDigits(unread, language)}
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
