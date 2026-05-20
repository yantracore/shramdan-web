"use client";

import { ReloadOutlined } from "@ant-design/icons";
import { Button } from "antd";

export function AdminPanelHeading({ eyebrow, title, description, onRefresh, refreshing }) {
  return (
    <div className="admin-panel-heading">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {onRefresh ? (
        <Button icon={<ReloadOutlined />} loading={refreshing} onClick={onRefresh}>
          Refresh
        </Button>
      ) : null}
    </div>
  );
}
