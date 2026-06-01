// Dev-only mock data so the UI can demo features whose backend
// fields are not yet shipped (Phases 13, 14 live-stream architecture).
//
// Gating: every export here checks process.env.NODE_ENV !== "production".
// In production builds these are inert — they return null / [] so the
// real (eventually-populated) backend data takes over without code
// changes at the call site.

const YT_DEMO_ID = "qviiNFXX_WQ"; // existing dev-series episode

function buildPreviewEmbed(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0`;
}

function buildLivePlayerEmbed(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&modestbranding=1&rel=0`;
}

function ytThumb(videoId) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

const isDev = () =>
  typeof process !== "undefined" && process.env.NODE_ENV !== "production";

// Demo live events for the homepage live-events rail.
// IDs prefixed "demo-live-" so the event detail page can recognize them.
export const DEMO_LIVE_EVENTS = [
  {
    id: "demo-live-1",
    title: "बागमती नदी सरसफाइ",
    addressText: "तीनकुने पुल, ललितपुर",
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 37 * 60_000).toISOString(),
      streamUrl: buildLivePlayerEmbed(YT_DEMO_ID),
      previewEmbedUrl: buildPreviewEmbed(YT_DEMO_ID),
      thumbnailUrl: "/images/event-types/cleanup.jpg",
      viewerCount: 124,
      videoId: YT_DEMO_ID
    }
  },
  {
    id: "demo-live-2",
    title: "स्कुल भित्ता पेन्ट + मर्मत",
    addressText: "श्री जनप्रिय मा.वि., काठमाडौँ",
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
      streamUrl: buildLivePlayerEmbed(YT_DEMO_ID),
      previewEmbedUrl: buildPreviewEmbed(YT_DEMO_ID),
      thumbnailUrl: "/images/event-types/infrastructure.jpg",
      viewerCount: 38,
      videoId: YT_DEMO_ID
    }
  },
  {
    id: "demo-live-3",
    title: "वृक्षारोपण अभियान — सूर्यविनायक",
    addressText: "सूर्यविनायक नगर, भक्तपुर",
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 102 * 60_000).toISOString(),
      streamUrl: buildLivePlayerEmbed(YT_DEMO_ID),
      previewEmbedUrl: buildPreviewEmbed(YT_DEMO_ID),
      thumbnailUrl: "/images/event-types/afforestation.jpg",
      viewerCount: 261,
      videoId: YT_DEMO_ID
    }
  }
];

export function getDemoLiveEvents() {
  if (!isDev()) return [];
  return DEMO_LIVE_EVENTS;
}

// Lookup for the event-detail page so demo-* IDs can resolve to a
// payload without hitting the backend.
export function getDemoEventById(id) {
  if (!isDev()) return null;
  const found = DEMO_LIVE_EVENTS.find((event) => event.id === id);
  if (!found) return null;
  return {
    id: found.id,
    title: found.title,
    status: "ACTIVE",
    meetupAddress: found.addressText,
    meetupLatitude: 27.7172,
    meetupLongitude: 85.3240,
    scheduledAt: found.liveStream.startedAt,
    durationMinutes: 180,
    planningNotes:
      "Demo data while backend liveStream wiring lands. Replace via real /events/{id} response once the backend ships event.liveStream.",
    linkedIssue: null,
    eventLeaderId: null,
    photos: [],
    resultSummary: null,
    liveStream: found.liveStream
  };
}

// Helper for the event-detail page: when in dev mode AND the fetched
// event has no liveStream, optionally pin one on for visual demo. Use
// sparingly — only when explicitly asking for the autoplay demo.
export function injectMockLiveStream(eventId, realEvent) {
  if (!isDev()) return realEvent;
  if (!realEvent) return realEvent;
  if (realEvent.liveStream?.isActive) return realEvent; // real data wins
  // Pin a deterministic mock stream based on the event id so refresh
  // doesn't flap.
  return {
    ...realEvent,
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 15 * 60_000).toISOString(),
      streamUrl: buildLivePlayerEmbed(YT_DEMO_ID),
      previewEmbedUrl: buildPreviewEmbed(YT_DEMO_ID),
      thumbnailUrl: ytThumb(YT_DEMO_ID),
      viewerCount: 42 + (eventId?.length ?? 0) * 3,
      videoId: YT_DEMO_ID,
      isMock: true
    }
  };
}
