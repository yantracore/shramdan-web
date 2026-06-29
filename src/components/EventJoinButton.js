"use client";

// EventJoinButton — button + modal shell for joining an event from any preview
// surface (EventPreviewPane, future card surfaces). Drives useEventJoin so the
// same lazy-load → ParticipantsPanel pattern is reused without duplicating API
// logic. No "I'm interested" header — events have no INTERESTED concept.

import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { useEventJoin } from "@/lib/useEventJoin";

// Button copy — parallel to JOIN_COPY in useEventJoin / events page.
const BUTTON_COPY = {
  np: {
    join: "सामेल हुने",
    joinedAs: (role) => `${ROLE_LABELS_NP[role] || role} — जोडिनुभयो`
  },
  en: {
    join: "Join",
    joinedAs: (role) => `Joined as ${ROLE_LABELS_EN[role] || role}`
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

export function EventJoinButton({ eventId, seed, language = "np", size, status }) {
  const lang = language === "en" ? "en" : "np";
  const bc = BUTTON_COPY[lang];

  const join = useEventJoin(eventId, { seed, language: lang });

  // Hidden when the event is completely non-joinable AND viewer is not in.
  // (joinable = false means COMPLETED/CANCELLED/PAUSED with no active viewer role.)
  if (!join.joinable && !join.viewerRole) return null;

  // Hybrid CTA colour (see docs/design/06-state-color-system.md): one constant
  // teal action colour, with LIVE as the single exception — a red "join now".
  // The status colour is identity; this is the action colour, deliberately kept
  // separate, so we read the lifecycle tokens rather than the card's data-status.
  const accent = status === "active" ? "var(--state-active)" : "var(--primary)";
  const liveLabel = lang === "np" ? "अहिले जोडिने" : "Join now";

  const label = join.viewerRole
    ? bc.joinedAs(join.viewerRole)
    : status === "active"
      ? liveLabel
      : bc.join;

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
          border: join.viewerRole ? `1.5px solid ${accent}` : "none",
          background: join.viewerRole ? "transparent" : accent,
          color: join.viewerRole ? accent : "#fff",
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

      <CampaignParticipationModal
        open={join.open}
        onClose={join.closeModal}
        language={lang}
        campaign={join.campaignHeader}
        panelProps={join.panelProps}
      />
    </>
  );
}
