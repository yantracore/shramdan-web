"use client";

// LeaderNominationPanel — roadmap 3.4.2 + 3.4.3.
// Surfaces the leader-voting state on a DRAFT event that does not yet
// have a leader assigned. Authenticated members can:
//  - Cast or withdraw their support for one of the existing candidates
//  - See the current leader-elect (highest support count) and any
//    active tie between top candidates
//
// Backend data model (per `events.md` + the leader-voting OpenAPI):
//   GET    /events/{id}/leader-voting          → { status, candidates: [{ id, name, voteCount }], closesAt, ... }
//   POST   /events/{id}/leader-vote { candidateId } — cast / change my vote
//   DELETE /events/{id}/leader-vote            — retract my vote
//
// Candidates are normally seeded at the issue-voting stage — members who
// flagged "WANT_TO_LEAD". When an issue is promoted with NO such volunteers,
// leader voting opens in the `SEEKING` state: a recruitment window where any
// eligible member (a voter or the reporter of the linked issue) can step up:
//   POST   /events/{id}/leader-volunteer   — offer to lead (no request body)
//   DELETE /events/{id}/leader-volunteer   — withdraw the offer
// So the self-nominate CTA is LIVE while status === "SEEKING", and falls back
// to an inert "vote during the issue stage" hint in every other state (during
// OPEN voting the candidate pool is already fixed).
//
// Demo events (`demo-` id prefix) stay on the local-state mock path
// so the leader-nomination UX can still be exercised end-to-end
// without round-tripping the backend.

import {
  CheckCircleFilled,
  LikeOutlined,
  UserAddOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { deleteJson, getJson, postJson } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

const COPY = {
  np: {
    eyebrow: "नेतृत्व मनोनयन",
    title: "अभियानको संयोजक छनोट",
    intro:
      "यो अभियानमा अहिलेसम्म कुनै संयोजक तय भएको छैन। उम्मेदवारहरूमध्ये एक जनालाई समर्थन गर्नुहोस्।",
    selfNominateCta: "म आफै संयोजक बन्न तयार छु",
    selfNominateDisabledTooltip:
      "मनोनयन समस्या भोटिङका बेला 'नेतृत्व चाहन्छु' छानेर मात्र मिल्छ।",
    voteCta: "समर्थन",
    voteDoneCta: "समर्थन गरियो",
    leaderElectLabel: "अग्रस्थानमा",
    tieLabel: "बराबर समर्थन — समुदायले निर्णय गर्न सक्छ",
    emptyState: "अहिले कुनै उम्मेदवार छैन।",
    loginPrompt: "समर्थनका लागि पहिले लग-इन गर्नुहोस्",
    loginCta: "लग-इन गर्नुहोस्",
    successVote: "समर्थन दर्ता भयो।",
    successWithdraw: "समर्थन फिर्ता भयो।",
    errorToast: "केही गडबड भयो। फेरि प्रयास गर्नुहोस्।",
    votesCount: "{n} समर्थन",
    backToIssueLabel: "मूल समस्या हेर्नुहोस्",
    seekingIntro:
      "यो अभियानलाई संयोजक चाहिएको छ। तपाईं आफै अघि सर्न सक्नुहुन्छ, वा अघि सरेका कसैलाई समर्थन गर्न सक्नुहुन्छ।",
    withdrawVolunteerCta: "मेरो प्रस्ताव फिर्ता लिनुहोस्",
    successVolunteer: "तपाईं संयोजक बन्न अघि सर्नुभयो।",
    successVolunteerWithdraw: "तपाईंको प्रस्ताव फिर्ता भयो।",
    notEligibleError:
      "यो समस्यामा भोट दिनेहरू वा रिपोर्ट गर्नेले मात्र संयोजक बन्न अघि सर्न सक्छन्।",
    notSeekingError: "यो अभियान अहिले संयोजक खोज्दै छैन।",
    seekingEmptyState: "अहिलेसम्म कोही अघि सरेका छैनन् — पहिलो बन्नुहोस्!"
  },
  en: {
    eyebrow: "Leader nomination",
    title: "Pick a campaign leader",
    intro:
      "No leader has been chosen for this campaign yet. Back one of the candidates below.",
    selfNominateCta: "I'd like to lead this",
    selfNominateDisabledTooltip:
      "Self-nomination happens during issue voting — pick 'Want to lead' there.",
    voteCta: "Support",
    voteDoneCta: "Supported",
    leaderElectLabel: "Leading",
    tieLabel: "Tied — the community can decide",
    emptyState: "No candidates yet.",
    loginPrompt: "Sign in to support a candidate",
    loginCta: "Sign In",
    successVote: "Support recorded.",
    successWithdraw: "Support withdrawn.",
    errorToast: "Something went wrong. Try again.",
    votesCount: "{n} supporting",
    backToIssueLabel: "Open original issue",
    seekingIntro:
      "This campaign needs a leader. Step up yourself, or back someone who already has.",
    withdrawVolunteerCta: "Withdraw my offer",
    successVolunteer: "You've volunteered to lead.",
    successVolunteerWithdraw: "Your offer has been withdrawn.",
    notEligibleError:
      "Only people who voted on this issue — or its reporter — can volunteer to lead it.",
    notSeekingError: "This campaign isn't seeking a leader right now.",
    seekingEmptyState: "No one has stepped up yet — be the first!"
  }
};

function findLeaderElect(nominations) {
  if (!Array.isArray(nominations) || nominations.length === 0) return null;
  const sorted = [...nominations].sort(
    (a, b) => (b.voteCount || 0) - (a.voteCount || 0)
  );
  return sorted[0];
}

function detectTie(nominations) {
  if (!Array.isArray(nominations) || nominations.length < 2) return false;
  const top = findLeaderElect(nominations);
  if (!top || (top.voteCount || 0) === 0) return false;
  return nominations.filter((n) => (n.voteCount || 0) === top.voteCount).length > 1;
}

function unwrap(response) {
  if (!response || typeof response !== "object") return response ?? null;
  return response.data ?? response;
}

function candidatesToNominations(candidates, viewerVotedCandidateId) {
  if (!Array.isArray(candidates)) return [];
  return candidates.map((c) => ({
    id: c.id,
    memberId: c.id,
    memberName: c.name || "—",
    voteCount: Number.isFinite(c.voteCount) ? c.voteCount : 0,
    votedByMe:
      typeof c.votedByMe === "boolean"
        ? c.votedByMe
        : viewerVotedCandidateId === c.id
  }));
}

function volunteerErrorMessage(error, t) {
  const code = error?.errorCode;
  if (code === "LEADER_VOLUNTEER_NOT_ELIGIBLE") return t.notEligibleError;
  if (code === "LEADER_NOT_SEEKING") return t.notSeekingError;
  return error?.message || t.errorToast;
}

export function LeaderNominationPanel({ event, language = "np", onChanged }) {
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const messageApi = useToast();
  const [saving, setSaving] = useState(false);
  const [votingState, setVotingState] = useState(null);
  // Tracks which candidate the current viewer last voted for in this
  // session. The backend's /leader-voting response does not include a
  // per-viewer flag today (gap noted in api-requirements/events.md), so
  // this is our best handle on the toggle-state until the field lands.
  // Cleared on withdraw, replaced on a fresh vote.
  const [viewerVotedCandidateId, setViewerVotedCandidateId] = useState(null);

  const eventId = event?.id;
  const isDemo = isDemoId(eventId);
  const viewerId = session?.user?.id || null;

  const refreshVoting = useCallback(async () => {
    if (!eventId || isDemo) return;
    try {
      const response = await getJson(`/events/${eventId}/leader-voting`);
      setVotingState(unwrap(response));
    } catch {
      setVotingState(null);
    }
  }, [eventId, isDemo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshVoting();
  }, [refreshVoting]);

  // Demo events keep using the in-memory mock nominations supplied by
  // the parent; real events use the live leader-voting state mapped
  // into a nomination-shaped row so the existing list rendering keeps
  // working untouched.
  const nominations = isDemo
    ? Array.isArray(event?.nominations)
      ? event.nominations
      : []
    : candidatesToNominations(votingState?.candidates, viewerVotedCandidateId);

  const myNomination = nominations.find((n) => n.memberId === viewerId);
  const leaderElect = findLeaderElect(nominations);
  const isTie = detectTie(nominations);

  // Leader-voting lifecycle. Real events read it off the live state; demo
  // events fall back to "OPEN" so the existing mock voting UX is unchanged,
  // unless a demo event explicitly opts into the SEEKING recruitment flow.
  const votingStatus = isDemo
    ? event?.leaderVotingStatus || "OPEN"
    : votingState?.status || null;
  const isSeeking = votingStatus === "SEEKING";
  // Per-candidate voting is only live while the round is OPEN; during SEEKING
  // the rows are volunteers, not yet vote targets (POST /leader-vote 409s).
  const canVote = isDemo ? !isSeeking : votingStatus === "OPEN";
  // During SEEKING, my presence in the candidate pool === I already volunteered.
  const hasVolunteered = Boolean(myNomination);

  if (!viewerId) {
    return (
      <section className="leader-nomination-panel leader-nomination-panel-anon">
        <header className="leader-nomination-header">
          <span className="eyebrow">{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.intro}</p>
        </header>
        <div className="leader-nomination-anon-cta">
          <span>{t.loginPrompt}</span>
          <Link href={buildLoginHref(`/events/${eventId || ""}`, "nominate")}>
            <Button type="primary">{t.loginCta}</Button>
          </Link>
        </div>
      </section>
    );
  }

  const handleToggleVote = async (nomination) => {
    if (saving) return;
    setSaving(true);
    const wasVoted = nomination.votedByMe;
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const next = nominations.map((n) => {
          if (n.id !== nomination.id) return n;
          return {
            ...n,
            votedByMe: !wasVoted,
            voteCount: Math.max(0, (n.voteCount || 0) + (wasVoted ? -1 : 1))
          };
        });
        onChanged?.({ ...event, nominations: next });
        messageApi.success(wasVoted ? t.successWithdraw : t.successVote);
        return;
      }

      if (wasVoted) {
        await deleteJson(`/events/${eventId}/leader-vote`, { requireAuth: true });
        setViewerVotedCandidateId(null);
        messageApi.success(t.successWithdraw);
      } else {
        await postJson(
          `/events/${eventId}/leader-vote`,
          { candidateId: nomination.id },
          { requireAuth: true }
        );
        setViewerVotedCandidateId(nomination.id);
        messageApi.success(t.successVote);
      }
      await refreshVoting();
      onChanged?.();
    } catch (error) {
      messageApi.error(error?.message || t.errorToast);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVolunteer = async () => {
    if (saving) return;
    setSaving(true);
    const wasVolunteer = hasVolunteered;
    try {
      if (isDemo) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        const next = wasVolunteer
          ? nominations.filter((n) => n.memberId !== viewerId)
          : [
              ...nominations,
              {
                id: viewerId,
                memberId: viewerId,
                memberName:
                  session?.user?.name || session?.user?.username || "—",
                voteCount: 0,
                votedByMe: false
              }
            ];
        onChanged?.({ ...event, nominations: next });
        messageApi.success(
          wasVolunteer ? t.successVolunteerWithdraw : t.successVolunteer
        );
        return;
      }

      if (wasVolunteer) {
        await deleteJson(`/events/${eventId}/leader-volunteer`, {
          requireAuth: true
        });
        messageApi.success(t.successVolunteerWithdraw);
      } else {
        await postJson(`/events/${eventId}/leader-volunteer`, undefined, {
          requireAuth: true
        });
        messageApi.success(t.successVolunteer);
      }
      await refreshVoting();
      onChanged?.();
    } catch (error) {
      messageApi.error(volunteerErrorMessage(error, t));
    } finally {
      setSaving(false);
    }
  };

  const issueHref = event?.issueId ? `/issues/${event.issueId}` : null;

  return (
    <section className="leader-nomination-panel" aria-labelledby="leader-nomination-title">
      <header className="leader-nomination-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2 id="leader-nomination-title">{t.title}</h2>
        <p>{isSeeking ? t.seekingIntro : t.intro}</p>
      </header>

      {isTie ? (
        <div className="leader-nomination-tie" role="status">
          <WarningOutlined aria-hidden="true" />
          <span>{t.tieLabel}</span>
        </div>
      ) : null}

      <div className="leader-nomination-self">
        {isSeeking ? (
          <Button
            type={hasVolunteered ? "default" : "primary"}
            icon={<UserAddOutlined />}
            onClick={handleToggleVolunteer}
            loading={saving}
            disabled={saving}
          >
            {hasVolunteered ? t.withdrawVolunteerCta : t.selfNominateCta}
          </Button>
        ) : (
          <Tooltip title={t.selfNominateDisabledTooltip}>
            <Button
              type="default"
              icon={<UserAddOutlined />}
              disabled
              aria-disabled="true"
            >
              {t.selfNominateCta}
            </Button>
          </Tooltip>
        )}
        {issueHref ? (
          <Link className="leader-nomination-issue-link" href={issueHref}>
            {t.backToIssueLabel}
          </Link>
        ) : null}
      </div>

      {nominations.length === 0 ? (
        <p className="leader-nomination-empty">
          {isSeeking ? t.seekingEmptyState : t.emptyState}
        </p>
      ) : (
        <ul className="leader-nomination-list">
          {nominations
            .slice()
            .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
            .map((nomination) => {
              const isElect =
                canVote && !isTie && leaderElect?.id === nomination.id;
              return (
                <li
                  key={nomination.id}
                  className={`leader-nomination-row ${isElect ? "is-elect" : ""}`}
                >
                  <span className="leader-nomination-name">
                    {nomination.memberName || "—"}
                    {isElect ? (
                      <span className="leader-nomination-elect-badge">
                        <CheckCircleFilled aria-hidden="true" />
                        {t.leaderElectLabel}
                      </span>
                    ) : null}
                  </span>
                  {canVote ? (
                    <span className="leader-nomination-votes">
                      {t.votesCount.replace("{n}", nomination.voteCount || 0)}
                    </span>
                  ) : null}
                  {canVote ? (
                    <Button
                      type={nomination.votedByMe ? "default" : "primary"}
                      icon={<LikeOutlined />}
                      onClick={() => handleToggleVote(nomination)}
                      disabled={saving}
                      size="small"
                    >
                      {nomination.votedByMe ? t.voteDoneCta : t.voteCta}
                    </Button>
                  ) : null}
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}
