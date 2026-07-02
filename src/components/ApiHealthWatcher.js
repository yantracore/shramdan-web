"use client";

// Global outage banner. When apiClient reports the backend unreachable, this
// shows a glassy "server is resting" pill and quietly polls a cheap endpoint
// with backoff until the backend answers again, then hides itself.

import { useEffect, useSyncExternalStore } from "react";
import { getJson } from "@/lib/apiClient";
import { getApiHealth, subscribeApiHealth } from "@/lib/apiHealth";
import { usePreferences } from "@/app/providers";

const COPY = {
  np: { title: "सर्भर अहिले विश्राममा", hint: "फेरि जोड्दैछौँ…" },
  en: { title: "Our servers are taking a breather", hint: "Reconnecting…" }
};

// Backoff while down: 5s → 10s → 20s → 30s (capped).
const POLL_STEPS = [5000, 10000, 20000, 30000];
const SERVER_SNAPSHOT = { status: "up", reason: null };

export function ApiHealthWatcher() {
  const { status } = useSyncExternalStore(
    subscribeApiHealth,
    getApiHealth,
    () => SERVER_SNAPSHOT
  );
  const { language } = usePreferences();
  const down = status === "down";

  useEffect(() => {
    if (!down) return undefined;

    let cancelled = false;
    let attempt = 0;
    let timer = null;

    const poll = async () => {
      if (cancelled) return;
      try {
        // A success flips health to "up" via apiClient, which re-renders this
        // to null and tears the loop down. The payload is irrelevant —
        // /campaigns/counts is the cheapest public endpoint.
        await getJson("/campaigns/counts");
      } catch {
        // Still unreachable — apiClient already re-reported "down".
      }
      if (cancelled) return;
      const delay = POLL_STEPS[Math.min(attempt, POLL_STEPS.length - 1)];
      attempt += 1;
      timer = window.setTimeout(poll, delay);
    };

    timer = window.setTimeout(poll, POLL_STEPS[0]);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [down]);

  if (!down) return null;

  const t = COPY[language] ?? COPY.np;

  return (
    <div className="api-health-banner" role="status" aria-live="polite">
      <span className="api-health-banner-dot" aria-hidden="true" />
      <span className="api-health-banner-title">{t.title}</span>
      <span className="api-health-banner-hint">{t.hint}</span>
    </div>
  );
}
