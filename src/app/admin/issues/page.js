"use client";

import {
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  PlusOutlined,
  RiseOutlined
} from "@ant-design/icons";
import { Button, Empty, Select, Table, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { AdminResponsiveList } from "@/components/AdminResponsiveList";
import { AdminShell } from "@/components/AdminShell";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import {
  ISSUE_CATEGORIES,
  ISSUE_STATUSES,
  ISSUE_STATUS_COLORS,
  buildEnumOptions,
  formatDate,
  formatEnum,
  getIssueCoverImageUrl,
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

  const statusOptions = useMemo(() => buildEnumOptions(ISSUE_STATUSES), []);
  const categoryOptions = useMemo(() => buildEnumOptions(ISSUE_CATEGORIES), []);

  const columns = [
    {
      title: "Issue",
      dataIndex: "title",
      key: "title",
      render: (_, issue) => {
        const coverUrl = getIssueCoverImageUrl(issue);
        return (
          <Link className="admin-issue-row admin-issue-row-link" href={`/admin/issues/${issue.id}/view`}>
            <div className="admin-issue-thumb" aria-hidden={!coverUrl}>
              {coverUrl ? (
                <Image alt="" height={56} src={coverUrl} unoptimized width={56} />
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
          </Link>
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
          <Link href={`/admin/issues/${issue.id}/view`}>
            <Button icon={<EyeOutlined />}>View</Button>
          </Link>
          <Link href={`/admin/issues/${issue.id}/edit`}>
            <Button icon={<EditOutlined />}>Edit</Button>
          </Link>
        </div>
      )
    }
  ];

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
            const cardCoverUrl = getIssueCoverImageUrl(issue);
            return (
            <AdminListCard
              key={issue.id}
              header={
                <>
                  <div className="admin-list-card-title">
                    <Link className="admin-issue-row admin-issue-row-link" href={`/admin/issues/${issue.id}/view`}>
                      <div className="admin-issue-thumb" aria-hidden={!cardCoverUrl}>
                        {cardCoverUrl ? (
                          <Image alt="" height={56} src={cardCoverUrl} unoptimized width={56} />
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
                    </Link>
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
                  <Link href={`/admin/issues/${issue.id}/view`}>
                    <Button icon={<EyeOutlined />}>View</Button>
                  </Link>
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
    </AdminShell>
  );
}
