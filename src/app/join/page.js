"use client";

import { Suspense, useState } from "react";
import { ContributorForm } from "@/components/ContributorForm";
import { isHoneypotTriggered } from "@/components/Honeypot";
import { SiteShell } from "@/components/SiteShell";
import { SubmissionSuccessCard } from "@/components/SubmissionSuccessCard";
import { usePreferences } from "@/app/providers";
import { requestApplicationOtp, submitApplication } from "@/lib/apiClient";
import { setAuthSession } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

function JoinPageContent() {
  const { language } = usePreferences();
  const t = copy[language];
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Emails the verification code as the user leaves the motivation step.
  // Returns false (and surfaces the backend message) so the form keeps the
  // user on the motivation step when the email already has an account or the
  // resend cooldown is active.
  const handleRequestOtp = async (email) => {
    try {
      await requestApplicationOtp(String(email || "").trim());
      return true;
    } catch (error) {
      messageApi.error(error.message || t.messages.submitError);
      return false;
    }
  };

  const handleSubmit = async (payload) => {
    if (isHoneypotTriggered(payload)) {
      setSubmitted(true);
      return true;
    }

    setSubmitting(true);

    try {
      const response = await submitApplication(payload);
      const data = response?.data ?? {};
      // The 201 creates a verified account and signs the applicant in — store
      // the returned session so they land logged in.
      if (data.accessToken && data.user) {
        setAuthSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          user: data.user
        });
      }
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
      <section className="page-section multi-step-section join-multi-step-section">
        {submitted ? (
          <SubmissionSuccessCard
            language={language}
            title={
              language === "np"
                ? "तपाईं श्रमदानमा जोडिनुभयो!"
                : "You're in — welcome to Shramdan!"
            }
            body={
              language === "np"
                ? "तपाईंको खाता बन्यो र आवेदन प्राप्त भयो। अब लग-इन हुनुहुन्छ — समस्या रिपोर्ट गर्न र अभियानमा सामेल हुन तयार।"
                : "Your account is created and your application is in. You're signed in now — ready to report issues and join campaigns."
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
            onRequestOtp={handleRequestOtp}
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
