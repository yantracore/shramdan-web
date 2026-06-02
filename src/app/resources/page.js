"use client";

// /resources — a directory of downloadable templates, checklists, and
// links volunteers / coordinators can use when they run a Shramdan
// campaign. All hrefs are placeholders ("#") for now — to be wired
// when the actual files land in /public/resources or an S3 bucket.

import {
  ApiOutlined,
  CheckSquareOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  LinkOutlined,
  PictureOutlined,
  SafetyOutlined,
  SoundOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

const COPY = {
  np: {
    pageTitle: "स्रोत भण्डार",
    eyebrow: "स्रोत",
    title: "श्रमदान सञ्चालनका लागि उपयोगी सामग्री",
    intro:
      "अभियान योजनादेखि सरसफाइ सूचीसम्म — स्वयंसेवक, संयोजक र दाताका लागि चाहिने ढाँचा र निर्देशिका।",
    download: "डाउनलोड",
    visit: "हेर्नुहोस्",
    sections: [
      {
        id: "templates",
        title: "ढाँचा र फारम",
        items: [
          { kind: "doc", title: "अभियान सूचना ढाँचा", body: "स्थानीयलाई पठाउने सरल सूचना पत्र — Word + PDF।", href: "#" },
          { kind: "sheet", title: "सहभागी रजिस्टर", body: "अभियानको दिनको हाजिरी र भूमिका रजिस्टर।", href: "#" },
          { kind: "pdf", title: "सुरक्षा चेकलिस्ट", body: "अभियानअघि र दौरान सुरक्षा बिन्दु — A4 छाप्न मिल्ने।", href: "#" }
        ]
      },
      {
        id: "guides",
        title: "निर्देशिका",
        items: [
          { kind: "doc", title: "अभियान सञ्चालन निर्देशिका", body: "तयारीदेखि सम्पन्नसम्मको सात-पाइला।", href: "#" },
          { kind: "doc", title: "नगरपालिकासँग समन्वय", body: "वडा कार्यालय, सरसफाइ ट्रक, अनुमति प्रक्रिया।", href: "#" },
          { kind: "doc", title: "मिडिया र फोटोग्राफी सुझाव", body: "अघि–पछिको तस्बिर र साझाको लागि सुझाव।", href: "#" }
        ]
      },
      {
        id: "assets",
        title: "ब्रान्ड सामग्री",
        items: [
          { kind: "pic", title: "श्रमदान लोगो", body: "PNG + SVG; प्रयोग दिशानिर्देश सहित।", href: "#" },
          { kind: "pic", title: "स्वयंसेवक भेस्ट डिजाइन", body: "अनुकूलित प्रिन्ट-रेडी फाइल।", href: "#" },
          { kind: "sound", title: "अभियान घोषणा अडियो", body: "स्थानीय रेडियो + स्पिकरका लागि।", href: "#" }
        ]
      },
      {
        id: "links",
        title: "उपयोगी लिङ्क",
        items: [
          { kind: "link", title: "नेपाल विपद् पोर्टल", body: "DRR नीति, मनसुन पूर्व-तयारी।", href: "#" },
          { kind: "link", title: "नगर सरसफाइ हटलाइन", body: "१०२ — स्थानीय सरसफाइ टीमको सहयोग।", href: "#" },
          { kind: "api", title: "श्रमदान API कागजात", body: "बाह्य प्रणालीसँग जोड्न।", href: "https://backend.shramdan.org/api-docs/" }
        ]
      }
    ]
  },
  en: {
    pageTitle: "Resource library",
    eyebrow: "Resources",
    title: "Helpful templates and guides for running Shramdan",
    intro:
      "From campaign-planning forms to safety checklists — every artifact a volunteer, coordinator, or donor might need.",
    download: "Download",
    visit: "Visit",
    sections: [
      {
        id: "templates",
        title: "Templates & forms",
        items: [
          { kind: "doc", title: "Campaign announcement template", body: "Short letter for ward + neighbors — Word + PDF.", href: "#" },
          { kind: "sheet", title: "Participant register", body: "Day-of attendance + role register, printable.", href: "#" },
          { kind: "pdf", title: "Safety checklist", body: "Pre- and during-event safety checks, A4 printable.", href: "#" }
        ]
      },
      {
        id: "guides",
        title: "Guides",
        items: [
          { kind: "doc", title: "Campaign playbook", body: "Seven steps from planning to close-out.", href: "#" },
          { kind: "doc", title: "Working with the municipality", body: "Ward office, trash trucks, permit flow.", href: "#" },
          { kind: "doc", title: "Media + photography tips", body: "Before/after shots and sharing best practices.", href: "#" }
        ]
      },
      {
        id: "assets",
        title: "Brand assets",
        items: [
          { kind: "pic", title: "Shramdan logo pack", body: "PNG + SVG with usage guidelines.", href: "#" },
          { kind: "pic", title: "Volunteer vest design", body: "Customizable, print-ready files.", href: "#" },
          { kind: "sound", title: "Campaign announcement audio", body: "For local radio + loudspeaker.", href: "#" }
        ]
      },
      {
        id: "links",
        title: "External links",
        items: [
          { kind: "link", title: "Nepal disaster portal", body: "DRR policy + monsoon prep.", href: "#" },
          { kind: "link", title: "Municipal sanitation hotline", body: "102 — local sanitation team support.", href: "#" },
          { kind: "api", title: "Shramdan API docs", body: "Connect external systems.", href: "https://backend.shramdan.org/api-docs/" }
        ]
      }
    ]
  }
};

const KIND_ICON = {
  doc: FileTextOutlined,
  sheet: FileExcelOutlined,
  pdf: FilePdfOutlined,
  pic: PictureOutlined,
  sound: SoundOutlined,
  link: LinkOutlined,
  api: ApiOutlined,
  check: CheckSquareOutlined,
  safety: SafetyOutlined
};

export default function ResourcesPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="resources-section page-section">
        <header className="resources-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        {t.sections.map((section) => (
          <section
            key={section.id}
            className="resources-block"
            aria-labelledby={`res-${section.id}`}
          >
            <h2 id={`res-${section.id}`}>{section.title}</h2>
            <ul className="resources-grid">
              {section.items.map((item, i) => {
                const Icon = KIND_ICON[item.kind] || FileTextOutlined;
                const isLink = item.kind === "link" || item.kind === "api";
                const cta = isLink ? t.visit : t.download;
                const CtaIcon = isLink ? LinkOutlined : DownloadOutlined;
                const external = item.href?.startsWith("http");
                return (
                  <li key={i} className="resources-tile">
                    <span className="resources-tile-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <div className="resources-tile-body">
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                    </div>
                    {external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="resources-tile-cta"
                      >
                        {cta} <CtaIcon aria-hidden="true" />
                      </a>
                    ) : (
                      <Link href={item.href} className="resources-tile-cta">
                        {cta} <CtaIcon aria-hidden="true" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </section>
    </SiteShell>
  );
}
