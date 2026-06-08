"use client";

// Floating "back to top" button. Fades in once the user has scrolled
// past ~600 px so it never competes with the QuickActionFab at the
// fold; tap it to smooth-scroll back to the top of the page.

import { ArrowUpOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

const COPY = {
  np: { aria: "माथि फर्कनुहोस्" },
  en: { aria: "Back to top" }
};

const SHOW_AFTER = 600;

export function BackToTop({ language = "np", variant }) {
  const t = COPY[language] || COPY.np;
  const isInline = variant === "inline";
  const [scrolled, setScrolled] = useState(false);
  const variantClass = isInline ? " back-to-top--inline" : "";

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SHOW_AFTER);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: reduced ? "auto" : "smooth"
    });
  };

  // Inline variant lives inside the bottom-right corner chip and is part
  // of the persistent shell — always visible, always focusable. The
  // floating (non-inline) variant keeps its scroll-based fade-in.
  const visible = isInline || scrolled;

  return (
    <button
      type="button"
      className={`back-to-top${visible ? " is-visible" : ""}${variantClass}`}
      onClick={handleClick}
      aria-label={t.aria}
      title={t.aria}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUpOutlined aria-hidden="true" />
    </button>
  );
}
