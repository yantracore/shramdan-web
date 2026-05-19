"use client";

import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePreferences } from "@/app/providers";
import { SiteShell } from "@/components/SiteShell";
import { loginWithPassword } from "@/lib/apiClient";
import { clearAuthSession, getAuthSession, isAdminUser, setAuthSession } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";

const loginCopy = {
  np: {
    eyebrow: "आन्तरिक पहुँच",
    title: "Admin Control Center मा लगइन गर्नुहोस्",
    intro:
      "यो क्षेत्र Shramdan को applications, feedback, र operational काम व्यवस्थापन गर्ने admin टोलीका लागि हो।",
    email: "Email address",
    password: "Password",
    submit: "Login",
    required: "यो विवरण आवश्यक छ।",
    emailInvalid: "कृपया सही email address लेख्नुहोस्।",
    success: "लगइन सफल भयो। Admin control center खोलिँदैछ।",
    adminRequiredTitle: "Admin access required",
    adminRequired:
      "तपाईंको account login भयो, तर यो control center खोल्न ADMIN role चाहिन्छ। Normal user app shell पछि /app मा आउनेछ।",
    logout: "Logout",
    retry: "Try another account",
    securityTitle: "Version 1 admin access",
    securityBody:
      "Login API ले JWT access token दिन्छ। यो web v1 मा localStorage मा राखिन्छ र protected API calls मा Bearer token को रूपमा पठाइन्छ।"
  },
  en: {
    eyebrow: "Internal access",
    title: "Log in to the Admin Control Center",
    intro:
      "This area is for the Shramdan admin team to manage applications, feedback, and operational work.",
    email: "Email address",
    password: "Password",
    submit: "Login",
    required: "This field is required.",
    emailInvalid: "Please enter a valid email address.",
    success: "Login successful. Opening the admin control center.",
    adminRequiredTitle: "Admin access required",
    adminRequired:
      "Your account is logged in, but this control center requires the ADMIN role. The normal user app shell will live at /app later.",
    logout: "Logout",
    retry: "Try another account",
    securityTitle: "Version 1 admin access",
    securityBody:
      "The login API returns a JWT access token. In this web v1, it is stored in localStorage and sent as a Bearer token for protected API calls."
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = loginCopy[language] ?? loginCopy.np;
  const globalCopy = copy[language] ?? copy.np;
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const [adminRequired, setAdminRequired] = useState(false);

  useEffect(() => {
    const session = getAuthSession();

    if (isAdminUser(session?.user)) {
      router.replace("/admin");
    }
  }, [router]);

  const handleLogin = async (values) => {
    setSubmitting(true);
    setAdminRequired(false);

    try {
      const response = await loginWithPassword(values);
      const session = setAuthSession(response.data);

      if (isAdminUser(session?.user)) {
        messageApi.success(t.success);
        router.replace("/admin");
        return;
      }

      setAdminRequired(true);
    } catch (error) {
      messageApi.error(error.message || globalCopy.messages.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setAdminRequired(false);
    form.resetFields();
  };

  return (
    <SiteShell>
      {contextHolder}
      <section className="page-section login-section">
        <div className="section-heading login-heading">
          <span className="eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
          <div className="login-security-note">
            <SafetyCertificateOutlined aria-hidden="true" />
            <div>
              <strong>{t.securityTitle}</strong>
              <p>{t.securityBody}</p>
            </div>
          </div>
        </div>

        <div className="content-card login-card">
          {adminRequired ? (
            <Alert
              action={
                <Button size="small" onClick={handleLogout}>
                  {t.retry}
                </Button>
              }
              description={t.adminRequired}
              message={t.adminRequiredTitle}
              showIcon
              type="warning"
            />
          ) : null}

          <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
            <Form.Item
              label={t.email}
              name="email"
              rules={[
                { required: true, message: t.required },
                { type: "email", message: t.emailInvalid }
              ]}
            >
              <Input autoComplete="email" prefix={<MailOutlined />} />
            </Form.Item>

            <Form.Item
              label={t.password}
              name="password"
              rules={[{ required: true, message: t.required }]}
            >
              <Input.Password autoComplete="current-password" prefix={<LockOutlined />} />
            </Form.Item>

            <div className="login-actions">
              <Button block htmlType="submit" loading={submitting} type="primary">
                {t.submit}
              </Button>
              {adminRequired ? (
                <Button block onClick={handleLogout}>
                  {t.logout}
                </Button>
              ) : null}
            </div>
          </Form>
        </div>
      </section>
    </SiteShell>
  );
}
