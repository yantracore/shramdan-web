"use client";

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  ExportOutlined,
  TeamOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { Button, Empty, Skeleton, Tag } from "antd";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { EventLiveStreamPlayer } from "@/components/EventLiveStreamPlayer";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import IssueMapBlock from "@/components/IssueMapBlock";
import { PrintButton } from "@/components/PrintButton";
import { ShareButton } from "@/components/ShareButton";
import { StickyActionBar } from "@/components/StickyActionBar";
import { TertiaryButton } from "@/components/TertiaryButton";
import { IssuePhotoGallery } from "@/components/IssuePhotoGallery";
import { AttendanceVerifyPanel } from "@/components/AttendanceVerifyPanel";
import { ShareAsContribution } from "@/components/ShareAsContribution";
import { VideoUploadPanel } from "@/components/VideoUploadPanel";
import { LeaderScheduleEditor } from "@/components/LeaderScheduleEditor";
import { LeaderCompleteEditor } from "@/components/LeaderCompleteEditor";
import { LeaderNominationPanel } from "@/components/LeaderNominationPanel";
import { ReminderCadencePanel } from "@/components/ReminderCadencePanel";
import { SafetyChecklistPanel } from "@/components/SafetyChecklistPanel";
import { CommentSection } from "@/components/comments";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getJson } from "@/lib/apiClient";
import { getDemoEventById } from "@/lib/devMockData";
import {
  buildRolesNeeded,
  countActiveParticipants
} from "@/lib/eventParticipants";
import { useEventJoin } from "@/lib/useEventJoin";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";
import { discussionPresenceForEvent } from "@/lib/discussionsStub";
import { useTrackVisit } from "@/lib/useRecentlyViewed";
import {
  EVENT_RISK_COLORS,
  EVENT_STATUS_COLORS,
  formatEnum,
  getResponseData,
  isImageUpload,
  localizeIssue
} from "@/lib/adminUtils";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
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

function formatCompletedAt(value, language) {
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

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id;
  const { language } = usePreferences();
  const t = copy[language];
  const content = t.events;
  const issueContent = t.issues;

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [discussionPresence, setDiscussionPresence] = useState(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const presence = await discussionPresenceForEvent(eventId);
        if (cancelled) return;
        setDiscussionPresence(presence);
      } catch (err) {
        console.error("Failed to load discussion presence:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError("");
    setNotFound(false);

    // Demo events (demo-* ids) have no backend row — resolve them from the
    // local mock so draft/nomination surfaces stay exercisable end-to-end
    // without round-tripping (and 404-ing) the real API.
    if (typeof eventId === "string" && eventId.startsWith("demo-")) {
      const demo = getDemoEventById(eventId);
      setNotFound(!demo);
      setEventData(demo || null);
      setLoading(false);
      return;
    }

    try {
      const response = await getJson(`/events/${eventId}`);
      const data = getResponseData(response, null);
      if (!data) {
        setNotFound(true);
        setEventData(null);
        return;
      }

      // Real-backend events: GET /events/{id} returns `rolePlan` (raw
      // targets only). The roster of joined members lives on the
      // separate /participants resource. We fetch it and compose the
      // `rolesNeeded` aggregation client-side so the shared
      // ParticipantsPanel (and the participant chip row) keeps
      // consuming the same shape. Demo events ship rolesNeeded
      // baked-in so they skip this branch.
      let merged = data;
      if (Array.isArray(data?.rolePlan) && !Array.isArray(data?.rolesNeeded)) {
        try {
          // Participant sub-resources are keyed by the event UUID — the URL
          // param may be a slug, so always use the resolved `data.id` here.
          const rosterResponse = await getJson(
            `/events/${data.id}/participants?limit=200`
          );
          const rosterData = getResponseData(rosterResponse, null);
          const participants = Array.isArray(rosterData?.items)
            ? rosterData.items
            : Array.isArray(rosterData)
              ? rosterData
              : [];
          merged = {
            ...data,
            rolesNeeded: buildRolesNeeded(data.rolePlan, participants),
            participantCount: countActiveParticipants(participants)
          };
        } catch {
          // Soft-fail: surface rolePlan with zero fill so the panel
          // still renders, even if the participants endpoint is
          // momentarily unreachable.
          merged = {
            ...data,
            rolesNeeded: buildRolesNeeded(data.rolePlan, []),
            participantCount: 0
          };
        }
      }

      setEventData(merged);
    } catch (fetchError) {
      if (fetchError?.status === 404) {
        setNotFound(true);
        setEventData(null);
      } else {
        setError(fetchError?.message || content.detail.errorBody);
      }
    } finally {
      setLoading(false);
    }
  }, [eventId, content.detail.errorBody]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvent();
  }, [fetchEvent]);

  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);

  // Single source of truth for participation state: seed with the page's
  // already-resolved eventData so the hook can derive panelProps on first
  // render, then eager-load its own fresh copy (roster + myParticipation).
  const join = useEventJoin(eventId, { seed: eventData, language, eager: true });

  const linkedIssue = eventData?.issue ? localizeIssue(eventData.issue, language) : null;
  const leader = eventData?.eventLeader ?? null;
  const isLeader = Boolean(
    session?.user?.id &&
      eventData?.eventLeaderId &&
      session.user.id === eventData.eventLeaderId
  );
  const canScheduleEvent = isLeader && eventData?.status === "DRAFT";
  const canActivateEvent = isLeader && eventData?.status === "SCHEDULED";
  const canCompleteEvent =
    isLeader &&
    (eventData?.status === "ACTIVE" || eventData?.status === "SCHEDULED");
  const canManageReminders =
    isLeader &&
    (eventData?.status === "SCHEDULED" || eventData?.status === "ACTIVE");
  const canShowNominations =
    eventData?.status === "DRAFT" && !eventData?.eventLeaderId;
  const canUploadVideo =
    eventData?.status === "COMPLETED" &&
    (isLeader || session?.user?.role === "ADMIN");
  const leaderScheduleCopy = content.detail.leaderSchedule;
  const leaderCompleteCopy = content.detail.leaderComplete;

  const handleEventCompleted = useCallback(
    (updatedEvent) => {
      if (updatedEvent && typeof updatedEvent === "object") {
        // Demo events: the editor passes the locally-mutated payload so we
        // can flip UI state without round-tripping the backend.
        setEventData((prev) => ({ ...(prev || {}), ...updatedEvent }));
        return;
      }
      fetchEvent();
    },
    [fetchEvent]
  );

  const uploads = Array.isArray(eventData?.uploads) ? eventData.uploads : [];
  const imageUploads = uploads.filter(isImageUpload);

  const coverImageUrl =
    eventData?.thumbnailUrl ||
    imageUploads[0]?.url ||
    eventData?.liveStream?.thumbnailUrl ||
    null;

  const meetupLat = Number(eventData?.meetupLatitude ?? linkedIssue?.latitude);
  const meetupLng = Number(eventData?.meetupLongitude ?? linkedIssue?.longitude);
  const hasCoords = Number.isFinite(meetupLat) && Number.isFinite(meetupLng);
  const meetupAddress = eventData?.meetupAddress || linkedIssue?.addressText || "";
  const mapsLink = buildMapsLink(meetupAddress, meetupLat, meetupLng);

  const showLeaderControlsZone =
    canScheduleEvent ||
    canCompleteEvent ||
    canActivateEvent ||
    canManageReminders ||
    (eventData?.status === "COMPLETED" && canUploadVideo);

  const hasCampaignArtifacts =
    Boolean(eventData?.completedAt) ||
    Boolean(eventData?.resultSummary) ||
    Boolean(eventData?.beforeAfter?.before && eventData?.beforeAfter?.after) ||
    imageUploads.length > 0 ||
    (Array.isArray(eventData?.testimonials) && eventData.testimonials.length > 0) ||
    eventData?.status === "COMPLETED";

  const leaderZoneEyebrow = language === "np" ? "नेताको नियन्त्रण" : "Leader controls";
  const leaderZoneIntro =
    language === "np"
      ? "तपाईं यो अभियानको नेता हुनुहुन्छ — व्यवस्थापनका कुराहरू यहाँ छन्।"
      : "You're leading this campaign — manage scheduling, safety and follow-up here.";
  const afterZoneEyebrow = language === "np" ? "अभियानपछि" : "After the campaign";
  const afterZoneIntro =
    language === "np"
      ? "अभियानले छोडेका साक्षीहरू — परिणाम, तस्बिर र अनुभव।"
      : "What this campaign left behind — outcome, photos and voices.";

  const pageTitle =
    eventData && (linkedIssue?.title || eventData.meetupAddress || content.detail.defaultTitle);

  useTrackVisit(
    eventData && eventId
      ? {
          href: `/events/${eventId}`,
          title: pageTitle || content.detail.defaultTitle,
          subtitle: eventData.meetupAddress || null
        }
      : null
  );

  return (
    <SiteShell pageTitle={pageTitle || content.detail.defaultTitle}>
      <section className="page-section public-issue-detail-section">
        <div className="public-issue-back-row">
          <TertiaryButton href="/events" icon={<ArrowLeftOutlined />}>
            {content.detail.backToEvents}
          </TertiaryButton>
          <PrintButton language={language} />
        </div>

        {loading ? (
          <article
            aria-live="polite"
            className="content-card public-issue-detail public-issue-detail-skeleton"
            role="status"
          >
            <Skeleton.Button active size="small" style={{ width: 140 }} />
            <Skeleton active paragraph={{ rows: 1, width: ["40%"] }} title={{ width: "70%" }} />
            <Skeleton active paragraph={{ rows: 3 }} />
          </article>
        ) : null}

        {!loading && error ? (
          <div className="public-issues-error" role="alert">
            <h2>{content.detail.errorTitle}</h2>
            <p>{content.detail.errorBody}</p>
            <Button onClick={fetchEvent} type="primary">
              {content.detail.retry}
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
            <Link href="/events">
              <Button type="primary">{content.detail.backToEvents}</Button>
            </Link>
          </Empty>
        ) : null}

        {!loading && !error && !notFound && eventData ? (
          <article className="content-card public-issue-detail event-detail-card">
            {eventData.liveStream?.isActive ? (
              <EventLiveStreamPlayer
                language={language}
                liveStream={eventData.liveStream}
                eventTitle={linkedIssue?.title || eventData.meetupAddress || "श्रमदान"}
                copy={{
                  liveAria: language === "np" ? "लाइभ प्रसारण" : "Live broadcast",
                  liveBadge: language === "np" ? "लाइभ" : "LIVE",
                  durationSuffix: language === "np" ? "देखि लाइभ" : "live",
                  viewersSuffix: language === "np" ? "जना हेर्दैछन्" : "watching"
                }}
              />
            ) : coverImageUrl ? (
              <div className="public-issue-detail-cover">
                <Image
                  alt={pageTitle || content.detail.defaultTitle}
                  height={720}
                  src={coverImageUrl}
                  unoptimized
                  width={1920}
                  sizes="(max-width: 768px) 100vw, 1180px"
                  priority
                />
              </div>
            ) : null}

            <div className="public-issue-detail-body event-detail-body">
              {/* ZONE 1 — ESSENTIALS: what this campaign is, when, where, who's in */}
              <div className="event-detail-main event-detail-main--top">
                <div className="public-issue-detail-topline">
                  <div className="public-issue-detail-topline-tags">
                    <Tag color={EVENT_STATUS_COLORS[eventData.status] || "default"}>
                      {content.statusLabels[eventData.status] || formatEnum(eventData.status)}
                    </Tag>
                    {eventData.riskLevel ? (
                      <Tag color={EVENT_RISK_COLORS[eventData.riskLevel] || "default"}>
                        <WarningOutlined aria-hidden="true" />{" "}
                        {content.riskLabels[eventData.riskLevel] || formatEnum(eventData.riskLevel)}
                      </Tag>
                    ) : null}
                  </div>
                  <ShareButton
                    language={language}
                    title={linkedIssue?.title || eventData.meetupAddress || content.detail.defaultTitle}
                  />
                </div>

                <h1>{linkedIssue?.title || eventData.meetupAddress || content.detail.defaultTitle}</h1>

                <div className="public-issue-detail-meta">
                  <span>
                    <CalendarOutlined />{" "}
                    {eventData.scheduledAt
                      ? `${content.detail.scheduledOn}: ${formatScheduledAt(eventData.scheduledAt, language)}`
                      : content.detail.notScheduled}
                  </span>
                  {eventData.durationMinutes ? (
                    <span>
                      <ClockCircleOutlined /> {content.detail.duration}:{" "}
                      {content.detail.durationMinutes.replace("{n}", eventData.durationMinutes)}
                    </span>
                  ) : null}
                  <span>
                    <TeamOutlined /> {content.detail.leaderLabel}:{" "}
                    {leader?.name || content.detail.leaderUnassigned}
                  </span>
                </div>

                {linkedIssue?.description ? (
                  <section className="public-issue-detail-section-block">
                    <h2>{content.detail.goalTitle}</h2>
                    <p>{linkedIssue.description}</p>
                  </section>
                ) : (
                  <section className="public-issue-detail-section-block">
                    <h2>{content.detail.goalTitle}</h2>
                    <p className="public-issue-detail-muted">{content.detail.goalEmpty}</p>
                  </section>
                )}

                {meetupAddress || eventData.meetupNotes ? (
                  <section className="public-issue-detail-section-block">
                    <h2>{content.detail.meetupTitle}</h2>
                    {meetupAddress ? (
                      <p>
                        <EnvironmentOutlined /> {meetupAddress}
                      </p>
                    ) : null}
                    {eventData.meetupNotes ? <p>{eventData.meetupNotes}</p> : null}
                  </section>
                ) : null}

              </div>

              {/* ASIDE — map: sticky right rail on desktop, inline-after-essentials on mobile */}
              {hasCoords ? (
                <aside className="event-detail-side">
                  <section
                    className="public-issue-location-card event-detail-side-location"
                    id="event-location"
                  >
                    <div className="public-issue-location-header">
                      <h2>{content.detail.locationTitle}</h2>
                      {mapsLink ? (
                        <a
                          className="public-issue-location-open-link"
                          href={mapsLink}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {content.detail.openInMaps} <ExportOutlined />
                        </a>
                      ) : null}
                    </div>
                    <div className="public-issue-location-map">
                      <IssueMapBlock
                        content={issueContent}
                        height={600}
                        interactive
                        issues={[
                          {
                            id: eventData.id,
                            title: linkedIssue?.title || meetupAddress,
                            status: linkedIssue?.status || "EVENT_SCHEDULED",
                            category: linkedIssue?.category,
                            addressText: meetupAddress,
                            latitude: meetupLat,
                            longitude: meetupLng,
                            voteCount: linkedIssue?.voteCount
                          }
                        ]}
                        language={language}
                        showPopup={false}
                        enableFullscreen
                        fullscreenLabel={issueContent?.detail?.fullscreenOpen || "Open fullscreen map"}
                        exitFullscreenLabel={issueContent?.detail?.fullscreenClose || "Close fullscreen map"}
                      />
                    </div>
                  </section>
                </aside>
              ) : null}

              {/* ZONES 2-5 — action / leader / after-the-campaign / discussion */}
              <div className="event-detail-main event-detail-main--rest">
                {/* ZONE 2 — ACTION: how a visitor takes part */}
                {(Array.isArray(eventData.rolesNeeded) && eventData.rolesNeeded.length > 0) ||
                join.panelProps.leaderSlot ? (
                  <ParticipantsPanel
                    {...join.panelProps}
                    language={language}
                  />
                ) : null}

                {eventData.status !== "COMPLETED" && eventData.status !== "CANCELLED" ? (
                  <ShareAsContribution event={eventData} language={language} />
                ) : null}

                {canShowNominations ? (
                  <LeaderNominationPanel
                    event={eventData}
                    language={language}
                    onChanged={handleEventCompleted}
                  />
                ) : null}

                {/* ZONE 3 — LEADER CONTROLS: visible only when the viewer can act */}
                {showLeaderControlsZone ? (
                  <section
                    className="event-detail-zone event-detail-zone--leader"
                    aria-labelledby="event-zone-leader-title"
                  >
                    <header className="event-detail-zone-header">
                      <span className="event-detail-zone-eyebrow">{leaderZoneEyebrow}</span>
                      <h2 id="event-zone-leader-title" className="event-detail-zone-title">
                        {leaderZoneIntro}
                      </h2>
                    </header>

                    {canScheduleEvent ? (
                      <div className="leader-schedule-banner">
                        <div className="leader-schedule-banner-copy">
                          <span className="eyebrow">{leaderScheduleCopy.eyebrow}</span>
                          <p>{leaderScheduleCopy.intro}</p>
                        </div>
                        <LeaderScheduleEditor
                          event={eventData}
                          content={leaderScheduleCopy}
                          onSaved={fetchEvent}
                        />
                      </div>
                    ) : null}

                    {canCompleteEvent ? (
                      <div className="leader-schedule-banner leader-complete-banner">
                        <div className="leader-schedule-banner-copy">
                          <span className="eyebrow">{leaderCompleteCopy.eyebrow}</span>
                          <p>{leaderCompleteCopy.intro}</p>
                        </div>
                        <LeaderCompleteEditor
                          event={eventData}
                          content={leaderCompleteCopy}
                          onSaved={handleEventCompleted}
                        />
                      </div>
                    ) : null}

                    {canActivateEvent ? (
                      <SafetyChecklistPanel
                        event={eventData}
                        language={language}
                        onActivated={handleEventCompleted}
                      />
                    ) : null}

                    {canManageReminders ? (
                      <ReminderCadencePanel
                        event={eventData}
                        language={language}
                        onSaved={handleEventCompleted}
                      />
                    ) : null}

                    {eventData.status === "COMPLETED" && canUploadVideo ? (
                      <AttendanceVerifyPanel
                        event={eventData}
                        language={language}
                        onChanged={handleEventCompleted}
                      />
                    ) : null}
                  </section>
                ) : null}

                {/* ZONE 4 — AFTER THE CAMPAIGN: results, photos, voices */}
                {hasCampaignArtifacts ? (
                  <section
                    className="event-detail-zone event-detail-zone--after"
                    aria-labelledby="event-zone-after-title"
                  >
                    <header className="event-detail-zone-header">
                      <span className="event-detail-zone-eyebrow">{afterZoneEyebrow}</span>
                      <h2 id="event-zone-after-title" className="event-detail-zone-title">
                        {afterZoneIntro}
                      </h2>
                    </header>

                    {eventData.completedAt || eventData.resultSummary ? (
                      <section className="public-issue-detail-section-block">
                        <h2>{content.detail.completedAt}</h2>
                        {eventData.completedAt ? (
                          <p>{formatCompletedAt(eventData.completedAt, language)}</p>
                        ) : null}
                        {eventData.resultSummary ? (
                          <>
                            <h3>{content.detail.resultSummary}</h3>
                            <p>{eventData.resultSummary}</p>
                          </>
                        ) : null}
                      </section>
                    ) : null}

                    {eventData.status === "COMPLETED" ? (
                      <VideoUploadPanel
                        event={eventData}
                        language={language}
                        canUpload={canUploadVideo}
                        onChanged={handleEventCompleted}
                      />
                    ) : null}

                    {eventData.beforeAfter?.before && eventData.beforeAfter?.after ? (
                      <section className="public-issue-detail-section-block before-after-section">
                        <h2>
                          {language === "np" ? "अघि र पछि" : "Before and after"}
                        </h2>
                        <p className="public-issue-detail-muted">
                          {language === "np"
                            ? "थोप्ने बटन तानेर अघि र पछिको दृश्य तुलना गर्नुहोस्।"
                            : "Drag the handle to compare before and after."}
                        </p>
                        <BeforeAfterSlider
                          beforeUrl={eventData.beforeAfter.before}
                          afterUrl={eventData.beforeAfter.after}
                          beforeAlt={language === "np" ? "अघिको दृश्य" : "Before"}
                          afterAlt={language === "np" ? "पछिको दृश्य" : "After"}
                          beforeLabel={language === "np" ? "अघि" : "BEFORE"}
                          afterLabel={language === "np" ? "पछि" : "AFTER"}
                          ariaLabel={
                            language === "np"
                              ? "अघि र पछिको तुलना"
                              : "Before/after comparison"
                          }
                        />
                      </section>
                    ) : null}

                    {imageUploads.length > 0 ? (
                      <section className="public-issue-detail-section-block">
                        <h2>{content.detail.photosTitle}</h2>
                        <IssuePhotoGallery
                          content={issueContent}
                          images={imageUploads}
                          title={linkedIssue?.title || content.detail.defaultTitle}
                        />
                      </section>
                    ) : null}

                    {Array.isArray(eventData.testimonials) && eventData.testimonials.length > 0 ? (
                      <section className="event-testimonials" aria-labelledby="event-testimonials-title">
                        <header className="event-testimonials-header">
                          <h2 id="event-testimonials-title">
                            {language === "np" ? "दिनको आवाज" : "Voices from the day"}
                          </h2>
                          <p>
                            {language === "np"
                              ? "अभियानमा सहभागी भएकाहरूले के भने।"
                              : "What people who showed up said."}
                          </p>
                        </header>
                        <ul className="event-testimonials-list">
                          {eventData.testimonials.map((entry, i) => (
                            <li key={i} className="event-testimonial">
                              <blockquote className="event-testimonial-quote">{entry.quote}</blockquote>
                              <footer className="event-testimonial-attrib">
                                <span className="event-testimonial-name">{entry.name}</span>
                                {entry.role ? (
                                  <span className="event-testimonial-role">{entry.role}</span>
                                ) : null}
                              </footer>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                  </section>
                ) : null}

                {/* ZONE 5 — DISCUSSION & NAVIGATION */}
                {discussionPresence ? (
                  <div className="event-detail-discussion-presence" style={{
                    marginBottom: "16px",
                    padding: "16px",
                    borderRadius: "12px",
                    background: "color-mix(in srgb, var(--surface) 96%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--line) 60%, transparent)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>
                      {language === "np" ? "सम्बन्धित छलफल" : "Related Discussion"}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                      <span>
                        {language === "np"
                          ? `${localizeDigits(discussionPresence.activeMessageCount, language)} मानिसहरू छलफलमा छन्`
                          : `${discussionPresence.activeMessageCount} people discussing`}
                      </span>
                      <span> • </span>
                      <span>
                        {language === "np"
                          ? `अन्तिम सक्रियता: ${new Date(discussionPresence.lastActivityAt).toLocaleDateString("ne-NP")}`
                          : `Last active: ${new Date(discussionPresence.lastActivityAt).toLocaleDateString()}`}
                      </span>
                    </div>
                    <div>
                      <Link href={`/discussions/${discussionPresence.topicSlug}`}>
                        <Button type="link" style={{ padding: 0 }}>
                          {language === "np" ? "मुख्य छलफलमा सामेल हुने" : "Join the main discussion"} &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : null}

                <CommentSection
                  targetType="event"
                  targetId={eventData.id}
                  language={language}
                  mentionPool={(Array.isArray(eventData.rolesNeeded)
                    ? eventData.rolesNeeded.flatMap((r) =>
                        (r.filledNames || []).map((name) => ({
                          id: `roster:${r.role}:${name}`,
                          name,
                          role: r.role
                        }))
                      )
                    : [])}
                />

                {linkedIssue?.id ? (
                  <div className="public-issue-detail-actions-bar">
                    <Link href={`/issues/${linkedIssue.slug ?? linkedIssue.id}`}>
                      <Button icon={<ArrowLeftOutlined />}>{content.detail.backToIssue}</Button>
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ) : null}

        {!loading && !error && !notFound && eventData ? (
          <StickyActionBar
            label={language === "np" ? "जोडिने" : "Join this event"}
            href={`/join?event=${encodeURIComponent(eventData.id)}`}
          />
        ) : null}
      </section>
    </SiteShell>
  );
}
