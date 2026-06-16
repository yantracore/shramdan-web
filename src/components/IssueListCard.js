"use client";

import Link from "next/link";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  RiseOutlined
} from "@ant-design/icons";
import { forwardRef } from "react";
import { getIssueCoverImageUrl, localizeIssue } from "@/lib/adminUtils";
import { IssueMapThumb } from "@/components/IssueMapThumb";

// Maps the API issue status onto the same data-status hooks the event card
// already styles (live | upcoming | past). EVENT_SCHEDULED is the most active
// state — the issue is being actively organized into a campaign — so it gets
// the accent treatment that `live` uses. OPEN is the "gathering support"
// state, mapped to the primary-toned `upcoming` style. COMPLETED maps to the
// muted `past` style.
function visualStatus(apiStatus) {
  if (apiStatus === "EVENT_SCHEDULED") return "live";
  if (apiStatus === "COMPLETED") return "past";
  return "upcoming";
}

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

function timeAgoShort(iso, language) {
  if (!iso) return "";
  const abs = Math.abs(Date.parse(iso) - Date.now());
  if (!Number.isFinite(abs)) return "";
  const min = Math.round(abs / 60_000);
  if (min < 60) {
    return `${localizeDigits(min, language)} ${language === "np" ? "मिनेट" : "min"}`;
  }
  const hr = Math.round(min / 60);
  if (hr < 48) {
    return `${localizeDigits(hr, language)} ${language === "np" ? "घण्टा" : "h"}`;
  }
  const days = Math.round(hr / 24);
  return `${localizeDigits(days, language)} ${language === "np" ? "दिन" : "d"}`;
}

export const IssueListCard = forwardRef(function IssueListCard(
  { issue: rawIssue, selected, language, content, onSelect, optionId },
  ref
) {
  const issue = localizeIssue(rawIssue, language);
  const status = visualStatus(issue.status);
  const statusLabel = content.statusLabels?.[issue.status] || issue.status;
  const coverUrl = getIssueCoverImageUrl(issue);
  const lat = Number(issue.latitude);
  const lng = Number(issue.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const handleClick = () => {
    if (typeof onSelect === "function") onSelect(issue.id);
  };

  const voteCount = Number(issue.voteCount) || 0;
  const agoLabel = timeAgoShort(issue.createdAt, language);

  return (
    <li
      ref={ref}
      id={optionId}
      role="option"
      aria-selected={selected ? "true" : "false"}
      tabIndex={selected ? 0 : -1}
      data-selected={selected ? "true" : undefined}
      data-status={status}
      className="event-list-card"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="event-list-card-thumb">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" loading="lazy" />
        ) : hasCoords ? (
          <IssueMapThumb latitude={lat} longitude={lng} alt="" />
        ) : (
          <span
            className="event-list-card-thumb-placeholder"
            aria-hidden="true"
          >
            <PictureOutlined />
          </span>
        )}
      </div>
      <div className="event-list-card-body">
        <h3>{issue.title}</h3>
        <div className="event-list-card-pill-row">
          <span className="event-list-card-status-pill" data-status={status}>
            {statusLabel}
          </span>
        </div>
        {issue.addressText ? (
          <p className="event-list-card-meta">
            <EnvironmentOutlined aria-hidden="true" /> {issue.addressText}
          </p>
        ) : null}
        <p className="event-list-card-meta-secondary">
          {voteCount > 0 ? (
            <span>
              <RiseOutlined aria-hidden="true" />
              {localizeDigits(voteCount, language)}{" "}
              {language === "np" ? "समर्थक" : "supporters"}
            </span>
          ) : null}
          {agoLabel ? (
            <span>
              <ClockCircleOutlined aria-hidden="true" />
              {agoLabel} {language === "np" ? "अघि" : "ago"}
            </span>
          ) : null}
        </p>
      </div>
      <Link
        href={`/issues/${issue.slug ?? issue.id}`}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {content.card?.viewDetail || "View detail"}
      </Link>
    </li>
  );
});
