"use client";

// EventJoinButton — button + modal shell for joining an event from any preview
// surface (EventPreviewPane, future card surfaces). Drives useEventJoin so the
// same lazy-load → ParticipantsPanel pattern is reused without duplicating API
// logic. No "I'm interested" header — events have no INTERESTED concept.

import { Modal } from "antd";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import { useEventJoin } from "@/lib/useEventJoin";

// Button copy — parallel to JOIN_COPY in useEventJoin / events page.
const BUTTON_COPY = {
  np: {
    join: "सामेल हुने",
    joinedAs: (role) => `${ROLE_LABELS_NP[role] || role} — जोडिनुभयो`,
    modalTitle: "अभियानमा सामेल हुने"
  },
  en: {
    join: "Join",
    joinedAs: (role) => `Joined as ${ROLE_LABELS_EN[role] || role}`,
    modalTitle: "Join this campaign"
  }
};

// Role display labels — mirrors ParticipantsPanel's own COPY.roles so we never
// invent new strings.
const ROLE_LABELS_NP = {
  WORKER: "सफाइकर्मी",
  PHOTOGRAPHER: "फोटोग्राफर",
  LIVESTREAMER: "लाइभस्ट्रिमर",
  MEDIC: "स्वास्थ्यकर्मी",
  SAFETY_LEAD: "सुरक्षा प्रमुख",
  COORDINATOR: "संयोजक",
  LOGISTICS: "लजिस्टिक्स"
};
const ROLE_LABELS_EN = {
  WORKER: "Cleaner",
  PHOTOGRAPHER: "Photographer",
  LIVESTREAMER: "Livestreamer",
  MEDIC: "Medic",
  SAFETY_LEAD: "Safety Lead",
  COORDINATOR: "Coordinator",
  LOGISTICS: "Logistics"
};

export function EventJoinButton({ eventId, seed, language = "np", size }) {
  const lang = language === "en" ? "en" : "np";
  const bc = BUTTON_COPY[lang];

  const join = useEventJoin(eventId, { seed, language: lang });

  // Hidden when the event is completely non-joinable AND viewer is not in.
  // (joinable = false means COMPLETED/CANCELLED/PAUSED with no active viewer role.)
  if (!join.joinable && !join.viewerRole) return null;

  const label = join.viewerRole ? bc.joinedAs(join.viewerRole) : bc.join;

  // Button style: primary when unjoined, default when already in.
  const btnType = join.viewerRole ? "default" : "primary";

  return (
    <>
      <button
        type="button"
        className={`event-join-btn event-join-btn--${btnType}${join.loading ? " event-join-btn--loading" : ""}`}
        style={{
          cursor: "pointer",
          padding: size === "small" ? "4px 12px" : "6px 16px",
          borderRadius: 8,
          border: join.viewerRole ? "1.5px solid #4caf50" : "none",
          background: join.viewerRole ? "transparent" : "#4caf50",
          color: join.viewerRole ? "#4caf50" : "#fff",
          fontWeight: 600,
          fontSize: size === "small" ? 13 : 14,
          lineHeight: "1.5",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          minWidth: 80,
          justifyContent: "center",
          whiteSpace: "nowrap"
        }}
        onClick={join.openModal}
        disabled={join.loading}
        aria-label={label}
      >
        {join.loading ? (lang === "np" ? "लोड…" : "Loading…") : label}
      </button>

      <Modal
        open={join.open}
        onCancel={join.closeModal}
        footer={null}
        title={bc.modalTitle}
        destroyOnHidden
        centered
        width={480}
        styles={{ body: { padding: "8px 0 4px" } }}
      >
        <ParticipantsPanel
          {...join.panelProps}
          embedded
          language={lang}
        />
      </Modal>
    </>
  );
}
