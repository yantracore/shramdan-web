"use client";

import { ArrowRightOutlined, HeartOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { MotionSection } from "@/components/MotionSection";
import { SectionVideoBackground } from "@/components/SectionVideoBackground";
import { TimeOfDayGreeting } from "@/components/TimeOfDayGreeting";
import { usePreferences } from "@/app/providers";
import { copy } from "@/lib/siteContent";

export function BrochureHero({ variant = "home" }) {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;

  return (
    <MotionSection as="section" id="top" className="hero-section hero-section--solo">
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
          {variant === "home" ? (
            <Button size="large" href="/intro" icon={<ArrowRightOutlined />}>
              {t.hero.learnMore}
            </Button>
          ) : null}
        </div>
      </div>
    </MotionSection>
  );
}
