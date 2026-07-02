"use client";

import { SmileOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import { useState } from "react";

// Quick row at the top of the picker — the 5 base reactions reuse the
// IssueReactions.js palette so behavior across the site stays
// consistent. Anything outside this row lives in the curated grid
// below.
const QUICK_ROW = ["👏", "🌱", "❤️", "🙏", "💪"];

// Curated 24-emoji grid (4 rows × 6) — no heavy dependency, no
// keyboard/skin-tone complexity. Selected for relevance to the kind of
// signal volunteers actually want to send on a campaign thread: thanks,
// progress, momentum, presence.
const CURATED_GRID = [
  ["🎉", "🌟", "🔥", "✨", "👍", "👎"],
  ["😀", "😊", "😢", "😡", "🤔", "👀"],
  ["🌳", "🌻", "💧", "⚡", "📸", "🏆"],
  ["💡", "📌", "🛠️", "🚀", "💯", "✅"]
];

const COPY = {
  np: {
    aria: "इमोजी छान्ने",
    quick: "छनोट प्रतिक्रिया",
    grid: "थप इमोजी",
    triggerAria: "इमोजी जोड्ने"
  },
  en: {
    aria: "Pick an emoji",
    quick: "Quick reactions",
    grid: "More emoji",
    triggerAria: "Add emoji reaction"
  }
};

export function EmojiPicker({
  language = "np",
  onPick,
  trigger,
  disabled = false,
  myReactions = []
}) {
  const t = COPY[language] || COPY.np;
  const [open, setOpen] = useState(false);

  const pick = (emoji) => {
    onPick?.(emoji);
    setOpen(false);
  };

  const renderTile = (emoji) => {
    const picked = myReactions.includes(emoji);
    return (
      <button
        key={emoji}
        type="button"
        className={`comment-emoji-tile${picked ? " is-picked" : ""}`}
        onClick={() => pick(emoji)}
        aria-label={emoji}
        aria-pressed={picked}
      >
        <span aria-hidden="true">{emoji}</span>
      </button>
    );
  };

  const content = (
    <div className="comment-emoji-picker" role="dialog" aria-label={t.aria}>
      <div className="comment-emoji-section">
        <p className="comment-emoji-section-label">{t.quick}</p>
        <div className="comment-emoji-row" role="group">
          {QUICK_ROW.map(renderTile)}
        </div>
      </div>
      <div className="comment-emoji-section">
        <p className="comment-emoji-section-label">{t.grid}</p>
        <div className="comment-emoji-grid" role="group">
          {CURATED_GRID.flat().map(renderTile)}
        </div>
      </div>
    </div>
  );

  const defaultTrigger = (
    <button
      type="button"
      className="comment-reaction-add"
      aria-label={t.triggerAria}
      disabled={disabled}
    >
      <SmileOutlined aria-hidden="true" />
      <span className="comment-reaction-add-plus" aria-hidden="true">
        +
      </span>
    </button>
  );

  if (disabled) return defaultTrigger;

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="topLeft"
      classNames={{ root: "comment-emoji-popover" }}
      destroyOnHidden
    >
      {trigger || defaultTrigger}
    </Popover>
  );
}

export const EMOJI_PICKER_BASE = QUICK_ROW;
