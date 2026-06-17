"use client";

// Reusable moderation report dialog — used for both issues and comments.
// Renders a trigger that opens a modal with a reason Select + optional details
// box, then calls the `onReport({ reason, details })` prop (which performs the
// authenticated POST). 409 means the viewer already reported the target; an
// AUTH_REQUIRED / 401 error nudges the viewer to log in.

import { FlagOutlined } from "@ant-design/icons";
import { Form, Input, Modal, Select } from "antd";
import { useState } from "react";
import { useToast } from "@/lib/toast";

const REASONS = [
  "SPAM",
  "ABUSE",
  "HARASSMENT",
  "MISINFORMATION",
  "INAPPROPRIATE",
  "OTHER"
];

const COPY = {
  np: {
    report: "रिपोर्ट",
    title: { issue: "समस्या रिपोर्ट गर्नुहोस्", comment: "टिप्पणी रिपोर्ट गर्नुहोस्" },
    intro: "यो सामग्री किन आपत्तिजनक हो छान्नुहोस्। हाम्रो टोलीले समीक्षा गर्नेछ।",
    reasonLabel: "कारण",
    reasonPlaceholder: "कारण छान्नुहोस्",
    reasonRequired: "कृपया कारण छान्नुहोस्।",
    detailsLabel: "थप विवरण (वैकल्पिक)",
    detailsPlaceholder: "केही थप भन्न चाहनुहुन्छ भने लेख्नुहोस्…",
    submit: "रिपोर्ट पठाउनुहोस्",
    cancel: "रद्द गर्नुहोस्",
    success: "रिपोर्ट पठाइयो। धन्यवाद।",
    already: "तपाईंले पहिले नै यो रिपोर्ट गरिसक्नुभएको छ।",
    loginRequired: "रिपोर्ट गर्न लगइन गर्नुहोस्।",
    error: "रिपोर्ट पठाउन सकिएन। फेरि प्रयास गर्नुहोस्।",
    reasons: {
      SPAM: "स्प्याम",
      ABUSE: "दुर्व्यवहार",
      HARASSMENT: "उत्पीडन",
      MISINFORMATION: "गलत सूचना",
      INAPPROPRIATE: "अनुपयुक्त सामग्री",
      OTHER: "अन्य"
    }
  },
  en: {
    report: "Report",
    title: { issue: "Report this issue", comment: "Report this comment" },
    intro: "Tell us why this content is objectionable. Our team will review it.",
    reasonLabel: "Reason",
    reasonPlaceholder: "Choose a reason",
    reasonRequired: "Please choose a reason.",
    detailsLabel: "More details (optional)",
    detailsPlaceholder: "Add anything else we should know…",
    submit: "Submit Report",
    cancel: "Cancel",
    success: "Report submitted. Thank you.",
    already: "You've already reported this.",
    loginRequired: "Log in to report.",
    error: "Could not submit the report. Please try again.",
    reasons: {
      SPAM: "Spam",
      ABUSE: "Abuse",
      HARASSMENT: "Harassment",
      MISINFORMATION: "Misinformation",
      INAPPROPRIATE: "Inappropriate",
      OTHER: "Other"
    }
  }
};

export function ReportDialog({ language = "np", targetKind = "issue", onReport, trigger }) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reasonOptions = REASONS.map((r) => ({ value: r, label: t.reasons[r] }));

  const close = () => {
    setOpen(false);
    form.resetFields();
  };

  const handleOk = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSubmitting(true);
    try {
      await onReport({
        reason: values.reason,
        details: values.details?.trim() || undefined
      });
      messageApi.success(t.success);
      close();
    } catch (error) {
      if (error?.status === 409) {
        messageApi.info(t.already);
        close();
      } else if (error?.errorCode === "AUTH_REQUIRED" || error?.status === 401) {
        messageApi.warning(t.loginRequired);
      } else {
        messageApi.error(error?.message || t.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <button type="button" className="report-trigger" onClick={() => setOpen(true)}>
          <FlagOutlined /> {t.report}
        </button>
      )}
      <Modal
        title={t.title[targetKind] || t.title.issue}
        open={open}
        onCancel={close}
        onOk={handleOk}
        okText={t.submit}
        cancelText={t.cancel}
        confirmLoading={submitting}
        okButtonProps={{ danger: true }}
        destroyOnClose
      >
        <p className="report-dialog-intro">{t.intro}</p>
        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label={t.reasonLabel}
            rules={[{ required: true, message: t.reasonRequired }]}
          >
            <Select options={reasonOptions} placeholder={t.reasonPlaceholder} />
          </Form.Item>
          <Form.Item name="details" label={t.detailsLabel}>
            <Input.TextArea
              rows={3}
              maxLength={1000}
              showCount
              placeholder={t.detailsPlaceholder}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
