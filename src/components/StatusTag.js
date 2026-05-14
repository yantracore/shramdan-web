import { Tag } from "antd";
import { statusMeta } from "@/data/mockData";

export function StatusTag({ status, compact = false }) {
  const meta = statusMeta[status] ?? statusMeta.Listed;

  return (
    <Tag className={compact ? "status-tag status-tag-compact" : "status-tag"} color={meta.color}>
      {compact ? meta.label.charAt(0) : meta.label}
    </Tag>
  );
}
