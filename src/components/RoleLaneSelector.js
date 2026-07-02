"use client";

import { CodeOutlined, BankOutlined, TeamOutlined } from "@ant-design/icons";

/* Three-lane role bucket — matches docs/product/roles.md (2026-06-03 restructure).
 * Backend `role` enum reconciliation is a known pending item (see
 * docs/api-requirements/applications.md). Until backend extends, these lane
 * values ship as the canonical role contract from the UI side. */

export const ROLE_LANES = [
  { value: "EVENT_PARTICIPATION", icon: TeamOutlined },
  { value: "DEVELOPMENT", icon: CodeOutlined },
  { value: "COMPANY_MANAGEMENT", icon: BankOutlined }
];

export const ROLE_LANE_VALUES = ROLE_LANES.map((lane) => lane.value);

export const SKIP_PORTFOLIO_LANE = "EVENT_PARTICIPATION";

export function RoleLaneSelector({ value, onChange, copy, pickLabel }) {
  const handleSelect = (next) => {
    if (typeof onChange === "function") {
      onChange(next);
    }
  };

  return (
    <div className="role-lane-list" role="radiogroup" aria-label={copy.legend}>
      {ROLE_LANES.map(({ value: laneValue, icon: Icon }) => {
        const laneCopy = copy.lanes[laneValue];
        const isSelected = value === laneValue;
        return (
          <button
            key={laneValue}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`role-lane-card ${isSelected ? "is-selected" : ""}`.trim()}
            onClick={() => handleSelect(laneValue)}
          >
            <span className="role-lane-card-icon" aria-hidden="true">
              <Icon />
            </span>
            <span className="role-lane-card-text">
              <span className="role-lane-card-title">{laneCopy.title}</span>
              <span className="role-lane-card-desc">{laneCopy.description}</span>
            </span>
            <span className="role-lane-card-pick">{pickLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
