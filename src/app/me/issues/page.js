"use client";

// /me/issues — the member's own reported issues ("My issues").
// Mirrors the admin All-Issues listing (same Table / responsive cards),
// but scoped to GET /issues/me, rendered inside the bilingual public
// SiteShell, and member-gated (any signed-in user, not admin-only).
//
// CRUD reality enforced by the backend:
//   Create → /issues/new (already exists)
//   Read   → GET /issues/me (this page) + public detail /issues/{id}
//   Update → PATCH /issues/{id}, author-only AND only while status OPEN
//   Delete → MODERATOR/ADMIN hard-delete; the author's own soft-takedown is
//            POST /issues/{id}/withdraw (OPEN only, shipped 2026-07-01).
// So OPEN issues get Edit + Withdraw; everything else is view-only.

import {
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  PlusOutlined,
  RiseOutlined,
  StopOutlined
} from "@ant-design/icons";
import { Button, Empty, Popconfirm, Select, Table, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { withdrawIssue } from "@/lib/apiClient";
import { useToast } from "@/lib/toast";
import { AdminResponsiveList } from "@/components/AdminResponsiveList";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { AdminListCard } from "@/components/admin/AdminListCard";
import { AdminPanelHeading } from "@/components/admin/AdminPanelHeading";
import { EmptyState } from "@/components/EmptyState";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import {
  ISSUE_CATEGORIES,
  ISSUE_STATUSES,
  ISSUE_STATUS_COLORS,
  formatEnum,
  getIssueCoverImageUrl,
  getListItems,
  localizeIssue
} from "@/lib/adminUtils";
import { categoryOptionLabel } from "@/lib/categoryIcons";
import { copy } from "@/lib/siteContent";
import { useAdminListResource } from "@/hooks/useAdminListResource";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const str = String(value ?? "");
  return language === "np" ? str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]) : str;
}

function formatDate(iso, language) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

const COPY = {
  np: {
    pageTitle: "मेरा समस्याहरू",
    eyebrow: "मेरो योगदान",
    title: "तपाईंले उठाएका समस्याहरू",
    description:
      "तपाईंले दर्ता गराएका समस्याहरू यहाँ छन्। समस्या OPEN रहेसम्म आफैले सम्पादन गर्न सकिन्छ।",
    reportCta: "नयाँ समस्या उठाउने",
    empty: "तपाईंले अहिलेसम्म कुनै समस्या उठाउनुभएको छैन।",
    emptyCta: "पहिलो समस्या उठाउने",
    loadError: "समस्याहरू लोड गर्न सकिएन।",
    filterStatus: "स्थिति अनुसार छान्नुहोस्",
    filterCategory: "वर्ग अनुसार छान्नुहोस्",
    sortBy: "क्रमबद्ध गर्नुहोस्",
    sortNewest: "नयाँ पहिले",
    sortVotes: "धेरै समर्थन",
    colIssue: "समस्या",
    colCategory: "वर्ग",
    colStatus: "स्थिति",
    colVotes: "समर्थन",
    colReported: "दर्ता मिति",
    colActions: "कार्य",
    view: "हेर्ने",
    edit: "सम्पादन",
    editLockedTip: "OPEN रहेको समस्या मात्र सम्पादन गर्न मिल्छ।",
    withdraw: "फिर्ता लिने",
    withdrawConfirm: "यो समस्या फिर्ता लिने? यो कार्य उल्टाउन मिल्दैन।",
    withdrawOk: "फिर्ता लिने",
    withdrawCancel: "रद्द",
    withdrawn: "समस्या फिर्ता लियो।",
    withdrawError: "फिर्ता लिन सकिएन। फेरि प्रयास गर्नुहोस्।",
    statusLabels: {
      OPEN: "खुला",
      EVENT_SCHEDULED: "कार्यक्रम तय",
      COMPLETED: "सम्पन्न",
      REJECTED: "अस्वीकृत",
      DUPLICATE: "नक्कल"
    }
  },
  en: {
    pageTitle: "My issues",
    eyebrow: "My contributions",
    title: "Issues you've reported",
    description:
      "Issues you've reported live here. You can edit your own issue while it is still OPEN.",
    reportCta: "Report new issue",
    empty: "You haven't reported any issues yet.",
    emptyCta: "Report your first issue",
    loadError: "Could not load issues.",
    filterStatus: "Filter by status",
    filterCategory: "Filter by category",
    sortBy: "Sort by",
    sortNewest: "Newest first",
    sortVotes: "Most votes",
    colIssue: "Issue",
    colCategory: "Category",
    colStatus: "Status",
    colVotes: "Votes",
    colReported: "Reported",
    colActions: "Actions",
    view: "View",
    edit: "Edit",
    editLockedTip: "Only an OPEN issue can be edited.",
    withdraw: "Withdraw",
    withdrawConfirm: "Withdraw this issue? This can't be undone.",
    withdrawOk: "Withdraw",
    withdrawCancel: "Cancel",
    withdrawn: "Issue withdrawn.",
    withdrawError: "Could not withdraw. Please try again.",
    statusLabels: {
      OPEN: "Open",
      EVENT_SCHEDULED: "Event scheduled",
      COMPLETED: "Completed",
      REJECTED: "Rejected",
      DUPLICATE: "Duplicate"
    }
  }
};

const MY_ISSUES_EXTRA_PARAMS = { limit: 100 };

export default function MeIssuesPage() {
  const router = useRouter();
  const { language } = usePreferences();
  const t = COPY[language] || COPY.np;
  const categoryCopy = copy[language]?.issueNew?.categories || {};

  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const sessionResolved = typeof window !== "undefined";
  const messageApi = useToast();
  const [withdrawingId, setWithdrawingId] = useState(null);

  const {
    items: rawIssues,
    loading,
    error,
    filters,
    setFilter,
    refetch
  } = useAdminListResource({
    path: "/issues/me",
    initialFilters: { sort: "createdAt" },
    extraParams: MY_ISSUES_EXTRA_PARAMS,
    parseList: getListItems,
    errorMessage: t.loadError
  });

  const issues = useMemo(
    () => rawIssues.map((issue) => localizeIssue(issue, language)),
    [rawIssues, language]
  );

  const categoryLabel = (value) => categoryCopy[value] || formatEnum(value);
  const statusLabel = (value) => t.statusLabels[value] || formatEnum(value);
  const issueHref = (issue) => `/issues/${issue.slug ?? issue.id}`;

  const statusOptions = useMemo(
    () => ISSUE_STATUSES.map((value) => ({ value, label: statusLabel(value) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );
  const categoryOptions = useMemo(
    () =>
      ISSUE_CATEGORIES.map((value) => ({
        value,
        label: categoryOptionLabel(value, categoryLabel(value))
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );
  const sortOptions = useMemo(
    () => [
      { label: t.sortNewest, value: "createdAt" },
      { label: t.sortVotes, value: "voteCount" }
    ],
    [t.sortNewest, t.sortVotes]
  );

  useEffect(() => {
    if (sessionResolved && !session) {
      router.replace(buildLoginHref("/me/issues"));
    }
  }, [router, session, sessionResolved]);

  const handleWithdraw = async (issue) => {
    setWithdrawingId(issue.id);
    try {
      await withdrawIssue(issue.id);
      messageApi.success(t.withdrawn);
      refetch();
    } catch (err) {
      messageApi.error(err?.message || t.withdrawError);
    } finally {
      setWithdrawingId(null);
    }
  };

  const renderActions = (issue) => (
    <div className="admin-row-actions">
      <Link href={issueHref(issue)}>
        <Button icon={<EyeOutlined />}>{t.view}</Button>
      </Link>
      {issue.status === "OPEN" ? (
        <>
          <Link href={`/me/issues/${issue.id}/edit`}>
            <Button icon={<EditOutlined />}>{t.edit}</Button>
          </Link>
          <Popconfirm
            title={t.withdrawConfirm}
            okText={t.withdrawOk}
            cancelText={t.withdrawCancel}
            okButtonProps={{ danger: true }}
            onConfirm={() => handleWithdraw(issue)}
          >
            <Button danger icon={<StopOutlined />} loading={withdrawingId === issue.id}>
              {t.withdraw}
            </Button>
          </Popconfirm>
        </>
      ) : (
        <Button icon={<EditOutlined />} disabled title={t.editLockedTip}>
          {t.edit}
        </Button>
      )}
    </div>
  );

  const columns = [
    {
      title: t.colIssue,
      dataIndex: "title",
      key: "title",
      render: (_, issue) => {
        const coverUrl = getIssueCoverImageUrl(issue);
        return (
          <Link className="admin-issue-row admin-issue-row-link" href={issueHref(issue)}>
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
      title: t.colCategory,
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag>{categoryLabel(category)}</Tag>
    },
    {
      title: t.colStatus,
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color={ISSUE_STATUS_COLORS[status]}>{statusLabel(status)}</Tag>
    },
    {
      title: t.colVotes,
      dataIndex: "voteCount",
      key: "voteCount",
      render: (voteCount) => (
        <span className="admin-vote-count">
          <RiseOutlined /> {localizeDigits(voteCount ?? 0, language)}
        </span>
      )
    },
    {
      title: t.colReported,
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => <span>{formatDate(createdAt, language)}</span>
    },
    {
      title: t.colActions,
      key: "actions",
      render: (_, issue) => renderActions(issue)
    }
  ];

  const showEmpty = !loading && !error && issues.length === 0;

  return (
    <SiteShell pageTitle={t.pageTitle}>
      <section className="page-section">
        <div className="admin-panel">
          <AdminPanelHeading
            eyebrow={t.eyebrow}
            title={t.title}
            description={t.description}
            actions={
              <Link href="/issues/new">
                <Button type="primary" icon={<PlusOutlined />}>
                  {t.reportCta}
                </Button>
              </Link>
            }
          />

          {showEmpty ? (
            <EmptyState
              kind="no-results"
              title={t.empty}
              cta={{ label: t.emptyCta, href: "/issues/new" }}
            />
          ) : (
            <>
              <AdminFilters>
                <Select
                  allowClear
                  onChange={(value) => setFilter("status", value)}
                  options={statusOptions}
                  placeholder={t.filterStatus}
                  value={filters.status}
                />
                <Select
                  allowClear
                  onChange={(value) => setFilter("category", value)}
                  options={categoryOptions}
                  placeholder={t.filterCategory}
                  value={filters.category}
                />
                <Select
                  onChange={(value) => setFilter("sort", value)}
                  options={sortOptions}
                  placeholder={t.sortBy}
                  value={filters.sort}
                />
              </AdminFilters>

              {error ? <p className="admin-error-text">{error}</p> : null}

              <AdminResponsiveList
                ariaLabel={t.pageTitle}
                emptyDescription={error ? t.loadError : t.empty}
                isEmpty={issues.length === 0}
                loading={loading}
                loadingLabel="…"
                table={
                  <Table
                    columns={columns}
                    dataSource={issues}
                    locale={{
                      emptyText: <Empty description={error ? t.loadError : t.empty} />
                    }}
                    loading={loading}
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
                            <Link
                              className="admin-issue-row admin-issue-row-link"
                              href={issueHref(issue)}
                            >
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
                          <Tag color={ISSUE_STATUS_COLORS[issue.status]}>
                            {statusLabel(issue.status)}
                          </Tag>
                        </>
                      }
                      detail={
                        <>
                          <p>
                            <strong>{t.colCategory}:</strong> {categoryLabel(issue.category)}
                          </p>
                          <p>
                            <strong>{t.colVotes}:</strong>{" "}
                            {localizeDigits(issue.voteCount ?? 0, language)}
                          </p>
                          <p>
                            <strong>{t.colReported}:</strong>{" "}
                            {formatDate(issue.createdAt, language)}
                          </p>
                        </>
                      }
                      actions={renderActions(issue)}
                    />
                  );
                })}
              </AdminResponsiveList>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
