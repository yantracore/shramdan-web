"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCampaignCounts } from "@/lib/useCampaignCounts";
import { campaignStatusLabel, campaignStatusPath } from "@/lib/campaignStatus";

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
// citizen's issue is born OPEN, gets promoted (FORMING), the event is dated
// (SCHEDULED), runs (LIVE), and finishes (COMPLETED). The line tells the whole
// story; the counts show the work flowing through it.
//
// Each step also owns a destination. OPEN/FORMING belong to the issue (it's not
// an event yet), so they route to /issues; once dated the campaign is an event,
// so SCHEDULED/LIVE/COMPLETED route to /events. When the step's page IS the page
// you're on, we only swap the status param (preserving the rest of the URL);
// otherwise it's a cross-page jump. Home renders the rail read-only.
// The five filterable campaign stages, in lifecycle order. Each links to the
// unified list filtered by that technical status.
const STEPS = [
  { key: "OPEN" },
  { key: "DRAFT" },
  { key: "SCHEDULED" },
  { key: "ACTIVE" },
  { key: "COMPLETED" }
];

const COPY = {
  np: { ariaLabel: "गतिविधिको चरण" },
  en: { ariaLabel: "Activity funnel" }
};

// Three modes, picked per page:
//   - static (default): plain counts — pure read-only rail.
//   - interactive: each step LINKS to its /campaigns/<slug> section.
//   - filter (onSelectStatus given): each step is a TOGGLE button — home uses
//     this to drive the map right below the rail. `activeStatus` marks the
//     pressed step; clicking it again clears (the row hands null back).
function ActivityStatsRowInner({
  language = "np",
  interactive = false,
  currentPage,
  activeStatus = null,
  onSelectStatus
}) {
  const t = COPY[language] || COPY.np;
  const searchParams = useSearchParams();

  // One global funnel, identical on every page: EXACT per-stage totals from
  // GET /campaigns/counts (keys match STEPS). Replaces the old client-side
  // fold over /issues?limit=100 + listAllEvents() — four capped requests whose
  // numbers stopped being real past 100 items and drifted from the map.
  const { counts } = useCampaignCounts({});

  const hrefFor = (step) => {
    // Each stage is its own path section now (/campaigns/<slug>). On the
    // campaigns surface itself, preserve the secondary filters in the query;
    // elsewhere just jump to the stage page.
    const base = campaignStatusPath(step.key);
    if (currentPage === "campaigns") {
      const query = searchParams?.toString();
      return query ? `${base}?${query}` : base;
    }
    return base;
  };

  const isFilter = typeof onSelectStatus === "function";

  return (
    <ol
      className={`activity-funnel${interactive || isFilter ? " is-interactive" : ""}`}
      aria-label={t.ariaLabel}
    >
      {STEPS.map((step) => {
        const { key } = step;
        const label = campaignStatusLabel(key, language);
        const value = counts[key] || 0;
        const isActive = isFilter && activeStatus === key;
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
                onClick={() => onSelectStatus(isActive ? null : key)}
              >
                {body}
              </button>
            ) : interactive ? (
              <Link
                href={hrefFor(step)}
                className="activity-funnel-link"
                aria-label={`${label}: ${value}`}
              >
                {body}
              </Link>
            ) : (
              <div className="activity-funnel-static">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// useSearchParams() (called inside the inner component) forces any statically
// prerendered page that renders this row to bail out of static generation
// unless the hook sits below a Suspense boundary — without this, `next build`
// fails on "/" with the missing-suspense-with-csr-bailout error. Wrapping once
// here gives every call site (home, /issues, /events) the boundary for free.
export function ActivityStatsRow(props) {
  return (
    <Suspense fallback={null}>
      <ActivityStatsRowInner {...props} />
    </Suspense>
  );
}
