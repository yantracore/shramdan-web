"use client";

// Unified campaign feed — ONE call to GET /campaigns?mode=maximum (shipped
// 2026-07-01) instead of the old 5-way split over /issues + /events.
//
// The backend now merges issues + events into a single lifecycle-ordered feed
// (OPEN → DRAFT → SCHEDULED → ACTIVE → COMPLETED), localized, filtered and
// counted server-side. `mode=maximum` returns a card-ready superset (category,
// both-locale titles, event block, supporterCount/attendingCount, myVote).
//
// To keep the /campaigns page's cards (IssueListCard / EventListCard / preview
// panes / CampaignCard) untouched, this hook ADAPTS each maximum-mode item back
// into the exact `{ kind, status, id, data }` shape those cards already read —
// issue-shaped for OPEN, normalized-event-shaped otherwise. So the switch is a
// pure data-layer change; the UI layer sees no difference.
//
// Routing rule (per the API contract): there is no `kind` field — derive it
// from the top-level status. OPEN → issue; every other stage → event.

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { getJson } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import { getListItems, resolveUsableImage } from "@/lib/adminUtils";

// Server-side page pagination (contract switched from cursor → page 2026-07-02):
// fetch a small page, then pull page+1 as the user scrolls — never a big
// up-front slab sliced in memory. mode=maximum is heavier per row
// (descriptions + relations + event block), so the page stays small.
const PAGE_SIZE = 20;

// titles:{ne,en} → the translations[] array localizeIssue expects, so a locale
// toggle re-picks the title with no refetch. description is locale-picked by the
// API; we attach it to both entries (only the title actually toggles per card).
function buildTranslations(titles, description) {
  const tr = [];
  if (titles?.ne) tr.push({ locale: "ne", title: titles.ne, description: description || "" });
  if (titles?.en) tr.push({ locale: "en", title: titles.en, description: description || "" });
  return tr;
}

// OPEN campaign → issue-shaped record (what IssueListCard / IssuePreviewPane /
// IssueVoteButton / CampaignCard's issue branch read).
function toIssueData(item) {
  return {
    id: item.id,
    slug: item.slug,
    status: item.status,
    category: item.category,
    addressText: item.addressText,
    latitude: item.lat,
    longitude: item.lng,
    voteCount: item.supporterCount ?? 0,
    attendingCount: item.attendingCount ?? 0,
    conversionThreshold: item.conversionThreshold ?? 0,
    promotionProgress: item.promotionProgress ?? 0,
    title: item.title,
    description: item.description || "",
    translations: buildTranslations(item.titles, item.description),
    coverImage: item.image || null, // getIssueCoverImageUrl accepts a bare URL
    province: item.province || null,
    district: item.district || null,
    municipality: item.municipality || null,
    ward: item.ward || null,
    reportedById: item.reportedBy?.id ?? null,
    // per-viewer echo (auth only) → drives the vote button's "Supported/…" face
    isVoted: Boolean(item.myVote),
    voterRole: item.myVote?.voterRole ?? null,
    eventRole: item.myVote?.eventRole ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

// Promoted campaign → normalized-event-shaped record (what EventListCard /
// EventPreviewPane / CampaignCard's event branch read). Mirrors eventsApi's
// normalizeEvent output closely enough that the cards render identically.
// (rolesNeeded / live participantCount aren't in the feed — the campaigns LIST
// never showed those anyway; that enrichment only happens on the detail page.)
function toEventData(item) {
  const ev = item.event || {};
  const linkedIssue = {
    slug: item.slug,
    title: item.title,
    translations: buildTranslations(item.titles, item.description),
    addressText: item.addressText,
    latitude: item.lat,
    longitude: item.lng,
    coverImage: item.image || null,
    status: item.status,
    voteCount: item.supporterCount ?? 0,
    attendingCount: item.attendingCount ?? 0
  };
  return {
    id: ev.id || item.id,
    slug: item.slug,
    status: item.status,
    title: item.title,
    addressText: item.addressText,
    category: item.category,
    latitude: item.lat,
    longitude: item.lng,
    scheduledAt: ev.scheduledAt ?? null,
    completedAt: ev.completedAt ?? null,
    durationMinutes: ev.durationMinutes ?? null,
    meetupLatitude: ev.meetupLatitude ?? null,
    meetupLongitude: ev.meetupLongitude ?? null,
    meetupAddress: ev.meetupAddress ?? null,
    resultSummary: ev.resultSummary ?? null,
    attendeeCount: ev.attendeeCount ?? null,
    attendingCount: item.attendingCount ?? 0,
    thumbnailUrl: item.image || null,
    eventLeader: ev.eventLeader ?? null,
    eventLeaderId: ev.eventLeader?.id ?? null,
    issueId: item.id,
    linkedIssue,
    myVote: item.myVote ?? null
  };
}

export function adaptCampaignItem(raw) {
  // Swap dead-host covers for a local demo photo ONCE here, so every consumer
  // (issue cards, event cards, previews) sees a loadable URL. See
  // resolveUsableImage in adminUtils for the backend story.
  const item = { ...raw, image: resolveUsableImage(raw.image, raw.category) };
  const kind = item.status === "OPEN" ? "issue" : "event";
  const data = kind === "issue" ? toIssueData(item) : toEventData(item);
  return { kind, status: item.status, id: data.id, data };
}

// ── Event card enrichment sweep ─────────────────────────────────────────────
// /campaigns markers (even mode=maximum, curated included) carry NO
// participation echo and NO rolePlan — only the myVote field, which a direct
// event join never sets (verified live 2026-07-02; backend embed requested in
// docs/api-requirements/campaigns-feed.md). GET /events items DO carry both:
// `viewerParticipation` (authenticated callers) and the rolePlan targets. So
// until /campaigns grows the same fields we recover them with one bulk sweep
// over the stages whose cards actually render a join CTA (CampaignCard gates
// on DRAFT/SCHEDULED/ACTIVE). rolePlan is what lets a card show "Full" before
// any click (useEventJoin resolves the fills from the roster).
const PARTICIPATION_STAGES = ["DRAFT", "SCHEDULED", "ACTIVE"];

export async function fetchViewerParticipationMap() {
  const responses = await Promise.all(
    PARTICIPATION_STAGES.map((status) =>
      getJson("/events", { params: { status, limit: 100 } }).catch(() => null)
    )
  );
  const map = new Map();
  for (const response of responses) {
    if (!response) continue;
    for (const ev of getListItems(response)) {
      if (!ev?.id) continue;
      map.set(ev.id, {
        viewerParticipation: ev.viewerParticipation ?? null,
        rolePlan: Array.isArray(ev.rolePlan) ? ev.rolePlan : null
      });
    }
  }
  return map;
}

// Merge one enrichment entry under an adapted feed/shelf item's card data.
// Shared by useCampaignFeed and useCuratedCampaigns so both surfaces decorate
// identically. No-op (same reference back) for issues and unswept events.
export function enrichCampaignItem(item, map) {
  if (!map || item.kind !== "event" || !map.has(item.id)) return item;
  const entry = map.get(item.id);
  return {
    ...item,
    data: {
      ...item.data,
      viewerParticipation: entry.viewerParticipation,
      ...(entry.rolePlan ? { rolePlan: entry.rolePlan } : {})
    }
  };
}

// One page. Returns { items, hasNext } — the raw signal the caller pages on.
async function fetchCampaignPage({ status, provinceId, districtId, category, search, sort, order, page }) {
  const response = await getJson("/campaigns", {
    params: {
      mode: "maximum",
      limit: PAGE_SIZE,
      page: page || 1,
      // "all" → no status param (backend returns the lifecycle-ordered merge);
      // a specific stage → that status only.
      ...(status && status !== "all" ? { status } : {}),
      ...(provinceId ? { provinceId } : {}),
      ...(districtId ? { districtId } : {}),
      ...(category ? { category } : {}),
      ...(search ? { search } : {}),
      ...(sort ? { sort, order: order || "desc" } : {})
    }
  });
  const data = response?.data ?? response;
  const items = getListItems(response).map(adaptCampaignItem);
  const hasNext = Boolean(data?.pagination?.hasNext);
  return { items, hasNext };
}

export function useCampaignFeed({ status, language, provinceId, districtId, category, q, sort, order }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true); // first page
  const [loadingMore, setLoadingMore] = useState(false); // subsequent pages
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  // Last page fetched; loadMore requests pageRef + 1. 0 = nothing loaded yet.
  const pageRef = useRef(0);
  const hasNextRef = useRef(false);
  // Bumped on every filter change so a stale in-flight page (fired against the
  // OLD filters) can't append into the NEW list.
  const reqRef = useRef(0);

  // Event card enrichment, fetched once per mount (and again if the signed-in
  // user changes — the participation half is per-viewer). Stored with the
  // viewerId it belongs to, so a logout (or user switch) makes the stale map
  // inert without a state reset. Runs for anonymous viewers too: the rolePlan
  // half is public and drives the pre-click "Full" face.
  const session = useSyncExternalStore(subscribeAuthSession, getAuthSession, () => null);
  const viewerId = session?.user?.id || null;
  const [participation, setParticipation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchViewerParticipationMap().then((map) => {
      if (!cancelled) setParticipation({ viewerId, map });
    });
    return () => {
      cancelled = true;
    };
  }, [viewerId]);

  const baseParams = { status, provinceId, districtId, category, search: q, sort, order };
  // Stable filter signature for the effect/callback deps (baseParams is a fresh
  // object each render). language isn't sent — the API localizes and each card
  // re-localizes from embedded titles — but it stays in the key so a flip repaints.
  const filterKey = JSON.stringify({ ...baseParams, language });

  // First page — refetched from scratch whenever any filter changes.
  useEffect(() => {
    let cancelled = false;
    const myReq = (reqRef.current += 1);
    pageRef.current = 0;
    hasNextRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setItems([]);
    setHasMore(false);
    (async () => {
      try {
        const { items: pageItems, hasNext } = await fetchCampaignPage({ ...baseParams, page: 1 });
        if (cancelled || reqRef.current !== myReq) return;
        setItems(pageItems);
        pageRef.current = 1;
        hasNextRef.current = hasNext;
        setHasMore(hasNext);
      } catch {
        if (cancelled || reqRef.current !== myReq) return;
        setItems([]);
        setError("load_failed");
      } finally {
        if (!cancelled && reqRef.current === myReq) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  // Next page — appends page+1. No-op while a page is in flight, when
  // there's nothing more, or before the first page settled.
  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !pageRef.current || !hasNextRef.current) return;
    const myReq = reqRef.current;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const { items: pageItems, hasNext } = await fetchCampaignPage({
        ...baseParams,
        page: nextPage
      });
      // A filter changed mid-flight → this page belongs to the old list; drop it.
      if (reqRef.current !== myReq) return;
      setItems((prev) => [...prev, ...pageItems]);
      pageRef.current = nextPage;
      hasNextRef.current = hasNext;
      setHasMore(hasNext);
    } catch {
      // Keep what's loaded; the sentinel can retry on the next intersection.
    } finally {
      if (reqRef.current === myReq) setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingMore, filterKey]);

  // Decorate event items with the viewer's participation (committed join chip
  // on first paint) and the rolePlan targets (pre-click "Full") — exactly what
  // the /events list embed gives its own cards. Issue items keep the myVote
  // echo they already carry. Data refs only change once the sweep lands.
  const decoratedItems = useMemo(() => {
    const map =
      participation && participation.viewerId === viewerId ? participation.map : null;
    if (!map || map.size === 0) return items;
    return items.map((it) => enrichCampaignItem(it, map));
  }, [items, participation, viewerId]);

  return { items: decoratedItems, loading, loadingMore, error, hasMore, loadMore };
}
