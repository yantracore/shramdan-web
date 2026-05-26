"use client";

import { ArrowRightOutlined, EnvironmentOutlined, LikeOutlined } from "@ant-design/icons";
import { Button, Tag, Tooltip } from "antd";
import Image from "next/image";
import Link from "next/link";
import { ISSUE_STATUS_COLORS, getFirstIssueImage } from "@/lib/adminUtils";

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
  const coverImage = getFirstIssueImage(issue);

  return (
    <article className="content-card public-issue-card">
      {coverImage ? (
        <Link
          aria-label={issue.title}
          className="public-issue-card-cover"
          href={`/issues/${issue.id}`}
        >
          <Image
            alt={issue.title}
            height={240}
            sizes="(max-width: 720px) 100vw, 360px"
            src={coverImage.url}
            unoptimized
            width={360}
          />
        </Link>
      ) : null}
      <div className="card-topline">
        <Tag color={ISSUE_STATUS_COLORS[issue.status]}>{statusLabel}</Tag>
        <Tag>{categoryLabel}</Tag>
      </div>
      <h3>{issue.title}</h3>
      <div className="meta-list">
        {issue.addressText ? (
          <span>
            <EnvironmentOutlined /> {issue.addressText}
          </span>
        ) : null}
      </div>
      <div className="public-issue-card-actions">
        <Tooltip title={content.card.voteDisabledTooltip}>
          <Button
            aria-disabled="true"
            className="public-issue-card-support"
            icon={<LikeOutlined />}
            onClick={(event) => event.preventDefault()}
          >
            <span className="public-issue-card-support-count">
              {toLocalDigits(issue.voteCount ?? 0, language)}
            </span>
            <span className="public-issue-card-support-label">
              {content.card.voteAction}
            </span>
          </Button>
        </Tooltip>
        <Link className="card-link" href={`/issues/${issue.id}`}>
          {content.card.viewDetail} <ArrowRightOutlined />
        </Link>
      </div>
    </article>
  );
}
