"use client";

// Small "X members online right now" widget. Pure UI; the count
// drifts within a plausible band every ~6s so the homepage feels
// active. Once real presence data exists, swap the useState seed +
// drift for a websocket subscription.

import { useEffect, useState } from "react";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: { label: "अहिले अनलाइन" },
  en: { label: "online now" }
};

const MIN = 84;
const MAX = 132;

function pickInBand(prev) {
  // Drift +/- 4 within the band.
  const delta = Math.floor(Math.random() * 9) - 4;
  return Math.max(MIN, Math.min(MAX, prev + delta));
}

export function LiveOnlineWidget({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const [count, setCount] = useState(() => MIN + Math.floor((MAX - MIN) * 0.5));

  useEffect(() => {
    const id = window.setInterval(() => {
      setCount((c) => pickInBand(c));
    }, 6200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="live-online-widget" role="status" aria-live="polite">
      <span className="live-online-dot" aria-hidden="true" />
      <strong>{localizeDigits(count, language)}</strong>
      <span className="live-online-label">{t.label}</span>
    </span>
  );
}
