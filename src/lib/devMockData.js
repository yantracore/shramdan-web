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

const isDev = () => process.env.NODE_ENV !== "production";

// Demo participant roster — shared shape that mock events can pin onto
// themselves. Each entry is a role with how many slots are needed,
// how many are filled, and names of the filled members. The component
// EventRosterPanel renders these as chips.
const DEMO_ROSTER = [
  {
    role: "WORKER",
    count: 18,
    filled: 12,
    filledNames: ["राम", "सीता", "हरि", "गोमा", "सुनिल", "अमित", "रिता", "मञ्जु", "सरोज", "बिनिता", "प्रदीप", "रोशन"]
  },
  { role: "PHOTOGRAPHER", count: 2, filled: 1, filledNames: ["गणेश"] },
  { role: "LIVESTREAMER", count: 1, filled: 1, filledNames: ["अमित"] },
  { role: "MEDIC", count: 1, filled: 0, filledNames: [] },
  { role: "SAFETY_LEAD", count: 1, filled: 1, filledNames: ["कमला"] },
  { role: "COORDINATOR", count: 2, filled: 2, filledNames: ["रोहित", "स्मिता"] },
  { role: "LOGISTICS", count: 2, filled: 1, filledNames: ["दिनेश"] }
];

// Demo live events for the homepage live-events rail.
// IDs prefixed "demo-live-" so the event detail page can recognize them.
export const DEMO_LIVE_EVENTS = [
  {
    id: "demo-live-1",
    title: "बागमती नदी सरसफाइ",
    addressText: "तीनकुने पुल, ललितपुर",
    rolesNeeded: DEMO_ROSTER,
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
    rolesNeeded: DEMO_ROSTER,
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
    rolesNeeded: DEMO_ROSTER,
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

// --- Upcoming demo events (SCHEDULED) -------------------------------
// scheduledAt in the future. No live stream yet. Photos empty (events
// haven't happened). Each has rolesNeeded so the detail page roster
// panel lights up.
const inHours = (h) => new Date(Date.now() + h * 60 * 60_000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60_000).toISOString();

export const DEMO_UPCOMING_EVENTS = [
  {
    id: "demo-up-1",
    title: "रत्नपार्क सरसफाइ अभियान",
    addressText: "रत्नपार्क मुख्य गेट, काठमाडौँ",
    category: "cleanup",
    thumbnailUrl: "/images/event-types/cleanup.jpg",
    scheduledAt: inHours(38),
    durationMinutes: 180,
    meetupLatitude: 27.7044,
    meetupLongitude: 85.3148,
    leaderName: "रोहित कार्की",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL"
  },
  {
    id: "demo-up-2",
    title: "बागमती पुल छेउ वृक्षारोपण",
    addressText: "त्रिपुरेश्वर पुल, काठमाडौँ",
    category: "afforestation",
    thumbnailUrl: "/images/event-types/afforestation.jpg",
    scheduledAt: inHours(72),
    durationMinutes: 240,
    meetupLatitude: 27.6912,
    meetupLongitude: 85.3128,
    leaderName: "बिनिता थापा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL"
  },
  {
    id: "demo-up-3",
    title: "गोकर्णेश्वर ट्रेल मर्मत",
    addressText: "गोकर्णेश्वर हाइकिङ ट्रेल, काठमाडौँ",
    category: "trail",
    thumbnailUrl: "/images/event-types/trail.jpg",
    scheduledAt: inHours(120),
    durationMinutes: 300,
    meetupLatitude: 27.7521,
    meetupLongitude: 85.3922,
    leaderName: "स्मिता शर्मा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH"
  },
  {
    id: "demo-up-4",
    title: "श्री दुर्गा देवी मा.वि. भित्ता पेन्ट",
    addressText: "गौशाला, काठमाडौँ",
    category: "infrastructure",
    thumbnailUrl: "/images/event-types/infrastructure.jpg",
    scheduledAt: inHours(196),
    durationMinutes: 360,
    meetupLatitude: 27.7081,
    meetupLongitude: 85.3469,
    leaderName: "गणेश राई",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL"
  },
  {
    id: "demo-up-5",
    title: "कमलपोखरी सौन्दर्यीकरण",
    addressText: "कमलपोखरी पैदलमार्ग, काठमाडौँ",
    category: "beautification",
    thumbnailUrl: "/images/event-types/beautification.jpg",
    scheduledAt: inHours(264),
    durationMinutes: 240,
    meetupLatitude: 27.7155,
    meetupLongitude: 85.3260,
    leaderName: "सुनिल मगर",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL"
  }
];

export function getDemoUpcomingEvents() {
  if (!isDev()) return [];
  return DEMO_UPCOMING_EVENTS;
}

// --- Past demo events (COMPLETED) -----------------------------------
// Have completedAt, resultSummary, participantCount, photos (using
// event-type illustrations as placeholders for now).
export const DEMO_PAST_EVENTS = [
  {
    id: "demo-past-1",
    title: "गुह्येश्वरी मन्दिर परिसर सरसफाइ",
    addressText: "गुह्येश्वरी, काठमाडौँ",
    category: "cleanup",
    thumbnailUrl: "/images/event-types/cleanup.jpg",
    scheduledAt: daysAgo(14),
    completedAt: daysAgo(14),
    durationMinutes: 240,
    meetupLatitude: 27.7115,
    meetupLongitude: 85.3608,
    leaderName: "कमला अधिकारी",
    participantCount: 47,
    resultSummary:
      "२.८ टन फोहोर हटाइयो; ४७ जना सहभागी; नदी किनारको ३०० मिटर सफा। नगरपालिकाले अनुगमन गर्न प्रतिबद्धता जनायो।",
    photos: [
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg"
    ]
  },
  {
    id: "demo-past-2",
    title: "शिवपुरी राष्ट्रिय निकुञ्ज वृक्षारोपण",
    addressText: "बुढानीलकण्ठ, काठमाडौँ",
    category: "afforestation",
    thumbnailUrl: "/images/event-types/afforestation.jpg",
    scheduledAt: daysAgo(28),
    completedAt: daysAgo(28),
    durationMinutes: 360,
    meetupLatitude: 27.7717,
    meetupLongitude: 85.3654,
    leaderName: "हरि श्रेष्ठ",
    participantCount: 62,
    resultSummary:
      "४८० बिरुवा रोपिए — चिलाउने, उत्तिस र अप्रिकोट। ६२ सहभागी; निकुञ्ज प्रशासनको साझेदारीमा।",
    photos: ["/images/event-types/afforestation.jpg", "/images/event-types/afforestation.jpg"]
  },
  {
    id: "demo-past-3",
    title: "सिनामंगल फुटपाथ मर्मत",
    addressText: "सिनामंगल चोक, काठमाडौँ",
    category: "infrastructure",
    thumbnailUrl: "/images/event-types/infrastructure.jpg",
    scheduledAt: daysAgo(45),
    completedAt: daysAgo(45),
    durationMinutes: 300,
    meetupLatitude: 27.7036,
    meetupLongitude: 85.3527,
    leaderName: "रिता पाण्डे",
    participantCount: 28,
    resultSummary:
      "१८० मिटर फुटपाथ मर्मत; ४ ल्याम्प पोस्ट पुनःस्थापना। २८ सहभागी। नगरबाट निर्माण सामग्री।",
    photos: ["/images/event-types/infrastructure.jpg"]
  },
  {
    id: "demo-past-4",
    title: "हनुमन्ते खोला किनार सफाइ",
    addressText: "लोकन्थली पुल, भक्तपुर",
    category: "cleanup",
    thumbnailUrl: "/images/event-types/cleanup.jpg",
    scheduledAt: daysAgo(60),
    completedAt: daysAgo(60),
    durationMinutes: 300,
    meetupLatitude: 27.6766,
    meetupLongitude: 85.3804,
    leaderName: "प्रदीप तामाङ",
    participantCount: 54,
    resultSummary:
      "१.५ किमी खोला किनार सफा; ५४ सहभागी; ४.२ टन प्लास्टिक र अन्य अजैविक फोहोर सङ्कलन।",
    photos: [
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg"
    ]
  }
];

export function getDemoPastEvents() {
  if (!isDev()) return [];
  return DEMO_PAST_EVENTS;
}

export function getDemoAllEvents() {
  if (!isDev()) return { live: [], upcoming: [], past: [] };
  return {
    live: DEMO_LIVE_EVENTS,
    upcoming: DEMO_UPCOMING_EVENTS,
    past: DEMO_PAST_EVENTS
  };
}

// Lookup for the event-detail page so demo-* IDs can resolve to a
// payload without hitting the backend. Handles live, upcoming, and
// past demo events.
export function getDemoEventById(id) {
  if (!isDev()) return null;

  const live = DEMO_LIVE_EVENTS.find((event) => event.id === id);
  if (live) {
    return {
      id: live.id,
      title: live.title,
      status: "ACTIVE",
      meetupAddress: live.addressText,
      meetupLatitude: 27.7172,
      meetupLongitude: 85.3240,
      scheduledAt: live.liveStream.startedAt,
      durationMinutes: 180,
      planningNotes:
        "Demo live event. Backend liveStream wiring not yet shipped; this payload comes from src/lib/devMockData.js.",
      linkedIssue: null,
      eventLeaderId: null,
      uploads: [],
      photos: [],
      resultSummary: null,
      liveStream: live.liveStream,
      rolesNeeded: live.rolesNeeded
    };
  }

  const upcoming = DEMO_UPCOMING_EVENTS.find((event) => event.id === id);
  if (upcoming) {
    return {
      id: upcoming.id,
      title: upcoming.title,
      status: "SCHEDULED",
      meetupAddress: upcoming.addressText,
      meetupLatitude: upcoming.meetupLatitude,
      meetupLongitude: upcoming.meetupLongitude,
      scheduledAt: upcoming.scheduledAt,
      durationMinutes: upcoming.durationMinutes,
      planningNotes: `Demo upcoming event. Leader: ${upcoming.leaderName || "TBD"}.`,
      linkedIssue: null,
      eventLeaderId: null,
      uploads: [],
      photos: [],
      resultSummary: null,
      riskLevel: upcoming.riskLevel,
      rolesNeeded: upcoming.rolesNeeded
    };
  }

  const past = DEMO_PAST_EVENTS.find((event) => event.id === id);
  if (past) {
    return {
      id: past.id,
      title: past.title,
      status: "COMPLETED",
      meetupAddress: past.addressText,
      meetupLatitude: past.meetupLatitude,
      meetupLongitude: past.meetupLongitude,
      scheduledAt: past.scheduledAt,
      completedAt: past.completedAt,
      durationMinutes: past.durationMinutes,
      planningNotes: `Demo past event. Led by ${past.leaderName || "टीम"}.`,
      linkedIssue: null,
      eventLeaderId: null,
      uploads: (past.photos || []).map((url, i) => ({
        id: `${past.id}-photo-${i}`,
        url,
        mimeType: "image/jpeg",
        fileName: `${past.id}-${i}.jpg`
      })),
      photos: past.photos || [],
      resultSummary: past.resultSummary,
      participantCount: past.participantCount,
      rolesNeeded: DEMO_ROSTER
    };
  }

  return null;
}

// Demo issue supporters — short list of names used to populate the
// "who has supported this" chip row on /issues/[id] when the backend
// doesn't yet expose a voters list. Returns a deterministic slice
// based on voteCount so refresh doesn't flap.
const DEMO_SUPPORTER_POOL = [
  "राम", "सीता", "हरि", "गोमा", "सुनिल", "अमित", "रिता", "मञ्जु",
  "सरोज", "बिनिता", "प्रदीप", "रोशन", "कमला", "रोहित", "स्मिता", "दिनेश"
];

export function getDemoSupporters(voteCount) {
  if (!isDev()) return [];
  const count = Number(voteCount) || 0;
  if (count < 1) return [];
  const slice = Math.min(count, DEMO_SUPPORTER_POOL.length);
  return DEMO_SUPPORTER_POOL.slice(0, slice);
}

// Demo stats per event-type for /event-types/[id]. Inert in production.
// 4 stats per type: events held, participants, locations covered, impact unit.
const DEMO_EVENT_TYPE_STATS = {
  cleanup: [
    { value: 24, unit: { np: "अभियान", en: "campaigns" } },
    { value: 540, unit: { np: "सहभागी", en: "participants" } },
    { value: 18, unit: { np: "वडा", en: "wards" } },
    { value: 12, unit: { np: "टन फोहोर", en: "tons of waste" } }
  ],
  afforestation: [
    { value: 8, unit: { np: "अभियान", en: "campaigns" } },
    { value: 220, unit: { np: "सहभागी", en: "participants" } },
    { value: 6, unit: { np: "वडा", en: "wards" } },
    { value: 1200, unit: { np: "बिरुवा रोपिए", en: "trees planted" } }
  ],
  beautification: [
    { value: 3, unit: { np: "अभियान", en: "campaigns" } },
    { value: 80, unit: { np: "सहभागी", en: "participants" } },
    { value: 3, unit: { np: "वडा", en: "wards" } },
    { value: 12, unit: { np: "भित्ता", en: "walls painted" } }
  ],
  trail: [
    { value: 5, unit: { np: "अभियान", en: "campaigns" } },
    { value: 90, unit: { np: "सहभागी", en: "participants" } },
    { value: 4, unit: { np: "ट्रेल", en: "trails" } },
    { value: 18, unit: { np: "किमी मर्मत", en: "km repaired" } }
  ],
  dam: [
    { value: 2, unit: { np: "अभियान", en: "campaigns" } },
    { value: 45, unit: { np: "सहभागी", en: "participants" } },
    { value: 2, unit: { np: "स्थान", en: "sites" } },
    { value: 8, unit: { np: "संरचना", en: "structures" } }
  ],
  infrastructure: [
    { value: 6, unit: { np: "अभियान", en: "campaigns" } },
    { value: 130, unit: { np: "सहभागी", en: "participants" } },
    { value: 5, unit: { np: "विद्यालय", en: "schools" } },
    { value: 11, unit: { np: "सेवा थप", en: "facilities added" } }
  ],
  seasonal: [
    { value: 4, unit: { np: "अभियान", en: "campaigns" } },
    { value: 160, unit: { np: "सहभागी", en: "participants" } },
    { value: 7, unit: { np: "वडा", en: "wards" } },
    { value: 320, unit: { np: "घरधुरीलाई राहत", en: "households served" } }
  ],
  disaster: [
    { value: 3, unit: { np: "अभियान", en: "campaigns" } },
    { value: 95, unit: { np: "सहभागी", en: "participants" } },
    { value: 3, unit: { np: "विपद् क्षेत्र", en: "disaster zones" } },
    { value: 22, unit: { np: "घर पुनर्निर्माण", en: "homes rebuilt" } }
  ]
};

export function getDemoEventTypeStats(eventTypeId) {
  if (!isDev()) return [];
  if (!eventTypeId) return [];
  return DEMO_EVENT_TYPE_STATS[eventTypeId] || [];
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
    },
    rolesNeeded: realEvent.rolesNeeded?.length ? realEvent.rolesNeeded : DEMO_ROSTER
  };
}
