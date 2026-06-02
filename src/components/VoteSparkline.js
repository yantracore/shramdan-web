"use client";

// Tiny SVG sparkline for /issues/[id] showing the vote-count trend
// over the last 8 days (dummy series from getDemoVoteHistory). No
// dependencies — hand-rolled SVG path. Designed to fit inline in a
// label like "comm. priority rising · _____".

import { useMemo } from "react";
import { getDemoVoteHistory } from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: { trend: "८ दिनको प्रवृत्ति", upBy: "+{n} समर्थन" },
  en: { trend: "8-day trend", upBy: "+{n} supports" }
};

export function VoteSparkline({ issueId, language = "np", width = 120, height = 32 }) {
  const t = COPY[language] || COPY.np;
  const points = useMemo(() => getDemoVoteHistory(issueId), [issueId]);
  if (!points || points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);
  const padTop = 3;
  const padBot = 3;
  const drawH = height - padTop - padBot;

  const pathD = points
    .map((p, i) => {
      const x = i * stepX;
      const y = padTop + drawH - ((p - min) / range) * drawH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaD = `${pathD} L${width} ${height - padBot} L0 ${height - padBot} Z`;
  const last = points[points.length - 1];
  const first = points[0];
  const delta = Math.max(0, last - first);

  return (
    <span className="vote-sparkline" role="img" aria-label={t.trend}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ss-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#ss-grad)" />
        <path
          d={pathD}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={(points.length - 1) * stepX}
          cy={padTop + drawH - ((last - min) / range) * drawH}
          r="2.2"
          fill="var(--accent)"
        />
      </svg>
      {delta > 0 ? (
        <span className="vote-sparkline-delta">
          {t.upBy.replace("{n}", localizeDigits(delta, language))}
        </span>
      ) : null}
    </span>
  );
}
