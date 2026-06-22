"use client";

// Bottom-left corner panel that morphs from a 38px chip trigger into a
// full start-menu surface in place — no separate popover, no dropdown.
// The chip itself expands (width + height + padding) and reveals a tile
// grid above the trigger so the click target stays anchored at the BL
// wall corner. Close on Escape, outside click, or tile activation.

import { useEffect, useRef, useState } from "react";
import { AppstoreOutlined, CloseOutlined } from "@ant-design/icons";
import Link from "next/link";

const COPY = {
  np: { title: "अनुप्रयोगहरू", aria: "ऐप मेनु", close: "बन्द गर्ने" },
  en: { title: "Apps", aria: "Apps menu", close: "Close menu" }
};

export function AppsStartMenu({ items, language = "np", onItemSelect }) {
  const t = COPY[language] || COPY.np;
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const handleTileClick = (event, item) => {
    if (typeof onItemSelect === "function") {
      onItemSelect(event, item);
    }
    setOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`site-shell-corner__inner apps-start-menu${open ? " is-expanded" : ""}`}
    >
      <div
        className="apps-start-menu__grid"
        role="menu"
        aria-label={t.title}
        aria-hidden={!open}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="apps-start-tile"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={(event) => handleTileClick(event, item)}
          >
            <span className="apps-start-tile__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="apps-start-tile__label">{item.label}</span>
          </Link>
        ))}
      </div>
      <div className="apps-start-menu__header">
        <button
          ref={triggerRef}
          type="button"
          className="apps-grid-trigger apps-start-menu__trigger"
          aria-expanded={open}
          aria-label={open ? t.close : t.aria}
          title={open ? t.close : t.aria}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <CloseOutlined /> : <AppstoreOutlined />}
        </button>
        <span className="apps-start-menu__title" aria-hidden={!open}>
          {t.title}
        </span>
      </div>
    </div>
  );
}
