"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ContributorForm } from "@/components/ContributorForm";
import { ROLE_LANE_VALUES } from "@/components/RoleLaneSelector";
import { isHoneypotTriggered } from "@/components/Honeypot";
import { SiteShell } from "@/components/SiteShell";
import { SubmissionSuccessCard } from "@/components/SubmissionSuccessCard";
import { usePreferences } from "@/app/providers";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

// Legacy ?role= URL params (e.g. /join?role=FRONTEND_DEVELOPER) used to
// pre-select a backend enum value on the old single-page form. After the
// 2026-06-05 multi-step refactor, the form ships three lane buckets. We map
// legacy backend enums to their corresponding lane so deep links from the
// homepage "We need you" rail keep landing on a useful pre-selection.
const LEGACY_ROLE_TO_LANE = {
  FRONTEND_DEVELOPER: "DEVELOPMENT",
  BACKEND_DEVELOPER: "DEVELOPMENT",
  QA_ENGINEER: "DEVELOPMENT",
  DEVOPS_ENGINEER: "DEVELOPMENT",
  UI_UX_DESIGNER: "DEVELOPMENT",
  GRAPHICS_DESIGNER: "DEVELOPMENT",
  CONTENT_WRITER: "DEVELOPMENT",
  TRANSLATOR: "DEVELOPMENT",
  PHOTOGRAPHER: "EVENT_PARTICIPATION",
  LIVESTREAMER: "EVENT_PARTICIPATION",
  VOLUNTEER: "EVENT_PARTICIPATION",
  COMMUNITY_MANAGER: "COMPANY_MANAGEMENT",
  LEGAL: "COMPANY_MANAGEMENT",
  FINANCE: "COMPANY_MANAGEMENT",
  DONOR: "COMPANY_MANAGEMENT"
};

function resolveInitialLane(rawRole) {
  if (!rawRole) return undefined;
  if (ROLE_LANE_VALUES.includes(rawRole)) return rawRole;
  return LEGACY_ROLE_TO_LANE[rawRole];
}

function JoinPageContent() {
  const { language } = usePreferences();
  const searchParams = useSearchParams();
  const t = copy[language];
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const initialLane = resolveInitialLane(searchParams.get("role"));

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
            intro={
              language === "np"
                ? "तपाईं कसरी योगदान गर्न चाहनुहुन्छ बताउनुहोस्। हामी तपाईंको भूमिका, उपलब्ध समय र सीप अनुसार उपयुक्त कामसँग जोड्नेछौँ।"
                : "Tell us how you want to contribute. We will match your role, availability, and skills with the right work."
            }
            initialRole={initialLane}
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
