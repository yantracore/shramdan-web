"use client";

import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const t = copy[language];
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const selectedRole = searchParams.get("role");
  const allowedRoles = new Set(t.options.applicationRoles.map((role) => role.value));
  const initialRole = allowedRoles.has(selectedRole) ? selectedRole : undefined;

  // When the user lands here via /join?role=<X>, surface a small context
  // banner above the form so they see what they're signing up for before
  // they fill in their details.
  const matchedRole = initialRole
    ? t.volunteerInvite.roles.find((role) => role.value === initialRole)
    : null;
  const matchedEventId = searchParams.get("event");

  const handleSubmit = async (values) => {
    if (isHoneypotTriggered(values)) {
      setSubmitted(true);
      return true;
    }

    const { consent: _consent, website: _website, resume, ...rest } = values;

    const payload = {
      ...rest,
      ...(resume?.id ? { resumeId: resume.id } : {})
    };

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
      <section className="page-section form-section">
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
          <>
            {matchedRole ? (
              <aside
                className="join-role-context"
                aria-label={language === "np" ? "छानिएको भूमिका" : "Selected role"}
              >
                <span className="join-role-context-eyebrow">
                  {language === "np" ? "तपाईंले छान्नुभएको भूमिका" : "You're joining as"}
                </span>
                <h2>{matchedRole.title}</h2>
                <p>{matchedRole.description}</p>
                {matchedEventId ? (
                  <p className="join-role-context-event">
                    {language === "np"
                      ? `अभियानका लागि: ${matchedEventId}`
                      : `For event: ${matchedEventId}`}
                  </p>
                ) : null}
              </aside>
            ) : null}

            <ContributorForm
              content={t}
              eyebrow={t.join.eyebrow}
              title={t.join.title}
              intro={t.join.intro}
              initialRole={initialRole}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </>
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
