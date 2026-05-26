"use client";

import { CheckCircleFilled, ClockCircleOutlined, FlagOutlined, TeamOutlined } from "@ant-design/icons";
import { Steps, Tag } from "antd";

const TIMELINE_STATUSES = ["OPEN", "EVENT_SCHEDULED", "COMPLETED"];

const TIMELINE_ICONS = {
  OPEN: <FlagOutlined />,
  EVENT_SCHEDULED: <TeamOutlined />,
  COMPLETED: <CheckCircleFilled />
};

export function IssueStatusTimeline({ status, content }) {
  if (status === "REJECTED") {
    return (
      <div className="public-issue-status-banner public-issue-status-banner-rejected">
        <Tag color="red">{content.statusLabels.REJECTED || "Rejected"}</Tag>
        <span>{content.detail.rejectedNote}</span>
      </div>
    );
  }

  if (status === "DUPLICATE") {
    return (
      <div className="public-issue-status-banner public-issue-status-banner-muted">
        <Tag>{content.statusLabels.DUPLICATE || "Duplicate"}</Tag>
        <span>{content.detail.duplicateNote}</span>
      </div>
    );
  }

  const currentIndex = TIMELINE_STATUSES.indexOf(status);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  const items = TIMELINE_STATUSES.map((key) => ({
    title: content.statusLabels[key] || key,
    icon:
      key === status && status !== "COMPLETED"
        ? <ClockCircleOutlined />
        : TIMELINE_ICONS[key]
  }));

  return (
    <div className="public-issue-status-timeline">
      <Steps
        current={safeIndex}
        items={items}
        titlePlacement="vertical"
        responsive
        size="small"
      />
    </div>
  );
}
