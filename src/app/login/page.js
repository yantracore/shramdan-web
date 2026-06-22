"use client";

import {
  CheckCircleOutlined,
  FlagOutlined,
  LockOutlined,
  MailOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Button, Input } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { usePreferences } from "@/app/providers";
import { Form } from "@/components/AppForm";
import { SiteShell } from "@/components/SiteShell";
import { loginWithPassword } from "@/lib/apiClient";
import { getAuthSession, isAdminUser, setAuthSession } from "@/lib/authSession";
import { isKnownIntent, isSafeNextPath } from "@/lib/loginRedirect";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

const loginCopy = {
  np: {
    eyebrow: "योगदानकर्ता प्रवेश",
    title: "लगइन",
    intro:
      "श्रमदान सदस्यका रूपमा स्थानीय समस्या रिपोर्ट गर्न, सामुदायिक प्राथमिकतामा भोट दिन र वरपरका सरसफाइ कार्यक्रममा सहभागी हुन लगइन गर्नुहोस्।",
    email: "इमेल ठेगाना",
    emailPlaceholder: "इमेल",
    password: "पासवर्ड",
    passwordPlaceholder: "पासवर्ड",
    submit: "लगइन",
    required: "यो विवरण आवश्यक छ।",
    emailInvalid: "कृपया सही इमेल ठेगाना लेख्नुहोस्।",
    success: "लगइन सफल भयो।",
    joinPrompt: "श्रमदानको सदस्य हुनुहुन्न?",
    joinCta: "श्रमदानमा जोडिने।",
    forgot: "पासवर्ड बिर्सनुभयो?",
    benefitsTitle: "सदस्यले के गर्न पाउँछन्",
    visualAlt: "समुदायका स्वयंसेवकहरूले सफा गरिएको बाटो छेउमा बिरुवा रोप्दै",
    proofEyebrow: "समुदायसँग जोडिएको खाता",
    proofTitle: "समस्या देखेपछि चुप बस्नु नपर्ने ठाउँ",
    proofBody:
      "लगइन गरेपछि तपाईंले रिपोर्ट, मतदान र अभियान सहभागिता एउटै खाताबाट सम्हाल्न सक्नुहुन्छ।",
    highlights: [
      { value: "३", label: "मुख्य काम" },
      { value: "१", label: "सदस्य खाता" }
    ],
    benefits: [
      { icon: FlagOutlined, text: "स्थानीय समस्या रिपोर्ट गर्न र समर्थन जुटाउन" },
      { icon: TeamOutlined, text: "सरसफाइ अभियानमा भूमिका छानेर सहभागी हुन" },
      { icon: CheckCircleOutlined, text: "समुदायको प्राथमिकतामा भोट दिन" }
    ],
    intents: {
      vote: "मतदान गर्न लगइन गर्नुहोस्",
      comment: "कमेन्ट गर्न लगइन गर्नुहोस्",
      join: "सहभागी हुन लगइन गर्नुहोस्",
      contribute: "योगदान दिन लगइन गर्नुहोस्",
      nominate: "नेता मनोनयन गर्न लगइन गर्नुहोस्",
      report: "समस्या रिपोर्ट गर्न लगइन गर्नुहोस्",
      expired: "तपाईंको session सकिएको छ; पुनः लगइन गर्नुहोस्"
    }
  },
  en: {
    eyebrow: "Member access",
    title: "Login",
    intro:
      "Sign in as a Shramdan member to report local issues, vote on community priorities, and join cleanup events near you.",
    email: "Email address",
    emailPlaceholder: "Email",
    password: "Password",
    passwordPlaceholder: "Password",
    submit: "Login",
    required: "This field is required.",
    emailInvalid: "Please enter a valid email address.",
    success: "Login successful.",
    joinPrompt: "Not a Shramdan member?",
    joinCta: "Join Shramdan.",
    forgot: "Forgot password?",
    benefitsTitle: "What members can do",
    visualAlt: "Community volunteers planting saplings beside a freshly cleaned street",
    proofEyebrow: "A community-connected account",
    proofTitle: "A place to act when local problems appear",
    proofBody:
      "Once signed in, you can manage reports, votes, and campaign participation from one member account.",
    highlights: [
      { value: "3", label: "Core actions" },
      { value: "1", label: "Member account" }
    ],
    benefits: [
      { icon: FlagOutlined, text: "Report local issues and rally support" },
      { icon: TeamOutlined, text: "Pick a role and join nearby cleanup events" },
      { icon: CheckCircleOutlined, text: "Vote on community priorities" }
    ],
    intents: {
      vote: "Login to cast your vote",
      comment: "Login to post your comment",
      join: "Login to join this event",
      contribute: "Login to contribute",
      nominate: "Login to nominate a leader",
      report: "Login to report an issue",
      expired: "Your session has expired — please log in again"
    }
  }
};

function redirectPathForUser(user, nextParam) {
  if (isSafeNextPath(nextParam)) {
    const targetsAdmin = nextParam === "/admin" || nextParam.startsWith("/admin/");
    if (targetsAdmin && !isAdminUser(user)) {
      return "/events";
    }
    return nextParam;
  }

  return isAdminUser(user) ? "/admin" : "/events";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? searchParams.get("from");
  const nextParam = isSafeNextPath(rawNext) ? rawNext : null;
  const intentParam = searchParams.get("intent");
  const { language } = usePreferences();
  const t = loginCopy[language] ?? loginCopy.np;
  const globalCopy = copy[language] ?? copy.np;
  const [form] = Form.useForm();
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const intentMessage = isKnownIntent(intentParam) ? t.intents?.[intentParam] : null;

  useEffect(() => {
    const session = getAuthSession();

    if (session?.user) {
      router.replace(redirectPathForUser(session.user, nextParam));
    }
  }, [router, nextParam]);

  const handleLogin = async (values) => {
    setSubmitting(true);

    try {
      const response = await loginWithPassword(values);
      const session = setAuthSession(response.data);

      messageApi.success(t.success);
      router.replace(redirectPathForUser(session?.user, nextParam));
    } catch (error) {
      messageApi.error(error.message || globalCopy.messages.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteShell pageTitle={globalCopy.pageTitles.login}>
      <section className="page-section login-section">
        <div className="login-layout">
          <aside className="login-benefits" aria-labelledby="login-benefits-title">
            <div className="login-benefits-media">
              <Image
                alt={t.visualAlt}
                fill
                priority
                sizes="(max-width: 820px) 100vw, 520px"
                src="/images/login/member-access.webp"
              />
            </div>
            <div className="login-benefits-copy">
              <span className="eyebrow">{t.proofEyebrow}</span>
              <h2 id="login-benefits-title" className="login-benefits-title">
                {t.proofTitle}
              </h2>
              <p>{t.proofBody}</p>
            </div>
            <div className="login-proof-grid" aria-label={t.benefitsTitle}>
              {t.highlights.map((item) => (
                <span className="login-proof-pill" key={`${item.value}-${item.label}`}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
            <ul className="login-benefits-list">
              {t.benefits.map(({ icon: Icon, text }, i) => (
                <li key={i}>
                  <span className="login-benefit-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </aside>
          <div className="content-card login-card">
            <header className="form-card-heading">
              <span className="eyebrow">{t.eyebrow}</span>
              <h1>{t.title}</h1>
              {intentMessage ? (
                <p className="login-intent" role="status">
                  {intentMessage}
                </p>
              ) : null}
              <p>{t.intro}</p>
            </header>
            <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
              <Form.Item
                label={t.email}
                name="email"
                rules={[
                  { required: true, message: t.required },
                  { type: "email", message: t.emailInvalid }
                ]}
              >
                <Input autoComplete="email" placeholder={t.emailPlaceholder} prefix={<MailOutlined />} />
              </Form.Item>

              <Form.Item
                label={t.password}
                name="password"
                rules={[{ required: true, message: t.required }]}
              >
                <Input.Password
                  autoComplete="current-password"
                  placeholder={t.passwordPlaceholder}
                  prefix={<LockOutlined />}
                />
              </Form.Item>

              <div className="login-forgot">
                <Link href="/reset-password">{t.forgot}</Link>
              </div>

              <div className="login-actions">
                <Button block htmlType="submit" loading={submitting} type="primary">
                  {t.submit}
                </Button>
              </div>
            </Form>
            <p className="login-join-prompt">
              {t.joinPrompt}{" "}
              <Link href="/join">{t.joinCta}</Link>
            </p>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
