"use client";

// /donate — accept an arbitrary or preset NPR amount, demo only.
// Two-step: pick amount + frequency, then a "thank you" state with
// confetti. Backend (Khalti / eSewa / Stripe) not wired yet — the
// submit handler just routes to the success state after 500ms.

import {
  ArrowRightOutlined,
  CheckCircleFilled,
  HeartFilled,
  HeartOutlined
} from "@ant-design/icons";
import { Button, Input } from "antd";
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

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

const COPY = {
  np: {
    pageTitle: "आर्थिक सहयोग",
    eyebrow: "श्रमदानलाई साथ",
    title: "हाम्रो काममा आर्थिक साझेदार बन्नुहोस्",
    intro:
      "हरेक रुपैयाँ औजार, यातायात र अभियान सञ्चालनमा सिधै जान्छ। रकम र आवृत्ति छानेर सहयोग गर्नुहोस्।",
    frequencyLabel: "आवृत्ति",
    frequencyOneTime: "एक पटक",
    frequencyMonthly: "मासिक",
    amountLabel: "रकम (रु.)",
    amountCustom: "अन्य रकम लेख्नुहोस्",
    impactPreview: "यो रकमले के दिन्छ:",
    impactLines: {
      tools: "{n} पन्जा + मास्क सेट",
      water: "{n} पानीको बोतल",
      transport: "{n} स्वयंसेवकलाई यातायात"
    },
    submit: "सहयोग गर्नुहोस्",
    submitting: "प्रशोधन हुँदै…",
    submitDevHint: "विकास अवस्थामा — वास्तविक भुक्तानी अहिले लिँदैन।",
    successTitle: "धन्यवाद!",
    successBody:
      "तपाईंको योगदान ले श्रमदानलाई अघि बढाउन ठूलो सहयोग पुग्छ। टोलीले इमेलमा रसिद पठाउनेछ।",
    successReceipt: "रसिद नम्बर",
    backHome: "गृहपृष्ठ फर्किनुहोस्",
    viewImpact: "प्रभाव पृष्ठ हेर्नुहोस्",
    errInvalid: "१०० भन्दा बढी मान्य रकम लेख्नुहोस्।"
  },
  en: {
    pageTitle: "Donate",
    eyebrow: "Support Shramdan",
    title: "Become a financial partner of our work",
    intro:
      "Every rupee goes directly to tools, transport, and campaign operations. Pick an amount and a frequency to contribute.",
    frequencyLabel: "Frequency",
    frequencyOneTime: "One time",
    frequencyMonthly: "Monthly",
    amountLabel: "Amount (NPR)",
    amountCustom: "Or enter another amount",
    impactPreview: "What this funds:",
    impactLines: {
      tools: "{n} glove + mask sets",
      water: "{n} water bottles",
      transport: "{n} volunteer rides"
    },
    submit: "Donate",
    submitting: "Processing…",
    submitDevHint: "Dev mode — no real charge is taken right now.",
    successTitle: "Thank you!",
    successBody:
      "Your contribution helps Shramdan keep moving. We'll email you a receipt.",
    successReceipt: "Receipt no.",
    backHome: "Return home",
    viewImpact: "View impact page",
    errInvalid: "Enter a valid amount above 100."
  }
};

function impactFor(amount) {
  if (!amount || amount < 100) return null;
  return {
    tools: Math.max(1, Math.floor(amount / 350)),
    water: Math.max(1, Math.floor(amount / 60)),
    transport: Math.max(1, Math.floor(amount / 450))
  };
}

export default function DonatePage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const [frequency, setFrequency] = useState("oneTime");
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");

  const effectiveAmount = customAmount.trim()
    ? Number(customAmount.replace(/\D/g, ""))
    : amount;
  const impact = impactFor(effectiveAmount);

  const onPreset = (n) => {
    setCustomAmount("");
    setAmount(n);
    setError("");
  };

  const submit = async () => {
    if (!Number.isFinite(effectiveAmount) || effectiveAmount < 100) {
      setError(t.errInvalid);
      return;
    }
    setError("");
    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 540));
    setSubmitting(false);
    setDone({
      amount: effectiveAmount,
      frequency,
      receipt: `SD-${Math.floor(100000 + Math.random() * 900000)}`
    });
  };

  if (done) {
    return (
      <SiteShell pageTitle={t.pageTitle}>
        <section className="page-section donate-section">
          <article className="content-card donate-success" role="status">
            <ConfettiBurst />
            <span className="donate-success-seal" aria-hidden="true">
              <CheckCircleFilled />
            </span>
            <h1>{t.successTitle}</h1>
            <p>{t.successBody}</p>
            <p className="donate-success-amount">
              <HeartFilled aria-hidden="true" /> रु.{" "}
              {localizeDigits(done.amount.toLocaleString("en-US"), language)}{" "}
              · {done.frequency === "monthly" ? t.frequencyMonthly : t.frequencyOneTime}
            </p>
            <p className="donate-success-receipt">
              {t.successReceipt}: <code>{done.receipt}</code>
            </p>
            <div className="donate-success-actions">
              <Link className="donate-cta-primary" href="/impact">
                {t.viewImpact} <ArrowRightOutlined />
              </Link>
              <Link className="donate-cta-secondary" href="/">
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
      <section className="page-section donate-section">
        <header className="donate-hero">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <article className="content-card donate-card">
          <div className="donate-field">
            <span className="donate-field-label">{t.frequencyLabel}</span>
            <div className="donate-freq-toggle" role="radiogroup">
              <button
                type="button"
                role="radio"
                aria-checked={frequency === "oneTime"}
                className={`donate-freq-btn${frequency === "oneTime" ? " is-active" : ""}`}
                onClick={() => setFrequency("oneTime")}
              >
                <HeartOutlined /> {t.frequencyOneTime}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={frequency === "monthly"}
                className={`donate-freq-btn${frequency === "monthly" ? " is-active" : ""}`}
                onClick={() => setFrequency("monthly")}
              >
                <HeartFilled /> {t.frequencyMonthly}
              </button>
            </div>
          </div>

          <div className="donate-field">
            <span className="donate-field-label">{t.amountLabel}</span>
            <div className="donate-preset-grid">
              {PRESET_AMOUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`donate-preset${!customAmount && amount === n ? " is-active" : ""}`}
                  onClick={() => onPreset(n)}
                >
                  रु. {localizeDigits(n.toLocaleString("en-US"), language)}
                </button>
              ))}
            </div>
            <Input
              size="large"
              placeholder={t.amountCustom}
              prefix="रु."
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              status={error ? "error" : undefined}
              className="donate-custom-input"
              inputMode="numeric"
            />
            {error ? <span className="donate-error">{error}</span> : null}
          </div>

          {impact ? (
            <div className="donate-impact">
              <strong>{t.impactPreview}</strong>
              <ul>
                <li>
                  {t.impactLines.tools.replace(
                    "{n}",
                    localizeDigits(impact.tools, language)
                  )}
                </li>
                <li>
                  {t.impactLines.water.replace(
                    "{n}",
                    localizeDigits(impact.water, language)
                  )}
                </li>
                <li>
                  {t.impactLines.transport.replace(
                    "{n}",
                    localizeDigits(impact.transport, language)
                  )}
                </li>
              </ul>
            </div>
          ) : null}

          <Button
            size="large"
            type="primary"
            block
            loading={submitting}
            onClick={submit}
            icon={<HeartFilled />}
          >
            {submitting ? t.submitting : t.submit}
          </Button>
          <span className="donate-dev-hint">{t.submitDevHint}</span>
        </article>
      </section>
    </SiteShell>
  );
}
