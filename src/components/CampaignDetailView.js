"use client";

// CampaignDetailView — the ONE unified campaign detail body, rendered by
// /campaign/[slug] for every lifecycle status (OPEN → DRAFT → SCHEDULED →
// ACTIVE → COMPLETED, plus PAUSED). It reuses the ISSUE detail design verbatim
// (cover hero, status timeline, conversion progress, ParticipantsPanel, About,
// FULL-WIDTH location map, reactions, discussion, related) and *adds* the
// lifecycle blocks the issue page lacks — Schedule, Meetup point, What-to-bring
// / planning notes / coordination link, Risk badge, and the COMPLETED Recap —
// revealing each progressively as the campaign advances (see
// docs/design/07-campaign-detail-lifecycle-blocks.md).
//
// Canonical id = the issue slug. The page passes that slug here; this component
// reuses useRoleSupport (which eager-loads the issue, roster, myVote, and
// resolves the linked event slug + status) and ON TOP fetches GET /events/{slug}
// once to populate the new event-sourced blocks. The canonical campaign status
// is folded from issue.status + event.status via resolveCampaignStatus.

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  LinkOutlined,
  SafetyOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Button, Empty, Skeleton, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IssueLocationCard } from "@/components/IssueLocationCard";
import { IssuePhotoGallery } from "@/components/IssuePhotoGallery";
import { IssueShareRow } from "@/components/IssueShareRow";
import { IssueStatusTimeline } from "@/components/IssueStatusTimeline";
import { IssueJoinButton } from "@/components/IssueJoinButton";
import { IssueMapThumb } from "@/components/IssueMapThumb";
import { CompactConversionProgress, ParticipantsPanel } from "@/components/ParticipantsPanel";
import { IssueVoteButton } from "@/components/IssueVoteButton";
import { CommentSection } from "@/components/comments";
import { IssueReactions } from "@/components/IssueReactions";
import { CampaignCard } from "@/components/CampaignCard";
import { ReportDialog } from "@/components/ReportDialog";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";
import { SiteShell } from "@/components/SiteShell";
import { TertiaryButton } from "@/components/TertiaryButton";
import { usePreferences } from "@/app/providers";
import { getJson, reportIssue } from "@/lib/apiClient";
import { copy } from "@/lib/siteContent";
import { useTrackVisit } from "@/lib/useRecentlyViewed";
import { issueActionMode, getIssueEventId } from "@/lib/issueActions";
import { campaignStatusLabel, campaignVisualStatus, resolveCampaignStatus } from "@/lib/campaignStatus";
import {
  EVENT_RISK_COLORS,
  getIssueCoverImageUrl,
  getListItems,
  getResponseData,
  isImageUpload,
  localizeIssue
} from "@/lib/adminUtils";
import { useRoleSupport } from "@/lib/useRoleSupport";

const PUBLIC_ISSUE_STATUSES = ["OPEN", "EVENT_SCHEDULED", "EVENT_DRAFT", "COMPLETED"];
const RELATED_LIMIT = 6;
const RELATED_DISPLAY = 3;

// Statuses whose campaign has confirmed planning (schedule + meetup are known).
const PLANNED_STATUSES = new Set(["SCHEDULED", "ACTIVE", "COMPLETED", "PAUSED"]);

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// New blocks' headings live here (the existing copy dictionaries already carry
// scheduledOn / notScheduled / duration / meetupTitle / completedAt /
// resultSummary / photosTitle, reused below). Natural Devanagari per project
// language rules.
const LOCAL_COPY = {
  np: {
    backToCampaigns: "सबै अभियानमा फर्कने",
    scheduleTitle: "तालिका",
    bringTitle: "के ल्याउने",
    planningTitle: "तयारीका कुरा",
    coordinationTitle: "समन्वय",
    coordinationLink: "समन्वय लिङ्क खोल्ने",
    recapTitle: "अभियानको नतिजा",
    attendeesLabel: "सहभागी",
    attendeesValue: "{n} जना सामेल भए"
  },
  en: {
    backToCampaigns: "Back to All Campaigns",
    scheduleTitle: "Schedule",
    bringTitle: "What to bring",
    planningTitle: "Planning notes",
    coordinationTitle: "Coordination",
    coordinationLink: "Open coordination link",
    recapTitle: "Campaign recap",
    attendeesLabel: "Attendees",
    attendeesValue: "{n} people took part"
  }
};

// Mirror of adminUtils' (unexported) isUsableImageUrl guard: the seed data on
// the dead cdn.shramdan.org host 404s, so any upload pointing there must be
// dropped from the galleries — otherwise the photo strip renders black boxes
// (the cover already filters this host via getIssueCoverImageUrl; we apply the
// same rule to the body + recap galleries so "representative image always"
// holds and no broken image ever shows).
function isUsableUploadUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url, "https://shramdan.org");
    return parsed.hostname !== "cdn.shramdan.org";
  } catch {
    return true;
  }
}

function formatIssueDate(value, language) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const locale = language === "np" ? "ne-NP" : "en-US";
    return date.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return String(value);
  }
}

function formatScheduledAt(value, language) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const locale = language === "np" ? "ne-NP" : "en-US";
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return String(value);
  }
}

function buildMapsLink(addressText, latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (addressText) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
  }
  return null;
}

export function CampaignDetailView({ slug }) {
  const issueId = slug;
  const { language } = usePreferences();
  const t = copy[language];
  const content = t.issues;
  const eventContent = t.events;
  const local = LOCAL_COPY[language] || LOCAL_COPY.np;

  const [rawIssue, setIssue] = useState(null);
  const issue = rawIssue ? localizeIssue(rawIssue, language) : null;
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  // The promoted campaign's event detail (schedule / meetup / recap source).
  // Resolved off the issue's embedded event slug, fetched once after the issue.
  const [eventData, setEventData] = useState(null);

  // Shared participation hook — single source of truth for roster, myVote, the
  // status timeline's resolved event status, and the Vote/Join CTA gating. eager
  // loads the roster on mount so the always-visible ParticipantsPanel renders.
  const support = useRoleSupport(issueId, {
    seed: rawIssue,
    content,
    language,
    eager: true
  });

  const fetchCampaign = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const response = await getJson(`/issues/${issueId}`);
      const data = getResponseData(response, null);
      if (!data) {
        setNotFound(true);
        setIssue(null);
        return;
      }
      setIssue(data);

      // Promoted campaign → fetch the linked event for the lifecycle blocks
      // (schedule / meetup / what-to-bring / recap). Soft-fail: the issue body
      // still renders fully without it.
      const eventSlug = getIssueEventId(data);
      if (eventSlug && data.status !== "OPEN") {
        try {
          const eventResponse = await getJson(`/events/${eventSlug}`);
          setEventData(getResponseData(eventResponse, null));
        } catch {
          setEventData(null);
        }
      } else {
        setEventData(null);
      }

      if (data.category) {
        try {
          const relatedResponse = await getJson("/issues", {
            params: { category: data.category, sort: "voteCount", limit: RELATED_LIMIT }
          });
          const relatedList = getListItems(relatedResponse)
            .filter((item) => item.id !== data.id && PUBLIC_ISSUE_STATUSES.includes(item.status))
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
    fetchCampaign();
  }, [fetchCampaign]);

  // Canonical campaign status — event status wins where present, falling back to
  // the resolved event status from useRoleSupport before the standalone event
  // fetch lands.
  const eventStatus = eventData?.status || support.resolvedEventStatus || null;
  const campaignStatus = issue
    ? resolveCampaignStatus(issue.status, eventStatus)
    : "OPEN";
  const visualStatus = campaignVisualStatus(campaignStatus);
  const isPlanned = PLANNED_STATUSES.has(campaignStatus);
  const isCompleted = campaignStatus === "COMPLETED";

  // OPEN → Support (vote); EVENT_DRAFT/SCHEDULED → Join; COMPLETED → contributed.
  const actionMode = issue ? issueActionMode(issue.status) : "none";

  const uploads = Array.isArray(issue?.uploads) ? issue.uploads : [];
  const coverImageUrl = getIssueCoverImageUrl(issue);
  const imageUploads = uploads
    .filter(isImageUpload)
    .filter((upload) => isUsableUploadUrl(upload.url))
    .filter((upload) => upload.url !== coverImageUrl);

  // Completion photos for the recap — sourced from the event's uploads.
  const eventImageUploads = (Array.isArray(eventData?.uploads) ? eventData.uploads : [])
    .filter(isImageUpload)
    .filter((upload) => isUsableUploadUrl(upload.url));

  const hasCoords =
    Number.isFinite(Number(issue?.latitude)) && Number.isFinite(Number(issue?.longitude));

  const coverAlt =
    issue?.title ||
    issue?.addressText ||
    (issue?.category && content.categoryLabels?.[issue.category]) ||
    content.detail?.galleryAria ||
    "Campaign";

  const scrollToLocation = () => {
    const target = document.getElementById("issue-location");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useTrackVisit(
    issue && issue.id
      ? {
          href: `/campaign/${issue.slug || issue.id}`,
          title: issue.title || coverAlt,
          subtitle: issue.addressText || null
        }
      : null
  );

  // ── Lifecycle-block data (event-sourced) ──────────────────────────────────
  const scheduledAt = eventData?.scheduledAt || null;
  const durationMinutes = eventData?.durationMinutes || null;
  const meetupAddress = eventData?.meetupAddress || "";
  const meetupNotes = eventData?.meetupNotes || "";
  const meetupLat = Number(eventData?.meetupLatitude);
  const meetupLng = Number(eventData?.meetupLongitude);
  const hasMeetupCoords = Number.isFinite(meetupLat) && Number.isFinite(meetupLng);
  const meetupMapsLink = buildMapsLink(meetupAddress, meetupLat, meetupLng);
  const whatToBring = eventData?.whatToBring || "";
  const planningNotes = eventData?.planningNotes || "";
  const coordinationLink = eventData?.coordinationLink || "";
  const riskLevel = eventData?.riskLevel || null;
  const resultSummary = eventData?.resultSummary || "";
  const attendeeCount = eventData?.attendeeCount;
  const completedAt = eventData?.completedAt || null;

  const showSchedule = campaignStatus === "DRAFT" || isPlanned;
  const showMeetup = isPlanned && (meetupAddress || meetupNotes || hasMeetupCoords);
  const showBring = isPlanned && !isCompleted && Boolean(whatToBring);
  const showPlanning = isPlanned && !isCompleted && Boolean(planningNotes);
  const showCoordination = isPlanned && !isCompleted && Boolean(coordinationLink);
  const showRisk = isPlanned && !isCompleted && riskLevel && riskLevel !== "NORMAL";
  const showRecap =
    isCompleted &&
    (Boolean(resultSummary) ||
      Boolean(completedAt) ||
      Number.isFinite(Number(attendeeCount)) ||
      eventImageUploads.length > 0);

  return (
    <SiteShell pageTitle={issue?.title || content.detail.notFoundTitle}>
      <ScrollProgressBar />
      <section className="page-section public-issue-detail-section">
        <TertiaryButton href="/campaigns" icon={<ArrowLeftOutlined />}>
          {local.backToCampaigns}
        </TertiaryButton>

        {loading ? (
          <article
            className="content-card public-issue-detail public-issue-detail-skeleton"
            role="status"
            aria-live="polite"
          >
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
            <Button onClick={fetchCampaign} type="primary">
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
            <Link href="/campaigns">
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
            ) : hasCoords ? (
              /* Representative fallback — never an empty placeholder. A map
                 thumbnail of the campaign's own location stands in for a missing
                 cover (per the "representative image always" rule). */
              <div className="public-issue-detail-cover public-issue-detail-cover--map">
                <IssueMapThumb
                  latitude={issue.latitude}
                  longitude={issue.longitude}
                  alt={coverAlt}
                  zoom={15}
                />
              </div>
            ) : null}

            <div className="public-issue-detail-body">
              <div className="public-issue-detail-topline">
                <div className="public-issue-detail-topline-tags">
                  <span
                    className="campaign-detail-status"
                    data-status={visualStatus}
                  >
                    <span className="campaign-detail-status-dot" aria-hidden="true" />
                    {campaignStatusLabel(campaignStatus, language)}
                  </span>
                  <Tag>{content.categoryLabels[issue.category] || issue.category}</Tag>
                </div>
                <div className="public-issue-detail-support" id="issue-vote">
                  {support.panelProps.progress ? (
                    <CompactConversionProgress
                      language={language}
                      progress={support.panelProps.progress}
                    />
                  ) : null}
                  {actionMode === "support" ? (
                    <IssueVoteButton
                      className="issue-topline-support-btn"
                      content={content}
                      issueId={issue.id}
                      language={language}
                      seed={rawIssue}
                      support={support}
                      showCount={false}
                      size="large"
                      type="primary"
                    />
                  ) : actionMode === "join" || actionMode === "contributed" ? (
                    <IssueJoinButton
                      issue={issue}
                      eventId={support.resolvedEventId || getIssueEventId(rawIssue)}
                      eventStatus={eventStatus}
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
                <IssueShareRow title={issue.title} content={content} language={language} />
                <div className="public-issue-report-row">
                  <ReportDialog
                    language={language}
                    targetKind="issue"
                    onReport={(values) => reportIssue(issue.id, values)}
                  />
                </div>
              </div>

              {imageUploads.length > 0 ? (
                <IssuePhotoGallery images={imageUploads} title={coverAlt} content={content} />
              ) : null}

              <section className="public-issue-detail-section-block public-issue-timeline-block">
                <IssueStatusTimeline
                  status={issue.status}
                  eventStatus={eventStatus}
                  content={content}
                  language={language}
                />
              </section>

              {issue.description ? (
                <section className="public-issue-detail-section-block">
                  <h2>{eventContent.detail.goalTitle}</h2>
                  <p>{issue.description}</p>
                </section>
              ) : null}

              {/* SCHEDULE — DRAFT shows "not set yet"; SCHEDULED+ shows the date. */}
              {showSchedule ? (
                <section className="public-issue-detail-section-block">
                  <h2>{local.scheduleTitle}</h2>
                  <div className="public-issue-detail-meta">
                    <span>
                      <CalendarOutlined />{" "}
                      {scheduledAt
                        ? `${eventContent.detail.scheduledOn}: ${formatScheduledAt(scheduledAt, language)}`
                        : eventContent.detail.notScheduled}
                    </span>
                    {durationMinutes ? (
                      <span>
                        <ClockCircleOutlined /> {eventContent.detail.duration}:{" "}
                        {eventContent.detail.durationMinutes.replace(
                          "{n}",
                          localizeDigits(durationMinutes, language)
                        )}
                      </span>
                    ) : null}
                    {showRisk ? (
                      <span>
                        <SafetyOutlined /> {eventContent.detail.riskLabel}:{" "}
                        <Tag color={EVENT_RISK_COLORS[riskLevel] || "default"}>{riskLevel}</Tag>
                      </span>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {/* MEETUP POINT — SCHEDULED onward (planning confirmed). */}
              {showMeetup ? (
                <section className="public-issue-detail-section-block">
                  <h2>{eventContent.detail.meetupTitle}</h2>
                  {meetupAddress ? (
                    <p className="public-issue-location-address">
                      <EnvironmentOutlined /> {meetupAddress}
                      {meetupMapsLink ? (
                        <>
                          {" "}
                          <a href={meetupMapsLink} rel="noreferrer" target="_blank">
                            {eventContent.detail.openInMaps} <ExportOutlined />
                          </a>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                  {meetupNotes ? <p>{meetupNotes}</p> : null}
                </section>
              ) : null}

              {/* WHAT TO BRING / PLANNING / COORDINATION — when present. */}
              {showBring ? (
                <section className="public-issue-detail-section-block">
                  <h2>{local.bringTitle}</h2>
                  <p>{whatToBring}</p>
                </section>
              ) : null}

              {showPlanning ? (
                <section className="public-issue-detail-section-block">
                  <h2>{local.planningTitle}</h2>
                  <p>{planningNotes}</p>
                </section>
              ) : null}

              {showCoordination ? (
                <section className="public-issue-detail-section-block">
                  <h2>{local.coordinationTitle}</h2>
                  <p>
                    <a href={coordinationLink} rel="noreferrer" target="_blank">
                      <LinkOutlined /> {local.coordinationLink}
                    </a>
                  </p>
                </section>
              ) : null}

              <ParticipantsPanel
                {...support.panelProps}
                totalOverride={Number(issue?.attendingCount) || 0}
                progress={null}
                language={language}
              />

              {/* RECAP — COMPLETED only: outcome + attendees + completion photos. */}
              {showRecap ? (
                <section className="public-issue-detail-section-block public-issue-recap-block">
                  <h2>{local.recapTitle}</h2>
                  {completedAt ? (
                    <p className="public-issue-detail-meta">
                      <span>
                        <CalendarOutlined /> {eventContent.detail.completedAt}:{" "}
                        {formatIssueDate(completedAt, language)}
                      </span>
                    </p>
                  ) : null}
                  {Number.isFinite(Number(attendeeCount)) ? (
                    <p className="public-issue-detail-meta">
                      <span>
                        <TeamOutlined /> {local.attendeesLabel}:{" "}
                        {local.attendeesValue.replace(
                          "{n}",
                          localizeDigits(attendeeCount, language)
                        )}
                      </span>
                    </p>
                  ) : null}
                  {resultSummary ? (
                    <>
                      <h3>{eventContent.detail.resultSummary}</h3>
                      <p>{resultSummary}</p>
                    </>
                  ) : null}
                  {eventImageUploads.length > 0 ? (
                    <>
                      <h3>{eventContent.detail.photosTitle}</h3>
                      <IssuePhotoGallery
                        images={eventImageUploads}
                        title={issue.title || coverAlt}
                        content={content}
                      />
                    </>
                  ) : null}
                </section>
              ) : null}

              <IssueLocationCard issue={issue} content={content} language={language} />

              <IssueReactions
                issueId={issue.id}
                language={language}
                heading={language === "np" ? "तपाईंको प्रतिक्रिया" : "Your reaction"}
              />

              <CommentSection targetType="issue" targetId={issue.id} language={language} />
            </div>
          </article>
        ) : null}

        {!loading && !error && !notFound && issue ? (
          <section className="public-issue-related">
            <h2>{content.detail.relatedTitle}</h2>
            {related.length > 0 ? (
              <div className="campaign-card-grid">
                {related.map((relatedIssue) => (
                  <CampaignCard
                    key={relatedIssue.id}
                    campaign={{ kind: "issue", data: relatedIssue }}
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
