"use client";

// Single-line activity ticker. Cycles through demo entries every ~4s
// with a soft crossfade. Each entry is "<actor> <verb-phrase> · X मि. अघि".
// Used below the homepage hero to give the cold-page-load a sense of
// "real people are moving here right now".

import { ThunderboltOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDemoActivityTicker } from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: { minutesAgo: "{n} मि. अघि", live: "अहिले" },
  en: { minutesAgo: "{n} min ago", live: "Live" }
};

export function ActivityTicker({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const [items] = useState(() => getDemoActivityTicker());
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length === 0) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;
  const current = items[index];

  return (
    <aside className="activity-ticker" role="status" aria-live="polite">
      <span className="activity-ticker-badge" aria-hidden="true">
        <ThunderboltOutlined /> {t.live}
      </span>
      <span key={index} className="activity-ticker-item">
        <Link href={current.href || "#"} className="activity-ticker-link">
          <strong>{current.actor}</strong>
          <span className="activity-ticker-action">
            {current.action?.[language] || current.action?.np || ""}
          </span>
          <span className="activity-ticker-time">
            ·{" "}
            {t.minutesAgo.replace(
              "{n}",
              localizeDigits(current.minutesAgo, language)
            )}
          </span>
        </Link>
      </span>
    </aside>
  );
}
