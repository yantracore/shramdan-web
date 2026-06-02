"use client";

// Horizontally-scrollable strip of "recently viewed" chips, pulled
// from the useRecentlyViewed store. Renders nothing on first visit
// (empty list) so the homepage doesn't show an awkward blank space
// before the user has clicked anything.

import { ArrowRightOutlined, HistoryOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRecentlyViewed } from "@/lib/useRecentlyViewed";

const COPY = {
  np: { title: "हालै हेरेका", clear: "खाली गर्नुहोस्" },
  en: { title: "Recently viewed", clear: "Clear" }
};

export function RecentlyViewedStrip({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const { items, clear } = useRecentlyViewed();
  if (!items || items.length === 0) return null;

  return (
    <section className="recent-strip" aria-label={t.title}>
      <header className="recent-strip-head">
        <HistoryOutlined aria-hidden="true" />
        <h2>{t.title}</h2>
        <button type="button" className="recent-strip-clear" onClick={clear}>
          {t.clear}
        </button>
      </header>
      <ul className="recent-strip-list">
        {items.map((it) => (
          <li key={it.href} className="recent-strip-item">
            <Link href={it.href}>
              <strong>{it.title || it.href}</strong>
              {it.subtitle ? <span>{it.subtitle}</span> : null}
              <ArrowRightOutlined aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
