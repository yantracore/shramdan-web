"use client";

// Phase 7 v0 — public member profile at /members/[slug].
// Reads from src/lib/discussionsStub.js. The contract lives in
// docs/api-requirements/members.md under "Public profile (Phase 7)".

import { ArrowLeftOutlined, EnvironmentOutlined, CalendarOutlined } from "@ant-design/icons";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";
import { getMemberPublicProfile } from "@/lib/discussionsStub";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const NP_MONTHS = ["जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन", "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function formatMemberSince(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (language === "np") {
    return `${NP_MONTHS[date.getMonth()]} ${localizeDigits(date.getFullYear(), "np")}`;
  }
  try {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function formatRelative(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 60) {
    if (language === "np") return `${localizeDigits(Math.max(1, diffMin), "np")} मि. अघि`;
    return `${Math.max(1, diffMin)}m ago`;
  }
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) {
    if (language === "np") return `${localizeDigits(diffHr, "np")} घन्टा अघि`;
    return `${diffHr}h ago`;
  }
  const diffDay = Math.round(diffHr / 24);
  if (language === "np") return `${localizeDigits(diffDay, "np")} दिन अघि`;
  return `${diffDay}d ago`;
}

export default function MemberProfilePage({ params }) {
  const { slug } = use(params);
  const { language } = usePreferences();
  const t = (copy[language] && copy[language].memberProfile) || copy.np.memberProfile;
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await getMemberPublicProfile(slug);
        if (cancelled) return;
        setProfile(row);
      } catch {
        if (cancelled) return;
        setProfile(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!loaded) {
    return (
      <SiteShell pageTitle="Member">
        <section className="page-section member-profile-section" aria-busy="true" />
      </SiteShell>
    );
  }

  if (!profile) {
    return (
      <SiteShell pageTitle="Member">
        <section className="page-section member-profile-section">
          <p>{t.profileDisabled}</p>
          <Link href="/discussions" className="member-profile-back">
            <ArrowLeftOutlined aria-hidden="true" /> {t.backToList}
          </Link>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell pageTitle={profile.displayName}>
      <section className="page-section member-profile-section">
        <Link href="/discussions" className="member-profile-back">
          <ArrowLeftOutlined aria-hidden="true" /> {t.backToList}
        </Link>

        <header className="member-profile-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <div className="member-profile-identity">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="member-profile-avatar" />
            ) : (
              <span className="member-profile-avatar member-profile-avatar--initials" aria-hidden="true">
                {(profile.displayName || "?").slice(0, 1)}
              </span>
            )}
            <div className="member-profile-identity-text">
              <h1>{profile.displayName}</h1>
              {profile.bio ? <p className="member-profile-bio">{profile.bio}</p> : null}
              <div className="member-profile-meta">
                {profile.city ? (
                  <span><EnvironmentOutlined aria-hidden="true" /> {profile.city}</span>
                ) : null}
                {profile.memberSince ? (
                  <span><CalendarOutlined aria-hidden="true" /> {t.memberSinceLabel} {formatMemberSince(profile.memberSince, language)}</span>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="member-profile-stats">
          <div className="member-profile-stat">
            <strong>{localizeDigits(profile.supportedIssueCount ?? 0, language)}</strong>
            <span>{t.stats?.supported}</span>
          </div>
          <div className="member-profile-stat">
            <strong>{localizeDigits(profile.participatedEventCount ?? 0, language)}</strong>
            <span>{t.stats?.participated}</span>
          </div>
          {profile.leaderNominationCount ? (
            <div className="member-profile-stat">
              <strong>{localizeDigits(profile.leaderNominationCount, language)}</strong>
              <span>{t.stats?.nominated}</span>
            </div>
          ) : null}
          <div className="member-profile-stat">
            <strong>{localizeDigits(profile.discussionsStartedCount ?? 0, language)}</strong>
            <span>{t.stats?.discussions}</span>
          </div>
          {profile.featureProposalsCount ? (
            <div className="member-profile-stat">
              <strong>{localizeDigits(profile.featureProposalsCount, language)}</strong>
              <span>{t.stats?.proposals}</span>
            </div>
          ) : null}
        </div>

        {profile.publicLanes && profile.publicLanes.length > 0 ? (
          <section className="member-profile-lanes" aria-label={t.lanesLabel}>
            <h2>{t.lanesLabel}</h2>
            <ul>
              {profile.publicLanes.map((lane) => (
                <li key={lane} className="member-profile-lane">
                  {t.laneNames?.[lane] || lane}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile.recentActivity && profile.recentActivity.length > 0 ? (
          <section className="member-profile-activity" aria-label={t.sections?.recentActivity}>
            <h2>{t.sections?.recentActivity}</h2>
            <ul>
              {profile.recentActivity.map((entry, index) => {
                const kindLabel = t.activityKinds?.[entry.kind] || entry.kind;
                const targetHref = entry.target?.kind === "discussion"
                  ? `/discussions/${entry.target.slug ?? entry.target.id}`
                  : entry.target?.kind === "event"
                    ? `/events/${entry.target.slug ?? entry.target.id}`
                    : entry.target?.kind === "issue"
                      ? `/issues/${entry.target.slug ?? entry.target.id}`
                      : null;
                return (
                  <li key={`${entry.kind}-${entry.target?.id ?? index}`} className="member-profile-activity-row">
                    <span className="member-profile-activity-kind">{kindLabel}</span>
                    {targetHref ? (
                      <Link href={targetHref}>{entry.target?.title}</Link>
                    ) : (
                      <span>{entry.target?.title}</span>
                    )}
                    <time className="member-profile-activity-when">{formatRelative(entry.when, language)}</time>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <p className="member-profile-privacy-note">{t.privacyNote}</p>
      </section>
    </SiteShell>
  );
}
