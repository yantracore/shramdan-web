"use client";

// Reusable empty-state with one of three inline SVG illustrations.
// All paths use currentColor so they pick up --primary on the parent.
// Sizes itself to its container; the SVG scales via viewBox.
//
//   <EmptyState kind="no-results" title="..." body="..." cta={...} />
//
// kinds:
//   no-results  — magnifier over a tilted card stack
//   no-saved    — outline heart with broken-line aura
//   no-events   — calendar grid with one slot highlighted

import Link from "next/link";

const ART = {
  "no-results": (
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="36" y="34" width="64" height="42" rx="6" />
        <rect x="46" y="44" width="64" height="42" rx="6" transform="rotate(-4 78 65)" />
        <line x1="58" y1="58" x2="92" y2="58" />
        <line x1="58" y1="68" x2="84" y2="68" />
        <circle cx="116" cy="50" r="14" />
        <line x1="126" y1="60" x2="138" y2="72" />
      </g>
    </svg>
  ),
  "no-saved": (
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M80 92 C 50 72 38 56 38 42 a 16 16 0 0 1 30 -8 a 16 16 0 0 1 30 8 c 0 14 -12 30 -42 50 z" />
        <path d="M22 30 l 6 6" strokeDasharray="2 4" />
        <path d="M138 30 l -6 6" strokeDasharray="2 4" />
        <path d="M14 70 l 8 0" strokeDasharray="2 4" />
        <path d="M146 70 l -8 0" strokeDasharray="2 4" />
      </g>
    </svg>
  ),
  "no-events": (
    <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="34" y="28" width="92" height="76" rx="6" />
        <line x1="34" y1="46" x2="126" y2="46" />
        <line x1="52" y1="20" x2="52" y2="36" />
        <line x1="108" y1="20" x2="108" y2="36" />
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={42 + col * 20}
              y={54 + row * 16}
              width="14"
              height="10"
              rx="2"
              opacity={row === 1 && col === 2 ? "1" : "0.35"}
              fill={row === 1 && col === 2 ? "currentColor" : "none"}
            />
          ))
        )}
      </g>
    </svg>
  )
};

export function EmptyState({ kind = "no-results", title, body, cta }) {
  return (
    <div className="empty-state" role="status">
      <div className={`empty-state-art empty-state-art--${kind}`}>
        {ART[kind] || ART["no-results"]}
      </div>
      {title ? <h2 className="empty-state-title">{title}</h2> : null}
      {body ? <p className="empty-state-body">{body}</p> : null}
      {cta ? (
        cta.href ? (
          <Link className="empty-state-cta" href={cta.href}>
            {cta.label}
          </Link>
        ) : (
          <button type="button" className="empty-state-cta" onClick={cta.onClick}>
            {cta.label}
          </button>
        )
      ) : null}
    </div>
  );
}
