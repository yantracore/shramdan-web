"use client";

// Floating "back to top" button. Standalone usage fades in once the user has
// scrolled past ~600 px; inline usage lets its parent shell own visibility.

import { ArrowUpOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

const COPY = {
  np: { aria: "माथि फर्कनुहोस्" },
  en: { aria: "Back to top" }
};

const SHOW_AFTER = 600;

export function BackToTop({ language = "np", variant, visible: controlledVisible }) {
  const t = COPY[language] || COPY.np;
  const isInline = variant === "inline";
  const [scrolled, setScrolled] = useState(false);
  const variantClass = isInline ? " back-to-top--inline" : "";

  useEffect(() => {
    if (isInline) {
      return undefined;
    }

    const onScroll = () => {
      setScrolled(window.scrollY > SHOW_AFTER);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isInline]);

  const handleClick = () => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: reduced ? "auto" : "smooth"
    });
  };

  // Inline visibility is controlled by the shell panel; standalone usage
  // keeps this component's scroll-based fade-in.
  const visible = isInline ? Boolean(controlledVisible) : scrolled;

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
