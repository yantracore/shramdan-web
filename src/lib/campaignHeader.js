// buildCampaignHeader — one place that turns whatever campaign object a surface
// holds (an issue, a normalized event, or both) into the compact header the
// CampaignParticipationModal renders: cover + title + status + when/where. Pure
// and presentation-only (no fetches, no React). Every participation surface
// calls it so the header never drifts from one entry point to the next.

import { getIssueCoverImageUrl, localizeIssue } from "@/lib/adminUtils";
import {
  campaignStatusLabel,
  campaignVisualStatus,
  resolveCampaignStatus
} from "@/lib/campaignStatus";

export function buildCampaignHeader({ issue = null, event = null, language = "np" } = {}) {
  const localizedIssue = issue ? localizeIssue(issue, language) : null;
  const localizedEventIssue = event?.issue ? localizeIssue(event.issue, language) : null;
  const statusKey = resolveCampaignStatus(issue?.status, event?.status);

  const title =
    localizedIssue?.title ||
    event?.title || // a normalized event seed (eventsApi.normalizeEvent) carries title
    localizedEventIssue?.title ||
    "";

  const coverUrl =
    getIssueCoverImageUrl(issue) ||
    event?.thumbnailUrl || // normalized event seed carries the resolved cover
    getIssueCoverImageUrl(event?.issue) ||
    getIssueCoverImageUrl(event) ||
    null;

  const location =
    issue?.addressText ||
    event?.addressText ||
    event?.meetupAddress ||
    event?.issue?.addressText ||
    null;

  return {
    title,
    coverUrl,
    status: campaignVisualStatus(statusKey),
    statusLabel: campaignStatusLabel(statusKey, language),
    location,
    scheduledAt: event?.scheduledAt || null,
    durationMinutes: Number(event?.durationMinutes) || null
  };
}
