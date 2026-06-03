"use client";

import { CheckOutlined, LikeOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { useIssueVote } from "@/lib/useIssueVote";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function toLocalDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

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

  // Animate the count whenever it changes (after first render). Bumping
  // pulseKey re-mounts the count span so the CSS tickup animation plays.
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
      ? ""
      : content.card.voteTooltip || content.card.voteAction;

  return (
    <Tooltip title={tooltipTitle}>
      <Button
        className={className}
        disabled={voted}
        icon={voted ? <CheckOutlined /> : <LikeOutlined />}
        loading={voting}
        onClick={handleVoteClick}
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
  );
}
