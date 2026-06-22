"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { EventCommentsSummary } from "@/components/EventCommentsSummary";
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
  WORKER: { np: "सफाइकर्मी", en: "Cleaner" },
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
  const [isPinned, setIsPinned] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const asideRef = useRef(null);
  const sentinelRef = useRef(null);
  const didResolveFirstEventRef = useRef(false);

  // Reset internal scroll + ensure the aside is visible + play a selection
  // pulse, all keyed on event id. The visibility check matters when the
  // list is long enough that `.events-split` ends before the user's scroll
  // depth — the aside has natural-sticky un-stuck and is off-screen; on a
  // selection from far down, we scroll it back into the sticky zone
  // (scroll-margin-top on the aside handles the header offset).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescExpanded(false);
    if (!event?.id) return undefined;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    asideRef.current?.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });

    // Skip the visibility check on the first event resolved into the pane
    // (initial mount / URL-driven deep-link). Page.js already handles the
    // initial scroll for those cases via the selected card's scrollIntoView.
    if (!didResolveFirstEventRef.current) {
      didResolveFirstEventRef.current = true;
    } else {
      const node = asideRef.current;
      if (node && typeof window !== "undefined") {
        const rect = node.getBoundingClientRect();
        const stickyTop =
          (parseInt(
            getComputedStyle(document.documentElement).getPropertyValue("--corner-clear-zone") ||
              "64",
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
  }, [event?.id]);

  // Sentinel + IntersectionObserver to detect when the sticky aside is
  // actually pinned. The sentinel sits just above the aside; once it
  // crosses the top of the viewport (offset by the fixed header), the
  // aside is stuck — flip `is-pinned` for a stronger shadow.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const cornerClear =
      typeof window !== "undefined"
        ? parseInt(
            getComputedStyle(document.documentElement).getPropertyValue("--corner-clear-zone") ||
              "64",
            10
          ) || 64
        : 64;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(!entry.isIntersecting && entry.boundingClientRect.top < 0);
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

  if (!event) {
    return (
      <>
        <div ref={sentinelRef} className="events-split-preview-sentinel" aria-hidden="true" />
        <aside ref={asideRef} className={asideClass} aria-live="polite">
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
      </>
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
    <>
      <div ref={sentinelRef} className="events-split-preview-sentinel" aria-hidden="true" />
      <aside
        ref={asideRef}
        className={asideClass}
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
        <h2 id="event-preview-title">
          <Link className="event-preview-title-link" href={`/events/${event.slug ?? event.id}`}>
            {event.title}
          </Link>
        </h2>

        {(status !== "live" || event.riskLevel) ? (
          <div className="event-preview-tags">
            {status !== "live" ? (
              <span
                className="event-list-card-status-pill"
                data-status={status}
              >
                {status === "upcoming" ? t.filters.upcoming : t.filters.past}
              </span>
            ) : null}
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
        ) : null}

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
          {event.addressText ? (
            <span>
              <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
            </span>
          ) : null}
          {event.leaderName ? (
            <span>
              <TeamOutlined aria-hidden="true" /> {event.leaderName}
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

        <EventCommentsSummary eventId={event.id} language={language} />

        <div className="event-preview-actions">
          <Link
            className="event-preview-open"
            href={`/events/${event.slug ?? event.id}`}
          >
            {t.preview.openFull} <ArrowRightOutlined aria-hidden="true" />
          </Link>
        </div>
      </div>
      </aside>
    </>
  );
}
