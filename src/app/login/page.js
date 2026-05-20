"use client";

import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePreferences } from "@/app/providers";
import { SiteShell } from "@/components/SiteShell";
import { loginWithPassword } from "@/lib/apiClient";
import { getAuthSession, isAdminUser, setAuthSession } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";

const loginCopy = {
  np: {
    title: "लगइन",
    intro: "अगाडि बढ्न आफ्नो खाता प्रयोग गरेर लगइन गर्नुहोस्।",
    email: "इमेल ठेगाना",
    emailPlaceholder: "इमेल",
    password: "पासवर्ड",
    passwordPlaceholder: "पासवर्ड",
    submit: "लगइन",
    required: "यो विवरण आवश्यक छ।",
    emailInvalid: "कृपया सही इमेल ठेगाना लेख्नुहोस्।",
    success: "लगइन सफल भयो।"
  },
  en: {
    title: "Login",
    intro: "Sign in to continue.",
    email: "Email address",
    emailPlaceholder: "Email",
    password: "Password",
    passwordPlaceholder: "Password",
    submit: "Login",
    required: "This field is required.",
    emailInvalid: "Please enter a valid email address.",
    success: "Login successful."
  }
};

function redirectPathForUser(user) {
  return isAdminUser(user) ? "/admin" : "/me";
}

export default function LoginPage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = loginCopy[language] ?? loginCopy.np;
  const globalCopy = copy[language] ?? copy.np;
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const session = getAuthSession();

    if (session?.user) {
      router.replace(redirectPathForUser(session.user));
    }
  }, [router]);

  const handleLogin = async (values) => {
    setSubmitting(true);

    try {
      const response = await loginWithPassword(values);
      const session = setAuthSession(response.data);

      messageApi.success(t.success);
      router.replace(redirectPathForUser(session?.user));
    } catch (error) {
      messageApi.error(error.message || globalCopy.messages.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteShell>
      {contextHolder}
      <section className="page-section login-section">
        <div className="section-heading login-heading">
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </div>

        <div className="content-card login-card">
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
        </div>
      </section>
    </SiteShell>
  );
}
