"use client";

import {
  ArrowRightOutlined,
  BankOutlined,
  BgColorsOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  FilePptOutlined,
  FileTextOutlined,
  GithubOutlined,
  HeartOutlined,
  LineChartOutlined,
  PartitionOutlined,
  RocketOutlined,
  ShopOutlined,
  TeamOutlined,
  ToolOutlined,
  TrophyOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import Image from "next/image";
import Confetti from "react-confetti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

const LAUNCH_STORAGE_KEY = "shramdan-inaugurated";
const LAUNCH_DURATION_MS = 5600;
const INAUGURATION_AT = new Date("2026-05-15T12:15:00+05:45").getTime();
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const getCountdownParts = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
};

const formatCountdownValue = (value) => String(value).padStart(2, "0");

const resourceIcons = {
  presentation: FilePptOutlined,
  documents: FileTextOutlined,
  github: GithubOutlined
};

const volunteerRoleIcons = {
  frontend: CodeOutlined,
  backend: DatabaseOutlined,
  uiux: RocketOutlined,
  graphics: BgColorsOutlined,
  legal: BankOutlined,
  finance: LineChartOutlined,
  donors: HeartOutlined,
  leaders: TeamOutlined
};

const cleanupAreaIcons = {
  roadside: EnvironmentOutlined,
  lands: PartitionOutlined,
  riverbanks: LineChartOutlined,
  drains: ToolOutlined,
  parks: ShopOutlined,
  trails: TrophyOutlined
};

const workflowStepIcons = {
  listing: FileTextOutlined,
  vote: CheckCircleOutlined,
  plan: CalendarOutlined,
  event: ToolOutlined,
  results: LineChartOutlined
};

export default function Home() {
  const { language } = usePreferences();
  const t = copy[language];
  const heroRef = useRef(null);
  const launchTimerRef = useRef(null);
  const [hasInaugurated, setHasInaugurated] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [hasAutoLaunched, setHasAutoLaunched] = useState(false);
  const [launchRun, setLaunchRun] = useState(0);
  const [heroSize, setHeroSize] = useState({ width: 0, height: 0 });
  const [viewportWidth, setViewportWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [now, setNow] = useState(null);

  const triggerLaunch = useCallback(() => {
    setHasAutoLaunched(true);

    if (IS_PRODUCTION) {
      setHasInaugurated(true);

      try {
        window.localStorage.setItem(LAUNCH_STORAGE_KEY, "true");
      } catch {
        // The launch should still feel complete even if storage is unavailable.
      }
    }

    if (reduceMotion) {
      return;
    }

    setLaunchRun((current) => current + 1);
    setIsLaunching(true);
    if (launchTimerRef.current) {
      window.clearTimeout(launchTimerRef.current);
    }

    launchTimerRef.current = window.setTimeout(() => {
      setIsLaunching(false);
    }, LAUNCH_DURATION_MS);
  }, [reduceMotion]);

  useEffect(() => {
    if (!IS_PRODUCTION) {
      return undefined;
    }

    const storageTimer = window.setTimeout(() => {
      try {
        setHasInaugurated(window.localStorage.getItem(LAUNCH_STORAGE_KEY) === "true");
      } catch {
        setHasInaugurated(false);
      }
    }, 0);

    return () => window.clearTimeout(storageTimer);
  }, []);

  useEffect(() => {
    if (!heroRef.current) {
      return undefined;
    }

    const updateHeroSize = () => {
      const rect = heroRef.current.getBoundingClientRect();
      setHeroSize({ width: rect.width, height: rect.height });
    };

    updateHeroSize();
    const observer = new ResizeObserver(updateHeroSize);
    observer.observe(heroRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setReduceMotion(mediaQuery.matches);

    syncMotionPreference();
    mediaQuery.addEventListener("change", syncMotionPreference);

    return () => mediaQuery.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    const syncCountdown = () => {
      const currentTime = Date.now();

      setNow(currentTime);

      if (currentTime >= INAUGURATION_AT && !hasInaugurated && !hasAutoLaunched) {
        triggerLaunch();
      }
    };

    const initialTimer = window.setTimeout(syncCountdown, 0);
    const interval = window.setInterval(syncCountdown, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [hasAutoLaunched, hasInaugurated, triggerLaunch]);

  useEffect(
    () => () => {
      if (launchTimerRef.current) {
        window.clearTimeout(launchTimerRef.current);
      }
    },
    []
  );

  const hasCountdownEnded = now !== null && now >= INAUGURATION_AT;
  const remainingMs = now === null ? 0 : Math.max(0, INAUGURATION_AT - now);
  const countdown = useMemo(() => getCountdownParts(remainingMs), [remainingMs]);
  const panel = hasCountdownEnded || hasInaugurated ? t.panel.launched : t.panel.countdown;
  const countdownItems = [
    { key: "days", value: countdown.days, label: t.panel.units.days },
    { key: "hours", value: countdown.hours, label: t.panel.units.hours },
    { key: "minutes", value: countdown.minutes, label: t.panel.units.minutes },
    { key: "seconds", value: countdown.seconds, label: t.panel.units.seconds }
  ];

  return (
    <SiteShell>
      <section
        id="top"
        ref={heroRef}
        className={`hero-section${isLaunching ? " is-launching" : ""}${
          hasInaugurated ? " has-inaugurated" : ""
        }`}
      >
        {isLaunching && viewportWidth > 0 && heroSize.height > 0 ? (
          <Confetti
            key={launchRun}
            className="hero-confetti"
            width={Math.round(viewportWidth)}
            height={Math.round(heroSize.height)}
            numberOfPieces={1080}
            recycle={false}
            gravity={0.23}
            wind={0.02}
            initialVelocityX={14}
            initialVelocityY={28}
            tweenDuration={LAUNCH_DURATION_MS}
            colors={["#176b5c", "#e75f1b", "#f5b642", "#5cbf9f", "#f8fff8", "#ffcf70"]}
          />
        ) : null}
        <div className="hero-copy">
          {t.hero.eyebrow ? <span className="eyebrow">{t.hero.eyebrow}</span> : null}
          <h1>{t.hero.title}</h1>
          <p className="hero-subtitle">{t.hero.subtitle}</p>
          <p>{t.hero.support}</p>
          <div className="hero-actions">
            <Button type="primary" size="large" href="/join" icon={<HeartOutlined />}>
              {t.hero.join}
            </Button>
          </div>
        </div>
        <aside className="hero-panel glass-panel" aria-label={t.ariaLabels.launchNote} aria-live="polite">
          {isLaunching ? (
            <span className="launch-burst" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
          ) : null}
          <h2>{panel.title}</h2>
          {now !== null && !hasCountdownEnded && !hasInaugurated ? (
            <div className="countdown-grid" aria-label={t.panel.countdownLabel}>
              {countdownItems.map((item) => (
                <span className="countdown-item" key={item.key}>
                  <strong>{formatCountdownValue(item.value)}</strong>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          ) : null}
          <p>{panel.body}</p>
          {now !== null && !hasCountdownEnded && !hasInaugurated ? (
            <span className="countdown-target">{t.panel.target}</span>
          ) : null}
        </aside>
      </section>

      <section className="cleanup-areas-section" aria-labelledby="cleanup-areas-title">
        <div className="cleanup-areas-heading">
          <span className="eyebrow">{t.cleanupAreas.eyebrow}</span>
          <div>
            <h2 id="cleanup-areas-title">{t.cleanupAreas.title}</h2>
            <p>{t.cleanupAreas.intro}</p>
          </div>
        </div>

        <div className="cleanup-areas-grid">
          {t.cleanupAreas.items.map((area, index) => {
            const Icon = cleanupAreaIcons[area.id] ?? EnvironmentOutlined;

            return (
              <article className="cleanup-area-card" data-area={area.id} key={area.id}>
                <div className="cleanup-area-topline">
                  <span className="cleanup-area-number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{area.title}</h3>
                </div>
                <div className="cleanup-area-image">
                  <Image
                    alt={area.imageAlt}
                    fill
                    sizes="(max-width: 700px) calc(100vw - 56px), (max-width: 1180px) 30vw, 180px"
                    src={area.image}
                  />
                </div>
                <span className="cleanup-area-icon" aria-hidden="true">
                  <Icon />
                </span>
                <p>{area.body}</p>
              </article>
            );
          })}
        </div>

        <div className="cleanup-reasons" aria-label={t.cleanupAreas.reasonsLabel}>
          <strong>{t.cleanupAreas.reasonsTitle}</strong>
          {t.cleanupAreas.reasons.map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      </section>

      <section className="core-idea-section" aria-labelledby="core-idea-title">
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
          <div className="core-idea-landscape" aria-hidden="true">
            <span className="landscape-people">
              <TeamOutlined />
            </span>
          </div>
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

        <p className="phase-note">
          <span aria-hidden="true">
            <Image alt="" height={96} src="/images/logo.png" width={96} />
          </span>
          {t.coreIdea.phaseNote}
        </p>
      </section>

      <section className="volunteer-invite-section" aria-labelledby="volunteer-invite-title">
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
              <strong>{t.volunteerInvite.titleStrong}</strong>
              <span>{t.volunteerInvite.titleTrail}</span>
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

        <div className="volunteer-roles-panel">
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
                  <h3>{role.title}</h3>
                  <span className="volunteer-role-badge">{role.badge}</span>
                  <p>{role.description}</p>
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

      </section>

      <section className="page-section resources-section" aria-labelledby="resources-title">
        <div className="section-heading resources-heading">
          <span className="eyebrow">{t.resources.eyebrow}</span>
          <h2 id="resources-title">{t.resources.title}</h2>
          <p>{t.resources.intro}</p>
        </div>

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
      </section>
    </SiteShell>
  );
}
