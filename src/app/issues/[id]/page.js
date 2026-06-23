"use client";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import { Button, Empty, Skeleton, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { IssueLocationCard } from "@/components/IssueLocationCard";
import { IssuePhotoGallery } from "@/components/IssuePhotoGallery";
import { IssueShareRow } from "@/components/IssueShareRow";
import { IssueStatusTimeline } from "@/components/IssueStatusTimeline";
import { IssueJoinButton } from "@/components/IssueJoinButton";
import { CompactConversionProgress, ParticipantsPanel } from "@/components/ParticipantsPanel";
import { SupportRolesModal } from "@/components/SupportRolesModal";
import { IssueVoteButton } from "@/components/IssueVoteButton";
import { CommentSection } from "@/components/comments";
import { IssueReactions } from "@/components/IssueReactions";
import { PublicIssueCard } from "@/components/PublicIssueCard";
import { ReportDialog } from "@/components/ReportDialog";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { SiteShell } from "@/components/SiteShell";
import { TertiaryButton } from "@/components/TertiaryButton";
import { usePreferences } from "@/app/providers";
import {
  fetchIssueParticipants,
  fetchMyIssueVotes,
  getJson,
  reportIssue,
  retractVoteOnIssue,
  voteOnIssue
} from "@/lib/apiClient";
import { getAuthSession } from "@/lib/authSession";
import { buildLoginHref } from "@/lib/loginRedirect";
import { copy } from "@/lib/siteContent";
import { useToast } from "@/lib/toast";
import { useTrackVisit } from "@/lib/useRecentlyViewed";
import { issueActionMode } from "@/lib/issueActions";
import { resolveEventForIssue } from "@/lib/eventsApi";
import {
  ISSUE_STATUS_COLORS,
  getIssueCoverImageUrl,
  getListItems,
  getResponseData,
  isImageUpload,
  localizeIssue
} from "@/lib/adminUtils";

const PUBLIC_ISSUE_STATUSES = ["OPEN", "EVENT_SCHEDULED", "COMPLETED"];
const RELATED_LIMIT = 6;
const RELATED_DISPLAY = 3;

// Role menu order shared with the event page, so a role sits in the same place
// whether you meet it on an issue or its converted event.
const PARTICIPANT_ROLE_ORDER = [
  "WORKER",
  "PHOTOGRAPHER",
  "LIVESTREAMER",
  "MEDIC",
  "SAFETY_LEAD",
  "COORDINATOR",
  "LOGISTICS"
];

function formatIssueDate(value, language) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const locale = language === "np" ? "ne-NP" : "en-US";
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return String(value);
  }
}

export default function IssueDetailPage() {
  const params = useParams();
  const issueId = params?.id;
  const { language } = usePreferences();
  const t = copy[language];
  const content = t.issues;
  const messageApi = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [rawIssue, setIssue] = useState(null);
  const issue = rawIssue ? localizeIssue(rawIssue, language) : null;
  // OPEN → Support (vote); EVENT_SCHEDULED → Join; otherwise no primary action.
  const actionMode = issue ? issueActionMode(issue.status) : "none";
  const [related, setRelated] = useState([]);
  // GOING-voter roster (who'll show up once this converts) + the viewer's own
  // vote intent, both feeding the shared ParticipantsPanel below.
  const [participants, setParticipants] = useState([]);
  const [myVote, setMyVote] = useState(null);
  // Which role the viewer is mid-join on, from a roster row tap (null = idle).
  const [joiningRole, setJoiningRole] = useState(null);
  // The rich Support modal (roles + counts + lead, shown by default) — opened
  // from the topline Support button while the issue is unvoted.
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  // Routing target for the Join CTA on a promoted (EVENT_SCHEDULED) issue. The
  // issue read omits its event, so we recover it client-side (interim — see
  // resolveEventForIssue). Until it resolves the button shows the "soon" cue.
  const [resolvedEventId, setResolvedEventId] = useState(null);
  // The linked event's own status (DRAFT | SCHEDULED | ACTIVE | PAUSED |
  // COMPLETED | CANCELLED) — the fine-grained lifecycle the issue's coarse
  // EVENT_SCHEDULED hides. Feeds the status timeline below.
  const [resolvedEventStatus, setResolvedEventStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const fetchIssue = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      // GET /issues/{id} does not echo the caller's own vote yet (backend
      // gap — see docs/engineering/09-backend-admin-gaps.md), so the support
      // button would reset to "Support" on every refresh even after voting.
      // Derive `isVoted` from the caller's votes (GET /issues/me/votes),
      // fetched in parallel so it adds no latency, and seed the button's
      // "Supported" state. Drop this once the detail endpoint returns isVoted.
      const [response, myVotesResult, participantsResult] = await Promise.all([
        getJson(`/issues/${issueId}`),
        getAuthSession()?.user
          ? fetchMyIssueVotes({ limit: 100 }).catch(() => null)
          : Promise.resolve(null),
        // GOING-voter roster — public, so fetch it for everyone. The endpoint
        // resolves slugs as well as ids, so the URL param is safe to pass.
        fetchIssueParticipants(issueId, { limit: 100 }).catch(() => null)
      ]);
      const data = getResponseData(response, null);
      if (!data) {
        setNotFound(true);
        setIssue(null);
        return;
      }
      // Detail GET doesn't echo the caller's own vote (isVoted/voterRole/
      // eventRole) yet, so derive it from GET /issues/me/votes, which decorates
      // each issue with the caller's voterRole + eventRole. Seeds both the
      // Support button's "Supported" state and the participation panel's
      // "your role" line in one pass — no extra round-trip.
      if (myVotesResult) {
        const myVotes = getListItems(myVotesResult);
        const mine = myVotes.find((vote) => vote.id === data.id);
        if (mine) {
          data.isVoted = true;
          setMyVote({ voterRole: mine.voterRole || "INTERESTED", eventRole: mine.eventRole || null });
        } else {
          setMyVote(null);
        }
      } else {
        setMyVote(null);
      }
      setParticipants(getListItems(participantsResult));
      setIssue(data);

      // Promoted issue → recover its scheduled event so the Join CTA can route
      // to the real join flow on the event page (the issue read omits the link;
      // interim client-side match — see resolveEventForIssue).
      if (issueActionMode(data.status) === "join") {
        resolveEventForIssue(data)
          .then((linked) => {
            setResolvedEventId(linked?.slug || linked?.id || null);
            setResolvedEventStatus(linked?.status || null);
          })
          .catch(() => {
            setResolvedEventId(null);
            setResolvedEventStatus(null);
          });
      } else {
        setResolvedEventId(null);
        setResolvedEventStatus(null);
      }

      if (data.category) {
        try {
          const relatedResponse = await getJson("/issues", {
            params: { category: data.category, sort: "voteCount", limit: RELATED_LIMIT }
          });
          const relatedList = getListItems(relatedResponse)
            .filter(
              (item) => item.id !== data.id && PUBLIC_ISSUE_STATUSES.includes(item.status)
            )
            .slice(0, RELATED_DISPLAY);
          setRelated(relatedList);
        } catch {
          setRelated([]);
        }
      }
    } catch (fetchError) {
      if (fetchError?.status === 404) {
        setNotFound(true);
        setIssue(null);
      } else {
        setError(fetchError?.message || content.states.errorBody);
      }
    } finally {
      setLoading(false);
    }
  }, [issueId, content.states.errorBody]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchIssue();
  }, [fetchIssue]);

  // Re-pull the issue's server tallies (voteCount / attendingCount /
  // conversionThreshold / eventRoleCounts / status) AND the named roster after a
  // vote changes, so the topline conversion bar, the participation panel's count
  // badge, and every per-role tally all read from ONE fresh server snapshot. The
  // vote/retract endpoints return no body (201/200, no echo — confirmed against
  // the OpenAPI), so the server read is the only source of truth for the new
  // counts; the optimistic nudge in handleVoteChange just keeps the UI snappy
  // until this lands. eventRoleCounts in particular was never refreshed before,
  // which is what let the per-role tallies (and the badge built from them) drift.
  const reconcileParticipation = useCallback(() => {
    if (!issueId) return;
    fetchIssueParticipants(issueId, { limit: 100 })
      .then((res) => setParticipants(getListItems(res)))
      .catch(() => {});
    getJson(`/issues/${issueId}`)
      .then((response) => {
        const fresh = getResponseData(response, null);
        if (!fresh) return;
        setIssue((prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          if (typeof fresh.voteCount === "number") next.voteCount = fresh.voteCount;
          if (typeof fresh.attendingCount === "number") next.attendingCount = fresh.attendingCount;
          if (typeof fresh.conversionThreshold === "number")
            next.conversionThreshold = fresh.conversionThreshold;
          if (Array.isArray(fresh.eventRoleCounts)) next.eventRoleCounts = fresh.eventRoleCounts;
          if (fresh.status) next.status = fresh.status;
          return next;
        });
        // A vote can tip the issue past its conversion threshold → it promotes to
        // EVENT_SCHEDULED. Recover the freshly-linked event so the CTA can flip
        // from Support to a live Join (mirrors fetchIssue's promotion branch).
        if (issueActionMode(fresh.status) === "join") {
          resolveEventForIssue(fresh)
            .then((linked) => {
              setResolvedEventId(linked?.slug || linked?.id || null);
              setResolvedEventStatus(linked?.status || null);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [issueId]);

  // The Support button / roster bubble each vote/retract up here so the whole
  // participation surface stays in sync. payload is { voterRole, eventRole, … }
  // on a vote, or null on a retract. We apply a correct-signed optimistic nudge
  // for instant feedback, then reconcile every tally from the server snapshot.
  const handleVoteChange = useCallback(
    (payload) => {
      // The vote we're replacing — handleVoteChange is recreated when `myVote`
      // changes (same as the sibling join/lead/interested handlers), so this
      // closure always reads the live prior vote.
      const prior = myVote;
      // attendingCount is the GOING-only conversion tally, so it moves only when
      // a GOING vote is gained or lost; voteCount moves for any vote gained/lost.
      // Computing both deltas off the PRIOR vote keeps a role swap honest too.
      const attendingDelta =
        (payload?.voterRole === "GOING" ? 1 : 0) - (prior?.voterRole === "GOING" ? 1 : 0);
      const voteDelta = (payload ? 1 : 0) - (prior ? 1 : 0);

      setMyVote(
        payload
          ? { voterRole: payload.voterRole || "INTERESTED", eventRole: payload.eventRole ?? null }
          : null
      );
      setIssue((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        // Keep isVoted in step so the topline Support button (which mirrors
        // initialVoted) flips even when the vote came from the roster, not it.
        next.isVoted = Boolean(payload);
        if (attendingDelta !== 0 && typeof next.attendingCount === "number") {
          next.attendingCount = Math.max(0, next.attendingCount + attendingDelta);
        }
        if (voteDelta !== 0 && typeof next.voteCount === "number") {
          next.voteCount = Math.max(0, next.voteCount + voteDelta);
        }
        return next;
      });
      reconcileParticipation();
    },
    [myVote, reconcileParticipation]
  );

  // Roster role-row tap → join directly as that role (a GOING vote with the
  // chosen eventRole), mirroring the event roster's "+N open" join pills. This
  // is the single writer for roster-driven votes; it reconciles through
  // handleVoteChange so the panel, progress bar, AND the topline Support button
  // (which mirrors isVoted) all stay in step.
  const handleJoinRole = useCallback(
    async (eventRole) => {
      if (!getAuthSession()?.user) {
        router.push(buildLoginHref(pathname, "vote"));
        return;
      }
      // One vote per issue — to change roles the viewer withdraws first via the
      // Support button. Surface why a tap on an already-committed issue no-ops.
      if (myVote) {
        messageApi.info(content.card.voteAlreadyVoted);
        return;
      }
      if (!rawIssue?.id || joiningRole) return;
      setJoiningRole(eventRole);
      try {
        const res = await voteOnIssue(rawIssue.id, "GOING", eventRole);
        handleVoteChange({ voterRole: "GOING", eventRole, ...(res?.data || {}) });
        messageApi.success(content.card.voteSuccess);
      } catch (err) {
        if (err?.errorCode === "ALREADY_VOTED" || err?.status === 409) {
          messageApi.info(content.card.voteAlreadyVoted);
          handleVoteChange({ voterRole: "GOING", eventRole });
        } else if (err?.status === 403) {
          messageApi.error(content.card.voteForbidden);
        } else {
          messageApi.error(err?.message || content.card.voteError);
        }
      } finally {
        setJoiningRole(null);
      }
    },
    [content.card, handleVoteChange, joiningRole, messageApi, myVote, pathname, rawIssue, router]
  );

  // Withdraw from a role straight off the roster (retract the GOING vote). The
  // backend only allows this while the issue is OPEN; reconciles through
  // handleVoteChange(null) so the panel, progress bar, AND the topline Support
  // button all clear together. Mirrors the event roster's leave path.
  const handleLeaveRole = useCallback(async () => {
    if (!rawIssue?.id) return;
    try {
      await retractVoteOnIssue(rawIssue.id);
      handleVoteChange(null);
      messageApi.success(content.card.voteWithdrawn);
    } catch (err) {
      if (err?.errorCode === "ISSUE_NOT_OPEN" || err?.status === 409) {
        messageApi.info(content.card.voteWithdrawNotOpen);
      } else {
        messageApi.error(err?.message || content.card.voteWithdrawError);
      }
      throw err;
    }
  }, [content.card, handleVoteChange, messageApi, rawIssue]);

  // Offer to lead → a WANT_TO_LEAD vote (no eventRole). This is the issue-stage
  // leadership signal that maps to the Coordinator/leader slot. Withdrawing
  // leadership reuses handleLeaveRole (retract). One vote per issue applies.
  const handleLeadVote = useCallback(async () => {
    if (!getAuthSession()?.user) {
      router.push(buildLoginHref(pathname, "vote"));
      return;
    }
    if (myVote) {
      messageApi.info(content.card.voteAlreadyVoted);
      return;
    }
    if (!rawIssue?.id) return;
    try {
      const res = await voteOnIssue(rawIssue.id, "WANT_TO_LEAD");
      handleVoteChange({ voterRole: "WANT_TO_LEAD", eventRole: null, ...(res?.data || {}) });
      messageApi.success(content.card.voteSuccess);
    } catch (err) {
      if (err?.errorCode === "ALREADY_VOTED" || err?.status === 409) {
        messageApi.info(content.card.voteAlreadyVoted);
        handleVoteChange({ voterRole: "WANT_TO_LEAD", eventRole: null });
      } else if (err?.status === 403) {
        messageApi.error(content.card.voteForbidden);
      } else {
        messageApi.error(err?.message || content.card.voteError);
        throw err;
      }
    }
  }, [content.card, handleVoteChange, messageApi, myVote, pathname, rawIssue, router]);

  // "I'm interested" from the Support modal → a plain INTERESTED vote (no role,
  // no lead). Registers support and counts toward voteCount but NOT attending.
  const handleInterestedVote = useCallback(async () => {
    if (!getAuthSession()?.user) {
      router.push(buildLoginHref(pathname, "vote"));
      return;
    }
    if (myVote) {
      messageApi.info(content.card.voteAlreadyVoted);
      return;
    }
    if (!rawIssue?.id) return;
    try {
      const res = await voteOnIssue(rawIssue.id, "INTERESTED");
      handleVoteChange({ voterRole: "INTERESTED", eventRole: null, ...(res?.data || {}) });
      messageApi.success(content.card.voteSuccess);
    } catch (err) {
      if (err?.errorCode === "ALREADY_VOTED" || err?.status === 409) {
        messageApi.info(content.card.voteAlreadyVoted);
        handleVoteChange({ voterRole: "INTERESTED", eventRole: null });
      } else if (err?.status === 403) {
        messageApi.error(content.card.voteForbidden);
      } else {
        messageApi.error(err?.message || content.card.voteError);
        throw err;
      }
    }
  }, [content.card, handleVoteChange, messageApi, myVote, pathname, rawIssue, router]);

  const uploads = Array.isArray(issue?.uploads) ? issue.uploads : [];
  const coverImageUrl = getIssueCoverImageUrl(issue);
  const imageUploads = uploads
    .filter(isImageUpload)
    .filter((upload) => upload.url !== coverImageUrl);
  // Cover image alt fallback chain — Next.js Image strips the attribute
  // when alt is undefined/empty, which produces "Image is missing required
  // alt property" console errors on issues without a title yet.
  const coverAlt =
    issue?.title ||
    issue?.addressText ||
    (issue?.category && content.categoryLabels?.[issue.category]) ||
    (issue?.status && content.statusLabels?.[issue.status]) ||
    content.detail?.galleryAria ||
    "Issue";

  const scrollToLocation = () => {
    const target = document.getElementById("issue-location");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useTrackVisit(
    issue && issue.id
      ? {
          href: `/issues/${issue.id}`,
          title: issue.title || coverAlt,
          subtitle: issue.addressText || null
        }
      : null
  );

  // Adapt the issue's vote signal into the shared ParticipantsPanel shape.
  // Per-role counts come from eventRoleCounts (covers roles with no named voter
  // yet); names come from the GOING-voter roster. Issues have no per-role plan,
  // so there's no `target` — each row just shows the committed count.
  const isOpenIssue = issue?.status === "OPEN";
  const viewerName = getAuthSession()?.user?.name || null;
  const participantRoles = (() => {
    const countByRole = new Map();
    if (Array.isArray(issue?.eventRoleCounts)) {
      for (const entry of issue.eventRoleCounts) {
        countByRole.set(entry?.eventRole, Number(entry?.voterCount) || 0);
      }
    }
    const namesByRole = new Map();
    for (const p of participants) {
      if (!p?.eventRole || !p?.user?.name) continue;
      const arr = namesByRole.get(p.eventRole) || [];
      arr.push(p.user.name);
      namesByRole.set(p.eventRole, arr);
    }
    // COORDINATOR is pulled out of the grid — it's the leadership slot (a
    // WANT_TO_LEAD vote), rendered separately at the bottom by the panel.
    return PARTICIPANT_ROLE_ORDER.filter((role) => role !== "COORDINATOR").map((role) => {
      const names = namesByRole.get(role) || [];
      // eventRoleCounts is authoritative for the tally and the roster for names;
      // take the max so a just-joined voter still shows a count even in the brief
      // window before the refreshed eventRoleCounts lands (and vice-versa).
      const count = Math.max(Number(countByRole.get(role)) || 0, names.length);
      return { role, count, names };
    });
  })();
  // The viewer occupies a role row only when they committed to GOING with a
  // chosen role. INTERESTED is reflected by the topline Support button;
  // WANT_TO_LEAD goes to the leader slot below.
  const participantViewer =
    myVote?.voterRole === "GOING" && myVote?.eventRole
      ? { role: myVote.eventRole, status: "GOING", name: viewerName }
      : null;
  // Leadership ("Coordinator") slot — driven by the WANT_TO_LEAD vote. The
  // backend doesn't expose a count of would-be leaders yet, so we can only
  // reflect the viewer's own offer (see docs/api-requirements/issues.md gap).
  const viewerIsLeader = myVote?.voterRole === "WANT_TO_LEAD";
  const participantLeaderSlot =
    isOpenIssue || viewerIsLeader
      ? {
          viewerIsLeader,
          name: viewerIsLeader ? viewerName : null,
          count: viewerIsLeader ? 1 : 0,
          canLead: isOpenIssue && !myVote
        }
      : null;
  const participantCanLeaveLead = isOpenIssue && viewerIsLeader;
  const participantProgress =
    isOpenIssue && Number(issue?.conversionThreshold) > 0
      ? {
          current: Number(issue?.attendingCount) || 0,
          target: Number(issue?.conversionThreshold),
          variant: "conversion"
        }
      : null;
  // One vote per issue: roles are joinable only while OPEN and the viewer hasn't
  // committed to anything yet. Withdraw (retract) is likewise OPEN-only.
  const participantJoinable = isOpenIssue && !myVote ? null : [];
  const participantCanLeave = isOpenIssue && Boolean(participantViewer);

  return (
    <SiteShell pageTitle={issue?.title || content.detail.notFoundTitle}>
      <ScrollProgressBar />
      <section className="page-section public-issue-detail-section">
        <TertiaryButton href="/issues" icon={<ArrowLeftOutlined />}>
          {content.detail.backToList}
        </TertiaryButton>

        {loading ? (
          <article className="content-card public-issue-detail public-issue-detail-skeleton" role="status" aria-live="polite">
            <Skeleton.Button active size="small" style={{ width: 120 }} />
            <Skeleton active title={{ width: "70%" }} paragraph={{ rows: 1, width: ["40%"] }} />
            <Skeleton.Image active style={{ width: "100%", height: 320 }} />
            <Skeleton active paragraph={{ rows: 3 }} />
          </article>
        ) : null}

        {!loading && error ? (
          <div className="public-issues-error" role="alert">
            <h2>{content.states.errorTitle}</h2>
            <p>{content.states.errorBody}</p>
            <Button onClick={fetchIssue} type="primary">
              {content.states.retry}
            </Button>
          </div>
        ) : null}

        {!loading && notFound ? (
          <Empty
            className="public-issues-empty"
            description={
              <>
                <strong>{content.detail.notFoundTitle}</strong>
                <p>{content.detail.notFoundBody}</p>
              </>
            }
          >
            <Link href="/issues">
              <Button type="primary">{content.detail.backToList}</Button>
            </Link>
          </Empty>
        ) : null}

        {!loading && !error && !notFound && issue ? (
          <article className="content-card public-issue-detail">
            {coverImageUrl ? (
              <div className="public-issue-detail-cover">
                <Image
                  alt={coverAlt}
                  height={720}
                  src={coverImageUrl}
                  unoptimized
                  width={1920}
                  sizes="(max-width: 768px) 100vw, 1180px"
                  priority
                />
              </div>
            ) : null}

            <div className="public-issue-detail-body">
              <div className="public-issue-detail-topline">
                <div className="public-issue-detail-topline-tags">
                  <Tag color={ISSUE_STATUS_COLORS[issue.status]}>
                    {content.statusLabels[issue.status] || issue.status}
                  </Tag>
                  <Tag>{content.categoryLabels[issue.category] || issue.category}</Tag>
                </div>
                <div className="public-issue-detail-support" id="issue-vote">
                  {participantProgress ? (
                    <CompactConversionProgress
                      language={language}
                      progress={participantProgress}
                    />
                  ) : null}
                  {actionMode === "support" ? (
                    <IssueVoteButton
                      // Remount when the vote state changes so the button label
                      // (Support → Supported/Joining/Leading) reseeds — votes can
                      // land from the rich modal, not just this button.
                      key={myVote ? myVote.voterRole : "unvoted"}
                      className="issue-topline-support-btn"
                      content={content}
                      initialVoteCount={issue.voteCount}
                      initialVoted={issue.isVoted}
                      initialVoterRole={myVote?.voterRole}
                      initialEventRole={myVote?.eventRole}
                      issueId={issue.id}
                      language={language}
                      onVoteChange={handleVoteChange}
                      onRequestSupport={() => setSupportModalOpen(true)}
                      showCount={false}
                      size="large"
                      type="primary"
                    />
                  ) : actionMode === "join" ? (
                    <IssueJoinButton
                      issue={issue}
                      eventId={resolvedEventId}
                      language={language}
                      size="large"
                    />
                  ) : null}
                </div>
              </div>

              <h1>{issue.title}</h1>

              <div className="public-issue-detail-meta-row">
                <div className="public-issue-detail-meta">
                  {issue.addressText ? (
                    <button
                      className="public-issue-detail-meta-link"
                      onClick={scrollToLocation}
                      type="button"
                    >
                      <EnvironmentOutlined /> {issue.addressText}
                    </button>
                  ) : null}
                  {issue.createdAt ? (
                    <span>
                      <CalendarOutlined /> {content.detail.reportedOn}:{" "}
                      {formatIssueDate(issue.createdAt, language)}
                    </span>
                  ) : null}
                </div>
                <IssueShareRow
                  title={issue.title}
                  content={content}
                  language={language}
                />
                <div className="public-issue-report-row">
                  <ReportDialog
                    language={language}
                    targetKind="issue"
                    onReport={(values) => reportIssue(issue.id, values)}
                  />
                </div>
              </div>

              {imageUploads.length > 0 ? (
                <IssuePhotoGallery
                  images={imageUploads}
                  title={coverAlt}
                  content={content}
                />
              ) : null}

              <section className="public-issue-detail-section-block public-issue-timeline-block">
                <IssueStatusTimeline
                  status={issue.status}
                  eventStatus={resolvedEventStatus}
                  content={content}
                  language={language}
                />
              </section>

              {issue.description ? (
                <section className="public-issue-detail-section-block">
                  <h2>{content.detail.descriptionTitle}</h2>
                  <p>{issue.description}</p>
                </section>
              ) : null}

              <ParticipantsPanel
                roles={participantRoles}
                viewer={participantViewer}
                /* The heading badge reads the GOING `attendingCount` — the exact
                   number the conversion bar shows — so "Participants N" can never
                   disagree with "N/threshold joined" in the topline. */
                totalOverride={Number(issue?.attendingCount) || 0}
                /* conversion progress shows in the topline (CompactConversionProgress
                   beside the Support button), so the panel doesn't repeat it here */
                progress={null}
                joinableRoles={participantJoinable}
                canLeave={participantCanLeave}
                onJoin={handleJoinRole}
                onLeave={handleLeaveRole}
                leaderSlot={participantLeaderSlot}
                onLead={handleLeadVote}
                onLeaveLead={handleLeaveRole}
                canLeaveLead={participantCanLeaveLead}
                language={language}
              />

              <SupportRolesModal
                open={supportModalOpen}
                onClose={() => setSupportModalOpen(false)}
                language={language}
                onInterested={handleInterestedVote}
                panelProps={{
                  roles: participantRoles,
                  viewer: participantViewer,
                  totalOverride: Number(issue?.attendingCount) || 0,
                  progress: participantProgress,
                  joinableRoles: participantJoinable,
                  canLeave: participantCanLeave,
                  onJoin: handleJoinRole,
                  onLeave: handleLeaveRole,
                  leaderSlot: participantLeaderSlot,
                  onLead: handleLeadVote,
                  onLeaveLead: handleLeaveRole,
                  canLeaveLead: participantCanLeaveLead
                }}
              />

              <IssueLocationCard
                issue={issue}
                content={content}
                language={language}
              />

              <IssueReactions
                issueId={issue.id}
                language={language}
                heading={language === "np" ? "तपाईंको प्रतिक्रिया" : "Your reaction"}
              />

              <CommentSection
                targetType="issue"
                targetId={issue.id}
                language={language}
              />
            </div>
          </article>
        ) : null}

        {!loading && !error && !notFound && issue ? (
          <section className="public-issue-related">
            <h2>{content.detail.relatedTitle}</h2>
            {related.length > 0 ? (
              <div className="public-issues-grid">
                {related.map((relatedIssue) => (
                  <PublicIssueCard
                    key={relatedIssue.id}
                    issue={relatedIssue}
                    content={content}
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <p className="public-issue-detail-muted">{content.detail.noRelated}</p>
            )}
          </section>
        ) : null}
      </section>
    </SiteShell>
  );
}
