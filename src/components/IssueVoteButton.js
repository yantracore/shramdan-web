"use client";

import { LikeOutlined } from "@ant-design/icons";
import { CampaignActionButton } from "@/components/CampaignActionButton";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { ROLE_COLORS, LEAD_COLOR } from "@/components/ParticipantsPanel";
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
      GOING: "जोडिनुभयो",
      WANT_TO_LEAD: "नेतृत्वमा"
    },
    committedAs: "{role}का रूपमा",
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
      GOING: "Joined",
      WANT_TO_LEAD: "Leading"
    },
    committedAs: "Joined as {role}",
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
  content,
  language = "np",
  size,
  // `type` is accepted for call-site compatibility but no longer used (the CTA
  // owns its own styling now). Same for showLabel.
  type,
  showCount = true,
  showLabel = true,
  className,
  onVoteChange,
  seed,
  support: controlledSupport
}) {
  const ownSupport = useRoleSupport(issueId, {
    seed: seed ?? { voteCount: initialVoteCount, isVoted: initialVoted },
    content,
    language,
    onVoteChange
  });
  const support = controlledSupport ?? ownSupport;
  const t = ROLE_COPY[language] || ROLE_COPY.np;

  const sizeKey = size === "large" ? "lg" : "sm";
  const voted = support.voted;
  const voterRole = support.voterRole; // INTERESTED | GOING | WANT_TO_LEAD | null
  const eventRole = support.eventRole; // role | null

  let mode = "act";
  let label = content.card.voteAction;
  let roleColor;
  if (voted) {
    mode = "committed";
    if (voterRole === "WANT_TO_LEAD") {
      label = t.doneLabels.WANT_TO_LEAD;
      roleColor = LEAD_COLOR;
    } else if (voterRole === "GOING" && eventRole) {
      label = t.committedAs.replace("{role}", t.eventRoles[eventRole] || eventRole);
      roleColor = ROLE_COLORS[eventRole];
    } else if (voterRole === "GOING") {
      label = t.doneLabels.GOING;
      roleColor = ROLE_COLORS.WORKER;
    } else {
      label = t.doneLabels.INTERESTED; // roleColor stays undefined → --primary tint
    }
  }

  const handleClick = () => {
    // Anonymous → the hook's interested path pushes to login; else open the modal.
    if (!support.isAuthenticated) {
      support.onInterested();
      return;
    }
    support.openModal();
  };

  return (
    <>
      <CampaignActionButton
        mode={mode}
        label={showLabel ? label : ""}
        accent="primary"
        roleColor={roleColor}
        icon={<LikeOutlined />}
        size={sizeKey}
        count={mode === "act" && showCount ? toLocalDigits(support.voteCount, language) : undefined}
        loading={support.voting}
        className={className}
        language={language}
        onClick={handleClick}
      />

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
