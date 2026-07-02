"use client";

import { useEffect, useState } from "react";
import { useCampaignCounts } from "@/lib/useCampaignCounts";
import { campaignStatusLabel } from "@/lib/campaignStatus";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// Eased count-up from 0 → target over `duration` ms. Honors
// prefers-reduced-motion by snapping straight to the final value.
function useCountUp(target, duration = 1000) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return target;
    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduced ? target : 0;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const reduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return undefined;
    }
    if (!Number.isFinite(target)) {
      setValue(0);
      return undefined;
    }
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target, duration]);

  return value;
}

function FunnelCount({ target, language }) {
  const value = useCountUp(target);
  return (
    <span className="activity-funnel-count">
      {localizeDigits(value, language)}
    </span>
  );
}

// The same five-step lifecycle the IssueStatusTimeline draws, reused here as a
// left-to-right funnel: how many activities currently sit in each state. A
// citizen's issue is born OPEN, gets promoted (DRAFT), the event is dated
// (SCHEDULED), runs (ACTIVE), and finishes (COMPLETED). The line tells the
// whole story; the counts show the work flowing through it.
// The five campaign stages, in lifecycle order.
const STEPS = [
  { key: "OPEN" },
  { key: "DRAFT" },
  { key: "SCHEDULED" },
  { key: "ACTIVE" },
  { key: "COMPLETED" }
];

// Filter mode's leading pseudo-step: "no status filter". Not a lifecycle
// stage — picking it hands null back, resetting the map to the full picture.
const ALL_KEY = "ALL";

const COPY = {
  np: { ariaLabel: "गतिविधिको चरण", allLabel: "सबै" },
  en: { ariaLabel: "Activity funnel", allLabel: "All" }
};

// Two modes:
//   - static (default): plain counts — pure read-only rail.
//   - filter (onSelectStatus given): each step is a TOGGLE button — home uses
//     this to drive the map right below the rail. `activeStatus` marks the
//     pressed step; clicking it again clears (the row hands null back).
// (A third link-out mode existed for the /issues and /events listing pages;
// it went with them when those pages were deleted on 2026-07-02.)
export function ActivityStatsRow({
  language = "np",
  activeStatus = null,
  onSelectStatus
}) {
  const t = COPY[language] || COPY.np;

  // One global funnel, identical on every page: EXACT per-stage totals from
  // GET /campaigns/counts (keys match STEPS). Replaces the old client-side
  // fold over /issues?limit=100 + listAllEvents() — four capped requests whose
  // numbers stopped being real past 100 items and drifted from the map.
  const { counts } = useCampaignCounts({});

  const isFilter = typeof onSelectStatus === "function";

  // Filter mode leads with "all stages": the reset step (active whenever no
  // stage is pressed) whose count is the funnel's grand total.
  const steps = isFilter ? [{ key: ALL_KEY }, ...STEPS] : STEPS;
  const total = STEPS.reduce((sum, step) => sum + (counts[step.key] || 0), 0);

  return (
    <ol
      className={`activity-funnel${isFilter ? " is-interactive" : ""}`}
      aria-label={t.ariaLabel}
    >
      {steps.map((step) => {
        const { key } = step;
        const isAll = key === ALL_KEY;
        const label = isAll ? t.allLabel : campaignStatusLabel(key, language);
        const value = isAll ? total : counts[key] || 0;
        const isActive =
          isFilter && (isAll ? activeStatus === null : activeStatus === key);
        const body = (
          <>
            <span className="activity-funnel-marker">
              <FunnelCount target={value} language={language} />
            </span>
            <span className="activity-funnel-label">{label}</span>
          </>
        );
        return (
          <li
            key={key}
            className={`activity-funnel-step step-${key.toLowerCase()}${isActive ? " is-active" : ""}`}
          >
            {isFilter ? (
              <button
                type="button"
                className="activity-funnel-link"
                aria-pressed={isActive}
                aria-label={`${label}: ${value}`}
                onClick={() => onSelectStatus(isAll || isActive ? null : key)}
              >
                {body}
              </button>
            ) : (
              <div className="activity-funnel-static">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
