"use client";

import { CheckOutlined, LikeOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { useRoleSupport } from "@/lib/useRoleSupport";

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
      WORKER: "सफाइकर्मी",
      PHOTOGRAPHER: "फोटोग्राफर",
      LIVESTREAMER: "लाइभस्ट्रिमर",
      MEDIC: "स्वास्थ्यकर्मी",
      SAFETY_LEAD: "सुरक्षा प्रमुख",
      COORDINATOR: "संयोजक",
      LOGISTICS: "लजिस्टिक्स"
    },
    submit: "समर्थन गर्ने",
    cancel: "रद्द गर्ने",
    // Voted-state button labels, by the role the viewer holds — the chip reads
    // as their actual commitment, not a flat "समर्थन गरियो".
    doneLabels: {
      INTERESTED: "समर्थन गरियो",
      GOING: "सामेल हुने",
      WANT_TO_LEAD: "नेतृत्व गर्ने"
    },
    // Tooltip on the "already supported" button — names the commitment held.
    joinedTooltipGoing: "तपाईं {role}को रूपमा जोडिनुभयो — समर्थन फिर्ता गर्न क्लिक गर्नुहोस्।",
    joinedTooltipInterested: "तपाईंले समर्थन गर्नुभयो — फिर्ता गर्न क्लिक गर्नुहोस्।",
    joinedTooltipLead: "तपाईं नेतृत्वका लागि इच्छुक हुनुहुन्छ — फिर्ता गर्न क्लिक गर्नुहोस्।",
    // Confirm-before-withdraw copy, tiered by the role the viewer voted with.
    // INTERESTED is low-stakes; GOING/WANT_TO_LEAD carry a real commitment, so
    // the warning gets heavier the more the campaign is counting on them.
    withdrawOk: "फिर्ता गर्ने",
    withdrawCancel: "रहन्छु",
    withdraw: {
      INTERESTED: {
        title: "समर्थन फिर्ता गर्ने?",
        description:
          "तपाईंको समर्थन यो समस्याको गन्तीबाट हट्नेछ। मन लागे फेरि जहिले पनि समर्थन गर्न सकिन्छ।"
      },
      GOING: {
        title: "सामेल हुने प्रतिबद्धता फिर्ता गर्ने?",
        description:
          "अभियान भएमा आफैँ आएर श्रममा सामेल हुने भनेर तपाईंले नाम लेखाउनुभएको थियो। समर्थन फिर्ता गर्दा अभियानले भरोसा गरेको एउटा हात घट्छ — साँच्चै हट्ने?"
      },
      WANT_TO_LEAD: {
        title: "नेतृत्वको प्रतिबद्धता फिर्ता गर्ने?",
        description:
          "तपाईं यो अभियान नेतृत्व गर्न तयार हुनुभएको थियो। तपाईं हट्नुभयो भने आयोजना नै अड्किन सक्छ। यो निर्णय सोचविचार गरेर मात्र गर्नुहोस् — साँच्चै हट्ने?"
      }
    }
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
      WORKER: "Cleaner",
      PHOTOGRAPHER: "Photographer",
      LIVESTREAMER: "Livestreamer",
      MEDIC: "Medic",
      SAFETY_LEAD: "Safety Lead",
      COORDINATOR: "Coordinator",
      LOGISTICS: "Logistics"
    },
    submit: "Support",
    cancel: "Cancel",
    doneLabels: {
      INTERESTED: "Supported",
      GOING: "Joining",
      WANT_TO_LEAD: "Leading"
    },
    joinedTooltipGoing: "You have joined as {role}. Click to withdraw support.",
    joinedTooltipInterested: "You're supporting this. Click to withdraw.",
    joinedTooltipLead: "You've offered to lead. Click to withdraw.",
    withdrawOk: "Withdraw",
    withdrawCancel: "Stay",
    withdraw: {
      INTERESTED: {
        title: "Withdraw your support?",
        description:
          "Your support will be removed from this issue's count. You can support it again anytime."
      },
      GOING: {
        title: "Withdraw your commitment to join?",
        description:
          "You signed up to show up and pitch in if a campaign happens. Withdrawing means the campaign loses a hand it was counting on — are you sure?"
      },
      WANT_TO_LEAD: {
        title: "Withdraw your offer to lead?",
        description:
          "You stepped up to help lead this campaign. If you withdraw, organizing it could stall. Please be sure before you go — withdraw anyway?"
      }
    }
  }
};

export function IssueVoteButton({
  issueId,
  initialVoteCount,
  initialVoted,
  // The role the viewer voted with (INTERESTED | GOING | WANT_TO_LEAD), when
  // known — sourced from GET /issues/me/votes on the detail page. Drives which
  // withdraw-confirmation copy we show. Falls back to the INTERESTED (lightest)
  // wording when a surface only knows the boolean isVoted (e.g. list cards).
  initialVoterRole,
  // The event-day role a GOING voter signed up for (WORKER | PHOTOGRAPHER | …),
  // when known. Lets the voted chip name the actual role (e.g. "फोटोग्राफर")
  // instead of the generic "सामेल हुने". Also from GET /issues/me/votes.
  initialEventRole,
  content,
  language,
  size,
  type,
  showCount = true,
  showLabel = true,
  className,
  // Optional. Bubbles the viewer's role + fresh tallies up to a parent (e.g.
  // the issue detail page's participation panel) on each vote/retract.
  onVoteChange,
  // seed: optional issue snapshot (id, voteCount, isVoted, status …) passed by
  // list-card or preview surfaces so the hook can seed counts without a fetch.
  seed,
  // Optional controlled support instance — when passed, the button uses THIS
  // hook return value instead of creating its own. Allows a page to share one
  // useRoleSupport instance between the body roster and the topline button.
  // We always call useRoleSupport internally (hooks must not be conditional),
  // but ignore ownSupport when a controlled instance is provided.
  support: controlledSupport
}) {
  // Always call the hook (rules of hooks: no conditional calls). The own
  // instance is used only when the caller hasn't passed a controlled one.
  const ownSupport = useRoleSupport(issueId, {
    seed: seed ?? {
      voteCount: initialVoteCount,
      isVoted: initialVoted
    },
    content,
    language,
    onVoteChange
  });
  // If a controlled support is passed, use it; otherwise fall back to own.
  const support = controlledSupport ?? ownSupport;

  const roleCopy = ROLE_COPY[language] || ROLE_COPY.np;

  // The role the viewer's live vote is held under — drives which tier of
  // withdraw-confirmation copy we show. Seeded from initialVoterRole and
  // refreshed when the viewer casts a fresh vote through the modal.
  const [activeVoterRole, setActiveVoterRole] = useState(
    initialVoterRole || "INTERESTED"
  );
  // Resync when the known role arrives/changes from the parent (the detail
  // page resolves it from GET /issues/me/votes after mount). Adjusting state
  // during render — not in an effect — is React's recommended way to follow a
  // changing prop and avoids the cascading re-render lint flags.
  const [syncedVoterRole, setSyncedVoterRole] = useState(initialVoterRole);
  if (initialVoterRole && initialVoterRole !== syncedVoterRole) {
    setSyncedVoterRole(initialVoterRole);
    setActiveVoterRole(initialVoterRole);
  }

  // The event-day role behind a GOING vote — names the voted chip. Seeded and
  // resynced from initialEventRole the same render-time way as activeVoterRole.
  const [activeEventRole, setActiveEventRole] = useState(initialEventRole || null);
  const [syncedEventRole, setSyncedEventRole] = useState(initialEventRole);
  if (initialEventRole !== syncedEventRole) {
    setSyncedEventRole(initialEventRole);
    setActiveEventRole(initialEventRole || null);
  }

  // When the hook delivers a live vote (after the modal resolves), sync the
  // active role state so the chip label and withdraw copy stay truthful.
  const liveVoterRole = support.voterRole;
  const liveEventRole = support.eventRole;
  const [syncedLiveVoterRole, setSyncedLiveVoterRole] = useState(liveVoterRole);
  if (liveVoterRole && liveVoterRole !== syncedLiveVoterRole) {
    setSyncedLiveVoterRole(liveVoterRole);
    setActiveVoterRole(liveVoterRole);
  }
  const [syncedLiveEventRole, setSyncedLiveEventRole] = useState(liveEventRole);
  if (liveEventRole !== syncedLiveEventRole) {
    setSyncedLiveEventRole(liveEventRole);
    setActiveEventRole(liveEventRole || null);
  }

  const previousCountRef = useRef(support.voteCount);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (previousCountRef.current !== support.voteCount) {
      previousCountRef.current = support.voteCount;
      setPulseKey((k) => k + 1);
    }
  }, [support.voteCount]);

  const label = support.voted
    ? activeVoterRole === "GOING" && activeEventRole
      ? roleCopy.eventRoles[activeEventRole] || roleCopy.doneLabels.GOING
      : roleCopy.doneLabels[activeVoterRole] || content.card.voteActionDone
    : content.card.voteAction;

  // When already supported, the tooltip names the actual commitment instead of
  // a flat "withdraw support".
  const withdrawTooltip =
    activeVoterRole === "GOING"
      ? roleCopy.joinedTooltipGoing.replace(
          "{role}",
          (activeEventRole && roleCopy.eventRoles[activeEventRole]) ||
            roleCopy.doneLabels.GOING
        )
      : activeVoterRole === "WANT_TO_LEAD"
        ? roleCopy.joinedTooltipLead
        : roleCopy.joinedTooltipInterested;
  const tooltipTitle = !support.isAuthenticated
    ? content.card.voteDisabledTooltip
    : support.voted
      ? withdrawTooltip
      : "";

  const handleClick = (event) => {
    if (event?.preventDefault) event.preventDefault();
    if (event?.stopPropagation) event.stopPropagation();
    if (!support.isAuthenticated) {
      // Delegate to the hook's "interested" path — useIssueVote's handleVoteClick
      // will detect the missing session and push to the login page.
      support.onInterested();
      return;
    }
    if (support.voting || !issueId) return;
    // Voted already → withdrawal runs through the confirm popover that wraps
    // this button (see Popconfirm below), so the bare click is a no-op here.
    if (support.voted) return;
    // Open the rich CampaignParticipationModal (all roles + counts + lead visible).
    support.openModal();
  };

  // Withdraw-confirmation copy for the role the viewer's vote is held under.
  const withdrawCopy = roleCopy.withdraw[activeVoterRole] || roleCopy.withdraw.INTERESTED;

  return (
    <>
      <Popconfirm
        // Only intercept the click when there's a live vote to withdraw —
        // otherwise the button's own onClick handles the login redirect (anon)
        // or opens the role picker (not yet voted).
        disabled={!support.isAuthenticated || !support.voted}
        title={withdrawCopy.title}
        description={withdrawCopy.description}
        okText={roleCopy.withdrawOk}
        cancelText={roleCopy.withdrawCancel}
        okButtonProps={{ danger: true, loading: support.voting }}
        onConfirm={() => support.retract()}
        overlayClassName="vote-withdraw-popconfirm"
      >
        <Tooltip title={tooltipTitle}>
          <Button
            aria-pressed={support.voted}
            className={className}
            icon={support.voted ? <CheckOutlined /> : <LikeOutlined />}
            loading={support.voting}
            onClick={handleClick}
            size={size}
            type={support.voted ? "default" : type}
          >
            {showCount ? (
              <span
                key={pulseKey}
                className="public-issue-card-support-count vote-tickup"
              >
                {toLocalDigits(support.voteCount, language)}
              </span>
            ) : null}
            {showLabel ? (
              <span className="public-issue-card-support-label">{label}</span>
            ) : null}
          </Button>
        </Tooltip>
      </Popconfirm>

      <CampaignParticipationModal
        open={support.open}
        onClose={support.closeModal}
        language={language}
        campaign={support.campaignHeader}
        onInterested={support.onInterested}
        panelProps={support.panelProps}
      />
    </>
  );
}
