"use client";

// Phone + OTP membership UI (Phase 2 — pivot pre-flight).
//
// Backend `/auth/otp/send` and `/auth/otp/verify` endpoints don't exist
// yet, so this page short-circuits in development: any 10-digit Nepali
// mobile (starting 9) and any 6-digit OTP succeed. The intent is to
// have the membership UX complete and visible so volunteers can preview
// what signup will feel like the moment the backend lands.
//
// 2026-06-05 — rewrapped in MultiStepShell for visual parity with the
// other multi-step forms (/join, /issues/new, /admin/issues/create).
// Step keys: intro → phone → otp → done.

import {
  ArrowRightOutlined,
  CheckCircleFilled,
  PhoneOutlined
} from "@ant-design/icons";
import { Button, Input } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePreferences } from "@/app/providers";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { MultiStepShell } from "@/components/MultiStepShell";
import { SiteShell } from "@/components/SiteShell";
import { copy as siteCopy } from "@/lib/siteContent";

const COPY = {
  np: {
    pageTitle: "OTP बाट सदस्यता",
    phoneLabel: "मोबाइल नम्बर",
    phonePlaceholder: "9XXXXXXXXX",
    phoneHint: "नेपालको मोबाइल नम्बर — १० अंक, ९ बाट सुरु।",
    sendOtp: "OTP पठाउनुहोस्",
    otpResend: "फेरि पठाउनुहोस्",
    otpVerify: "पुष्टि गर्नुहोस्",
    devNote: "विकास अवस्थामा — कुनै पनि ६ अंक मान्य।",
    goEvents: "अभियानहरू हेर्नुहोस्",
    goIssues: "समस्याहरू हेर्नुहोस्",
    errorPhoneInvalid: "१० अंकको ९ बाट सुरु हुने मोबाइल नम्बर लेख्नुहोस्।",
    errorOtpInvalid: "६ अंकको OTP कोड लेख्नुहोस्।",
    introBullets: [
      "इमेल नचाहिने।",
      "मोबाइलमा OTP कोड पठाइन्छ।",
      "एकै मिनेटमा श्रमदान सदस्य बन्नुहोस्।"
    ]
  },
  en: {
    pageTitle: "OTP Signup",
    phoneLabel: "Mobile number",
    phonePlaceholder: "9XXXXXXXXX",
    phoneHint: "Nepali mobile number — 10 digits, starts with 9.",
    sendOtp: "Send OTP",
    otpResend: "Resend",
    otpVerify: "Verify",
    devNote: "Dev mode — any 6 digits will pass.",
    goEvents: "Browse campaigns",
    goIssues: "Browse issues",
    errorPhoneInvalid: "Enter a 10-digit mobile number that starts with 9.",
    errorOtpInvalid: "Enter the 6-digit OTP code.",
    introBullets: [
      "No email needed.",
      "We send an OTP code to your phone.",
      "Become a Shramdan member in a minute."
    ]
  }
};

function isValidNepaliMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return /^9\d{9}$/.test(digits);
}

function isValidOtp(raw) {
  return /^\d{6}$/.test(String(raw || "").trim());
}

const STEP_KEYS = ["intro", "phone", "otp", "done"];

export default function SignupPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const ms = (siteCopy[language] || siteCopy.np).multiStep.signup.steps;

  const [stepIndex, setStepIndex] = useState(0);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpInputRef = useRef(null);

  const currentKey = STEP_KEYS[stepIndex];

  useEffect(() => {
    if (currentKey === "otp") {
      const id = window.setTimeout(() => otpInputRef.current?.focus?.(), 80);
      return () => window.clearTimeout(id);
    }
  }, [currentKey]);

  const stepDefs = useMemo(
    () =>
      STEP_KEYS.map((key) => ({
        key,
        title: ms[key].title,
        heading: ms[key].heading,
        intro: ms[key].intro
      })),
    [ms]
  );

  const handleSendOtp = async () => {
    setPhoneError("");
    if (!isValidNepaliMobile(phone)) {
      setPhoneError(t.errorPhoneInvalid);
      return;
    }
    setSending(true);
    // Dev-only: real backend will live at POST /auth/otp/send.
    await new Promise((resolve) => window.setTimeout(resolve, 480));
    setSending(false);
    setStepIndex(STEP_KEYS.indexOf("otp"));
  };

  const handleVerify = async () => {
    setOtpError("");
    if (!isValidOtp(otp)) {
      setOtpError(t.errorOtpInvalid);
      return;
    }
    setVerifying(true);
    // Dev-only: real backend will live at POST /auth/otp/verify.
    await new Promise((resolve) => window.setTimeout(resolve, 540));
    setVerifying(false);
    setStepIndex(STEP_KEYS.indexOf("done"));
  };

  const handleNext = () => {
    if (currentKey === "intro") {
      setStepIndex(STEP_KEYS.indexOf("phone"));
      return;
    }
    if (currentKey === "phone") {
      handleSendOtp();
      return;
    }
    if (currentKey === "otp") {
      handleVerify();
    }
  };

  const handleBack = () => {
    if (currentKey === "otp") {
      setOtp("");
      setOtpError("");
      setStepIndex(STEP_KEYS.indexOf("phone"));
      return;
    }
    if (currentKey === "phone") {
      setStepIndex(STEP_KEYS.indexOf("intro"));
    }
  };

  const isDone = currentKey === "done";
  const nextLoading =
    (currentKey === "phone" && sending) || (currentKey === "otp" && verifying);

  let nextLabel;
  if (currentKey === "intro") nextLabel = ms.intro.cta;
  else if (currentKey === "phone") nextLabel = t.sendOtp;
  else if (currentKey === "otp") nextLabel = t.otpVerify;

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section multi-step-section signup-section">
        {isDone ? (
          <article className="multi-step-card signup-card signup-card-done" role="status" style={{ maxWidth: 620, margin: "0 auto" }}>
            <ConfettiBurst />
            <span className="signup-seal" aria-hidden="true">
              <CheckCircleFilled />
            </span>
            <header className="multi-step-card-heading">
              <span className="eyebrow">{ms.done.title}</span>
              <h1>{ms.done.heading}</h1>
              <p>{ms.done.intro}</p>
            </header>
            <div className="signup-done-actions">
              <Link className="signup-done-primary" href="/events">
                {t.goEvents} <ArrowRightOutlined />
              </Link>
              <Link className="signup-done-secondary" href="/issues">
                {t.goIssues}
              </Link>
            </div>
          </article>
        ) : (
          <MultiStepShell
            steps={stepDefs}
            current={stepIndex}
            language={language}
            onBack={handleBack}
            onNext={handleNext}
            nextLoading={nextLoading}
            nextLabel={nextLabel}
            hideBack={currentKey === "intro"}
          >
            {currentKey === "intro" ? (
              <div className="multi-step-intro-card">
                <ul>
                  {t.introBullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {currentKey === "phone" ? (
              <div className="signup-field">
                <label htmlFor="signup-phone">{t.phoneLabel}</label>
                <Input
                  id="signup-phone"
                  inputMode="tel"
                  size="large"
                  autoFocus
                  placeholder={t.phonePlaceholder}
                  prefix={<PhoneOutlined />}
                  addonBefore="+977"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onPressEnter={handleSendOtp}
                  status={phoneError ? "error" : undefined}
                  autoComplete="tel-national"
                />
                <span className={`signup-field-hint${phoneError ? " is-error" : ""}`}>
                  {phoneError || t.phoneHint}
                </span>
              </div>
            ) : null}

            {currentKey === "otp" ? (
              <div className="signup-field">
                <p className="signup-phone-echo">+977 {phone}</p>
                <Input
                  ref={otpInputRef}
                  inputMode="numeric"
                  size="large"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onPressEnter={handleVerify}
                  status={otpError ? "error" : undefined}
                  className="signup-otp-input"
                  autoComplete="one-time-code"
                />
                <span className={`signup-field-hint${otpError ? " is-error" : ""}`}>
                  {otpError || t.devNote}
                </span>
                <button type="button" className="signup-resend" onClick={() => setOtp("")}>
                  {t.otpResend}
                </button>
              </div>
            ) : null}
          </MultiStepShell>
        )}
      </section>
    </SiteShell>
  );
}
