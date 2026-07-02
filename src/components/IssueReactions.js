"use client";

// Emoji reactions row on /issues/[id]. Five reactions:
// 👏 clap, 🌱 grow, ❤️ love, 🙏 thanks, 💪 strength. Each carries a
// deterministic baseline count derived from the issue id hash so the
// tile feels populated; tapping toggles +1 / -1 locally. Production
// swap: replace the seed + local mutation with a fetch loop against
// /issues/:id/reactions.

import { useEffect, useMemo, useState } from "react";

const REACTIONS = [
  { id: "clap", emoji: "👏", labelNp: "ताली", labelEn: "Clap" },
  { id: "grow", emoji: "🌱", labelNp: "बढाऔँ", labelEn: "Grow" },
  { id: "love", emoji: "❤️", labelNp: "माया", labelEn: "Love" },
  { id: "thanks", emoji: "🙏", labelNp: "धन्यवाद", labelEn: "Thanks" },
  { id: "strength", emoji: "💪", labelNp: "शक्ति", labelEn: "Strength" }
];

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(v, lang) {
  const s = String(v ?? "");
  return lang === "np" ? s.replace(/\d/g, (d) => NP_DIGITS[Number(d)]) : s;
}

function hashIssueId(id) {
  let h = 0;
  const s = String(id || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seedCounts(issueId) {
  const h = hashIssueId(issueId);
  return REACTIONS.reduce((acc, r, i) => {
    acc[r.id] = 3 + ((h >> i) % 27);
    return acc;
  }, {});
}

const STORAGE_KEY_PREFIX = "shramdan-issue-reactions:";

function readPicks(issueId) {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PREFIX + issueId);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function writePicks(issueId, set) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY_PREFIX + issueId,
      JSON.stringify(Array.from(set))
    );
  } catch {
    // ignore
  }
}

export function IssueReactions({ issueId, language = "np", heading }) {
  const seed = useMemo(() => seedCounts(issueId), [issueId]);
  const [counts, setCounts] = useState(seed);
  const [picks, setPicks] = useState(() => readPicks(issueId));

  useEffect(() => {
    setCounts(seedCounts(issueId));
    setPicks(readPicks(issueId));
  }, [issueId]);

  if (!issueId) return null;

  const toggle = (id) => {
    const nextPicks = new Set(picks);
    const nextCounts = { ...counts };
    if (nextPicks.has(id)) {
      nextPicks.delete(id);
      nextCounts[id] = Math.max(0, (nextCounts[id] || 0) - 1);
    } else {
      nextPicks.add(id);
      nextCounts[id] = (nextCounts[id] || 0) + 1;
    }
    setPicks(nextPicks);
    setCounts(nextCounts);
    writePicks(issueId, nextPicks);
  };

  return (
    <section className="issue-reactions" aria-label={heading}>
      {heading ? <h3 className="issue-reactions-heading">{heading}</h3> : null}
      <div className="issue-reactions-row">
        {REACTIONS.map((r) => {
          const picked = picks.has(r.id);
          const label = language === "np" ? r.labelNp : r.labelEn;
          return (
            <button
              key={r.id}
              type="button"
              className={`issue-reaction${picked ? " is-picked" : ""}`}
              onClick={() => toggle(r.id)}
              aria-pressed={picked}
              title={label}
            >
              <span className="issue-reaction-emoji" aria-hidden="true">
                {r.emoji}
              </span>
              <span className="issue-reaction-count">
                {localizeDigits(counts[r.id] || 0, language)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
