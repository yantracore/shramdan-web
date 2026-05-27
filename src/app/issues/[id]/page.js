"use client";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import { Button, Empty, Skeleton, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { IssueLocationCard } from "@/components/IssueLocationCard";
import { IssuePhotoGallery } from "@/components/IssuePhotoGallery";
import { IssueShareRow } from "@/components/IssueShareRow";
import { IssueStatusTimeline } from "@/components/IssueStatusTimeline";
import { IssueVoteButton } from "@/components/IssueVoteButton";
import { PublicIssueCard, formatSupporters } from "@/components/PublicIssueCard";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import {
  ISSUE_STATUS_COLORS,
  getIssueCoverImageUrl,
  getListItems,
  getResponseData,
  isImageUpload
} from "@/lib/adminUtils";

const PUBLIC_ISSUE_STATUSES = ["OPEN", "EVENT_SCHEDULED", "COMPLETED"];
const RELATED_LIMIT = 6;
const RELATED_DISPLAY = 3;

function formatIssueDate(value, language) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const locale = language === "np" ? "ne-NP" : "en-US";
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return String(value);
  }
}

export default function IssueDetailPage() {
  const params = useParams();
  const issueId = params?.id;
  const { language } = usePreferences();
  const t = copy[language];
  const content = t.issues;

  const [issue, setIssue] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const fetchIssue = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const response = await getJson(`/issues/${issueId}`);
      const data = getResponseData(response, null);
      if (!data) {
        setNotFound(true);
        setIssue(null);
        return;
      }
      setIssue(data);

      if (data.category) {
        try {
          const relatedResponse = await getJson("/issues", {
            params: { category: data.category, sort: "voteCount", limit: RELATED_LIMIT }
          });
          const relatedList = getListItems(relatedResponse)
            .filter(
              (item) => item.id !== data.id && PUBLIC_ISSUE_STATUSES.includes(item.status)
            )
            .slice(0, RELATED_DISPLAY);
          setRelated(relatedList);
        } catch {
          setRelated([]);
        }
      }
    } catch (fetchError) {
      if (fetchError?.status === 404) {
        setNotFound(true);
        setIssue(null);
      } else {
        setError(fetchError?.message || content.states.errorBody);
      }
    } finally {
      setLoading(false);
    }
  }, [issueId, content.states.errorBody]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIssue();
  }, [fetchIssue]);

  const uploads = Array.isArray(issue?.uploads) ? issue.uploads : [];
  const coverImageUrl = getIssueCoverImageUrl(issue);
  const imageUploads = uploads
    .filter(isImageUpload)
    .filter((upload) => upload.url !== coverImageUrl);

  const scrollToLocation = () => {
    const target = document.getElementById("issue-location");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <SiteShell>
      <section className="page-section public-issue-detail-section">
        <Link className="public-issue-back-link" href="/issues">
          <ArrowLeftOutlined /> {content.detail.backToList}
        </Link>

        {loading ? (
          <article className="content-card public-issue-detail public-issue-detail-skeleton" role="status" aria-live="polite">
            <Skeleton.Button active size="small" style={{ width: 120 }} />
            <Skeleton active title={{ width: "70%" }} paragraph={{ rows: 1, width: ["40%"] }} />
            <Skeleton.Image active style={{ width: "100%", height: 320 }} />
            <Skeleton active paragraph={{ rows: 3 }} />
          </article>
        ) : null}

        {!loading && error ? (
          <div className="public-issues-error" role="alert">
            <h2>{content.states.errorTitle}</h2>
            <p>{content.states.errorBody}</p>
            <Button onClick={fetchIssue} type="primary">
              {content.states.retry}
            </Button>
          </div>
        ) : null}

        {!loading && notFound ? (
          <Empty
            className="public-issues-empty"
            description={
              <>
                <strong>{content.detail.notFoundTitle}</strong>
                <p>{content.detail.notFoundBody}</p>
              </>
            }
          >
            <Link href="/issues">
              <Button type="primary">{content.detail.backToList}</Button>
            </Link>
          </Empty>
        ) : null}

        {!loading && !error && !notFound && issue ? (
          <article className="content-card public-issue-detail">
            {coverImageUrl ? (
              <div className="public-issue-detail-cover">
                <Image
                  alt={issue.title}
                  height={720}
                  src={coverImageUrl}
                  unoptimized
                  width={1920}
                  sizes="(max-width: 768px) 100vw, 1180px"
                  priority
                />
              </div>
            ) : null}

            <div className="public-issue-detail-body">
              <div className="public-issue-detail-topline">
                <div className="public-issue-detail-topline-tags">
                  <Tag color={ISSUE_STATUS_COLORS[issue.status]}>
                    {content.statusLabels[issue.status] || issue.status}
                  </Tag>
                  <Tag>{content.categoryLabels[issue.category] || issue.category}</Tag>
                </div>
                <div className="public-issue-detail-support">
                  <span className="public-issue-detail-supporters">
                    {formatSupporters(issue.voteCount, content, language)}
                  </span>
                  <IssueVoteButton
                    content={content}
                    initialVoteCount={issue.voteCount}
                    issueId={issue.id}
                    language={language}
                    showCount={false}
                    size="large"
                  />
                </div>
              </div>

              <h1>{issue.title}</h1>

              <div className="public-issue-detail-meta-row">
                <div className="public-issue-detail-meta">
                  {issue.addressText ? (
                    <button
                      className="public-issue-detail-meta-link"
                      onClick={scrollToLocation}
                      type="button"
                    >
                      <EnvironmentOutlined /> {issue.addressText}
                    </button>
                  ) : null}
                  {issue.createdAt ? (
                    <span>
                      <CalendarOutlined /> {content.detail.reportedOn}:{" "}
                      {formatIssueDate(issue.createdAt, language)}
                    </span>
                  ) : null}
                </div>
                <IssueShareRow
                  title={issue.title}
                  content={content}
                  language={language}
                />
              </div>

              {imageUploads.length > 0 ? (
                <IssuePhotoGallery
                  images={imageUploads}
                  title={issue.title}
                  content={content}
                />
              ) : null}

              <section className="public-issue-detail-section-block public-issue-timeline-block">
                <IssueStatusTimeline status={issue.status} content={content} />
              </section>

              {issue.description ? (
                <section className="public-issue-detail-section-block">
                  <h2>{content.detail.descriptionTitle}</h2>
                  <p>{issue.description}</p>
                </section>
              ) : null}

              <IssueLocationCard
                addressText={issue.addressText}
                latitude={issue.latitude}
                longitude={issue.longitude}
                content={content}
              />
            </div>
          </article>
        ) : null}

        {!loading && !error && !notFound && issue ? (
          <section className="public-issue-related">
            <h2>{content.detail.relatedTitle}</h2>
            {related.length > 0 ? (
              <div className="public-issues-grid">
                {related.map((relatedIssue) => (
                  <PublicIssueCard
                    key={relatedIssue.id}
                    issue={relatedIssue}
                    content={content}
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <p className="public-issue-detail-muted">{content.detail.noRelated}</p>
            )}
          </section>
        ) : null}
      </section>
    </SiteShell>
  );
}
