"use client";

import {
  CalendarOutlined,
  CheckCircleFilled,
  FireFilled,
  FlagOutlined,
  TeamOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { listAllEvents } from "@/lib/eventsApi";
import { getJson } from "@/lib/apiClient";
import { getListItems } from "@/lib/adminUtils";

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
const STEPS = [
  { key: "OPEN", icon: FlagOutlined, page: "issues", param: ["status", "OPEN"] },
  {
    key: "FORMING",
    icon: TeamOutlined,
    page: "issues",
    param: ["status", "EVENT_SCHEDULED"]
  },
  {
    key: "SCHEDULED",
    icon: CalendarOutlined,
    page: "events",
    param: ["show", "upcoming"]
  },
  { key: "LIVE", icon: FireFilled, page: "events", param: ["show", "live"] },
  {
    key: "COMPLETED",
    icon: CheckCircleFilled,
    page: "events",
    param: ["show", "past"]
  }
];

const COPY = {
  np: {
    ariaLabel: "गतिविधिको चरण",
    steps: {
      OPEN: "खुला",
      FORMING: "छानिएको",
      SCHEDULED: "मिति तय",
      LIVE: "चलिरहेको",
      COMPLETED: "सम्पन्न"
    }
  },
  en: {
    ariaLabel: "Activity funnel",
    steps: {
      OPEN: "Open",
      FORMING: "Selected",
      SCHEDULED: "Scheduled",
      LIVE: "Ongoing",
      COMPLETED: "Complete"
    }
  }
};

// One global funnel, identical on every page: pull both datasets and fold each
// campaign into exactly one step. OPEN/FORMING come off the issue side,
// SCHEDULED/LIVE/COMPLETED off the event side, so nothing is counted twice.
// FORMING = promoted issues that haven't surfaced as a public (upcoming/live)
// event yet — the genuine "selected, awaiting a date" middle.
function foldCounts(issues, buckets) {
  const open = issues.filter((i) => i?.status === "OPEN").length;
  const scheduledIssues = issues.filter(
    (i) => i?.status === "EVENT_SCHEDULED"
  ).length;
  const upcoming = buckets.upcoming.length;
  const live = buckets.live.length;
  const past = buckets.past.length;
  const forming = Math.max(0, scheduledIssues - (upcoming + live));
  return {
    OPEN: open,
    FORMING: forming,
    SCHEDULED: upcoming,
    LIVE: live,
    COMPLETED: past
  };
}

function ActivityStatsRowInner({
  language = "np",
  interactive = false,
  currentPage
}) {
  const t = COPY[language] || COPY.np;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [issues, setIssues] = useState([]);
  const [buckets, setBuckets] = useState({ live: [], upcoming: [], past: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [issuesRes, eventData] = await Promise.all([
          getJson("/issues", { params: { limit: 100 } }),
          listAllEvents({ language })
        ]);
        if (cancelled) return;
        setIssues(getListItems(issuesRes));
        setBuckets(eventData);
      } catch {
        if (cancelled) return;
        setIssues([]);
        setBuckets({ live: [], upcoming: [], past: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const counts = useMemo(() => foldCounts(issues, buckets), [issues, buckets]);

  const hrefFor = (step) => {
    const [pkey, pval] = step.param;
    if (currentPage && step.page === currentPage) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set(pkey, pval);
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    }
    return `/${step.page}?${pkey}=${pval}`;
  };

  return (
    <ol
      className={`activity-funnel${interactive ? " is-interactive" : ""}`}
      aria-label={t.ariaLabel}
    >
      {STEPS.map((step) => {
        const { key, icon: Icon } = step;
        const label = t.steps[key] || key;
        const value = counts[key] || 0;
        const body = (
          <>
            <span className="activity-funnel-marker" aria-hidden="true">
              <Icon />
            </span>
            <FunnelCount target={value} language={language} />
            <span className="activity-funnel-label">{label}</span>
          </>
        );
        return (
          <li key={key} className={`activity-funnel-step step-${key.toLowerCase()}`}>
            {interactive ? (
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
