"use client";

// CampaignCard — the ONE universal campaign thumbnail.
//
// Modelled on the map info-window (`.map-pop` in EventMap.js): a cover hero
// with a status badge overlaid, a date eyebrow, a title link, a location line
// and a "view detail" CTA — just a touch bigger, because this is a standalone
// grid/related card, not a tiny popup. It reuses the `.map-pop-badge--<status>`
// colour system and adds its own `.campaign-card*` chassis.
//
// A "campaign" is one continuum from a reported problem (issue) to a finished
// cleanup (event). This card takes EITHER an issue entry or an event-stage
// entry and renders them identically. The canonical link is always the ISSUE
// slug — `/campaign/{issueSlug}` — so an event entry links through its embedded
// `issue.slug`, keeping every stage of a campaign on one detail page.
//
// ONE status vocabulary: technical keys in code / data-status / CSS; display
// strings only ever via campaignStatusLabel(). Never RESOLVED/समाधान/live/etc.

import Link from "next/link";
import { IssueMapThumb } from "@/components/IssueMapThumb";
import { IssueVoteButton } from "@/components/IssueVoteButton";
import { IssueJoinButton } from "@/components/IssueJoinButton";
import { EventJoinButton } from "@/components/EventJoinButton";
import { getIssueCoverImageUrl, localizeIssue } from "@/lib/adminUtils";
import {
  campaignStatusLabel,
  campaignVisualStatus,
  resolveCampaignStatus
} from "@/lib/campaignStatus";
import { issueActionMode } from "@/lib/issueActions";
import { copy } from "@/lib/siteContent";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
const FALLBACK_POSTER = "/images/event-types/cleanup.jpg";

function toLocalDigits(value, language) {
  const str = String(value ?? "");
  if (language !== "np") return str;
  return str.replace(/\d/g, (d) => NP_DIGITS[Number(d)]);
}

// Inline glyphs (mirroring IssueMap's MapPinGlyph / MapArrowGlyph) so the card
// doesn't pull leaflet into every page that renders it.
function PinGlyph() {
  return (
    <svg className="map-pop-pin-ico" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 4.6 6.1 12.2 6.4 12.5a.8.8 0 0 0 1.2 0C12.9 21.2 19 13.6 19 9a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
      />
    </svg>
  );
}

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h13M12.5 6l6 6-6 6"
      />
    </svg>
  );
}

// Small people glyph shown only on the compact (phone) card, where the avatar
// stack is dropped and the count collapses to "icon + number".
function CountGlyph() {
  return (
    <svg className="campaign-card-count-ico" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-8 1.66-8 5v1h16v-1c0-3.34-4.7-5-8-5z"
      />
    </svg>
  );
}

// Deterministic supporter/participant avatar discs — the SAME treatment as the
// map info-window's SupporterStack (IssueMap.js), inlined here so the card never
// pulls leaflet into every page that renders it. A campaign carries only a count
// (votes or attendees), never real avatars, so these are stable gradient discs
// that read as "a group behind this"; the real number sits in the count text.
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #21a08a, #0e5f4c)",
  "linear-gradient(135deg, #f5a524, #d97706)",
  "linear-gradient(135deg, #2f7ed8, #1d4ed8)",
  "linear-gradient(135deg, #e5679a, #b4318f)",
  "linear-gradient(135deg, #34b27b, #0f766e)"
];

function avatarSeed(value) {
  const str = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function SupporterStack({ seed, count }) {
  const shown = Math.min(3, Number(count) || 0);
  if (shown <= 0) return null;
  const base = avatarSeed(seed);
  return (
    <span className="map-pop-avatars" aria-hidden="true">
      {Array.from({ length: shown }).map((_, i) => (
        <span
          key={i}
          className="map-pop-avatar"
          style={{ backgroundImage: AVATAR_GRADIENTS[(base + i) % AVATAR_GRADIENTS.length] }}
        >
          <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true">
            <path
              fill="rgba(255,255,255,0.92)"
              d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3.3 0-8 1.66-8 5v1h16v-1c0-3.34-4.7-5-8-5z"
            />
          </svg>
        </span>
      ))}
    </span>
  );
}

// Just the "when" — the status word lives in the badge over the image.
function formatDateLabel(iso, language) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    if (language === "np") {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short"
      });
      return toLocalDigits(formatter.format(date), "np");
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric"
    }).format(date);
  } catch {
    return null;
  }
}

function formatDistance(km, language) {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return language === "np" ? "नजिकै" : "Nearby";
  const rounded = km < 10 ? km.toFixed(1) : Math.round(km).toString();
  const num = toLocalDigits(rounded, language);
  return language === "np" ? `${num} किमी टाढा` : `${num} km away`;
}

// Normalise either an issue record or a (normalized) event record into the one
// shape the card renders. Accepts the campaign as `{ kind, data }`, or — for
// convenience at call sites that only have a bare record — a raw record (it is
// treated as an issue unless it carries an embedded `issue`/`issueId`, which
// marks it an event-stage row).
function normalizeCampaign(campaign, language) {
  const wrapped =
    campaign &&
    typeof campaign === "object" &&
    "data" in campaign &&
    "kind" in campaign;
  const kind = wrapped
    ? campaign.kind
    : campaign?.issue || campaign?.issueId
      ? "event"
      : "issue";
  const data = wrapped ? campaign.data : campaign;
  if (!data) return null;

  if (kind === "event") {
    const linkedIssue = data.issue || data.linkedIssue || null;
    const localizedIssue = linkedIssue ? localizeIssue(linkedIssue, language) : null;
    const resolved = resolveCampaignStatus(linkedIssue?.status, data.status);
    const issueSlug = linkedIssue?.slug || data.issueId || data.slug;
    const dateIso =
      data.status === "COMPLETED"
        ? data.completedAt || data.scheduledAt
        : data.scheduledAt;
    const lat = Number(data.latitude ?? data.meetupLatitude ?? linkedIssue?.latitude);
    const lng = Number(data.longitude ?? data.meetupLongitude ?? linkedIssue?.longitude);
    // Once a campaign is an event-stage it's "participants" — the attendee tally.
    const count =
      Number(data.attendeeCount ?? data.attendingCount ?? linkedIssue?.attendingCount) || 0;
    return {
      resolved,
      title: data.title || localizedIssue?.title || linkedIssue?.addressText || "—",
      addressText: data.addressText || linkedIssue?.addressText || "",
      coverUrl: data.thumbnailUrl || getIssueCoverImageUrl(linkedIssue),
      slug: issueSlug,
      dateLabel: formatDateLabel(dateIso, language),
      latitude: lat,
      longitude: lng,
      count,
      countKind: "participants"
    };
  }

  // issue
  const issue = localizeIssue(data, language);
  const resolved = resolveCampaignStatus(issue.status, null);
  const lat = Number(issue.latitude);
  const lng = Number(issue.longitude);
  // Before it's dated (OPEN/DRAFT) the tally is "supporters" (votes); once the
  // issue has gone to an event-stage it's "participants" (people who joined).
  const isPreEvent = resolved === "OPEN" || resolved === "DRAFT";
  const count = isPreEvent
    ? Number(issue.voteCount) || 0
    : Number(issue.attendingCount ?? issue.voteCount) || 0;
  return {
    resolved,
    title: issue.title || issue.addressText || "—",
    addressText: issue.addressText || "",
    coverUrl: getIssueCoverImageUrl(issue),
    slug: issue.slug || issue.id,
    dateLabel: null,
    latitude: lat,
    longitude: lng,
    count,
    countKind: isPreEvent ? "supporters" : "participants"
  };
}

function fallBackPoster(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = FALLBACK_POSTER;
}

export function CampaignCard({ campaign, language = "np", distanceKm = null }) {
  const c = normalizeCampaign(campaign, language);
  if (!c) return null;

  const visual = campaignVisualStatus(c.resolved);
  const statusLabel = campaignStatusLabel(c.resolved, language);
  const distanceLabel = formatDistance(distanceKm, language);
  const href = `/campaign/${c.slug}`;
  const accessibleLabel = c.title || c.addressText || statusLabel;
  // Short, matching the map info-window's own CTA — keeps the footer one line
  // even on a narrow card so the count beside it never truncates.
  const ctaLabel = language === "np" ? "विवरण" : "View";
  const hasCoords = Number.isFinite(c.latitude) && Number.isFinite(c.longitude);
  // Count as number + word. It ALWAYS renders (0 when there are no supporters /
  // participants yet); the compact phone card shows just the icon + number, while
  // desktop shows the full "15 supporters" text.
  const countNum = toLocalDigits(c.count, language);
  const countWord =
    language === "np"
      ? c.countKind === "supporters"
        ? "समर्थक"
        : "सहभागी"
      : c.countKind === "supporters"
        ? Number(c.count) === 1
          ? "supporter"
          : "supporters"
        : Number(c.count) === 1
          ? "participant"
          : "participants";

  // Raw kind + data for the participation CTA (normalizeCampaign keeps only the
  // display fields). Same kind detection as normalizeCampaign.
  const wrapped =
    campaign && typeof campaign === "object" && "data" in campaign && "kind" in campaign;
  const kind = wrapped ? campaign.kind : campaign?.issue || campaign?.issueId ? "event" : "issue";
  const data = wrapped ? campaign.data : campaign;

  // Lazy, compact participation CTA opening the unified modal — issue →
  // support/join, event → join. Rendered only where participation is open; on
  // completed/closed campaigns the footer keeps the "View" link instead.
  const issuesCopy = (copy[language] || copy.np).issues;
  let cta = null;
  if (kind === "issue") {
    const mode = issueActionMode(data?.status);
    if (mode === "support") {
      cta = (
        <IssueVoteButton
          issueId={data.id}
          seed={data}
          content={issuesCopy}
          language={language}
          showCount={false}
          compact
        />
      );
    } else if (mode === "join") {
      cta = <IssueJoinButton issue={data} language={language} compact />;
    }
  } else if (["DRAFT", "SCHEDULED", "ACTIVE"].includes(c.resolved)) {
    cta = (
      <EventJoinButton eventId={data.id} seed={data} status={visual} language={language} compact />
    );
  }

  return (
    // The whole card is one click target. The title link is "stretched" (a
    // ::after overlay spans the card in campaign-card.css) so a click anywhere
    // on the media/body navigates to the detail page — we have no explicit
    // "View detail" button, so the card itself is the affordance. The footer
    // participation buttons sit above the overlay (z-index) AND already
    // stopPropagation, so they open their modal instead of navigating.
    <article className="campaign-card" data-status={visual}>
      <div className="campaign-card-media">
        {c.coverUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            className="campaign-card-img"
            src={c.coverUrl}
            alt=""
            loading="lazy"
            onError={fallBackPoster}
          />
        ) : hasCoords ? (
          <IssueMapThumb latitude={c.latitude} longitude={c.longitude} alt="" />
        ) : (
          /* Representative image always — never an empty placeholder. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="campaign-card-img" src={FALLBACK_POSTER} alt="" loading="lazy" />
        )}
        <span className="campaign-card-scrim" aria-hidden="true" />
        <span className={`map-pop-badge campaign-card-badge map-pop-badge--${visual}`}>
          <span className="map-pop-badge-dot" aria-hidden="true" />
          {statusLabel}
        </span>
        {distanceLabel ? (
          <span className="campaign-card-distance" aria-label={distanceLabel}>
            {distanceLabel}
          </span>
        ) : null}
        {c.dateLabel ? <span className="campaign-card-eyebrow">{c.dateLabel}</span> : null}
      </div>
      <div className="campaign-card-body">
        <Link href={href} className="campaign-card-title" aria-label={accessibleLabel}>
          {c.title}
        </Link>
        {c.addressText ? (
          <p className="campaign-card-loc">
            <PinGlyph />
            <span>{c.addressText}</span>
          </p>
        ) : null}
        <div className="campaign-card-foot">
          {/* The count ALWAYS shows — 0 when there are no supporters/participants
              yet — so no card ever has a blank footer. The avatar stack renders
              only when the count is > 0 (SupporterStack returns null at 0). */}
          <div className="campaign-card-people">
            <SupporterStack seed={c.slug || c.title} count={c.count} />
            <CountGlyph />
            <span className="campaign-card-count">
              <span className="campaign-card-count-num">{countNum}</span>
              <span className="campaign-card-count-word"> {countWord}</span>
            </span>
          </div>
          {cta || (
            <Link href={href} className="campaign-card-cta">
              <span>{ctaLabel}</span>
              <ArrowGlyph />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default CampaignCard;
