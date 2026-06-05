"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense, useState } from "react";
import { ContributorForm } from "@/components/ContributorForm";
import { isHoneypotTriggered } from "@/components/Honeypot";
import { SiteShell } from "@/components/SiteShell";
import { SubmissionSuccessCard } from "@/components/SubmissionSuccessCard";
import { usePreferences } from "@/app/providers";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

const joinVisualCopy = {
  np: {
    alt: "श्रमदानका योगदानकर्ताहरू सामुदायिक कामको योजना बनाउँदै",
    eyebrow: "किन जोडिने?",
    title: "तपाईंको सीपले समुदायको काम अघि बढाउँछ",
    body:
      "Shramdan मा developer, designer, writer, organiser वा volunteer का रूपमा जोडिँदा तपाईंको योगदान वास्तविक अभियान, रिपोर्ट र सामुदायिक निर्णयमा प्रयोग हुन्छ।",
    points: [
      "आफ्नो समय र सीप अनुसार भूमिका छान्नुहोस्।",
      "हामीले उपयुक्त काम र अभियानसँग जोड्न सम्पर्क गर्छौँ।",
      "सानो योगदानले पनि सार्वजनिक समस्या समाधानतिर धकेल्छ।"
    ],
    stats: [
      { value: "१२+", label: "योगदान भूमिका" },
      { value: "१", label: "साझा उद्देश्य" }
    ]
  },
  en: {
    alt: "Shramdan contributors planning community work together",
    eyebrow: "Why join?",
    title: "Your skills can move community work forward",
    body:
      "Join as a developer, designer, writer, organiser, or volunteer. Your contribution can support real campaigns, reports, and local decisions.",
    points: [
      "Choose a role that matches your time and skills.",
      "We connect you with relevant work or campaigns.",
      "Even a small contribution helps local problems move toward action."
    ],
    stats: [
      { value: "12+", label: "Contributor roles" },
      { value: "1", label: "Shared purpose" }
    ]
  }
};

function JoinPageContent() {
  const { language } = usePreferences();
  const searchParams = useSearchParams();
  const t = copy[language];
  const visual = joinVisualCopy[language] ?? joinVisualCopy.np;
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
      <section className="page-section form-section form-section-wide">
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
          <div className="form-page-layout">
            <aside className="form-visual-panel" aria-labelledby="join-visual-title">
              <div className="form-visual-media">
                <Image
                  alt={visual.alt}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 520px"
                  src="/images/forms/join-contributors.webp"
                />
              </div>
              <div className="form-visual-copy">
                <span className="eyebrow">{visual.eyebrow}</span>
                <h2 id="join-visual-title">{visual.title}</h2>
                <p>{visual.body}</p>
              </div>
              <div className="form-visual-stats" aria-hidden="true">
                {visual.stats.map((item) => (
                  <span className="form-visual-stat" key={`${item.value}-${item.label}`}>
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </span>
                ))}
              </div>
              <ul className="form-visual-list">
                {visual.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              {matchedRole ? (
                <div
                  className="join-role-context"
                  aria-label={language === "np" ? "छानिएको भूमिका" : "Selected role"}
                >
                  <span className="join-role-context-eyebrow">
                    {language === "np" ? "तपाईंले छान्नुभएको भूमिका" : "You're joining as"}
                  </span>
                  <h3>{matchedRole.title}</h3>
                  <p>{matchedRole.description}</p>
                  {matchedEventId ? (
                    <p className="join-role-context-event">
                      {language === "np" ? `अभियानका लागि: ${matchedEventId}` : `For event: ${matchedEventId}`}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </aside>
            <ContributorForm
              content={t}
              eyebrow={t.join.eyebrow}
              title={t.join.title}
              intro={
                language === "np"
                  ? "तपाईं कसरी योगदान गर्न चाहनुहुन्छ बताउनुहोस्। हामी तपाईंको भूमिका, उपलब्ध समय र सीप अनुसार उपयुक्त कामसँग जोड्नेछौँ।"
                  : "Tell us how you want to contribute. We will match your role, availability, and skills with the right work."
              }
              initialRole={initialRole}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
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
