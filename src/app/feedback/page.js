"use client";

import { useState } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { isHoneypotTriggered } from "@/components/Honeypot";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

export default function FeedbackPage() {
  const { language } = usePreferences();
  const t = copy[language];
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values) => {
    if (isHoneypotTriggered(values)) {
      messageApi.success(t.messages.feedback);
      return true;
    }

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
    <SiteShell pageTitle={t.pageTitles.feedback}>
      <section className="page-section form-section">
        <FeedbackForm
          content={t}
          eyebrow={t.feedback.eyebrow}
          title={t.feedback.title}
          intro={t.feedback.intro}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </section>
    </SiteShell>
  );
}
