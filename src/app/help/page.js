"use client";

// /help — accordion-style FAQ for newcomers. 12 bilingual Q&As across
// four sections: getting started, events, issues, accounts. Each <details>
// is closed by default; click toggles. Plus a "still stuck?" footer
// linking to /feedback.

import {
  CalendarOutlined,
  FlagOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  UserOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

const COPY = {
  np: {
    pageTitle: "सहायता र प्रश्नोत्तर",
    eyebrow: "सहायता केन्द्र",
    title: "बारम्बार सोधिने प्रश्नहरू",
    intro:
      "श्रमदानमा कसरी सुरु गर्ने, अभियानमा कसरी जोडिने, समस्या कसरी रिपोर्ट गर्ने — यो पृष्ठले सबै सुरुवाती प्रश्नको जवाफ दिन्छ।",
    searchPlaceholder: "प्रश्न खोज्नुहोस्…",
    noResults: "कुनै प्रश्न भेटिएन। तपाईंको प्रश्न तल",
    feedbackCta: "सोध्नुहोस्",
    sections: [
      {
        id: "start",
        title: "शुरुवात",
        icon: PlusOutlined,
        items: [
          {
            q: "श्रमदान के हो?",
            a: "श्रमदान सामुदायिक मञ्च हो जहाँ नागरिकहरू स्थानीय समस्या रिपोर्ट गर्छन्, प्राथमिकतामा मतदान गर्छन्, र मिलेर सरसफाइ, वृक्षारोपण जस्ता अभियान सञ्चालन गर्छन्। यो NGO होइन — आन्दोलन हो।"
          },
          {
            q: "के मलाई सदस्य बन्नै पर्ने हो?",
            a: "होइन। हेर्न, सिक्न र अभियान खोज्न सदस्यता आवश्यक छैन। तर समस्या रिपोर्ट गर्न, समर्थन गर्न र अभियानमा जोडिन सदस्यता चाहिन्छ। फोन नम्बर र OTP बाट छिटो सदस्य बन्न सकिन्छ।"
          },
          {
            q: "के यो निःशुल्क हो?",
            a: "हो। श्रमदानको हरेक सुविधा निःशुल्क हो। हामी अनुदान, स्वयंसेवक श्रम, र पारदर्शी आर्थिक सहयोगबाट चल्छौँ।"
          }
        ]
      },
      {
        id: "events",
        title: "अभियानहरू",
        icon: CalendarOutlined,
        items: [
          {
            q: "नजिकैको अभियान कसरी थाहा पाउने?",
            a: "/events पृष्ठमा हाल लाइभ, आउँदै र भर्खर सम्पन्न सबै अभियान देखिन्छन्। तपाईंको ठाउँ नजिक हुने ‘तय भएका आउँदा अभियानहरू’ बाट पनि सोधिन्छ।"
          },
          {
            q: "मेरो भूमिका कुन रोज्ने?",
            a: "सफाइकर्मी, फोटोग्राफर, स्वास्थ्यकर्मी, सुरक्षा प्रमुख, संयोजक — हरेक अभियानमा फरक भूमिका हुन्छन्। अभियान विवरणमा प्रत्येक भूमिकाको खाली ठाउँ देखिन्छ। तपाईंलाई मिल्ने एउटा क्लिक गरेर जोडिनुहोस्।"
          },
          {
            q: "अभियानमा जान के लिनुपर्छ?",
            a: "हरेक अभियानको ‘भेला हुने स्थान’ खण्डमा विवरण हुन्छ। सामान्यतया: पन्जा, मास्क, पानीको बोतल, र अनुकूल जुत्ता। औजार (कुचो, झोला) टोलीले ल्याउँछ।"
          }
        ]
      },
      {
        id: "issues",
        title: "समस्याहरू",
        icon: FlagOutlined,
        items: [
          {
            q: "समस्या कसरी रिपोर्ट गर्ने?",
            a: "/issues/new पृष्ठमा गएर शीर्षक, विवरण, स्थान र तस्बिर अपलोड गर्नुहोस्। स्थान नक्सामा पिन गर्न सकिन्छ। सबमिट गरेपछि अरूले समर्थन (भोट) गर्न सक्छन्।"
          },
          {
            q: "मेरो समस्या के हुनेछ?",
            a: "समुदायले समर्थन गरेपछि उच्च-प्राथमिकताको समस्यामा अभियान संयोजकले अभियानको मिति र भूमिका तय गर्छन्। तपाईंलाई सूचना आउनेछ। अभियान सम्पन्न भएपछि नतिजा सार्वजनिक हुन्छ।"
          },
          {
            q: "के सबै समस्या स्वीकार हुन्छन्?",
            a: "हो — तर अभियानमा बदलिने प्रक्रिया सामुदायिक मतदान र संयोजक स्रोतमा निर्भर हुन्छ। निजी जग्गा, राजनीतिक प्रचार वा हिंसात्मक सामग्री स्वीकार्य छैन।"
          }
        ]
      },
      {
        id: "account",
        title: "खाता",
        icon: UserOutlined,
        items: [
          {
            q: "पासवर्ड बिर्सेँ। के गर्ने?",
            a: "/login पृष्ठको ‘पासवर्ड बिर्सनुभयो?’ लिङ्क प्रयोग गर्नुहोस्। फोन OTP बाट सदस्य हुनुहुन्छ भने पासवर्ड चाहिँदै चाहिँदैन।"
          },
          {
            q: "मेरो खाता कसरी मेटाउने?",
            a: "अहिले UI बाट प्रत्यक्ष मेट्ने सुविधा निर्माणाधीन छ। तत्कालका लागि /feedback पृष्ठबाट खाता हटाउन अनुरोध पठाउनुहोस् — २४ घण्टाभित्र काम सम्पन्न हुनेछ।"
          },
          {
            q: "मेरो डाटा कसले देख्छ?",
            a: "तपाईंको नाम, समर्थनको सूची र अभियान सहभागिता सार्वजनिक हुन्छन्। फोन नम्बर, इमेल र निजी टिप्पणी आन्तरिक रहन्छन्। पूर्ण विवरणका लागि गोपनीयता नीति हेर्नुहोस्।"
          }
        ]
      }
    ],
    stillStuck: "अझै उत्तर भेटिएन?",
    stillStuckBody: "तपाईंको प्रश्न प्रतिक्रिया पठाउनुहोस् — टोलीले इमेल वा फोनमा जवाफ दिनेछ।"
  },
  en: {
    pageTitle: "Help & FAQ",
    eyebrow: "Help center",
    title: "Frequently asked questions",
    intro:
      "How to get started, how to join an event, how to report an issue — every newcomer question answered on one page.",
    searchPlaceholder: "Search questions…",
    noResults: "No questions matched. Send yours below",
    feedbackCta: "Ask",
    sections: [
      {
        id: "start",
        title: "Getting started",
        icon: PlusOutlined,
        items: [
          {
            q: "What is Shramdan?",
            a: "Shramdan is a community platform where citizens report local issues, vote on priorities, and run cleanup / planting / repair campaigns together. It's not an NGO — it's a movement."
          },
          {
            q: "Do I need an account?",
            a: "No — browsing, learning, and discovering campaigns is open to everyone. But to report an issue, support one, or join an event, you'll need to sign up. Phone + OTP is the fastest path."
          },
          {
            q: "Is it free?",
            a: "Yes. Every Shramdan feature is free. We're funded by grants, volunteer labour, and transparent donations."
          }
        ]
      },
      {
        id: "events",
        title: "Campaigns",
        icon: CalendarOutlined,
        items: [
          {
            q: "How do I find campaigns near me?",
            a: "Browse /events for live, upcoming, and recently-completed campaigns. The 'Scheduled' bucket is the one to watch for upcoming work in your area."
          },
          {
            q: "Which role should I pick?",
            a: "Each campaign needs different roles — workers, photographers, medics, safety lead, coordinators. The roster panel shows open slots; pick the one that fits your skill and time."
          },
          {
            q: "What should I bring?",
            a: "Each campaign's 'meetup' section tells you. Usually: gloves, mask, water bottle, comfortable shoes. Tools (brooms, bags) are brought by the team."
          }
        ]
      },
      {
        id: "issues",
        title: "Issues",
        icon: FlagOutlined,
        items: [
          {
            q: "How do I report an issue?",
            a: "Open /issues/new, write a title and description, drop a pin on the map, upload a photo. Once submitted, others can support (vote) on it."
          },
          {
            q: "What happens to my report?",
            a: "Once it gains support, a coordinator schedules a campaign with date + roles. You'll get notified. The result is published after the campaign closes."
          },
          {
            q: "Will every issue be accepted?",
            a: "Yes — but whether it converts into a campaign depends on community votes and coordinator capacity. Private land, political ads, and violent content aren't accepted."
          }
        ]
      },
      {
        id: "account",
        title: "Account",
        icon: UserOutlined,
        items: [
          {
            q: "I forgot my password. Now what?",
            a: "Use the 'Forgot password?' link on /login. If you signed up with phone + OTP, you don't need a password at all."
          },
          {
            q: "How do I delete my account?",
            a: "A self-serve UI is in build. For now, send a request via /feedback — we'll close the account within 24 hours."
          },
          {
            q: "Who sees my data?",
            a: "Your name, supported issues, and event participation are public. Your phone, email, and private notes stay internal. See the privacy policy for the full picture."
          }
        ]
      }
    ],
    stillStuck: "Still stuck?",
    stillStuckBody: "Send us your question — we'll reply by email or phone."
  }
};

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

export default function HelpPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const [query, setQuery] = useState("");

  const q = normalize(query);
  const sections = useMemo(() => {
    if (!q) return t.sections;
    return t.sections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (it) => normalize(it.q).includes(q) || normalize(it.a).includes(q)
        )
      }))
      .filter((s) => s.items.length > 0);
  }, [q, t.sections]);

  const matched = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="help-section page-section">
        <header className="help-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
          <input
            type="search"
            className="help-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
          />
        </header>

        {sections.map((sec) => {
          const Icon = sec.icon || QuestionCircleOutlined;
          return (
            <section key={sec.id} className="help-block">
              <header className="help-block-header">
                <Icon aria-hidden="true" />
                <h2>{sec.title}</h2>
              </header>
              <div className="help-block-items">
                {sec.items.map((it, i) => (
                  <details key={i} className="help-faq">
                    <summary>{it.q}</summary>
                    <div className="help-faq-body">{it.a}</div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}

        {q && matched === 0 ? (
          <p className="help-empty">{t.noResults} ↓</p>
        ) : null}

        <aside className="help-still-stuck" role="complementary">
          <h2>{t.stillStuck}</h2>
          <p>{t.stillStuckBody}</p>
          <Link href="/feedback" className="help-still-stuck-cta">
            {t.feedbackCta} →
          </Link>
        </aside>
      </section>
    </SiteShell>
  );
}
