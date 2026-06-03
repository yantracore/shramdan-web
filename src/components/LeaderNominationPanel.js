"use client";

// LeaderNominationPanel — roadmap 3.4.2 + 3.4.3.
// Surfaces nomination + community vote on a DRAFT event that does
// not yet have a leader assigned. Authenticated members can:
//  - Self-nominate (cheapest path; one-click)
//  - Cast / withdraw a support vote on existing nominations
//  - See the current leader-elect (highest support count) and any
//    active tie between top candidates
//
// Demo events update local state through onChanged. Real events
// would POST /events/{id}/nominations + /events/{id}/nominations/{id}/vote.
// Backend endpoints pending; the UI degrades gracefully on 404/501.

import {
  CheckCircleFilled,
  LikeOutlined,
  UserAddOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { Button } from "antd";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { postJson, deleteJson } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { useToast } from "@/lib/toast";

const isDemoId = (id) => typeof id === "string" && id.startsWith("demo-");

const COPY = {
  np: {
    eyebrow: "नेतृत्व मनोनयन",
    title: "अभियानको संयोजक छनोट",
    intro:
      "यो अभियानमा अहिलेसम्म कुनै संयोजक तय भएको छैन। आफै मनोनयन भर्नुहोस् अथवा अरूले मनोनयन भरेका सदस्यलाई समर्थन गर्नुहोस्।",
    selfNominateCta: "म आफै संयोजक बन्न तयार छु",
    alreadyNominated: "तपाईं पहिल्यै मनोनयन भर्नुभएको छ",
    voteCta: "समर्थन",
    voteDoneCta: "समर्थन गरियो",
    leaderElectLabel: "अग्रस्थानमा",
    tieLabel: "बराबर समर्थन — समुदायले निर्णय गर्न सक्छ",
    emptyState:
      "अहिले कुनै मनोनयन छैन। पहिले मनोनयन भर्ने व्यक्ति बन्नुहोस्।",
    loginPrompt: "मनोनयन / समर्थनका लागि पहिले लग-इन गर्नुहोस्",
    loginCta: "लग-इन गर्नुहोस्",
    successNominate: "तपाईंको मनोनयन दर्ता भयो।",
    successVote: "समर्थन दर्ता भयो।",
    successWithdraw: "समर्थन फिर्ता भयो।",
    backendPendingToast:
      "ब्याकएन्ड समर्थन अझै तयार छैन — डेमो मा स्थानीय रूपमा सुरक्षित।",
    errorToast: "केही गडबड भयो। फेरि प्रयास गर्नुहोस्।",
    votesCount: "{n} समर्थन"
  },
  en: {
    eyebrow: "Leader nomination",
    title: "Pick a campaign leader",
    intro:
      "No leader has been chosen for this campaign yet. Nominate yourself or back another member who has nominated.",
    selfNominateCta: "I'd like to lead this",
    alreadyNominated: "You've already nominated",
    voteCta: "Support",
    voteDoneCta: "Supported",
    leaderElectLabel: "Leading",
    tieLabel: "Tied — the community can decide",
    emptyState:
      "No nominations yet. Be the first to nominate.",
    loginPrompt: "Sign in to nominate or support",
    loginCta: "Sign In",
    successNominate: "Your nomination is in.",
    successVote: "Support recorded.",
    successWithdraw: "Support withdrawn.",
    backendPendingToast:
      "Backend endpoint is pending — saved locally for the demo.",
    errorToast: "Something went wrong. Try again.",
    votesCount: "{n} supporting"
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

export function LeaderNominationPanel({ event, language = "np", onChanged }) {
  const t = COPY[language] || COPY.np;
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const messageApi = useToast();
  const [saving, setSaving] = useState(false);

  const nominations = useMemo(
    () => (Array.isArray(event?.nominations) ? event.nominations : []),
    [event?.nominations]
  );

  const viewerId = session?.user?.id || null;
  const viewerName = session?.user?.name || null;
  const myNomination = useMemo(
    () => nominations.find((n) => n.memberId === viewerId),
    [nominations, viewerId]
  );
  const leaderElect = findLeaderElect(nominations);
  const isTie = detectTie(nominations);

  if (!session?.user?.id) {
    const next = encodeURIComponent(`/events/${event?.id || ""}`);
    return (
      <section className="leader-nomination-panel leader-nomination-panel-anon">
        <header className="leader-nomination-header">
          <span className="eyebrow">{t.eyebrow}</span>
          <h2>{t.title}</h2>
          <p>{t.intro}</p>
        </header>
        <div className="leader-nomination-anon-cta">
          <span>{t.loginPrompt}</span>
          <Link href={`/login?next=${next}`}>
            <Button type="primary">{t.loginCta}</Button>
          </Link>
        </div>
      </section>
    );
  }

  const persist = async (action, payload, optimisticUpdate) => {
    setSaving(true);
    try {
      const next = optimisticUpdate(nominations);
      if (isDemoId(event?.id)) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        onChanged?.({ ...event, nominations: next });
        return { ok: true };
      }
      try {
        if (action === "nominate") {
          await postJson(`/events/${event.id}/nominations`, payload || {}, {
            requireAuth: true
          });
        } else if (action === "vote") {
          await postJson(
            `/events/${event.id}/nominations/${payload.nominationId}/vote`,
            {},
            { requireAuth: true }
          );
        } else if (action === "withdraw") {
          await deleteJson(
            `/events/${event.id}/nominations/${payload.nominationId}/vote`,
            { requireAuth: true }
          );
        }
        onChanged?.();
        return { ok: true };
      } catch (apiError) {
        if (apiError?.status === 404 || apiError?.status === 501) {
          messageApi.info(t.backendPendingToast);
          onChanged?.({ ...event, nominations: next });
          return { ok: true, fallback: true };
        }
        throw apiError;
      }
    } catch (error) {
      messageApi.error(error?.message || t.errorToast);
      return { ok: false };
    } finally {
      setSaving(false);
    }
  };

  const handleSelfNominate = async () => {
    if (myNomination || saving) return;
    const result = await persist("nominate", null, (current) => [
      ...current,
      {
        id: `nom-${viewerId}-${Date.now()}`,
        memberId: viewerId,
        memberName: viewerName || "तपाईं",
        voteCount: 1,
        votedByMe: true,
        createdAt: new Date().toISOString()
      }
    ]);
    if (result.ok) messageApi.success(t.successNominate);
  };

  const handleToggleVote = async (nomination) => {
    if (saving) return;
    const next = nominations.map((n) => {
      if (n.id !== nomination.id) return n;
      const wasVoted = n.votedByMe;
      return {
        ...n,
        votedByMe: !wasVoted,
        voteCount: Math.max(0, (n.voteCount || 0) + (wasVoted ? -1 : 1))
      };
    });
    const action = nomination.votedByMe ? "withdraw" : "vote";
    const result = await persist(action, { nominationId: nomination.id }, () => next);
    if (result.ok) {
      messageApi.success(nomination.votedByMe ? t.successWithdraw : t.successVote);
    }
  };

  return (
    <section className="leader-nomination-panel" aria-labelledby="leader-nomination-title">
      <header className="leader-nomination-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2 id="leader-nomination-title">{t.title}</h2>
        <p>{t.intro}</p>
      </header>

      {isTie ? (
        <div className="leader-nomination-tie" role="status">
          <WarningOutlined aria-hidden="true" />
          <span>{t.tieLabel}</span>
        </div>
      ) : null}

      <div className="leader-nomination-self">
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={handleSelfNominate}
          disabled={!!myNomination || saving}
          loading={saving && !myNomination}
        >
          {myNomination ? t.alreadyNominated : t.selfNominateCta}
        </Button>
      </div>

      {nominations.length === 0 ? (
        <p className="leader-nomination-empty">{t.emptyState}</p>
      ) : (
        <ul className="leader-nomination-list">
          {nominations
            .slice()
            .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
            .map((nomination) => {
              const isElect = !isTie && leaderElect?.id === nomination.id;
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
                  <span className="leader-nomination-votes">
                    {t.votesCount.replace("{n}", nomination.voteCount || 0)}
                  </span>
                  <Button
                    type={nomination.votedByMe ? "default" : "primary"}
                    icon={<LikeOutlined />}
                    onClick={() => handleToggleVote(nomination)}
                    disabled={saving}
                    size="small"
                  >
                    {nomination.votedByMe ? t.voteDoneCta : t.voteCta}
                  </Button>
                </li>
              );
            })}
        </ul>
      )}
    </section>
  );
}
