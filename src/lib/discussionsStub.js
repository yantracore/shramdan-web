// Discussion + member-profile mock data for Phase 7 v0. The backend
// contracts live in:
//   docs/api-requirements/discussions.md
//   docs/api-requirements/feature-votes.md
//   docs/api-requirements/members.md   (the "Public profile" section)
//
// This file feeds the /discussions list, /discussions/[slug] detail,
// /members/[slug] profile, and the discussion-presence affordance on
// event pages. Once the backend ships, the UI just swaps these readers
// for the real /discussions, /feature-proposals, and /members endpoints.

const NOW = new Date("2026-06-05T10:00:00+05:45");

function hoursAgoIso(h) {
  return new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();
}
function daysAgoIso(d) {
  return hoursAgoIso(d * 24);
}

// ---- Mock members (publicProfile projections) -----------------------

const MOCK_MEMBERS = {
  "muna-gurung": {
    id: "mem-muna-gurung",
    slug: "muna-gurung",
    displayName: "मुना गुरुङ",
    avatarUrl: "/images/demo-events/sankhu-temple.jpg",
    bio: "ललितपुरमा सरसफाइ अभियान आयोजना गर्छु। पुस्तकालय शिक्षक।",
    city: "ललितपुर",
    memberSince: "2025-09-18T07:32:00+05:45",
    publicLanes: ["EVENT_PARTICIPATION"],
    supportedIssueCount: 14,
    participatedEventCount: 6,
    leaderNominationCount: 2,
    discussionsStartedCount: 3,
    featureProposalsCount: 1,
    recentActivity: [
      { kind: "joined-event", when: hoursAgoIso(3), target: { kind: "event", id: "evt-cleaning-around-dharan-market", slug: "cleaning-around-dharan-market", title: "Cleaning Around Dharan Market" } },
      { kind: "supported-issue", when: daysAgoIso(2), target: { kind: "issue", id: "iss-balaju-cleanup", slug: "balaju-cleanup", title: "बालाजु क्षेत्रमा फोहोर थुप्रिएको" } },
      { kind: "opened-discussion", when: daysAgoIso(5), target: { kind: "discussion", id: "disc-trail-marker-standards", slug: "trail-marker-standards", title: "हाइकिङ ट्रेलमा एकरूप मार्कर मानक" } }
    ]
  },
  "ramesh-shrestha": {
    id: "mem-ramesh-shrestha",
    slug: "ramesh-shrestha",
    displayName: "रमेश श्रेष्ठ",
    avatarUrl: "/images/demo-events/nuwakot-darbar.jpg",
    bio: "Frontend developer, backend curiosity. श्रमदान app निर्माणमा योगदान।",
    city: "काठमाडौँ",
    memberSince: "2025-07-04T11:10:00+05:45",
    publicLanes: ["DEVELOPMENT"],
    supportedIssueCount: 9,
    participatedEventCount: 3,
    leaderNominationCount: 0,
    discussionsStartedCount: 5,
    featureProposalsCount: 3,
    recentActivity: [
      { kind: "opened-proposal", when: hoursAgoIso(18), target: { kind: "discussion", id: "disc-feature-darkmode-corner-tinting", slug: "feature-darkmode-corner-tinting", title: "Dark mode को corner chrome अझ stronger blur" } },
      { kind: "supported-issue", when: daysAgoIso(4), target: { kind: "issue", id: "iss-sankhamul-bagmati", slug: "sankhamul-bagmati", title: "साँखमुलमा बागमतीको प्लास्टिक" } }
    ]
  },
  "sita-tamang": {
    id: "mem-sita-tamang",
    slug: "sita-tamang",
    displayName: "सीता तामाङ",
    avatarUrl: "/images/demo-events/manang-trail.jpg",
    bio: "कानुनी सल्लाहकार। स्थानीय शासन र पारदर्शिता क्षेत्र।",
    city: "पोखरा",
    memberSince: "2025-11-12T08:45:00+05:45",
    publicLanes: ["COMPANY_MANAGEMENT"],
    supportedIssueCount: 22,
    participatedEventCount: 1,
    leaderNominationCount: 0,
    discussionsStartedCount: 2,
    featureProposalsCount: 0,
    recentActivity: [
      { kind: "posted-message", when: hoursAgoIso(6), target: { kind: "discussion", id: "disc-feature-darkmode-corner-tinting", slug: "feature-darkmode-corner-tinting", title: "Dark mode को corner chrome अझ stronger blur" } }
    ]
  }
};

// Anonymous-author placeholder. Public profile click-through does NOT
// route to a member page; it stays in place with this label.
export const ANONYMOUS_AUTHOR = Object.freeze({
  anonymous: true,
  displayName: "अज्ञात सदस्य",
  displayNameEn: "Anonymous member",
  avatarUrl: null,
  slug: null
});

// ---- Mock discussion topics ----------------------------------------

const MOCK_TOPICS = [
  {
    id: "disc-feature-darkmode-corner-tinting",
    slug: "feature-darkmode-corner-tinting",
    kind: "FEATURE_PROPOSAL",
    category: "DESIGN",
    title: "Dark mode को corner chrome अझ stronger blur",
    body: "रातको प्रयोगमा corner chips पूरै सेतो जस्तो पोखिएको देखिन्छ। surface alpha अहिले 70% छ; dark mode मा 58% मा झार्ने र blur 22px राख्ने प्रस्ताव।",
    authorMemberId: "mem-ramesh-shrestha",
    authorDisplay: { name: "रमेश श्रेष्ठ", avatarUrl: "/images/demo-events/nuwakot-darbar.jpg", slug: "ramesh-shrestha" },
    anonymous: false,
    linkedEntity: null,
    status: "OPEN",
    messageCount: 7,
    upvoteCount: 18,
    distinctSupporters: 14,
    lastActivityAt: hoursAgoIso(6),
    createdAt: hoursAgoIso(18),
    closedAt: null,
    promotedAt: null,
    proposalStatus: "OPEN",
    promotionEligible: false,
    votesUntilThreshold: 2,
    supportersUntilThreshold: 0,
    graceWindowEndsAt: null,
    promotedAt2: null,
    promotedBy: null,
    promotedRoadmapAnchor: null,
    declineReason: null
  },
  {
    id: "disc-trail-marker-standards",
    slug: "trail-marker-standards",
    kind: "GENERAL",
    category: "COMMUNITY",
    title: "हाइकिङ ट्रेलमा एकरूप मार्कर मानक",
    body: "विभिन्न ट्रेल मर्मत अभियानहरूले फरक रंग र चिह्न प्रयोग गरिरहेका छन्। एकरूपता आवश्यक छ — सायद Department of Tourism का मानक follow गर्ने?",
    authorMemberId: "mem-muna-gurung",
    authorDisplay: { name: "मुना गुरुङ", avatarUrl: "/images/demo-events/sankhu-temple.jpg", slug: "muna-gurung" },
    anonymous: false,
    linkedEntity: { kind: "issue", id: "iss-nagarkot-trekking", slug: "nagarkot-trekking", title: "Nagarkot Trekking Route Cleanup" },
    status: "OPEN",
    messageCount: 12,
    upvoteCount: 21,
    distinctSupporters: 17,
    lastActivityAt: daysAgoIso(1),
    createdAt: daysAgoIso(5)
  },
  {
    id: "disc-feature-issue-vote-undo",
    slug: "feature-issue-vote-undo",
    kind: "FEATURE_PROPOSAL",
    category: "FRONTEND",
    title: "Issue भोट हटाउन सकिने option",
    body: "अहिले एकपटक भोट दिए, withdraw गर्न सकिँदैन। बेलाबेला गलत समर्थन भएकोमा हटाउन चाहिन्छ।",
    authorMemberId: "mem-muna-gurung",
    authorDisplay: { name: "मुना गुरुङ", avatarUrl: "/images/demo-events/sankhu-temple.jpg", slug: "muna-gurung" },
    anonymous: false,
    linkedEntity: null,
    status: "OPEN",
    messageCount: 4,
    upvoteCount: 26,
    distinctSupporters: 19,
    lastActivityAt: hoursAgoIso(14),
    createdAt: daysAgoIso(3),
    proposalStatus: "OPEN",
    promotionEligible: true,
    votesUntilThreshold: 0,
    supportersUntilThreshold: 0,
    graceWindowEndsAt: hoursAgoIso(-30)
  },
  {
    id: "disc-anon-feedback-dropdown-flow",
    slug: "anon-feedback-dropdown-flow",
    kind: "GENERAL",
    category: "FRONTEND",
    title: "सहभागिता form मा role drop-down को क्रम अप्ठ्यारो",
    body: "नयाँ सदस्य भर्ने बेला drop-down मा role list अल्फाबेटिक छैन; प्रयोगकर्तालाई दिक्क बनाउँछ।",
    authorMemberId: null,
    authorDisplay: { anonymous: true },
    anonymous: true,
    linkedEntity: null,
    status: "OPEN",
    messageCount: 2,
    upvoteCount: 6,
    distinctSupporters: 6,
    lastActivityAt: hoursAgoIso(36),
    createdAt: daysAgoIso(2)
  },
  {
    id: "disc-event-thanks-melamchi",
    slug: "event-thanks-melamchi",
    kind: "GENERAL",
    category: "COMMUNITY",
    title: "मेलम्ची नदी किनारको सरसफाइ — सहभागीहरूलाई धन्यवाद",
    body: "११० जना भाइबहिनी, ३ टन फोहोर — विकल्पको शक्ति। म साथमा रहेर सिक्न पाएको प्रत्येक हातलाई धन्यवाद।",
    authorMemberId: "mem-sita-tamang",
    authorDisplay: { name: "सीता तामाङ", avatarUrl: "/images/demo-events/manang-trail.jpg", slug: "sita-tamang" },
    anonymous: false,
    linkedEntity: { kind: "event", id: "evt-melamchi-cleanup-week", slug: "melamchi-cleanup-week", title: "मेलम्ची नदी किनार सरसफाइ" },
    status: "OPEN",
    messageCount: 18,
    upvoteCount: 42,
    distinctSupporters: 31,
    lastActivityAt: hoursAgoIso(2),
    createdAt: daysAgoIso(4)
  },
  {
    id: "disc-promoted-app-darkmode-default",
    slug: "promoted-app-darkmode-default",
    kind: "FEATURE_PROPOSAL",
    category: "PRODUCT",
    title: "Dark mode लाई सिस्टम preference अनुसार default",
    body: "हालका सबै ब्राउजर ले OS-level dark/light preference signal पठाउँछन्। श्रमदान ले त्यो respect गर्नुपर्छ।",
    authorMemberId: "mem-ramesh-shrestha",
    authorDisplay: { name: "रमेश श्रेष्ठ", avatarUrl: "/images/demo-events/nuwakot-darbar.jpg", slug: "ramesh-shrestha" },
    anonymous: false,
    linkedEntity: null,
    status: "PROMOTED",
    messageCount: 24,
    upvoteCount: 38,
    distinctSupporters: 22,
    lastActivityAt: daysAgoIso(7),
    createdAt: daysAgoIso(12),
    proposalStatus: "PROMOTED",
    promotionEligible: false,
    votesUntilThreshold: 0,
    supportersUntilThreshold: 0,
    graceWindowEndsAt: null,
    promotedAt: daysAgoIso(6),
    promotedBy: "SYSTEM",
    promotedRoadmapAnchor: "#discussions-feature-darkmode-default"
  },
  {
    id: "disc-feature-offline-action-queue",
    slug: "feature-offline-action-queue",
    kind: "FEATURE_PROPOSAL",
    category: "BACKEND",
    title: "अफलाइन हुँदा गरेका action पछि अटो-sync",
    body: "फिल्डमा सरसफाइ गर्दा प्रायः इन्टरनेट हुँदैन। समर्थन, उपस्थिति, फोटो जस्ता action लाई device मा queue गरेर नेट आएपछि server सँग sync गर्ने हो भने मैदानमै app प्रयोग गर्न सजिलो हुन्छ।",
    authorMemberId: "mem-ramesh-shrestha",
    authorDisplay: { name: "रमेश श्रेष्ठ", avatarUrl: "/images/demo-events/nuwakot-darbar.jpg", slug: "ramesh-shrestha" },
    anonymous: false,
    linkedEntity: null,
    status: "OPEN",
    messageCount: 9,
    upvoteCount: 15,
    distinctSupporters: 12,
    lastActivityAt: hoursAgoIso(9),
    createdAt: daysAgoIso(2),
    proposalStatus: "OPEN",
    promotionEligible: false,
    votesUntilThreshold: 5,
    supportersUntilThreshold: 0,
    graceWindowEndsAt: null
  },
  {
    id: "disc-notification-delivery-window",
    slug: "notification-delivery-window",
    kind: "GENERAL",
    category: "BACKEND",
    title: "सूचना कति छिटो आउनुपर्छ — SSE कि push?",
    body: "अभियान लाइभ हुँदा वा भोट दहलीज नाघ्दा सूचना तुरुन्तै आउनुपर्छ। अहिलेलाई SSE राम्रो कि web-push? ब्याट्री र विश्वसनीयता दुवै हेरेर छलफल गरौं।",
    authorMemberId: "mem-sita-tamang",
    authorDisplay: { name: "सीता तामाङ", avatarUrl: "/images/demo-events/manang-trail.jpg", slug: "sita-tamang" },
    anonymous: false,
    linkedEntity: null,
    status: "OPEN",
    messageCount: 5,
    upvoteCount: 11,
    distinctSupporters: 9,
    lastActivityAt: hoursAgoIso(20),
    createdAt: daysAgoIso(3)
  }
];

// ---- Mock thread messages (seed replies per topic) -----------------
// Gives the /discussions/[slug] thread a lived-in feel before the
// backend ships GET /discussions/:slug/messages. Newly posted replies
// (demoPostMessage) are appended client-side on top of these.

const AUTHOR_MUNA = { name: "मुना गुरुङ", avatarUrl: "/images/demo-events/sankhu-temple.jpg", slug: "muna-gurung" };
const AUTHOR_RAMESH = { name: "रमेश श्रेष्ठ", avatarUrl: "/images/demo-events/nuwakot-darbar.jpg", slug: "ramesh-shrestha" };
const AUTHOR_SITA = { name: "सीता तामाङ", avatarUrl: "/images/demo-events/manang-trail.jpg", slug: "sita-tamang" };

const MOCK_MESSAGES = {
  "disc-feature-darkmode-corner-tinting": [
    { id: "msg-dm-1", authorDisplay: AUTHOR_SITA, anonymous: false, body: "रातमा प्रयोग गर्दा साँच्चै आँखामा बिझाउँछ। ५८% मा झार्ने प्रस्ताव ठीक लाग्यो।", upvoteCount: 5, createdAt: hoursAgoIso(16) },
    { id: "msg-dm-2", authorDisplay: AUTHOR_MUNA, anonymous: false, body: "blur २२px राख्दा पुराना फोनमा थोरै लाग होला कि? कम-end device मा एकपटक जाँच्नुपर्ला।", upvoteCount: 3, createdAt: hoursAgoIso(12) },
    { id: "msg-dm-3", authorDisplay: AUTHOR_RAMESH, anonymous: false, body: "राम्रो point — `backdrop-filter` लाई `@media (prefers-reduced-transparency)` ले पहिले नै off गर्छ, त्यसैले low-end मा fallback छँदैछ।", upvoteCount: 7, createdAt: hoursAgoIso(6) }
  ],
  "disc-trail-marker-standards": [
    { id: "msg-tm-1", authorDisplay: AUTHOR_RAMESH, anonymous: false, body: "Department of Tourism को मानक follow गर्ने हो भने नक्साको रङ-कोड पनि उतैबाट लिऔं। एकरूपता दुवैतिर चाहिन्छ।", upvoteCount: 9, createdAt: daysAgoIso(4) },
    { id: "msg-tm-2", authorDisplay: AUTHOR_SITA, anonymous: false, body: "स्थानीय समुदायलाई पनि सोध्नुपर्छ — कतिपय ट्रेलमा परम्परागत चिह्न प्रयोग हुन्छन्, ती मेटाउनु हुँदैन।", upvoteCount: 6, createdAt: daysAgoIso(3) },
    { id: "msg-tm-3", authorDisplay: { anonymous: true }, anonymous: true, body: "एउटा साझा PDF guide बनाएर सबै अभियान संयोजकलाई पठाए कसो होला?", upvoteCount: 4, createdAt: daysAgoIso(1) }
  ],
  "disc-event-thanks-melamchi": [
    { id: "msg-mc-1", authorDisplay: AUTHOR_MUNA, anonymous: false, body: "धन्यवाद सीता दिदी! त्यो दिन साँच्चै ऐतिहासिक थियो। अर्को पटक सँगै।", upvoteCount: 12, createdAt: hoursAgoIso(20) },
    { id: "msg-mc-2", authorDisplay: AUTHOR_RAMESH, anonymous: false, body: "३ टन! फोटोहरू कतै राख्न मिल्छ? gallery मा थप्न पाए हुन्थ्यो।", upvoteCount: 8, createdAt: hoursAgoIso(8) },
    { id: "msg-mc-3", authorDisplay: AUTHOR_SITA, anonymous: false, body: "अवश्य — अभियान page मा photos थपिसकेँ। आउने हप्ता report पनि राख्छु।", upvoteCount: 6, createdAt: hoursAgoIso(2) }
  ]
};

// ---- Reader API ----------------------------------------------------

export function listDiscussionMessages(topicSlugOrId) {
  const topic = MOCK_TOPICS.find((r) => r.slug === topicSlugOrId || r.id === topicSlugOrId);
  const key = topic?.id ?? topicSlugOrId;
  const rows = MOCK_MESSAGES[key] ?? [];
  return Promise.resolve({ items: [...rows], nextCursor: null });
}

export function listDiscussionTopics({ kind, linkedEntityKind, linkedEntityId, sort = "recentActivity", limit = 20 } = {}) {
  let rows = [...MOCK_TOPICS];
  if (kind) rows = rows.filter((r) => r.kind === kind);
  if (linkedEntityKind) {
    rows = rows.filter((r) => r.linkedEntity && r.linkedEntity.kind === linkedEntityKind);
  }
  if (linkedEntityId) {
    rows = rows.filter((r) => r.linkedEntity && (r.linkedEntity.id === linkedEntityId || r.linkedEntity.slug === linkedEntityId));
  }
  if (sort === "upvotes") {
    rows.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
  } else if (sort === "nearThreshold") {
    rows.sort((a, b) => (a.votesUntilThreshold ?? 99) - (b.votesUntilThreshold ?? 99));
  } else {
    rows.sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt));
  }
  return Promise.resolve({ items: rows.slice(0, limit), nextCursor: null });
}

export function getDiscussionTopicBySlug(slug) {
  const row = MOCK_TOPICS.find((r) => r.slug === slug || r.id === slug);
  return Promise.resolve(row ?? null);
}

export function listFeatureProposals({ proposalStatus, sort = "upvotes", limit = 20 } = {}) {
  let rows = MOCK_TOPICS.filter((r) => r.kind === "FEATURE_PROPOSAL");
  if (proposalStatus) rows = rows.filter((r) => r.proposalStatus === proposalStatus);
  if (sort === "nearThreshold") {
    rows.sort((a, b) => (a.votesUntilThreshold ?? 99) - (b.votesUntilThreshold ?? 99));
  } else if (sort === "recentActivity") {
    rows.sort((a, b) => Date.parse(b.lastActivityAt) - Date.parse(a.lastActivityAt));
  } else {
    rows.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
  }
  return Promise.resolve({ items: rows.slice(0, limit), nextCursor: null });
}

export function getMemberPublicProfile(slug) {
  const row = MOCK_MEMBERS[slug];
  return Promise.resolve(row ?? null);
}

export function getFeatureProposalThreshold() {
  return Promise.resolve({ upvotes: 20, distinctSupporters: 10, gracePeriodHours: 48 });
}

export function discussionPresenceForEvent(eventSlugOrId) {
  const linked = MOCK_TOPICS.find(
    (r) => r.linkedEntity && (r.linkedEntity.id === eventSlugOrId || r.linkedEntity.slug === eventSlugOrId)
  );
  if (!linked) return Promise.resolve(null);
  return Promise.resolve({
    topicId: linked.id,
    topicSlug: linked.slug,
    activeMessageCount: linked.messageCount,
    lastActivityAt: linked.lastActivityAt
  });
}

// ---- Mutation helpers (demo-mode only) ----------------------------
// These mutate the in-memory MOCK_TOPICS array so that demo interactions
// feel live within the current session. The backend counterparts are
// specified in docs/api-requirements/discussions.md.

export function demoPostTopic({ kind = 'GENERAL', category = 'COMMUNITY', title, body, anonymous = false, linkedEntity = null } = {}) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) + '-' + Math.random().toString(36).slice(2, 6);
  const id = 'disc-' + slug;
  const author = anonymous
    ? { anonymous: true }
    : { name: 'तपाईं', avatarUrl: null, slug: null };
  const newTopic = {
    id,
    slug,
    kind,
    category,
    title,
    body,
    authorMemberId: null,
    authorDisplay: author,
    anonymous,
    linkedEntity,
    status: 'OPEN',
    messageCount: 0,
    upvoteCount: 0,
    distinctSupporters: 0,
    lastActivityAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...(kind === 'FEATURE_PROPOSAL' ? {
      proposalStatus: 'OPEN',
      promotionEligible: false,
      votesUntilThreshold: 20,
      supportersUntilThreshold: 10,
    } : {})
  };
  MOCK_TOPICS.unshift(newTopic);
  return Promise.resolve(newTopic);
}

export function demoPostMessage(topicSlug, { body, anonymous = false } = {}) {
  const topic = MOCK_TOPICS.find((r) => r.slug === topicSlug || r.id === topicSlug);
  if (topic) {
    topic.messageCount = (topic.messageCount || 0) + 1;
    topic.lastActivityAt = new Date().toISOString();
  }
  return Promise.resolve({ id: 'msg-' + Math.random().toString(36).slice(2, 8), body, anonymous });
}

export function demoCastVote(topicSlug) {
  const topic = MOCK_TOPICS.find((r) => r.slug === topicSlug || r.id === topicSlug);
  if (topic) {
    topic.upvoteCount = (topic.upvoteCount || 0) + 1;
    topic.distinctSupporters = (topic.distinctSupporters || 0) + 1;
    if (topic.votesUntilThreshold > 0) topic.votesUntilThreshold--;
    if (topic.supportersUntilThreshold > 0) topic.supportersUntilThreshold--;
  }
  return Promise.resolve({ ok: true });
}

export function demoWithdrawVote(topicSlug) {
  const topic = MOCK_TOPICS.find((r) => r.slug === topicSlug || r.id === topicSlug);
  if (topic) {
    topic.upvoteCount = Math.max(0, (topic.upvoteCount || 0) - 1);
    topic.distinctSupporters = Math.max(0, (topic.distinctSupporters || 0) - 1);
    if (topic.votesUntilThreshold !== undefined) topic.votesUntilThreshold++;
  }
  return Promise.resolve({ ok: true });
}
