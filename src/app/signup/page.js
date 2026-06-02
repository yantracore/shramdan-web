"use client";

// Phone + OTP membership UI (Phase 2 — pivot pre-flight).
//
// Backend `/auth/otp/send` and `/auth/otp/verify` endpoints don't exist
// yet, so this page short-circuits in development: any 10-digit Nepali
// mobile (starting 9) and any 6-digit OTP succeed. The intent is to
// have the membership UX complete and visible so volunteers can preview
// what signup will feel like the moment the backend lands.

import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  PhoneOutlined
} from "@ant-design/icons";
import { Button, Input } from "antd";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/app/providers";
import { SiteShell } from "@/components/SiteShell";

const COPY = {
  np: {
    pageTitle: "OTP बाट सदस्यता",
    eyebrow: "द्रुत सदस्यता",
    title: "फोन नम्बरबाट जोडिनुहोस्",
    intro:
      "इमेल चाहिँदैन — फोन नम्बर र छोटो OTP कोडले मात्र। एकै मिनेटमा श्रमदान सदस्य बन्नुहोस्।",
    phoneLabel: "मोबाइल नम्बर",
    phonePlaceholder: "9XXXXXXXXX",
    phoneHint: "नेपालको मोबाइल नम्बर — १० अंक, ९ बाट सुरु।",
    sendOtp: "OTP पठाउनुहोस्",
    otpEyebrow: "पुष्टि चरण",
    otpTitle: "OTP कोड लेख्नुहोस्",
    otpIntro: "तपाईंको फोनमा ६ अंकको कोड पठाइयो।",
    otpResend: "फेरि पठाउनुहोस्",
    otpVerify: "पुष्टि गर्नुहोस्",
    back: "नम्बर बदल्नुहोस्",
    devNote: "विकास अवस्थामा — कुनै पनि ६ अंक मान्य।",
    successEyebrow: "स्वागत छ",
    successTitle: "तपाईं श्रमदानमा जोडिनुभयो।",
    successBody:
      "अब समस्या रिपोर्ट गर्न, समर्थन गर्न र अभियानमा सहभागी हुन तयार हुनुहुन्छ।",
    goEvents: "अभियानहरू हेर्नुहोस्",
    goIssues: "समस्याहरू हेर्नुहोस्",
    errorPhoneInvalid: "१० अंकको ९ बाट सुरु हुने मोबाइल नम्बर लेख्नुहोस्।",
    errorOtpInvalid: "६ अंकको OTP कोड लेख्नुहोस्।"
  },
  en: {
    pageTitle: "OTP Signup",
    eyebrow: "Quick signup",
    title: "Join with your phone",
    intro:
      "No email required — just your phone number and a short OTP code. Become a Shramdan member in a minute.",
    phoneLabel: "Mobile number",
    phonePlaceholder: "9XXXXXXXXX",
    phoneHint: "Nepali mobile number — 10 digits, starts with 9.",
    sendOtp: "Send OTP",
    otpEyebrow: "Verify",
    otpTitle: "Enter the OTP code",
    otpIntro: "We've sent a 6-digit code to your phone.",
    otpResend: "Resend",
    otpVerify: "Verify",
    back: "Change number",
    devNote: "Dev mode — any 6 digits will pass.",
    successEyebrow: "Welcome",
    successTitle: "You're in.",
    successBody:
      "You can now report issues, support priorities, and join cleanup events.",
    goEvents: "Browse campaigns",
    goIssues: "Browse issues",
    errorPhoneInvalid: "Enter a 10-digit mobile number that starts with 9.",
    errorOtpInvalid: "Enter the 6-digit OTP code."
  }
};

function isValidNepaliMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return /^9\d{9}$/.test(digits);
}

function isValidOtp(raw) {
  return /^\d{6}$/.test(String(raw || "").trim());
}

export default function SignupPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (step === "otp") {
      const id = window.setTimeout(() => otpInputRef.current?.focus?.(), 80);
      return () => window.clearTimeout(id);
    }
  }, [step]);

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
    setStep("otp");
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
    setStep("done");
  };

  const reset = () => {
    setOtp("");
    setOtpError("");
    setStep("phone");
  };

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section signup-section">
        {step === "phone" ? (
          <article className="content-card signup-card">
            <header className="form-card-heading">
              <span className="eyebrow">{t.eyebrow}</span>
              <h1>{t.title}</h1>
              <p>{t.intro}</p>
            </header>
            <div className="signup-field">
              <label htmlFor="signup-phone">{t.phoneLabel}</label>
              <Input
                id="signup-phone"
                inputMode="tel"
                size="large"
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
            <Button
              block
              loading={sending}
              onClick={handleSendOtp}
              size="large"
              type="primary"
            >
              {t.sendOtp} <ArrowRightOutlined />
            </Button>
          </article>
        ) : null}

        {step === "otp" ? (
          <article className="content-card signup-card">
            <button type="button" className="signup-back" onClick={reset}>
              <ArrowLeftOutlined /> {t.back}
            </button>
            <header className="form-card-heading">
              <span className="eyebrow">{t.otpEyebrow}</span>
              <h1>{t.otpTitle}</h1>
              <p>{t.otpIntro}</p>
              <p className="signup-phone-echo">+977 {phone}</p>
            </header>
            <div className="signup-field">
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
            </div>
            <Button
              block
              loading={verifying}
              onClick={handleVerify}
              size="large"
              type="primary"
            >
              {t.otpVerify}
            </Button>
            <button type="button" className="signup-resend" onClick={() => setOtp("")}>
              {t.otpResend}
            </button>
          </article>
        ) : null}

        {step === "done" ? (
          <article className="content-card signup-card signup-card-done" role="status">
            <span className="signup-seal" aria-hidden="true">
              <CheckCircleFilled />
            </span>
            <span className="eyebrow">{t.successEyebrow}</span>
            <h1>{t.successTitle}</h1>
            <p>{t.successBody}</p>
            <div className="signup-done-actions">
              <Link className="signup-done-primary" href="/events">
                {t.goEvents} <ArrowRightOutlined />
              </Link>
              <Link className="signup-done-secondary" href="/issues">
                {t.goIssues}
              </Link>
            </div>
          </article>
        ) : null}
      </section>
    </SiteShell>
  );
}
