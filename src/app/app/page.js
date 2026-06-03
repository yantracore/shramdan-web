"use client";

// /app — mobile-first member dashboard shell (roadmap Phase 2).
// MVP scope covers 2.2 (dashboard tiles), 2.5 (issues quick-vote
// hand-off — links to /issues for now), and 2.7 (profile basics).
// Data flows from dummy mocks today; once backend ships
// /me/dashboard, the useMemo aggregates swap for a fetch.

import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  FireOutlined,
  HeartOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button, Empty } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import {
  getDemoApplications,
  getDemoNotifications,
  getDemoPastEvents,
  getDemoPublicIssues,
  getDemoUpcomingEvents
} from "@/lib/devMockData";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function formatDate(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

const COPY = {
  np: {
    pageTitle: "सदस्य ड्यासबोर्ड",
    greetingFallback: "साथी",
    greeting: "नमस्ते, {name}।",
    intro: "तपाईंको अभियान, समस्या र योगदान — एकै ठाउँमा।",
    stats: {
      events: "अभियानमा सहभागी",
      issues: "समर्थन गरेका समस्या",
      led: "तपाईंले नेतृत्व गरेको",
      pending: "लम्बित आवेदन"
    },
    upcomingHeading: "तपाईं जोडिनुभएका आउँदा अभियान",
    upcomingEmpty: "अहिले कुनै आउँदा अभियानमा जोडिनुभएको छैन।",
    browseEvents: "अभियानहरू हेर्नुहोस्",
    issuesHeading: "तपाईंले समर्थन गरेका समस्या",
    issuesEmpty: "अहिलेसम्म कुनै समस्यामा समर्थन गर्नुभएको छैन।",
    browseIssues: "समस्याहरू हेर्नुहोस्",
    quickHeading: "छिटो काम",
    quickIssue: "नयाँ समस्या रिपोर्ट",
    quickJoin: "अभियानमा जोडिनुहोस्",
    quickProfile: "तपाईंको प्रोफाइल",
    profileHeading: "तपाईंको खाता",
    profileRole: "भूमिका",
    profileVerified: "प्रमाणीकरण",
    verified: "प्रमाणित",
    unverified: "अप्रमाणित",
    profileEdit: "प्रोफाइल हेर्नुहोस्",
    loginPrompt: "ड्यासबोर्ड हेर्न पहिले लग-इन गर्नुहोस्।",
    loginCta: "लग-इन गर्नुहोस्"
  },
  en: {
    pageTitle: "Member dashboard",
    greetingFallback: "friend",
    greeting: "Hi, {name}.",
    intro: "Your campaigns, issues, and contributions — in one place.",
    stats: {
      events: "Events joined",
      issues: "Issues supported",
      led: "Events led",
      pending: "Pending applications"
    },
    upcomingHeading: "Upcoming events you've joined",
    upcomingEmpty: "You haven't joined any upcoming events yet.",
    browseEvents: "Browse events",
    issuesHeading: "Issues you've supported",
    issuesEmpty: "You haven't supported any issues yet.",
    browseIssues: "Browse issues",
    quickHeading: "Quick actions",
    quickIssue: "Report new issue",
    quickJoin: "Join a campaign",
    quickProfile: "Your profile",
    profileHeading: "Your account",
    profileRole: "Role",
    profileVerified: "Verification",
    verified: "Verified",
    unverified: "Unverified",
    profileEdit: "View profile",
    loginPrompt: "Sign in to see your dashboard.",
    loginCta: "Sign in"
  }
};

export default function AppDashboardPage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);

  useEffect(() => {
    if (session === null) return; // initial null state, not "logged out"
  }, [session]);

  // Aggregates today come from demo mocks; once /me/dashboard ships,
  // swap these useMemo for a fetched response.
  const upcomingEvents = useMemo(() => getDemoUpcomingEvents().slice(0, 3), []);
  const pastEvents = useMemo(() => getDemoPastEvents(), []);
  const supportedIssues = useMemo(() => getDemoPublicIssues().slice(0, 4), []);
  const applications = useMemo(() => getDemoApplications(), []);
  const notifications = useMemo(() => getDemoNotifications(), []);
  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  if (!session?.user?.id) {
    return (
      <SiteShell pageTitle={t.pageTitle}>
        <section className="app-dashboard-anon">
          <h1>{t.pageTitle}</h1>
          <p>{t.loginPrompt}</p>
          <Button type="primary" onClick={() => router.push("/login?next=/app")}>
            {t.loginCta}
          </Button>
        </section>
      </SiteShell>
    );
  }

  const name = session.user.name || t.greetingFallback;
  const stats = {
    events: upcomingEvents.length + Math.min(pastEvents.length, 5),
    issues: supportedIssues.length,
    led: 1,
    pending: applications.filter((a) => a.status !== "ACCEPTED" && a.status !== "REJECTED").length
  };

  const statTiles = [
    { key: "events", icon: CalendarOutlined, value: stats.events },
    { key: "issues", icon: HeartOutlined, value: stats.issues },
    { key: "led", icon: FireOutlined, value: stats.led },
    { key: "pending", icon: CheckCircleOutlined, value: stats.pending }
  ];

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="app-dashboard page-section">
        <header className="app-dashboard-hero">
          <h1>{t.greeting.replace("{name}", name)}</h1>
          <p>{t.intro}</p>
        </header>

        <div className="app-dashboard-stats" role="group" aria-label={t.pageTitle}>
          {statTiles.map(({ key, icon: Icon, value }) => (
            <article key={key} className="app-dashboard-stat">
              <span className="app-dashboard-stat-icon" aria-hidden="true">
                <Icon />
              </span>
              <strong className="app-dashboard-stat-value">
                {localizeDigits(value, language)}
              </strong>
              <span className="app-dashboard-stat-label">{t.stats[key]}</span>
            </article>
          ))}
        </div>

        <section
          className="app-dashboard-block"
          aria-labelledby="app-dashboard-upcoming-title"
        >
          <header className="app-dashboard-block-header">
            <h2 id="app-dashboard-upcoming-title">{t.upcomingHeading}</h2>
            <Link href="/events?show=upcoming" className="app-dashboard-block-more">
              {t.browseEvents} <ArrowRightOutlined aria-hidden="true" />
            </Link>
          </header>
          {upcomingEvents.length === 0 ? (
            <Empty
              description={t.upcomingEmpty}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <ul className="app-dashboard-list">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="app-dashboard-row">
                  <Link href={`/events/${event.id}`} className="app-dashboard-row-link">
                    <span className="app-dashboard-row-title">{event.title}</span>
                    <span className="app-dashboard-row-meta">
                      <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
                    </span>
                    <span className="app-dashboard-row-meta">
                      <CalendarOutlined aria-hidden="true" />{" "}
                      {formatDate(event.scheduledAt, language)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="app-dashboard-block"
          aria-labelledby="app-dashboard-issues-title"
        >
          <header className="app-dashboard-block-header">
            <h2 id="app-dashboard-issues-title">{t.issuesHeading}</h2>
            <Link href="/issues" className="app-dashboard-block-more">
              {t.browseIssues} <ArrowRightOutlined aria-hidden="true" />
            </Link>
          </header>
          {supportedIssues.length === 0 ? (
            <Empty description={t.issuesEmpty} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <ul className="app-dashboard-list">
              {supportedIssues.map((issue) => (
                <li key={issue.id} className="app-dashboard-row">
                  <Link href={`/issues/${issue.id}`} className="app-dashboard-row-link">
                    <span className="app-dashboard-row-title">{issue.title}</span>
                    <span className="app-dashboard-row-meta">
                      <EnvironmentOutlined aria-hidden="true" /> {issue.addressText}
                    </span>
                    <span className="app-dashboard-row-meta">
                      <HeartOutlined aria-hidden="true" />{" "}
                      {localizeDigits(issue.voteCount || 0, language)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="app-dashboard-block app-dashboard-profile"
          aria-labelledby="app-dashboard-profile-title"
        >
          <header className="app-dashboard-block-header">
            <h2 id="app-dashboard-profile-title">
              <UserOutlined aria-hidden="true" /> {t.profileHeading}
            </h2>
          </header>
          <dl className="app-dashboard-profile-list">
            <div>
              <dt>{t.profileRole}</dt>
              <dd>{session.user.role}</dd>
            </div>
            <div>
              <dt>{t.profileVerified}</dt>
              <dd>{session.user.isVerified ? t.verified : t.unverified}</dd>
            </div>
            <div>
              <dt>{t.stats.pending}</dt>
              <dd>{localizeDigits(stats.pending, language)}</dd>
            </div>
          </dl>
          <Link href="/me" className="app-dashboard-profile-edit">
            <Button icon={<UserOutlined />}>{t.profileEdit}</Button>
          </Link>
        </section>

        <section
          className="app-dashboard-block app-dashboard-quick"
          aria-labelledby="app-dashboard-quick-title"
        >
          <header className="app-dashboard-block-header">
            <h2 id="app-dashboard-quick-title">{t.quickHeading}</h2>
          </header>
          <div className="app-dashboard-quick-tiles">
            <Link href="/issues/new" className="app-dashboard-quick-tile">
              <HeartOutlined aria-hidden="true" />
              <span>{t.quickIssue}</span>
            </Link>
            <Link href="/events?show=upcoming" className="app-dashboard-quick-tile">
              <TeamOutlined aria-hidden="true" />
              <span>{t.quickJoin}</span>
            </Link>
            <Link href="/me" className="app-dashboard-quick-tile">
              <UserOutlined aria-hidden="true" />
              <span>{t.quickProfile}</span>
            </Link>
          </div>
        </section>
      </section>
    </SiteShell>
  );
}
