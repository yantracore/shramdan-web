"use client";

import {
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  PlusOutlined,
  RiseOutlined
} from "@ant-design/icons";
import { Button, Empty, Modal, Select, Spin, Table, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminResponsiveList } from "@/components/AdminResponsiveList";
import { AdminShell } from "@/components/AdminShell";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { getJson } from "@/lib/apiClient";
import {
  ISSUE_CATEGORIES,
  ISSUE_STATUSES,
  ISSUE_STATUS_COLORS,
  buildEnumOptions,
  formatCoordinates,
  formatDate,
  formatEnum,
  getFirstIssueImage,
  getListItems
} from "@/lib/adminUtils";
import { useAdminListResource } from "@/hooks/useAdminListResource";

const issueSorts = [
  { label: "Most votes", value: "voteCount" },
  { label: "Newest first", value: "createdAt" }
];

const ISSUE_EXTRA_PARAMS = { limit: 100 };

export default function AdminIssuesPage() {
  const {
    items: issues,
    loading: loadingIssues,
    error: issueError,
    filters,
    setFilter,
    refetch: fetchIssues
  } = useAdminListResource({
    path: "/issues",
    initialFilters: { sort: "voteCount" },
    extraParams: ISSUE_EXTRA_PARAMS,
    parseList: getListItems,
    errorMessage: "Could not load issues."
  });

  const [detailIssue, setDetailIssue] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const statusOptions = useMemo(() => buildEnumOptions(ISSUE_STATUSES), []);
  const categoryOptions = useMemo(() => buildEnumOptions(ISSUE_CATEGORIES), []);

  const openDetailModal = async (issue) => {
    setDetailIssue(issue);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await getJson(`/issues/${issue.id}`, { requireAuth: true });
      const fullIssue = response?.data ?? issue;
      setDetailIssue(fullIssue);
    } catch (error) {
      setDetailError(error.message || "Could not load issue detail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetailModal = () => {
    setDetailIssue(null);
    setDetailError("");
    setDetailLoading(false);
  };

  const columns = [
    {
      title: "Issue",
      dataIndex: "title",
      key: "title",
      render: (_, issue) => {
        const cover = getFirstIssueImage(issue);
        return (
          <div className="admin-issue-row">
            <div className="admin-issue-thumb" aria-hidden={!cover}>
              {cover ? (
                <Image alt="" height={56} src={cover.url} unoptimized width={56} />
              ) : (
                <span className="admin-issue-thumb-placeholder">
                  <EnvironmentOutlined />
                </span>
              )}
            </div>
            <div className="admin-applicant-cell">
              <strong>{issue.title}</strong>
              <span>
                <EnvironmentOutlined /> {issue.addressText}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag>{formatEnum(category)}</Tag>
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={ISSUE_STATUS_COLORS[status]}>{formatEnum(status)}</Tag>
    },
    {
      title: "Votes",
      dataIndex: "voteCount",
      key: "voteCount",
      render: (voteCount) => (
        <span className="admin-vote-count">
          <RiseOutlined /> {voteCount ?? 0}
        </span>
      )
    },
    {
      title: "Reported",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => <span>{formatDate(createdAt)}</span>
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, issue) => (
        <div className="admin-row-actions">
          <Button icon={<EyeOutlined />} onClick={() => openDetailModal(issue)}>
            View detail
          </Button>
          <Link href={`/admin/issues/${issue.id}/edit`}>
            <Button icon={<EditOutlined />}>Edit</Button>
          </Link>
        </div>
      )
    }
  ];

  const detailUploads = Array.isArray(detailIssue?.uploads) ? detailIssue.uploads : [];

  return (
    <AdminShell title="Issues">
      <section className="admin-panel">
        <AdminPanelHeading
          eyebrow="Community issues"
          title="Issues"
          description="Monitor reported issues, their categories, vote counts, and current lifecycle status."
          onRefresh={fetchIssues}
          refreshing={loadingIssues}
          actions={
            <Link href="/admin/issues/create">
              <Button type="primary" icon={<PlusOutlined />}>
                Create issue
              </Button>
            </Link>
          }
        />

        <AdminFilters>
          <Select
            allowClear
            onChange={(value) => setFilter("status", value)}
            options={statusOptions}
            placeholder="Filter by status"
            value={filters.status}
          />
          <Select
            allowClear
            onChange={(value) => setFilter("category", value)}
            options={categoryOptions}
            placeholder="Filter by category"
            value={filters.category}
          />
          <Select
            onChange={(value) => setFilter("sort", value)}
            options={issueSorts}
            placeholder="Sort by"
            value={filters.sort}
          />
        </AdminFilters>

        {issueError ? <p className="admin-error-text">{issueError}</p> : null}

        <AdminResponsiveList
          ariaLabel="Issues list"
          emptyDescription={issueError ? "Issues could not be loaded." : "No issues found."}
          isEmpty={issues.length === 0}
          loading={loadingIssues}
          loadingLabel="Loading issues..."
          table={
            <Table
              columns={columns}
              dataSource={issues}
              locale={{
                emptyText: (
                  <Empty
                    description={issueError ? "Issues could not be loaded." : "No issues found."}
                  />
                )
              }}
              loading={loadingIssues}
              pagination={{ pageSize: 8 }}
              rowKey="id"
              scroll={{ x: 980 }}
            />
          }
        >
          {issues.map((issue) => {
            const cardCover = getFirstIssueImage(issue);
            return (
            <AdminListCard
              key={issue.id}
              header={
                <>
                  <div className="admin-list-card-title">
                    <div className="admin-issue-row">
                      <div className="admin-issue-thumb" aria-hidden={!cardCover}>
                        {cardCover ? (
                          <Image alt="" height={56} src={cardCover.url} unoptimized width={56} />
                        ) : (
                          <span className="admin-issue-thumb-placeholder">
                            <EnvironmentOutlined />
                          </span>
                        )}
                      </div>
                      <div>
                        <strong>{issue.title}</strong>
                        <span>
                          <EnvironmentOutlined /> {issue.addressText}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Tag color={ISSUE_STATUS_COLORS[issue.status]}>{formatEnum(issue.status)}</Tag>
                </>
              }
              detail={
                <>
                  <p>
                    <strong>Category:</strong> {formatEnum(issue.category)}
                  </p>
                  <p>
                    <strong>Votes:</strong> {issue.voteCount ?? 0}
                  </p>
                  <p>
                    <strong>Reported:</strong> {formatDate(issue.createdAt)}
                  </p>
                </>
              }
              actions={
                <div className="admin-row-actions">
                  <Button icon={<EyeOutlined />} onClick={() => openDetailModal(issue)}>
                    View detail
                  </Button>
                  <Link href={`/admin/issues/${issue.id}/edit`}>
                    <Button icon={<EditOutlined />}>Edit</Button>
                  </Link>
                </div>
              }
            />
            );
          })}
        </AdminResponsiveList>
      </section>

      <Modal
        footer={null}
        onCancel={closeDetailModal}
        open={Boolean(detailIssue)}
        title={detailIssue ? detailIssue.title : "Issue detail"}
        width={640}
      >
        {detailLoading ? (
          <div className="admin-modal-loading">
            <Spin />
          </div>
        ) : null}

        {detailError ? <p className="admin-error-text">{detailError}</p> : null}

        {detailIssue && !detailLoading ? (
          <div className="admin-modal-body">
            <div className="admin-modal-tags">
              <Tag>{formatEnum(detailIssue.category)}</Tag>
              <Tag color={ISSUE_STATUS_COLORS[detailIssue.status]}>
                {formatEnum(detailIssue.status)}
              </Tag>
              <Tag>
                <RiseOutlined /> {detailIssue.voteCount ?? 0} votes
              </Tag>
            </div>

            {detailIssue.description ? (
              <p className="admin-modal-description">{detailIssue.description}</p>
            ) : null}

            <dl className="admin-modal-meta">
              <dt>Address</dt>
              <dd>{detailIssue.addressText || "—"}</dd>

              {detailIssue.municipality ? (
                <>
                  <dt>Municipality</dt>
                  <dd>{detailIssue.municipality}</dd>
                </>
              ) : null}

              {detailIssue.ward ? (
                <>
                  <dt>Ward</dt>
                  <dd>{detailIssue.ward}</dd>
                </>
              ) : null}

              <dt>Coordinates</dt>
              <dd>{formatCoordinates(detailIssue.latitude, detailIssue.longitude) || "—"}</dd>

              <dt>Reported</dt>
              <dd>{formatDate(detailIssue.createdAt) || "—"}</dd>

              {detailIssue.reporter?.name ? (
                <>
                  <dt>Reporter</dt>
                  <dd>{detailIssue.reporter.name}</dd>
                </>
              ) : null}
            </dl>

            {detailUploads.length > 0 ? (
              <div className="admin-modal-uploads">
                <strong>Attached uploads</strong>
                <ul>
                  {detailUploads.map((upload) => (
                    <li key={upload.id || upload.url}>
                      <a href={upload.url} rel="noreferrer" target="_blank">
                        {upload.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </AdminShell>
  );
}
