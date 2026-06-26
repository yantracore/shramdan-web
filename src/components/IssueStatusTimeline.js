"use client";

import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FireFilled,
  FlagOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Steps, Tag } from "antd";
import { campaignStatusLabel } from "@/lib/campaignStatus";

// The lifecycle a citizen actually follows, unified across the issue AND its
// promoted event. The issue's own status is coarse (OPEN → EVENT_SCHEDULED →
// COMPLETED); once promoted, the LINKED EVENT's status carries the real
// granularity (DRAFT → SCHEDULED → ACTIVE → COMPLETED). We fold both into one
// five-step journey so the timeline tells the whole story end to end.
const STEP_KEYS = ["OPEN", "DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED"];

const STEP_ICONS = {
  OPEN: <FlagOutlined />,
  DRAFT: <TeamOutlined />,
  SCHEDULED: <CalendarOutlined />,
  ACTIVE: <FireFilled />,
  COMPLETED: <CheckCircleFilled />
};

const STEP_COPY = {
  np: { cancelledNote: "यो अभियान रद्द गरियो।" },
  en: { cancelledNote: "This campaign was cancelled." }
};

// Map (issueStatus, eventStatus) → index of the current step. The issue read
// only knows OPEN / EVENT_SCHEDULED / COMPLETED; the finer DRAFT→SCHEDULED→
// ACTIVE granularity rides in on the linked event's status (resolved client-
// side — see resolveEventForIssue). Until that resolves, EVENT_SCHEDULED parks
// at "forming", which is the earliest post-promotion step.
function resolveStepIndex(status, eventStatus) {
  if (status === "COMPLETED") return 4;
  if (status === "OPEN") return 0;
  if (status === "EVENT_SCHEDULED") {
    switch (eventStatus) {
      case "COMPLETED":
        return 4;
      case "ACTIVE":
      case "PAUSED":
        return 3;
      case "SCHEDULED":
        return 2;
      case "DRAFT":
      default:
        return 1;
    }
  }
  return 0;
}

export function IssueStatusTimeline({ status, eventStatus, content, language = "np" }) {
  const t = STEP_COPY[language] || STEP_COPY.np;

  // Off-path terminal states get a banner instead of the progress rail.
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

  // The campaign was promoted but then called off — show why the rail stops,
  // rather than leaving it stranded mid-journey.
  if (eventStatus === "CANCELLED") {
    return (
      <div className="public-issue-status-banner public-issue-status-banner-rejected">
        <Tag color="red">{language === "np" ? "रद्द" : "Cancelled"}</Tag>
        <span>{t.cancelledNote}</span>
      </div>
    );
  }

  const current = resolveStepIndex(status, eventStatus);

  const items = STEP_KEYS.map((key, index) => ({
    title: campaignStatusLabel(key, language),
    // The current, non-final step wears the in-progress clock; everything else
    // shows its own milestone icon.
    icon:
      index === current && current !== 4 ? <ClockCircleOutlined /> : STEP_ICONS[key]
  }));

  return (
    <div className="public-issue-status-timeline">
      <Steps
        current={current}
        items={items}
        titlePlacement="vertical"
        responsive
        size="small"
      />
    </div>
  );
}
