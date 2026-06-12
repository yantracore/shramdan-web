"use client";

import { AppstoreOutlined, EnvironmentOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Segmented } from "antd";

// Three-way view switch placed at the right of the activity-type tabs row on
// both /issues and /events. Lets the user toggle how the page lays out the
// same dataset: a list-with-preview (current default), a full-bleed map, or
// a thumbnail grid. The control is shared so the two surfaces stay visually
// identical.
//
// `value` is the current view mode ("list-preview" | "map" | "thumbnails").
// `onChange` receives the next mode string.
// `labels` carries localized strings: { listPreview, map, thumbnails, ariaLabel }.
export function ViewSwitch({
  value,
  onChange,
  labels
}) {
  const t = labels || {};
  return (
    <div
      className="public-issues-view-switch"
      role="group"
      aria-label={t.ariaLabel || "View mode"}
    >
      <Segmented
        size="middle"
        value={value}
        onChange={onChange}
        options={[
          {
            value: "list-preview",
            label: (
              <span className="public-issues-view-switch-option">
                <UnorderedListOutlined aria-hidden="true" />
                <span className="public-issues-view-switch-label">
                  {t.listPreview || "List"}
                </span>
              </span>
            )
          },
          {
            value: "map",
            label: (
              <span className="public-issues-view-switch-option">
                <EnvironmentOutlined aria-hidden="true" />
                <span className="public-issues-view-switch-label">
                  {t.map || "Map"}
                </span>
              </span>
            )
          },
          {
            value: "thumbnails",
            label: (
              <span className="public-issues-view-switch-option">
                <AppstoreOutlined aria-hidden="true" />
                <span className="public-issues-view-switch-label">
                  {t.thumbnails || "Thumbnails"}
                </span>
              </span>
            )
          }
        ]}
      />
    </div>
  );
}
