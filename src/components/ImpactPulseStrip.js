"use client";

// Community pulse strip — 4 hero KPIs at a glance, each linking to its
// filtered list page. Designed to live near a page hero (homepage,
// /events index) without dragging in a chart library.
//
// Aggregates pull from the demo arrays today; once /api/v1/public-reports
// ships, swap the useMemo for a fetch keyed off the same field names.

import {
  ArrowRightOutlined,
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
    eyebrow: "समुदायको नब्ज",
    intro: "अहिले मञ्चमा के-के चलिरहेको छ — एक नजरमा।",
    tiles: {
      live: { label: "अभियान लाइभ", hint: "हेर्नुहोस्" },
      upcoming: { label: "आउँदै", hint: "जोडिनुहोस्" },
      completed: { label: "सम्पन्न", hint: "प्रभाव हेर्नुहोस्" },
      issues: { label: "खुला समस्या", hint: "समर्थन गर्नुहोस्" }
    }
  },
  en: {
    eyebrow: "Community pulse",
    intro: "What's moving on the platform right now — at a glance.",
    tiles: {
      live: { label: "Live now", hint: "Watch" },
      upcoming: { label: "Upcoming", hint: "Join" },
      completed: { label: "Completed", hint: "See impact" },
      issues: { label: "Open issues", hint: "Support" }
    }
  }
};

export function ImpactPulseStrip({ language = "np" }) {
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
      value: counts.live,
      href: "/events?show=live",
      accent: "live"
    },
    {
      key: "upcoming",
      icon: RiseOutlined,
      value: counts.upcoming,
      href: "/events?show=upcoming",
      accent: "upcoming"
    },
    {
      key: "completed",
      icon: CheckCircleOutlined,
      value: counts.completed,
      href: "/impact",
      accent: "completed"
    },
    {
      key: "issues",
      icon: TeamOutlined,
      value: counts.issues,
      href: "/issues?status=OPEN",
      accent: "issues"
    }
  ];

  return (
    <section
      className="impact-pulse-strip"
      aria-labelledby="impact-pulse-strip-title"
    >
      <header className="impact-pulse-strip-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2 id="impact-pulse-strip-title">{t.intro}</h2>
      </header>
      <ul className="impact-pulse-strip-tiles">
        {tiles.map(({ key, icon: Icon, value, href, accent }) => {
          const labels = t.tiles[key];
          return (
            <li key={key} className={`impact-pulse-strip-tile pulse-${accent}`}>
              <Link
                href={href}
                className="impact-pulse-strip-tile-link"
                aria-label={`${labels.label}: ${value}. ${labels.hint}.`}
              >
                <span className="impact-pulse-strip-tile-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="impact-pulse-strip-tile-value">
                  {localizeDigits(value, language)}
                </span>
                <span className="impact-pulse-strip-tile-label">{labels.label}</span>
                <span className="impact-pulse-strip-tile-hint">
                  {labels.hint} <ArrowRightOutlined aria-hidden="true" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
