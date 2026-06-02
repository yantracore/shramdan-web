"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { EventLiveStreamPlayer } from "@/components/EventLiveStreamPlayer";

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
const NP_WEEKDAYS = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहिबार", "शुक्रबार", "शनिबार"];

function formatDateLong(iso, language) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (language === "np") {
    const weekday = NP_WEEKDAYS[date.getDay()];
    const month = NP_MONTHS[date.getMonth()];
    const day = localizeDigits(date.getDate(), "np");
    const year = localizeDigits(date.getFullYear(), "np");
    const hour = localizeDigits(date.getHours(), "np");
    const minute = localizeDigits(String(date.getMinutes()).padStart(2, "0"), "np");
    return `${weekday}, ${month} ${day}, ${year} · ${hour}:${minute}`;
  }
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

const FALLBACK_HERO = "/images/event-types/cleanup.jpg";

const ROLE_LABELS = {
  WORKER: { np: "श्रमिक", en: "Worker" },
  PHOTOGRAPHER: { np: "फोटो", en: "Photo" },
  LIVESTREAMER: { np: "लाइभ", en: "Livestreamer" },
  MEDIC: { np: "स्वास्थ्य", en: "Medic" },
  SAFETY_LEAD: { np: "सुरक्षा", en: "Safety" },
  COORDINATOR: { np: "समन्वयक", en: "Coordinator" },
  LOGISTICS: { np: "लोजिस्टिक्स", en: "Logistics" }
};

function roleLabel(role, language) {
  return ROLE_LABELS[role]?.[language] || role;
}

export function EventPreviewPane({
  event,
  status,
  language,
  t,
  onBack,
  isMobileDrillActive
}) {
  const [descExpanded, setDescExpanded] = useState(false);

  // Reset clamp state when selection changes.
  useEffect(() => {
    setDescExpanded(false);
  }, [event?.id]);

  if (!event) {
    return (
      <aside className="events-split-preview" aria-live="polite">
        {isMobileDrillActive ? (
          <button
            type="button"
            className="event-preview-back"
            onClick={onBack}
          >
            <ArrowLeftOutlined aria-hidden="true" /> {t.preview.back}
          </button>
        ) : null}
        <div className="event-preview-empty">{t.preview.empty}</div>
      </aside>
    );
  }

  const issue = event.linkedIssue || null;
  const hero =
    event.thumbnailUrl ||
    event.liveStream?.thumbnailUrl ||
    FALLBACK_HERO;

  const dateText =
    status === "past"
      ? formatDateLong(event.completedAt, language)
      : formatDateLong(event.scheduledAt || event.liveStream?.startedAt, language);

  return (
    <aside
      className="events-split-preview"
      aria-live="polite"
      aria-labelledby="event-preview-title"
    >
      {isMobileDrillActive ? (
        <button
          type="button"
          className="event-preview-back"
          onClick={onBack}
        >
          <ArrowLeftOutlined aria-hidden="true" /> {t.preview.back}
        </button>
      ) : null}

      <div className="event-preview-media">
        {event.liveStream?.isActive ? (
          <EventLiveStreamPlayer
            language={language}
            liveStream={event.liveStream}
            eventTitle={event.title || ""}
            copy={{
              liveAria: language === "np" ? "लाइभ प्रसारण" : "Live broadcast",
              liveBadge: language === "np" ? "लाइभ" : "LIVE",
              durationSuffix: language === "np" ? "देखि लाइभ" : "live",
              viewersSuffix: language === "np" ? "जना हेर्दैछन्" : "watching"
            }}
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="event-preview-media-hero" src={hero} alt="" />
            <div className="event-preview-media-overlay">
              {status === "upcoming" && event.scheduledAt ? (
                <span>
                  <CalendarOutlined aria-hidden="true" />{" "}
                  {formatDateLong(event.scheduledAt, language)}
                </span>
              ) : null}
              {status === "past" && event.completedAt ? (
                <span>
                  <ClockCircleOutlined aria-hidden="true" />{" "}
                  {formatDateLong(event.completedAt, language)}
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>

      <div className="event-preview-body">
        <div className="event-preview-tags">
          <span
            className="event-list-card-status-pill"
            data-status={status}
          >
            {status === "live"
              ? t.filters.live
              : status === "upcoming"
                ? t.filters.upcoming
                : t.filters.past}
          </span>
          {event.riskLevel ? (
            <span
              className="event-list-card-status-pill"
              data-status="upcoming"
            >
              <WarningOutlined aria-hidden="true" />{" "}
              {t.preview.risk?.[event.riskLevel] || event.riskLevel}
            </span>
          ) : null}
        </div>

        <h2 id="event-preview-title">{event.title}</h2>

        <p className="event-preview-meta">
          {dateText ? (
            <span>
              <CalendarOutlined aria-hidden="true" /> {dateText}
            </span>
          ) : null}
          {event.durationMinutes ? (
            <span>
              <ClockCircleOutlined aria-hidden="true" />{" "}
              {t.meta.durationMin.replace(
                "{n}",
                localizeDigits(event.durationMinutes, language)
              )}
            </span>
          ) : null}
          {event.leaderName ? (
            <span>
              <TeamOutlined aria-hidden="true" /> {event.leaderName}
            </span>
          ) : null}
          {event.addressText ? (
            <span>
              <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
            </span>
          ) : null}
          {status === "past" && Number.isFinite(event.participantCount) ? (
            <span>
              <TeamOutlined aria-hidden="true" />{" "}
              {localizeDigits(event.participantCount, language)} {t.meta.participants}
            </span>
          ) : null}
        </p>

        {issue?.description ? (
          <>
            <p
              className={`event-preview-desc${descExpanded ? " is-expanded" : ""}`}
              data-clamp="4"
            >
              {issue.description}
            </p>
            {issue.description.length > 220 ? (
              <button
                type="button"
                className="event-preview-desc-toggle"
                onClick={() => setDescExpanded((v) => !v)}
              >
                {descExpanded ? t.preview.showLess : t.preview.showMore}
              </button>
            ) : null}
          </>
        ) : null}

        {status === "past" && event.resultSummary ? (
          <section className="event-preview-section">
            <h3>{t.preview.result}</h3>
            <p>{event.resultSummary}</p>
          </section>
        ) : null}

        {event.meetupNotes ? (
          <section className="event-preview-section">
            <h3>{t.preview.meetup}</h3>
            <p>{event.meetupNotes}</p>
          </section>
        ) : null}

        {Array.isArray(event.rolesNeeded) && event.rolesNeeded.length > 0 ? (
          <section className="event-preview-section">
            <h3>{t.preview.roles}</h3>
            <div className="event-preview-roles">
              {event.rolesNeeded.map((entry) => (
                <span
                  key={entry.role}
                  className="event-preview-role-chip"
                  data-empty={entry.filled < entry.count ? "true" : undefined}
                >
                  {roleLabel(entry.role, language)}{" "}
                  <strong>
                    {localizeDigits(entry.filled, language)}/
                    {localizeDigits(entry.count, language)}
                  </strong>
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {status === "past" && Array.isArray(event.photos) && event.photos.length > 0 ? (
          <section className="event-preview-section">
            <h3>{t.preview.photos}</h3>
            <div className="event-preview-photos">
              {event.photos.slice(0, 6).map((src, i) => (
                <div className="event-preview-photo" key={`${src}-${i}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {status === "past" && Array.isArray(event.testimonials) && event.testimonials.length > 0 ? (
          <section className="event-preview-section">
            <h3>{t.preview.voices}</h3>
            <div className="event-preview-voices">
              {event.testimonials.slice(0, 2).map((entry, i) => (
                <figure className="event-preview-voice" key={i}>
                  <blockquote>{entry.quote}</blockquote>
                  <cite>
                    {entry.name}
                    {entry.role ? <span> · {entry.role}</span> : null}
                  </cite>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <div className="event-preview-actions">
          <Link
            className="event-preview-open"
            href={`/events/${event.id}`}
          >
            {t.preview.openFull} <ArrowRightOutlined aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
