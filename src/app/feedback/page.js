"use client";

import { message } from "antd";
import { useState } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";

export default function FeedbackPage() {
  const { language } = usePreferences();
  const t = copy[language];
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    setSubmitting(true);

    try {
      await postJson("/feedback", values);
      messageApi.success(t.messages.feedback);
      return true;
    } catch (error) {
      messageApi.error(error.message || t.messages.submitError);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteShell>
      {contextHolder}
      <section className="page-section form-section">
        <div className="section-heading">
          <span className="eyebrow">{t.feedback.eyebrow}</span>
          <h1>{t.feedback.title}</h1>
          <p>{t.feedback.intro}</p>
        </div>
        <FeedbackForm content={t} onSubmit={handleSubmit} submitting={submitting} />
      </section>
    </SiteShell>
  );
}
