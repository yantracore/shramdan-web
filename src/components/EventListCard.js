"use client";

import Link from "next/link";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { forwardRef } from "react";

function computeParticipantCount(event) {
  if (Number.isFinite(event?.participantCount)) return event.participantCount;
  if (!Array.isArray(event?.rolesNeeded)) return null;
  const sum = event.rolesNeeded.reduce(
    (acc, r) => acc + (Number.isFinite(r?.filled) ? r.filled : 0),
    0
  );
  return sum > 0 ? sum : null;
}

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const NP_MONTHS_SHORT = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
];
const NP_WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];

function formatSchedulePill(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (language === "np") {
    const weekday = NP_WEEKDAYS_SHORT[date.getDay()];
    const month = NP_MONTHS_SHORT[date.getMonth()];
    const day = localizeDigits(date.getDate(), "np");
    const hour = localizeDigits(date.getHours(), "np");
    const minute = localizeDigits(String(date.getMinutes()).padStart(2, "0"), "np");
    return `${weekday}, ${month} ${day}, ${hour}:${minute}`;
  }
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function timeFromNow(iso, language) {
  if (!iso) return "";
  const abs = Math.abs(Date.parse(iso) - Date.now());
  const min = Math.round(abs / 60_000);
  if (min < 60) return `${localizeDigits(min, language)} ${language === "np" ? "मिनेट" : "min"}`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${localizeDigits(hr, language)} ${language === "np" ? "घण्टा" : "h"}`;
  const days = Math.round(hr / 24);
  return `${localizeDigits(days, language)} ${language === "np" ? "दिन" : "d"}`;
}

const FALLBACK_THUMB = "/images/event-types/cleanup.jpg";

export const EventListCard = forwardRef(function EventListCard(
  { event, status, selected, language, t, onSelect, optionId },
  ref
) {
  const thumb =
    event.thumbnailUrl || event.liveStream?.thumbnailUrl || FALLBACK_THUMB;

  const handleClick = () => {
    if (typeof onSelect === "function") onSelect(event.id);
  };

  const statusLabel =
    status === "live"
      ? t.filters.live
      : status === "upcoming"
        ? t.filters.upcoming
        : t.filters.past;

  const participantCount = computeParticipantCount(event);

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" loading="lazy" />
        {status === "live" ? (
          <span className="event-list-card-live-pill">
            <span className="live-dot" aria-hidden="true" />
            {t.meta.live}
          </span>
        ) : null}
        {status === "live" && Number.isFinite(participantCount) ? (
          <span className="event-list-card-viewers" aria-hidden="true">
            {localizeDigits(participantCount, language)}
          </span>
        ) : null}
      </div>
      <div className="event-list-card-body">
        <h3>{event.title}</h3>
        {status !== "live" ? (
          <div className="event-list-card-pill-row">
            <span className="event-list-card-status-pill" data-status={status}>
              {statusLabel}
            </span>
          </div>
        ) : null}
        {event.addressText ? (
          <p className="event-list-card-meta">
            <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
          </p>
        ) : null}
        <p className="event-list-card-meta-secondary">
          {status === "live" && Number.isFinite(participantCount) ? (
            <span>
              <TeamOutlined aria-hidden="true" />
              {localizeDigits(participantCount, language)} {t.meta.participants}
            </span>
          ) : null}
          {status === "upcoming" && event.scheduledAt ? (
            <span>
              <CalendarOutlined aria-hidden="true" />
              {formatSchedulePill(event.scheduledAt, language)}
            </span>
          ) : null}
          {status === "upcoming" && event.durationMinutes ? (
            <span>
              <ClockCircleOutlined aria-hidden="true" />
              {t.meta.durationMin.replace(
                "{n}",
                localizeDigits(event.durationMinutes, language)
              )}
            </span>
          ) : null}
          {status === "past" && event.completedAt ? (
            <span>
              <ClockCircleOutlined aria-hidden="true" />
              {timeFromNow(event.completedAt, language)} {t.meta.ago}
            </span>
          ) : null}
          {status === "past" && Number.isFinite(event.participantCount) ? (
            <span>
              <TeamOutlined aria-hidden="true" />
              {localizeDigits(event.participantCount, language)} {t.meta.participants}
            </span>
          ) : null}
        </p>
      </div>
      <Link
        href={`/events/${event.slug ?? event.id}`}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      >
        {t.meta.view}
      </Link>
    </li>
  );
});
