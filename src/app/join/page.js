"use client";

import { Suspense, useState } from "react";
import { ContributorForm } from "@/components/ContributorForm";
import { isHoneypotTriggered } from "@/components/Honeypot";
import { SiteShell } from "@/components/SiteShell";
import { SubmissionSuccessCard } from "@/components/SubmissionSuccessCard";
import { usePreferences } from "@/app/providers";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

function JoinPageContent() {
  const { language } = usePreferences();
  const t = copy[language];
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (payload) => {
    if (isHoneypotTriggered(payload)) {
      setSubmitted(true);
      return true;
    }

    setSubmitting(true);

    try {
      await postJson("/applications", payload);
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
    typeof window !== "undefined" ? `${window.location.origin}/join` : "https://shramdan.org/join";

  return (
    <SiteShell pageTitle={t.pageTitles.join}>
      <section className="page-section multi-step-section">
        {submitted ? (
          <SubmissionSuccessCard
            language={language}
            title={
              language === "np"
                ? "तपाईंको योगदान आवेदन प्राप्त भयो।"
                : "Your contribution application is in."
            }
            body={
              language === "np"
                ? "हाम्रो टोलीले छिट्टै इमेल वा फोनमार्फत सम्पर्क गर्नेछ।"
                : "Our team will reach out by email or phone shortly."
            }
            shareUrl={shareUrl}
            shareTitle={language === "np" ? "श्रमदानमा जोडिनुहोस्" : "Join Shramdan"}
            shareText={
              language === "np"
                ? "श्रमदान — सामूहिक श्रमको मञ्च। तपाईं पनि जोडिनुहोस्।"
                : "Shramdan — a platform for collective community work. Join us."
            }
            onReset={() => setSubmitted(false)}
          />
        ) : (
          <ContributorForm
            content={t}
            language={language}
            eyebrow={t.join.eyebrow}
            intro={t.join.intro}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        )}
      </section>
    </SiteShell>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinPageContent />
    </Suspense>
  );
}
