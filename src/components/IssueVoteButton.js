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

const ROLE_COPY = {
  np: {
    modalTitle: "तपाईंको समर्थन कस्तो हो?",
    modalIntro:
      "यो समस्या समाधानमा तपाईंले कसरी सहयोग गर्न चाहनुहुन्छ? पछि परिवर्तन गर्न सकिन्छ।",
    options: [
      {
        value: "INTERESTED",
        label: "रुचिकर्ता",
        hint: "यो समस्या सुनिनुपर्छ — मैले समर्थन गरेँ।"
      },
      {
        value: "WOULD_VOLUNTEER",
        label: "स्वयंसेवक",
        hint: "अभियान भएमा शारीरिक श्रममा सहयोग गर्न तयार।"
      },
      {
        value: "WOULD_DONATE",
        label: "योगदानकर्ता",
        hint: "औजार, सामग्री वा रकम योगदान गर्न तयार।"
      },
      {
        value: "WOULD_ORGANIZE",
        label: "नेतृत्व",
        hint: "अभियान आयोजना वा समन्वयमा अग्रसर हुन सकौँ।"
      }
    ],
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
        value: "WOULD_VOLUNTEER",
        label: "Would Volunteer",
        hint: "Ready to show up for physical labour if a campaign happens."
      },
      {
        value: "WOULD_DONATE",
        label: "Would Donate",
        hint: "Ready to contribute tools, materials, or funds."
      },
      {
        value: "WOULD_ORGANIZE",
        label: "Would Organize",
        hint: "Willing to help organize or coordinate the campaign."
      }
    ],
    submit: "Support",
    cancel: "Cancel"
  }
};

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
  const { isAuthenticated, voteCount, voted, voting, handleVoteClick } =
    useIssueVote({
      issueId,
      initialVoteCount,
      initialVoted,
      content: content.card
    });

  const roleCopy = ROLE_COPY[language] || ROLE_COPY.np;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRole, setPickerRole] = useState("INTERESTED");

  const previousCountRef = useRef(voteCount);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (previousCountRef.current !== voteCount) {
      previousCountRef.current = voteCount;
      setPulseKey((k) => k + 1);
    }
  }, [voteCount]);

  const label = voted ? content.card.voteActionDone : content.card.voteAction;
  const tooltipTitle = !isAuthenticated ? content.card.voteDisabledTooltip : "";

  const handleClick = (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (event?.stopPropagation) event.stopPropagation();
    if (!isAuthenticated) {
      // Reuse the hook's auth-redirect path.
      handleVoteClick(event);
      return;
    }
    if (voted || voting || !issueId) return;
    setPickerRole("INTERESTED");
    setPickerOpen(true);
  };

  const handleConfirmRole = () => {
    setPickerOpen(false);
    handleVoteClick(pickerRole);
  };

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <Button
          className={className}
          disabled={voted}
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
        width={520}
      >
        <p className="voter-role-modal-intro">{roleCopy.modalIntro}</p>
        <Radio.Group
          value={pickerRole}
          onChange={(e) => setPickerRole(e.target.value)}
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
      </Modal>
    </>
  );
}
