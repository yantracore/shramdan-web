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
import { getIssueCoverImageUrl, localizeIssue } from "@/lib/adminUtils";
import {
  campaignStatusLabel,
  campaignVisualStatus,
  resolveCampaignStatus
} from "@/lib/campaignStatus";

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
    return {
      resolved,
      title: data.title || localizedIssue?.title || linkedIssue?.addressText || "—",
      addressText: data.addressText || linkedIssue?.addressText || "",
      coverUrl: data.thumbnailUrl || getIssueCoverImageUrl(linkedIssue),
      slug: issueSlug,
      dateLabel: formatDateLabel(dateIso, language),
      latitude: lat,
      longitude: lng
    };
  }

  // issue
  const issue = localizeIssue(data, language);
  const resolved = resolveCampaignStatus(issue.status, null);
  const lat = Number(issue.latitude);
  const lng = Number(issue.longitude);
  return {
    resolved,
    title: issue.title || issue.addressText || "—",
    addressText: issue.addressText || "",
    coverUrl: getIssueCoverImageUrl(issue),
    slug: issue.slug || issue.id,
    dateLabel: null,
    latitude: lat,
    longitude: lng
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
  const ctaLabel = language === "np" ? "विवरण" : "View detail";
  const hasCoords = Number.isFinite(c.latitude) && Number.isFinite(c.longitude);

  return (
    <article className="campaign-card" data-status={visual}>
      <Link href={href} className="campaign-card-media" aria-label={accessibleLabel}>
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
      </Link>
      <div className="campaign-card-body">
        <Link href={href} className="campaign-card-title">
          {c.title}
        </Link>
        {c.addressText ? (
          <p className="campaign-card-loc">
            <PinGlyph />
            <span>{c.addressText}</span>
          </p>
        ) : null}
        <div className="campaign-card-foot">
          <Link href={href} className="campaign-card-cta">
            <span>{ctaLabel}</span>
            <ArrowGlyph />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default CampaignCard;
