"use client";

// Glass modal composer for opening a new discussion topic / feature proposal.
//
// Extracted from the /discussions page in the 2026-06-18 makeover so the
// composer is a self-contained, reusable unit: it owns its own field state,
// resets each time it opens, traps Escape, closes on backdrop click, and now
// lets the author pick a category (the left-rail taxonomy). `onSubmit`
// receives the full payload and returns a promise; the modal drives its own
// loading + disabled states.

import { useEffect, useState } from "react";
import { Button } from "antd";
import { DISCUSSION_CATEGORIES } from "./discussionFormat";

// Real categories only — drop the "all" pseudo-entry.
const SELECTABLE = DISCUSSION_CATEGORIES.filter((c) => c.key !== "all");

export function NewTopicModal({
  open,
  kind = "GENERAL",
  defaultCategory = "COMMUNITY",
  labels,
  language = "np",
  onClose,
  onSubmit
}) {
  const t = labels || {};
  const np = language === "np";
  const cats = t.categories || {};
  const isProposal = kind === "FEATURE_PROPOSAL";
  const ctaLabel = isProposal ? t.newProposal : t.newTopic;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset the form each time the modal opens.
  useEffect(() => {
    if (open) {
      setTitle("");
      setBody("");
      setCategory(defaultCategory);
      setAnonymous(false);
      setSubmitting(false);
    }
  }, [open, defaultCategory]);

  // Escape-to-close.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = title.trim() && body.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        kind,
        category,
        title: title.trim(),
        body: body.trim(),
        anonymous
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="discussions-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="discussions-modal" role="dialog" aria-modal="true" aria-label={ctaLabel}>
        <div className="discussions-modal-head">
          <h2>{ctaLabel}</h2>
          <p>
            {isProposal
              ? np
                ? "श्रमदान एपमा के थपियोस् भन्ने सुझाव — समर्थन पुगे रोडम्यापमा जान्छ।"
                : "Suggest what Shramdan should build — enough support sends it to the roadmap."
              : np
                ? "समुदायसँग कुनै विषय, सुझाव वा प्रश्न साझा गर्नुहोस्।"
                : "Share a topic, suggestion, or question with the community."}
          </p>
        </div>

        <div className="discussions-modal-field">
          <label htmlFor="new-topic-title">{np ? "शीर्षक" : "Title"}</label>
          <input
            id="new-topic-title"
            type="text"
            className="discussions-modal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder={np ? "छोटो, स्पष्ट शीर्षक" : "A short, clear title"}
            autoFocus
            required
          />
        </div>

        <div className="discussions-modal-field">
          <label htmlFor="new-topic-category">{t.categoryLabel || (np ? "विषय" : "Topic")}</label>
          <div className="discussions-modal-chips" role="radiogroup" aria-label={t.categoryLabel}>
            {SELECTABLE.map((cat) => {
              const selected = category === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`discussions-modal-chip${selected ? " is-selected" : ""}`}
                  style={{ "--cat-accent": cat.accent }}
                  onClick={() => setCategory(cat.key)}
                >
                  {cats[cat.key] || cat.key}
                </button>
              );
            })}
          </div>
        </div>

        <div className="discussions-modal-field">
          <label htmlFor="new-topic-body">{np ? "विवरण" : "Details"}</label>
          <textarea
            id="new-topic-body"
            className="discussions-modal-textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder={np ? "तपाईंको विचार विस्तारमा लेख्नुहोस्…" : "Explain your idea in a little detail…"}
            required
          />
        </div>

        <label className="discussions-anon-label">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          <span>{np ? "अज्ञात रूपमा पोस्ट गर्नुहोस्" : "Post anonymously"}</span>
        </label>

        <div className="discussions-modal-actions">
          <Button onClick={onClose}>{np ? "रद्द गर्नुहोस्" : "Cancel"}</Button>
          <Button type="primary" loading={submitting} disabled={!canSubmit} onClick={handleSubmit}>
            {np ? "पठाउनुहोस्" : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NewTopicModal;
