"use client";

import { CheckOutlined, LikeOutlined } from "@ant-design/icons";
import { Button, Modal, Radio, Space, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { useIssueVote } from "@/lib/useIssueVote";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function toLocalDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// voterRole values MUST match the backend enum on POST /issues/{id}/vote:
// INTERESTED | GOING | WANT_TO_LEAD (used later to assign roles when the
// issue converts to an event). Do not reintroduce WOULD_* values — the
// backend rejects them.
const ROLE_COPY = {
  np: {
    modalTitle: "तपाईंको समर्थन कस्तो हो?",
    modalIntro:
      "यो समस्या समाधानमा तपाईं कसरी सहयोग गर्न चाहनुहुन्छ? पछि परिवर्तन गर्न सकिन्छ।",
    options: [
      {
        value: "INTERESTED",
        label: "रुचि छ",
        hint: "यो समस्या महत्त्वपूर्ण छ — म समर्थन गर्छु।"
      },
      {
        value: "GOING",
        label: "सामेल हुन्छु",
        hint: "अभियान भएमा म आफैँ आएर श्रममा सामेल हुन्छु।"
      },
      {
        value: "WANT_TO_LEAD",
        label: "नेतृत्व गर्छु",
        hint: "अभियान आयोजना वा नेतृत्व गर्न तयार छु।"
      }
    ],
    eventRolePrompt: "कुन भूमिकामा आएर श्रम गर्नुहुन्छ?",
    eventRoleHint: "अभियानमा परिणत भएपछि तपाईं यही भूमिकामा सहभागी हुनुहुन्छ।",
    eventRoles: {
      WORKER: "कामदार",
      PHOTOGRAPHER: "फोटोग्राफर",
      LIVESTREAMER: "लाइभस्ट्रिमर",
      MEDIC: "स्वास्थ्यकर्मी",
      SAFETY_LEAD: "सुरक्षा प्रमुख",
      COORDINATOR: "संयोजक",
      LOGISTICS: "लजिस्टिक्स"
    },
    submit: "समर्थन गर्नुहोस्",
    cancel: "रद्द गर्नुहोस्"
  },
  en: {
    modalTitle: "How are you supporting?",
    modalIntro:
      "Tell us how you'd like to help solve this issue. You can change this later.",
    options: [
      {
        value: "INTERESTED",
        label: "Interested",
        hint: "I think this matters — I'm registering my support."
      },
      {
        value: "GOING",
        label: "I'll Join",
        hint: "I'll show up and pitch in if a campaign happens."
      },
      {
        value: "WANT_TO_LEAD",
        label: "Want to Lead",
        hint: "Ready to help organize or lead the campaign."
      }
    ],
    eventRolePrompt: "Which role would you take on the day?",
    eventRoleHint: "When this becomes a campaign, you'll join in this role.",
    eventRoles: {
      WORKER: "Worker",
      PHOTOGRAPHER: "Photographer",
      LIVESTREAMER: "Livestreamer",
      MEDIC: "Medic",
      SAFETY_LEAD: "Safety Lead",
      COORDINATOR: "Coordinator",
      LOGISTICS: "Logistics"
    },
    submit: "Support",
    cancel: "Cancel"
  }
};

// Order the event-role options are offered in. Mirrors the backend enum on
// POST /issues/{id}/vote and EventJoinPanel's role list.
const EVENT_ROLE_ORDER = [
  "WORKER",
  "PHOTOGRAPHER",
  "LIVESTREAMER",
  "MEDIC",
  "SAFETY_LEAD",
  "COORDINATOR",
  "LOGISTICS"
];

export function IssueVoteButton({
  issueId,
  initialVoteCount,
  initialVoted,
  content,
  language,
  size,
  type,
  showCount = true,
  showLabel = true,
  className
}) {
  const { isAuthenticated, voteCount, voted, voting, handleVoteClick, handleRetract } =
    useIssueVote({
      issueId,
      initialVoteCount,
      initialVoted,
      content: content.card
    });

  const roleCopy = ROLE_COPY[language] || ROLE_COPY.np;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRole, setPickerRole] = useState("INTERESTED");
  // Required only when pickerRole === "GOING" — the participant role the voter
  // would take once the issue becomes a campaign.
  const [pickerEventRole, setPickerEventRole] = useState(null);

  const previousCountRef = useRef(voteCount);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (previousCountRef.current !== voteCount) {
      previousCountRef.current = voteCount;
      setPulseKey((k) => k + 1);
    }
  }, [voteCount]);

  const label = voted ? content.card.voteActionDone : content.card.voteAction;
  const tooltipTitle = !isAuthenticated
    ? content.card.voteDisabledTooltip
    : voted
      ? content.card.voteWithdraw
      : "";

  const handleClick = (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (event?.stopPropagation) event.stopPropagation();
    if (!isAuthenticated) {
      // Reuse the hook's auth-redirect path.
      handleVoteClick(event);
      return;
    }
    if (voting || !issueId) return;
    // Voted already → tapping withdraws support (issue must still be OPEN;
    // the hook surfaces a graceful message when the backend rejects with 409).
    if (voted) {
      handleRetract(event);
      return;
    }
    setPickerRole("INTERESTED");
    setPickerEventRole(null);
    setPickerOpen(true);
  };

  const goingNeedsRole = pickerRole === "GOING" && !pickerEventRole;

  const handleConfirmRole = () => {
    if (goingNeedsRole) return;
    setPickerOpen(false);
    handleVoteClick({
      voterRole: pickerRole,
      eventRole: pickerRole === "GOING" ? pickerEventRole : undefined
    });
  };

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <Button
          aria-pressed={voted}
          className={className}
          icon={voted ? <CheckOutlined /> : <LikeOutlined />}
          loading={voting}
          onClick={handleClick}
          size={size}
          type={voted ? "default" : type}
        >
          {showCount ? (
            <span
              key={pulseKey}
              className="public-issue-card-support-count vote-tickup"
            >
              {toLocalDigits(voteCount, language)}
            </span>
          ) : null}
          {showLabel ? (
            <span className="public-issue-card-support-label">{label}</span>
          ) : null}
        </Button>
      </Tooltip>

      <Modal
        open={pickerOpen}
        title={roleCopy.modalTitle}
        onOk={handleConfirmRole}
        onCancel={() => (voting ? null : setPickerOpen(false))}
        okText={roleCopy.submit}
        cancelText={roleCopy.cancel}
        confirmLoading={voting}
        okButtonProps={{ disabled: goingNeedsRole }}
        width={520}
      >
        <p className="voter-role-modal-intro">{roleCopy.modalIntro}</p>
        <Radio.Group
          value={pickerRole}
          onChange={(e) => {
            setPickerRole(e.target.value);
            // eventRole only applies to GOING; clear it when switching away so
            // we never send a stray role the backend would reject.
            if (e.target.value !== "GOING") setPickerEventRole(null);
          }}
          disabled={voting}
          className="voter-role-modal-options"
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {roleCopy.options.map((opt) => (
              <Radio key={opt.value} value={opt.value} className="voter-role-modal-option">
                <span className="voter-role-modal-option-label">{opt.label}</span>
                <span className="voter-role-modal-option-hint">{opt.hint}</span>
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        {pickerRole === "GOING" ? (
          <div className="voter-role-modal-event-role">
            <p className="voter-role-modal-event-role-prompt">{roleCopy.eventRolePrompt}</p>
            <p className="voter-role-modal-event-role-hint">{roleCopy.eventRoleHint}</p>
            <Radio.Group
              value={pickerEventRole}
              onChange={(e) => setPickerEventRole(e.target.value)}
              disabled={voting}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {EVENT_ROLE_ORDER.map((role) => (
                  <Radio key={role} value={role} className="voter-role-modal-option">
                    {roleCopy.eventRoles[role] || role}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
