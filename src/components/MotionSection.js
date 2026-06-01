"use client";

// Phase 8 motion grammar — revised after user feedback (2026-06-01):
// "homepage animations are too fast — make them much slower. and don't
//  reveal whole section at a time. when scrolled, reveal animation
//  should work from smaller components level for better UX."
//
// MotionSection is now a thin IntersectionObserver wrapper. The actual
// fade-up + per-child stagger is CSS-driven (see design-tokens.css for
// the .motion-aware rules + per-grid stagger). This keeps each child
// fading in individually rather than the whole section ghosting in.
//
// Reduced-motion + the user's entranceAnimation toggle still gate the
// animation off. When disabled, children render at full opacity with
// no transform — no flash of invisible content.

import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/app/providers";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);
  return reduced;
}

export function MotionSection({ as = "section", children, className, ...rest }) {
  const { entranceAnimation } = usePreferences();
  const reduceMotion = usePrefersReducedMotion();
  const shouldAnimate = entranceAnimation && !reduceMotion;
  const ref = useRef(null);
  // When animation is off, render in the "in view" final state from the
  // start so children are immediately visible.
  const [inView, setInView] = useState(!shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate) {
      setInView(true);
      return;
    }
    if (!ref.current) return;
    const el = ref.current;
    setInView(false); // reset to initial state when animation enabled
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldAnimate]);

  const Tag = as;
  const classes = ["motion-aware", className].filter(Boolean).join(" ");
  return (
    <Tag
      ref={ref}
      className={classes}
      data-in-view={inView ? "true" : "false"}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// StaggerList / StaggerItem are kept as no-op wrappers for backward
// compat with any caller that imported them; the new CSS-driven model
// staggers via :nth-child inside .motion-aware automatically, so callers
// don't need to opt-in per child.
export function StaggerList({ as = "div", className, children, ...rest }) {
  const Tag = as;
  return (
    <Tag className={className} {...rest}>
      {children}
    </Tag>
  );
}

export function StaggerItem({ as = "div", className, children, ...rest }) {
  const Tag = as;
  return (
    <Tag className={className} {...rest}>
      {children}
    </Tag>
  );
}
