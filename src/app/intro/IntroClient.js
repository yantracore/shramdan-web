"use client";

import {
  ApiOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  BuildOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HeartOutlined,
  HomeOutlined,
  LikeOutlined,
  LineChartOutlined,
  LoadingOutlined,
  MessageOutlined,
  MobileOutlined,
  SafetyOutlined,
  ShareAltOutlined,
  TeamOutlined,
  ToolOutlined,
  TranslationOutlined,
  UnorderedListOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import Image from "next/image";
import Link from "next/link";
import { BrochureHero } from "@/components/BrochureHero";
import { MotionSection } from "@/components/MotionSection";
import { SectionVideoBackground } from "@/components/SectionVideoBackground";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

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

export default function IntroClient({ summary }) {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const buildingNowCards = buildBuildingNowItems({
    inProgress: summary?.inProgress ?? [],
    upcoming: summary?.upcoming ?? [],
    recentlyDone: summary?.recentlyDone ?? [],
    t
  });

  return (
    <SiteShell pageTitle={t.pageTitles.intro}>
      <BrochureHero variant="intro" />

      <MotionSection as="section" className="event-types-section" aria-labelledby="event-types-title">
        <div className="event-types-heading">
          <SectionVideoBackground
            src="/images/demo-events/bagmati-cleanup.mp4"
            poster="/images/demo-events/bagmati-cleanup.jpg"
            overlay="soft"
          />
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
            <Image alt="" height={96} src="/branding/logo-mark.png" width={96} />
          </span>
          {t.eventTypes.phaseNote}
        </p>
      </MotionSection>

      <MotionSection as="section" className="cleanup-areas-section" aria-labelledby="cleanup-areas-title">
        <div className="cleanup-areas-heading">
          <SectionVideoBackground
            src="/images/demo-events/kamalpokhari-beautify.mp4"
            poster="/images/demo-events/kamalpokhari-beautify.jpg"
            overlay="soft"
          />
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
          <SectionVideoBackground
            src="/images/demo-events/suryabinayak-trees.mp4"
            poster="/images/demo-events/suryabinayak-trees.jpg"
            overlay="core"
            objectPosition="right center"
          />
          <div className="core-idea-copy">
            <span className="core-idea-eyebrow">
              <span aria-hidden="true">
                <Image alt="" height={96} src="/branding/logo-mark.png" width={96} />
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

    </SiteShell>
  );
}
