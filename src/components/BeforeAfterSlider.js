"use client";

// Before/after image slider. Two images stacked at the same position,
// the "after" image clipped to a divider position the user can drag.
// Drag the vertical handle left/right (or arrow-keys) to scrub.
//
// Used on past event detail pages to show the cleanup impact: same
// vantage point, photo before sweep vs. photo after sweep.

import { useEffect, useRef, useState } from "react";

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeAlt = "",
  afterAlt = "",
  beforeLabel,
  afterLabel,
  ariaLabel
}) {
  const containerRef = useRef(null);
  const [position, setPosition] = useState(50);
  const draggingRef = useRef(false);

  const updateFromClientX = (clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, ratio)));
  };

  useEffect(() => {
    const onMove = (event) => {
      if (!draggingRef.current) return;
      const clientX =
        event.touches && event.touches[0]
          ? event.touches[0].clientX
          : event.clientX;
      if (Number.isFinite(clientX)) updateFromClientX(clientX);
    };
    const stop = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  const onPointerDown = (event) => {
    draggingRef.current = true;
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    if (Number.isFinite(clientX)) updateFromClientX(clientX);
  };

  const onKey = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPosition((p) => Math.max(0, p - 4));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setPosition((p) => Math.min(100, p + 4));
    } else if (event.key === "Home") {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setPosition(100);
    }
  };

  return (
    <div
      ref={containerRef}
      className="ba-slider"
      role="region"
      aria-label={ariaLabel}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
    >
      {/* eslint-disable @next/next/no-img-element */}
      <img className="ba-slider-img ba-slider-before" src={beforeUrl} alt={beforeAlt} />
      <div
        className="ba-slider-after-wrap"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img className="ba-slider-img ba-slider-after" src={afterUrl} alt={afterAlt} />
      </div>
      {/* eslint-enable @next/next/no-img-element */}
      {beforeLabel ? (
        <span className="ba-slider-label ba-slider-label-before" aria-hidden="true">
          {beforeLabel}
        </span>
      ) : null}
      {afterLabel ? (
        <span className="ba-slider-label ba-slider-label-after" aria-hidden="true">
          {afterLabel}
        </span>
      ) : null}
      <div
        className="ba-slider-handle"
        style={{ left: `${position}%` }}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        onKeyDown={onKey}
      >
        <span className="ba-slider-handle-bar" aria-hidden="true" />
        <span className="ba-slider-handle-knob" aria-hidden="true">
          <span className="ba-slider-handle-arrow ba-slider-handle-arrow-left" />
          <span className="ba-slider-handle-arrow ba-slider-handle-arrow-right" />
        </span>
      </div>
    </div>
  );
}
