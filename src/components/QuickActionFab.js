"use client";

// Floating action button anchored bottom-right on every public surface.
// Closed state: single + chip linking to /issues/new (the most common
// citizen action). Tap once to expand and reveal three secondary
// actions: report issue, join campaign, share feedback.
//
// Auto-hides on the /issues/new page (where it'd be redundant) and on
// any path nested under /admin (where the admin shell has its own
// chrome).

import {
  FlagOutlined,
  MessageOutlined,
  PlusOutlined,
  TeamOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const COPY = {
  np: {
    open: "द्रुत कार्य",
    report: "समस्या रिपोर्ट",
    join: "अभियानमा सहभागी",
    feedback: "प्रतिक्रिया"
  },
  en: {
    open: "Quick action",
    report: "Report issue",
    join: "Join campaign",
    feedback: "Feedback"
  }
};

const HIDDEN_PREFIXES = ["/issues/new", "/admin", "/me", "/login", "/signup", "/donate"];

export function QuickActionFab({ language = "np", variant }) {
  const t = COPY[language] || COPY.np;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const variantClass = variant === "inline" ? " quick-fab--inline" : "";

  // Close menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close on click outside the fab.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (pathname && HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const actions = [
    { href: "/issues/new", label: t.report, Icon: FlagOutlined, accent: "accent" },
    { href: "/campaign", label: t.join, Icon: TeamOutlined, accent: "primary" },
    { href: "/feedback", label: t.feedback, Icon: MessageOutlined, accent: "muted" }
  ];

  return (
    <div ref={containerRef} className={`quick-fab${open ? " is-open" : ""}${variantClass}`}>
      {open ? (
        <div className="quick-fab-menu" role="menu">
          {actions.map(({ href, label, Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className={`quick-fab-item quick-fab-item--${accent}`}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <span className="quick-fab-item-icon" aria-hidden="true">
                <Icon />
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        className="quick-fab-trigger"
        aria-expanded={open}
        aria-label={t.open}
        onClick={() => setOpen((o) => !o)}
      >
        <PlusOutlined />
      </button>
    </div>
  );
}
