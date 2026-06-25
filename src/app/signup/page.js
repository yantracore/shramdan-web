"use client";

// Email + OTP membership signup — wired to the application-signup backend.
//   POST /applications/request-otp { email } → 6-digit code emailed
//   POST /applications { name, email, otp, password, role, motivation, phone? }
//        → 201 { user, application, accessToken, refreshToken }
// The submit creates a VERIFIED account and signs the user in, so the
// returned user + tokens go straight into setAuthSession (no merge step —
// the user object already carries email + role). Every quick signup lands
// as a generic Shramdan member (role: VOLUNTEER) with a default motivation;
// the richer contributor application lives at /join.
// Step keys: intro → details → otp → done.

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
import { requestApplicationOtp, submitApplication } from "@/lib/apiClient";
import { setAuthSession } from "@/lib/authSession";
import { copy as siteCopy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

const RESEND_COOLDOWN_SECONDS = 30;

// Every quick signup creates an application row; supply a neutral default so
// the required `motivation` field is satisfied without asking for prose here.
// The full contributor application at /join collects a real motivation.
const DEFAULT_MOTIVATION = "Signed up as a Shramdan member via quick signup.";
const DEFAULT_ROLE = "VOLUNTEER";

const COPY = {
  np: {
    pageTitle: "इमेल OTP बाट सदस्यता",
    nameLabel: "पूरा नाम",
    namePlaceholder: "तपाईंको नाम",
    emailLabel: "इमेल",
    emailPlaceholder: "you@example.com",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "कम्तीमा ६ अक्षर",
    confirmPasswordLabel: "पासवर्ड पुष्टि गर्नुहोस्",
    confirmPasswordPlaceholder: "पासवर्ड फेरि लेख्नुहोस्",
    phoneLabel: "मोबाइल नम्बर (वैकल्पिक)",
    phonePlaceholder: "9XXXXXXXXX",
    phoneHint: "नेपालको मोबाइल नम्बर — १० अंक, ९ बाट सुरु। वैकल्पिक।",
    detailsHint: "नाम, इमेल र पासवर्ड अनिवार्य। इमेलमा पुष्टि कोड पठाइन्छ।",
    sendOtp: "कोड पठाउने",
    otpResend: "फेरि पठाउने",
    otpResendIn: "{n} सेकेन्डमा फेरि पठाउन सकिन्छ",
    otpResent: "कोड फेरि पठाइयो।",
    otpVerify: "पुष्टि गर्ने",
    otpSentTo: "पुष्टि कोड यहाँ पठाइयो:",
    goDashboard: "ड्यासबोर्डमा जाने",
    goEvents: "अभियानहरू हेर्ने",
    errorNameRequired: "कृपया आफ्नो नाम लेख्नुहोस्।",
    errorEmailInvalid: "सही इमेल ठेगाना लेख्नुहोस्।",
    errorPasswordShort: "पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।",
    errorPasswordMismatch: "दुवै पासवर्ड मिलेनन्।",
    errorPhoneInvalid: "१० अंकको ९ बाट सुरु हुने मोबाइल नम्बर लेख्नुहोस् वा खाली छोड्नुहोस्।",
    errorOtpInvalid: "६ अंकको OTP कोड लेख्नुहोस्।",
    otpHint: "तपाईंको इमेलमा आएको ६ अंकको कोड लेख्नुहोस्।",
    otpExpiryHint: "ढुक्क हुनुहोस् — कोड १५ मिनेटसम्म मान्य हुन्छ।",
    alreadyPrompt: "पहिले नै खाता छ?",
    loginCta: "लगइन गर्ने।",
    introBullets: [
      "नाम, इमेल र पासवर्ड।",
      "इमेलमा ६ अंकको पुष्टि कोड पठाइन्छ।",
      "पुष्टि भएपछि तुरुन्तै श्रमदान सदस्य।"
    ]
  },
  en: {
    pageTitle: "Email OTP Signup",
    nameLabel: "Full name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 6 characters",
    confirmPasswordLabel: "Confirm password",
    confirmPasswordPlaceholder: "Re-enter your password",
    phoneLabel: "Mobile number (optional)",
    phonePlaceholder: "9XXXXXXXXX",
    phoneHint: "Nepali mobile number — 10 digits, starts with 9. Optional.",
    detailsHint: "Name, email and password are required. We email a verification code.",
    sendOtp: "Send Code",
    otpResend: "Resend",
    otpResendIn: "Resend available in {n}s",
    otpResent: "Code resent.",
    otpVerify: "Verify",
    otpSentTo: "Verification code sent to:",
    goDashboard: "Go to Dashboard",
    goEvents: "Browse Campaigns",
    errorNameRequired: "Please enter your name.",
    errorEmailInvalid: "Enter a valid email address.",
    errorPasswordShort: "Password must be at least 6 characters.",
    errorPasswordMismatch: "The two passwords don't match.",
    errorPhoneInvalid: "Enter a 10-digit mobile number starting with 9, or leave it blank.",
    errorOtpInvalid: "Enter the 6-digit OTP code.",
    otpHint: "Enter the 6-digit code sent to your email.",
    otpExpiryHint: "No rush — the code stays valid for 15 minutes.",
    alreadyPrompt: "Already have an account?",
    loginCta: "Log in.",
    introBullets: [
      "Your name, email and password.",
      "We email you a 6-digit verification code.",
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

const STEP_KEYS = ["intro", "details", "otp", "done"];

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
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

  const handleRequestOtp = async () => {
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
    if (confirmPassword !== password) {
      setFieldError(t.errorPasswordMismatch);
      return;
    }
    // Phone is optional now (OTP arrives by email). Validate only when filled.
    if (phone.trim() && !isValidNepaliMobile(phone)) {
      setFieldError(t.errorPhoneInvalid);
      return;
    }

    setRequesting(true);
    try {
      await requestApplicationOtp(email.trim());
      setStepIndex(STEP_KEYS.indexOf("otp"));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      // Backend is the source of truth — surface its message (email already
      // registered, resend cooldown, etc.).
      setFieldError(error?.message || t.errorEmailInvalid);
    } finally {
      setRequesting(false);
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
      const response = await submitApplication({
        name: name.trim(),
        email: email.trim(),
        otp: otp.trim(),
        password,
        role: DEFAULT_ROLE,
        motivation: DEFAULT_MOTIVATION,
        ...(phone.trim() ? { phone: toE164(phone) } : {})
      });
      const data = response?.data ?? {};
      // The 201 user is full (email + role), so no merge is needed.
      setAuthSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? null,
        user: data.user
      });
      setStepIndex(STEP_KEYS.indexOf("done"));
    } catch (error) {
      setOtpError(error?.message || t.errorOtpInvalid);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !isValidEmail(email)) return;
    try {
      await requestApplicationOtp(email.trim());
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      messageApi.success(t.otpResent);
    } catch (error) {
      messageApi.error(error?.message || t.errorEmailInvalid);
    }
  };

  const handleNext = () => {
    if (currentKey === "intro") {
      setStepIndex(STEP_KEYS.indexOf("details"));
      return;
    }
    if (currentKey === "details") {
      handleRequestOtp();
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
      setStepIndex(STEP_KEYS.indexOf("details"));
      return;
    }
    if (currentKey === "details") {
      setStepIndex(STEP_KEYS.indexOf("intro"));
    }
  };

  const isDone = currentKey === "done";
  const nextLoading =
    (currentKey === "details" && requesting) || (currentKey === "otp" && verifying);

  let nextLabel;
  if (currentKey === "intro") nextLabel = ms.intro.cta;
  else if (currentKey === "details") nextLabel = t.sendOtp;
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
              <Link className="signup-done-secondary" href="/campaign">
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

            {currentKey === "details" ? (
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

                <label htmlFor="signup-confirm-password">{t.confirmPasswordLabel}</label>
                <Input.Password
                  id="signup-confirm-password"
                  size="large"
                  placeholder={t.confirmPasswordPlaceholder}
                  prefix={<LockOutlined />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onPressEnter={handleRequestOtp}
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
                  onPressEnter={handleRequestOtp}
                  status={fieldError ? "error" : undefined}
                  autoComplete="tel-national"
                />
                <span className={`signup-field-hint${fieldError ? " is-error" : ""}`}>
                  {fieldError || t.detailsHint}
                </span>
                <p className="signup-login-prompt">
                  {t.alreadyPrompt} <Link href="/login">{t.loginCta}</Link>
                </p>
              </div>
            ) : null}

            {currentKey === "otp" ? (
              <div className="signup-field">
                <p className="signup-phone-echo">
                  {t.otpSentTo} {email}
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
                <p className="signup-otp-expiry">{t.otpExpiryHint}</p>
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
