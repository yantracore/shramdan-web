"use client";

// /app/kyc — KYC submission flow for prospective event leaders
// (roadmap 2.8). Demo mode: stores submission locally + shows
// success state. Real backend would POST /me/kyc with multipart
// upload and queue an admin verification job.

import {
  CheckCircleFilled,
  IdcardOutlined,
  SafetyCertificateOutlined,
  UploadOutlined
} from "@ant-design/icons";
import { Alert, Button, DatePicker, Form, Input, Select, Upload } from "antd";
import { useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { useToast } from "@/lib/toast";

const ID_TYPES = ["CITIZENSHIP", "PASSPORT", "NATIONAL_ID", "DRIVING_LICENSE"];

const COPY = {
  np: {
    pageTitle: "नेतृत्व KYC",
    eyebrow: "अग्रिम पुष्टिकरण",
    title: "अभियान संयोजक हुन KYC",
    intro:
      "श्रमदान अभियानको संयोजक भूमिका लिनका लागि न्यूनतम पहिचान पुष्टिकरण चाहिन्छ। तपाईंको कागजात गोप्य रहन्छ — केवल प्रशासन र वित्तीय सल्लाहकारले हेर्न पाउनेछन्।",
    idTypeLabel: "पहिचान प्रकार",
    idTypePlaceholder: "छनोट गर्नुहोस्",
    idNumberLabel: "पहिचान नम्बर",
    idNumberPlaceholder: "उदाहरण: १२-३४-६७-XXXXX",
    fullNameLabel: "नागरिकता / पासपोर्ट अनुसारको पूरा नाम",
    fullNamePlaceholder: "उदाहरण: रिता पाण्डे",
    dobLabel: "जन्म मिति",
    dobPlaceholder: "YYYY-MM-DD",
    addressLabel: "स्थायी ठेगाना",
    addressPlaceholder: "नगरपालिका, वडा, टोल",
    docsLabel: "कागजात अपलोड",
    docsHint:
      "नागरिकताको अघिल्तिर र पछिल्तिर वा पासपोर्टको पहिलो पेज। JPG, PNG, वा PDF। १० MB सम्म।",
    docsCta: "फाइल छान्नुहोस्",
    consentLabel: "म पुष्टि गर्छु कि तपाईंले दिएको जानकारी सत्य हो र श्रमदानले KYC सत्यापनका लागि प्रयोग गर्न सक्छ।",
    submitCta: "KYC पेश गर्नुहोस्",
    requiredField: "अनिवार्य",
    successTitle: "KYC पेश भयो!",
    successIntro:
      "धन्यवाद। प्रशासन टोलीले २-३ कार्य दिनभित्र समीक्षा गर्नेछ। निर्णयको सूचना तपाईंलाई पठाइनेछ।",
    backToDashboard: "ड्यासबोर्ड फर्किनुहोस्",
    demoBanner: "डेमो मोड — पेश गरिएको कागजात साँचो रूपमा सुरक्षित गरिँदैन।",
    idTypeOptions: {
      CITIZENSHIP: "नागरिकता",
      PASSPORT: "पासपोर्ट",
      NATIONAL_ID: "राष्ट्रिय परिचयपत्र",
      DRIVING_LICENSE: "ड्राइभिङ लाइसेन्स"
    }
  },
  en: {
    pageTitle: "Leader KYC",
    eyebrow: "Advance verification",
    title: "KYC to become a campaign leader",
    intro:
      "Leading a campaign needs a minimum identity check. Your documents stay private — only the admin team and the financial advisor can see them.",
    idTypeLabel: "ID type",
    idTypePlaceholder: "Choose",
    idNumberLabel: "ID number",
    idNumberPlaceholder: "e.g. 12-34-67-XXXXX",
    fullNameLabel: "Full name as on document",
    fullNamePlaceholder: "e.g. Rita Pandey",
    dobLabel: "Date of birth",
    dobPlaceholder: "YYYY-MM-DD",
    addressLabel: "Permanent address",
    addressPlaceholder: "Municipality, ward, tole",
    docsLabel: "Document upload",
    docsHint:
      "Front + back of citizenship card, or passport first page. JPG / PNG / PDF, up to 10 MB.",
    docsCta: "Choose file",
    consentLabel:
      "I confirm the information above is true and consent to Shramdan using it for KYC verification.",
    submitCta: "Submit KYC",
    requiredField: "Required",
    successTitle: "KYC submitted!",
    successIntro:
      "Thanks. The admin team will review within 2-3 working days. You'll be notified of the decision.",
    backToDashboard: "Back to dashboard",
    demoBanner: "Demo mode — submitted documents are not actually stored.",
    idTypeOptions: {
      CITIZENSHIP: "Citizenship",
      PASSPORT: "Passport",
      NATIONAL_ID: "National ID",
      DRIVING_LICENSE: "Driving licence"
    }
  }
};

export default function AppKycPage() {
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSubmitting(false);
    setSubmitted(true);
    messageApi.success(t.successTitle);
  };

  if (submitted) {
    return (
      <SiteShell pageTitle={t.pageTitle}>
        <section className="app-kyc page-section">
          <div className="app-kyc-success">
            <CheckCircleFilled aria-hidden="true" />
            <h1>{t.successTitle}</h1>
            <p>{t.successIntro}</p>
            <Button type="primary" size="large" href="/app">
              {t.backToDashboard}
            </Button>
          </div>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="app-kyc page-section">
        <header className="app-kyc-hero">
          <span className="eyebrow">
            <SafetyCertificateOutlined aria-hidden="true" /> {t.eyebrow}
          </span>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <Alert
          type="info"
          showIcon
          message={t.demoBanner}
          className="app-kyc-demo-banner"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={submitting}
          className="app-kyc-form"
        >
          <Form.Item
            label={t.idTypeLabel}
            name="idType"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Select
              placeholder={t.idTypePlaceholder}
              options={ID_TYPES.map((value) => ({
                value,
                label: t.idTypeOptions[value] || value
              }))}
            />
          </Form.Item>
          <Form.Item
            label={t.idNumberLabel}
            name="idNumber"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Input placeholder={t.idNumberPlaceholder} maxLength={50} prefix={<IdcardOutlined />} />
          </Form.Item>
          <Form.Item
            label={t.fullNameLabel}
            name="fullName"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Input placeholder={t.fullNamePlaceholder} maxLength={120} />
          </Form.Item>
          <Form.Item
            label={t.dobLabel}
            name="dob"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <DatePicker style={{ width: "100%" }} placeholder={t.dobPlaceholder} />
          </Form.Item>
          <Form.Item
            label={t.addressLabel}
            name="address"
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Input.TextArea
              rows={2}
              placeholder={t.addressPlaceholder}
              maxLength={240}
            />
          </Form.Item>
          <Form.Item
            label={t.docsLabel}
            name="docs"
            help={t.docsHint}
            rules={[{ required: true, message: t.requiredField }]}
          >
            <Upload beforeUpload={() => false} maxCount={2} accept=".jpg,.jpeg,.png,.pdf">
              <Button icon={<UploadOutlined />}>{t.docsCta}</Button>
            </Upload>
          </Form.Item>
          <Form.Item
            name="consent"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error(t.requiredField))
              }
            ]}
          >
            <label className="app-kyc-consent">
              <input type="checkbox" />
              <span>{t.consentLabel}</span>
            </label>
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} size="large" block>
            {t.submitCta}
          </Button>
        </Form>
      </section>
    </SiteShell>
  );
}
