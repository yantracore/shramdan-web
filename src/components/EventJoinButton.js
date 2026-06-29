"use client";

// EventJoinButton — button + modal shell for joining an event from any preview
// surface (EventPreviewPane, future card surfaces). Drives useEventJoin so the
// same lazy-load → ParticipantsPanel pattern is reused without duplicating API
// logic. No "I'm interested" header — events have no INTERESTED concept.

import { UserAddOutlined } from "@ant-design/icons";
import { CampaignActionButton } from "@/components/CampaignActionButton";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { ROLE_COLORS, LEAD_COLOR } from "@/components/ParticipantsPanel";
import { useEventJoin } from "@/lib/useEventJoin";

// Button copy — parallel to JOIN_COPY in useEventJoin / events page.
const BUTTON_COPY = {
  np: {
    join: "सामेल हुने",
    joinedAs: (role) => `${ROLE_LABELS_NP[role] || role}का रूपमा`
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

export function EventJoinButton({ eventId, seed, language = "np", size, status, eager = false }) {
  const lang = language === "en" ? "en" : "np";
  const bc = BUTTON_COPY[lang];

  // eager (preview panes) loads the roster + the viewer's participation on mount
  // so the CTA reads committed / Full / Join correctly before the modal opens.
  const join = useEventJoin(eventId, { seed, language: lang, eager });

  // Hidden when the event is completely non-joinable AND viewer is not in.
  // (joinable = false means COMPLETED/CANCELLED/PAUSED with no active viewer role.)
  if (!join.joinable && !join.viewerRole) return null;

  // viewerRole → committed chip; all seats taken → "Full"; else the solid act
  // CTA (red only when LIVE). (docs/design/06: teal action colour, LIVE = red.)
  const isLive = status === "active";
  let mode = "act";
  let label = isLive ? (lang === "np" ? "अहिले जोडिने" : "Join now") : bc.join;
  let roleColor;
  let icon = <UserAddOutlined />;
  if (join.viewerRole) {
    mode = "committed";
    if (join.viewerRole === "COORDINATOR") {
      label = lang === "np" ? "नेतृत्वमा" : "Leading";
      roleColor = LEAD_COLOR;
    } else {
      label = bc.joinedAs(join.viewerRole);
      roleColor = ROLE_COLORS[join.viewerRole] || undefined;
    }
  } else if (!join.hasOpenSlot) {
    mode = "full";
    label = lang === "np" ? "सबै भरियो" : "Full";
    icon = null;
  }

  return (
    <>
      <CampaignActionButton
        mode={mode}
        label={label}
        accent={isLive ? "live" : "primary"}
        roleColor={roleColor}
        icon={icon}
        size={size === "large" ? "lg" : "sm"}
        loading={join.loading}
        language={lang}
        onClick={join.openModal}
      />

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
