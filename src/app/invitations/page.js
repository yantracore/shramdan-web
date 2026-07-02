"use client";

import {
  ArrowRightOutlined,
  BankOutlined,
  BgColorsOutlined,
  BugOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  EditOutlined,
  HeartOutlined,
  LineChartOutlined,
  RocketOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import Image from "next/image";
import { MotionSection } from "@/components/MotionSection";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

// ── SLOT E: lines 128–140 of old-HomeClient.js, verbatim (volunteerRoleIcons) ──
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

export default function InvitationsPage() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;

  return (
    <SiteShell pageTitle={t.volunteerInvite.pageTitle}>
      {/* ── SLOT D: lines 739–819 of old-HomeClient.js, verbatim (volunteer-invite-section) ── */}
      <MotionSection as="section" className="volunteer-invite-section" aria-labelledby="volunteer-invite-title">
        <div className="volunteer-visual">
          <div className="volunteer-brand-card glass-panel">
            <span className="volunteer-logo">
              <Image alt="" height={96} src="/branding/logo-mark.png" width={96} />
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
    </SiteShell>
  );
}
