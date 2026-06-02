"use client";

// IssueComments — deterministic dev-dummy discussion thread on
// /issues/[id]. Each issue gets a stable 2-5 comment set keyed off
// the issue id hash. Real /issues/:id/comments endpoint will swap in
// the same shape (id, name, role, text, createdAt).

import {
  DislikeFilled,
  DislikeOutlined,
  LikeFilled,
  LikeOutlined,
  MessageOutlined,
  SendOutlined
} from "@ant-design/icons";
import { Button, Input } from "antd";
import { useMemo, useState } from "react";
import { getDemoIssueComments } from "@/lib/devMockData";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    heading: "छलफल",
    intro: "स्थानीयहरूको साझा र समाधानमा हात बढाउन तत्पर सदस्यहरूको आवाज।",
    countLabel: "टिप्पणी",
    composerPlaceholder: "तपाईंको विचार राख्नुहोस्…",
    composerHint: "विकास अवस्थामा — टिप्पणी अहिले प्रकाशन गरिँदैन।",
    submit: "पठाउनुहोस्",
    minutesAgo: "{n} मि. अघि",
    hoursAgo: "{n} घण्टा अघि",
    daysAgo: "{n} दिन अघि",
    helpful: "उपयोगी",
    notHelpful: "उपयोगी छैन",
    voteUpAria: "उपयोगी मान्नुहोस्",
    voteDownAria: "उपयोगी छैन मान्नुहोस्"
  },
  en: {
    heading: "Discussion",
    intro: "Voices from people on the ground and members ready to help.",
    countLabel: "comments",
    composerPlaceholder: "Add your thought…",
    composerHint: "Dev mode — comments aren't posted live yet.",
    submit: "Post",
    minutesAgo: "{n} min ago",
    hoursAgo: "{n} h ago",
    daysAgo: "{n} d ago",
    helpful: "Helpful",
    notHelpful: "Not helpful",
    voteUpAria: "Mark helpful",
    voteDownAria: "Mark not helpful"
  }
};

// Deterministic vote seed so the first-render counts feel real and
// don't change on re-mount. Cheap string-hash mod small ranges.
function seedVotes(id) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  const a = Math.abs(h);
  return { up: 2 + (a % 14), down: a % 4 };
}

function initialOf(name) {
  if (!name) return "—";
  return Array.from(name.trim())[0] || "—";
}

function relativeTime(iso, t, language) {
  if (!iso) return "";
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 60_000) return t.minutesAgo.replace("{n}", localizeDigits(1, language));
  const min = Math.floor(ms / 60_000);
  if (min < 60) return t.minutesAgo.replace("{n}", localizeDigits(min, language));
  const hr = Math.floor(min / 60);
  if (hr < 24) return t.hoursAgo.replace("{n}", localizeDigits(hr, language));
  const days = Math.floor(hr / 24);
  return t.daysAgo.replace("{n}", localizeDigits(days, language));
}

export function IssueComments({ issueId, language = "np" }) {
  const t = COPY[language] || COPY.np;
  const seeded = useMemo(() => getDemoIssueComments(issueId), [issueId]);
  const [comments, setComments] = useState(seeded);
  const [draft, setDraft] = useState("");
  const initialVotes = useMemo(() => {
    const map = {};
    for (const c of seeded) {
      map[c.id] = { ...seedVotes(c.id), myVote: null };
    }
    return map;
  }, [seeded]);
  const [votes, setVotes] = useState(initialVotes);

  if (!issueId) return null;
  if (seeded.length === 0) return null;

  const castVote = (commentId, direction) => {
    setVotes((prev) => {
      const current = prev[commentId] || {
        ...seedVotes(commentId),
        myVote: null
      };
      let { up, down } = current;
      // Roll back any previous vote first.
      if (current.myVote === "up") up = Math.max(0, up - 1);
      else if (current.myVote === "down") down = Math.max(0, down - 1);
      const myVote = current.myVote === direction ? null : direction;
      if (myVote === "up") up += 1;
      else if (myVote === "down") down += 1;
      return { ...prev, [commentId]: { up, down, myVote } };
    });
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setComments((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        name: language === "np" ? "तपाईं" : "You",
        role: language === "np" ? "अहिले लेखिएको" : "Posted now",
        text: trimmed,
        createdAt: new Date().toISOString()
      }
    ]);
    setDraft("");
  };

  return (
    <section className="issue-comments" aria-labelledby="issue-comments-title">
      <header className="issue-comments-header">
        <MessageOutlined aria-hidden="true" />
        <h2 id="issue-comments-title">{t.heading}</h2>
        <span className="issue-comments-count">
          {localizeDigits(comments.length, language)} {t.countLabel}
        </span>
      </header>
      <p className="issue-comments-intro">{t.intro}</p>

      <ul className="issue-comments-list">
        {comments.map((c) => {
          const v = votes[c.id] || { up: 0, down: 0, myVote: null };
          const helpful = v.up - v.down >= 5;
          return (
            <li key={c.id} className="issue-comment">
              <span className="issue-comment-avatar" aria-hidden="true">
                {initialOf(c.name)}
              </span>
              <div className="issue-comment-body">
                <div className="issue-comment-attrib">
                  <strong>{c.name}</strong>
                  <span className="issue-comment-role">{c.role}</span>
                  <span className="issue-comment-time">
                    · {relativeTime(c.createdAt, t, language)}
                  </span>
                  {helpful ? (
                    <span className="issue-comment-helpful">
                      <LikeFilled aria-hidden="true" /> {t.helpful}
                    </span>
                  ) : null}
                </div>
                <p className="issue-comment-text">{c.text}</p>
                <div
                  className="issue-comment-votes"
                  role="group"
                  aria-label={`${t.helpful} / ${t.notHelpful}`}
                >
                  <button
                    type="button"
                    className={`issue-comment-vote${v.myVote === "up" ? " is-on" : ""}`}
                    onClick={() => castVote(c.id, "up")}
                    aria-pressed={v.myVote === "up"}
                    aria-label={t.voteUpAria}
                  >
                    {v.myVote === "up" ? (
                      <LikeFilled aria-hidden="true" />
                    ) : (
                      <LikeOutlined aria-hidden="true" />
                    )}
                    <span>{localizeDigits(v.up, language)}</span>
                  </button>
                  <button
                    type="button"
                    className={`issue-comment-vote is-down${v.myVote === "down" ? " is-on" : ""}`}
                    onClick={() => castVote(c.id, "down")}
                    aria-pressed={v.myVote === "down"}
                    aria-label={t.voteDownAria}
                  >
                    {v.myVote === "down" ? (
                      <DislikeFilled aria-hidden="true" />
                    ) : (
                      <DislikeOutlined aria-hidden="true" />
                    )}
                    <span>{localizeDigits(v.down, language)}</span>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <form className="issue-comments-composer" onSubmit={handleSubmit}>
        <Input.TextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.composerPlaceholder}
          autoSize={{ minRows: 2, maxRows: 5 }}
        />
        <div className="issue-comments-composer-foot">
          <span className="issue-comments-composer-hint">{t.composerHint}</span>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            disabled={!draft.trim()}
          >
            {t.submit}
          </Button>
        </div>
      </form>
    </section>
  );
}
