"use client";

import { CheckOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Empty, Popconfirm, Table, Tag } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminResponsiveList } from "@/components/AdminResponsiveList";
import { AdminShell } from "@/components/AdminShell";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import {
  adminRemoveComment,
  approveFlaggedComment,
  listAllFlaggedComments
} from "@/lib/comments";
import { useToast } from "@/lib/toast";

const REASON_LABEL = {
  spam: "Spam",
  abuse: "Abuse",
  offtopic: "Off-topic",
  other: "Other"
};

function formatTargetLink(row) {
  const path =
    row.targetType === "event" ? `/events/${row.targetId}` : `/issues/${row.targetId}`;
  return (
    <Link href={path} target="_blank" rel="noreferrer">
      <Tag color={row.targetType === "event" ? "geekblue" : "magenta"}>
        {row.targetType}
      </Tag>
      <span className="admin-comment-target-id">{row.targetId}</span>
    </Link>
  );
}

function formatRelative(iso) {
  if (!iso) return "—";
  try {
    const ms = Date.now() - Date.parse(iso);
    const min = Math.floor(ms / 60_000);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.floor(hr / 24)}d ago`;
  } catch {
    return "—";
  }
}

export default function AdminCommentsPage() {
  const messageApi = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    // listAllFlaggedComments walks localStorage which is sync — the
    // setTimeout(0) just yields a tick so the loading spinner can
    // actually paint between clicks.
    window.setTimeout(() => {
      setRows(listAllFlaggedComments());
      setLoading(false);
    }, 0);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const handleApprove = useCallback(
    (row) => {
      setActingId(row.commentId);
      const ok = approveFlaggedComment({
        targetType: row.targetType,
        targetId: row.targetId,
        commentId: row.commentId
      });
      setActingId(null);
      if (ok) {
        messageApi.success("Flags cleared.");
        refresh();
      } else {
        messageApi.error("Could not clear flags.");
      }
    },
    [messageApi, refresh]
  );

  const handleRemove = useCallback(
    (row) => {
      setActingId(row.commentId);
      const ok = adminRemoveComment({
        targetType: row.targetType,
        targetId: row.targetId,
        commentId: row.commentId
      });
      setActingId(null);
      if (ok) {
        messageApi.success("Comment removed.");
        refresh();
      } else {
        messageApi.error("Could not remove comment.");
      }
    },
    [messageApi, refresh]
  );

  const columns = useMemo(
    () => [
      {
        title: "Target",
        dataIndex: "targetType",
        key: "target",
        width: 220,
        render: (_, row) => formatTargetLink(row)
      },
      {
        title: "Author",
        dataIndex: ["comment", "author", "name"],
        key: "author",
        render: (_, row) => (
          <div className="admin-applicant-cell">
            <strong>{row.comment?.author?.name || "—"}</strong>
            <span>{row.comment?.author?.role || "—"}</span>
          </div>
        )
      },
      {
        title: "Excerpt",
        dataIndex: ["comment", "text"],
        key: "excerpt",
        render: (text) => (
          <p className="admin-table-note">
            {String(text || "").slice(0, 180)}
            {String(text || "").length > 180 ? "…" : ""}
          </p>
        )
      },
      {
        title: "Flags",
        dataIndex: "flagCount",
        key: "flagCount",
        width: 90,
        sorter: (a, b) => a.flagCount - b.flagCount,
        defaultSortOrder: "descend",
        render: (count) => <Tag color={count >= 3 ? "red" : "orange"}>{count}</Tag>
      },
      {
        title: "Actions",
        key: "actions",
        width: 240,
        render: (_, row) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Popconfirm
              title="Clear all flags on this comment?"
              okText="Approve"
              onConfirm={() => handleApprove(row)}
            >
              <Button
                icon={<CheckOutlined />}
                loading={actingId === row.commentId}
              >
                Approve
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Remove this comment? This is a soft delete."
              okButtonProps={{ danger: true }}
              okText="Remove"
              onConfirm={() => handleRemove(row)}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={actingId === row.commentId}
              >
                Remove
              </Button>
            </Popconfirm>
          </div>
        )
      }
    ],
    [actingId, handleApprove, handleRemove]
  );

  const renderReports = (row) => (
    <div className="admin-row-detail">
      <strong>Reports</strong>
      <ul style={{ marginTop: 6, paddingLeft: 16 }}>
        {row.reports.map((r, i) => (
          <li key={i}>
            <Tag>{REASON_LABEL[r.reason] || r.reason}</Tag>
            <span style={{ marginRight: 8 }}>{formatRelative(r.at)}</span>
            {r.note ? <em>“{r.note}”</em> : null}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <AdminShell title="Comments">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Moderation"
          title="Flagged comments"
          description="Approve clears the flags. Remove soft-deletes the comment site-wide."
          onRefresh={refresh}
          refreshing={loading}
        />

        <AdminResponsiveList
          ariaLabel="Flagged comments list"
          emptyDescription="No flagged comments. Quiet day."
          isEmpty={rows.length === 0}
          loading={loading}
          loadingLabel="Loading flagged comments..."
          table={
            <Table
              columns={columns}
              dataSource={rows}
              expandable={{
                expandedRowRender: renderReports
              }}
              locale={{
                emptyText: <Empty description="No flagged comments." />
              }}
              loading={loading}
              pagination={{ pageSize: 12 }}
              rowKey={(r) => `${r.targetType}:${r.targetId}:${r.commentId}`}
            />
          }
        />
      </section>
    </AdminShell>
  );
}
