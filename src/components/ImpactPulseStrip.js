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
import { useEffect, useState } from "react";
import { listAllEvents } from "@/lib/eventsApi";
import { getJson } from "@/lib/apiClient";
import { getListItems } from "@/lib/adminUtils";

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
      live: { label: "चलिरहेको", hint: "हेर्ने" },
      upcoming: { label: "मिति तय", hint: "जोडिने" },
      completed: { label: "सम्पन्न", hint: "प्रभाव हेर्ने" },
      issues: { label: "खुला", hint: "समर्थन गर्ने" }
    }
  },
  en: {
    eyebrow: "Community pulse",
    intro: "What's moving on the platform right now — at a glance.",
    tiles: {
      live: { label: "Ongoing", hint: "Watch" },
      upcoming: { label: "Scheduled", hint: "Join" },
      completed: { label: "Complete", hint: "See impact" },
      issues: { label: "Open", hint: "Support" }
    }
  }
};

export function ImpactPulseStrip({ language = "np" }) {
  const t = COPY[language] || COPY.np;

  const [counts, setCounts] = useState({ live: 0, upcoming: 0, completed: 0, issues: 0 });
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [buckets, issuesRes] = await Promise.all([
          listAllEvents({ language }),
          getJson("/issues", { params: { status: "OPEN", limit: 50 } })
        ]);
        if (cancelled) return;
        setCounts({
          live: buckets.active.length,
          upcoming: buckets.scheduled.length,
          completed: buckets.completed.length,
          issues: getListItems(issuesRes).length
        });
      } catch {
        if (!cancelled) setCounts({ live: 0, upcoming: 0, completed: 0, issues: 0 });
      }
    })();
    return () => { cancelled = true; };
  }, [language]);

  const tiles = [
    {
      key: "live",
      icon: ThunderboltOutlined,
      value: counts.live,
      href: "/campaign?status=ACTIVE",
      accent: "live"
    },
    {
      key: "upcoming",
      icon: RiseOutlined,
      value: counts.upcoming,
      href: "/campaign?status=SCHEDULED",
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
      href: "/campaign?status=OPEN",
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
