"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { CalendarOutlined, EyeOutlined, TeamOutlined } from "@ant-design/icons";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  A11y,
  EffectCoverflow,
  Keyboard,
  Navigation,
  Pagination
} from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { usePreferences } from "@/app/providers";

// Unified home rail: Swiper EffectCoverflow slider combining
// currently-live + upcoming-scheduled events as Netflix-poster cards.
// Only the centered (active) LIVE slide auto-plays its preview iframe;
// every other slide shows a static thumbnail.

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

function formatScheduledPill(iso, language) {
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

// Brief delay before mounting the live iframe so quick slide changes
// don't flicker through multiple players.
const ACTIVE_PREVIEW_DELAY_MS = 400;

export function EventsHomeRail({
  liveEvents = [],
  upcomingEvents = [],
  copy,
  language = "np"
}) {
  const reduceMotion = useReducedMotion();
  const { entranceAnimation } = usePreferences();
  const coverflowOn = !reduceMotion && entranceAnimation;

  const items = [
    ...liveEvents.map((event) => ({ kind: "live", event })),
    ...upcomingEvents.map((event) => ({ kind: "upcoming", event }))
  ];
  const isEmpty = items.length === 0;
  const useLoop = items.length > 3;

  const [activeIndex, setActiveIndex] = useState(0);
  const handleActive = (swiper) => setActiveIndex(swiper.realIndex);

  const renderSlide = (item, index) => {
    const isActive = index === activeIndex;
    return (
      <SwiperSlide key={item.event.id} className="events-home-rail-slide">
        {item.kind === "live" ? (
          <LivePosterCard
            event={item.event}
            copy={copy}
            isActive={isActive}
            allowAutoPreview={coverflowOn}
          />
        ) : (
          <UpcomingPosterCard
            event={item.event}
            language={language}
            copy={copy}
            isActive={isActive}
          />
        )}
      </SwiperSlide>
    );
  };

  return (
    <section
      className="events-home-rail"
      aria-labelledby="events-home-rail-title"
    >
      <div className="events-home-rail-shell">
        <header className="events-home-rail-header">
          <div className="events-home-rail-header-text">
            <span className="eyebrow events-home-rail-eyebrow">
              <span className="live-dot" aria-hidden="true" />
              {copy?.eyebrow}
            </span>
            <h2 id="events-home-rail-title">{copy?.title}</h2>
            {copy?.subtitle ? <p>{copy.subtitle}</p> : null}
          </div>
          <Link href="/events" className="events-home-rail-view-all">
            {copy?.viewAll}
          </Link>
        </header>
      </div>

      {isEmpty ? (
        <div className="events-home-rail-shell">
          <div className="events-home-rail-empty">
            <span className="events-home-rail-empty-icon" aria-hidden="true">📺</span>
            <p>{copy?.emptyMessage}</p>
          </div>
        </div>
      ) : coverflowOn ? (
        <Swiper
          className="events-home-rail-swiper"
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          initialSlide={Math.floor(items.length / 2)}
          keyboard={{ enabled: true }}
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: false
          }}
          pagination={{ clickable: true }}
          navigation
          onSwiper={handleActive}
          onSlideChange={handleActive}
          a11y={{
            prevSlideMessage: copy?.prevAria,
            nextSlideMessage: copy?.nextAria,
            containerRoleDescriptionMessage: copy?.ariaCarousel
          }}
          modules={[EffectCoverflow, Pagination, Navigation, Keyboard, A11y]}
        >
          {items.map(renderSlide)}
        </Swiper>
      ) : (
        <Swiper
          className="events-home-rail-swiper events-home-rail-swiper--flat"
          grabCursor
          centeredSlides
          slidesPerView={1.2}
          spaceBetween={16}
          loop={useLoop}
          keyboard={{ enabled: true }}
          pagination={{ clickable: true }}
          navigation
          onSwiper={handleActive}
          onSlideChange={handleActive}
          a11y={{
            prevSlideMessage: copy?.prevAria,
            nextSlideMessage: copy?.nextAria,
            containerRoleDescriptionMessage: copy?.ariaCarousel
          }}
          modules={[Pagination, Navigation, Keyboard, A11y]}
        >
          {items.map(renderSlide)}
        </Swiper>
      )}
    </section>
  );
}

function LivePosterCard({ event, copy, isActive, allowAutoPreview }) {
  const previewUrl =
    event?.liveStream?.previewEmbedUrl || event?.liveStream?.streamUrl;
  const durationLabel = formatLiveDuration(event?.liveStream?.startedAt, copy);
  const viewers = event?.liveStream?.viewerCount;
  const thumbnailUrl = event?.liveStream?.thumbnailUrl;

  const [showLive, setShowLive] = useState(false);
  useEffect(() => {
    if (!isActive || !allowAutoPreview || !previewUrl) {
      setShowLive(false);
      return undefined;
    }
    const id = setTimeout(() => setShowLive(true), ACTIVE_PREVIEW_DELAY_MS);
    return () => clearTimeout(id);
  }, [isActive, allowAutoPreview, previewUrl]);

  return (
    <article className="events-home-rail-poster-card events-home-rail-poster-card--live">
      <Link
        href={`/events/${event.id}`}
        className="events-home-rail-poster-link"
        aria-label={event.title}
      >
        <div className="events-home-rail-poster">
          {showLive ? (
            <iframe
              className="events-home-rail-poster-iframe"
              src={previewUrl}
              title={`${event.title} live preview`}
              allow="autoplay; encrypted-media"
              loading="lazy"
              frameBorder="0"
            />
          ) : thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt={event.title} loading="lazy" />
          ) : (
            <div className="events-home-rail-poster-fallback" aria-hidden="true">
              <span>श्रमदान</span>
            </div>
          )}

          <div className="events-home-rail-poster-overlay">
            <div className="events-home-rail-poster-top">
              <span className="events-home-rail-poster-badge events-home-rail-poster-badge--live">
                <span className="live-dot" aria-hidden="true" />
                {copy?.liveBadge || "LIVE"}
              </span>
              {Number.isFinite(viewers) ? (
                <span className="events-home-rail-poster-badge events-home-rail-poster-badge--meta">
                  <EyeOutlined aria-hidden="true" /> {viewers.toLocaleString()}
                </span>
              ) : null}
            </div>
            <div className="events-home-rail-poster-bottom">
              <h3>{event.title}</h3>
              {durationLabel ? <p>{durationLabel}</p> : null}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function UpcomingPosterCard({ event, language, copy, isActive }) {
  const roleCount = Array.isArray(event?.rolesNeeded) ? event.rolesNeeded.length : 0;
  const dateLabel = formatScheduledPill(event.scheduledAt, language);
  const rolesLabel =
    roleCount > 0
      ? language === "np"
        ? `${localizeDigits(roleCount, "np")} भूमिका`
        : `${roleCount} role${roleCount === 1 ? "" : "s"}`
      : null;
  // copy intentionally unused for upcoming variant — kept to keep both
  // card signatures parallel, helps when iterating later.
  void copy;
  void isActive;

  return (
    <article className="events-home-rail-poster-card events-home-rail-poster-card--upcoming">
      <Link
        href={`/events/${event.id}`}
        className="events-home-rail-poster-link"
        aria-label={event.title}
      >
        <div className="events-home-rail-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.thumbnailUrl || "/images/event-types/cleanup.jpg"}
            alt={event.title}
            loading="lazy"
          />

          <div className="events-home-rail-poster-overlay">
            <div className="events-home-rail-poster-top">
              {dateLabel ? (
                <span className="events-home-rail-poster-badge events-home-rail-poster-badge--date">
                  <CalendarOutlined aria-hidden="true" /> {dateLabel}
                </span>
              ) : null}
              {rolesLabel ? (
                <span className="events-home-rail-poster-badge events-home-rail-poster-badge--meta">
                  <TeamOutlined aria-hidden="true" /> {rolesLabel}
                </span>
              ) : null}
            </div>
            <div className="events-home-rail-poster-bottom">
              <h3>{event.title}</h3>
              {event.addressText ? <p>{event.addressText}</p> : null}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function formatLiveDuration(startedAt, copy) {
  if (!startedAt) return null;
  const startMs = Date.parse(startedAt);
  if (Number.isNaN(startMs)) return null;
  const nowMs = Date.now();
  const diffMin = Math.max(0, Math.floor((nowMs - startMs) / 60_000));
  if (diffMin < 1) return copy?.justStarted || "Just started";
  if (diffMin < 60) return `${diffMin}m ${copy?.durationLive || "live"}`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (mins === 0) return `${hours}h ${copy?.durationLive || "live"}`;
  return `${hours}h ${mins}m ${copy?.durationLive || "live"}`;
}
