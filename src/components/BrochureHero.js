"use client";

import {
  ArrowRightOutlined,
  ExperimentOutlined,
  HeartOutlined,
  VideoCameraOutlined,
  YoutubeOutlined
} from "@ant-design/icons";
import { Button, Progress } from "antd";
import { useEffect, useState, useSyncExternalStore } from "react";
import { MotionSection } from "@/components/MotionSection";
import { SectionVideoBackground } from "@/components/SectionVideoBackground";
import { TimeOfDayGreeting } from "@/components/TimeOfDayGreeting";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

const LIVE_RESOURCE_IDS = new Set(["participate", "watchLive"]);

const panelLinkIcons = {
  participate: VideoCameraOutlined,
  watchLive: YoutubeOutlined
};

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

// The test-site CTA must not link the staging site to itself. Host is only
// knowable in the browser; useSyncExternalStore renders the server snapshot
// (false) through hydration, then swaps in the real host check — no mismatch.
const noopSubscribe = () => () => {};

function useOnTestSite() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.hostname === "stage.shramdan.org",
    () => false
  );
}

export function BrochureHero({ variant = "home", overallPercent = null }) {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  const isHome = variant === "home";
  const isLiveNow = useIsLiveNow();
  const onTestSite = useOnTestSite();
  const panel = t.devPanel;
  const panelLinks = isHome
    ? panel.links.map((link) => {
        const item = t.resources.items.find((candidate) => candidate.id === link.id);
        return { ...link, title: link.title ?? item?.title ?? link.label, href: item?.href ?? "#" };
      })
    : [];

  return (
    <MotionSection
      as="section"
      id="top"
      className={isHome ? "hero-section" : "hero-section hero-section--solo"}
    >
      <SectionVideoBackground
        src="/images/demo-events/bagmati-cleanup.mp4"
        poster="/images/demo-events/bagmati-cleanup.jpg"
        overlay="hero"
        objectPosition="center right"
      />
      <div className="hero-copy">
        {t.hero.eyebrow ? (
          <span className="eyebrow">
            <TimeOfDayGreeting language={language} /> {t.hero.eyebrow}
          </span>
        ) : null}
        <h1>{t.hero.title}</h1>
        <p className="hero-subtitle">{t.hero.subtitle}</p>
        <p>{t.hero.support}</p>
        <div className="hero-actions">
          <Button type="primary" size="large" href="/join" icon={<HeartOutlined />}>
            {t.hero.join}
          </Button>
          {isHome ? (
            <Button size="large" href="/intro" icon={<ArrowRightOutlined />}>
              {t.hero.learnMore}
            </Button>
          ) : null}
          {isHome && !onTestSite ? (
            <Button size="large" href={panel.testSite.href} icon={<ExperimentOutlined />}>
              {panel.testSite.label}
            </Button>
          ) : null}
        </div>
      </div>
      {isHome ? (
        <aside className="hero-panel glass-panel" aria-label={panel.title}>
          <span className="hero-panel-kicker">{panel.kicker}</span>
          <h2>{panel.title}</h2>
          <p>{panel.body}</p>
          {overallPercent != null ? (
            <div className="hero-panel-progress" aria-label={panel.progressAria}>
              <div className="hero-panel-progress-row">
                <span>{panel.progressLabel}</span>
                <strong>{overallPercent}%</strong>
              </div>
              <Progress
                percent={overallPercent}
                showInfo={false}
                size="small"
                strokeColor="#176b5c"
                railColor="rgba(255, 255, 255, 0.25)"
                aria-label={panel.progressAria}
              />
            </div>
          ) : null}
          <div className="hero-panel-links" aria-label={panel.linksLabel}>
            {panelLinks.map(({ href, id, label, title }) => {
              const Icon = panelLinkIcons[id] ?? VideoCameraOutlined;
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
                        <span className="live-badge" aria-label={panel.liveAria}>
                          <span className="live-dot" aria-hidden="true" />
                          {panel.liveBadge}
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
          {!onTestSite ? (
            <Button
              block
              className="hero-panel-test-cta"
              href={panel.testSite.href}
              icon={<ExperimentOutlined />}
            >
              {panel.testSite.label}
            </Button>
          ) : null}
        </aside>
      ) : null}
    </MotionSection>
  );
}
