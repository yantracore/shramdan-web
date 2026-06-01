"use client";

import { SiteShell } from "@/components/SiteShell";
import { IntroCinematic } from "@/components/IntroCinematic";
import { usePreferences } from "@/app/providers";

const copy = {
  np: {
    eyebrow: "एप परिचय",
    title: "श्रमदान",
    tagline: "हाम्रो श्रम, हाम्रो समाज, हाम्रो भविष्य।",
    scrollCue: "↓ तल scroll गर्नुहोस्",
    ctaTitle: "तपाईं पनि जोडिनुहोस्",
    ctaBody:
      "यो आन्दोलन हो, संस्था होइन। हरेक हात गन्तीमा छ — तपाईंको पनि।",
    acts: [
      {
        id: "what",
        kicker: "1 — श्रमदान भनेको",
        title: "स-साना हातहरू मिलेर ठूला परिवर्तन सम्भव हुन्छ।",
        body:
          "देशका हरेक समस्या समाधानका लागि सरकारको प्रतीक्षा गरेर हुँदैन। हामी नागरिकहरू आफैं मिलेर सरसफाइ, मर्मत, वृक्षारोपण, टोल सुधार जस्ता आधारभूत काम गर्न सक्छौँ।"
      },
      {
        id: "how",
        kicker: "2 — कसरी काम गर्छ",
        title: "पाँच पाइला, एउटा यात्रा।",
        items: [
          "नागरिकले समस्या report गर्छन्",
          "समुदायले मतदान गर्छ",
          "Leader चयन र मिति-समय तय",
          "मिलेर event execute — YouTube Live मा प्रसारण",
          "Result transparent रूपमा publish"
        ]
      },
      {
        id: "movement",
        kicker: "3 — Movement, संस्था होइन",
        title:
          "श्रमदान NGO होइन, foundation होइन, company होइन। यो आन्दोलन हो।",
        body:
          "App देखि event सम्म हरेक तह श्रमदान बाटै चलिरहेको छ — Developer, Designer, Photographer, Livestreamer, Worker — सबै equal members।"
      },
      {
        id: "transparency",
        kicker: "4 — पारदर्शिता",
        title: "हरेक रुपैयाँ — आउनेमा, जानेमा।",
        body:
          "Donations project-tied छन्। Surplus operations मा। हरेक खर्च public ledger मा। YouTube Live मा प्रसारित events ले channel monetization पनि शुरू गर्छ — सबै transparent।"
      },
      {
        id: "future",
        kicker: "5 — भविष्य",
        title: "Vehicles, regional chapters, schools — सपना ठूला।",
        body:
          "१-३ वर्ष: tools libraries, transport service। ३-५ वर्ष: regional chapters, multilingual। ५+ वर्ष: government partnerships, cross-border replication।",
        quote:
          "App कहिल्यै ब्रोशर बन्दैन। यो मन्दिर हो — सामूहिक श्रमको।"
      }
    ],
    ctas: [
      { href: "/join", label: "जोडिनुहोस्" },
      { href: "/learn", label: "विवरण पढ्नुहोस्" },
      { href: "/issues/new", label: "समस्या रिपोर्ट गर्नुहोस्" }
    ]
  },
  en: {
    eyebrow: "App intro",
    title: "Shramdan",
    tagline: "Our labor, our society, our future.",
    scrollCue: "↓ scroll down",
    ctaTitle: "Join us",
    ctaBody:
      "This is a movement, not an organization. Every pair of hands counts — including yours.",
    acts: [
      {
        id: "what",
        kicker: "1 — What Shramdan is",
        title: "Small hands together make big change possible.",
        body:
          "Not every problem in the country will be solved by waiting for the government. As citizens, we can move basic work forward ourselves — cleanups, repairs, tree planting, neighborhood improvement."
      },
      {
        id: "how",
        kicker: "2 — How it works",
        title: "Five steps, one journey.",
        items: [
          "Citizens report local problems",
          "The community votes",
          "A leader is selected; date and time are set",
          "We execute the event together — broadcast via YouTube Live",
          "Results published transparently"
        ]
      },
      {
        id: "movement",
        kicker: "3 — Movement, not organization",
        title:
          "Shramdan is not an NGO, not a foundation, not a company. It is a movement.",
        body:
          "From the app to the event, every layer is itself a Shramdan — Developer, Designer, Photographer, Livestreamer, Worker — all equal members."
      },
      {
        id: "transparency",
        kicker: "4 — Transparency",
        title: "Every rupee — in and out.",
        body:
          "Donations are project-tied. Surplus goes to operations. Every expense lands on the public ledger. YouTube Live broadcasts also begin channel monetization — all transparent."
      },
      {
        id: "future",
        kicker: "5 — The future",
        title: "Vehicles, regional chapters, schools — big dreams.",
        body:
          "1–3 years: tool libraries, transport service. 3–5 years: regional chapters, multilingual. 5+ years: government partnerships, cross-border replication.",
        quote: "The app is not a brochure. It is a temple — for collective labor."
      }
    ],
    ctas: [
      { href: "/join", label: "Join us" },
      { href: "/learn", label: "Read the docs" },
      { href: "/issues/new", label: "Report an issue" }
    ]
  }
};

export default function IntroPage() {
  const { language } = usePreferences();
  const t = copy[language];
  return (
    <SiteShell>
      <IntroCinematic acts={t.acts} ctas={t.ctas} copy={t} />
    </SiteShell>
  );
}
