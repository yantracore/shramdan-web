"use client";

// Curated home shelves — ONE call to GET /campaigns/curated (shipped
// 2026-07-02) instead of the old rail plumbing (3× /events for the coverflow +
// a /campaigns page-1 slice bucketed client-side into the discovery strips).
//
// The endpoint returns seven fixed-size, server-sorted shelves of the same
// maximum-mode markers GET /campaigns emits, so every shelf goes through the
// shared adaptCampaignItem and the cards render unchanged:
//
//   nearby             ≤12  distance-ranked around lat/lng (empty w/o coords)
//   ongoing            ≤6   ACTIVE, earliest start first
//   upcoming           ≤6   SCHEDULED, soonest first
//   planning           ≤3   DRAFT, closest kickoff meeting first
//   closestToThreshold ≤8   OPEN, fewest votes left to promotion (`remaining`)
//   newest             ≤4   OPEN, newest, disjoint from closestToThreshold
//   completed          ≤6   COMPLETED, most recent first
//
// Geolocation is two-phase: the first fetch fires immediately WITHOUT coords
// (fast paint; `nearby` comes back empty), and when the caller triggers
// requestLocation() and the user grants it, a refetch with lat/lng fills the
// shelf. Shelves already on screen stay put during that refetch.
//
// `locale` isn't sent — maximum-mode markers embed both-locale titles and the
// cards re-localize client-side, so a language flip never refetches.

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getJson } from "@/lib/apiClient";
import { getAuthSession, subscribeAuthSession } from "@/lib/authSession";
import {
  adaptCampaignItem,
  enrichCampaignItem,
  fetchViewerParticipationMap
} from "@/lib/useCampaignFeed";
import { useGeolocation } from "@/lib/useGeolocation";

const SHELF_KEYS = [
  "nearby",
  "ongoing",
  "upcoming",
  "planning",
  "closestToThreshold",
  "newest",
  "completed"
];

const EMPTY_SHELVES = Object.fromEntries(SHELF_KEYS.map((key) => [key, []]));

// Marker → strip-ready entry. distanceKm (nearby) and remaining
// (closestToThreshold) are shelf-level extras that adaptCampaignItem's card
// data doesn't carry, so they ride on the entry itself.
function adaptShelfItem(raw) {
  return {
    ...adaptCampaignItem(raw),
    distanceKm: Number.isFinite(raw?.distanceKm) ? raw.distanceKm : null,
    remaining: Number.isFinite(raw?.remaining) ? raw.remaining : null
  };
}

export function useCuratedCampaigns() {
  const [shelves, setShelves] = useState(EMPTY_SHELVES);
  const [loading, setLoading] = useState(true); // first fetch only
  const [error, setError] = useState("");
  const { position, request: requestGeo } = useGeolocation();

  const lat = position?.lat ?? null;
  const lng = position?.lng ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getJson("/campaigns/curated", {
          params: {
            mode: "maximum",
            ...(lat != null && lng != null ? { lat, lng } : {})
          }
        });
        if (cancelled) return;
        const data = response?.data ?? {};
        setShelves(
          Object.fromEntries(
            SHELF_KEYS.map((key) => [
              key,
              (Array.isArray(data[key]) ? data[key] : []).map(adaptShelfItem)
            ])
          )
        );
        setError("");
      } catch {
        // Coords refetch failing keeps the coordless shelves on screen; only a
        // failed FIRST fetch leaves the empty shelves + error signal.
        if (!cancelled) setError("load_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  // The geolocation prompt is caller-timed (see useGeolocation's rationale) —
  // HomeDiscoveryRails fires this when the strips scroll into view.
  const requestLocation = useCallback(() => requestGeo(), [requestGeo]);

  // Same event-card gap as /campaigns: curated markers carry myVote but never
  // viewerParticipation or rolePlan (backend embed requested in
  // docs/api-requirements/campaigns-feed.md), so every viewer gets the one
  // bulk /events sweep — committed join chips for the signed-in, rolePlan
  // targets (pre-click "Full") for everyone. Stored with the viewerId it
  // belongs to, so logout makes the stale map inert without a state reset.
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

  const decoratedShelves = useMemo(() => {
    const map =
      participation && participation.viewerId === viewerId ? participation.map : null;
    if (!map || map.size === 0) return shelves;
    return Object.fromEntries(
      SHELF_KEYS.map((key) => [key, shelves[key].map((it) => enrichCampaignItem(it, map))])
    );
  }, [shelves, participation, viewerId]);

  return { shelves: decoratedShelves, loading, error, requestLocation };
}
