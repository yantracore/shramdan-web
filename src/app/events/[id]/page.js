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
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { EventJoinPanel } from "@/components/EventJoinPanel";
import { EventLiveStreamPlayer } from "@/components/EventLiveStreamPlayer";
import { EventRosterPanel } from "@/components/EventRosterPanel";
import IssueMapBlock from "@/components/IssueMapBlock";
import { PrintButton } from "@/components/PrintButton";
import { ShareButton } from "@/components/ShareButton";
import { StickyActionBar } from "@/components/StickyActionBar";
import { TertiaryButton } from "@/components/TertiaryButton";
import { IssuePhotoGallery } from "@/components/IssuePhotoGallery";
import { ContributionIntentPanel } from "@/components/ContributionIntentPanel";
import { IncidentPanel } from "@/components/IncidentPanel";
import { LeaderScheduleEditor } from "@/components/LeaderScheduleEditor";
import { LeaderCompleteEditor } from "@/components/LeaderCompleteEditor";
import { LeaderNominationPanel } from "@/components/LeaderNominationPanel";
import { ReminderCadencePanel } from "@/components/ReminderCadencePanel";
import { SafetyChecklistPanel } from "@/components/SafetyChecklistPanel";
import { CommentSection } from "@/components/comments";
import { SiteShell } from "@/components/SiteShell";
import { usePreferences } from "@/app/providers";
import { getJson } from "@/lib/apiClient";
import { getDemoEventById, injectMockLiveStream } from "@/lib/devMockData";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { copy } from "@/lib/siteContent";
import { useTrackVisit } from "@/lib/useRecentlyViewed";
import {
  EVENT_RISK_COLORS,
  EVENT_STATUS_COLORS,
  formatEnum,
  getResponseData,
  isImageUpload
} from "@/lib/adminUtils";

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

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError("");
    setNotFound(false);

    // Dev mock: demo-* IDs short-circuit the backend so the live-stream
    // UX can be demoed without backend support. See src/lib/devMockData.js.
    if (typeof eventId === "string" && eventId.startsWith("demo-")) {
      const demoEvent = getDemoEventById(eventId);
      if (demoEvent) {
        setEventData(demoEvent);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await getJson(`/events/${eventId}`);
      const data = getResponseData(response, null);
      if (!data) {
        setNotFound(true);
        setEventData(null);
        return;
      }
      // Dev mock: pin a liveStream onto fetched real events so the
      // player block visually appears. No-op in production builds.
      setEventData(injectMockLiveStream(eventId, data));
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
  const linkedIssue = eventData?.issue ?? null;
  const leader = eventData?.eventLeader ?? null;
  const isDemoEvent = typeof eventId === "string" && eventId.startsWith("demo-");
  // Demo events have no real eventLeaderId in the mock payload; we surface
  // leader controls to any authenticated viewer so the leader UX can be
  // demoed end-to-end without backend signup.
  const isLeader = Boolean(
    session?.user?.id &&
      (isDemoEvent ||
        (eventData?.eventLeaderId && session.user.id === eventData.eventLeaderId))
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
  const canShowIncidents =
    eventData?.status === "ACTIVE" ||
    eventData?.status === "PAUSED" ||
    eventData?.status === "COMPLETED" ||
    isLeader;
  const canSeeFullIncidents = isLeader || session?.user?.role === "ADMIN";
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

  const meetupLat = Number(eventData?.meetupLatitude ?? linkedIssue?.latitude);
  const meetupLng = Number(eventData?.meetupLongitude ?? linkedIssue?.longitude);
  const hasCoords = Number.isFinite(meetupLat) && Number.isFinite(meetupLng);
  const meetupAddress = eventData?.meetupAddress || linkedIssue?.addressText || "";
  const mapsLink = buildMapsLink(meetupAddress, meetupLat, meetupLng);

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
            ) : null}

            <div className="public-issue-detail-body event-detail-body">
              <div className="event-detail-main">
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

                {canShowNominations ? (
                  <LeaderNominationPanel
                    event={eventData}
                    language={language}
                    onChanged={handleEventCompleted}
                  />
                ) : null}

                {canShowIncidents ? (
                  <IncidentPanel
                    event={eventData}
                    language={language}
                    canSeeFull={canSeeFullIncidents}
                    onChanged={handleEventCompleted}
                  />
                ) : null}

                <ContributionIntentPanel
                  event={eventData}
                  language={language}
                  onChanged={handleEventCompleted}
                />


                {Array.isArray(eventData.rolesNeeded) && eventData.rolesNeeded.length > 0 ? (
                  <>
                    <EventJoinPanel
                      event={eventData}
                      language={language}
                      onJoined={handleEventCompleted}
                    />
                    <EventRosterPanel
                      rolesNeeded={eventData.rolesNeeded}
                      language={language}
                      eventId={eventData.id}
                    />
                  </>
                ) : null}

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
                  <Link href={`/issues/${linkedIssue.id}`}>
                    <Button icon={<ArrowLeftOutlined />}>{content.detail.backToIssue}</Button>
                  </Link>
                </div>
              ) : null}
              </div>

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
            </div>
          </article>
        ) : null}

        {!loading && !error && !notFound && eventData ? (
          <StickyActionBar
            label={language === "np" ? "जोडिनुहोस्" : "Join this event"}
            href={`/join?event=${encodeURIComponent(eventData.id)}`}
          />
        ) : null}
      </section>
    </SiteShell>
  );
}
