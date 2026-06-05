"use client";

import Image from "next/image";
import { useState } from "react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { isHoneypotTriggered } from "@/components/Honeypot";
import { SiteShell } from "@/components/SiteShell";
import { SubmissionSuccessCard } from "@/components/SubmissionSuccessCard";
import { usePreferences } from "@/app/providers";
import { postJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";

const feedbackVisualCopy = {
  np: {
    alt: "श्रमदान टोलीले प्रयोगकर्ताको सुझाव ध्यानपूर्वक समीक्षा गर्दै",
    eyebrow: "किन प्रतिक्रिया पठाउने?",
    title: "तपाईंको सुझावले अर्को सुधार देखाउँछ",
    body:
      "Feedback आएपछि हामी त्यसलाई पढ्छौँ, प्रकार अनुसार छुट्याउँछौँ, अनि bug, content, UX वा policy सुधारका काममा बदल्छौँ।",
    points: [
      "कुन कुरा confusing छ भनेर सिधै भन्न सक्नुहुन्छ।",
      "Bug, सुझाव, प्रश्न वा general note सबै उपयोगी हुन्छ।",
      "Screenshot भए समस्या छिटो बुझ्न सजिलो हुन्छ।"
    ],
    stats: [
      { value: "४", label: "feedback type" },
      { value: "१", label: "स्पष्ट सुधार बाटो" }
    ]
  },
  en: {
    alt: "Shramdan team members carefully reviewing user feedback",
    eyebrow: "Why send feedback?",
    title: "Your note shows us what to improve next",
    body:
      "When feedback arrives, we read it, sort it by type, and turn it into bug fixes, content updates, UX improvements, or policy clarity.",
    points: [
      "Tell us directly what feels confusing.",
      "Bugs, suggestions, questions, and general notes all help.",
      "A screenshot helps us understand the issue faster."
    ],
    stats: [
      { value: "4", label: "Feedback types" },
      { value: "1", label: "Clearer path" }
    ]
  }
};

export default function FeedbackPage() {
  const { language } = usePreferences();
  const t = copy[language];
  const visual = feedbackVisualCopy[language] ?? feedbackVisualCopy.np;
  const messageApi = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (values) => {
    if (isHoneypotTriggered(values)) {
      setSubmitted(true);
      return true;
    }

    const { screenshot, ...rest } = values;

    const payload = {
      ...rest,
      ...(screenshot?.url ? { screenshot: screenshot.url } : {})
    };

    setSubmitting(true);

    try {
      await postJson("/feedback", payload);
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
      <section className="page-section form-section form-section-wide">
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
          <div className="form-page-layout">
            <aside className="form-visual-panel" aria-labelledby="feedback-visual-title">
              <div className="form-visual-media">
                <Image
                  alt={visual.alt}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 520px"
                  src="/images/forms/feedback-notes.webp"
                />
              </div>
              <div className="form-visual-copy">
                <span className="eyebrow">{visual.eyebrow}</span>
                <h2 id="feedback-visual-title">{visual.title}</h2>
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
            </aside>
            <FeedbackForm
              content={t}
              eyebrow={t.feedback.eyebrow}
              title={t.feedback.title}
              intro={
                language === "np"
                  ? "समस्या, सुझाव वा अलमल यहाँ लेख्नुहोस्। तपाईंको note ले Shramdan लाई प्रयोग गर्न सजिलो र भरोसायोग्य बनाउँछ।"
                  : "Share the problem, suggestion, or confusion here. Your note helps make Shramdan easier and more trustworthy to use."
              }
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
        )}
      </section>
    </SiteShell>
  );
}
