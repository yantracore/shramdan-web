"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { usePreferences } from "@/app/providers";
import { staggerContainer, staggerItem } from "@/lib/motion";

// Unified home rail: one Netflix-style paged slider combining
// currently-live and upcoming-scheduled events. Overlay arrows at the
// viewport edges, hover-intent card expand, keyboard paging, full-bleed
// track with constrained heading.

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

// Chromium's Intl "ne-NP" emits Latin digits and inconsistent abbreviations,
// and the SSR/CSR pair produced hydration warnings — so we compose NP manually.
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

const CARD_PEEK_PX = 40;
const HOVER_INTENT_MS = 450;

export function EventsHomeRail({
  liveEvents = [],
  upcomingEvents = [],
  copy,
  language = "np"
}) {
  const reduceMotion = useReducedMotion();
  const { entranceAnimation } = usePreferences();
  const animationsOn = !reduceMotion && entranceAnimation;

  const items = [
    ...liveEvents.map((event) => ({ kind: "live", event })),
    ...upcomingEvents.map((event) => ({ kind: "upcoming", event }))
  ];
  const isEmpty = items.length === 0;

  return (
    <section
      className="events-home-rail"
      role="region"
      aria-roledescription="carousel"
      aria-label={copy?.ariaCarousel || copy?.title}
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
          <div className="live-events-rail-empty">
            <span className="live-events-rail-empty-icon" aria-hidden="true">📺</span>
            <p>{copy?.emptyMessage}</p>
          </div>
        </div>
      ) : (
        <HomeRailTrack
          items={items}
          copy={copy}
          language={language}
          animationsOn={animationsOn}
        />
      )}
    </section>
  );
}

function HomeRailTrack({ items, copy, language, animationsOn }) {
  const trackRef = useRef(null);
  const hoverTimer = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [pageRange, setPageRange] = useState({ start: 1, end: Math.min(4, items.length) });

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    // Compute visible card range for the aria-live status
    const cards = Array.from(el.querySelectorAll("[data-rail-card]"));
    if (!cards.length) return;
    const viewLeft = el.scrollLeft;
    const viewRight = viewLeft + el.clientWidth;
    let firstVisible = -1;
    let lastVisible = -1;
    cards.forEach((card, i) => {
      const cardLeft = card.offsetLeft;
      const cardRight = cardLeft + card.offsetWidth;
      const visible = cardRight > viewLeft + 8 && cardLeft < viewRight - 8;
      if (visible) {
        if (firstVisible === -1) firstVisible = i;
        lastVisible = i;
      }
    });
    if (firstVisible >= 0) {
      setPageRange({ start: firstVisible + 1, end: lastVisible + 1 });
    }
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        updateEdges();
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);

    updateEdges();
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [updateEdges, items.length]);

  const scrollByPage = useCallback(
    (direction) => {
      const el = trackRef.current;
      if (!el) return;
      const step = Math.max(el.clientWidth - CARD_PEEK_PX, 200);
      el.scrollTo({
        left: el.scrollLeft + direction * step,
        behavior: animationsOn ? "smooth" : "instant"
      });
    },
    [animationsOn]
  );

  const handleKeyDown = useCallback(
    (e) => {
      const el = trackRef.current;
      if (!el) return;
      const cards = Array.from(el.querySelectorAll("[data-rail-card] a"));
      const currentIndex = cards.findIndex((c) => c === document.activeElement);

      const focusCard = (idx) => {
        const target = cards[idx];
        if (!target) return;
        target.focus({ preventScroll: true });
        target.closest("[data-rail-card]")?.scrollIntoView({
          behavior: animationsOn ? "smooth" : "instant",
          inline: "start",
          block: "nearest"
        });
      };

      if (e.key === "ArrowRight") {
        e.preventDefault();
        focusCard(Math.min(cards.length - 1, Math.max(currentIndex + 1, 0)));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusCard(Math.max(0, currentIndex - 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        focusCard(0);
      } else if (e.key === "End") {
        e.preventDefault();
        focusCard(cards.length - 1);
      }
    },
    [animationsOn]
  );

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const handleCardEnter = (id) => {
    if (!animationsOn) return;
    clearHoverTimer();
    hoverTimer.current = setTimeout(() => setExpandedId(id), HOVER_INTENT_MS);
  };
  const handleCardLeave = () => {
    clearHoverTimer();
    setExpandedId(null);
  };

  useEffect(() => () => clearHoverTimer(), []);

  const statusTemplate = copy?.pageStatus || "{start}–{end} of {total}";
  const statusText = statusTemplate
    .replace("{start}", localizeDigits(pageRange.start, language))
    .replace("{end}", localizeDigits(pageRange.end, language))
    .replace("{total}", localizeDigits(items.length, language));

  const ListTag = animationsOn ? motion.ul : "ul";
  const listProps = animationsOn ? staggerContainer : {};

  return (
    <div className="events-home-rail-track-wrap">
      <button
        type="button"
        className="events-home-rail-arrow events-home-rail-arrow--prev"
        aria-label={copy?.prevAria || "Previous"}
        onClick={() => scrollByPage(-1)}
        disabled={atStart}
      >
        <LeftOutlined aria-hidden="true" />
      </button>

      <ListTag
        ref={trackRef}
        className="events-home-rail-track"
        onKeyDown={handleKeyDown}
        {...listProps}
      >
        {items.map((item) =>
          item.kind === "live" ? (
            <LiveCard
              key={item.event.id}
              event={item.event}
              copy={copy}
              animated={animationsOn}
              isExpanded={expandedId === item.event.id}
              onEnter={() => handleCardEnter(item.event.id)}
              onLeave={handleCardLeave}
            />
          ) : (
            <UpcomingCard
              key={item.event.id}
              event={item.event}
              language={language}
              animated={animationsOn}
              isExpanded={expandedId === item.event.id}
              onEnter={() => handleCardEnter(item.event.id)}
              onLeave={handleCardLeave}
            />
          )
        )}
      </ListTag>

      <button
        type="button"
        className="events-home-rail-arrow events-home-rail-arrow--next"
        aria-label={copy?.nextAria || "Next"}
        onClick={() => scrollByPage(1)}
        disabled={atEnd}
      >
        <RightOutlined aria-hidden="true" />
      </button>

      <span className="events-home-rail-sr-status" aria-live="polite">
        {animationsOn ? statusText : ""}
      </span>
    </div>
  );
}

function LiveCard({ event, copy, animated, isExpanded, onEnter, onLeave }) {
  const Wrapper = animated ? motion.li : "li";
  const wrapperProps = animated ? staggerItem : {};
  const startedAt = event?.liveStream?.startedAt;
  const durationLabel = formatLiveDuration(startedAt, copy);
  const viewers = event?.liveStream?.viewerCount;
  const previewUrl = event?.liveStream?.previewEmbedUrl || event?.liveStream?.streamUrl;
  const showPreview = isExpanded && previewUrl;

  return (
    <Wrapper
      className="events-home-rail-card live-events-rail-card"
      data-rail-card
      data-expanded={isExpanded ? "true" : undefined}
      {...wrapperProps}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
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

          <AnimatePresence>
            {showPreview ? (
              <motion.div
                key="preview"
                className="live-events-rail-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                aria-hidden="true"
              >
                <iframe
                  src={previewUrl}
                  title={`${event.title} live preview`}
                  allow="autoplay; encrypted-media"
                  loading="lazy"
                  frameBorder="0"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

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
    </Wrapper>
  );
}

function UpcomingCard({ event, language, animated, isExpanded, onEnter, onLeave }) {
  const Wrapper = animated ? motion.li : "li";
  const wrapperProps = animated ? staggerItem : {};
  const roleCount = Array.isArray(event?.rolesNeeded) ? event.rolesNeeded.length : 0;

  return (
    <Wrapper
      className="events-home-rail-card live-events-rail-card"
      data-rail-card
      data-expanded={isExpanded ? "true" : undefined}
      {...wrapperProps}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
    >
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
    </Wrapper>
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
