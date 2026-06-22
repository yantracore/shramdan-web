"use client";

// SupportRolesModal — the "how do you want to support?" entry point for an
// unsupported issue. Instead of the old radio-then-reveal flow, it shows the
// SAME ParticipantsPanel the issue body uses, so every role (with its live
// count + description), the conversion progress, and the leadership slot are
// visible by default. Picking a role / offering to lead here votes exactly as
// it would from the body. A prominent "I'm interested" action sits on top for
// people who just want to register support without taking a role.
//
// The page owns all the data + handlers and passes them through `panelProps`
// (the very object it spreads into the body panel) plus `onInterested`. The
// page closes the modal when the vote lands (it watches its own myVote), so
// this component stays purely presentational.

import { useState } from "react";
import { HeartOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";

const COPY = {
  np: {
    title: "कसरी समर्थन गर्नुहुन्छ?",
    intro: "तपाईं कसरी सहयोग गर्न चाहनुहुन्छ छान्नुहोस् — पछि परिवर्तन गर्न सकिन्छ।",
    interested: "मलाई रुचि छ",
    interestedHint: "अहिले भूमिका नछानी, समर्थन मात्र दर्ता गर्नुहोस्",
    interestedSaving: "दर्ता हुँदै…",
    orJoin: "वा कुनै भूमिकामा जोडिनुहोस्"
  },
  en: {
    title: "How do you want to support?",
    intro: "Choose how you'd like to help — you can change it later.",
    interested: "I'm interested",
    interestedHint: "Just register your support, no role yet",
    interestedSaving: "Registering…",
    orJoin: "Or join in a role"
  }
};

export function SupportRolesModal({ open, onClose, language = "np", onInterested, panelProps }) {
  const t = COPY[language] || COPY.np;
  const [interestedPending, setInterestedPending] = useState(false);

  // Close the modal once a commitment lands — wrap the join/lead handlers so a
  // *successful* vote dismisses it (a thrown error keeps it open, since the
  // page handler re-throws only on real failures).
  const closeAfter = (fn) =>
    fn
      ? async (...args) => {
          await fn(...args);
          onClose?.();
        }
      : fn;

  const wrappedPanelProps = {
    ...panelProps,
    onJoin: closeAfter(panelProps?.onJoin),
    onLead: closeAfter(panelProps?.onLead)
  };

  const handleInterested = async () => {
    if (interestedPending || !onInterested) return;
    setInterestedPending(true);
    try {
      await onInterested();
      onClose?.();
    } catch {
      /* page surfaces its own error toast; the modal stays open */
    } finally {
      setInterestedPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      title={t.title}
      destroyOnHidden
      className="support-roles-modal"
    >
      <p className="support-modal-intro">{t.intro}</p>

      <button
        type="button"
        className="support-modal-interested"
        onClick={handleInterested}
        disabled={interestedPending}
      >
        <span className="support-modal-interested-icon">
          <HeartOutlined aria-hidden="true" />
        </span>
        <span className="support-modal-interested-text">
          <strong>{interestedPending ? t.interestedSaving : t.interested}</strong>
          <span>{t.interestedHint}</span>
        </span>
      </button>

      <div className="support-modal-divider">
        <span>{t.orJoin}</span>
      </div>

      <ParticipantsPanel {...wrappedPanelProps} embedded language={language} />
    </Modal>
  );
}
