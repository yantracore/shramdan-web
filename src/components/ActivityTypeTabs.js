"use client";

import Link from "next/link";
import { FlagOutlined, ThunderboltFilled } from "@ant-design/icons";

// Segmented type-switch placed at the leftmost slot of the filters toolbar
// on both /issues and /events. The two surfaces are the same activity at
// different lifecycle stages; the tab reflects that the user is switching
// CONTEXT (issue ↔ event), not narrowing a filter. Renders as anchors so
// each tab keeps real URL identity for deep-links, bookmarks, and SEO.
//
// `active` is the side the user is currently on ("issue" | "event").
// Labels come from siteContent.activityTabs for bilingual support.

export function ActivityTypeTabs({ active, labels }) {
  const t = labels || {};
  return (
    <div
      className="activity-type-tabs"
      role="tablist"
      aria-label={t.ariaLabel || "Activity type"}
    >
      <Link
        href="/issues"
        role="tab"
        aria-selected={active === "issue" ? "true" : "false"}
        className={`activity-type-tab${active === "issue" ? " is-active" : ""}`}
        data-status="upcoming"
        tabIndex={active === "issue" ? 0 : -1}
      >
        <span className="activity-type-tab-icon" aria-hidden="true">
          <FlagOutlined />
        </span>
        <span className="activity-type-tab-body">
          <span className="activity-type-tab-label">
            {t.issueLabel || "Issue"}
          </span>
          <span className="activity-type-tab-sub">
            {t.issueSub || "listed"}
          </span>
        </span>
      </Link>
      <Link
        href="/events"
        role="tab"
        aria-selected={active === "event" ? "true" : "false"}
        className={`activity-type-tab${active === "event" ? " is-active" : ""}`}
        data-status="live"
        tabIndex={active === "event" ? 0 : -1}
      >
        <span className="activity-type-tab-icon" aria-hidden="true">
          <ThunderboltFilled />
        </span>
        <span className="activity-type-tab-body">
          <span className="activity-type-tab-label">
            {t.eventLabel || "Event"}
          </span>
          <span className="activity-type-tab-sub">
            {t.eventSub || "in execution"}
          </span>
        </span>
      </Link>
    </div>
  );
}
