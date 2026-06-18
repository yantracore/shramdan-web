"use client";

// Accessible segmented tabs for the /discussions surface.
//
// A real WAI-ARIA tablist: roving tabindex, Arrow/Home/End keyboard nav, and
// an animated active "thumb" that slides between options (theme motion
// tokens; respects prefers-reduced-motion via CSS). Drop-in reusable — feed
// it `tabs`, the active `value`, and an `onChange`; styling lives in the
// `.d-tabs` block of discussions.css.
//
//   tabs:  [{ key, label, icon?, count? }]
//   value: active key
//   onChange(nextKey)

import { useRef } from "react";

export function DiscussionTabs({ tabs = [], value, onChange, ariaLabel }) {
  const refs = useRef([]);

  const focusIndex = (i) => {
    const next = (i + tabs.length) % tabs.length;
    onChange?.(tabs[next].key);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e, i) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusIndex(i + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusIndex(i - 1);
        break;
      case "Home":
        e.preventDefault();
        focusIndex(0);
        break;
      case "End":
        e.preventDefault();
        focusIndex(tabs.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="d-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab, i) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={`d-tab${active ? " is-active" : ""}`}
            onClick={() => onChange?.(tab.key)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.icon ? (
              <span className="d-tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
            ) : null}
            <span className="d-tab-label">{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span className="d-tab-count">{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default DiscussionTabs;
