"use client";

// /me/saved — every issue the user has bookmarked via the heart icon
// on PublicIssueCard, fetched from the local-storage-backed
// useSavedIssues hook. Uses dummy issues from /issues fetch in dev;
// since we have no per-id mock, we render simple link rows with the
// issue id and a "remove" affordance.

import { ArrowRightOutlined, HeartFilled, HeartOutlined } from "@ant-design/icons";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { useSavedIssues } from "@/lib/useSavedIssues";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    pageTitle: "तपाईंले बुकमार्क गरेका",
    eyebrow: "बचत",
    title: "तपाईंले हेर्न मन गर्नुभएका समस्याहरू",
    intro:
      "/issues पृष्ठका कार्डहरूको हृदय बटनबाट बुकमार्क गरिएका समस्याहरू यहाँ देखिन्छन्। यो सूची तपाईंको ब्राउजरमा मात्र राखिएको छ।",
    empty:
      "अहिले कुनै बुकमार्क छैन। /issues मा कुनै समस्याको कार्डमा हृदय बटन थिच्नुहोस्।",
    browseLink: "समस्याहरू हेर्नुहोस्",
    issueLabel: "समस्या",
    removeLabel: "बुकमार्क हटाउनुहोस्",
    viewLabel: "विवरण",
    countLabel: "बुकमार्क"
  },
  en: {
    pageTitle: "Your bookmarks",
    eyebrow: "Saved",
    title: "Issues you've kept an eye on",
    intro:
      "Issues you've bookmarked from the heart button on the /issues page. This list lives in your browser only.",
    empty:
      "No bookmarks yet. Tap the heart on any issue card under /issues.",
    browseLink: "Browse issues",
    issueLabel: "Issue",
    removeLabel: "Remove bookmark",
    viewLabel: "View",
    countLabel: "saved"
  }
};

export default function MeSavedPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const { saved, toggle, count } = useSavedIssues();
  const ids = Array.from(saved);

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section saved-section">
        <header className="saved-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
          <span className="saved-count">
            <HeartFilled aria-hidden="true" />{" "}
            <strong>{localizeDigits(count, language)}</strong> {t.countLabel}
          </span>
        </header>

        {ids.length === 0 ? (
          <article className="saved-empty content-card">
            <span aria-hidden="true" className="saved-empty-heart">
              <HeartOutlined />
            </span>
            <p>{t.empty}</p>
            <Link href="/issues" className="saved-empty-cta">
              {t.browseLink} <ArrowRightOutlined />
            </Link>
          </article>
        ) : (
          <ul className="saved-list">
            {ids.map((id) => (
              <li key={id} className="saved-row">
                <Link href={`/issues/${id}`} className="saved-row-link">
                  <span className="saved-row-label">{t.issueLabel}</span>
                  <strong>{id}</strong>
                </Link>
                <div className="saved-row-actions">
                  <Link href={`/issues/${id}`} className="saved-row-view">
                    {t.viewLabel} <ArrowRightOutlined />
                  </Link>
                  <button
                    type="button"
                    className="saved-row-remove"
                    onClick={() => toggle(id)}
                    aria-label={t.removeLabel}
                    title={t.removeLabel}
                  >
                    <HeartFilled />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
