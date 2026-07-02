"use client";

// Left vertical category rail for /discussions.
//
// The "topics down the left" the page is organised around (2026-06-18
// app-style makeover). Sticky glass chrome: a compact heading (the page's
// only h1 now that the brochure hero is gone), the category list with live
// per-category counts + accent dots, and a quiet "how a proposal moves"
// explainer so first-timers understand the vote→roadmap path without a
// separate marketing aside.
//
// Filtering, not routing — each row is a button with aria-pressed. Reusable:
// feed it the category metadata, an active key, counts, and bilingual copy.

import {
  ApiOutlined,
  AppstoreOutlined,
  BgColorsOutlined,
  EllipsisOutlined,
  LayoutOutlined,
  RocketOutlined
} from "@ant-design/icons";
import {
  DISCUSSION_CATEGORIES,
  THRESHOLD_VOTES,
  formatTokenized,
  localizeDigits
} from "./discussionFormat";

const ICONS = {
  all: <AppstoreOutlined />,
  design: <BgColorsOutlined />,
  frontend: <LayoutOutlined />,
  backend: <ApiOutlined />,
  other: <EllipsisOutlined />
};

export function DiscussionCategoryRail({
  active,
  onSelect,
  counts = {},
  labels,
  language = "np",
  roadmapTally = 0
}) {
  const t = labels || {};
  const cats = t.categories || {};
  const steps = Array.isArray(t.howSteps) ? t.howSteps : [];

  return (
    <nav className="d-rail" aria-label={t.categoriesAria || "Discussion topics"}>
      <div className="d-rail-head">
        <h1 className="d-rail-title">{t.categoriesTitle || "Discussions"}</h1>
        {t.categoriesSubtitle ? (
          <p className="d-rail-subtitle">{t.categoriesSubtitle}</p>
        ) : null}
      </div>

      <ul className="d-rail-list" role="list">
        {DISCUSSION_CATEGORIES.map((cat) => {
          const isActive = cat.key === active;
          const count = counts[cat.key] ?? 0;
          return (
            <li key={cat.key}>
              <button
                type="button"
                className={`d-rail-item${isActive ? " is-active" : ""}`}
                style={{ "--cat-accent": cat.accent }}
                aria-pressed={isActive}
                onClick={() => onSelect?.(cat.key)}
              >
                <span className="d-rail-item-icon" aria-hidden="true">
                  {ICONS[cat.iconKey]}
                </span>
                <span className="d-rail-item-label">{cats[cat.key] || cat.key}</span>
                <span className="d-rail-item-count">{localizeDigits(count, language)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="d-rail-how">
        <h2 className="d-rail-how-title">
          <RocketOutlined aria-hidden="true" /> {t.howTitle || "How a proposal moves"}
        </h2>
        <ol className="d-rail-how-steps">
          {steps.map((step, i) => (
            <li key={i} className="d-rail-how-step">
              {formatTokenized(step, THRESHOLD_VOTES, language)}
            </li>
          ))}
        </ol>
        {roadmapTally > 0 ? (
          <div className="d-rail-tally">
            <strong>{localizeDigits(roadmapTally, language)}</strong>
            <span>{t.roadmapTallyLabel || "On the roadmap"}</span>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

export default DiscussionCategoryRail;
