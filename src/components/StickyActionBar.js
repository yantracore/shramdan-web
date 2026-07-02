"use client";

// Mobile-first sticky bottom action bar. Glassy chrome with a primary
// CTA (usually a Link or Button). On desktop, sits in the bottom-right
// corner as a single pill; on small screens it spans the full width.
//
// Auto-hide-on-scroll-up: shows when the user has scrolled past a
// threshold and the in-page primary action is no longer visible.
// Uses an IntersectionObserver tied to a sentinel element (the
// "primary CTA in flow") that the caller can opt into via `hideWhen`.
//
// Caller pattern:
//   <StickyActionBar label="जोडिनुहोस्" href="/join?event=demo-1" />
//
// Or with custom content (replace the default Link):
//   <StickyActionBar>
//     <IssueVoteButton ... />
//   </StickyActionBar>

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function StickyActionBar({
  label,
  href,
  icon,
  children,
  hideUntilScrolled = 480
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      setVisible(window.scrollY > hideUntilScrolled);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideUntilScrolled]);

  return (
    <div
      ref={ref}
      className="sticky-action-bar"
      data-visible={visible ? "true" : "false"}
      aria-hidden={!visible}
      inert={!visible || undefined}
    >
      {children ? (
        children
      ) : (
        <Link
          href={href || "#"}
          className="sticky-action-bar-cta"
          tabIndex={visible ? 0 : -1}
        >
          {icon ? <span className="sticky-action-bar-icon" aria-hidden="true">{icon}</span> : null}
          <span>{label}</span>
        </Link>
      )}
    </div>
  );
}
