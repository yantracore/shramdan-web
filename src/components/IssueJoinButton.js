"use client";

// Primary CTA for a promoted issue (issue.status === EVENT_DRAFT) or its event.
// The join machinery is the event's ParticipantsPanel (POST /events/{id}/
// participants). Rather than navigate there, we mount useEventJoin for the
// resolved event and open that panel inline in a Modal — same component, no
// route change. What the CTA offers is gated by the EVENT's status:
//   DRAFT            → "Join", full role menu + Lead
//   SCHEDULED/ACTIVE → "Join", Cleaner only
//   COMPLETED        → read-only "Contributed as {role}" chip
//   CANCELLED        → disabled "Cancelled" chip
//   (no event id)    → an honest "almost ready" cue instead of a dead button.

import { StopOutlined, UserAddOutlined } from "@ant-design/icons";
import { CampaignActionButton } from "@/components/CampaignActionButton";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { ROLE_COLORS, LEAD_COLOR } from "@/components/ParticipantsPanel";
import { buildCampaignHeader } from "@/lib/campaignHeader";
import { useToast } from "@/lib/toast";
import { useEventJoin } from "@/lib/useEventJoin";
import { eventJoinPhase, getIssueEventId } from "@/lib/issueActions";

const COPY = {
  np: {
    join: "जोडिने",
    joinLive: "अहिले जोडिने",
    title: "कुन भूमिकामा जोडिनुहुन्छ?",
    contributed: "योगदान: {role}",
    contributedPlain: "योगदान गरियो",
    cancelled: "रद्द भयो",
    soon: "अभियानको तालिका तय भइसक्यो — जोडिने सुविधा छिट्टै सक्रिय हुन्छ।",
    roles: {
      WORKER: "सफाइकर्मी", PHOTOGRAPHER: "फोटोग्राफर", LIVESTREAMER: "लाइभस्ट्रिमर",
      MEDIC: "स्वास्थ्यकर्मी", SAFETY_LEAD: "सुरक्षा प्रमुख", LOGISTICS: "लजिस्टिक्स"
    }
  },
  en: {
    join: "Join",
    joinLive: "Join now",
    title: "Which role would you take?",
    contributed: "Contributed as {role}",
    contributedPlain: "Contributed",
    cancelled: "Cancelled",
    soon: "This campaign is scheduled — joining opens shortly.",
    roles: {
      WORKER: "Cleaner", PHOTOGRAPHER: "Photographer", LIVESTREAMER: "Livestreamer",
      MEDIC: "Medic", SAFETY_LEAD: "Safety Lead", LOGISTICS: "Logistics"
    }
  }
};

export function IssueJoinButton({
  issue,
  eventId: eventIdProp = null,
  eventStatus = null,
  language = "np",
  size,
  type = "primary",
  className,
  block = false,
  // Optional controlled useEventJoin instance. When a page already drives one
  // (so its body roster and this button's modal stay one live-synced source),
  // it's passed in; otherwise the button creates its own.
  join: controlledJoin
}) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const eventId = eventIdProp || getIssueEventId(issue);
  const phase = eventJoinPhase(eventStatus);

  // Eager-load only when we need the viewer's role for the COMPLETED chip; join
  // phases load lazily when the modal opens. A controlled instance, when given,
  // wins (the page already loaded it).
  const ownJoin = useEventJoin(eventId, {
    language,
    eager: phase.label === "contributed" && Boolean(eventId)
  });
  const join = controlledJoin ?? ownJoin;

  const sizeKey = size === "large" ? "lg" : "sm";

  // No event resolved yet → keep the CTA honest (info toast, no dead nav).
  if (!eventId) {
    return (
      <CampaignActionButton
        mode="act"
        accent="primary"
        icon={<UserAddOutlined />}
        size={sizeKey}
        block={block}
        className={className}
        label={t.join}
        language={language}
        onClick={(e) => {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          messageApi.info(t.soon);
        }}
      />
    );
  }

  if (phase.label === "cancelled") {
    return (
      <CampaignActionButton
        mode="disabled"
        icon={<StopOutlined />}
        size={sizeKey}
        block={block}
        className={className}
        label={t.cancelled}
        language={language}
      />
    );
  }

  if (phase.label === "contributed") {
    const role = join.viewerRole;
    const label = role
      ? t.contributed.replace("{role}", t.roles[role] || role)
      : t.contributedPlain;
    return (
      <CampaignActionButton
        mode="readonly"
        size={sizeKey}
        block={block}
        className={className}
        label={label}
        language={language}
      />
    );
  }

  // Join phases (DRAFT / SCHEDULED / ACTIVE) → open the role picker inline.
  // Hybrid CTA (docs/design/06-state-color-system.md): teal by default, red for
  // a LIVE event only — the one stage where "join now" carries real urgency.
  const isLive = eventStatus === "ACTIVE";

  // IssueJoinButton holds the full issue (instant cover + title); the hook's
  // eventData sharpens status + schedule once the modal loads.
  const campaign = buildCampaignHeader({
    issue,
    event: join.eventData || (eventStatus ? { status: eventStatus } : null),
    language
  });

  // committed chip if the viewer already holds a role in a still-joinable phase.
  let mode = "act";
  let label = isLive ? t.joinLive : t.join;
  let roleColor;
  if (join.viewerRole) {
    mode = "committed";
    if (join.viewerRole === "COORDINATOR") {
      label = language === "np" ? "नेतृत्वमा" : "Leading";
      roleColor = LEAD_COLOR;
    } else {
      label =
        language === "np"
          ? `${t.roles[join.viewerRole] || join.viewerRole}का रूपमा`
          : `Joined as ${t.roles[join.viewerRole] || join.viewerRole}`;
      roleColor = ROLE_COLORS[join.viewerRole] || undefined;
    }
  }

  return (
    <>
      <CampaignActionButton
        mode={mode}
        label={label}
        accent={isLive ? "live" : "primary"}
        roleColor={roleColor}
        icon={<UserAddOutlined />}
        size={sizeKey}
        block={block}
        className={className}
        loading={join.loading}
        language={language}
        onClick={(e) => {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          join.openModal();
        }}
      />

      <CampaignParticipationModal
        open={join.open}
        onClose={join.closeModal}
        language={language}
        campaign={campaign}
        panelProps={join.panelProps}
      />
    </>
  );
}
