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

export function BackToTop({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER);
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

  return (
    <button
      type="button"
      className={`back-to-top${visible ? " is-visible" : ""}`}
      onClick={handleClick}
      aria-label={t.aria}
      title={t.aria}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUpOutlined aria-hidden="true" />
    </button>
  );
}
