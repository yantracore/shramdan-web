"use client";

import { CheckCircleFilled, ClockCircleOutlined, RiseOutlined } from "@ant-design/icons";
import Link from "next/link";
import { Progress } from "antd";
import { usePreferences } from "@/app/providers";

const COPY = {
  np: {
    eyebrow: "हाम्रो काम सार्वजनिक",
    title: "श्रमदान विकासको प्रगति",
    intro:
      "वेबसाइट कसरी बनिँदै छ — कुन फेज सकियो, के चलिरहेको छ, र अगाडि के आउँदै छ। पूरा रोडम्याप GitHub मा उपलब्ध छ।",
    overallLabel: "कुल प्रगति",
    phasesHeading: "फेज अनुसार प्रगति",
    inProgressHeading: "अहिले काम भइरहेको",
    recentlyDoneHeading: "हालै सम्पन्न",
    upcomingHeading: "अघाडि आउँदै",
    inProgressEmpty: "अहिले कुनै फेजमा active काम छैन।",
    recentlyDoneEmpty: "विगत १४ दिनमा कुनै फेज सम्पन्न भएन।",
    upcomingEmpty: "सबै लीफ सकिएको छ।",
    githubLink: "GitHub मा पूर्ण रोडम्याप हेर्नुहोस्",
    phaseLabel: "फेज {n}"
  },
  en: {
    eyebrow: "Built in public",
    title: "Shramdan development progress",
    intro:
      "What's shipped, what's in progress, what's coming next. The full roadmap is hosted on GitHub.",
    overallLabel: "Overall progress",
    phasesHeading: "By phase",
    inProgressHeading: "In progress now",
    recentlyDoneHeading: "Recently shipped",
    upcomingHeading: "Coming up",
    inProgressEmpty: "No active work right now.",
    recentlyDoneEmpty: "Nothing shipped in the last 14 days.",
    upcomingEmpty: "Everything's done.",
    githubLink: "View the full roadmap on GitHub",
    phaseLabel: "Phase {n}"
  }
};

const GITHUB_ROADMAP_URL =
  "https://github.com/yantracore/shramdan-web/blob/staging/docs/ops/00-master-roadmap.md";

function formatDate(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric"
    }).format(date);
  } catch {
    return iso;
  }
}

export function DevelopmentClient({ summary }) {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const { overallPercent, phases, inProgress, upcoming, recentlyDone } = summary || {};

  return (
    <section className="development-page page-section">
      <header className="development-hero">
        <span className="eyebrow">{t.eyebrow}</span>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </header>

      <div className="development-overall">
        <div className="development-overall-meta">
          <span className="development-overall-label">{t.overallLabel}</span>
          <strong className="development-overall-value">{overallPercent ?? 0}%</strong>
        </div>
        <Progress
          percent={overallPercent ?? 0}
          strokeColor="var(--primary)"
          showInfo={false}
        />
      </div>

      <section
        className="development-phases"
        aria-labelledby="development-phases-title"
      >
        <h2 id="development-phases-title">{t.phasesHeading}</h2>
        <ul className="development-phase-grid">
          {(phases || []).map((phase) => (
            <li key={phase.number} className="development-phase-tile">
              <div className="development-phase-tile-head">
                <span className="development-phase-num">
                  {t.phaseLabel.replace("{n}", phase.number)}
                </span>
                <strong className="development-phase-percent">{phase.percent}%</strong>
              </div>
              <p className="development-phase-title">{phase.title}</p>
              <Progress
                percent={phase.percent}
                strokeColor={phase.percent === 100 ? "#2e7d32" : "var(--primary)"}
                showInfo={false}
                size="small"
              />
            </li>
          ))}
        </ul>
      </section>

      <section
        className="development-lane development-lane-active"
        aria-labelledby="development-active-title"
      >
        <h2 id="development-active-title">
          <ClockCircleOutlined aria-hidden="true" /> {t.inProgressHeading}
        </h2>
        {(!inProgress || inProgress.length === 0) ? (
          <p className="development-empty">{t.inProgressEmpty}</p>
        ) : (
          <ul className="development-leaf-list">
            {inProgress.map((leaf) => (
              <li key={leaf.id} className="development-leaf development-leaf-active">
                <span className="development-leaf-id">{leaf.id}</span>
                <span className="development-leaf-label">{leaf.label}</span>
                <span className="development-leaf-phase">
                  {t.phaseLabel.replace("{n}", leaf.phaseNumber)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="development-lane development-lane-done"
        aria-labelledby="development-done-title"
      >
        <h2 id="development-done-title">
          <CheckCircleFilled aria-hidden="true" /> {t.recentlyDoneHeading}
        </h2>
        {(!recentlyDone || recentlyDone.length === 0) ? (
          <p className="development-empty">{t.recentlyDoneEmpty}</p>
        ) : (
          <ul className="development-leaf-list">
            {recentlyDone.map((leaf) => (
              <li key={leaf.id} className="development-leaf development-leaf-done">
                <span className="development-leaf-id">{leaf.id}</span>
                <span className="development-leaf-label">{leaf.label}</span>
                <span className="development-leaf-date">
                  {formatDate(leaf.doneAt, language)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="development-lane development-lane-upcoming"
        aria-labelledby="development-upcoming-title"
      >
        <h2 id="development-upcoming-title">
          <RiseOutlined aria-hidden="true" /> {t.upcomingHeading}
        </h2>
        {(!upcoming || upcoming.length === 0) ? (
          <p className="development-empty">{t.upcomingEmpty}</p>
        ) : (
          <ul className="development-leaf-list">
            {upcoming.slice(0, 12).map((leaf) => (
              <li key={leaf.id} className="development-leaf">
                <span className="development-leaf-id">{leaf.id}</span>
                <span className="development-leaf-label">{leaf.label}</span>
                <span className="development-leaf-phase">
                  {t.phaseLabel.replace("{n}", leaf.phaseNumber)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="development-github">
        <a href={GITHUB_ROADMAP_URL} target="_blank" rel="noreferrer">
          {t.githubLink} →
        </a>
      </aside>
    </section>
  );
}
