"use client";

import { CheckOutlined, LikeOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
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
  content,
  language,
  size,
  type = "primary",
  showCount = true,
  showLabel = true,
  className
}) {
  const { isAuthenticated, voteCount, voted, voting, handleVoteClick } =
    useIssueVote({
      issueId,
      initialVoteCount,
      content: content.card
    });

  const label = voted ? content.card.voteActionDone : content.card.voteAction;
  const tooltipTitle = !isAuthenticated ? content.card.voteDisabledTooltip : "";

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
          <span className="public-issue-card-support-count">
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
