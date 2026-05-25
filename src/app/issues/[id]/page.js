"use client";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  LikeOutlined,
  RiseOutlined
} from "@ant-design/icons";
import { Button, Empty, Spin, Tag, Tooltip } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PublicIssueCard, formatSupporters, toLocalDigits } from "@/components/PublicIssueCard";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getJson } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { ISSUE_STATUS_COLORS, getListItems, getResponseData } from "@/lib/adminUtils";

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
  const imageUploads = uploads.filter((upload) => {
    const url = upload?.url || "";
    return /\.(png|jpe?g|webp|gif|avif)$/i.test(url);
  });

  return (
    <SiteShell>
      <section className="page-section public-issue-detail-section">
        <Link className="public-issue-back-link" href="/issues">
          <ArrowLeftOutlined /> {content.detail.backToList}
        </Link>

        {loading ? (
          <div className="public-issues-loading" role="status">
            <Spin />
            <span>{content.states.loading}</span>
          </div>
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
            <div className="public-issue-detail-topline">
              <Tag color={ISSUE_STATUS_COLORS[issue.status]}>
                {content.statusLabels[issue.status] || issue.status}
              </Tag>
              <Tag>{content.categoryLabels[issue.category] || issue.category}</Tag>
            </div>

            <h1>{issue.title}</h1>

            <div className="public-issue-detail-meta">
              {issue.addressText ? (
                <span>
                  <EnvironmentOutlined /> {issue.addressText}
                </span>
              ) : null}
              <span>
                <RiseOutlined /> {formatSupporters(issue.voteCount, content, language)}
              </span>
              {issue.createdAt ? (
                <span>
                  <CalendarOutlined /> {content.detail.reportedOn}:{" "}
                  {formatIssueDate(issue.createdAt, language)}
                </span>
              ) : null}
            </div>

            <div className="public-issue-detail-actions">
              <Tooltip title={content.card.voteDisabledTooltip}>
                <Button disabled icon={<LikeOutlined />} size="large" type="primary">
                  {content.card.voteAction}
                </Button>
              </Tooltip>
              <span className="public-issue-detail-vote-count">
                {toLocalDigits(issue.voteCount ?? 0, language)}
              </span>
            </div>

            {issue.description ? (
              <section className="public-issue-detail-section-block">
                <h2>{content.detail.descriptionTitle}</h2>
                <p>{issue.description}</p>
              </section>
            ) : null}

            <section className="public-issue-detail-section-block">
              <h2>{content.detail.evidenceTitle}</h2>
              {imageUploads.length > 0 ? (
                <div className="public-issue-gallery">
                  {imageUploads.map((upload) => (
                    <a
                      className="public-issue-gallery-item"
                      href={upload.url}
                      key={upload.id || upload.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Image
                        alt={issue.title}
                        height={240}
                        src={upload.url}
                        unoptimized
                        width={320}
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="public-issue-detail-muted">{content.detail.noEvidence}</p>
              )}
            </section>
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
