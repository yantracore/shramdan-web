"use client";

// Tiny greeting chip that adapts to the current hour in Kathmandu time.
// Shown above the hero h1 so the cold-load page feels like it greeted
// the visitor specifically. Renders nothing during SSR (depends on
// Date.now) to avoid hydration mismatch.

import { useEffect, useState } from "react";

const COPY = {
  np: {
    morning: "शुभप्रभात",
    afternoon: "नमस्कार",
    evening: "शुभ साँझ",
    night: "शुभरात्रि"
  },
  en: {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Good night"
  }
};

function pickGreeting(t, hour) {
  if (hour < 5) return t.night;
  if (hour < 12) return t.morning;
  if (hour < 17) return t.afternoon;
  if (hour < 21) return t.evening;
  return t.night;
}

function nptHour() {
  // Asia/Kathmandu hour, 0-23, derived via Intl so the greeting is
  // anchored to Nepal time regardless of the visitor's locale.
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      hour12: false
    }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    return Number.isFinite(h) ? h : new Date().getHours();
  } catch {
    return new Date().getHours();
  }
}

export function TimeOfDayGreeting({ language = "np" }) {
  const t = COPY[language] || COPY.np;
  const [hour, setHour] = useState(null);

  useEffect(() => {
    setHour(nptHour());
    const id = window.setInterval(() => setHour(nptHour()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (hour === null) return null;

  return (
    <span className="time-greeting" aria-hidden="true">
      {pickGreeting(t, hour)} ·
    </span>
  );
}
