"use client";

import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { Button, Progress, Statistic } from "antd";
import {
  campaigns,
  contributionOptions,
  impactStories,
  issues,
  lifecycleSteps
} from "@/data/mockData";
import { CampaignCard } from "@/components/CampaignCard";
import { ContributionOption } from "@/components/ContributionOption";
import { IssueCard } from "@/components/IssueCard";
import { StatusTag } from "@/components/StatusTag";
import { ImpactStoryCard } from "@/components/ImpactStoryCard";

export default function Home() {
  const featuredCampaign = campaigns[0];
  const topIssues = issues.slice(0, 3);

  return (
    <main className="site-shell">
      <header className="topbar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Shramdaan home">
          <span className="brand-mark">S</span>
          <span>Shramdaan</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#issues">Issues</a>
          <a href="#campaign">Campaign</a>
          <a href="#impact">Impact</a>
        </nav>
        <Button type="primary" href="#join">
          Join a cleanup
        </Button>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <StatusTag status="Campaign Ready" />
          <h1>Community cleanups, organized from first report to final proof.</h1>
          <p>
            Shramdaan helps local residents turn visible cleanup problems into
            supported campaigns with clear contribution paths and transparent
            outcomes.
          </p>
          <div className="hero-actions">
            <Button type="primary" size="large" href="#issues">
              Support an issue <ArrowRightOutlined />
            </Button>
            <Button size="large" href="#campaign">
              View campaign
            </Button>
          </div>
        </div>

        <aside className="hero-panel" aria-label="Featured cleanup campaign">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Featured campaign</span>
              <h2>{featuredCampaign.title}</h2>
            </div>
            <StatusTag status={featuredCampaign.status} compact />
          </div>
          <p>{featuredCampaign.goal}</p>
          <div className="campaign-meta">
            <span>
              <EnvironmentOutlined /> {featuredCampaign.location}
            </span>
            <span>
              <CalendarOutlined /> {featuredCampaign.date}
            </span>
          </div>
          <Progress
            percent={featuredCampaign.progress}
            strokeColor="#176b5c"
            railColor="#d8e8df"
            aria-label={`${featuredCampaign.progress}% of campaign help pledged`}
          />
          <div className="stat-grid">
            <Statistic title="Volunteers" value={featuredCampaign.volunteers} />
            <Statistic title="Supporters" value={featuredCampaign.supporters} />
          </div>
        </aside>
      </section>

      <section className="trust-strip" aria-label="Shramdaan lifecycle">
        {lifecycleSteps.map((step) => (
          <div key={step} className="lifecycle-step">
            <CheckCircleOutlined />
            <span>{step}</span>
          </div>
        ))}
      </section>

      <section id="issues" className="page-section">
        <div className="section-heading">
          <span className="eyebrow">Local issues</span>
          <h2>Problems that can become community action.</h2>
          <p>
            Each issue keeps the essentials visible: location, support, urgency,
            status, and what needs to happen next.
          </p>
        </div>
        <div className="card-grid">
          {topIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      </section>

      <section id="campaign" className="page-section split-section">
        <div className="section-heading">
          <span className="eyebrow">Campaign detail</span>
          <h2>Join the Bagmati riverbank cleanup.</h2>
          <p>
            This first campaign view models volunteer intent, material support,
            and transparent progress without assuming production backend systems.
          </p>
          <div className="notice">
            <NotificationOutlined />
            <span>Nearby residents and interested supporters can opt in for follow-up updates.</span>
          </div>
        </div>
        <CampaignCard campaign={featuredCampaign} featured />
      </section>

      <section id="join" className="page-section">
        <div className="section-heading">
          <span className="eyebrow">Contribution paths</span>
          <h2>Help can mean labor, time, funds, materials, logistics, or sharing.</h2>
        </div>
        <div className="option-grid">
          {contributionOptions.map((option) => (
            <ContributionOption key={option.title} option={option} />
          ))}
        </div>
      </section>

      <section id="impact" className="page-section">
        <div className="section-heading">
          <span className="eyebrow">Published impact</span>
          <h2>Completed work should be visible, specific, and easy to trust.</h2>
        </div>
        <div className="impact-grid">
          {impactStories.map((story) => (
            <ImpactStoryCard key={story.id} story={story} />
          ))}
        </div>
      </section>

      <footer className="footer">
        <span>Shramdaan</span>
        <span>Built for practical community action in Nepal.</span>
      </footer>
    </main>
  );
}
