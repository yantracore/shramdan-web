"use client";

import { useState } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { isHoneypotTriggered } from "@/components/Honeypot";
import { SiteShell } from "@/components/SiteShell";
import { SubmissionSuccessCard } from "@/components/SubmissionSuccessCard";
import { usePreferences } from "@/app/providers";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

export default function FeedbackPage() {
  const { language } = usePreferences();
  const t = copy[language];
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (values) => {
    if (isHoneypotTriggered(values)) {
      setSubmitted(true);
      return true;
    }

    setSubmitting(true);

    try {
      await postJson("/feedback", values);
      setSubmitted(true);
      return true;
    } catch (error) {
      messageApi.error(error.message || t.messages.submitError);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/` : "https://shramdan.org/";

  return (
    <SiteShell pageTitle={t.pageTitles.feedback}>
      <section className="page-section form-section">
        {submitted ? (
          <SubmissionSuccessCard
            language={language}
            title={
              language === "np"
                ? "तपाईंको प्रतिक्रिया प्राप्त भयो।"
                : "Your feedback is in."
            }
            body={
              language === "np"
                ? "हरेक सुझाव श्रमदानको बाटो स्पष्ट बनाउँछ — धन्यवाद।"
                : "Every note shapes the road ahead — thank you."
            }
            shareUrl={shareUrl}
            shareTitle={language === "np" ? "श्रमदान" : "Shramdan"}
            shareText={
              language === "np"
                ? "श्रमदान — सामूहिक श्रमको मञ्च। हेर्नुहोस्, सिक्नुहोस्, जोडिनुहोस्।"
                : "Shramdan — a platform for collective community work. Take a look."
            }
            onReset={() => setSubmitted(false)}
          />
        ) : (
          <FeedbackForm
            content={t}
            eyebrow={t.feedback.eyebrow}
            title={t.feedback.title}
            intro={t.feedback.intro}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </section>
    </SiteShell>
  );
}
