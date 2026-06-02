"use client";

// IssueComments — deterministic dev-dummy discussion thread on
// /issues/[id]. Each issue gets a stable 2-5 comment set keyed off
// the issue id hash. Real /issues/:id/comments endpoint will swap in
// the same shape (id, name, role, text, createdAt).

import { MessageOutlined, SendOutlined } from "@ant-design/icons";
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
    daysAgo: "{n} दिन अघि"
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
    daysAgo: "{n} d ago"
  }
};

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

  if (!issueId) return null;
  if (seeded.length === 0) return null;

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
        {comments.map((c) => (
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
              </div>
              <p className="issue-comment-text">{c.text}</p>
            </div>
          </li>
        ))}
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
