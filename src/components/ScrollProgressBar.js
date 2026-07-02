"use client";

// Thin progress bar pinned to the top of the viewport that fills as the
// user scrolls through the page. Used on long-form pages like
// /issues/[id] where the reader benefits from "how much is left" feedback.
//
// Uses requestAnimationFrame-throttled scroll listeners and a CSS
// transform (scaleX) so the paint stays on the compositor thread.

import { useEffect, useRef, useState } from "react";

export function ScrollProgressBar({ targetSelector }) {
  const [progress, setProgress] = useState(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const compute = () => {
      const target = targetSelector ? document.querySelector(targetSelector) : null;
      let ratio = 0;
      if (target) {
        const rect = target.getBoundingClientRect();
        const total = Math.max(1, rect.height - window.innerHeight);
        const scrolled = Math.min(total, Math.max(0, -rect.top));
        ratio = scrolled / total;
      } else {
        const doc = document.documentElement;
        const total = Math.max(1, doc.scrollHeight - window.innerHeight);
        ratio = Math.min(1, Math.max(0, window.scrollY / total));
      }
      setProgress(ratio);
      tickingRef.current = false;
    };

    const onScrollOrResize = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [targetSelector]);

  return (
    <div
      className="scroll-progress-bar"
      aria-hidden="true"
      data-visible={progress > 0.01 ? "true" : "false"}
    >
      <span
        className="scroll-progress-bar-fill"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
