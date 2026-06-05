"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  FlagOutlined,
  LikeOutlined,
  RiseOutlined,
  TeamOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDemoIssues,
  getDemoLiveEvents,
  getDemoPastEvents,
  getDemoUpcomingEvents
} from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// Eased count-up from 0 → target over `duration` ms. Honors
// prefers-reduced-motion by snapping straight to the final value.
function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return target;
    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduced ? target : 0;
  });
  const startedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return undefined;
    }
    if (!Number.isFinite(target)) {
      setValue(0);
      return undefined;
    }
    startedRef.current = true;
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration]);

  return value;
}

function StatChipValue({ target, language }) {
  const value = useCountUp(target);
  return (
    <span className="activity-stat-chip-value">
      {localizeDigits(value, language)}
    </span>
  );
}

const COPY = {
  np: {
    events: {
      ariaLabel: "अभियानको झलक",
      live: "लाइभ",
      upcoming: "आउँदै",
      completed: "सम्पन्न",
      participants: "सहभागी"
    },
    issues: {
      ariaLabel: "समस्याको झलक",
      open: "खुला",
      scheduled: "तालिका मिल्यो",
      completed: "समाधान",
      votes: "मत"
    }
  },
  en: {
    events: {
      ariaLabel: "Event glance",
      live: "Live",
      upcoming: "Upcoming",
      completed: "Completed",
      participants: "Participants"
    },
    issues: {
      ariaLabel: "Issue glance",
      open: "Open",
      scheduled: "Scheduled",
      completed: "Resolved",
      votes: "Votes"
    }
  }
};

function eventsTiles(t) {
  const live = getDemoLiveEvents();
  const upcoming = getDemoUpcomingEvents();
  const past = getDemoPastEvents();
  const participants = [...live, ...upcoming, ...past].reduce(
    (sum, e) => sum + (Number(e?.participantCount) || 0),
    0
  );
  return [
    {
      key: "live",
      icon: ThunderboltOutlined,
      label: t.live,
      value: live.length,
      href: "/events?show=live"
    },
    {
      key: "upcoming",
      icon: RiseOutlined,
      label: t.upcoming,
      value: upcoming.length,
      href: "/events?show=upcoming"
    },
    {
      key: "completed",
      icon: CheckCircleOutlined,
      label: t.completed,
      value: past.length,
      href: "/events?show=past"
    },
    {
      key: "participants",
      icon: TeamOutlined,
      label: t.participants,
      value: participants,
      href: "/impact"
    }
  ];
}

function issuesTiles(t) {
  const issues = getDemoIssues();
  const byStatus = (status) => issues.filter((i) => i?.status === status).length;
  const votes = issues.reduce(
    (sum, i) => sum + (Number(i?.voteCount) || 0),
    0
  );
  return [
    {
      key: "open",
      icon: FlagOutlined,
      label: t.open,
      value: byStatus("OPEN"),
      href: "/issues?status=OPEN"
    },
    {
      key: "scheduled",
      icon: CalendarOutlined,
      label: t.scheduled,
      value: byStatus("EVENT_SCHEDULED"),
      href: "/issues?status=EVENT_SCHEDULED"
    },
    {
      key: "completed",
      icon: CheckCircleOutlined,
      label: t.completed,
      value: byStatus("COMPLETED"),
      href: "/issues?status=COMPLETED"
    },
    {
      key: "votes",
      icon: LikeOutlined,
      label: t.votes,
      value: votes,
      href: "/issues"
    }
  ];
}

export function ActivityStatsRow({ language = "np", variant = "events" }) {
  const t =
    (COPY[language] && COPY[language][variant]) ||
    COPY.np[variant] ||
    COPY.np.events;

  const tiles = useMemo(
    () => (variant === "issues" ? issuesTiles(t) : eventsTiles(t)),
    [variant, t]
  );

  return (
    <ul
      className={`activity-stats-row variant-${variant}`}
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
            <StatChipValue target={value} language={language} />
            <span className="activity-stat-chip-label">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
