"use client";

// /me/saved — every issue the user has bookmarked via the heart icon
// on PublicIssueCard, fetched from the local-storage-backed
// useSavedIssues hook. Bookmarks are stored as issue ids; each id is
// resolved to its real public issue (GET /issues/:id) so the row can
// show the issue's title and location, with a "remove" affordance.

import {
  ArrowRightOutlined,
  EnvironmentOutlined,
  HeartFilled
} from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getJson } from "@/lib/apiClient";
import { localizeIssue } from "@/lib/adminUtils";
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
    browseLink: "समस्याहरू हेर्ने",
    issueLabel: "समस्या",
    removeLabel: "बुकमार्क हटाउने",
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

  // Resolve each bookmarked id to its real public issue record. Failed
  // lookups (deleted issue, transient error) fall back to the raw id.
  const [issueMap, setIssueMap] = useState({});
  useEffect(() => {
    let cancelled = false;
    const currentIds = Array.from(saved);
    // Nothing to resolve when there are no bookmarks — the empty state
    // renders from `ids` directly, so stale map entries never show.
    if (currentIds.length === 0) return undefined;
    (async () => {
      const entries = await Promise.all(
        currentIds.map(async (id) => {
          try {
            const res = await getJson(`/issues/${id}`);
            const data = res?.data ?? res;
            return [id, data ? localizeIssue(data, language) : null];
          } catch {
            return [id, null];
          }
        })
      );
      if (!cancelled) setIssueMap(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [saved, language]);

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
          <EmptyState
            kind="no-saved"
            title={t.empty}
            cta={{ label: t.browseLink, href: "/issues" }}
          />
        ) : (
          <ul className="saved-list">
            {ids.map((id) => {
              const meta = issueMap[id];
              return (
                <li key={id} className="saved-row">
                  <Link href={`/issues/${meta?.slug ?? id}`} className="saved-row-link">
                    <span className="saved-row-label">{t.issueLabel}</span>
                    <strong className="saved-row-title">
                      {meta?.title || id}
                    </strong>
                    {meta?.addressText ? (
                      <span className="saved-row-address">
                        <EnvironmentOutlined aria-hidden="true" /> {meta.addressText}
                      </span>
                    ) : null}
                  </Link>
                  <div className="saved-row-actions">
                    <Link href={`/issues/${meta?.slug ?? id}`} className="saved-row-view">
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
              );
            })}
          </ul>
        )}
      </section>
    </SiteShell>
  );
}
