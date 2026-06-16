"use client";

// Phone + OTP membership (roadmap Phase 2.1) — wired to the real backend.
//   POST /auth/register   { name, email, password, phone(E.164) } → OTP SMS
//   POST /auth/verify-otp { phone, otp } → { user, accessToken, refreshToken }
//   POST /auth/resend-otp { phone }
// verify-otp returns only a partial user, so we merge it with the user the
// register call returned to build a full session (getAuthSession needs
// email + role). Step keys: intro → phone(details) → otp → done.

import {
  ArrowRightOutlined,
  CheckCircleFilled,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button, Input } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePreferences } from "@/app/providers";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { MultiStepShell } from "@/components/MultiStepShell";
import { SiteShell } from "@/components/SiteShell";
import { registerMember, resendOtp, verifyOtp } from "@/lib/apiClient";
import { setAuthSession } from "@/lib/authSession";
import { copy as siteCopy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

const RESEND_COOLDOWN_SECONDS = 30;

const COPY = {
  np: {
    pageTitle: "OTP बाट सदस्यता",
    nameLabel: "पूरा नाम",
    namePlaceholder: "तपाईंको नाम",
    emailLabel: "इमेल",
    emailPlaceholder: "you@example.com",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "कम्तीमा ६ अक्षर",
    phoneLabel: "मोबाइल नम्बर",
    phonePlaceholder: "9XXXXXXXXX",
    phoneHint: "नेपालको मोबाइल नम्बर — १० अंक, ९ बाट सुरु।",
    sendOtp: "OTP पठाउनुहोस्",
    otpResend: "फेरि पठाउनुहोस्",
    otpResendIn: "{n} सेकेन्डमा फेरि पठाउन सकिन्छ",
    otpResent: "OTP फेरि पठाइयो।",
    otpVerify: "पुष्टि गर्नुहोस्",
    otpSentTo: "OTP कोड यहाँ पठाइयो:",
    goDashboard: "ड्यासबोर्डमा जानुहोस्",
    goEvents: "अभियानहरू हेर्नुहोस्",
    errorNameRequired: "कृपया आफ्नो नाम लेख्नुहोस्।",
    errorEmailInvalid: "सही इमेल ठेगाना लेख्नुहोस्।",
    errorPasswordShort: "पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।",
    errorPhoneInvalid: "१० अंकको ९ बाट सुरु हुने मोबाइल नम्बर लेख्नुहोस्।",
    errorOtpInvalid: "६ अंकको OTP कोड लेख्नुहोस्।",
    otpHint: "तपाईंको फोनमा आएको ६ अंकको कोड लेख्नुहोस्।",
    alreadyPrompt: "पहिले नै खाता छ?",
    loginCta: "लगइन गर्नुहोस्।",
    introBullets: [
      "नाम, इमेल र फोन नम्बर।",
      "फोनमा OTP कोड पठाइन्छ।",
      "पुष्टि भएपछि तुरुन्तै श्रमदान सदस्य।"
    ]
  },
  en: {
    pageTitle: "OTP Signup",
    nameLabel: "Full name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 6 characters",
    phoneLabel: "Mobile number",
    phonePlaceholder: "9XXXXXXXXX",
    phoneHint: "Nepali mobile number — 10 digits, starts with 9.",
    sendOtp: "Send OTP",
    otpResend: "Resend",
    otpResendIn: "Resend available in {n}s",
    otpResent: "OTP resent.",
    otpVerify: "Verify",
    otpSentTo: "OTP sent to:",
    goDashboard: "Go to Dashboard",
    goEvents: "Browse Campaigns",
    errorNameRequired: "Please enter your name.",
    errorEmailInvalid: "Enter a valid email address.",
    errorPasswordShort: "Password must be at least 6 characters.",
    errorPhoneInvalid: "Enter a 10-digit mobile number that starts with 9.",
    errorOtpInvalid: "Enter the 6-digit OTP code.",
    otpHint: "Enter the 6-digit code sent to your phone.",
    alreadyPrompt: "Already have an account?",
    loginCta: "Log in.",
    introBullets: [
      "Your name, email and phone.",
      "We send an OTP code to your phone.",
      "Verified, you're a Shramdan member instantly."
    ]
  }
};

function isValidNepaliMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return /^9\d{9}$/.test(digits);
}

function isValidEmail(raw) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw || "").trim());
}

function isValidOtp(raw) {
  return /^\d{6}$/.test(String(raw || "").trim());
}

function toE164(raw) {
  return `+977${String(raw || "").replace(/\D/g, "")}`;
}

const STEP_KEYS = ["intro", "phone", "otp", "done"];

export default function SignupPage() {
  const router = useRouter();
  const { language } = usePreferences();
  const messageApi = useToast();
  const t = COPY[language] || COPY.np;
  const ms = (siteCopy[language] || siteCopy.np).multiStep.signup.steps;

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  // The register response carries the full user (email + role); verify-otp
  // returns only a partial user, so we keep this to merge into the session.
  const pendingUserRef = useRef(null);
  const otpInputRef = useRef(null);

  const currentKey = STEP_KEYS[stepIndex];

  useEffect(() => {
    if (currentKey === "otp") {
      const id = window.setTimeout(() => otpInputRef.current?.focus?.(), 80);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [currentKey]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const id = window.setInterval(() => {
      setResendCooldown((n) => (n <= 1 ? 0 : n - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendCooldown]);

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

  const handleRegister = async () => {
    setFieldError("");
    if (!name.trim()) {
      setFieldError(t.errorNameRequired);
      return;
    }
    if (!isValidEmail(email)) {
      setFieldError(t.errorEmailInvalid);
      return;
    }
    if (String(password).length < 6) {
      setFieldError(t.errorPasswordShort);
      return;
    }
    if (!isValidNepaliMobile(phone)) {
      setFieldError(t.errorPhoneInvalid);
      return;
    }

    setRegistering(true);
    try {
      const response = await registerMember({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: toE164(phone)
      });
      pendingUserRef.current = response?.data?.user ?? null;
      setStepIndex(STEP_KEYS.indexOf("otp"));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      // Backend is the source of truth — surface its message (e.g. phone /
      // email already registered, weak password).
      setFieldError(error?.message || t.errorPhoneInvalid);
    } finally {
      setRegistering(false);
    }
  };

  const handleVerify = async () => {
    setOtpError("");
    if (!isValidOtp(otp)) {
      setOtpError(t.errorOtpInvalid);
      return;
    }
    setVerifying(true);
    try {
      const response = await verifyOtp({ phone: toE164(phone), otp: otp.trim() });
      const data = response?.data ?? {};
      // Merge the partial verify user over the fuller register user so the
      // session has email + role (required by getAuthSession).
      const user = { ...(pendingUserRef.current || {}), ...(data.user || {}) };
      setAuthSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? null,
        user
      });
      setStepIndex(STEP_KEYS.indexOf("done"));
    } catch (error) {
      setOtpError(error?.message || t.errorOtpInvalid);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !isValidNepaliMobile(phone)) return;
    try {
      await resendOtp(toE164(phone));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      messageApi.success(t.otpResent);
    } catch (error) {
      messageApi.error(error?.message || t.errorOtpInvalid);
    }
  };

  const handleNext = () => {
    if (currentKey === "intro") {
      setStepIndex(STEP_KEYS.indexOf("phone"));
      return;
    }
    if (currentKey === "phone") {
      handleRegister();
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
    (currentKey === "phone" && registering) || (currentKey === "otp" && verifying);

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
              <Link className="signup-done-primary" href="/app">
                {t.goDashboard} <ArrowRightOutlined />
              </Link>
              <Link className="signup-done-secondary" href="/events">
                {t.goEvents}
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
              <div className="signup-field signup-field-group">
                <label htmlFor="signup-name">{t.nameLabel}</label>
                <Input
                  id="signup-name"
                  size="large"
                  autoFocus
                  placeholder={t.namePlaceholder}
                  prefix={<UserOutlined />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />

                <label htmlFor="signup-email">{t.emailLabel}</label>
                <Input
                  id="signup-email"
                  size="large"
                  inputMode="email"
                  placeholder={t.emailPlaceholder}
                  prefix={<MailOutlined />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />

                <label htmlFor="signup-password">{t.passwordLabel}</label>
                <Input.Password
                  id="signup-password"
                  size="large"
                  placeholder={t.passwordPlaceholder}
                  prefix={<LockOutlined />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />

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
                  onPressEnter={handleRegister}
                  status={fieldError ? "error" : undefined}
                  autoComplete="tel-national"
                />
                <span className={`signup-field-hint${fieldError ? " is-error" : ""}`}>
                  {fieldError || t.phoneHint}
                </span>
                <p className="signup-login-prompt">
                  {t.alreadyPrompt} <Link href="/login">{t.loginCta}</Link>
                </p>
              </div>
            ) : null}

            {currentKey === "otp" ? (
              <div className="signup-field">
                <p className="signup-phone-echo">
                  {t.otpSentTo} +977 {phone}
                </p>
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
                  {otpError || t.otpHint}
                </span>
                <button
                  type="button"
                  className="signup-resend"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? t.otpResendIn.replace("{n}", String(resendCooldown))
                    : t.otpResend}
                </button>
              </div>
            ) : null}
          </MultiStepShell>
        )}
      </section>
    </SiteShell>
  );
}
