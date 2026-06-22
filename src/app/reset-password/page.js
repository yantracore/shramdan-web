"use client";

// Password reset via email OTP. Two phases:
//   request → POST /auth/forgot-password { email }  (emails a 6-digit code)
//   reset   → POST /auth/reset-password { email, otp, newPassword }
// Replaces the old "forgot password" dead-link that pointed at /feedback.

import {
  ArrowRightOutlined,
  CheckCircleFilled,
  LockOutlined,
  MailOutlined
} from "@ant-design/icons";
import { Button, Input } from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePreferences } from "@/app/providers";
import { SiteShell } from "@/components/SiteShell";
import { forgotPassword, resetPassword } from "@/lib/apiClient";
import { useToast } from "@/lib/toast";

const RESEND_COOLDOWN_SECONDS = 30;

const COPY = {
  np: {
    pageTitle: "पासवर्ड रिसेट",
    eyebrow: "खाता पुनःप्राप्ति",
    title: "पासवर्ड रिसेट गर्नुहोस्",
    requestIntro: "आफ्नो इमेल हाल्नुहोस् — हामी ६ अंकको रिसेट कोड पठाउँछौँ।",
    resetIntro: "{email} मा पठाइएको कोड र नयाँ पासवर्ड हाल्नुहोस्।",
    emailLabel: "इमेल",
    otpLabel: "रिसेट कोड",
    pwLabel: "नयाँ पासवर्ड",
    pwPlaceholder: "कम्तीमा ६ अक्षर",
    confirmLabel: "पासवर्ड पुष्टि गर्नुहोस्",
    confirmPlaceholder: "पासवर्ड फेरि लेख्नुहोस्",
    sendCta: "कोड पठाउने",
    resetCta: "पासवर्ड रिसेट गर्ने",
    resend: "कोड फेरि पठाउने",
    resendIn: "{n} सेकेन्डमा फेरि पठाउन सकिन्छ",
    requestHint: "खाता भएको इमेलमा मात्र कोड पठाइन्छ।",
    expiryHint: "ढुक्क हुनुहोस् — कोड १५ मिनेटसम्म मान्य हुन्छ।",
    remembered: "पासवर्ड सम्झनुभयो?",
    loginCta: "लगइन गर्ने।",
    sent: "रिसेट कोड पठाइयो।",
    errEmail: "सही इमेल ठेगाना लेख्नुहोस्।",
    errOtp: "६ अंकको कोड हाल्नुहोस्।",
    errPwShort: "पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।",
    errMismatch: "दुवै पासवर्ड मिलेनन्।",
    errGeneric: "केही गडबड भयो। फेरि प्रयास गर्नुहोस्।",
    doneEyebrow: "सम्पन्न",
    doneTitle: "पासवर्ड रिसेट भयो।",
    doneBody: "अब नयाँ पासवर्डले लगइन गर्न सक्नुहुन्छ।",
    toLogin: "लगइनमा जाने"
  },
  en: {
    pageTitle: "Reset password",
    eyebrow: "Account recovery",
    title: "Reset your password",
    requestIntro: "Enter your email — we'll send a 6-digit reset code.",
    resetIntro: "Enter the code sent to {email} and a new password.",
    emailLabel: "Email",
    otpLabel: "Reset code",
    pwLabel: "New password",
    pwPlaceholder: "At least 6 characters",
    confirmLabel: "Confirm password",
    confirmPlaceholder: "Re-enter your password",
    sendCta: "Send Code",
    resetCta: "Reset Password",
    resend: "Resend code",
    resendIn: "Resend available in {n}s",
    requestHint: "A code is only sent if the email has an account.",
    expiryHint: "No rush — the code stays valid for 15 minutes.",
    remembered: "Remembered your password?",
    loginCta: "Log in.",
    sent: "Reset code sent.",
    errEmail: "Enter a valid email address.",
    errOtp: "Enter the 6-digit code.",
    errPwShort: "Password must be at least 6 characters.",
    errMismatch: "The two passwords don't match.",
    errGeneric: "Something went wrong. Please try again.",
    doneEyebrow: "Done",
    doneTitle: "Password reset.",
    doneBody: "You can now log in with your new password.",
    toLogin: "Go to login"
  }
};

function isValidEmail(raw) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(raw || "").trim());
}

function isValidOtp(raw) {
  return /^\d{6}$/.test(String(raw || "").trim());
}

export default function ResetPasswordPage() {
  const { language } = usePreferences();
  const messageApi = useToast();
  const t = COPY[language] || COPY.np;

  const [phase, setPhase] = useState("request"); // request | reset | done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = window.setInterval(() => setCooldown((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  const handleRequest = async () => {
    setError("");
    if (!isValidEmail(email)) {
      setError(t.errEmail);
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setPhase("reset");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      messageApi.success(t.sent);
    } catch (e) {
      setError(e?.message || t.errGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !isValidEmail(email)) return;
    try {
      await forgotPassword(email.trim());
      setCooldown(RESEND_COOLDOWN_SECONDS);
      messageApi.success(t.sent);
    } catch (e) {
      messageApi.error(e?.message || t.errGeneric);
    }
  };

  const handleReset = async () => {
    setError("");
    if (!isValidOtp(otp)) {
      setError(t.errOtp);
      return;
    }
    if (password.length < 6) {
      setError(t.errPwShort);
      return;
    }
    if (password !== confirm) {
      setError(t.errMismatch);
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), otp: otp.trim(), newPassword: password });
      setPhase("done");
    } catch (e) {
      setError(e?.message || t.errOtp);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section multi-step-section signup-section">
        <article
          className="multi-step-card signup-card"
          style={{ maxWidth: 520, margin: "0 auto" }}
        >
          {phase === "done" ? (
            <>
              <span className="signup-seal" aria-hidden="true">
                <CheckCircleFilled />
              </span>
              <header className="multi-step-card-heading">
                <span className="eyebrow">{t.doneEyebrow}</span>
                <h1>{t.doneTitle}</h1>
                <p>{t.doneBody}</p>
              </header>
              <Link className="signup-done-primary" href="/login">
                {t.toLogin} <ArrowRightOutlined />
              </Link>
            </>
          ) : (
            <>
              <header className="multi-step-card-heading">
                <span className="eyebrow">{t.eyebrow}</span>
                <h1>{t.title}</h1>
                <p>
                  {phase === "request"
                    ? t.requestIntro
                    : t.resetIntro.replace("{email}", email)}
                </p>
              </header>
              <div className="signup-field signup-field-group">
                {phase === "request" ? (
                  <>
                    <label htmlFor="rp-email">{t.emailLabel}</label>
                    <Input
                      id="rp-email"
                      size="large"
                      autoFocus
                      inputMode="email"
                      prefix={<MailOutlined />}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onPressEnter={handleRequest}
                      autoComplete="email"
                    />
                  </>
                ) : (
                  <>
                    <label htmlFor="rp-otp">{t.otpLabel}</label>
                    <Input
                      id="rp-otp"
                      size="large"
                      inputMode="numeric"
                      maxLength={6}
                      className="signup-otp-input"
                      placeholder="••••••"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      autoComplete="one-time-code"
                    />
                    <label htmlFor="rp-pw">{t.pwLabel}</label>
                    <Input.Password
                      id="rp-pw"
                      size="large"
                      prefix={<LockOutlined />}
                      placeholder={t.pwPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <label htmlFor="rp-confirm">{t.confirmLabel}</label>
                    <Input.Password
                      id="rp-confirm"
                      size="large"
                      prefix={<LockOutlined />}
                      placeholder={t.confirmPlaceholder}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onPressEnter={handleReset}
                      autoComplete="new-password"
                    />
                  </>
                )}
                <span className={`signup-field-hint${error ? " is-error" : ""}`}>
                  {error || (phase === "reset" ? t.expiryHint : t.requestHint)}
                </span>
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={loading}
                  onClick={phase === "request" ? handleRequest : handleReset}
                >
                  {phase === "request" ? t.sendCta : t.resetCta}
                </Button>
                {phase === "reset" ? (
                  <button
                    type="button"
                    className="signup-resend"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                  >
                    {cooldown > 0 ? t.resendIn.replace("{n}", String(cooldown)) : t.resend}
                  </button>
                ) : null}
                <p className="signup-login-prompt">
                  {t.remembered} <Link href="/login">{t.loginCta}</Link>
                </p>
              </div>
            </>
          )}
        </article>
      </section>
    </SiteShell>
  );
}
