"use client";

import { DownOutlined, FilterOutlined, ReloadOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Collapse, DatePicker, Input, Select, Slider, Tag } from "antd";
import { useMemo, useState } from "react";
import { REPORT_BUCKETS, REPORT_SECTIONS } from "@/lib/reportsApi";

const { RangePicker } = DatePicker;

const SECTION_LABELS = {
  overview: "Overview",
  users: "Users",
  issues: "Issues",
  events: "Events",
  engagement: "Engagement",
  feedback: "Feedback",
  applications: "Applications",
  uploads: "Uploads",
  geographic: "Geographic"
};

const enumOptions = (values, transform = (v) => v.replace(/_/g, " ")) =>
  values.map((value) => ({ value, label: transform(value) }));

const USER_ROLE_OPTIONS = enumOptions(["USER", "ADMIN"]);
const BOOLEAN_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" }
];
const ISSUE_STATUS_OPTIONS = enumOptions(["OPEN", "EVENT_SCHEDULED", "COMPLETED", "REJECTED", "DUPLICATE"]);
const ISSUE_CATEGORY_OPTIONS = enumOptions([
  "ROADSIDE",
  "VACANT_LAND",
  "RIVERBANK",
  "DRAINAGE",
  "PARK_PUBLIC_SPACE",
  "HIKING_TRAIL",
  "OTHER"
]);
const EVENT_STATUS_OPTIONS = enumOptions([
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED"
]);
const EVENT_RISK_OPTIONS = enumOptions(["NORMAL", "WATCH", "URGENT", "CRITICAL"]);
const EVENT_LV_OPTIONS = enumOptions(["NONE", "OPEN", "PENDING_ADMIN", "CLOSED"]);
const VOTER_ROLE_OPTIONS = enumOptions(["INTERESTED", "GOING", "WANT_TO_LEAD"]);
const FEEDBACK_TYPE_OPTIONS = enumOptions(["SUGGESTION", "BUG_REPORT", "QUESTION", "GENERAL"]);
const FEEDBACK_STATUS_OPTIONS = enumOptions(["NEW", "REVIEWED", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
const APPLICATION_ROLE_OPTIONS = enumOptions([
  "FRONTEND_DEVELOPER",
  "BACKEND_DEVELOPER",
  "UI_UX_DESIGNER",
  "GRAPHICS_DESIGNER",
  "LEGAL",
  "FINANCE",
  "DONOR",
  "COMMUNITY_MANAGER",
  "VOLUNTEER",
  "OTHER"
]);
const APPLICATION_STATUS_OPTIONS = enumOptions([
  "SUBMITTED",
  "UNDER_REVIEW",
  "SHORTLISTED",
  "ONBOARDING",
  "ACTIVE",
  "REJECTED"
]);
const UPLOAD_TYPE_OPTIONS = enumOptions(["IMAGE", "VIDEO", "DOCUMENT", "OTHER"]);
const UPLOAD_LINKED_OPTIONS = enumOptions(["issue", "event", "user", "orphan", "any"], (v) => v);

const BUCKET_OPTIONS = [
  { value: "", label: "Auto" },
  ...REPORT_BUCKETS.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))
];

const SECTION_OPTIONS = REPORT_SECTIONS.map((value) => ({
  value,
  label: SECTION_LABELS[value] || value
}));

function FilterField({ label, children }) {
  return (
    <label className="admin-report-filter-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function ReportsFilters({
  filters,
  onChange,
  onReset,
  onRefresh,
  refreshing,
  loading,
  defaultSectionsLabel = "All sections"
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const rangeValue = useMemo(() => {
    if (!filters.fromDate || !filters.toDate) return null;
    return [filters.fromDate, filters.toDate];
  }, [filters.fromDate, filters.toDate]);

  const setFilter = (key, value) => onChange({ ...filters, [key]: value });

  const handleRange = (dates) => {
    if (!dates || dates.length < 2) {
      onChange({ ...filters, fromDate: null, toDate: null });
      return;
    }
    onChange({ ...filters, fromDate: dates[0], toDate: dates[1] });
  };

  const activeFilterCount = useMemo(() => {
    const keys = Object.keys(filters);
    let count = 0;
    keys.forEach((key) => {
      if (key === "fromDate" || key === "toDate" || key === "bucket" || key === "topN" || key === "sections") return;
      const value = filters[key];
      if (value !== undefined && value !== null && value !== "") count += 1;
    });
    return count;
  }, [filters]);

  return (
    <section className="admin-report-filters" aria-label="Report filters">
      <div className="admin-report-filters-row admin-report-filters-row-primary">
        <FilterField label="Date range">
          <RangePicker
            allowClear
            onChange={handleRange}
            placeholder={["From", "To"]}
            showTime={{ format: "HH:mm" }}
            value={rangeValue}
            style={{ width: "100%" }}
          />
        </FilterField>

        <FilterField label="Bucket">
          <Select
            onChange={(value) => setFilter("bucket", value || null)}
            options={BUCKET_OPTIONS}
            placeholder="Auto"
            value={filters.bucket || ""}
            style={{ width: 140 }}
          />
        </FilterField>

        <FilterField label="Top-N size">
          <div className="admin-report-slider-cell">
            <Slider
              min={5}
              max={50}
              step={5}
              value={filters.topN || 10}
              onChange={(value) => setFilter("topN", value)}
              style={{ flex: 1 }}
            />
            <span className="admin-report-slider-readout">{filters.topN || 10}</span>
          </div>
        </FilterField>

        <FilterField label="Sections">
          <Select
            allowClear
            mode="multiple"
            maxTagCount="responsive"
            onChange={(value) => setFilter("sections", value || [])}
            options={SECTION_OPTIONS}
            placeholder={defaultSectionsLabel}
            value={filters.sections || []}
            style={{ minWidth: 220 }}
          />
        </FilterField>

        <div className="admin-report-filters-actions">
          <Button icon={<ReloadOutlined />} loading={refreshing || loading} onClick={onRefresh}>
            Refresh
          </Button>
          <Button onClick={onReset}>Reset</Button>
        </div>
      </div>

      <div className="admin-report-filters-toggle">
        <Button
          icon={advancedOpen ? <UpOutlined /> : <DownOutlined />}
          onClick={() => setAdvancedOpen((v) => !v)}
          type="text"
        >
          {advancedOpen ? "Hide advanced filters" : "Show advanced filters"}
        </Button>
        {activeFilterCount > 0 ? (
          <Tag color="green" icon={<FilterOutlined />}>
            {activeFilterCount} advanced filter{activeFilterCount === 1 ? "" : "s"} active
          </Tag>
        ) : null}
      </div>

      {advancedOpen ? (
        <Collapse
          defaultActiveKey={["geo", "users", "issues", "events"]}
          ghost
          items={[
            {
              key: "geo",
              label: "Geographic",
              children: (
                <div className="admin-report-filters-grid">
                  <FilterField label="Municipality">
                    <Input
                      allowClear
                      onChange={(e) => setFilter("municipality", e.target.value)}
                      placeholder="e.g. Pokhara Metropolitan City"
                      value={filters.municipality || ""}
                    />
                  </FilterField>
                  <FilterField label="Ward (requires municipality)">
                    <Input
                      allowClear
                      disabled={!filters.municipality}
                      onChange={(e) => setFilter("ward", e.target.value)}
                      placeholder="e.g. 12"
                      value={filters.ward || ""}
                    />
                  </FilterField>
                </div>
              )
            },
            {
              key: "users",
              label: "Users",
              children: (
                <div className="admin-report-filters-grid">
                  <FilterField label="Role">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("userRole", value || null)}
                      options={USER_ROLE_OPTIONS}
                      placeholder="Any"
                      value={filters.userRole || undefined}
                    />
                  </FilterField>
                  <FilterField label="Phone verified">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("userVerified", value || null)}
                      options={BOOLEAN_OPTIONS}
                      placeholder="Any"
                      value={filters.userVerified || undefined}
                    />
                  </FilterField>
                  <FilterField label="OAuth signup">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("userIsOAuth", value || null)}
                      options={BOOLEAN_OPTIONS}
                      placeholder="Any"
                      value={filters.userIsOAuth || undefined}
                    />
                  </FilterField>
                </div>
              )
            },
            {
              key: "issues",
              label: "Issues",
              children: (
                <div className="admin-report-filters-grid">
                  <FilterField label="Status">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("issueStatus", value || null)}
                      options={ISSUE_STATUS_OPTIONS}
                      placeholder="Any"
                      value={filters.issueStatus || undefined}
                    />
                  </FilterField>
                  <FilterField label="Category">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("issueCategory", value || null)}
                      options={ISSUE_CATEGORY_OPTIONS}
                      placeholder="Any"
                      value={filters.issueCategory || undefined}
                    />
                  </FilterField>
                </div>
              )
            },
            {
              key: "events",
              label: "Events",
              children: (
                <div className="admin-report-filters-grid">
                  <FilterField label="Status">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("eventStatus", value || null)}
                      options={EVENT_STATUS_OPTIONS}
                      placeholder="Any"
                      value={filters.eventStatus || undefined}
                    />
                  </FilterField>
                  <FilterField label="Risk level">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("eventRiskLevel", value || null)}
                      options={EVENT_RISK_OPTIONS}
                      placeholder="Any"
                      value={filters.eventRiskLevel || undefined}
                    />
                  </FilterField>
                  <FilterField label="Leader voting">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("eventLeaderVotingStatus", value || null)}
                      options={EVENT_LV_OPTIONS}
                      placeholder="Any"
                      value={filters.eventLeaderVotingStatus || undefined}
                    />
                  </FilterField>
                </div>
              )
            },
            {
              key: "engagement",
              label: "Engagement",
              children: (
                <div className="admin-report-filters-grid">
                  <FilterField label="Voter commitment">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("voterRole", value || null)}
                      options={VOTER_ROLE_OPTIONS}
                      placeholder="Any"
                      value={filters.voterRole || undefined}
                    />
                  </FilterField>
                </div>
              )
            },
            {
              key: "feedback",
              label: "Feedback",
              children: (
                <div className="admin-report-filters-grid">
                  <FilterField label="Type">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("feedbackType", value || null)}
                      options={FEEDBACK_TYPE_OPTIONS}
                      placeholder="Any"
                      value={filters.feedbackType || undefined}
                    />
                  </FilterField>
                  <FilterField label="Status">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("feedbackStatus", value || null)}
                      options={FEEDBACK_STATUS_OPTIONS}
                      placeholder="Any"
                      value={filters.feedbackStatus || undefined}
                    />
                  </FilterField>
                </div>
              )
            },
            {
              key: "applications",
              label: "Applications",
              children: (
                <div className="admin-report-filters-grid">
                  <FilterField label="Applied role">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("applicationRole", value || null)}
                      options={APPLICATION_ROLE_OPTIONS}
                      placeholder="Any"
                      value={filters.applicationRole || undefined}
                    />
                  </FilterField>
                  <FilterField label="Funnel stage">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("applicationStatus", value || null)}
                      options={APPLICATION_STATUS_OPTIONS}
                      placeholder="Any"
                      value={filters.applicationStatus || undefined}
                    />
                  </FilterField>
                </div>
              )
            },
            {
              key: "uploads",
              label: "Uploads",
              children: (
                <div className="admin-report-filters-grid">
                  <FilterField label="File type">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("uploadFileType", value || null)}
                      options={UPLOAD_TYPE_OPTIONS}
                      placeholder="Any"
                      value={filters.uploadFileType || undefined}
                    />
                  </FilterField>
                  <FilterField label="Confirmed">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("uploadIsConfirmed", value || null)}
                      options={BOOLEAN_OPTIONS}
                      placeholder="Any"
                      value={filters.uploadIsConfirmed || undefined}
                    />
                  </FilterField>
                  <FilterField label="Linked to">
                    <Select
                      allowClear
                      onChange={(value) => setFilter("uploadLinkedTo", value || null)}
                      options={UPLOAD_LINKED_OPTIONS}
                      placeholder="Any"
                      value={filters.uploadLinkedTo || undefined}
                    />
                  </FilterField>
                </div>
              )
            }
          ]}
        />
      ) : null}
    </section>
  );
}
