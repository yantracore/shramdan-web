"use client";

// First-visit welcome dialog. Shown once per browser (key
// "shramdan-onboarded"), explains the three core actions a citizen
// can take. Two CTAs: "Show me issues" and "Browse campaigns". A
// third button lets users skip and saves the flag without routing.

import {
  CalendarOutlined,
  CloseOutlined,
  FlagOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "shramdan-onboarded";

const COPY = {
  np: {
    badge: "स्वागत छ",
    title: "श्रमदानमा कसरी सहभागी हुने",
    intro:
      "तीन सरल काम — हेर्न, समर्थन गर्न र अघि बढ्न। तपाईंलाई जे मन छ त्यहीँबाट सुरु गर्नुहोस्।",
    steps: [
      {
        icon: FlagOutlined,
        title: "समस्या रिपोर्ट",
        body: "आफ्नो टोलको कुनै सरसफाइ वा मर्मतको आवश्यकता ठाउँ पठाउनुहोस्।"
      },
      {
        icon: ThunderboltOutlined,
        title: "समर्थन गर्नुहोस्",
        body: "अरूले पठाएका समस्यामा हृदय थिच्नुहोस् — प्राथमिकता तय हुन्छ।"
      },
      {
        icon: CalendarOutlined,
        title: "अभियानमा जोडिनुहोस्",
        body: "तय भएका अभियानमा भूमिका छानेर सहभागी हुनुहोस्।"
      }
    ],
    primaryCta: "समस्याहरू हेर्ने",
    secondaryCta: "अभियानहरू हेर्ने",
    skip: "अहिलेलाई पन्छाउने"
  },
  en: {
    badge: "Welcome",
    title: "Three ways to take part in Shramdan",
    intro:
      "Three simple paths — observe, support, and act. Start wherever fits.",
    steps: [
      {
        icon: FlagOutlined,
        title: "Report an issue",
        body: "Submit a spot in your neighborhood that needs a cleanup or repair."
      },
      {
        icon: ThunderboltOutlined,
        title: "Support",
        body: "Tap the heart on issues others have submitted — that's how priorities form."
      },
      {
        icon: CalendarOutlined,
        title: "Join a campaign",
        body: "Pick a role on a scheduled campaign and show up."
      }
    ],
    primaryCta: "Browse issues",
    secondaryCta: "Browse campaigns",
    skip: "Skip for now"
  }
};

export function OnboardingSpotlight({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // Defer by a tick so the page paints once before the spotlight pops.
        const id = window.setTimeout(() => setOpen(true), 700);
        return () => window.clearTimeout(id);
      }
    } catch {
      // ignore — localStorage might be blocked
    }
    return undefined;
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <article className="onboarding-card">
        <button
          type="button"
          className="onboarding-close"
          onClick={dismiss}
          aria-label={t.skip}
        >
          <CloseOutlined />
        </button>
        <span className="onboarding-badge">{t.badge}</span>
        <h2>{t.title}</h2>
        <p className="onboarding-intro">{t.intro}</p>
        <ol className="onboarding-steps">
          {t.steps.map(({ icon: Icon, title, body }, i) => (
            <li key={i} className="onboarding-step">
              <span className="onboarding-step-icon" aria-hidden="true">
                <Icon />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="onboarding-actions">
          <Link
            href="/campaigns"
            className="onboarding-cta-primary"
            onClick={dismiss}
          >
            {t.primaryCta}
          </Link>
          <Link
            href="/campaigns"
            className="onboarding-cta-secondary"
            onClick={dismiss}
          >
            {t.secondaryCta}
          </Link>
        </div>
        <button
          type="button"
          className="onboarding-skip"
          onClick={dismiss}
        >
          {t.skip}
        </button>
      </article>
    </div>
  );
}
