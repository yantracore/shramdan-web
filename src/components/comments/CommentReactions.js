"use client";

import { Tooltip } from "antd";
import { EmojiPicker } from "@/components/comments/EmojiPicker";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    loginToReactTip: "प्रतिक्रिया दिन लग-इन गर्नुहोस्।",
    reactionTip: "तपाईंको प्रतिक्रिया जनाउनुहोस्"
  },
  en: {
    loginToReactTip: "Log in to react.",
    reactionTip: "React to this comment"
  }
};

export function CommentReactions({
  reactions = {},
  myReactions = [],
  language = "np",
  isAuthenticated = false,
  onToggle
}) {
  const t = COPY[language] || COPY.np;

  // Render only emojis with a positive count. Picker handles surfacing
  // the 5-base quick row + curated grid for first-time adds, so we
  // don't need to render empty-state tiles.
  const entries = Object.entries(reactions).filter(([, count]) => Number(count) > 0);

  if (entries.length === 0 && !isAuthenticated) return null;

  const handleToggle = (emoji) => {
    if (!isAuthenticated) return;
    onToggle?.(emoji);
  };

  return (
    <div className="comment-reactions" role="group" aria-label={t.reactionTip}>
      {entries.map(([emoji, count]) => {
        const picked = myReactions.includes(emoji);
        const tile = (
          <button
            key={emoji}
            type="button"
            className={`comment-reaction-tile${picked ? " is-picked" : ""}`}
            onClick={() => handleToggle(emoji)}
            disabled={!isAuthenticated}
            aria-pressed={picked}
            aria-label={`${emoji} ${count}`}
          >
            <span className="comment-reaction-emoji" aria-hidden="true">
              {emoji}
            </span>
            <span className="comment-reaction-count">
              {localizeDigits(count, language)}
            </span>
          </button>
        );
        if (!isAuthenticated) {
          return (
            <Tooltip key={emoji} title={t.loginToReactTip} placement="top">
              {tile}
            </Tooltip>
          );
        }
        return tile;
      })}

      <EmojiPicker
        language={language}
        onPick={handleToggle}
        disabled={!isAuthenticated}
        myReactions={myReactions}
      />
    </div>
  );
}
