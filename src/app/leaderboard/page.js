"use client";

// /leaderboard — community top contributors. Three tabs: supporters
// (most issues voted on), participants (most events joined), organizers
// (most events convened). Backed by DEMO_LEADERBOARD until a real
// /reports/leaderboard endpoint lands.

import { CrownFilled, LikeOutlined, TeamOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getDemoLeaderboard } from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function initialOf(name) {
  if (!name) return "—";
  return Array.from(name.trim())[0] || "—";
}

const TABS = ["supporters", "participants", "organizers"];

const COPY = {
  np: {
    pageTitle: "लीडरबोर्ड",
    eyebrow: "समुदायका योगदानकर्ता",
    title: "मञ्चलाई अघि बढाउने हातहरू",
    intro:
      "अहिलेसम्मको योगदान — समर्थन, सहभागिता र संयोजन तीनै कोणबाट। श्रमदान सामूहिक हो, तर अघि बढाउनेहरू सबैले देखोस्।",
    tabs: {
      supporters: "समर्थक",
      participants: "सहभागी",
      organizers: "संयोजक"
    },
    metric: {
      supporters: "समर्थन",
      participants: "अभियान",
      organizers: "अभियान संयोजन"
    },
    icon: {
      supporters: LikeOutlined,
      participants: TeamOutlined,
      organizers: ThunderboltOutlined
    },
    rankLabel: "स्थान",
    nameLabel: "नाम",
    cityLabel: "स्थान",
    metricLabel: "गणना",
    footnote: "श्रमदान सामूहिक मञ्च — कुनै प्रतिस्पर्धा होइन, अब्बल देखाउन मात्र।"
  },
  en: {
    pageTitle: "Leaderboard",
    eyebrow: "Community contributors",
    title: "The hands moving the platform",
    intro:
      "Contributions so far — by support, by participation, and by organizing. Shramdan is collective, but the people pushing it forward deserve to be seen.",
    tabs: {
      supporters: "Supporters",
      participants: "Participants",
      organizers: "Organizers"
    },
    metric: {
      supporters: "supports",
      participants: "events",
      organizers: "events convened"
    },
    icon: {
      supporters: LikeOutlined,
      participants: TeamOutlined,
      organizers: ThunderboltOutlined
    },
    rankLabel: "Rank",
    nameLabel: "Name",
    cityLabel: "City",
    metricLabel: "Count",
    footnote: "Shramdan is a collective platform — not a competition, just credit where it's due."
  }
};

export default function LeaderboardPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const [tab, setTab] = useState("supporters");
  const data = useMemo(() => getDemoLeaderboard(), []);
  const rows = data[tab] || [];
  const TabIcon = t.icon[tab];

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="leaderboard-section page-section">
        <header className="leaderboard-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <div
          className="leaderboard-tabs"
          role="tablist"
          aria-label={t.pageTitle}
        >
          {TABS.map((key) => {
            const Icon = t.icon[key];
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                className={`leaderboard-tab${active ? " is-active" : ""}`}
                onClick={() => setTab(key)}
              >
                <Icon aria-hidden="true" />
                <span>{t.tabs[key]}</span>
              </button>
            );
          })}
        </div>

        <ol className="leaderboard-list">
          {rows.map((row, idx) => {
            const rank = idx + 1;
            const topThree = rank <= 3;
            return (
              <li
                key={`${tab}-${row.name}-${idx}`}
                className={`leaderboard-row${topThree ? ` leaderboard-row-top leaderboard-row-rank-${rank}` : ""}`}
              >
                <span className="leaderboard-rank" aria-label={`${t.rankLabel} ${rank}`}>
                  {topThree ? <CrownFilled /> : null}
                  {localizeDigits(rank, language)}
                </span>
                <span className="leaderboard-avatar" aria-hidden="true">
                  {initialOf(row.name)}
                </span>
                <span className="leaderboard-identity">
                  <strong>{row.name}</strong>
                  <span>{row.city}</span>
                </span>
                {row.badge ? (
                  <span className="leaderboard-badge" aria-hidden="true">
                    {row.badge}
                  </span>
                ) : null}
                <span className="leaderboard-metric">
                  <strong>{localizeDigits(row.metric, language)}</strong>
                  <em>
                    <TabIcon aria-hidden="true" /> {t.metric[tab]}
                  </em>
                </span>
              </li>
            );
          })}
        </ol>

        <p className="leaderboard-footnote">{t.footnote}</p>
      </section>
    </SiteShell>
  );
}
