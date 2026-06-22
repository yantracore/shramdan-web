"use client";

// /me/notifications — full inbox page that mirrors NotificationsBell's
// dropdown but with tabs, larger cards, and a Mark-all-read button. Reads from
// the app-wide notifications store (NotificationsProvider), so it shares the
// same live feed, unread count, and optimistic read-state with the topbar bell
// and updates in real time as SSE events arrive.

import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  LikeOutlined,
  PlayCircleOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Empty } from "antd";
import Link from "next/link";
import { useState } from "react";
import { NotificationChannelPrefs } from "@/components/NotificationChannelPrefs";
import { useNotifications } from "@/components/NotificationsProvider";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

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
    pageTitle: "सूचनाहरू",
    heading: "सूचनाहरू",
    intro:
      "तपाईंका सबै अभियान, समस्या र समर्थन सम्बन्धी सूचना यहाँ देख्न सकिन्छ।",
    tabs: {
      all: "सबै",
      unread: "नपढिएका",
      read: "पढिएका"
    },
    unreadCount: "{n} नयाँ",
    markAll: "सबै पढिएको चिन्ह लगाउनुहोस्",
    visit: "विवरण हेर्नुहोस्",
    emptyAll: "अहिलेसम्म कुनै सूचना छैन।",
    emptyUnread: "कुनै नयाँ सूचना छैन।",
    emptyRead: "कुनै पढिएको सूचना छैन।",
    minutesAgo: "{n} मि. अघि",
    hoursAgo: "{n} घण्टा अघि",
    daysAgo: "{n} दिन अघि",
    justNow: "अहिले"
  },
  en: {
    pageTitle: "Notifications",
    heading: "Notifications",
    intro:
      "Every campaign, issue, and support update for you lives here.",
    tabs: {
      all: "All",
      unread: "Unread",
      read: "Read"
    },
    unreadCount: "{n} new",
    markAll: "Mark all as read",
    visit: "View",
    emptyAll: "No notifications yet.",
    emptyUnread: "You're all caught up.",
    emptyRead: "No read notifications yet.",
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

export default function NotificationsInboxPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [tab, setTab] = useState("all");

  const visible = items.filter((n) => {
    if (tab === "unread") return !n.isRead;
    if (tab === "read") return n.isRead;
    return true;
  });

  const emptyMessage =
    tab === "unread"
      ? t.emptyUnread
      : tab === "read"
        ? t.emptyRead
        : t.emptyAll;

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section notifications-inbox-section">
        <header className="notifications-inbox-head">
          <div className="notifications-inbox-titles">
            <h1>{t.heading}</h1>
            <p>{t.intro}</p>
          </div>
          <div className="notifications-inbox-meta">
            {unreadCount > 0 ? (
              <span className="notifications-inbox-unread-pill">
                {t.unreadCount.replace(
                  "{n}",
                  localizeDigits(unreadCount, language)
                )}
              </span>
            ) : null}
            {unreadCount > 0 ? (
              <button
                type="button"
                className="notifications-inbox-mark-all"
                onClick={markAllRead}
              >
                {t.markAll}
              </button>
            ) : null}
          </div>
        </header>

        <div
          className="notifications-inbox-tabs"
          role="tablist"
          aria-label={t.heading}
        >
          {["all", "unread", "read"].map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`notifications-inbox-tab${tab === key ? " is-active" : ""}`}
              onClick={() => setTab(key)}
            >
              {t.tabs[key]}
              {key === "unread" && unreadCount > 0 ? (
                <span className="notifications-inbox-tab-count">
                  {localizeDigits(unreadCount, language)}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="notifications-inbox-empty">
            <Empty description={emptyMessage} />
          </div>
        ) : (
          <ul className="notifications-inbox-list" role="list">
            {visible.map((n) => {
              const Icon = KIND_ICON[n.kind] || BellOutlined;
              const title = n.title?.[language] || n.title?.np || "";
              const body = n.body?.[language] || n.body?.np || "";
              return (
                <li
                  key={n.id}
                  className={`notifications-inbox-item${n.isRead ? "" : " is-unread"}`}
                >
                  <span
                    className={`notifications-inbox-item-icon notifications-item-icon--${n.kind}`}
                    aria-hidden="true"
                  >
                    <Icon />
                  </span>
                  <div className="notifications-inbox-item-text">
                    <strong>{title}</strong>
                    <span className="notifications-inbox-item-body">{body}</span>
                    <span className="notifications-inbox-item-time">
                      {relativeTime(n.createdAt, t, language)}
                    </span>
                  </div>
                  <div className="notifications-inbox-item-actions">
                    {!n.isRead ? (
                      <span
                        className="notifications-inbox-item-dot"
                        aria-hidden="true"
                      />
                    ) : null}
                    {n.href ? (
                      <Link
                        href={n.href}
                        onClick={() => markRead(n.id)}
                        className="notifications-inbox-item-cta"
                      >
                        {t.visit} →
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <NotificationChannelPrefs language={language} />
      </section>
    </SiteShell>
  );
}
