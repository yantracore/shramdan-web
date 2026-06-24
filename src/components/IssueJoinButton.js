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

import { CheckCircleFilled, StopOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import { useToast } from "@/lib/toast";
import { useEventJoin } from "@/lib/useEventJoin";
import { eventJoinPhase, getIssueEventId } from "@/lib/issueActions";

const COPY = {
  np: {
    join: "जोडिने",
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
  block = false
}) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const eventId = eventIdProp || getIssueEventId(issue);
  const phase = eventJoinPhase(eventStatus);

  // Eager-load only when we need the viewer's role for the COMPLETED chip; join
  // phases load lazily when the modal opens.
  const join = useEventJoin(eventId, {
    language,
    eager: phase.label === "contributed" && Boolean(eventId)
  });

  // No event resolved yet → keep the CTA honest, no dead navigation.
  if (!eventId) {
    return (
      <Button
        block={block}
        className={className}
        icon={<UserAddOutlined />}
        size={size}
        type={type}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          messageApi.info(t.soon);
        }}
      >
        {t.join}
      </Button>
    );
  }

  if (phase.label === "cancelled") {
    return (
      <Button block={block} className={className} icon={<StopOutlined />} size={size} disabled>
        {t.cancelled}
      </Button>
    );
  }

  if (phase.label === "contributed") {
    const role = join.viewerRole;
    const label = role
      ? t.contributed.replace("{role}", t.roles[role] || role)
      : t.contributedPlain;
    return (
      <Button block={block} className={className} icon={<CheckCircleFilled />} size={size} disabled>
        {label}
      </Button>
    );
  }

  // Join phases (DRAFT / SCHEDULED / ACTIVE) → open the role picker inline.
  return (
    <>
      <Button
        block={block}
        className={className}
        icon={<UserAddOutlined />}
        size={size}
        type={type}
        loading={join.loading}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          join.openModal();
        }}
      >
        {t.join}
      </Button>

      <Modal
        open={join.open}
        onCancel={join.closeModal}
        footer={null}
        width={680}
        title={t.title}
        destroyOnHidden
        className="support-roles-modal"
      >
        <ParticipantsPanel {...join.panelProps} embedded language={language} />
      </Modal>
    </>
  );
}
