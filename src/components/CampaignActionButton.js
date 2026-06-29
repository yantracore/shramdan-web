"use client";

// CampaignActionButton — the ONE participation CTA across every page + lifecycle
// status. Purely presentational: the three trigger wrappers (IssueVoteButton,
// EventJoinButton, IssueJoinButton) compute mode/label/accent/roleColor from
// their hook and render this; every act/committed instance opens the unified
// CampaignParticipationModal. Act = solid (teal, red for LIVE) + sheen + lift;
// committed = tinted role-aware chip (never white) that also opens the modal;
// readonly/disabled are non-interactive chips. The modal's per-role dashed
// "open slot" pills are a deliberately DIFFERENT (secondary) language — this is
// the single primary action, so it is solid (see the design spec).

import { CheckCircleFilled } from "@ant-design/icons";

// mode: "act" | "committed" | "readonly" | "disabled"
export function CampaignActionButton({
  mode = "act",
  label,
  accent = "primary", // "primary" | "live" — act only
  roleColor, // committed tint hue; defaults to --primary
  icon = null,
  size = "lg", // "sm" | "lg"
  count, // optional trailing tally (act mode only)
  loading = false,
  block = false,
  onClick,
  ariaLabel,
  className = ""
}) {
  const interactive = (mode === "act" || mode === "committed") && !loading;
  const isCommittedLike = mode === "committed" || mode === "readonly";
  const showCount =
    mode === "act" && count !== null && count !== undefined && count !== "";

  const style =
    mode === "committed" && roleColor ? { "--role-color": roleColor } : undefined;

  const lead = loading ? (
    <span className="campaign-action-btn-spinner" aria-hidden="true" />
  ) : isCommittedLike ? (
    <span className="campaign-action-btn-icon" aria-hidden="true">
      <CheckCircleFilled />
    </span>
  ) : icon ? (
    <span className="campaign-action-btn-icon" aria-hidden="true">
      {icon}
    </span>
  ) : null;

  const inner = (
    <>
      {lead}
      {showCount ? <span className="campaign-action-btn-count">{count}</span> : null}
      {label ? <span className="campaign-action-btn-label">{label}</span> : null}
    </>
  );

  const classes =
    `campaign-action-btn campaign-action-btn--${mode} campaign-action-btn--${size}` +
    (block ? " campaign-action-btn--block" : "") +
    (className ? ` ${className}` : "");

  if (!interactive) {
    return (
      <span
        className={classes}
        data-accent={mode === "act" ? accent : undefined}
        style={style}
        aria-label={ariaLabel || label}
        aria-disabled="true"
      >
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      data-accent={mode === "act" ? accent : undefined}
      style={style}
      onClick={onClick}
      disabled={loading}
      aria-label={ariaLabel || label}
    >
      {inner}
    </button>
  );
}
