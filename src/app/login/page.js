"use client";

import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Form, Input } from "antd";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { usePreferences } from "@/app/providers";
import { SiteShell } from "@/components/SiteShell";
import { loginWithPassword } from "@/lib/apiClient";
import { getAuthSession, isAdminUser, setAuthSession } from "@/lib/authSession";
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
    joinCta: "सदस्य बन्नुहोस्"
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
    joinPrompt: "Not a member?",
    joinCta: "Become a Member"
  }
};

function isSafeRelativePath(path) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

function redirectPathForUser(user, nextParam) {
  if (isSafeRelativePath(nextParam)) {
    return nextParam;
  }

  return isAdminUser(user) ? "/admin" : "/issues";
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const { language } = usePreferences();
  const t = loginCopy[language] ?? loginCopy.np;
  const globalCopy = copy[language] ?? copy.np;
  const [form] = Form.useForm();
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);

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
        <div className="content-card login-card">
          <header className="form-card-heading">
            <span className="eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1>
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
