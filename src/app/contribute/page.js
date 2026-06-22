"use client";

// /contribute — Financial Transparency & Contribution page.
// Shows needed funding amounts (Claude Code, Hosting & Domain) and lets
// users simulate contributing to keep the project moving forward.
// Features a dynamic progress calculator and beautiful glassmorphism design.

import {
  CheckCircleFilled,
  HeartFilled,
  DollarOutlined,
  GlobalOutlined
} from "@ant-design/icons";

import Link from "next/link";
import { useState } from "react";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    pageTitle: "सहयोग र पारदर्शिता",
    eyebrow: "Financial Transparency",
    title: "पारदर्शिता हाम्रो जग हो",
    intro: "हाम्रो देश आफैं मिलेर बनाउने अभियानमा वित्तीय पारदर्शिता सबैभन्दा महत्त्वपूर्ण स्तम्भ हो। श्रमदानलाई निरन्तरता दिन र तीव्र गतिमा अघि बढाउन आवश्यक पर्ने मासिक तथा वार्षिक खर्चको विवरण तल प्रस्तुत गरिएको छ।",
    
    monthlyTargetLabel: "मासिक आवश्यकता (Claude Code)",
    annualTargetLabel: "वार्षिक आवश्यकता (होस्टिङ + डोमेन)",
    
    fundedLabel: "संकलित लक्ष्य",
    targetLabel: "आवश्यक रकम",
    liveProgressLabel: "सहयोग राशिको प्रभाव",
    
    claudeTitle: "Claude Code सदस्यता",
    claudeCost: "$२०० / महिना (करीब रु. ३१,०००)",
    claudeDesc: "एप्लिकेसन विकास, बग फिक्सिङ, र एजेन्ट प्रणालीहरूलाई द्रुत गतिमा चलाउन आवश्यक पर्ने AI जोडी प्रोग्रामर औजार।",
    
    hostingTitle: "डोमेन र क्लाउड होस्टिङ",
    hostingCost: "$८९ / वर्ष (करीब रु. ११,८००)",
    hostingDesc: "वेबसाइटलाई चौबीसै घण्टा लाइभ राख्न, सुरक्षा र स्वयंसेवकहरूको डाटाहरू व्यवस्थापन गर्ने सर्भर खर्च।",
    
    howToHelpTitle: "सहयोग गर्ने माध्यमहरू",
    bankTransfer: "बैंक ट्रान्सफर (Bank Transfer)",
    bankName: "बैंक:",
    accountName: "खातावालाको नाम:",
    accountNo: "खाता नम्बर:",
    branch: "शाखा:",
    copyConfirm: "प्रतिलिपि बनाइयो",
    
    qrPayTitle: "क्युआर कोड भुक्तानी (Fonepay / eSewa)",
    qrScanLabel: "Fonepay / eSewa बाट स्क्यान गर्नुहोस्",
    qrHint: "पारदर्शिताको लागि योगदान सिधै बैंक खातामा जम्मा हुनेछ।",
    
    digitalPayBtn: "डिजिटल भुक्तानी (eSewa / Khalti / Cards)",
    digitalPayDesc: "विकास मोडमा — यहाँबाट गरिएको भुक्तानी वास्तविक खाताबाट काटिने छैन।",
    
    amountPlaceholder: "सहयोग गर्न चाहेको रकम लेख्नुहोस् (रु.)",
    impactMessage: "यस सहयोगले {pct}% मासिक सञ्चालन खर्चलाई धान्नेछ!",
    impactMessageAnnual: "यस सहयोगले {pct}% वार्षिक होस्टिङ खर्चलाई धान्नेछ!",
    
    submitBtn: "सहयोग सुनिश्चित गर्ने",
    submitting: "प्रशोधन हुँदै…",
    successTitle: "सद्भावका लागि धन्यवाद!",
    successBody: "तपाईंको योगदानले देश बनाउने डिजिटल पूर्वाधारलाई बलियो र गतिशिल बनाउन ठूलो भूमिका खेल्नेछ। रसिद विवरण तल उपलब्ध छ।",
    successReceipt: "रसिद नम्बर",
    backHome: "गृहपृष्ठ फर्कने",
    errInvalid: "कृपया १०० भन्दा बढी मान्य रकम लेख्नुहोस्।"
  },
  en: {
    pageTitle: "Contribute & Transparency",
    eyebrow: "Financial Transparency",
    title: "Transparency is Our Foundation",
    intro: "Financial transparency is the key to building citizen trust. To keep Shramdan independent and growing rapidly, here is the detailed breakdown of the exact costs required to keep the project running.",
    
    monthlyTargetLabel: "Monthly Requirement (Claude Code)",
    annualTargetLabel: "Annual Requirement (Hosting + Domain)",
    
    fundedLabel: "Goal Funded",
    targetLabel: "Target Required",
    liveProgressLabel: "Impact of Your Support",
    
    claudeTitle: "Claude Code Subscription",
    claudeCost: "$200 / month (~31,000 NPR)",
    claudeDesc: "Powers the developer AI coding assistant to implement features, run verification builds, and fix issues 10x faster.",
    
    hostingTitle: "Domain & Cloud Hosting",
    hostingCost: "$89 / year (~11,800 NPR)",
    hostingDesc: "Ensures the staging and production environments stay online serving citizens and volunteers 24/7.",
    
    howToHelpTitle: "Contribution Methods",
    bankTransfer: "Direct Bank Transfer",
    bankName: "Bank:",
    accountName: "Account Name:",
    accountNo: "Account No:",
    branch: "Branch:",
    copyConfirm: "Copied to clipboard",
    
    qrPayTitle: "QR Code Payment (Fonepay / eSewa)",
    qrScanLabel: "Scan with Fonepay or eSewa",
    qrHint: "For transparency, contributions go directly into our verified account.",
    
    digitalPayBtn: "Pay via eSewa / Khalti / Cards",
    digitalPayDesc: "Staging sandbox — no real monetary transaction will take place.",
    
    amountPlaceholder: "Enter contribution amount (NPR)",
    impactMessage: "This funds {pct}% of our monthly Claude Code target!",
    impactMessageAnnual: "This funds {pct}% of our annual Hosting target!",
    
    submitBtn: "Confirm Contribution",
    submitting: "Processing…",
    successTitle: "Thank You for Your Support!",
    successBody: "Your contribution keeps our digital infrastructure live and accelerating. Together, we are building a better community.",
    successReceipt: "Receipt No",
    backHome: "Return Home",
    errInvalid: "Please enter a valid amount above 100."
  }
};


export default function ContributePage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;

  const [done, setDone] = useState(null);


  if (done) {
    return (
      <SiteShell pageTitle={t.pageTitle}>
        <section className="page-section contribute-section">
          <article className="content-card contribute-success" role="status">
            <ConfettiBurst />
            <span className="contribute-success-seal" aria-hidden="true">
              <CheckCircleFilled />
            </span>
            <h1>{t.successTitle}</h1>
            <p>{t.successBody}</p>
            <p className="contribute-success-amount">
              <HeartFilled aria-hidden="true" /> रु.{" "}
              {localizeDigits(done.amount.toLocaleString("en-US"), language)}
            </p>
            <p className="contribute-success-receipt">
              {t.successReceipt}: <code>{done.receipt}</code>
            </p>
            <div className="contribute-success-actions">
              <Link className="contribute-cta-primary" href="/">
                {t.backHome}
              </Link>
            </div>
          </article>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section contribute-section">
        <header className="contribute-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        {/* Cost Breakdown Grid */}
        <div className="contribute-cost-grid">
          <article className="content-card cost-card">
            <div className="cost-header">
              <span className="cost-icon cl-icon"><DollarOutlined /></span>
              <div>
                <h2>{t.claudeTitle}</h2>
                <strong className="cost-price">{localizeDigits(t.claudeCost, language)}</strong>
              </div>
            </div>
            <p className="cost-desc">{t.claudeDesc}</p>
            <div className="cost-progress-bar">
              <div className="cost-progress-fill" style={{ width: "45%" }}></div>
              <div className="cost-progress-text">
                <span>{t.fundedLabel}: {localizeDigits("45%", language)}</span>
                <span>{t.targetLabel}: {localizeDigits("NPR 31,000", language)}</span>
              </div>
            </div>
          </article>

          <article className="content-card cost-card">
            <div className="cost-header">
              <span className="cost-icon web-icon"><GlobalOutlined /></span>
              <div>
                <h2>{t.hostingTitle}</h2>
                <strong className="cost-price">{localizeDigits(t.hostingCost, language)}</strong>
              </div>
            </div>
            <p className="cost-desc">{t.hostingDesc}</p>
            <div className="cost-progress-bar">
              <div className="cost-progress-fill" style={{ width: "80%" }}></div>
              <div className="cost-progress-text">
                <span>{t.fundedLabel}: {localizeDigits("80%", language)}</span>
                <span>{t.targetLabel}: {localizeDigits("NPR 11,800", language)}</span>
              </div>
            </div>
          </article>
        </div>


        {/* QR Scan Section */}
        <article className="content-card qr-scan-section">
          <h2>{t.qrPayTitle}</h2>
          <div className="qr-container">
            <div className="qr-box">
              {/* Branded styled CSS mock QR Code */}
              <div className="qr-mock-image">
                <div className="qr-corner qr-top-left"></div>
                <div className="qr-corner qr-top-right"></div>
                <div className="qr-corner qr-bottom-left"></div>
                <div className="qr-center-logo">
                  <Image alt="" height={40} src="/images/logo.png" width={40} />
                </div>
                {/* Simulated QR pattern lines */}
                <div className="qr-pattern-grid"></div>
              </div>
              <span className="qr-scan-label">{t.qrScanLabel}</span>
            </div>
            <p className="qr-hint-text">{t.qrHint}</p>
          </div>
        </article>
      </section>
    </SiteShell>
  );
}

// Simple absolute mock component for standard QR pattern decoration
function Image({ alt, height, src, width }) {
  return (
    <img
      alt={alt}
      height={height}
      src={src}
      width={width}
      style={{ objectFit: "contain", borderRadius: "4px" }}
    />
  );
}
