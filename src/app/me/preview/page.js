"use client";

// /me/preview — auth-free demo of what a member profile feels like.
// Backend has no profile endpoint wired yet; the real /me page is auth-
// gated and redirects to /login when there's no session. This page lives
// in parallel as a static stub so the design can be reviewed any time.

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  FireFilled,
  HeartFilled,
  LikeOutlined,
  ShareAltOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { message } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getDemoNotifications } from "@/lib/devMockData";
import { listLiveEvents, listPastEvents, listUpcomingEvents } from "@/lib/eventsApi";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// Deterministic 12-week × 7-day heatmap of dummy "activity intensity".
// Values 0-4 derived from a tiny hash so the grid is stable across renders.
function buildHeatmap() {
  const weeks = 12;
  const grid = [];
  for (let w = 0; w < weeks; w += 1) {
    const col = [];
    for (let d = 0; d < 7; d += 1) {
      // Bias the last 3 weeks to have higher activity.
      const recencyBoost = w >= weeks - 3 ? 1 : 0;
      const noise = ((w * 31 + d * 17 + 9) % 7);
      const v = Math.min(4, Math.max(0, noise - 2 + recencyBoost));
      col.push(v);
    }
    grid.push(col);
  }
  return grid;
}

// Dummy daily-volunteer streak. In production this would be derived from
// the check-in log on the user record (consecutive days with any activity:
// joining an event, supporting an issue, commenting on a thread, etc.).
const STREAK_DAYS = 8;

// Dummy referral code. In production each user gets a deterministic code
// from their userId on signup; new joiners who enter it on /signup link
// back to the inviter for the "ambassador" badge.
const REFERRAL_CODE = "VIVEK-K7M3";
const REFERRAL_INVITES = 3;

const ACHIEVEMENTS = [
  { id: "first_vote", emoji: "👍", labelNp: "पहिलो समर्थन", labelEn: "First support", unlocked: true },
  { id: "first_event", emoji: "🤝", labelNp: "पहिलो अभियान", labelEn: "First event", unlocked: true },
  { id: "supporter", emoji: "💚", labelNp: "१० समर्थन", labelEn: "10 supports", unlocked: true },
  { id: "joiner", emoji: "🎽", labelNp: "५ अभियान सहभागी", labelEn: "5 events joined", unlocked: true },
  { id: "organizer", emoji: "⚡", labelNp: "पहिलो संयोजन", labelEn: "First organizer", unlocked: true },
  { id: "monsoon", emoji: "🌧", labelNp: "मनसुन सरसफाइ", labelEn: "Monsoon cleanup", unlocked: false }
];

const COPY = {
  np: {
    pageTitle: "मेरो प्रोफाइल — झलक",
    devBanner:
      "👀 यो डेमो हो। सदस्य बनेपछि तपाईंको वास्तविक प्रोफाइल यहीँ देखिनेछ।",
    devCta: "अहिले OTP बाट जोडिने",
    name: "विवेक डेमो",
    handle: "@vivekdemo",
    phone: "+९७७ ९८XXXXXX९४",
    location: "काठमाडौँ, नेपाल",
    memberSince: "सदस्यता मिति",
    memberDate: "२०२६ असार २",
    streakLabel: "दिनदेखि निरन्तर सक्रिय",
    streakTooltip: "लगातार योगदान गरेका दिन",
    inviteTitle: "साथी निम्त्याउनुहोस्",
    inviteIntro: "तपाईंको कोड साझा गर्नुहोस् — साथीले सामेल हुँदा दुवैले विशेष ब्याज पाउनुहुनेछ।",
    inviteCodeLabel: "तपाईंको कोड",
    inviteCopy: "प्रतिलिपि",
    inviteCopied: "कोड प्रतिलिपि भयो",
    inviteShare: "साझा गर्ने",
    inviteShareTitle: "श्रमदान सामुदायिक काममा सहभागी हुनुहोस्",
    inviteShareText: "मेरो कोड {code} प्रयोग गरी श्रमदान मा सामेल हुनुहोस्।",
    inviteStat: "साथी सामेल",
    statsTitle: "योगदान सारांश",
    stat1Label: "अभियानमा सहभागी",
    stat2Label: "समर्थन गरिएको समस्या",
    stat3Label: "अभियान संयोजन",
    stat4Label: "स्वयंसेवा घण्टा",
    stat4Delta: "+{n} यो महिना",
    badgesTitle: "उपलब्धि",
    badgesLockedHint: "अब आउने",
    heatmapTitle: "गतिविधि नक्सा",
    heatmapHint: "गत १२ हप्ताको दैनिक योगदान",
    heatmapLess: "कम",
    heatmapMore: "धेरै",
    activityTitle: "हालैको गतिविधि",
    eventsTitle: "तपाईंका आगामी अभियानहरू",
    pastTitle: "तपाईं सहभागी भएका",
    viewEvent: "विवरण",
    noEvents: "तपाईंले अहिलेसम्म कुनै अभियानमा प्रतिबद्धता जनाउनुभएको छैन।",
    badge: "डेमो प्रोफाइल"
  },
  en: {
    pageTitle: "My profile — preview",
    devBanner:
      "👀 This is a demo. Your real profile lives here after signup.",
    devCta: "Sign up with OTP",
    name: "Vivek Demo",
    handle: "@vivekdemo",
    phone: "+977 98XXXXXX94",
    location: "Kathmandu, Nepal",
    memberSince: "Member since",
    memberDate: "Jun 2, 2026",
    streakLabel: "day streak",
    streakLabelPlural: "day streak",
    streakTooltip: "Consecutive days of contribution",
    inviteTitle: "Invite a friend",
    inviteIntro: "Share your code — when your friend joins, you both earn a special badge.",
    inviteCodeLabel: "Your Code",
    inviteCopy: "Copy",
    inviteCopied: "Code copied",
    inviteShare: "Share",
    inviteShareTitle: "Join Shramdan for community work",
    inviteShareText: "Use my code {code} to join Shramdan with me.",
    inviteStat: "Friends joined",
    statsTitle: "Contribution summary",
    stat1Label: "Events joined",
    stat2Label: "Issues supported",
    stat3Label: "Events coordinated",
    stat4Label: "Shramdan hours",
    stat4Delta: "+{n} this month",
    badgesTitle: "Achievements",
    badgesLockedHint: "Coming up",
    heatmapTitle: "Activity map",
    heatmapHint: "Daily contribution over the last 12 weeks",
    heatmapLess: "Less",
    heatmapMore: "More",
    activityTitle: "Recent activity",
    eventsTitle: "Your upcoming events",
    pastTitle: "Past events you joined",
    viewEvent: "View",
    noEvents: "You haven't committed to any campaigns yet.",
    badge: "Demo profile"
  }
};

function initialsOf(name) {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || "")
    .join("");
}

export default function MeProfilePreview() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const [messageApi, messageContextHolder] = message.useMessage();
  const [copied, setCopied] = useState(false);

  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [live, setLive] = useState([]);
  const notifications = useMemo(() => getDemoNotifications().slice(0, 4), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [up, ps, lv] = await Promise.all([
          listUpcomingEvents({ language, limit: 2 }),
          listPastEvents({ language, limit: 2 }),
          listLiveEvents({ language })
        ]);
        if (cancelled) return;
        setUpcoming(up.slice(0, 2));
        setPast(ps.slice(0, 2));
        setLive(lv.slice(0, 1));
      } catch {
        if (cancelled) return;
        setUpcoming([]); setPast([]); setLive([]);
      }
    })();
    return () => { cancelled = true; };
  }, [language]);
  const heatmap = useMemo(() => buildHeatmap(), []);

  const stats = [
    { value: 5, label: t.stat1Label, icon: TeamOutlined },
    { value: 12, label: t.stat2Label, icon: LikeOutlined },
    { value: 1, label: t.stat3Label, icon: CheckCircleOutlined },
    {
      value: "14.5",
      label: t.stat4Label,
      icon: ClockCircleOutlined,
      delta: t.stat4Delta.replace("{n}", localizeDigits("2.5", language))
    }
  ];

  const handleCopyInvite = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/signup?ref=${REFERRAL_CODE}`
        : `/signup?ref=${REFERRAL_CODE}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      messageApi.success(t.inviteCopied);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      messageApi.error(t.inviteCopied);
    }
  };

  const handleShareInvite = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/signup?ref=${REFERRAL_CODE}`
        : `/signup?ref=${REFERRAL_CODE}`;
    const text = t.inviteShareText.replace("{code}", REFERRAL_CODE);

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: t.inviteShareTitle,
          text,
          url: shareUrl
        });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    handleCopyInvite();
  };

  return (
    <SiteShell pageTitle={t.pageTitle}>
      {messageContextHolder}
      <section className="me-preview-section page-section">
        <aside className="me-preview-banner" role="status">
          <span>{t.devBanner}</span>
          <Link href="/signup" className="me-preview-banner-cta">
            {t.devCta} →
          </Link>
        </aside>

        <article className="me-preview-card content-card">
          <header className="me-preview-header">
            <div className="me-preview-avatar" aria-hidden="true">
              <span>{initialsOf(t.name)}</span>
              <HeartFilled className="me-preview-avatar-badge" />
            </div>
            <div className="me-preview-id">
              <span className="me-preview-tag">{t.badge}</span>
              <h1>{t.name}</h1>
              <p className="me-preview-handle">{t.handle}</p>
              <p className="me-preview-meta">{t.phone}</p>
              <p className="me-preview-meta">{t.location}</p>
              <p className="me-preview-meta">
                <CalendarOutlined aria-hidden="true" /> {t.memberSince}: {t.memberDate}
              </p>
              <span
                className={`me-preview-streak${STREAK_DAYS >= 7 ? " is-hot" : ""}`}
                title={t.streakTooltip}
                aria-label={`${STREAK_DAYS} ${t.streakLabel}`}
              >
                <FireFilled aria-hidden="true" />
                <strong>{localizeDigits(STREAK_DAYS, language)}</strong>
                <span>{t.streakLabel}</span>
              </span>
            </div>
          </header>
        </article>

        <section
          className="me-preview-stats"
          aria-labelledby="me-preview-stats-title"
        >
          <h2 id="me-preview-stats-title" className="me-preview-section-title">
            {t.statsTitle}
          </h2>
          <div className="me-preview-stats-grid">
            {stats.map(({ value, label, icon: Icon, delta }, i) => (
              <article key={i} className="me-preview-stat-card">
                <span className="me-preview-stat-icon" aria-hidden="true">
                  <Icon />
                </span>
                <strong className="me-preview-stat-value">
                  {localizeDigits(value, language)}
                </strong>
                <span className="me-preview-stat-label">{label}</span>
                {delta ? (
                  <span className="me-preview-stat-delta">{delta}</span>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section
          className="me-preview-invite content-card"
          aria-labelledby="me-preview-invite-title"
        >
          <div className="me-preview-invite-body">
            <h2
              id="me-preview-invite-title"
              className="me-preview-section-title"
            >
              {t.inviteTitle}
            </h2>
            <p className="me-preview-invite-intro">{t.inviteIntro}</p>
            <div className="me-preview-invite-code-row">
              <span className="me-preview-invite-code-label">
                {t.inviteCodeLabel}
              </span>
              <code className="me-preview-invite-code">{REFERRAL_CODE}</code>
              <span className="me-preview-invite-count">
                <TeamOutlined aria-hidden="true" />
                <strong>{localizeDigits(REFERRAL_INVITES, language)}</strong>
                <span>{t.inviteStat}</span>
              </span>
            </div>
            <div className="me-preview-invite-actions">
              <button
                type="button"
                className={`me-preview-invite-btn${copied ? " is-copied" : ""}`}
                onClick={handleCopyInvite}
              >
                <CopyOutlined aria-hidden="true" />
                <span>{copied ? t.inviteCopied : t.inviteCopy}</span>
              </button>
              <button
                type="button"
                className="me-preview-invite-btn is-primary"
                onClick={handleShareInvite}
              >
                <ShareAltOutlined aria-hidden="true" />
                <span>{t.inviteShare}</span>
              </button>
            </div>
          </div>
        </section>

        <section
          className="me-preview-heatmap"
          aria-labelledby="me-preview-heatmap-title"
        >
          <header className="me-preview-heatmap-head">
            <h2
              id="me-preview-heatmap-title"
              className="me-preview-section-title"
            >
              {t.heatmapTitle}
            </h2>
            <span className="me-preview-heatmap-hint">{t.heatmapHint}</span>
          </header>
          <div className="me-preview-heatmap-grid" aria-hidden="true">
            {heatmap.map((col, ci) => (
              <div key={ci} className="me-preview-heatmap-col">
                {col.map((v, di) => (
                  <span
                    key={di}
                    className="me-preview-heatmap-cell"
                    data-intensity={v}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="me-preview-heatmap-legend">
            <span>{t.heatmapLess}</span>
            <span className="me-preview-heatmap-cell" data-intensity="0" />
            <span className="me-preview-heatmap-cell" data-intensity="1" />
            <span className="me-preview-heatmap-cell" data-intensity="2" />
            <span className="me-preview-heatmap-cell" data-intensity="3" />
            <span className="me-preview-heatmap-cell" data-intensity="4" />
            <span>{t.heatmapMore}</span>
          </div>
        </section>

        <section
          className="me-preview-badges"
          aria-labelledby="me-preview-badges-title"
        >
          <h2
            id="me-preview-badges-title"
            className="me-preview-section-title"
          >
            {t.badgesTitle}
          </h2>
          <ul className="me-preview-badges-grid">
            {ACHIEVEMENTS.map((b) => (
              <li
                key={b.id}
                className={`me-preview-badge-tile${b.unlocked ? "" : " is-locked"}`}
              >
                <span className="me-preview-badge-emoji" aria-hidden="true">
                  {b.emoji}
                </span>
                <span className="me-preview-badge-label">
                  {language === "np" ? b.labelNp : b.labelEn}
                </span>
                {!b.unlocked ? (
                  <span className="me-preview-badge-locked">
                    {t.badgesLockedHint}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {notifications.length > 0 ? (
          <section
            className="me-preview-activity"
            aria-labelledby="me-preview-activity-title"
          >
            <h2 id="me-preview-activity-title" className="me-preview-section-title">
              {t.activityTitle}
            </h2>
            <ol className="me-preview-activity-list">
              {notifications.map((n) => {
                const title = n.title?.[language] || n.title?.np;
                const body = n.body?.[language] || n.body?.np;
                return (
                  <li key={n.id} className="me-preview-activity-item">
                    <Link href={n.href} className="me-preview-activity-link">
                      <strong>{title}</strong>
                      <span>{body}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {[...live, ...upcoming].length > 0 ? (
          <section
            className="me-preview-events"
            aria-labelledby="me-preview-events-title"
          >
            <h2 id="me-preview-events-title" className="me-preview-section-title">
              {t.eventsTitle}
            </h2>
            <ul className="me-preview-events-list">
              {[...live, ...upcoming].map((event) => (
                <li key={event.id} className="me-preview-event-row">
                  <span className="me-preview-event-title">{event.title}</span>
                  <span className="me-preview-event-place">{event.addressText}</span>
                  <Link href={`/events/${event.slug ?? event.id}`} className="me-preview-event-cta">
                    {t.viewEvent} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {past.length > 0 ? (
          <section
            className="me-preview-events me-preview-past"
            aria-labelledby="me-preview-past-title"
          >
            <h2 id="me-preview-past-title" className="me-preview-section-title">
              {t.pastTitle}
            </h2>
            <ul className="me-preview-events-list">
              {past.map((event) => (
                <li key={event.id} className="me-preview-event-row">
                  <span className="me-preview-event-title">{event.title}</span>
                  <span className="me-preview-event-place">{event.addressText}</span>
                  <Link href={`/events/${event.slug ?? event.id}`} className="me-preview-event-cta">
                    {t.viewEvent} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </SiteShell>
  );
}
