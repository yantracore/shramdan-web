"use client";

import {
  ApiOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  BankOutlined,
  BarChartOutlined,
  BgColorsOutlined,
  BuildOutlined,
  BugOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FilePptOutlined,
  FileTextOutlined,
  GithubOutlined,
  GlobalOutlined,
  HeartOutlined,
  HomeOutlined,
  LikeOutlined,
  LineChartOutlined,
  LoadingOutlined,
  MessageOutlined,
  MobileOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  SafetyOutlined,
  ShareAltOutlined,
  TeamOutlined,
  ToolOutlined,
  TranslationOutlined,
  UnorderedListOutlined,
  UserOutlined,
  VideoCameraOutlined,
  YoutubeOutlined
} from "@ant-design/icons";
import { Button, Progress } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import IssueMapBlock from "@/components/IssueMapBlock";
import { LiveEventsRail } from "@/components/LiveEventsRail";
import { MotionSection } from "@/components/MotionSection";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getJson } from "@/lib/apiClient";
import { ISSUE_STATUS_COLORS, getListItems } from "@/lib/adminUtils";
import { copy } from "@/lib/siteContent";

const LIVE_RESOURCE_IDS = new Set(["participate", "watchLive"]);
const ACTIVE_ISSUE_STATUSES = new Set(["OPEN", "EVENT_SCHEDULED"]);
const ACTIVE_ISSUES_LIMIT = 100;
const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function deriveLocationKey(issue) {
  const lat = Number(issue?.latitude);
  const lng = Number(issue?.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  }
  if (issue?.addressText) {
    return issue.addressText.split(",")[0].trim().toLowerCase();
  }
  return null;
}

function isNowLiveNpt(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value;
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  const weekdays = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  if (!weekdays.has(weekday) || hour !== 12) return false;
  return minute < 30;
}

function useIsLiveNow() {
  const [isLive, setIsLive] = useState(false);
  useEffect(() => {
    const tick = () => setIsLive(isNowLiveNpt());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return isLive;
}

const resourceIcons = {
  participate: VideoCameraOutlined,
  watchLive: YoutubeOutlined,
  discord: MessageOutlined,
  apiDocs: ApiOutlined,
  presentation: FilePptOutlined,
  roadmap: BuildOutlined,
  documents: FileTextOutlined,
  github: GithubOutlined
};

const volunteerRoleIcons = {
  frontend: CodeOutlined,
  backend: DatabaseOutlined,
  qa: BugOutlined,
  devops: CloudServerOutlined,
  uiux: RocketOutlined,
  graphics: BgColorsOutlined,
  content: EditOutlined,
  legal: BankOutlined,
  finance: LineChartOutlined,
  donors: HeartOutlined,
  leaders: TeamOutlined
};

const workflowStepIcons = {
  listing: FileTextOutlined,
  vote: CheckCircleOutlined,
  plan: CalendarOutlined,
  event: ToolOutlined,
  results: LineChartOutlined
};

const buildingNowIconByKey = {
  vote: LikeOutlined,
  share: ShareAltOutlined,
  page: FileTextOutlined,
  list: UnorderedListOutlined,
  roadmap: BuildOutlined,
  home: HomeOutlined,
  auth: UserOutlined,
  campaign: TeamOutlined,
  mobile: MobileOutlined,
  translate: TranslationOutlined,
  report: BarChartOutlined,
  safety: SafetyOutlined,
  api: ApiOutlined,
  location: EnvironmentOutlined,
  notify: MessageOutlined,
  global: GlobalOutlined
};

const buildingNowIconByPhase = {
  0: HomeOutlined,
  1: LikeOutlined,
  2: MobileOutlined,
  3: TeamOutlined,
  4: SafetyOutlined,
  5: HeartOutlined,
  6: GlobalOutlined,
  7: FileTextOutlined,
  8: MessageOutlined,
  10: MobileOutlined,
  13: BarChartOutlined,
  14: BuildOutlined
};

function pickBuildingNowIcon(iconKey, phaseNumber) {
  return (
    buildingNowIconByKey[iconKey] ||
    buildingNowIconByPhase[phaseNumber] ||
    AppstoreOutlined
  );
}

function relativeShippedLabel(doneAt, t) {
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const doneUtc = Date.parse(`${doneAt}T00:00:00Z`);
  if (Number.isNaN(doneUtc)) return null;
  const days = Math.max(0, Math.round((todayUtc - doneUtc) / (1000 * 60 * 60 * 24)));
  if (days === 0) return t.buildInPublic.relativeToday;
  if (days === 1) return t.buildInPublic.relativeYesterday;
  return t.buildInPublic.relativeDaysAgo.replace("{n}", String(days));
}

function buildBuildingNowItems({ inProgress, upcoming, recentlyDone, t, perBucket = 2 }) {
  const overrides = t.buildInPublic.taskOverrides || {};

  const pickWithOverride = (items, build) => {
    const out = [];
    for (const item of items) {
      if (out.length >= perBucket) break;
      const o = overrides[item.id];
      if (!o) continue;
      out.push(build(item, o));
    }
    return out;
  };

  const activeCards = pickWithOverride(inProgress, (item, o) => ({
    key: `active-${item.id}`,
    status: "active",
    statusLabel: t.buildInPublic.statusActive,
    id: item.id,
    title: o.title,
    blurb: o.blurb || t.buildInPublic.fallbackBlurb,
    iconKey: o.iconKey,
    phaseNumber: item.phaseNumber,
    meta: null
  }));

  const upcomingCards = pickWithOverride(upcoming, (item, o) => ({
    key: `upcoming-${item.id}`,
    status: "upcoming",
    statusLabel: t.buildInPublic.statusUpcoming,
    id: item.id,
    title: o.title,
    blurb: o.blurb || t.buildInPublic.fallbackBlurb,
    iconKey: o.iconKey,
    phaseNumber: item.phaseNumber,
    meta: t.buildInPublic.relativeUpcoming || null
  }));

  const shippedCards = pickWithOverride(recentlyDone, (item, o) => ({
    key: `shipped-${item.id}`,
    status: "shipped",
    statusLabel: t.buildInPublic.statusShipped,
    id: item.id,
    title: o.title,
    blurb: o.blurb || t.buildInPublic.fallbackBlurb,
    iconKey: o.iconKey,
    phaseNumber: item.phaseNumber,
    meta: relativeShippedLabel(item.doneAt, t)
  }));

  return [...activeCards, ...upcomingCards, ...shippedCards];
}

export default function HomeClient({ summary }) {
  const { language } = usePreferences();
  const t = copy[language];
  const isLiveNow = useIsLiveNow();
  const overallPercent = summary?.overallPercent ?? null;
  const buildingNowCards = buildBuildingNowItems({
    inProgress: summary?.inProgress ?? [],
    upcoming: summary?.upcoming ?? [],
    recentlyDone: summary?.recentlyDone ?? [],
    t
  });
  const featuredResources = t.heroPanel.resources.map((resource) => {
    const item = t.resources.items.find((candidate) => candidate.id === resource.id);
    const Icon = resourceIcons[resource.id] ?? FileTextOutlined;

    return {
      ...resource,
      href: resource.href ?? item?.href ?? "#",
      Icon
    };
  });

  const [activeIssues, setActiveIssues] = useState([]);
  const [activeIssuesLoaded, setActiveIssuesLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getJson("/issues", {
          params: { sort: "voteCount", limit: ACTIVE_ISSUES_LIMIT }
        });
        const items = getListItems(response).filter((issue) =>
          ACTIVE_ISSUE_STATUSES.has(issue?.status)
        );
        if (!cancelled) {
          setActiveIssues(items);
          setActiveIssuesLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setActiveIssues([]);
          setActiveIssuesLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeIssuesStats = useMemo(() => {
    const totalVotes = activeIssues.reduce(
      (sum, issue) => sum + (Number(issue.voteCount) || 0),
      0
    );
    const locationKeys = new Set();
    activeIssues.forEach((issue) => {
      const key = deriveLocationKey(issue);
      if (key) locationKeys.add(key);
    });
    return {
      total: activeIssues.length,
      locations: locationKeys.size,
      votes: totalVotes
    };
  }, [activeIssues]);

  const topIssues = useMemo(
    () =>
      [...activeIssues]
        .sort((a, b) => (Number(b.voteCount) || 0) - (Number(a.voteCount) || 0))
        .slice(0, 3),
    [activeIssues]
  );

  const issueCopy = t.issues || {};
  const liveIssuesCopy = t.liveIssues || {};
  const showActiveIssuesSection =
    activeIssuesLoaded && activeIssues.length > 0;

  return (
    <SiteShell>
      <MotionSection as="section" id="top" className="hero-section">
        <div className="hero-copy">
          {t.hero.eyebrow ? <span className="eyebrow">{t.hero.eyebrow}</span> : null}
          <h1>{t.hero.title}</h1>
          <p className="hero-subtitle">{t.hero.subtitle}</p>
          <p>{t.hero.support}</p>
          <div className="hero-actions">
            <Button type="primary" size="large" href="#we-need-you" icon={<HeartOutlined />}>
              {t.hero.join}
            </Button>
            <Button size="large" href="/intro">
              {t.hero.introLabel || (language === "np" ? "श्रमदान चिनौं →" : "Meet Shramdan →")}
            </Button>
          </div>
        </div>
        <aside className="hero-panel glass-panel" aria-label={t.ariaLabels.heroPanel}>
          <span className="hero-panel-kicker">{t.heroPanel.kicker}</span>
          <h2>{t.heroPanel.title}</h2>
          <p>{t.heroPanel.body}</p>
          {overallPercent != null ? (
            <div className="hero-panel-progress" aria-label={t.buildInPublic.heroAria}>
              <div className="hero-panel-progress-row">
                <span>{t.buildInPublic.heroLabel}</span>
                <strong>{overallPercent}%</strong>
              </div>
              <Progress
                percent={overallPercent}
                showInfo={false}
                size="small"
                strokeColor="#176b5c"
                railColor="rgba(255, 255, 255, 0.25)"
              />
              <a
                className="hero-panel-progress-link"
                href={t.buildInPublic.roadmapHref}
                rel="noreferrer"
                target="_blank"
              >
                {t.buildInPublic.roadmapCta}
                <ArrowRightOutlined aria-hidden="true" />
              </a>
            </div>
          ) : null}
          <div className="hero-panel-links" aria-label={t.heroPanel.resourcesLabel}>
            {featuredResources.map(({ Icon, href, id, label, title }) => {
              const isLive = isLiveNow && LIVE_RESOURCE_IDS.has(id);
              return (
                <a
                  href={href}
                  key={id}
                  rel="noreferrer"
                  target="_blank"
                  className={isLive ? "is-live" : undefined}
                >
                  <span className="hero-panel-link-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span>
                    <strong>
                      {title}
                      {isLive ? (
                        <span className="live-badge" aria-label={t.heroPanel.liveAria}>
                          <span className="live-dot" aria-hidden="true" />
                          {t.heroPanel.liveBadge}
                        </span>
                      ) : null}
                    </strong>
                    <small>{label}</small>
                  </span>
                  <ArrowRightOutlined aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </aside>
      </MotionSection>

      <LiveEventsRail liveEvents={[]} copy={t.liveEventsRail} />

      <MotionSection as="section" className="event-types-section" aria-labelledby="event-types-title">
        <div className="event-types-heading">
          <span className="eyebrow">{t.eventTypes.eyebrow}</span>
          <div>
            <h2 id="event-types-title">{t.eventTypes.title}</h2>
            <p>{t.eventTypes.intro}</p>
          </div>
        </div>

        <div className="event-types-grid">
          {t.eventTypes.items.map((item) => (
            <Link
              className={`event-type-card event-type-card--${item.status}`}
              data-event-type={item.id}
              href={`/event-types/${item.id}`}
              key={item.id}
            >
              <div className="event-type-image">
                <span className={`event-type-badge event-type-badge--${item.status}`}>
                  {item.status === "current"
                    ? t.eventTypes.badgeCurrent
                    : item.status === "next"
                      ? t.eventTypes.badgeNext
                      : t.eventTypes.badgeFuture}
                </span>
                <Image
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 620px) calc(100vw - 56px), (max-width: 1180px) 45vw, 280px"
                  src={item.image}
                />
              </div>
              <div className="event-type-body">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="event-types-actions">
          <Button
            type="primary"
            size="large"
            href={t.eventTypes.seeAllHref}
            icon={<ArrowRightOutlined />}
          >
            {t.eventTypes.seeAll}
          </Button>
        </div>

        <p className="phase-note">
          <span aria-hidden="true">
            <Image alt="" height={96} src="/images/logo.png" width={96} />
          </span>
          {t.eventTypes.phaseNote}
        </p>
      </MotionSection>

      <MotionSection as="section" className="cleanup-areas-section" aria-labelledby="cleanup-areas-title">
        <div className="cleanup-areas-heading">
          <span className="eyebrow">{t.cleanupAreas.eyebrow}</span>
          <div>
            <h2 id="cleanup-areas-title">{t.cleanupAreas.title}</h2>
            <p>{t.cleanupAreas.intro}</p>
          </div>
        </div>

        <div className="cleanup-areas-grid">
          {t.cleanupAreas.items.map((area) => (
            <article className="cleanup-area-card" data-area={area.id} key={area.id}>
              <div className="cleanup-area-image">
                <Image
                  alt={area.imageAlt}
                  fill
                  sizes="(max-width: 620px) calc(100vw - 56px), (max-width: 1180px) 30vw, 380px"
                  src={area.image}
                />
              </div>
              <h3>{area.title}</h3>
              <p>{area.body}</p>
            </article>
          ))}
        </div>
      </MotionSection>

      <MotionSection as="section" className="core-idea-section" aria-labelledby="core-idea-title">
        <div className="core-idea-hero">
          <div className="core-idea-copy">
            <span className="core-idea-eyebrow">
              <span aria-hidden="true">
                <Image alt="" height={96} src="/images/logo.png" width={96} />
              </span>
              {t.coreIdea.eyebrow}
            </span>
            <h2 id="core-idea-title">{t.coreIdea.title}</h2>
          </div>
          <div className="core-idea-landscape" aria-hidden="true" />
        </div>

        <div className="workflow-grid">
          {t.coreIdea.steps.map((step, index) => {
            const Icon = workflowStepIcons[step.id] ?? FileTextOutlined;
            const isLastStep = index === t.coreIdea.steps.length - 1;

            return (
              <div className="workflow-item" key={step.id}>
                <article className="workflow-card" data-step={step.id}>
                  <div className="workflow-card-heading">
                    <span className="workflow-number">{index + 1}</span>
                    <h3>{step.title}</h3>
                    <span className="workflow-icon" aria-hidden="true">
                      <Icon />
                    </span>
                  </div>
                  <div className="workflow-visual">
                    <Image
                      alt={step.imageAlt}
                      fill
                      sizes="(max-width: 620px) calc(100vw - 56px), (max-width: 980px) 45vw, 220px"
                      src={step.image}
                    />
                  </div>
                  <p>{step.body}</p>
                </article>
                {!isLastStep ? (
                  <span className="workflow-arrow" aria-hidden="true">
                    <ArrowRightOutlined />
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

      </MotionSection>

      <MotionSection as="section" className="volunteer-invite-section" aria-labelledby="volunteer-invite-title">
        <div className="volunteer-visual">
          <div className="volunteer-brand-card glass-panel">
            <span className="volunteer-logo">
              <Image alt="" height={96} src="/images/logo.png" width={96} />
            </span>
            <span>{t.volunteerInvite.brandLine}</span>
          </div>
          <div className="volunteer-copy-block">
            <span className="eyebrow">{t.volunteerInvite.eyebrow}</span>
            <h2 id="volunteer-invite-title">
              <span>{t.volunteerInvite.titleLead}</span>
              {language === "np" ? (
                <>
                  <span>{t.volunteerInvite.titleTrail}</span>
                  <strong>{t.volunteerInvite.titleStrong}</strong>
                </>
              ) : (
                <>
                  <strong>{t.volunteerInvite.titleStrong}</strong>
                  <span>{t.volunteerInvite.titleTrail}</span>
                </>
              )}
            </h2>
            <p>{t.volunteerInvite.intro}</p>
            <div className="volunteer-actions">
              <Button type="primary" size="large" href="/join" icon={<HeartOutlined />}>
                {t.volunteerInvite.primaryCta}
              </Button>
              <Button size="large" href="/feedback" icon={<ArrowRightOutlined />}>
                {t.volunteerInvite.secondaryCta}
              </Button>
            </div>
          </div>

          <aside className="volunteer-goal-card glass-panel">
            <span className="volunteer-goal-icon" aria-hidden="true">
              <TeamOutlined />
            </span>
            <div>
              <h3>{t.volunteerInvite.goal.title}</h3>
              <p>{t.volunteerInvite.goal.body}</p>
            </div>
          </aside>
        </div>

        <div className="volunteer-roles-panel" id="we-need-you">
          <div className="volunteer-panel-heading">
            <span className="eyebrow">{t.volunteerInvite.panelEyebrow}</span>
            <h2>{t.volunteerInvite.panelTitle}</h2>
            <p>{t.volunteerInvite.panelIntro}</p>
          </div>

          <div className="volunteer-role-grid">
            {t.volunteerInvite.roles.map((role) => {
              const Icon = volunteerRoleIcons[role.id] ?? TeamOutlined;

              return (
                <article className="volunteer-role-card" data-role={role.id} key={role.id}>
                  <span className="volunteer-role-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div className="volunteer-role-body">
                    <h3>{role.title}</h3>
                    <p>{role.description}</p>
                  </div>
                  <Button
                    href={`/join?role=${encodeURIComponent(role.value)}`}
                    size="small"
                    type="text"
                    icon={<ArrowRightOutlined />}
                  >
                    {t.volunteerInvite.cardCta}
                  </Button>
                </article>
              );
            })}
          </div>
        </div>

      </MotionSection>

      {showActiveIssuesSection ? (
        <MotionSection
          as="section"
          className="live-issues-section"
          aria-labelledby="live-issues-title"
        >
          <div className="live-issues-header">
            <div className="live-issues-heading">
              <span className="eyebrow">
                {liveIssuesCopy.eyebrow || "Active Issues"}
              </span>
              <h2 id="live-issues-title">
                {liveIssuesCopy.title || "What the community is flagging"}
              </h2>
              <p>{liveIssuesCopy.intro}</p>
            </div>
            <Link className="live-issues-cta" href="/issues">
              {liveIssuesCopy.viewAll || "View All Issues"}
              <ArrowRightOutlined aria-hidden="true" />
            </Link>
          </div>

          <dl className="live-issues-stats" aria-label={liveIssuesCopy.statsAria}>
            <div className="live-issues-stat">
              <dt>{liveIssuesCopy.statIssues || "Active issues"}</dt>
              <dd>{localizeDigits(activeIssuesStats.total, language)}</dd>
            </div>
            <div className="live-issues-stat">
              <dt>{liveIssuesCopy.statLocations || "Locations"}</dt>
              <dd>{localizeDigits(activeIssuesStats.locations, language)}</dd>
            </div>
            <div className="live-issues-stat">
              <dt>{liveIssuesCopy.statVotes || "Total support"}</dt>
              <dd>{localizeDigits(activeIssuesStats.votes, language)}</dd>
            </div>
          </dl>

          <div className="live-issues-map-frame">
            <IssueMapBlock
              issues={activeIssues}
              content={issueCopy}
              language={language}
              height={360}
              interactive
              enableFullscreen
              fullscreenLabel={liveIssuesCopy.fullscreenOpen || "Open fullscreen map"}
              exitFullscreenLabel={liveIssuesCopy.fullscreenClose || "Close fullscreen map"}
            />
          </div>

          {topIssues.length > 0 ? (
            <div className="live-issues-top">
              <h3 className="live-issues-top-title">
                {liveIssuesCopy.topTitle || "Most-supported right now"}
              </h3>
              <ul className="live-issues-top-list">
                {topIssues.map((issue) => {
                  const statusLabel =
                    issueCopy.statusLabels?.[issue.status] || issue.status;
                  const categoryLabel =
                    issueCopy.categoryLabels?.[issue.category] || issue.category;
                  const votes = Number(issue.voteCount) || 0;
                  const voteText =
                    votes === 1
                      ? issueCopy.card?.supportersOne || "1 supporter"
                      : (
                          issueCopy.card?.supportersMany || "{n} supporters"
                        ).replace("{n}", localizeDigits(votes, language));
                  return (
                    <li key={issue.id}>
                      <Link
                        className="live-issues-top-card"
                        href={`/issues/${issue.id}`}
                      >
                        <div className="live-issues-top-meta">
                          <span
                            className={`live-issues-top-status live-issues-top-status--${issue.status}`}
                            data-tone={ISSUE_STATUS_COLORS[issue.status]}
                          >
                            {statusLabel}
                          </span>
                          <span className="live-issues-top-category">
                            {categoryLabel}
                          </span>
                        </div>
                        <h4>{issue.title}</h4>
                        {issue.addressText ? (
                          <p className="live-issues-top-address">
                            <EnvironmentOutlined aria-hidden="true" />
                            {issue.addressText}
                          </p>
                        ) : null}
                        <span className="live-issues-top-votes">
                          <LikeOutlined aria-hidden="true" />
                          {voteText}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </MotionSection>
      ) : null}

      {buildingNowCards.length > 0 ? (
        <MotionSection as="section" className="building-now-section" aria-labelledby="building-now-title">
          <div className="building-now-header">
            <div className="building-now-heading">
              <span className="eyebrow">{t.buildInPublic.sectionEyebrow}</span>
              <h2 id="building-now-title">{t.buildInPublic.sectionTitle}</h2>
              <p>{t.buildInPublic.sectionIntro}</p>
            </div>
            <Button
              type="primary"
              size="large"
              href={t.buildInPublic.roadmapHref}
              target="_blank"
              rel="noreferrer"
            >
              {t.buildInPublic.fullRoadmapCta}
              <ArrowRightOutlined aria-hidden="true" />
            </Button>
          </div>
          <div className="building-now-grid">
            {buildingNowCards.map((card) => {
              const Icon = pickBuildingNowIcon(card.iconKey, card.phaseNumber);
              let StatusIcon = CheckCircleOutlined;
              let statusIconProps = { "aria-hidden": "true" };
              if (card.status === "active") {
                StatusIcon = LoadingOutlined;
                statusIconProps = { ...statusIconProps, spin: true };
              } else if (card.status === "upcoming") {
                StatusIcon = ClockCircleOutlined;
              }
              return (
                <article
                  className={`building-now-card building-now-card--${card.status}`}
                  key={card.key}
                >
                  <div className="building-now-card-head">
                    <span
                      className={`building-now-thumb building-now-thumb--${card.status}`}
                      aria-hidden="true"
                    >
                      <Icon />
                    </span>
                    <div className="building-now-status-stack">
                      <span className={`building-now-status building-now-status--${card.status}`}>
                        <StatusIcon {...statusIconProps} />
                        {card.statusLabel}
                      </span>
                      <span className="building-now-phase-tag">
                        {`${t.buildInPublic.phaseLabel} ${card.phaseNumber}`}
                        <span className="building-now-id">· {card.id}</span>
                      </span>
                    </div>
                  </div>
                  <h3>{card.title}</h3>
                  <p className="building-now-blurb">{card.blurb}</p>
                  {card.meta ? (
                    <span className="building-now-meta">
                      {card.status === "upcoming" ? (
                        <ClockCircleOutlined aria-hidden="true" />
                      ) : (
                        <CalendarOutlined aria-hidden="true" />
                      )}
                      {card.meta}
                    </span>
                  ) : null}
                </article>
              );
            })}
          </div>
        </MotionSection>
      ) : null}

      <MotionSection as="section" className="page-section resources-section" aria-labelledby="resources-title">
        <div className="section-heading resources-heading">
          <span className="eyebrow">{t.resources.eyebrow}</span>
          <h2 id="resources-title">{t.resources.title}</h2>
          <p>{t.resources.intro}</p>
        </div>

        <article className="resources-playlist-card">
          <div className="resources-playlist-copy">
            <span className="resource-icon resources-playlist-icon" aria-hidden="true">
              <PlayCircleOutlined />
            </span>
            <div>
              <h3>{t.resources.playlist.title}</h3>
              <p>{t.resources.playlist.description}</p>
            </div>
            <div className="resources-playlist-action">
              <Button
                href={t.resources.playlist.playlistUrl}
                target="_blank"
                rel="noreferrer"
                icon={<YoutubeOutlined />}
              >
                {t.resources.playlist.button}
              </Button>
            </div>
          </div>
          <div className="resources-playlist-frame">
            <iframe
              src={t.resources.playlist.embedUrl}
              title={t.resources.playlist.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </article>

        <div className="resources-grid">
          {t.resources.items.map((item) => {
            const Icon = resourceIcons[item.id];

            return (
              <article className="resource-card" key={item.id}>
                <span className="resource-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div className="resource-card-copy">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <Button href={item.href} rel="noreferrer" target="_blank" icon={<Icon />}>
                  {item.button}
                </Button>
              </article>
            );
          })}
        </div>
      </MotionSection>
    </SiteShell>
  );
}
