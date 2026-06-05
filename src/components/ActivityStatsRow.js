"use client";

import {
  CheckCircleOutlined,
  RiseOutlined,
  TeamOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useMemo } from "react";
import {
  getDemoLiveEvents,
  getDemoPastEvents,
  getDemoPublicIssues,
  getDemoUpcomingEvents
} from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    ariaLabel: "अहिलेको गतिविधि",
    live: "लाइभ",
    upcoming: "आउँदै",
    completed: "सम्पन्न",
    issues: "खुला समस्या"
  },
  en: {
    ariaLabel: "Activity at a glance",
    live: "Live",
    upcoming: "Upcoming",
    completed: "Completed",
    issues: "Open issues"
  }
};

export function ActivityStatsRow({ language = "np" }) {
  const t = COPY[language] || COPY.np;

  const counts = useMemo(
    () => ({
      live: getDemoLiveEvents().length,
      upcoming: getDemoUpcomingEvents().length,
      completed: getDemoPastEvents().length,
      issues: getDemoPublicIssues().length
    }),
    []
  );

  const tiles = [
    {
      key: "live",
      icon: ThunderboltOutlined,
      label: t.live,
      value: counts.live,
      href: "/events?show=live"
    },
    {
      key: "upcoming",
      icon: RiseOutlined,
      label: t.upcoming,
      value: counts.upcoming,
      href: "/events?show=upcoming"
    },
    {
      key: "completed",
      icon: CheckCircleOutlined,
      label: t.completed,
      value: counts.completed,
      href: "/events?show=past"
    },
    {
      key: "issues",
      icon: TeamOutlined,
      label: t.issues,
      value: counts.issues,
      href: "/issues?status=OPEN"
    }
  ];

  return (
    <ul
      className="activity-stats-row"
      role="list"
      aria-label={t.ariaLabel}
    >
      {tiles.map(({ key, icon: Icon, label, value, href }) => (
        <li key={key} className={`activity-stat-chip stat-${key}`}>
          <Link
            href={href}
            className="activity-stat-chip-link"
            aria-label={`${label}: ${value}`}
          >
            <span className="activity-stat-chip-icon" aria-hidden="true">
              <Icon />
            </span>
            <span className="activity-stat-chip-value">
              {localizeDigits(value, language)}
            </span>
            <span className="activity-stat-chip-label">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
