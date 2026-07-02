"use client";

// Homepage discovery strip — a horizontal, scrollable row of campaign cards.
//
// DELIBERATELY has NO carousel library. It is a plain native scroll container
// (`overflow-x: auto` + scroll-snap). Every earlier version used Swiper, which
// computes each card's width in JavaScript from the container's measured width
// and bakes it as an inline style; on a client-side return to "/" the row
// remounts and that measurement can be read at the wrong moment, permanently
// baking a broken width (one giant card / collapsed gaps). Here NOTHING measures
// anything — the browser lays the cards out from pure CSS widths. There is no
// measurement to get wrong, so the row cannot break on navigation, ever.
//
// The prev/next buttons just call the native `scrollBy`; the card widths live
// entirely in discovery-strip.css.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRightOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons";
import CampaignCard from "@/components/CampaignCard";
import "@/styles/discovery-strip.css";

export default function DiscoveryStrip({
  eyebrow,
  title,
  viewAllHref,
  viewAllLabel,
  items,
  language
}) {
  const trackRef = useRef(null);
  // Which arrows to show + which edge to fade. Purely cosmetic — derived from the
  // native scroll position, never feeds back into card sizing.
  const [ends, setEnds] = useState({ atStart: true, atEnd: true });

  const syncEnds = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 2;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
    setEnds((prev) =>
      prev.atStart === atStart && prev.atEnd === atEnd ? prev : { atStart, atEnd }
    );
  }, []);

  useEffect(() => {
    syncEnds();
    const el = trackRef.current;
    if (!el) return undefined;
    el.addEventListener("scroll", syncEnds, { passive: true });
    window.addEventListener("resize", syncEnds);
    return () => {
      el.removeEventListener("scroll", syncEnds);
      window.removeEventListener("resize", syncEnds);
    };
  }, [syncEnds, items]);

  const nudge = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    // Scroll by most of a viewport-width so a card stays for context.
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  };

  if (!items || items.length === 0) return null;

  const prevLabel = language === "np" ? "अघिल्लो" : "Previous";
  const nextLabel = language === "np" ? "अर्को" : "Next";

  return (
    <section className="discovery-strip" aria-label={title}>
      <header className="discovery-strip-head">
        <div className="discovery-strip-titles">
          {eyebrow ? (
            <span className="eyebrow discovery-strip-eyebrow">{eyebrow}</span>
          ) : null}
          <h2 className="discovery-strip-title">{title}</h2>
        </div>
        {viewAllHref ? (
          <Link className="discovery-strip-viewall" href={viewAllHref}>
            {viewAllLabel}
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
        ) : null}
      </header>

      <div className="discovery-strip-scroller">
        <button
          type="button"
          className={`discovery-strip-nav discovery-strip-nav--prev${
            ends.atStart ? " is-off" : ""
          }`}
          aria-label={prevLabel}
          aria-hidden={ends.atStart ? "true" : "false"}
          tabIndex={ends.atStart ? -1 : 0}
          onClick={() => nudge(-1)}
        >
          <LeftOutlined aria-hidden="true" />
        </button>

        <ul
          className="discovery-strip-track"
          ref={trackRef}
          data-at-start={ends.atStart ? "true" : "false"}
          data-at-end={ends.atEnd ? "true" : "false"}
        >
          {items.map(({ entry, distanceKm }) => (
            <li className="discovery-strip-cell" key={`${entry.kind}-${entry.id}`}>
              <CampaignCard
                campaign={{ kind: entry.kind, data: entry.data }}
                distanceKm={distanceKm}
                language={language}
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={`discovery-strip-nav discovery-strip-nav--next${
            ends.atEnd ? " is-off" : ""
          }`}
          aria-label={nextLabel}
          aria-hidden={ends.atEnd ? "true" : "false"}
          tabIndex={ends.atEnd ? -1 : 0}
          onClick={() => nudge(1)}
        >
          <RightOutlined aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
