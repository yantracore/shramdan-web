"use client";

import { SiteShell } from "@/components/SiteShell";
import { IntroCinematic } from "@/components/IntroCinematic";
import { usePreferences } from "@/app/providers";

const copy = {
  np: {
    eyebrow: "एप परिचय",
    title: "श्रमदान",
    tagline: "हाम्रो श्रम, हाम्रो समाज, हाम्रो भविष्य।",
    scrollCue: "↓ तल स्क्रोल गर्नुहोस्",
    ctaTitle: "तपाईं पनि जोडिनुहोस्",
    ctaBody:
      "यो आन्दोलन हो, संस्था होइन। हरेक हात गन्तीमा छ — तपाईंको पनि।",
    acts: [
      {
        id: "what",
        kicker: "१ — श्रमदान भनेको",
        title: "स-साना हातहरू मिलेर ठूला परिवर्तन सम्भव हुन्छ।",
        body:
          "देशका हरेक समस्या समाधानका लागि सरकारको प्रतीक्षा गरेर हुँदैन। हामी नागरिकहरू आफैं मिलेर सरसफाइ, मर्मत, वृक्षारोपण, टोल सुधार जस्ता आधारभूत काम गर्न सक्छौँ।"
      },
      {
        id: "how",
        kicker: "२ — कसरी काम गर्छ",
        title: "पाँच पाइला, एउटा यात्रा।",
        items: [
          "नागरिकले समस्या रिपोर्ट गर्छन्",
          "समुदायले मतदान गर्छ",
          "संयोजक चयन र मिति-समय तय",
          "मिलेर अभियान सञ्चालन — युट्युब लाइभमा प्रसारण",
          "नतिजा पारदर्शी रूपमा प्रकाशन"
        ]
      },
      {
        id: "movement",
        kicker: "३ — आन्दोलन, संस्था होइन",
        title:
          "श्रमदान एनजीओ होइन, फाउन्डेसन होइन, कम्पनी होइन। यो आन्दोलन हो।",
        body:
          "एपदेखि अभियानसम्म हरेक तह श्रमदान बाटै चलिरहेको छ — डेभलपर, डिजाइनर, फोटोग्राफर, लाइभस्ट्रिमर, कामदार — सबै समान सदस्य।"
      },
      {
        id: "transparency",
        kicker: "४ — पारदर्शिता",
        title: "हरेक रुपैयाँ — आउनेमा, जानेमा।",
        body:
          "अनुदान परियोजनासँग जोडिएको छ। बचत सञ्चालनमा। हरेक खर्च सार्वजनिक खातामा। युट्युब लाइभमा प्रसारित अभियानहरूले च्यानल कमाइ पनि सुरु गर्छ — सबै पारदर्शी।"
      },
      {
        id: "future",
        kicker: "५ — भविष्य",
        title: "सवारी साधन, क्षेत्रीय शाखा, स्कुल — सपना ठूला।",
        body:
          "१-३ वर्ष: औजार पुस्तकालय, यातायात सेवा। ३-५ वर्ष: क्षेत्रीय शाखा, बहुभाषिक। ५+ वर्ष: सरकारी साझेदारी, सीमापार विस्तार।",
        quote:
          "एप कहिल्यै ब्रोसर बन्दैन। यो मन्दिर हो — सामूहिक श्रमको।"
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
