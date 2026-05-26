"use client";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button, Empty, Popconfirm, Skeleton, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { IssueLocationCard } from "@/components/IssueLocationCard";
import { IssuePhotoGallery } from "@/components/IssuePhotoGallery";
import { IssueStatusTimeline } from "@/components/IssueStatusTimeline";
import { getJson, postJson } from "@/lib/apiClient";
import { useToast } from "@/lib/toast";
import {
  ISSUE_STATUS_COLORS,
  formatCoordinates,
  formatDate,
  formatEnum,
  getIssueCoverImageUrl,
  getResponseData,
  isImageUpload
} from "@/lib/adminUtils";

const ADMIN_ISSUE_CONTENT = {
  statusLabels: {
    OPEN: "Open",
    EVENT_SCHEDULED: "Campaign scheduled",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
    DUPLICATE: "Duplicate"
  },
  detail: {
    galleryAria: "Photo gallery",
    viewPhoto: "View photo",
    locationTitle: "Location",
    openInMaps: "Open in Maps",
    rejectedNote: "This issue has been rejected.",
    duplicateNote: "This issue is a duplicate report."
  }
};

export default function AdminIssueViewPage() {
  const params = useParams();
  const issueId = params?.id;
  const messageApi = useToast();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [converting, setConverting] = useState(false);

  const loadIssue = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    setLoadError("");
    setNotFound(false);

    try {
      const response = await getJson(`/issues/${issueId}`, { requireAuth: true });
      const data = getResponseData(response, null);
      if (!data) {
        setNotFound(true);
        setIssue(null);
        return;
      }
      setIssue(data);
    } catch (error) {
      if (error?.status === 404) {
        setNotFound(true);
        setIssue(null);
      } else {
        setLoadError(error?.message || "Could not load issue.");
      }
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadIssue();
  }, [loadIssue]);

  const handleConvertToEvent = useCallback(async () => {
    if (!issueId) return;
    setConverting(true);
    try {
      await postJson(`/issues/${issueId}/convert-to-event`, undefined, { requireAuth: true });
      messageApi.success("Issue promoted to a scheduled event.");
      await loadIssue();
    } catch (error) {
      messageApi.error(error?.message || "Could not convert this issue to an event.");
    } finally {
      setConverting(false);
    }
  }, [issueId, loadIssue, messageApi]);

  const uploads = Array.isArray(issue?.uploads) ? issue.uploads : [];
  const imageUploads = uploads.filter(isImageUpload);
  const nonImageUploads = uploads.filter((upload) => !isImageUpload(upload));
  const coverImageUrl = getIssueCoverImageUrl(issue);

  const detailActions = issue ? (
    <div className="public-issue-detail-cover-actions">
      <Link href="/admin/issues">
        <Button icon={<ArrowLeftOutlined />}>Back to issues</Button>
      </Link>
      {issue.status === "OPEN" ? (
        <Popconfirm
          cancelText="Cancel"
          description={
            <div style={{ maxWidth: 320 }}>
              Promotes this issue to a scheduled event without waiting for the vote
              threshold. A leader will be auto-assigned and voters with verified phones
              will receive an SMS. This cannot be undone.
            </div>
          }
          okButtonProps={{ danger: true }}
          okText="Convert to event"
          onConfirm={handleConvertToEvent}
          title="Force-convert to a scheduled event?"
        >
          <Button danger icon={<ThunderboltOutlined />} loading={converting}>
            Convert to event
          </Button>
        </Popconfirm>
      ) : null}
      <Link href={`/admin/issues/${issue.id}/edit`}>
        <Button icon={<EditOutlined />} type="primary">
          Edit
        </Button>
      </Link>
    </div>
  ) : null;

  return (
    <AdminShell title={issue?.title || "Issue detail"}>
      <section className="admin-panel">
        {loading ? (
          <article
            aria-live="polite"
            className="content-card public-issue-detail public-issue-detail-skeleton"
            role="status"
          >
            <Skeleton.Button active size="small" style={{ width: 120 }} />
            <Skeleton active paragraph={{ rows: 1, width: ["40%"] }} title={{ width: "70%" }} />
            <Skeleton.Image active style={{ height: 320, width: "100%" }} />
            <Skeleton active paragraph={{ rows: 3 }} />
          </article>
        ) : null}

        {!loading && loadError ? (
          <Empty description={loadError}>
            <Button onClick={loadIssue} type="primary">
              Try again
            </Button>
          </Empty>
        ) : null}

        {!loading && notFound ? (
          <Empty
            description={
              <>
                <strong>Issue not found</strong>
                <p>This issue may have been removed.</p>
              </>
            }
          >
            <Link href="/admin/issues">
              <Button type="primary">Back to issues</Button>
            </Link>
          </Empty>
        ) : null}

        {!loading && !loadError && !notFound && issue ? (
          <article className="content-card public-issue-detail">
            {coverImageUrl ? (
              <div className="public-issue-detail-cover">
                <Image
                  alt={issue.title}
                  height={720}
                  priority
                  sizes="(max-width: 768px) 100vw, 1180px"
                  src={coverImageUrl}
                  unoptimized
                  width={1920}
                />
                {detailActions}
              </div>
            ) : (
              <div className="public-issue-detail-actions-bar">{detailActions}</div>
            )}

            <div className="public-issue-detail-topline">
              <Tag color={ISSUE_STATUS_COLORS[issue.status]}>
                {ADMIN_ISSUE_CONTENT.statusLabels[issue.status] || formatEnum(issue.status)}
              </Tag>
              <Tag>{formatEnum(issue.category)}</Tag>
              <Tag>
                <RiseOutlined /> {issue.voteCount ?? 0} votes
              </Tag>
            </div>

            <h1>{issue.title}</h1>

            <div className="public-issue-detail-meta">
              {issue.addressText ? (
                <span>
                  <EnvironmentOutlined /> {issue.addressText}
                </span>
              ) : null}
              {issue.createdAt ? (
                <span>
                  <CalendarOutlined /> Reported on: {formatDate(issue.createdAt)}
                </span>
              ) : null}
              {issue.reporter?.name ? (
                <span>
                  <UserOutlined /> {issue.reporter.name}
                </span>
              ) : null}
            </div>

            {imageUploads.length > 0 ? (
              <IssuePhotoGallery
                content={ADMIN_ISSUE_CONTENT}
                images={imageUploads}
                title={issue.title}
              />
            ) : (
              <section className="public-issue-detail-section-block">
                <h2>Photos and evidence</h2>
                <p className="public-issue-detail-muted">No photos uploaded yet.</p>
              </section>
            )}

            <section className="public-issue-detail-section-block public-issue-timeline-block">
              <h2>Progress so far</h2>
              <IssueStatusTimeline content={ADMIN_ISSUE_CONTENT} status={issue.status} />
            </section>

            {issue.description ? (
              <section className="public-issue-detail-section-block">
                <h2>About this issue</h2>
                <p>{issue.description}</p>
              </section>
            ) : null}

            <section className="public-issue-detail-section-block">
              <h2>Administrative details</h2>
              <dl className="admin-modal-meta">
                {issue.municipality ? (
                  <>
                    <dt>Municipality</dt>
                    <dd>{issue.municipality}</dd>
                  </>
                ) : null}
                {issue.ward ? (
                  <>
                    <dt>Ward</dt>
                    <dd>{issue.ward}</dd>
                  </>
                ) : null}
                <dt>Coordinates</dt>
                <dd>{formatCoordinates(issue.latitude, issue.longitude) || "—"}</dd>
                <dt>Reporter</dt>
                <dd>{issue.reporter?.name || "—"}</dd>
                <dt>Vote count</dt>
                <dd>{issue.voteCount ?? 0}</dd>
              </dl>
            </section>

            {nonImageUploads.length > 0 ? (
              <section className="public-issue-detail-section-block">
                <h2>Other uploads</h2>
                <ul className="admin-modal-uploads-list">
                  {nonImageUploads.map((upload) => (
                    <li key={upload.id || upload.url}>
                      <a href={upload.url} rel="noreferrer" target="_blank">
                        {upload.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <IssueLocationCard
              addressText={issue.addressText}
              content={ADMIN_ISSUE_CONTENT}
              latitude={issue.latitude}
              longitude={issue.longitude}
            />
          </article>
        ) : null}
      </section>
    </AdminShell>
  );
}
