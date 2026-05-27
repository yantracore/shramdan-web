"use client";

import { ArrowRightOutlined, PictureOutlined } from "@ant-design/icons";
import { Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { IssueVoteButton } from "@/components/IssueVoteButton";
import { ISSUE_STATUS_COLORS, getIssueCoverImageUrl } from "@/lib/adminUtils";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function toLocalDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

export function formatSupporters(count, content, language) {
  const n = count ?? 0;
  const localized = toLocalDigits(n, language);
  if (n === 1) return content.card.supportersOne;
  return content.card.supportersMany.replace("{n}", localized);
}

export function PublicIssueCard({ issue, content, language }) {
  const statusLabel = content.statusLabels[issue.status] || issue.status;
  const categoryLabel = content.categoryLabels[issue.category] || issue.category;
  const coverImageUrl = getIssueCoverImageUrl(issue);

  return (
    <article className="content-card public-issue-card">
      {coverImageUrl ? (
        <Link
          aria-label={issue.title}
          className="public-issue-card-cover"
          href={`/issues/${issue.id}`}
        >
          <Image
            alt={issue.title}
            height={240}
            sizes="(max-width: 720px) 100vw, 360px"
            src={coverImageUrl}
            unoptimized
            width={360}
          />
        </Link>
      ) : (
        <Link
          aria-label={issue.title}
          className="public-issue-card-cover public-issue-card-cover-placeholder"
          href={`/issues/${issue.id}`}
        >
          <PictureOutlined aria-hidden="true" />
        </Link>
      )}
      <div className="card-topline">
        <Tag color={ISSUE_STATUS_COLORS[issue.status]}>{statusLabel}</Tag>
        <Tag className="public-issue-card-category">{categoryLabel}</Tag>
      </div>
      <h3>
        <Link className="public-issue-card-title" href={`/issues/${issue.id}`}>
          {issue.title}
        </Link>
      </h3>
      <div className="meta-list">
        {issue.addressText ? <span>{issue.addressText}</span> : null}
      </div>
      <div className="public-issue-card-actions">
        <IssueVoteButton
          className="public-issue-card-support"
          content={content}
          initialVoteCount={issue.voteCount}
          issueId={issue.id}
          language={language}
        />
        <Link className="card-link" href={`/issues/${issue.id}`}>
          {content.card.viewDetail} <ArrowRightOutlined />
        </Link>
      </div>
    </article>
  );
}

export function PublicIssueCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="content-card public-issue-card public-issue-card-skeleton"
    >
      <div className="public-issue-card-cover skeleton-shimmer" />
      <div className="card-topline">
        <span className="skeleton-shimmer skeleton-chip" />
        <span className="skeleton-shimmer skeleton-chip skeleton-chip-alt" />
      </div>
      <div className="skeleton-shimmer skeleton-title" />
      <div className="skeleton-shimmer skeleton-title skeleton-title-short" />
      <div className="meta-list">
        <span className="skeleton-shimmer skeleton-line" />
      </div>
      <div className="public-issue-card-actions">
        <span className="skeleton-shimmer skeleton-button" />
        <span className="skeleton-shimmer skeleton-link" />
      </div>
    </article>
  );
}
