"use client";

// PollCard — roadmap 14.3.2.
// Renders a single poll with options, current support counts, and
// a cast-vote affordance. Demo events update local state; real
// polls would POST /polls/{slug}/votes.

import { ArrowRightOutlined, CheckCircleFilled } from "@ant-design/icons";
import { Button } from "antd";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { useToast } from "@/lib/toast";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

const COPY = {
  np: {
    castVote: "मतदान",
    castVoted: "मत दिइयो",
    totalVotes: "कुल {n} मत",
    closesOn: "बन्द: {date}",
    fullDetailCta: "विस्तृत",
    scopeLabel: {
      feature: "फिचर",
      design: "डिजाइन",
      policy: "नीति",
      other: "अन्य"
    },
    loginPrompt: "मतदानका लागि लग-इन गर्नुहोस्",
    loginCta: "लग-इन"
  },
  en: {
    castVote: "Vote",
    castVoted: "Voted",
    totalVotes: "{n} total votes",
    closesOn: "Closes: {date}",
    fullDetailCta: "Details",
    scopeLabel: {
      feature: "Feature",
      design: "Design",
      policy: "Policy",
      other: "Other"
    },
    loginPrompt: "Sign in to vote",
    loginCta: "Sign in"
  }
};

function formatDate(iso, language) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const locale = language === "np" ? "ne-NP" : "en-US";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  } catch {
    return iso.slice(0, 10);
  }
}

export function PollCard({ poll, language = "np", showDetailCta = true }) {
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const messageApi = useToast();

  const [optionsState, setOptionsState] = useState(() => poll.options.map((o) => ({ ...o })));
  const [votedOptionId, setVotedOptionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isAuthenticated = Boolean(session?.user?.id);
  const totalVotes = useMemo(
    () => optionsState.reduce((sum, o) => sum + (o.voteCount || 0), 0),
    [optionsState]
  );
  const titleField = language === "np" ? "titleNp" : "titleEn";
  const descField = language === "np" ? "descriptionNp" : "descriptionEn";
  const labelField = language === "np" ? "labelNp" : "labelEn";

  const handleVote = async (optionId) => {
    if (votedOptionId || submitting) return;
    if (!isAuthenticated) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 220));
    setOptionsState((prev) =>
      prev.map((o) =>
        o.id === optionId ? { ...o, voteCount: (o.voteCount || 0) + 1 } : o
      )
    );
    setVotedOptionId(optionId);
    setSubmitting(false);
    messageApi.success(t.castVoted);
  };

  const sortedOptions = [...optionsState].sort(
    (a, b) => (b.voteCount || 0) - (a.voteCount || 0)
  );

  return (
    <article className="poll-card" aria-labelledby={`poll-${poll.slug}-title`}>
      <header className="poll-card-header">
        <span className="poll-card-scope">
          {t.scopeLabel[poll.scope] || poll.scope}
        </span>
        <h3 id={`poll-${poll.slug}-title`}>{poll[titleField]}</h3>
        {poll[descField] ? <p>{poll[descField]}</p> : null}
      </header>

      <ul className="poll-card-options">
        {sortedOptions.map((option) => {
          const percent =
            totalVotes > 0
              ? Math.round((option.voteCount || 0) * 100 / totalVotes)
              : 0;
          const isMyVote = votedOptionId === option.id;
          return (
            <li
              key={option.id}
              className={`poll-card-option ${isMyVote ? "is-my-vote" : ""}`}
            >
              <div className="poll-card-option-row">
                <span className="poll-card-option-label">
                  {isMyVote ? <CheckCircleFilled aria-hidden="true" /> : null}
                  {option[labelField]}
                </span>
                <span className="poll-card-option-count">
                  {localizeDigits(option.voteCount, language)} ·{" "}
                  {localizeDigits(percent, language)}%
                </span>
              </div>
              <div className="poll-card-option-bar" aria-hidden="true">
                <span
                  className="poll-card-option-fill"
                  style={{ width: `${Math.max(2, percent)}%` }}
                />
              </div>
              {!votedOptionId && isAuthenticated ? (
                <Button
                  type="link"
                  size="small"
                  className="poll-card-option-vote"
                  onClick={() => handleVote(option.id)}
                  disabled={submitting}
                >
                  {t.castVote}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <footer className="poll-card-footer">
        <span className="poll-card-total">
          {t.totalVotes.replace("{n}", localizeDigits(totalVotes, language))}
        </span>
        {poll.closesAt ? (
          <span className="poll-card-closes">
            {t.closesOn.replace("{date}", formatDate(poll.closesAt, language))}
          </span>
        ) : null}
        {!isAuthenticated ? (
          <Link href={buildLoginHref(`/polls/${poll.slug}`, "vote")} className="poll-card-login">
            {t.loginPrompt} → {t.loginCta}
          </Link>
        ) : null}
        {showDetailCta ? (
          <Link href={`/polls/${poll.slug}`} className="poll-card-cta">
            {t.fullDetailCta} <ArrowRightOutlined aria-hidden="true" />
          </Link>
        ) : null}
      </footer>
    </article>
  );
}
