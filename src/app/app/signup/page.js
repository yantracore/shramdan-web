"use client";

// /app/signup — phone + OTP signup flow (roadmap 2.1).
// Mock backend: any 6-digit OTP is accepted in demo mode; production
// would POST /auth/otp/request + /auth/otp/verify.
//
// Sub-leaves covered by this page:
//   2.1.1 Phone entry + country code picker
//   2.1.2 OTP send + verify
//   2.1.3 Profile basics on account creation
//   2.1.4 Resend + rate-limit + error UX

import { ArrowLeftOutlined, MobileOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Select } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";

const COUNTRY_CODES = [
  { code: "+977", label: "+977 (नेपाल / Nepal)" },
  { code: "+91", label: "+91 (भारत / India)" },
  { code: "+1", label: "+1 (US / Canada)" },
  { code: "+44", label: "+44 (UK)" },
  { code: "+61", label: "+61 (Australia)" }
];

const RESEND_COOLDOWN_S = 30;
const MAX_RESEND_ATTEMPTS = 3;

const COPY = {
  np: {
    pageTitle: "श्रमदान सदस्य खाता",
    backToHome: "गृहपृष्ठ",
    stepOneTitle: "फोन नम्बर पुष्टि",
    stepOneIntro:
      "तपाईंको खाता मोबाइल नम्बरमा आधारित हुनेछ। हामी ६ अंकको OTP पठाउनेछौँ।",
    countryLabel: "देश कोड",
    phoneLabel: "मोबाइल नम्बर",
    phonePlaceholder: "९८XXXXXXXX",
    phoneRequired: "मोबाइल नम्बर आवश्यक छ",
    phoneInvalid: "मोबाइल नम्बर मान्य हुनुपर्छ (कम्तीमा १० अङ्क)",
    sendOtpCta: "OTP पठाउनुहोस्",
    stepTwoTitle: "OTP प्रविष्ट गर्नुहोस्",
    stepTwoIntro:
      "हामीले {phone} मा ६ अंकको कोड पठायौँ। डेमो: कुनै ६ अंक प्रविष्ट गरे काम गर्छ।",
    otpLabel: "OTP कोड",
    otpRequired: "OTP आवश्यक छ",
    otpInvalid: "OTP ६ अङ्कको हुनुपर्छ",
    nameLabel: "तपाईंको नाम",
    namePlaceholder: "उदाहरण: रिता पाण्डे",
    nameRequired: "नाम आवश्यक छ",
    cityLabel: "तपाईंको शहर (वैकल्पिक)",
    cityPlaceholder: "उदाहरण: काठमाडौँ",
    verifyCta: "पुष्टि र खाता खोल्नुहोस्",
    resendCta: "OTP पुनः पठाउनुहोस्",
    resendIn: "{n} सेकेन्ड पछि",
    resendExhausted: "धेरै प्रयास भयो — केही समय पछि फेरि कोशिश गर्नुहोस्",
    backToStepOne: "नम्बर बदल्नुहोस्",
    stepThreeTitle: "खाता तयार छ!",
    stepThreeIntro: "स्वागत छ, {name}! अब तपाईं अभियानमा जोडिन तयार हुनुहुन्छ।",
    goDashboardCta: "ड्यासबोर्ड हेर्नुहोस्",
    demoBanner: "डेमो मोड — कुनै ६ अंकको कोड प्रविष्ट गरे काम गर्छ। साँचो SMS पठाइँदैन।"
  },
  en: {
    pageTitle: "Shramdan member signup",
    backToHome: "Home",
    stepOneTitle: "Verify your phone",
    stepOneIntro:
      "Your account is keyed to your mobile number. We'll send a 6-digit OTP.",
    countryLabel: "Country code",
    phoneLabel: "Mobile number",
    phonePlaceholder: "98XXXXXXXX",
    phoneRequired: "Phone number is required",
    phoneInvalid: "Enter a valid phone number (at least 10 digits)",
    sendOtpCta: "Send OTP",
    stepTwoTitle: "Enter the OTP",
    stepTwoIntro:
      "We sent a 6-digit code to {phone}. Demo: any 6 digits will work.",
    otpLabel: "OTP code",
    otpRequired: "OTP is required",
    otpInvalid: "OTP must be exactly 6 digits",
    nameLabel: "Your name",
    namePlaceholder: "e.g. Rita Pandey",
    nameRequired: "Name is required",
    cityLabel: "Your city (optional)",
    cityPlaceholder: "e.g. Kathmandu",
    verifyCta: "Verify and create account",
    resendCta: "Resend OTP",
    resendIn: "in {n}s",
    resendExhausted: "Too many attempts — try again in a few minutes",
    backToStepOne: "Change number",
    stepThreeTitle: "Account ready!",
    stepThreeIntro: "Welcome, {name}! You're ready to join campaigns.",
    goDashboardCta: "Open dashboard",
    demoBanner: "Demo mode — any 6 digits work. No real SMS is sent."
  }
};

export default function AppSignupPage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;

  const [step, setStep] = useState(1);
  const [countryCode, setCountryCode] = useState("+977");
  const [phone, setPhone] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completedName, setCompletedName] = useState("");
  const [phoneForm] = Form.useForm();
  const [otpForm] = Form.useForm();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handlePhoneSubmit = async ({ countryCode: cc, phone: ph }) => {
    setSubmitting(true);
    setCountryCode(cc);
    setPhone(ph);
    await new Promise((resolve) => setTimeout(resolve, 350));
    setSubmitting(false);
    setStep(2);
    setResendCooldown(RESEND_COOLDOWN_S);
    setResendAttempts(1);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendAttempts >= MAX_RESEND_ATTEMPTS) return;
    setResendAttempts((n) => n + 1);
    setResendCooldown(RESEND_COOLDOWN_S);
  };

  const handleOtpSubmit = async ({ otp, name, city }) => {
    setSubmitting(true);
    // Demo: accept any 6-digit string. Production: POST /auth/otp/verify.
    await new Promise((resolve) => setTimeout(resolve, 450));
    setSubmitting(false);
    setCompletedName(name);
    setStep(3);
  };

  const handleGoToDashboard = () => {
    router.push("/app");
  };

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="app-signup page-section">
        <Link href="/" className="app-signup-back">
          <ArrowLeftOutlined aria-hidden="true" /> {t.backToHome}
        </Link>

        <Alert
          type="info"
          showIcon
          message={t.demoBanner}
          className="app-signup-demo-banner"
        />

        <ol className="app-signup-stepper" aria-label="signup steps">
          <li className={step >= 1 ? "is-active" : ""}>
            <span className="app-signup-step-num">1</span>
            <span>{t.stepOneTitle}</span>
          </li>
          <li className={step >= 2 ? "is-active" : ""}>
            <span className="app-signup-step-num">2</span>
            <span>{t.stepTwoTitle}</span>
          </li>
          <li className={step >= 3 ? "is-active" : ""}>
            <span className="app-signup-step-num">3</span>
            <span>{t.stepThreeTitle}</span>
          </li>
        </ol>

        {step === 1 ? (
          <section className="app-signup-card">
            <header className="app-signup-card-header">
              <MobileOutlined aria-hidden="true" />
              <h1>{t.stepOneTitle}</h1>
              <p>{t.stepOneIntro}</p>
            </header>
            <Form
              form={phoneForm}
              layout="vertical"
              onFinish={handlePhoneSubmit}
              initialValues={{ countryCode: "+977" }}
              disabled={submitting}
            >
              <Form.Item label={t.countryLabel} name="countryCode" required>
                <Select options={COUNTRY_CODES.map((c) => ({ value: c.code, label: c.label }))} />
              </Form.Item>
              <Form.Item
                label={t.phoneLabel}
                name="phone"
                rules={[
                  { required: true, message: t.phoneRequired },
                  { pattern: /^\d{10,}$/, message: t.phoneInvalid }
                ]}
              >
                <Input
                  inputMode="tel"
                  placeholder={t.phonePlaceholder}
                  maxLength={15}
                  autoFocus
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} size="large" block>
                {t.sendOtpCta}
              </Button>
            </Form>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="app-signup-card">
            <header className="app-signup-card-header">
              <UserOutlined aria-hidden="true" />
              <h1>{t.stepTwoTitle}</h1>
              <p>{t.stepTwoIntro.replace("{phone}", `${countryCode} ${phone}`)}</p>
            </header>
            <Form
              form={otpForm}
              layout="vertical"
              onFinish={handleOtpSubmit}
              disabled={submitting}
            >
              <Form.Item
                label={t.otpLabel}
                name="otp"
                rules={[
                  { required: true, message: t.otpRequired },
                  { pattern: /^\d{6}$/, message: t.otpInvalid }
                ]}
              >
                <Input
                  inputMode="numeric"
                  placeholder="------"
                  maxLength={6}
                  autoFocus
                  style={{ letterSpacing: "0.4em", textAlign: "center", fontSize: 20 }}
                />
              </Form.Item>
              <Form.Item
                label={t.nameLabel}
                name="name"
                rules={[{ required: true, message: t.nameRequired }]}
              >
                <Input placeholder={t.namePlaceholder} maxLength={80} />
              </Form.Item>
              <Form.Item label={t.cityLabel} name="city">
                <Input placeholder={t.cityPlaceholder} maxLength={80} />
              </Form.Item>
              <div className="app-signup-actions">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                >
                  {t.verifyCta}
                </Button>
                <Button
                  type="text"
                  onClick={handleResend}
                  disabled={
                    resendCooldown > 0 ||
                    resendAttempts >= MAX_RESEND_ATTEMPTS ||
                    submitting
                  }
                >
                  {resendAttempts >= MAX_RESEND_ATTEMPTS
                    ? t.resendExhausted
                    : resendCooldown > 0
                      ? `${t.resendCta} ${t.resendIn.replace("{n}", resendCooldown)}`
                      : t.resendCta}
                </Button>
                <Button type="link" onClick={() => setStep(1)}>
                  {t.backToStepOne}
                </Button>
              </div>
            </Form>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="app-signup-card app-signup-card-success">
            <header className="app-signup-card-header">
              <h1>{t.stepThreeTitle}</h1>
              <p>{t.stepThreeIntro.replace("{name}", completedName)}</p>
            </header>
            <Button type="primary" size="large" onClick={handleGoToDashboard}>
              {t.goDashboardCta}
            </Button>
          </section>
        ) : null}
      </section>
    </SiteShell>
  );
}
