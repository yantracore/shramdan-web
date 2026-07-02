"use client";

// /changelog — vertical timeline of platform releases. Hand-curated
// entries; each has a date, version, headline, and a few bullets in
// {added, improved, fixed} groups. No backend.

import {
  BugOutlined,
  PlusCircleOutlined,
  RiseOutlined,
  StarFilled
} from "@ant-design/icons";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

const ENTRIES = [
  {
    version: "0.29.0",
    date: "2026-06-02",
    headline: { np: "ठूलो UI-completion sweep", en: "Large UI-completion sweep" },
    added: [
      { np: "OTP बाट सदस्यता", en: "Phone + OTP membership flow" },
      { np: "सूचना घण्टी + drop-down inbox", en: "Notifications bell + inbox" },
      { np: "अघि र पछि स्लाइडर", en: "Before/after slider" },
      { np: "/me/preview, /impact, /leaderboard, /calendar, /stories, /help, /donate, /resources, /changelog", en: "/me/preview, /impact, /leaderboard, /calendar, /stories, /help, /donate, /resources, /changelog" },
      { np: "Cmd+K खोज", en: "Cmd+K command palette" },
      { np: "तल mobile nav", en: "Mobile bottom nav" }
    ],
    improved: [
      { np: "साइट-व्यापी page transitions", en: "Site-wide page transitions" },
      { np: "हृदय बटन र बुकमार्क store", en: "Bookmark heart on cards" }
    ],
    fixed: [
      { np: "मिति pill NP मा Devanagari", en: "Date pill Devanagari numerals in NP" },
      { np: "/events title flash", en: "/events title flash on demo IDs" }
    ]
  },
  {
    version: "0.27.0",
    date: "2026-05-30",
    headline: { np: "Light-mode र a11y polish", en: "Light-mode + a11y polish" },
    added: [
      { np: "Skip-to-main link", en: "Skip-to-main link" },
      { np: "Scroll progress bar", en: "Scroll progress bar" }
    ],
    improved: [
      { np: "Devanagari line-height", en: "Devanagari line-height baseline" },
      { np: "Issue card alt fallback", en: "Issue card alt fallback chain" }
    ],
    fixed: [
      { np: "Leaflet pin accessible name", en: "Leaflet pin missing accessible name" },
      { np: "Sticky action bar focus trap", en: "Sticky action bar tab-reach when hidden" }
    ]
  },
  {
    version: "0.25.0",
    date: "2026-05-28",
    headline: { np: "अभियान विवरण + roster", en: "Event detail + roster" },
    added: [
      { np: "Roster panel — कसले कसले जोडिँदै", en: "Roster panel — who's joining" },
      { np: "Big live viewer counter", en: "Big live viewer counter" },
      { np: "दिनको आवाज (testimonials)", en: "Voices from the day (testimonials)" }
    ]
  },
  {
    version: "0.22.0",
    date: "2026-05-26",
    headline: { np: "लाइभ रेल + Netflix hover", en: "Live rail + Netflix hover" },
    added: [
      { np: "Home लाइभ events rail", en: "Home live events rail" },
      { np: "Hover preview on event cards", en: "Hover preview on event cards" }
    ]
  },
  {
    version: "0.20.0",
    date: "2026-05-21",
    headline: { np: "Cinematic intro + design tokens", en: "Cinematic intro + design tokens" },
    added: [
      { np: "/intro GSAP scrollable story", en: "/intro GSAP scrollable story" },
      { np: "Design-token foundation", en: "Design-token foundation" }
    ]
  }
];

const COPY = {
  np: {
    pageTitle: "रिलिज नोट",
    eyebrow: "के नयाँ",
    title: "श्रमदानको विकास इतिहास",
    intro:
      "हरेक रिलिजमा थपिएको, सुधारिएको र समाधान भएको — पारदर्शी रूपमा।",
    added: "थपियो",
    improved: "सुधारियो",
    fixed: "समाधान"
  },
  en: {
    pageTitle: "Changelog",
    eyebrow: "What's new",
    title: "Shramdan release history",
    intro:
      "What got added, improved, and fixed in each release — out in the open.",
    added: "Added",
    improved: "Improved",
    fixed: "Fixed"
  }
};

function formatDate(iso, language) {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(d);
  } catch {
    return iso;
  }
}

const GROUP_META = {
  added: { icon: PlusCircleOutlined, kind: "added" },
  improved: { icon: RiseOutlined, kind: "improved" },
  fixed: { icon: BugOutlined, kind: "fixed" }
};

export default function ChangelogPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section changelog-section">
        <header className="changelog-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <ol className="changelog-list">
          {ENTRIES.map((entry, i) => (
            <li key={entry.version} className="changelog-entry">
              <div className="changelog-spine" aria-hidden="true">
                <span className="changelog-dot">
                  {i === 0 ? <StarFilled /> : null}
                </span>
              </div>
              <article className="changelog-card">
                <header className="changelog-card-head">
                  <span className="changelog-version">v{entry.version}</span>
                  <time>{formatDate(entry.date, language)}</time>
                </header>
                <h2 className="changelog-headline">
                  {entry.headline[language] || entry.headline.np}
                </h2>
                {["added", "improved", "fixed"].map((group) => {
                  const items = entry[group];
                  if (!items?.length) return null;
                  const meta = GROUP_META[group];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={group}
                      className={`changelog-group changelog-group--${meta.kind}`}
                    >
                      <span className="changelog-group-label">
                        <Icon aria-hidden="true" /> {t[group]}
                      </span>
                      <ul>
                        {items.map((it, k) => (
                          <li key={k}>{it[language] || it.np}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </article>
            </li>
          ))}
        </ol>
      </section>
    </SiteShell>
  );
}
