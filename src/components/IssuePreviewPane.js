"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  RiseOutlined
} from "@ant-design/icons";
import { Tag } from "antd";
import { CommentsSummary } from "@/components/EventCommentsSummary";
import { IssueMapThumb } from "@/components/IssueMapThumb";
import { IssueJoinButton } from "@/components/IssueJoinButton";
import { IssueVoteButton } from "@/components/IssueVoteButton";
import {
  ISSUE_STATUS_COLORS,
  getIssueCoverImageUrl,
  localizeIssue
} from "@/lib/adminUtils";
import { issueActionMode } from "@/lib/issueActions";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const NP_MONTHS = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
];
const NP_WEEKDAYS = [
  "आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"
];

function formatDateLong(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (language === "np") {
    const weekday = NP_WEEKDAYS[date.getDay()];
    const month = NP_MONTHS[date.getMonth()];
    const day = localizeDigits(date.getDate(), "np");
    const year = localizeDigits(date.getFullYear(), "np");
    return `${weekday}, ${month} ${day}, ${year}`;
  }
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function formatSupportersLabel(count, content, language) {
  const n = Number(count) || 0;
  const localized = localizeDigits(n, language);
  if (n === 1) return content.card?.supportersOne || `1 supporter`;
  return (content.card?.supportersMany || "{n} supporters").replace(
    "{n}",
    localized
  );
}

export function IssuePreviewPane({
  issue: rawIssue,
  language,
  content,
  preview,
  onBack,
  isMobileDrillActive
}) {
  const issue = localizeIssue(rawIssue, language);
  const actionMode = issueActionMode(issue?.status);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const asideRef = useRef(null);
  const sentinelRef = useRef(null);
  const didResolveFirstRef = useRef(false);

  // Live supporter count for the previewed issue. The same preview instance is
  // reused as the user clicks through the list, so a count seeded only once
  // would stay frozen on the first issue (the bug this fixes). Re-seed it
  // whenever the previewed issue changes — React's "adjust state during render
  // on a changing key" pattern — and bump it on vote/retract via onVoteChange
  // so the "{n} supporters" line and the Support button never disagree.
  const [voteCount, setVoteCount] = useState(issue?.voteCount ?? 0);
  const [syncedIssueId, setSyncedIssueId] = useState(issue?.id);
  if (issue?.id !== syncedIssueId) {
    setSyncedIssueId(issue?.id);
    setVoteCount(issue?.voteCount ?? 0);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescExpanded(false);
    if (!issue?.id) return undefined;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    asideRef.current?.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });

    if (!didResolveFirstRef.current) {
      didResolveFirstRef.current = true;
    } else {
      const node = asideRef.current;
      if (node && typeof window !== "undefined") {
        const rect = node.getBoundingClientRect();
        const stickyTop =
          (parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--corner-clear-zone"
            ) || "64",
            10
          ) || 64) + 14;
        if (rect.top < stickyTop - 4 || rect.top > window.innerHeight - 120) {
          node.scrollIntoView({
            block: "start",
            behavior: prefersReducedMotion ? "auto" : "smooth"
          });
        }
      }
    }

    if (prefersReducedMotion) return undefined;
    setIsChanging(true);
    const timer = window.setTimeout(() => setIsChanging(false), 460);
    return () => window.clearTimeout(timer);
  }, [issue?.id]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const cornerClear =
      typeof window !== "undefined"
        ? parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              "--corner-clear-zone"
            ) || "64",
            10
          ) || 64
        : 64;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(
          !entry.isIntersecting && entry.boundingClientRect.top < 0
        );
      },
      { rootMargin: `-${cornerClear + 14}px 0px 0px 0px`, threshold: [0, 1] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const asideClass = [
    "events-split-preview",
    isPinned ? "is-pinned" : "",
    isChanging ? "is-changing" : ""
  ]
    .filter(Boolean)
    .join(" ");

  if (!issue) {
    return (
      <>
        <div
          ref={sentinelRef}
          className="events-split-preview-sentinel"
          aria-hidden="true"
        />
        <aside ref={asideRef} className={asideClass} aria-live="polite">
          {isMobileDrillActive ? (
            <button
              type="button"
              className="event-preview-back"
              onClick={onBack}
            >
              <ArrowLeftOutlined aria-hidden="true" /> {preview.back}
            </button>
          ) : null}
          <div className="event-preview-empty">{preview.empty}</div>
        </aside>
      </>
    );
  }

  const statusLabel = content.statusLabels?.[issue.status] || issue.status;
  const categoryLabel =
    content.categoryLabels?.[issue.category] || issue.category;
  const coverUrl = getIssueCoverImageUrl(issue);
  const lat = Number(issue.latitude);
  const lng = Number(issue.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const dateText = formatDateLong(issue.createdAt, language);
  const descTooLong =
    typeof issue.description === "string" && issue.description.length > 220;

  return (
    <>
      <div
        ref={sentinelRef}
        className="events-split-preview-sentinel"
        aria-hidden="true"
      />
      <aside
        ref={asideRef}
        className={asideClass}
        aria-live="polite"
        aria-labelledby="issue-preview-title"
      >
        {isMobileDrillActive ? (
          <button
            type="button"
            className="event-preview-back"
            onClick={onBack}
          >
            <ArrowLeftOutlined aria-hidden="true" /> {preview.back}
          </button>
        ) : null}

        <div className="event-preview-media">
          {coverUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="event-preview-media-hero"
                src={coverUrl}
                alt=""
              />
              {dateText ? (
                <div className="event-preview-media-overlay">
                  <span>
                    <CalendarOutlined aria-hidden="true" /> {dateText}
                  </span>
                </div>
              ) : null}
            </>
          ) : hasCoords ? (
            <div className="issue-preview-map">
              <IssueMapThumb latitude={lat} longitude={lng} alt="" zoom={15} />
            </div>
          ) : (
            <div className="issue-preview-media-placeholder" aria-hidden="true">
              <PictureOutlined />
            </div>
          )}
        </div>

        <div className="event-preview-body">
          <h2 id="issue-preview-title">
            <Link
              className="event-preview-title-link"
              href={`/issues/${issue.slug ?? issue.id}`}
            >
              {issue.title}
            </Link>
          </h2>

          <div className="event-preview-tags">
            <Tag color={ISSUE_STATUS_COLORS[issue.status] || "default"}>
              {statusLabel}
            </Tag>
            <Tag>{categoryLabel}</Tag>
          </div>

          <p className="event-preview-meta">
            {issue.addressText ? (
              <span>
                <EnvironmentOutlined aria-hidden="true" /> {issue.addressText}
              </span>
            ) : null}
            {dateText ? (
              <span>
                <CalendarOutlined aria-hidden="true" />{" "}
                {preview.reportedOn}: {dateText}
              </span>
            ) : null}
            {Number.isFinite(Number(issue.voteCount)) ? (
              <span>
                <RiseOutlined aria-hidden="true" />{" "}
                {formatSupportersLabel(voteCount, content, language)}
              </span>
            ) : null}
          </p>

          {issue.description ? (
            <>
              <p
                className={`event-preview-desc${descExpanded ? " is-expanded" : ""}`}
                data-clamp="4"
              >
                {issue.description}
              </p>
              {descTooLong ? (
                <button
                  type="button"
                  className="event-preview-desc-toggle"
                  onClick={() => setDescExpanded((v) => !v)}
                >
                  {descExpanded ? preview.showLess : preview.showMore}
                </button>
              ) : null}
            </>
          ) : null}

          <CommentsSummary
            targetType="issue"
            targetId={issue.id}
            language={language}
          />

          <div className="event-preview-actions">
            {actionMode === "support" ? (
              <IssueVoteButton
                // Remount per issue so the hook's voted/voteCount/role state
                // reseeds from the new issue instead of carrying the previous
                // one's over (same reason the count is synced above).
                key={issue.id}
                content={content}
                seed={issue}
                initialVoteCount={issue.voteCount}
                initialVoted={issue.isVoted}
                issueId={issue.id}
                language={language}
                showCount={false}
                size="large"
                type="primary"
                onVoteChange={(payload) => {
                  if (payload && typeof payload.voteCount === "number") {
                    setVoteCount(payload.voteCount);
                  } else if (payload) {
                    setVoteCount((c) => c + 1);
                  } else {
                    setVoteCount((c) => Math.max(0, c - 1));
                  }
                }}
              />
            ) : actionMode === "join" ? (
              <IssueJoinButton issue={issue} language={language} size="large" eager />
            ) : null}
            <Link
              className="event-preview-open"
              href={`/issues/${issue.slug ?? issue.id}`}
            >
              {preview.openFull}{" "}
              <ArrowRightOutlined aria-hidden="true" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
