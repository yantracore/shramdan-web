"use client";

import { Input, Modal, Select } from "antd";
import { useState } from "react";

// Reasons match the backend enum for POST /comments/{id}/report.
const COPY = {
  np: {
    title: "टिप्पणी रिपोर्ट गर्नुहोस्",
    reasonLabel: "कारण",
    notePlaceholder: "थप जानकारी (वैकल्पिक)…",
    submit: "रिपोर्ट पठाउने",
    cancel: "रद्द",
    reasons: {
      SPAM: "स्प्याम वा विज्ञापन",
      ABUSE: "दुर्व्यवहार",
      HARASSMENT: "उत्पीडन",
      MISINFORMATION: "गलत सूचना",
      INAPPROPRIATE: "अनुपयुक्त सामग्री",
      OTHER: "अरू कारण"
    },
    chooseReason: "एउटा कारण छान्नुहोस्…"
  },
  en: {
    title: "Report this comment",
    reasonLabel: "Reason",
    notePlaceholder: "Anything else we should know (optional)…",
    submit: "Submit Report",
    cancel: "Cancel",
    reasons: {
      SPAM: "Spam or promotion",
      ABUSE: "Abuse",
      HARASSMENT: "Harassment",
      MISINFORMATION: "Misinformation",
      INAPPROPRIATE: "Inappropriate",
      OTHER: "Other"
    },
    chooseReason: "Pick a reason…"
  }
};

export function CommentFlagModal({
  open,
  onCancel,
  onSubmit,
  language = "np"
}) {
  const t = COPY[language] || COPY.np;
  const [reason, setReason] = useState(undefined);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleOk = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await onSubmit?.({ reason, note });
      // Reset on close — parent toggles `open=false`, but state would
      // persist across opens otherwise.
      setReason(undefined);
      setNote("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={t.title}
      onCancel={onCancel}
      onOk={handleOk}
      okText={t.submit}
      cancelText={t.cancel}
      okButtonProps={{ disabled: !reason, loading: submitting }}
      destroyOnHidden
    >
      <div className="comment-flag-modal-body">
        <label className="comment-flag-modal-label">
          {t.reasonLabel}
          <Select
            value={reason}
            onChange={setReason}
            placeholder={t.chooseReason}
            options={Object.entries(t.reasons).map(([value, label]) => ({
              value,
              label
            }))}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>
        <Input.TextArea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.notePlaceholder}
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={400}
          showCount
          style={{ marginTop: 12 }}
        />
      </div>
    </Modal>
  );
}
