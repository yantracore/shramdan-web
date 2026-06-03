"use client";

import { useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowRightOutlined, CalendarOutlined, TeamOutlined } from "@ant-design/icons";
import { TertiaryButton } from "@/components/TertiaryButton";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  A11y,
  Autoplay,
  EffectCoverflow,
  Keyboard,
  Navigation,
  Pagination
} from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";

// =============================================================
// DESIGN CONTRACT — DO NOT BRANCH THIS COMPONENT.
// -------------------------------------------------------------
// This rail has exactly ONE render path: Swiper EffectCoverflow.
// There is no flat fallback. Coverflow geometry is the design.
//
// Why no fallback:
//   Prior versions gated coverflow on `entranceAnimation` and
//   `prefers-reduced-motion`. The flat fallback that resulted
//   looked nothing like the intended slider, so any flip of those
//   preferences silently "ruined" the homepage. Reported by the
//   user as a recurring regression — locked here on 2026-06-02.
//
// Reduced-motion handling:
//   Coverflow geometry is STATIC when idle (it only animates
//   during user-initiated slide changes). For reduced-motion
//   users we keep the geometry and just shorten the transition
//   `speed` so swipes snap rather than glide, and disable
//   autoplay so nothing moves without their input.
//
// No video preview:
//   We intentionally do NOT auto-mount a live-stream iframe on
//   the active LIVE card. The iframe player was a poor UX in a
//   poster context — slow to load, audible cold-start, broke
//   the slider's calm rhythm. The LIVE badge stays; the card
//   shows the same poster image as any other slide. Clicking
//   through to the detail page is where playback happens.
//
// If you must change this:
//   Keep coverflow the only path. Tweak params (rotate/depth) —
//   do not re-introduce a `slidesPerView`-based flat branch or
//   the autoplay iframe.
// =============================================================

const COVERFLOW_PARAMS = Object.freeze({
  rotate: 50,
  stretch: 0,
  depth: 100,
  modifier: 1,
  slideShadows: false
});
const COVERFLOW_SPEED_DEFAULT = 900;
const COVERFLOW_SPEED_REDUCED = 0;

// Exactly 3 cards on desktop (1 active centered + 1 tilted on each side).
// Breakpoints are min-width: at ≥1024px → 3, 640–1023px → 2, <640px → 1.2
// (gives a small peek on mobile so the swipe gesture is discoverable).
const SLIDES_BREAKPOINTS = Object.freeze({
  0: { slidesPerView: 1.2, spaceBetween: 16 },
  640: { slidesPerView: 2, spaceBetween: 20 },
  1024: { slidesPerView: 3, spaceBetween: 24 }
});

const AUTOPLAY_OPTIONS = Object.freeze({
  delay: 5000,
  disableOnInteraction: false,
  pauseOnMouseEnter: true
});

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

// Sum the `filled` field across an event's rolesNeeded array. This
// is the count of humans who have actually signed up for a role
// (NOT the number of role types). Returns null when there's no
// roster data so the badge can be skipped instead of showing "0".
function getParticipantCount(event) {
  const roster = event?.rolesNeeded;
  if (!Array.isArray(roster) || roster.length === 0) return null;
  const total = roster.reduce(
    (sum, role) => sum + (Number.isFinite(role?.filled) ? role.filled : 0),
    0
  );
  return total > 0 ? total : null;
}

function formatParticipantsLabel(count, language, copy) {
  if (!Number.isFinite(count) || count <= 0) return null;
  const label = copy?.participantsLabel || (language === "np" ? "सहभागी" : "participants");
  return `${localizeDigits(count, language)} ${label}`;
}

export function EventsHomeRail({
  liveEvents = [],
  upcomingEvents = [],
  copy,
  language = "np"
}) {
  const reduceMotion = useReducedMotion();

  const items = [
    ...liveEvents.map((event) => ({ kind: "live", event })),
    ...upcomingEvents.map((event) => ({ kind: "upcoming", event }))
  ];
  const isEmpty = items.length === 0;

  const [activeIndex, setActiveIndex] = useState(0);
  const handleActive = (swiper) => setActiveIndex(swiper.realIndex);

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
          <TertiaryButton
            href="/events"
            icon={<ArrowRightOutlined />}
            iconPosition="trailing"
            className="events-home-rail-view-all"
          >
            {copy?.viewAll}
          </TertiaryButton>
        </header>
      </div>

      {isEmpty ? (
        <div className="events-home-rail-shell">
          <div className="events-home-rail-empty">
            <span className="events-home-rail-empty-icon" aria-hidden="true">📺</span>
            <p>{copy?.emptyMessage}</p>
          </div>
        </div>
      ) : (
        <Swiper
          className="events-home-rail-swiper"
          effect="coverflow"
          grabCursor
          centeredSlides
          breakpoints={SLIDES_BREAKPOINTS}
          loop={items.length > 3}
          speed={reduceMotion ? COVERFLOW_SPEED_REDUCED : COVERFLOW_SPEED_DEFAULT}
          keyboard={{ enabled: true }}
          coverflowEffect={COVERFLOW_PARAMS}
          autoplay={reduceMotion ? false : AUTOPLAY_OPTIONS}
          pagination={{ clickable: true }}
          navigation
          onSwiper={handleActive}
          onSlideChange={handleActive}
          a11y={{
            prevSlideMessage: copy?.prevAria,
            nextSlideMessage: copy?.nextAria,
            containerRoleDescriptionMessage: copy?.ariaCarousel
          }}
          modules={[EffectCoverflow, Pagination, Navigation, Keyboard, A11y, Autoplay]}
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <SwiperSlide key={item.event.id} className="events-home-rail-slide">
                {item.kind === "live" ? (
                  <LivePosterCard
                    event={item.event}
                    copy={copy}
                    language={language}
                    isActive={isActive}
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
          })}
        </Swiper>
      )}
    </section>
  );
}

function LivePosterCard({ event, copy, language, isActive }) {
  const durationLabel = formatLiveDuration(event?.liveStream?.startedAt, copy);
  const thumbnailUrl = event?.liveStream?.thumbnailUrl;
  const participantsLabel = formatParticipantsLabel(
    getParticipantCount(event),
    language,
    copy
  );
  void isActive;

  return (
    <article className="events-home-rail-poster-card events-home-rail-poster-card--live">
      <Link
        href={`/events/${event.id}`}
        className="events-home-rail-poster-link"
        aria-label={event.title}
      >
        <div className="events-home-rail-poster">
          {thumbnailUrl ? (
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
              {participantsLabel ? (
                <span className="events-home-rail-poster-badge events-home-rail-poster-badge--meta">
                  <TeamOutlined aria-hidden="true" /> {participantsLabel}
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
  const dateLabel = formatScheduledPill(event.scheduledAt, language);
  const participantsLabel = formatParticipantsLabel(
    getParticipantCount(event),
    language,
    copy
  );
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
              {participantsLabel ? (
                <span className="events-home-rail-poster-badge events-home-rail-poster-badge--meta">
                  <TeamOutlined aria-hidden="true" /> {participantsLabel}
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
