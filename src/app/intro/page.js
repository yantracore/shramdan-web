"use client";

// Phase 6 (2026-06-05 pivot) — the intro page reads as two photo-driven
// chapters now, not the prior 5-act manifesto. The "how it works" steps
// come from siteContent.coreIdea (same source the homepage used to use),
// the community-collaboration chapter is new copy added here. The old
// brochure-cheese acts ("movement vs organization", "government
// partnerships", "Join us" CTA) are gone — see the deletion of
// HomeClient.js in the same commit.

import { SiteShell } from "@/components/SiteShell";
import { IntroCinematic } from "@/components/IntroCinematic";
import { usePreferences } from "@/app/providers";

const copy = {
  np: {
    eyebrow: "एप परिचय",
    title: "श्रमदान",
    pageTitle: "श्रमदान — परिचय",
    acts: [
      {
        id: "steps",
        kicker: "१ — कसरी काम गर्छ",
        title: "पाँच पाइला, एउटा यात्रा।"
      },
      {
        id: "community",
        kicker: "२ — समुदायले मिलेर चलाउँछ",
        title: "श्रमदान आन्दोलन हो — संस्था होइन।",
        tiles: [
          {
            id: "maintenance",
            title: "मर्मतसम्भार सामूहिक",
            body:
              "अभियानहरूको अनुगमन, फलोअप र अनुभव सहभागीहरूले नै लेख्छन्। एप उनै सदस्यहरूले निर्माण र मर्मत गर्छन्।",
            image: "/images/demo-events/bagmati-cleanup.jpg",
            imageAlt: "बागमती किनार सरसफाइमा सहभागी सदस्यहरू"
          },
          {
            id: "funding",
            title: "पारदर्शी कोष",
            body:
              "अनुदान प्रत्येक परियोजनासँग जोडिएको छ। हरेक रुपैयाँ — आउनेमा, जानेमा — सार्वजनिक खातामा देखिन्छ।",
            image: "/images/demo-events/hetauda-trees.jpg",
            imageAlt: "वृक्षारोपणका लागि बिरुवा बोकेका सहभागीहरू",
            link: { href: "/ledger", label: "पारदर्शी खाता हेर्नुहोस्" }
          },
          {
            id: "no-owner",
            title: "कसैको होइन — सबैको",
            body:
              "डेभलपर, डिजाइनर, फोटोग्राफर, लाइभस्ट्रिमर र श्रमिक — सबै समान सदस्य। कुनै एनजीओ, फाउन्डेसन वा कम्पनी छैन।",
            image: "/images/demo-events/gorkha-done.jpg",
            imageAlt: "गोर्खा सरसफाइ अभियानको सम्पन्न दृश्य",
            link: { href: "/learn", label: "थप जान्नुहोस्" }
          }
        ]
      }
    ],
    close: {
      text: "अहिले चलिरहेका कार्यक्रम र समस्याहरू।",
      link: { href: "/", label: "होमपेजमा जानुहोस्" }
    }
  },
  en: {
    eyebrow: "App intro",
    title: "Shramdan",
    pageTitle: "Shramdan — Intro",
    acts: [
      {
        id: "steps",
        kicker: "1 — How it works",
        title: "Five steps, one journey."
      },
      {
        id: "community",
        kicker: "2 — Run together by the community",
        title: "Shramdan is a movement — not an organization.",
        tiles: [
          {
            id: "maintenance",
            title: "Community maintenance",
            body:
              "Participants document their own follow-ups; the app is built and maintained by the same members.",
            image: "/images/demo-events/bagmati-cleanup.jpg",
            imageAlt: "Volunteers at a Bagmati river-bank cleanup"
          },
          {
            id: "funding",
            title: "Transparent funding",
            body:
              "Donations are project-tied. Every rupee — in and out — lands on the public ledger.",
            image: "/images/demo-events/hetauda-trees.jpg",
            imageAlt: "Tree-planting participants carrying saplings",
            link: { href: "/ledger", label: "View the public ledger" }
          },
          {
            id: "no-owner",
            title: "No one owns it",
            body:
              "Developer, designer, photographer, livestreamer, worker — all equal members. Not an NGO, not a foundation, not a company.",
            image: "/images/demo-events/gorkha-done.jpg",
            imageAlt: "Gorkha cleanup campaign completed",
            link: { href: "/learn", label: "Learn more" }
          }
        ]
      }
    ],
    close: {
      text: "Current events and active issues.",
      link: { href: "/", label: "Go to the homepage" }
    }
  }
};

export default function IntroPage() {
  const { language } = usePreferences();
  const t = copy[language] ?? copy.np;
  return (
    <SiteShell pageTitle={t.pageTitle}>
      <IntroCinematic copy={t} language={language} />
    </SiteShell>
  );
}
