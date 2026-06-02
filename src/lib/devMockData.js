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
    meetupNotes:
      "तीनकुने पुलको दक्षिणी छेउमा भेला हुने। पार्किङ पुल छेउको खाली जग्गामा। पन्जा र मास्क लिएर आउनुहोस् — टीमले अरू सामग्री ल्याउँछ।",
    linkedIssue: {
      id: "demo-issue-bagmati-1",
      title: "बागमती नदी किनार अव्यवस्थित फोहोर",
      description:
        "तीनकुने पुल अघिको ५०० मिटर खण्ड वर्षायाममा फोहोर र प्लास्टिकले भरिएको छ। नदी किनार सङ्ग दैनिक १,२०० भन्दा बढी हिँडुवा यात्रु; स्थानीय व्यवसायहरूले बढ्दो मच्छर र दुर्गन्धको गुनासो गरिरहेका छन्। आज को सरसफाइले प्लास्टिक छुट्याउने, अजैविक संकलन, र दीर्घकालीन निगरानीको आधार बनाउनेछ।",
      category: "cleanup",
      addressText: "तीनकुने पुल, ललितपुर",
      latitude: 27.6749,
      longitude: 85.3491,
      voteCount: 89,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 37 * 60_000).toISOString(),
      streamUrl: buildLivePlayerEmbed(YT_DEMO_ID),
      previewEmbedUrl: buildPreviewEmbed(YT_DEMO_ID),
      thumbnailUrl: "/images/demo-events/bagmati-cleanup.jpg",
      viewerCount: 124,
      videoId: YT_DEMO_ID
    }
  },
  {
    id: "demo-live-2",
    title: "स्कुल भित्ता पेन्ट + मर्मत",
    addressText: "श्री जनप्रिय मा.वि., काठमाडौँ",
    rolesNeeded: DEMO_ROSTER,
    meetupNotes:
      "स्कुलको मुख्य गेटबाट छिर्ने। प्रिन्सिपलको कार्यालयमा हाजिर। पुराना लुगा लगाएर आउनुहोस् — रङ बिग्रिनसक्छ।",
    linkedIssue: {
      id: "demo-issue-school-2",
      title: "श्री जनप्रिय मा.वि. भित्ता पेन्ट र पुस्तकालय मर्मत",
      description:
        "विद्यालयको मुख्य भवनको भित्ता ८ वर्षदेखि पेन्ट नभएको। पुस्तकालयका ३ ओटा झ्याल टुटेका। ४८० विद्यार्थी प्रभावित। SMC ले सामग्री खर्च बेहोर्ने प्रतिबद्धता गरेको — हामी श्रम र समय जुटाउँछौं।",
      category: "infrastructure",
      addressText: "श्री जनप्रिय मा.वि., काठमाडौँ",
      latitude: 27.7037,
      longitude: 85.3346,
      voteCount: 56,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
      streamUrl: buildLivePlayerEmbed(YT_DEMO_ID),
      previewEmbedUrl: buildPreviewEmbed(YT_DEMO_ID),
      thumbnailUrl: "/images/demo-events/school-paint.jpg",
      viewerCount: 38,
      videoId: YT_DEMO_ID
    }
  },
  {
    id: "demo-live-3",
    title: "वृक्षारोपण अभियान — सूर्यविनायक",
    addressText: "सूर्यविनायक नगर, भक्तपुर",
    rolesNeeded: DEMO_ROSTER,
    meetupNotes:
      "सूर्यविनायक मन्दिर परिसरको पश्चिम गेटमा भेला। बिरुवा, चित्रकोलो, पानी, हलुका खाजा सब टीमले ल्याउँछ। आफ्नो पानीको बोतल लिएर आउनुहोस्।",
    linkedIssue: {
      id: "demo-issue-tree-3",
      title: "सूर्यविनायक खाली ढिक्कामा वृक्षारोपण",
      description:
        "सूर्यविनायक मन्दिर पछाडिको खाली ढिक्का (०.८ हेक्टर) पहिरो जोखिममा। नगरपालिकाले निःशुल्क बिरुवा (चिलाउने, उत्तिस, अप्रिकोट) उपलब्ध गराउने भनेको। हाम्रो काम: रोप्ने, सुरक्षा घेरा हाल्ने, ३ महिनासम्म पानी हाल्ने प्रतिबद्धता।",
      category: "afforestation",
      addressText: "सूर्यविनायक नगर, भक्तपुर",
      latitude: 27.6566,
      longitude: 85.4366,
      voteCount: 142,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 102 * 60_000).toISOString(),
      streamUrl: buildLivePlayerEmbed(YT_DEMO_ID),
      previewEmbedUrl: buildPreviewEmbed(YT_DEMO_ID),
      thumbnailUrl: "/images/demo-events/suryabinayak-trees.jpg",
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
    thumbnailUrl: "/images/demo-events/ratnapark-cleanup.jpg",
    scheduledAt: inHours(38),
    durationMinutes: 180,
    meetupLatitude: 27.7044,
    meetupLongitude: 85.3148,
    leaderName: "रोहित कार्की",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "रत्नपार्क मुख्य गेट छेउमा भेला। पन्जा र मास्क टीमले लिएर आउँछ; पानीको बोतल आफ्नै ल्याउनुहोस्।",
    linkedIssue: {
      id: "demo-issue-ratna-1",
      title: "रत्नपार्क परिसर र सडक छेउ फोहोर समस्या",
      description:
        "रत्नपार्क सहर बीचको प्रमुख सार्वजनिक स्थल, तर परिसर र सडक छेउमा पन्ध्र दिनदेखि फोहोर थुप्रिएको। दैनिक १०,०००+ हिँडुवा। नगरले ट्रक उपलब्ध गराउने प्रतिबद्धता गरेको; हाम्रो काम छुट्याउने, ब्याग भर्ने र लोड गर्ने।",
      category: "cleanup",
      addressText: "रत्नपार्क, काठमाडौँ",
      latitude: 27.7044,
      longitude: 85.3148,
      voteCount: 67,
      status: "EVENT_SCHEDULED"
    }
  },
  {
    id: "demo-up-2",
    title: "बागमती पुल छेउ वृक्षारोपण",
    addressText: "त्रिपुरेश्वर पुल, काठमाडौँ",
    category: "afforestation",
    thumbnailUrl: "/images/demo-events/bagmati-tree-line.jpg",
    scheduledAt: inHours(72),
    durationMinutes: 240,
    meetupLatitude: 27.6912,
    meetupLongitude: 85.3128,
    leaderName: "बिनिता थापा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "त्रिपुरेश्वर पुल दक्षिणी छेउमा भेला। २०० बिरुवा रोप्ने लक्ष्य; गाड्ने तरिकाको छोटो प्रशिक्षण ८:३० मा।",
    linkedIssue: {
      id: "demo-issue-tripureshwar-2",
      title: "त्रिपुरेश्वर पुल छेउ नदी किनार सम्भार",
      description:
        "त्रिपुरेश्वर पुलको दुवै छेउमा नदी किनार खुर्किएको — मनसुनमा पहिरो जोखिम। वन कार्यालयले ३०० बिरुवा (बकैनो, रिठ्ठा, अप्रिकोट) निःशुल्क उपलब्ध। हामी रोप्छौँ + ३ महिनासम्म पानी हाल्न लाइन तय गर्छौं।",
      category: "afforestation",
      addressText: "त्रिपुरेश्वर पुल, काठमाडौँ",
      latitude: 27.6912,
      longitude: 85.3128,
      voteCount: 94,
      status: "EVENT_SCHEDULED"
    }
  },
  {
    id: "demo-up-3",
    title: "गोकर्णेश्वर ट्रेल मर्मत",
    addressText: "गोकर्णेश्वर हाइकिङ ट्रेल, काठमाडौँ",
    category: "trail",
    thumbnailUrl: "/images/demo-events/gokarneshwar-trail.jpg",
    scheduledAt: inHours(120),
    durationMinutes: 300,
    meetupLatitude: 27.7521,
    meetupLongitude: 85.3922,
    leaderName: "स्मिता शर्मा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH",
    meetupNotes:
      "गोकर्णेश्वर मन्दिर मुख्य गेट छेउ भेला। हाइकिङ बूट र पानीको बोतल अनिवार्य; टीमले हलुका खाजा र औजार ल्याउँछ। ३ घण्टा हिँड्ने तयारी।",
    linkedIssue: {
      id: "demo-issue-trail-3",
      title: "गोकर्णेश्वर ट्रेल फोहोर, इरोसन, साइन गायब",
      description:
        "गोकर्णेश्वर देखि शिवपुरीसम्मको ४.२ किमी हिकिङ ट्रेलमा ३ मुख्य समस्या — साइन गायब (४ ठाउँ), डाँडामा इरोसन (२ ठाउँ), र पर्यटकले फालेको प्लास्टिक थुप्रिएको। यो दिन साइन फेरि लगाउने, ढुङ्गा मिलाउने, र फोहोर सङ्कलन।",
      category: "trail",
      addressText: "गोकर्णेश्वर ट्रेल, काठमाडौँ",
      latitude: 27.7521,
      longitude: 85.3922,
      voteCount: 71,
      status: "EVENT_SCHEDULED"
    }
  },
  {
    id: "demo-up-4",
    title: "श्री दुर्गा देवी मा.वि. भित्ता पेन्ट",
    addressText: "गौशाला, काठमाडौँ",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/durga-devi-paint.jpg",
    scheduledAt: inHours(196),
    durationMinutes: 360,
    meetupLatitude: 27.7081,
    meetupLongitude: 85.3469,
    leaderName: "गणेश राई",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "स्कुलको मुख्य गेटमा हाजिर। SMC अध्यक्षले स्वागत गर्ने। पुरानो लुगा अनिवार्य; रङ बिग्रिनसक्छ।",
    linkedIssue: {
      id: "demo-issue-school-4",
      title: "श्री दुर्गा देवी मा.वि. ३२० विद्यार्थीको स्कुल मर्मतयोग्य अवस्थामा",
      description:
        "विद्यालय भवनको भित्ता ६ वर्षदेखि पेन्ट नभएको; २ ओटा शौचालयको ढोका टुटेको; पुस्तकालय कक्षमा सिलिङ चुहिने। ३२० विद्यार्थी प्रभावित। SMC ले पेन्ट र निर्माण सामग्री खर्च बेहोर्ने तय। हामी श्रम र समन्वय जुटाउँछौँ।",
      category: "infrastructure",
      addressText: "श्री दुर्गा देवी मा.वि., गौशाला, काठमाडौँ",
      latitude: 27.7081,
      longitude: 85.3469,
      voteCount: 112,
      status: "EVENT_SCHEDULED"
    }
  },
  {
    id: "demo-up-5",
    title: "कमलपोखरी सौन्दर्यीकरण",
    addressText: "कमलपोखरी पैदलमार्ग, काठमाडौँ",
    category: "beautification",
    thumbnailUrl: "/images/demo-events/kamalpokhari-beautify.jpg",
    scheduledAt: inHours(264),
    durationMinutes: 240,
    meetupLatitude: 27.7155,
    meetupLongitude: 85.3260,
    leaderName: "सुनिल मगर",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "कमलपोखरी मन्दिर छेउ भेला। पैदलमार्गको दुई किनारका ८ ठाउँमा भित्ता चित्र। रङ टीमको, ब्रश आफ्नो लगे राम्रो।",
    linkedIssue: {
      id: "demo-issue-kamal-5",
      title: "कमलपोखरी पैदलमार्ग भित्ता र साइनबोर्ड पुराना",
      description:
        "कमलपोखरी ५०० मि. पैदलमार्ग पुरानो र अदृश्य। नगरपालिकाले अनुमति दिएको; ८ भित्ता चित्र र ४ साइनबोर्ड नयाँ बनाउने। स्थानीय कलाकारहरूले डिजाइन तयार पारेका — सहभागीहरूले पेन्ट र चित्रकोलोले रङ हाल्ने।",
      category: "beautification",
      addressText: "कमलपोखरी पैदलमार्ग, काठमाडौँ",
      latitude: 27.7155,
      longitude: 85.3260,
      voteCount: 38,
      status: "EVENT_SCHEDULED"
    }
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
    thumbnailUrl: "/images/demo-events/guheswari-cleanup-done.jpg",
    scheduledAt: daysAgo(14),
    completedAt: daysAgo(14),
    durationMinutes: 240,
    meetupLatitude: 27.7115,
    meetupLongitude: 85.3608,
    leaderName: "कमला अधिकारी",
    participantCount: 47,
    resultSummary:
      "२.८ टन फोहोर हटाइयो; ४७ जना सहभागी; नदी किनारको ३०० मिटर सफा। नगरपालिकाले अनुगमन गर्न प्रतिबद्धता जनायो।",
    meetupNotes:
      "गुह्येश्वरी मन्दिर मुख्य गेट छेउ भेला। पुजारी समितिले स्वागत; जलपानको प्रबन्ध।",
    linkedIssue: {
      id: "demo-issue-guhy-p1",
      title: "गुह्येश्वरी मन्दिर परिसर र नदी किनार फोहोर",
      description:
        "गुह्येश्वरी मन्दिरमा दैनिक १५,०००+ श्रद्धालु आउँछन्; प्रसाद र पूजा सामग्रीको अव्यवस्थित विसर्जनले परिसर र नदी किनार दुवै फोहोर। मन्दिर समिति र नगरको साझेदारीमा यो सरसफाइ अभियान।",
      category: "cleanup",
      addressText: "गुह्येश्वरी, काठमाडौँ",
      latitude: 27.7115,
      longitude: 85.3608,
      voteCount: 73,
      status: "COMPLETED"
    },
    photos: [
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg"
    ],
    beforeAfter: {
      before: "/images/event-types/cleanup.jpg",
      after: "/images/homepage/cleanup-areas/riverbanks.jpg"
    },
    testimonials: [
      {
        name: "कमला अधिकारी",
        role: "संयोजक",
        quote: "मन्दिर परिसर अब सफा छ। पुजारी समितिले धन्यवाद दिए — अर्को महिनाको पूजासम्म यो स्वच्छता टिकाउने प्रतिबद्धता पनि जनाए।"
      },
      {
        name: "रामकृष्ण कोइराला",
        role: "स्थानीय व्यवसायी",
        quote: "९ वर्षदेखि बस्दै आएको ठाउँ, पहिलो पटक हो — एकै दिनमा यति परिवर्तन देख्न पाएको।"
      },
      {
        name: "मञ्जु तामाङ",
        role: "सहभागी",
        quote: "४७ जना मिलेर ३ घण्टामै सकियो। सोचेभन्दा सजिलो, सोचेभन्दा रमाइलो।"
      }
    ]
  },
  {
    id: "demo-past-2",
    title: "शिवपुरी राष्ट्रिय निकुञ्ज वृक्षारोपण",
    addressText: "बुढानीलकण्ठ, काठमाडौँ",
    category: "afforestation",
    thumbnailUrl: "/images/demo-events/shivapuri-done.jpg",
    scheduledAt: daysAgo(28),
    completedAt: daysAgo(28),
    durationMinutes: 360,
    meetupLatitude: 27.7717,
    meetupLongitude: 85.3654,
    leaderName: "हरि श्रेष्ठ",
    participantCount: 62,
    resultSummary:
      "४८० बिरुवा रोपिए — चिलाउने, उत्तिस र अप्रिकोट। ६२ सहभागी; निकुञ्ज प्रशासनको साझेदारीमा।",
    meetupNotes:
      "बुढानीलकण्ठ मुख्य गेटमा भेला; निकुञ्ज प्रशासन गाडीमा भित्र। बिरुवा र औजार त्यहीँ पुर्‍याइने।",
    linkedIssue: {
      id: "demo-issue-shivapuri-p2",
      title: "शिवपुरी निकुञ्ज खाली भूमिमा वृक्षारोपणको आवश्यकता",
      description:
        "शिवपुरी निकुञ्जको दक्षिणी छेउ १.२ हेक्टर खाली; मनसुनमा पहिरो जोखिम। निकुञ्ज प्रशासनले बिरुवा र अनुमति दुवै उपलब्ध गराएको।",
      category: "afforestation",
      addressText: "शिवपुरी निकुञ्ज, बुढानीलकण्ठ",
      latitude: 27.7717,
      longitude: 85.3654,
      voteCount: 118,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/afforestation.jpg", "/images/event-types/afforestation.jpg"],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/empty-lands.jpg",
      after: "/images/event-types/afforestation.jpg"
    },
    testimonials: [
      {
        name: "हरि श्रेष्ठ",
        role: "संयोजक",
        quote: "४८० बिरुवा रोपियो। ५ वर्षपछि फेरि आउँदा यो भिर हराभरा देख्ने आशा छ।"
      },
      {
        name: "पुष्पा मगर",
        role: "सहभागी (परिवारसहित)",
        quote: "बच्चाहरूले नर्सरी पहिलो पटक देखे — आमालाई फेरि देखाउन ल्याउने भनेका छन्।"
      }
    ]
  },
  {
    id: "demo-past-3",
    title: "सिनामंगल फुटपाथ मर्मत",
    addressText: "सिनामंगल चोक, काठमाडौँ",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/sinamangal-walk.jpg",
    scheduledAt: daysAgo(45),
    completedAt: daysAgo(45),
    durationMinutes: 300,
    meetupLatitude: 27.7036,
    meetupLongitude: 85.3527,
    leaderName: "रिता पाण्डे",
    participantCount: 28,
    resultSummary:
      "१८० मिटर फुटपाथ मर्मत; ४ ल्याम्प पोस्ट पुनःस्थापना। २८ सहभागी। नगरबाट निर्माण सामग्री।",
    meetupNotes:
      "सिनामंगल चोकको सडक छेउमा हाजिर; नगरको ट्रकले सिमेन्ट र इँटा ल्याइदिने।",
    linkedIssue: {
      id: "demo-issue-sinamangal-p3",
      title: "सिनामंगल फुटपाथ टुटेको र ल्याम्प पोस्ट ढलेका",
      description:
        "सिनामंगल चोकको पूर्व दिशा १८० मि. फुटपाथ टुटेर हिँडुवा सडकमा झर्ने अवस्था। ४ ओटा सडक बत्ती पोस्ट ढलेका।",
      category: "infrastructure",
      addressText: "सिनामंगल चोक, काठमाडौँ",
      latitude: 27.7036,
      longitude: 85.3527,
      voteCount: 64,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/infrastructure.jpg"],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/roadside.jpg",
      after: "/images/event-types/infrastructure.jpg"
    },
    testimonials: [
      {
        name: "रिता पाण्डे",
        role: "संयोजक",
        quote: "३ वर्षदेखि ढलेका ल्याम्प पोस्ट एकै दिनमा ठीक भयो। साँझ साँझ बत्ती बल्न थाल्यो।"
      },
      {
        name: "दिनेश के.सी.",
        role: "स्थानीय बासिन्दा",
        quote: "हिँडेर अफिस जान सजिलो भयो। फुटपाथमै हिँड्न पाउँदा सडकको हर्न पनि कम सुनिन्छ।"
      }
    ]
  },
  {
    id: "demo-past-4",
    title: "हनुमन्ते खोला किनार सफाइ",
    addressText: "लोकन्थली पुल, भक्तपुर",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/hanumante-cleanup-done.jpg",
    scheduledAt: daysAgo(60),
    completedAt: daysAgo(60),
    durationMinutes: 300,
    meetupLatitude: 27.6766,
    meetupLongitude: 85.3804,
    leaderName: "प्रदीप तामाङ",
    participantCount: 54,
    resultSummary:
      "१.५ किमी खोला किनार सफा; ५४ सहभागी; ४.२ टन प्लास्टिक र अन्य अजैविक फोहोर सङ्कलन।",
    meetupNotes:
      "लोकन्थली पुल पूर्वी छेउ हाजिर। तीन टोलीमा बाँडिने; प्रत्येक टोलीले ५०० मि. लम्बाइ।",
    linkedIssue: {
      id: "demo-issue-hanumante-p4",
      title: "हनुमन्ते खोला किनार वर्षायाममा प्लास्टिकले भरिएको",
      description:
        "हनुमन्ते खोलाको लोकन्थली पुल छेउ १.५ किमी खण्डमा वर्षाले बगाएर ल्याएको फोहोर थुप्रिएको। भक्तपुर नगरले ट्रक र अग्रिम छुट्याउने सहयोग गरेको।",
      category: "cleanup",
      addressText: "लोकन्थली पुल, भक्तपुर",
      latitude: 27.6766,
      longitude: 85.3804,
      voteCount: 96,
      status: "COMPLETED"
    },
    photos: [
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg",
      "/images/event-types/cleanup.jpg"
    ],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/drains.jpg",
      after: "/images/homepage/cleanup-areas/riverbanks.jpg"
    },
    testimonials: [
      {
        name: "प्रदीप तामाङ",
        role: "संयोजक",
        quote: "४.२ टन प्लास्टिक हट्यो। यो खोलाले अब बर्षात स्वतन्त्र बग्न सक्छ — पुलमुनिको जाम पनि कम हुनेछ।"
      },
      {
        name: "सुनिल थापा",
        role: "सहभागी",
        quote: "मेरो आमाले 'भोलि म पनि आउनुपर्थ्यो' भन्नुभयो। अर्को अभियानमा पूरा परिवार आउँछौँ।"
      },
      {
        name: "स्मिता राई",
        role: "भक्तपुर नगर समन्वयक",
        quote: "स्थानीय निकायलाई पनि नमुना दियो — नगरले अब हरेक तीन महिनामा संयुक्त सरसफाइ राख्न मानेको छ।"
      }
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
      meetupLatitude: live.linkedIssue?.latitude ?? 27.7172,
      meetupLongitude: live.linkedIssue?.longitude ?? 85.3240,
      meetupNotes: live.meetupNotes || null,
      scheduledAt: live.liveStream.startedAt,
      durationMinutes: 180,
      planningNotes: null,
      issue: live.linkedIssue || null,
      linkedIssue: live.linkedIssue || null,
      eventLeader: { name: live.linkedIssue ? "टोली नेता" : null },
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
      meetupNotes: upcoming.meetupNotes || null,
      scheduledAt: upcoming.scheduledAt,
      durationMinutes: upcoming.durationMinutes,
      planningNotes: null,
      issue: upcoming.linkedIssue || null,
      linkedIssue: upcoming.linkedIssue || null,
      eventLeader: { name: upcoming.leaderName || null },
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
      meetupNotes: past.meetupNotes || null,
      scheduledAt: past.scheduledAt,
      completedAt: past.completedAt,
      durationMinutes: past.durationMinutes,
      planningNotes: null,
      issue: past.linkedIssue || null,
      linkedIssue: past.linkedIssue || null,
      eventLeader: { name: past.leaderName || null },
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
      testimonials: past.testimonials || [],
      beforeAfter: past.beforeAfter || null,
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

// --- Notifications mock ----------------------------------------------
// Five sample notifications shown in the topbar bell dropdown when the
// real notifications API isn't wired yet. Each carries a stable ISO
// timestamp relative to "now" so the relative-time display animates as
// hours pass. The schema mirrors what we expect the real API to return:
//   { id, kind, title, body, href, isRead, createdAt }
// `kind` drives the per-item icon in NotificationsBell.
function minutesAgo(min) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

const DEMO_NOTIFICATIONS = [
  {
    id: "n1",
    kind: "vote",
    title: { np: "नयाँ समर्थन", en: "New support" },
    body: {
      np: "बागमती किनार समस्यामा थप ३ जनाले समर्थन गरे।",
      en: "3 more people supported the Bagmati riverbank issue."
    },
    href: "/issues",
    isRead: false,
    createdAt: minutesAgo(8)
  },
  {
    id: "n2",
    kind: "schedule",
    title: { np: "नजिकैको अभियान", en: "Nearby campaign" },
    body: {
      np: "रत्नपार्क सरसफाइ अभियान बिहीबार ४ बजे तय भयो।",
      en: "Ratnapark cleanup is scheduled for Thursday 4 PM."
    },
    href: "/events/demo-up-1",
    isRead: false,
    createdAt: minutesAgo(45)
  },
  {
    id: "n3",
    kind: "result",
    title: { np: "अभियान सम्पन्न", en: "Campaign completed" },
    body: {
      np: "गुह्येश्वरी सरसफाइले २.८ टन फोहोर हटायो।",
      en: "Guheshwari cleanup removed 2.8 tonnes of waste."
    },
    href: "/events/demo-past-1",
    isRead: true,
    createdAt: minutesAgo(180)
  },
  {
    id: "n4",
    kind: "live",
    title: { np: "अहिले लाइभ", en: "Live now" },
    body: {
      np: "बागमती नदी सरसफाइ युट्युब लाइभमा प्रसारण भइरहेको छ।",
      en: "Bagmati cleanup is streaming on YouTube Live."
    },
    href: "/events/demo-live-1",
    isRead: true,
    createdAt: minutesAgo(35)
  },
  {
    id: "n5",
    kind: "welcome",
    title: { np: "स्वागत छ", en: "Welcome" },
    body: {
      np: "श्रमदान सदस्यका रूपमा तपाईंको खाता खुल्यो।",
      en: "Your Shramdan member account is ready."
    },
    href: "/me",
    isRead: true,
    createdAt: minutesAgo(60 * 26)
  }
];

export function getDemoNotifications() {
  if (!isDev()) return [];
  return DEMO_NOTIFICATIONS;
}

export function getDemoUnreadCount() {
  if (!isDev()) return 0;
  return DEMO_NOTIFICATIONS.filter((n) => !n.isRead).length;
}

// --- Leaderboard mock ------------------------------------------------
// Three buckets: most-supported issues filed, most cleanup events joined,
// most events organized. Used by /leaderboard. Each entry: name + city +
// metric + an optional badge string. Production swap-ready behind the
// `getDemoLeaderboard()` export.
const DEMO_LEADERBOARD = {
  supporters: [
    { name: "कमला अधिकारी", city: "काठमाडौँ", metric: 38, badge: "🌱" },
    { name: "हरि श्रेष्ठ", city: "बुढानीलकण्ठ", metric: 31, badge: "🌱" },
    { name: "रिता पाण्डे", city: "ललितपुर", metric: 28 },
    { name: "प्रदीप तामाङ", city: "भक्तपुर", metric: 24 },
    { name: "स्मिता शर्मा", city: "काठमाडौँ", metric: 22 },
    { name: "रोहित कार्की", city: "पोखरा", metric: 19 },
    { name: "बिनिता थापा", city: "हेटौँडा", metric: 17 },
    { name: "गणेश राई", city: "धरान", metric: 14 },
    { name: "सुनिल मगर", city: "बुटवल", metric: 12 },
    { name: "मञ्जु तामाङ", city: "विराटनगर", metric: 10 }
  ],
  participants: [
    { name: "हरि श्रेष्ठ", city: "बुढानीलकण्ठ", metric: 12, badge: "🏆" },
    { name: "कमला अधिकारी", city: "काठमाडौँ", metric: 11, badge: "🏆" },
    { name: "प्रदीप तामाङ", city: "भक्तपुर", metric: 9 },
    { name: "गणेश राई", city: "धरान", metric: 8 },
    { name: "रिता पाण्डे", city: "ललितपुर", metric: 7 },
    { name: "स्मिता शर्मा", city: "काठमाडौँ", metric: 7 },
    { name: "बिनिता थापा", city: "हेटौँडा", metric: 6 },
    { name: "अमित गुरुङ", city: "पोखरा", metric: 5 },
    { name: "सुनिल मगर", city: "बुटवल", metric: 5 },
    { name: "रोशन के.सी.", city: "नेपालगन्ज", metric: 4 }
  ],
  organizers: [
    { name: "कमला अधिकारी", city: "काठमाडौँ", metric: 4, badge: "⚡" },
    { name: "रोहित कार्की", city: "पोखरा", metric: 3 },
    { name: "हरि श्रेष्ठ", city: "बुढानीलकण्ठ", metric: 3 },
    { name: "रिता पाण्डे", city: "ललितपुर", metric: 2 },
    { name: "प्रदीप तामाङ", city: "भक्तपुर", metric: 2 },
    { name: "स्मिता शर्मा", city: "काठमाडौँ", metric: 2 },
    { name: "बिनिता थापा", city: "हेटौँडा", metric: 1 },
    { name: "सुनिल मगर", city: "बुटवल", metric: 1 },
    { name: "गणेश राई", city: "धरान", metric: 1 },
    { name: "मञ्जु तामाङ", city: "विराटनगर", metric: 1 }
  ]
};

export function getDemoLeaderboard() {
  if (!isDev()) return { supporters: [], participants: [], organizers: [] };
  return DEMO_LEADERBOARD;
}

// --- Activity ticker mock --------------------------------------------
// Rolling one-liners shown in the homepage hero strip. Each carries
// {actor, action: {np, en}, minutesAgo, href}. We rotate through them
// with a CSS-driven crossfade; the timestamps re-derive on every render
// so the page feels alive.
const DEMO_ACTIVITY_TICKER = [
  {
    actor: "रिता पाण्डे",
    action: {
      np: "रत्नपार्क सरसफाइ अभियानमा सहभागी हुनुभयो।",
      en: "joined Ratnapark cleanup."
    },
    minutesAgo: 4,
    href: "/events/demo-up-1"
  },
  {
    actor: "हरि श्रेष्ठ",
    action: {
      np: "बागमती किनार समस्यामा समर्थन गर्नुभयो।",
      en: "supported the Bagmati riverbank issue."
    },
    minutesAgo: 12,
    href: "/issues"
  },
  {
    actor: "स्मिता शर्मा",
    action: {
      np: "गोकर्णेश्वर ट्रेल मर्मतमा संयोजक भएर जोडिनुभयो।",
      en: "took the organizer role for Gokarneshwar trail."
    },
    minutesAgo: 27,
    href: "/events/demo-up-3"
  },
  {
    actor: "प्रदीप तामाङ",
    action: {
      np: "हनुमन्ते खोला सफाइ अभियानको परिणाम साझा गर्नुभयो।",
      en: "shared the Hanumante cleanup result."
    },
    minutesAgo: 43,
    href: "/events/demo-past-4"
  },
  {
    actor: "रोहित कार्की",
    action: {
      np: "नयाँ ट्रेल मर्मत समस्या रिपोर्ट गर्नुभयो।",
      en: "reported a new trail-repair issue."
    },
    minutesAgo: 58,
    href: "/issues"
  }
];

export function getDemoActivityTicker() {
  if (!isDev()) return [];
  return DEMO_ACTIVITY_TICKER;
}

// --- Issue comments mock --------------------------------------------
// Deterministic per-issue comment thread. We hash the issue id into a
// stable seed so the same issue always shows the same comments — but
// different issues show different sets and counts.
const DEMO_COMMENT_POOL = [
  { name: "कमला अधिकारी", role: "स्थानीय बासिन्दा", text: "यो ठाउँ अब फेरि सफा देख्ने आशा गरेँ। कुनै मद्दत चाहिए मलाई पनि भन्नुहोला।" },
  { name: "हरि श्रेष्ठ", role: "स्वयंसेवक", text: "मेरो टोलले सुक्रबार बेलुका २ घण्टा निकाल्न सक्छ। औजार पनि छ।" },
  { name: "रिता पाण्डे", role: "नगर वार्ड समर्थक", text: "वडा कार्यालयलाई औपचारिक खबर पठाएको छु — फोहोर ट्रकको व्यवस्था हुनेछ।" },
  { name: "स्मिता शर्मा", role: "शिक्षक", text: "विद्यार्थीहरूलाई पनि ल्याउने तरिका सोचौँ — सिकाइको पाठ पनि हुन्छ।" },
  { name: "प्रदीप तामाङ", role: "पुरानो सहभागी", text: "अघिको अभियानमा प्रयोग गरेको रजिस्टर र चेकलिस्ट छन्। चाहिए शेयर गरौँला।" },
  { name: "रोहित कार्की", role: "नक्शा र समन्वय", text: "ड्रोन तस्बिर अघि र पछिको — मसँग छ। प्रमाण कागजमा राख्न सजिलो।" }
];

function hashStringToInt(s) {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function minutesAgoIso(min) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

// --- Public demo issues registry ------------------------------------
// A tiny set of "real-looking" issues whose IDs can be saved/bookmarked
// from the homepage cards or referenced in deep links. getDemoIssueById
// also reaches into the linkedIssue blobs on each demo past/upcoming/live
// event so /me/saved can resolve any id the user has interacted with.
const DEMO_PUBLIC_ISSUES = [
  {
    id: "demo-issue-bagmati-1",
    title: "बागमती नदी किनार अव्यवस्थित फोहोर",
    addressText: "तीनकुने पुल, ललितपुर",
    category: "cleanup",
    status: "EVENT_SCHEDULED",
    voteCount: 73,
    latitude: 27.6749,
    longitude: 85.3491
  },
  {
    id: "demo-issue-lakeside-1",
    title: "लेकसाइड किनारको प्लास्टिक",
    addressText: "Lakeside, Pokhara",
    category: "cleanup",
    status: "OPEN",
    voteCount: 41,
    latitude: 28.213,
    longitude: 83.957
  },
  {
    id: "demo-issue-shivapuri-1",
    title: "शिवपुरी ट्रेल मर्मत आवश्यक",
    addressText: "शिवपुरी निकुञ्ज, बुढानीलकण्ठ",
    category: "trail",
    status: "OPEN",
    voteCount: 58,
    latitude: 27.7717,
    longitude: 85.3654
  }
];

export function getDemoPublicIssues() {
  if (!isDev()) return [];
  return DEMO_PUBLIC_ISSUES;
}

export function getDemoIssueById(id) {
  if (!isDev() || !id) return null;
  const direct = DEMO_PUBLIC_ISSUES.find((i) => i.id === id);
  if (direct) return direct;
  const pools = [DEMO_LIVE_EVENTS, DEMO_UPCOMING_EVENTS, DEMO_PAST_EVENTS];
  for (const pool of pools) {
    for (const event of pool) {
      if (event.linkedIssue?.id === id) return event.linkedIssue;
    }
  }
  return null;
}

// Vote-count history mini-trend (8 data points). Used by the sparkline
// on /issues/[id]. Deterministic from issue id so the curve doesn't
// twitch between renders.
// --- Demo applications mock ------------------------------------------
// Shown on /me/applications as if the user has previously submitted
// contribution applications through /join. Mix of statuses so the UI
// shows the full set of badges.
const DEMO_APPLICATIONS = [
  {
    id: "app-1",
    role: "FRONTEND_DEVELOPER",
    roleLabel: { np: "फ्रन्टएन्ड डेभलपर", en: "Frontend developer" },
    status: "ACCEPTED",
    submittedAt: minutesAgo(60 * 24 * 18),
    decidedAt: minutesAgo(60 * 24 * 14),
    note: { np: "स्वागत। पहिलो assignment इमेलमा पठाइनेछ।", en: "Welcome. First assignment will be emailed." }
  },
  {
    id: "app-2",
    role: "PHOTOGRAPHER",
    roleLabel: { np: "फोटोग्राफर", en: "Photographer" },
    status: "REVIEWING",
    submittedAt: minutesAgo(60 * 24 * 4),
    decidedAt: null,
    note: null
  },
  {
    id: "app-3",
    role: "COMMUNITY_MANAGER",
    roleLabel: { np: "सामुदायिक नेतृत्व", en: "Community manager" },
    status: "SUBMITTED",
    submittedAt: minutesAgo(60 * 6),
    decidedAt: null,
    note: null
  }
];

export function getDemoApplications() {
  if (!isDev()) return [];
  return DEMO_APPLICATIONS;
}

export function getDemoVoteHistory(issueId) {
  if (!isDev()) return [];
  let h = 0;
  const s = String(issueId || "");
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(h);
  const points = [];
  for (let i = 0; i < 8; i += 1) {
    const base = ((abs >> (i % 16)) & 31) + i * 3;
    points.push(Math.max(1, base));
  }
  return points;
}

export function getDemoIssueComments(issueId) {
  if (!isDev()) return [];
  const h = hashStringToInt(issueId);
  const count = 2 + (h % 4); // 2-5 comments per issue
  const start = h % DEMO_COMMENT_POOL.length;
  const comments = [];
  for (let i = 0; i < count; i += 1) {
    const base = DEMO_COMMENT_POOL[(start + i) % DEMO_COMMENT_POOL.length];
    comments.push({
      id: `${issueId}-c${i}`,
      ...base,
      createdAt: minutesAgoIso(15 + i * 90 + (h % 30))
    });
  }
  return comments;
}
