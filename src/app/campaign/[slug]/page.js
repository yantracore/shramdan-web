"use client";

// /campaign/[slug] — the ONE unified campaign detail route, rendering the same
// design for every lifecycle status (see CampaignDetailView +
// docs/design/07-campaign-detail-lifecycle-blocks.md).
//
// The canonical id is the ISSUE slug. But the old /events/:slug redirect lands
// an EVENT slug here, and an event slug is NOT an issue slug. So we resolve:
//   1. try GET /issues/{slug}                 → it IS an issue slug, render.
//   2. on 404, try GET /events/{slug}         → it's an event slug; use the
//      linked issue's slug (event.issue.slug) as canonical and render from there.
// While resolving we show the shared skeleton; an unresolvable slug renders the
// view with the issue slug as-is, which surfaces its own not-found state.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "antd";
import { CampaignDetailView } from "@/components/CampaignDetailView";
import { SiteShell } from "@/components/SiteShell";
import { getJson } from "@/lib/apiClient";
import { getResponseData } from "@/lib/adminUtils";

export default function CampaignDetailPage() {
  const params = useParams();
  const rawSlug = params?.slug;

  // The slug we hand to the view. Starts as the route slug; if the route slug
  // turns out to be an EVENT slug, it's swapped for the linked issue slug.
  const [issueSlug, setIssueSlug] = useState(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (!rawSlug) return;
    let cancelled = false;
    setResolving(true);

    (async () => {
      try {
        // Is it an issue slug? (the common case + the canonical id)
        await getJson(`/issues/${rawSlug}`);
        if (!cancelled) setIssueSlug(rawSlug);
      } catch (issueError) {
        if (issueError?.status === 404) {
          // Maybe it's an event slug — resolve to the linked issue slug.
          try {
            const eventResponse = await getJson(`/events/${rawSlug}`);
            const eventData = getResponseData(eventResponse, null);
            const linkedSlug = eventData?.issue?.slug || null;
            if (!cancelled) setIssueSlug(linkedSlug || rawSlug);
          } catch {
            if (!cancelled) setIssueSlug(rawSlug); // surfaces the view's not-found
          }
        } else if (!cancelled) {
          // Non-404 (network/5xx): render with the route slug; the view retries.
          setIssueSlug(rawSlug);
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawSlug]);

  if (resolving || !issueSlug) {
    return (
      <SiteShell>
        <section className="page-section public-issue-detail-section">
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
        </section>
      </SiteShell>
    );
  }

  return <CampaignDetailView slug={issueSlug} />;
}
