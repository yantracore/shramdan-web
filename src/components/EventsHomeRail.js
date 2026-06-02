"use client";

import { useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { CalendarOutlined, EnvironmentOutlined, TeamOutlined } from "@ant-design/icons";
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
// currently-live + upcoming-scheduled events. Center slide is upright;
// side slides tilt back with depth. Each slide hosts the existing
// thumbnail card markup unchanged.

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
          loop={items.length > 3}
          keyboard={{ enabled: true }}
          coverflowEffect={{
            rotate: 35,
            stretch: 0,
            depth: 140,
            modifier: 1,
            slideShadows: false
          }}
          pagination={{ clickable: true }}
          navigation
          a11y={{
            prevSlideMessage: copy?.prevAria,
            nextSlideMessage: copy?.nextAria,
            containerRoleDescriptionMessage: copy?.ariaCarousel
          }}
          modules={[EffectCoverflow, Pagination, Navigation, Keyboard, A11y]}
        >
          {items.map((item) => (
            <SwiperSlide key={item.event.id} className="events-home-rail-slide">
              {item.kind === "live" ? (
                <LiveCard event={item.event} copy={copy} />
              ) : (
                <UpcomingCard event={item.event} language={language} />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <Swiper
          className="events-home-rail-swiper events-home-rail-swiper--flat"
          grabCursor
          centeredSlides
          slidesPerView={1.2}
          spaceBetween={16}
          loop={items.length > 3}
          keyboard={{ enabled: true }}
          pagination={{ clickable: true }}
          navigation
          a11y={{
            prevSlideMessage: copy?.prevAria,
            nextSlideMessage: copy?.nextAria,
            containerRoleDescriptionMessage: copy?.ariaCarousel
          }}
          modules={[Pagination, Navigation, Keyboard, A11y]}
        >
          {items.map((item) => (
            <SwiperSlide key={item.event.id} className="events-home-rail-slide">
              {item.kind === "live" ? (
                <LiveCard event={item.event} copy={copy} />
              ) : (
                <UpcomingCard event={item.event} language={language} />
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}

function LiveCard({ event, copy }) {
  const startedAt = event?.liveStream?.startedAt;
  const durationLabel = formatLiveDuration(startedAt, copy);
  const viewers = event?.liveStream?.viewerCount;
  const previewUrl = event?.liveStream?.previewEmbedUrl || event?.liveStream?.streamUrl;
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();
  // Only preview when this slide is the active (centered) one — Swiper
  // sets aria-hidden="false" on the active slide; we don't depend on
  // that here, but hover-only on a non-center slide is unlikely
  // anyway since other slides are rotated out of pointer-reach.
  const showPreview = isHovered && previewUrl && !reduceMotion;

  return (
    <article
      className="events-home-rail-card live-events-rail-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/events/${event.id}`} className="live-events-rail-card-link">
        <div className="live-events-rail-thumb">
          {event?.liveStream?.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.liveStream.thumbnailUrl} alt={event.title} loading="lazy" />
          ) : (
            <div className="live-events-rail-thumb-fallback" aria-hidden="true">
              <span>श्रमदान</span>
            </div>
          )}

          {showPreview ? (
            <div className="live-events-rail-preview" aria-hidden="true">
              <iframe
                src={previewUrl}
                title={`${event.title} live preview`}
                allow="autoplay; encrypted-media"
                loading="lazy"
                frameBorder="0"
              />
            </div>
          ) : null}

          <span className="live-events-rail-badge">
            <span className="live-dot" aria-hidden="true" />
            {copy?.liveBadge || "LIVE"}
          </span>
          {durationLabel ? (
            <span className="live-events-rail-duration">{durationLabel}</span>
          ) : null}
        </div>
        <div className="live-events-rail-meta">
          <h3>{event.title}</h3>
          {event.addressText ? <p>{event.addressText}</p> : null}
          {Number.isFinite(viewers) ? (
            <p className="live-events-rail-viewers">
              {copy?.viewersPrefix || ""}
              {viewers.toLocaleString()}
              {copy?.viewersSuffix || " watching"}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

function UpcomingCard({ event, language }) {
  const roleCount = Array.isArray(event?.rolesNeeded) ? event.rolesNeeded.length : 0;

  return (
    <article className="events-home-rail-card live-events-rail-card">
      <Link href={`/events/${event.id}`} className="live-events-rail-card-link">
        <div className="live-events-rail-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.thumbnailUrl || "/images/event-types/cleanup.jpg"}
            alt={event.title}
            loading="lazy"
          />
          <span className="events-home-rail-scheduled-badge">
            <CalendarOutlined aria-hidden="true" />{" "}
            {formatScheduledPill(event.scheduledAt, language)}
          </span>
        </div>
        <div className="live-events-rail-meta">
          <h3>{event.title}</h3>
          {event.addressText ? (
            <p>
              <EnvironmentOutlined aria-hidden="true" /> {event.addressText}
            </p>
          ) : null}
          {event.leaderName ? (
            <p className="events-home-rail-leader">
              <TeamOutlined aria-hidden="true" /> {event.leaderName}
            </p>
          ) : null}
          {roleCount > 0 ? (
            <p className="events-home-rail-roles">
              {language === "np"
                ? `${localizeDigits(roleCount, "np")} भूमिका खुला`
                : `${roleCount} role${roleCount === 1 ? "" : "s"} open`}
            </p>
          ) : null}
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
