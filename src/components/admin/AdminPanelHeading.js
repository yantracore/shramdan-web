"use client";

import { ReloadOutlined } from "@ant-design/icons";
import { Button } from "antd";

export function AdminPanelHeading({
  eyebrow,
  title,
  description,
  onRefresh,
  refreshing,
  actions
}) {
  const hasRefresh = Boolean(onRefresh);
  const hasActions = Boolean(actions);

  return (
    <div className="admin-panel-heading">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {hasRefresh || hasActions ? (
        <div className="admin-panel-heading-actions">
          {hasRefresh ? (
            <Button icon={<ReloadOutlined />} loading={refreshing} onClick={onRefresh}>
              Refresh
            </Button>
          ) : null}
          {actions}
        </div>
      ) : null}
    </div>
  );
}
