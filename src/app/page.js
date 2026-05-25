"use client";

import {
  ApiOutlined,
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
  MessageOutlined,
  PartitionOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  ShopOutlined,
  TeamOutlined,
  ToolOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
  YoutubeOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import Image from "next/image";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

const resourceIcons = {
  participate: VideoCameraOutlined,
  watchLive: YoutubeOutlined,
  discord: MessageOutlined,
  apiDocs: ApiOutlined,
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
  const featuredResources = t.heroPanel.resources.map((resource) => {
    const item = t.resources.items.find((candidate) => candidate.id === resource.id);
    const Icon = resourceIcons[resource.id] ?? FileTextOutlined;

    return {
      ...resource,
      href: resource.href ?? item?.href ?? "#",
      Icon
    };
  });

  return (
    <SiteShell>
      <section id="top" className="hero-section">
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
        <aside className="hero-panel glass-panel" aria-label={t.ariaLabels.heroPanel}>
          <span className="hero-panel-kicker">{t.heroPanel.kicker}</span>
          <h2>{t.heroPanel.title}</h2>
          <p>{t.heroPanel.body}</p>
          <div className="hero-panel-phase">
            <span>{t.heroPanel.phaseLabel}</span>
            <strong>{t.heroPanel.phaseValue}</strong>
          </div>
          <div className="hero-panel-links" aria-label={t.heroPanel.resourcesLabel}>
            {featuredResources.map(({ Icon, href, id, label, title }) => (
              <a href={href} key={id} rel="noreferrer" target="_blank">
                <span className="hero-panel-link-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{label}</small>
                </span>
                <ArrowRightOutlined aria-hidden="true" />
              </a>
            ))}
          </div>
        </aside>
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

        <p className="phase-note">
          <span aria-hidden="true">
            <Image alt="" height={96} src="/images/logo.png" width={96} />
          </span>
          {t.coreIdea.phaseNote}
        </p>
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
                    sizes="(max-width: 620px) calc(100vw - 56px), (max-width: 1180px) 30vw, 380px"
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
              <span>{t.volunteerInvite.titleTrail}</span>
              <strong>{t.volunteerInvite.titleStrong}</strong>
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
      </section>
    </SiteShell>
  );
}
