"use client";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined
} from "@ant-design/icons";
import { Button, Empty, Skeleton, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { IssueLocationCard } from "@/components/IssueLocationCard";
import { IssuePhotoGallery } from "@/components/IssuePhotoGallery";
import { IssueShareRow } from "@/components/IssueShareRow";
import { IssueStatusTimeline } from "@/components/IssueStatusTimeline";
import { IssueJoinButton } from "@/components/IssueJoinButton";
import { IssueParticipationPanel } from "@/components/IssueParticipationPanel";
import { IssueVoteButton } from "@/components/IssueVoteButton";
import { ShareButton } from "@/components/ShareButton";
import { CommentSection } from "@/components/comments";
import { IssueReactions } from "@/components/IssueReactions";
import { PublicIssueCard, formatSupporters } from "@/components/PublicIssueCard";
import { ReportDialog } from "@/components/ReportDialog";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { SiteShell } from "@/components/SiteShell";
import { StickyActionBar } from "@/components/StickyActionBar";
import { TertiaryButton } from "@/components/TertiaryButton";
import { usePreferences } from "@/app/providers";
import {
  fetchIssueParticipants,
  fetchMyIssueVotes,
  getJson,
  reportIssue
} from "@/lib/apiClient";
import { getAuthSession } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";
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

  const [rawIssue, setIssue] = useState(null);
  const issue = rawIssue ? localizeIssue(rawIssue, language) : null;
  // OPEN → Support (vote); EVENT_SCHEDULED → Join; otherwise no primary action.
  const actionMode = issue ? issueActionMode(issue.status) : "none";
  const [related, setRelated] = useState([]);
  // GOING-voter roster (who'll show up once this converts) + the viewer's own
  // vote intent, both feeding the IssueParticipationPanel below.
  const [participants, setParticipants] = useState([]);
  const [myVote, setMyVote] = useState(null);
  // Routing target for the Join CTA on a promoted (EVENT_SCHEDULED) issue. The
  // issue read omits its event, so we recover it client-side (interim — see
  // resolveEventForIssue). Until it resolves the button shows the "soon" cue.
  const [resolvedEventId, setResolvedEventId] = useState(null);
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
          .then((linked) => setResolvedEventId(linked?.slug || linked?.id || null))
          .catch(() => setResolvedEventId(null));
      } else {
        setResolvedEventId(null);
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

  // The Support button bubbles each vote/retract up here so the participation
  // panel stays in sync without its own re-fetch of the detail. payload is the
  // server's vote response (voterRole, eventRole, voteCount, attendingCount,
  // conversionThreshold, status) on a vote, or null on a retract.
  const handleVoteChange = useCallback(
    (payload) => {
      setMyVote(
        payload
          ? { voterRole: payload.voterRole || "INTERESTED", eventRole: payload.eventRole ?? null }
          : null
      );
      // Move the conversion progress bar immediately off the server's echoed
      // tallies (retract only echoes voteCount/attendingCount).
      setIssue((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        if (payload && typeof payload === "object") {
          if (typeof payload.voteCount === "number") next.voteCount = payload.voteCount;
          if (typeof payload.attendingCount === "number") next.attendingCount = payload.attendingCount;
          if (typeof payload.conversionThreshold === "number")
            next.conversionThreshold = payload.conversionThreshold;
          if (payload.status) next.status = payload.status;
        } else if (payload === null && typeof next.attendingCount === "number") {
          // Retract with no server attendingCount → best-effort local decrement
          // (a GOING vote was the only kind that counted toward attending).
          next.attendingCount = Math.max(0, next.attendingCount - 1);
        }
        return next;
      });
      // The vote response doesn't carry the named roster, so re-pull it to give
      // a fresh GOING signup a face (and drop a withdrawn one).
      fetchIssueParticipants(issueId, { limit: 100 })
        .then((res) => setParticipants(getListItems(res)))
        .catch(() => {});
    },
    [issueId]
  );

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
                  <span className="public-issue-detail-supporters">
                    {formatSupporters(issue.voteCount, content, language)}
                  </span>
                  <ShareButton
                    language={language}
                    title={issue.title}
                    text={issue.title}
                    size="large"
                  />
                  {actionMode === "support" ? (
                    <IssueVoteButton
                      content={content}
                      initialVoteCount={issue.voteCount}
                      initialVoted={issue.isVoted}
                      initialVoterRole={myVote?.voterRole}
                      issueId={issue.id}
                      language={language}
                      onVoteChange={handleVoteChange}
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
                <IssueStatusTimeline status={issue.status} content={content} />
              </section>

              {issue.description ? (
                <section className="public-issue-detail-section-block">
                  <h2>{content.detail.descriptionTitle}</h2>
                  <p>{issue.description}</p>
                </section>
              ) : null}

              <IssueParticipationPanel
                issue={issue}
                participants={participants}
                myVote={myVote}
                language={language}
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

        {!loading && !error && !notFound && issue && actionMode === "support" ? (
          <StickyActionBar
            label={language === "np" ? "हाल समर्थन गर्नुहोस्" : "Support this issue"}
            href="#issue-vote"
          />
        ) : null}

        {!loading && !error && !notFound && issue && actionMode === "join" ? (
          <StickyActionBar>
            <IssueJoinButton
              issue={issue}
              eventId={resolvedEventId}
              language={language}
              block
              size="large"
            />
          </StickyActionBar>
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
