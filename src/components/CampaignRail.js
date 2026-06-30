"use client";

// One horizontal, Netflix-style campaign rail. Flat row (NOT coverflow — that
// is EventsHomeRail's hero treatment). Peeks adjacent cards, fades at the edges,
// prev/next arrows, keyboard + a11y. No autoplay: this is a browse rail.

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y, Keyboard, Navigation } from "swiper/modules";
import {
  ArrowRightOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons";
import CampaignCard from "@/components/CampaignCard";
import "swiper/css";
import "swiper/css/navigation";
import "@/styles/campaign-rail.css";

const BREAKPOINTS = {
  0: { slidesPerView: 1.2, spaceBetween: 14 },
  640: { slidesPerView: 2.2, spaceBetween: 16 },
  1024: { slidesPerView: 3.2, spaceBetween: 18 },
  1280: { slidesPerView: 4.2, spaceBetween: 20 }
};

export default function CampaignRail({
  eyebrow,
  title,
  viewAllHref,
  viewAllLabel,
  items,
  language
}) {
  const reduced = useReducedMotion();
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const swiperRef = useRef(null);

  // Why the rail used to lose its card spacing on every client-side RETURN to
  // "/": SiteShell keys the page wrapper by pathname, so React REMOUNTS this rail
  // and a fresh Swiper inits during a transient layout frame. Swiper bakes each
  // slide's width + gap as INLINE styles from the container's clientWidth at init;
  // if that read is wrong/0 (deferred data populate, dev Strict-Mode double-mount,
  // or a scrollbar-gutter width delta between routes) the slides fall back to the
  // base `width:100%` — one full-width card, no gaps — and it NEVER self-heals:
  // Swiper's own ResizeObserver only fires on a width *change*, observer/
  // observeParents only on DOM *mutations*, and `pageshow` only on bfcache. So we
  // re-measure explicitly. (scrollbar-gutter is also pinned stable in
  // scrollbars.css to remove the width delta at its source.)
  useEffect(() => {
    const s = swiperRef.current;
    if (!s || s.destroyed) return undefined;

    const refresh = () => {
      const inst = swiperRef.current;
      if (inst && !inst.destroyed) inst.update();
    };

    // 1) Re-measure after the heavy home layout (map, fonts, images) settles.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(refresh);
    });

    // 2) update() on ANY box change of the rail element — including the 0->N
    //    first settle and scrollbar-gutter delta that Swiper's width-change-
    //    guarded observer skips. observe() also fires the callback once now.
    const ro = new ResizeObserver(refresh);
    if (s.el) ro.observe(s.el);

    // 3) Keep the bfcache hard back/forward path.
    window.addEventListener("pageshow", refresh);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro.disconnect();
      window.removeEventListener("pageshow", refresh);
    };
    // Re-run when the slide set changes so a late data populate re-measures.
  }, [items]);

  if (!items || items.length === 0) return null;

  const prevClass = `rail-prev-${uid}`;
  const nextClass = `rail-next-${uid}`;
  const titleId = `rail-${uid}-title`;

  return (
    <section className="campaign-rail" aria-labelledby={titleId}>
      <header className="campaign-rail-header">
        <div className="campaign-rail-heading">
          {eyebrow ? (
            <span className="eyebrow campaign-rail-eyebrow">{eyebrow}</span>
          ) : null}
          <h2 id={titleId}>{title}</h2>
        </div>
        {viewAllHref ? (
          <Link className="campaign-rail-viewall" href={viewAllHref}>
            {viewAllLabel}
            <ArrowRightOutlined aria-hidden="true" />
          </Link>
        ) : null}
      </header>

      <div className="campaign-rail-viewport">
        <button
          type="button"
          className={`campaign-rail-arrow campaign-rail-arrow--prev ${prevClass}`}
          aria-label={language === "np" ? "अघिल्लो" : "Previous"}
        >
          <LeftOutlined aria-hidden="true" />
        </button>

        <Swiper
          // Remount cleanly if the slide count changes (e.g. a late data
          // populate) so a wrongly-sized instance can't linger.
          key={items.length}
          modules={[Navigation, Keyboard, A11y]}
          navigation={{ prevEl: `.${prevClass}`, nextEl: `.${nextClass}` }}
          keyboard={{ enabled: true }}
          speed={reduced ? 0 : 420}
          watchOverflow
          breakpoints={BREAKPOINTS}
          // The homepage re-renders often (ticker, live widgets) and remounts on
          // client navigation. Without observers Swiper can keep stale slide
          // widths/spacing after a back-nav — gaps collapse, cards squish. These
          // make it re-measure whenever its DOM or an ancestor mutates.
          observer
          observeParents
          onSwiper={(s) => {
            swiperRef.current = s;
          }}
          className="campaign-rail-swiper"
        >
          {items.map(({ entry, distanceKm }) => (
            <SwiperSlide
              key={`${entry.kind}-${entry.id}`}
              className="campaign-rail-slide"
            >
              <CampaignCard
                campaign={{ kind: entry.kind, data: entry.data }}
                distanceKm={distanceKm}
                language={language}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <button
          type="button"
          className={`campaign-rail-arrow campaign-rail-arrow--next ${nextClass}`}
          aria-label={language === "np" ? "अर्को" : "Next"}
        >
          <RightOutlined aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
