"use client";

// Tiny CSS-only confetti burst. Spawns 18 colored squares from the top
// of the parent container and lets them fall + spin via a CSS keyframe.
// Total duration ~1.8s, then they auto-clean (display: none).
// No external lib, no canvas, no JS animation loop — paint-only.
//
// Usage: drop <ConfettiBurst /> inside any container that should celebrate
// a success state (parent must be position: relative; component is
// absolute-positioned).

import { useEffect, useState } from "react";

const COLORS = [
  "#176b5c",
  "#e75f1b",
  "#2e7d32",
  "#b7791f",
  "#7b3fa0",
  "#1d4ed8",
  "#d2360b"
];

function buildPieces(count = 18, seedMs) {
  const pieces = [];
  for (let i = 0; i < count; i += 1) {
    // Cheap deterministic-ish pseudo-random so reduced-motion users
    // who reload don't trigger DOM diffs.
    const seed = (seedMs + i * 9301 + 49297) % 233280;
    const rand = seed / 233280;
    pieces.push({
      id: i,
      left: 10 + rand * 80, // 10–90% width
      delay: (i * 60) + (rand * 200), // ms
      rotation: (rand * 720) - 360, // -360°..+360°
      color: COLORS[i % COLORS.length],
      size: 6 + rand * 6 // 6–12px
    });
  }
  return pieces;
}

export function ConfettiBurst({ active = true }) {
  const [pieces, setPieces] = useState([]);
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) return undefined;
    if (typeof window !== "undefined" && window.matchMedia) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return undefined;
      }
    }
    setPieces(buildPieces(18, Date.now()));
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!visible || pieces.length === 0) return null;

  return (
    <span className="confetti-burst" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}ms`,
            "--confetti-color": p.color,
            "--confetti-size": `${p.size}px`,
            "--confetti-rotation": `${p.rotation}deg`
          }}
        />
      ))}
    </span>
  );
}
