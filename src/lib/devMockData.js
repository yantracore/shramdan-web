// Dev-only mock data so the UI can demo features whose backend
// fields are not yet shipped (Phases 13, 14 live-stream architecture).
//
// Gating: every export here checks process.env.NODE_ENV !== "production".
// In production builds these are inert — they return null / [] so the
// real (eventually-populated) backend data takes over without code
// changes at the call site.

// Local MP4 footage paired with each live demo event. The
// EventLiveStreamPlayer auto-switches to a native <video> when the URL
// ends in .mp4, so these slugs control what plays on the event detail
// page and in the events-page split-view preview.
function localDemoVideo(slug) {
  return `/images/demo-events/${slug}.mp4`;
}

function localDemoPoster(slug) {
  return `/images/demo-events/${slug}.jpg`;
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
// Each entry is paired with a real MP4 in /public/images/demo-events/
// so EventLiveStreamPlayer can autoplay native footage on the page.
export const DEMO_LIVE_EVENTS = [
  {
    id: "demo-live-1",
    title: "बागमती नदी सरसफाइ",
    addressText: "तीनकुने पुल, ललितपुर",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 26,
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
      streamUrl: localDemoVideo("bagmati-cleanup"),
      previewEmbedUrl: localDemoVideo("bagmati-cleanup"),
      thumbnailUrl: localDemoPoster("bagmati-cleanup"),
      viewerCount: 124,
      videoSlug: "bagmati-cleanup"
    }
  },
  {
    id: "demo-live-2",
    title: "कमलपोखरी सौन्दर्यीकरण",
    addressText: "कमलपोखरी पैदलमार्ग, काठमाडौँ",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 18,
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
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 22 * 60_000).toISOString(),
      streamUrl: localDemoVideo("kamalpokhari-beautify"),
      previewEmbedUrl: localDemoVideo("kamalpokhari-beautify"),
      thumbnailUrl: localDemoPoster("kamalpokhari-beautify"),
      viewerCount: 84,
      videoSlug: "kamalpokhari-beautify"
    }
  },
  {
    id: "demo-live-3",
    title: "वृक्षारोपण अभियान — सूर्यविनायक",
    addressText: "सूर्यविनायक नगर, भक्तपुर",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 41,
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
      streamUrl: localDemoVideo("suryabinayak-trees"),
      previewEmbedUrl: localDemoVideo("suryabinayak-trees"),
      thumbnailUrl: localDemoPoster("suryabinayak-trees"),
      viewerCount: 261,
      videoSlug: "suryabinayak-trees"
    }
  },
  {
    id: "demo-live-4",
    title: "हनुमन्ते खोला किनार सरसफाइ",
    addressText: "लोकन्थली पुल, ललितपुर",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 32,
    meetupNotes:
      "लोकन्थली पुलको पूर्वी किनारमा भेला हुने। तीन टोलीमा बाँडिने; प्रत्येकले ४०० मि. लम्बाइ कभर गर्ने। नगरको ट्रक १० बजेमा आइपुग्छ।",
    linkedIssue: {
      id: "demo-issue-hanumante-l4",
      title: "हनुमन्ते खोला लोकन्थली खण्डमा फोहोर पुनः थुप्रिएको",
      description:
        "अघिल्लो अभियानको ६० दिनमा पुनः फोहोर थुप्रिने क्रम जारी छ — माथिल्लो किनारबाट बगेर आउने प्लास्टिक मुख्य कारण। यो पटक सङ्कलनसँगै किनार किनारका साइनबोर्ड पनि लगाउने।",
      category: "cleanup",
      addressText: "लोकन्थली पुल, ललितपुर",
      latitude: 27.6766,
      longitude: 85.3804,
      voteCount: 78,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 18 * 60_000).toISOString(),
      streamUrl: localDemoVideo("hanumante-live"),
      previewEmbedUrl: localDemoVideo("hanumante-live"),
      thumbnailUrl: localDemoPoster("hanumante-live"),
      viewerCount: 96,
      videoSlug: "hanumante-live"
    },
    imageSlug: "hanumante-live",
    imagePrompt:
      "Hanumante riverbank near Lokanthali bridge with cleanup in progress; consolidated plastic bags lined along the embankment; community members in everyday clothing bending over the bank with brooms and gloves; overcast monsoon sky; the bridge piers visible in the background."
  },
  {
    id: "demo-live-5",
    title: "फेवाताल किनार प्लास्टिक सङ्कलन",
    addressText: "बारही टोल, पोखरा",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 47,
    meetupNotes:
      "बारही टोलको ताल किनार पैदलमार्गमा भेला हुने। डुङ्गा प्रयोग गरेर पानीमा तैरिने प्लास्टिक पनि सङ्कलन; डुङ्गा चालक स्थानीय समितिले उपलब्ध गराउँदै छन्।",
    linkedIssue: {
      id: "demo-issue-fewa-l5",
      title: "फेवातालको दक्षिणी किनार प्लास्टिकले प्रदूषित",
      description:
        "बर्षायाममा माथिल्लो खण्डबाट बगेर आउने प्लास्टिक तालको दक्षिणी छेउमा थुप्रिने। पर्यटन व्यवसायी समिति र वडाको साझेदारी; डुङ्गा र अग्रिम छुट्याउने काम स्थानीयले।",
      category: "cleanup",
      addressText: "फेवाताल, पोखरा",
      latitude: 28.2096,
      longitude: 83.9586,
      voteCount: 156,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 64 * 60_000).toISOString(),
      streamUrl: localDemoVideo("fewa-cleanup"),
      previewEmbedUrl: localDemoVideo("fewa-cleanup"),
      thumbnailUrl: localDemoPoster("fewa-cleanup"),
      viewerCount: 187,
      videoSlug: "fewa-cleanup"
    },
    imageSlug: "fewa-cleanup",
    imagePrompt:
      "Fewa lake southern shore in Pokhara at midday; two wooden boats pulled close to shore with bagged plastic loaded inside; community members along the pebbled bank with collection bags; the Annapurna range hazy in the distance behind the lake."
  },
  {
    id: "demo-live-6",
    title: "तौमढी स्क्वायर मर्मत सहयोग",
    addressText: "तौमढी स्क्वायर, भक्तपुर",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 22,
    meetupNotes:
      "न्यातपोल मन्दिर सिँढीको दक्षिणी छेउमा भेला। मन्दिर परिसर सरसफाइ + सिँढीमा भएको चुनढुङ्गा छुट्याइ। पुरातत्व विभागको प्रतिनिधि उपस्थित हुने।",
    linkedIssue: {
      id: "demo-issue-taumadhi-l6",
      title: "तौमढी स्क्वायर पुरातात्त्विक परिसर अव्यवस्थित",
      description:
        "तौमढी स्क्वायरमा पर्यटक र स्थानीय दुवै फोहोर छोडेर जाने — सिँढी छेउ पुरातात्त्विक ढुङ्गा र आधुनिक प्लास्टिक मिसिएको। पुरातत्व विभागको स्वीकृति प्राप्त; ध्यानपूर्वक छुट्याउन हाम्रो काम।",
      category: "beautification",
      addressText: "तौमढी स्क्वायर, भक्तपुर",
      latitude: 27.6722,
      longitude: 85.4297,
      voteCount: 104,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 29 * 60_000).toISOString(),
      streamUrl: localDemoVideo("taumadhi-heritage"),
      previewEmbedUrl: localDemoVideo("taumadhi-heritage"),
      thumbnailUrl: localDemoPoster("taumadhi-heritage"),
      viewerCount: 142,
      videoSlug: "taumadhi-heritage"
    },
    imageSlug: "taumadhi-heritage",
    imagePrompt:
      "Taumadhi Square in Bhaktapur at the foot of Nyatapola Temple; community members in everyday dress kneeling along the stone steps separating fragments of carved heritage stone from modern litter into different baskets; brick-paved square stretching out behind them; soft morning light."
  },
  {
    id: "demo-live-7",
    title: "नगरकोट ट्रेल मर्मत",
    addressText: "नगरकोट सूर्योदय व्यू पोइन्ट, भक्तपुर",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 19,
    meetupNotes:
      "नगरकोट बस पार्क छेउ भेला; त्यहाँबाट ट्रेलमा पैदल। हाइकिङ बुट र पानी आफ्नै ल्याउनुहोस्। नगरपालिकाले औजार र दिउँसो खाजा उपलब्ध गराउँछन्।",
    linkedIssue: {
      id: "demo-issue-nagarkot-l7",
      title: "नगरकोट सूर्योदय ट्रेलमा साइनबोर्ड गायब र इरोसन",
      description:
        "नगरकोट देखि सूर्योदय व्यू पोइन्टसम्मको २.८ किमी ट्रेलमा पाँच ठाउँमा साइनबोर्ड हराएको; तीन ठाउँमा डाँडामा इरोसन। पर्यटन समितिले सामग्री र अनुमति दिए।",
      category: "trail",
      addressText: "नगरकोट, भक्तपुर",
      latitude: 27.7167,
      longitude: 85.5167,
      voteCount: 67,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 81 * 60_000).toISOString(),
      streamUrl: localDemoVideo("nagarkot-trail"),
      previewEmbedUrl: localDemoVideo("nagarkot-trail"),
      thumbnailUrl: localDemoPoster("nagarkot-trail"),
      viewerCount: 65,
      videoSlug: "nagarkot-trail"
    },
    imageSlug: "nagarkot-trail",
    imagePrompt:
      "Nagarkot hiking trail in pine forest, mid-morning light filtering through trees; one new wooden trail sign being mounted onto a sturdy post by two community members in jeans and t-shirts; tools resting against a stack of stones nearby; mist over the valley visible through a gap in the trees."
  },
  {
    id: "demo-live-8",
    title: "धरान हाटबजार सरसफाइ",
    addressText: "धरान भन्ज्याङ चोक, सुनसरी",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 38,
    meetupNotes:
      "भन्ज्याङ चोक स्ट्यान्डमा भेला। हाटबजार समितिले हाटको दिन छुट्याएर सहयोग गरेको; ट्रक र अग्रिम छुट्याउने उपलब्ध।",
    linkedIssue: {
      id: "demo-issue-dharan-l8",
      title: "धरान हाटबजारमा हाटको दिन फोहोरको चाङ",
      description:
        "धरान हाटबजारमा प्रत्येक हाटको दिन (मंगलबार/शुक्रबार) चियाजति फोहोर थुप्रिने; पाँच वर्षदेखि स्थायी समाधान खोजिएको। यो पटक हाट सकिएपछि साँझ ४ बजेबाट सरसफाइ; अर्को हाट अघि सकाउने लक्ष्य।",
      category: "cleanup",
      addressText: "धरान, सुनसरी",
      latitude: 26.8147,
      longitude: 87.2769,
      voteCount: 92,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 53 * 60_000).toISOString(),
      streamUrl: localDemoVideo("dharan-bazaar"),
      previewEmbedUrl: localDemoVideo("dharan-bazaar"),
      thumbnailUrl: localDemoPoster("dharan-bazaar"),
      viewerCount: 78,
      videoSlug: "dharan-bazaar"
    },
    imageSlug: "dharan-bazaar",
    imagePrompt:
      "Dharan market square in the early evening after the haat day has wound down; volunteers with brooms sweeping the empty stall lanes; piled vegetable peelings and torn plastic bags being shovelled into a municipal truck parked at the edge; the eastern hills warm in the setting sun."
  },
  {
    id: "demo-live-9",
    title: "हेटौँडा रत्न पार्क वृक्षारोपण",
    addressText: "रत्न पार्क, हेटौँडा",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 29,
    meetupNotes:
      "रत्न पार्क मुख्य गेटमा भेला। २२० बिरुवा रोप्ने लक्ष्य; डिभिजन वन कार्यालयले बिरुवा र पानीको ट्याङ्की उपलब्ध गराएको।",
    linkedIssue: {
      id: "demo-issue-hetauda-l9",
      title: "रत्न पार्कको पूर्व खण्ड खाली; गर्मीमा छहारी अभाव",
      description:
        "हेटौँडा रत्न पार्कको पूर्व खण्ड ०.४ हेक्टर खाली; गर्मीमा पार्क प्रयोगकर्ताले छहारी पाउँदैनन्। वन कार्यालय र नगरपालिकाको साझेदारीमा बकैनो र असुरो बिरुवा रोप्ने योजना।",
      category: "afforestation",
      addressText: "हेटौँडा, मकवानपुर",
      latitude: 27.4286,
      longitude: 85.0322,
      voteCount: 73,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 47 * 60_000).toISOString(),
      streamUrl: localDemoVideo("hetauda-trees"),
      previewEmbedUrl: localDemoVideo("hetauda-trees"),
      thumbnailUrl: localDemoPoster("hetauda-trees"),
      viewerCount: 91,
      videoSlug: "hetauda-trees"
    },
    imageSlug: "hetauda-trees",
    imagePrompt:
      "Hetauda Ratna Park eastern open ground mid-planting; rows of small saplings staked into freshly turned soil, blue water cans nearby; community members of mixed ages including a school group helping water the plantings; clear afternoon sky."
  },
  {
    id: "demo-live-10",
    title: "साँखु मन्दिर परिसर सरसफाइ",
    addressText: "बज्रयोगिनी मन्दिर, साँखु",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 24,
    meetupNotes:
      "बज्रयोगिनी मन्दिर मुख्य गेट छेउ भेला। पुजारी समितिले स्वागत; ऐतिहासिक संरचना छेउछाउ अत्यन्तै सावधानी आवश्यक।",
    linkedIssue: {
      id: "demo-issue-sankhu-l10",
      title: "बज्रयोगिनी परिसर र सडक छेउ फोहोर",
      description:
        "साँखुको ऐतिहासिक बज्रयोगिनी मन्दिर परिसरमा पूजा सामग्री र पर्यटक प्लास्टिकको दैनिक थुप्रो। मन्दिर समिति र वडाको साझेदारीमा हप्तामा दुई पटक सरसफाइ।",
      category: "cleanup",
      addressText: "साँखु, काठमाडौँ",
      latitude: 27.7444,
      longitude: 85.4644,
      voteCount: 64,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 26 * 60_000).toISOString(),
      streamUrl: localDemoVideo("sankhu-temple"),
      previewEmbedUrl: localDemoVideo("sankhu-temple"),
      thumbnailUrl: localDemoPoster("sankhu-temple"),
      viewerCount: 71,
      videoSlug: "sankhu-temple"
    },
    imageSlug: "sankhu-temple",
    imagePrompt:
      "Sankhu Bajrayogini temple courtyard with worn red-brick walls and intricately carved wooden struts; volunteers in respectful attire sweeping fallen flower offerings and plastic packets into bamboo baskets; the temple bell visible in the background; soft mid-morning light."
  },
  {
    id: "demo-live-11",
    title: "सौराहा गैँडा सेल्टर वरपर सरसफाइ",
    addressText: "सौराहा बस्ती, चितवन",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 36,
    meetupNotes:
      "सौराहा हात्ती सेल्टर प्रवेश छेउ भेला। निकुञ्ज प्रशासन र गाइड समितिले सहयोग। जंगली जनावरको भेटिने सम्भावना — सुरक्षा निर्देशन पालना अनिवार्य।",
    linkedIssue: {
      id: "demo-issue-sauraha-l11",
      title: "सौराहा बफर जोनमा पर्यटक प्लास्टिकले प्रदूषण",
      description:
        "चितवन राष्ट्रिय निकुञ्ज सौराहा बफर जोन — पर्यटक संख्या उच्च भएको कारण प्लास्टिक फोहोर। गैँडा र हात्ती बस्ने क्षेत्र भएकोले सरसफाइ अति आवश्यक।",
      category: "cleanup",
      addressText: "सौराहा, चितवन",
      latitude: 27.5806,
      longitude: 84.4972,
      voteCount: 184,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 54 * 60_000).toISOString(),
      streamUrl: localDemoVideo("sauraha-buffer"),
      previewEmbedUrl: localDemoVideo("sauraha-buffer"),
      thumbnailUrl: localDemoPoster("sauraha-buffer"),
      viewerCount: 213,
      videoSlug: "sauraha-buffer"
    },
    imageSlug: "sauraha-buffer",
    imagePrompt:
      "Sauraha buffer zone forest edge near the Chitwan National Park boundary; volunteers and uniformed park guides walking single-file along the trail collecting plastic into clear bags; tall sal trees with golden afternoon light filtering through; the Rapti river visible in the distance."
  },
  {
    id: "demo-live-12",
    title: "पाँचथर ओमे डाँडा वृक्षारोपण",
    addressText: "ओमे डाँडा, पाँचथर",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 18,
    meetupNotes:
      "ओमे डाँडा हेलिप्याडमा भेला। ट्र्याक्टरले बिरुवा र पानी डाँडामा पुर्‍याउने। मौसम बदलिनसक्ने — रेन्कोट ल्याए राम्रो।",
    linkedIssue: {
      id: "demo-issue-panchthar-l12",
      title: "ओमे डाँडा मा वृक्षारोपणको आवश्यकता",
      description:
        "पाँचथरको ओमे डाँडा खाली; मनसुनमा माटो खस्किने जोखिम। डिभिजन वन कार्यालयले ३०० बिरुवा (चिलाउने, उत्तिस) उपलब्ध गराएको।",
      category: "afforestation",
      addressText: "ओमे डाँडा, पाँचथर",
      latitude: 27.1383,
      longitude: 87.8417,
      voteCount: 52,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 39 * 60_000).toISOString(),
      streamUrl: localDemoVideo("panchthar-trees"),
      previewEmbedUrl: localDemoVideo("panchthar-trees"),
      thumbnailUrl: localDemoPoster("panchthar-trees"),
      viewerCount: 48,
      videoSlug: "panchthar-trees"
    },
    imageSlug: "panchthar-trees",
    imagePrompt:
      "Ome Danda ridge in Panchthar district, mid-hills landscape with terraced fields below; volunteers in light jackets and woollen caps planting young saplings staked at regular intervals along the slope; mist curling up from the valley behind them; cool morning light."
  },
  {
    id: "demo-live-13",
    title: "नुवाकोट दरबार परिसर मर्मत",
    addressText: "नुवाकोट सात तले दरबार, नुवाकोट",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 27,
    meetupNotes:
      "नुवाकोट दरबार मुख्य गेट छेउ भेला। पुरातत्व विभागको प्रतिनिधि उपस्थित; ऐतिहासिक संरचना छुने अनुमति नभएको खण्डमा छुनेबाट जोगिने।",
    linkedIssue: {
      id: "demo-issue-nuwakot-l13",
      title: "नुवाकोट दरबार परिसर अव्यवस्थित र फोहोर",
      description:
        "ऐतिहासिक नुवाकोट सात तले दरबार परिसर वर्षौंदेखि व्यवस्थित सरसफाइ नभएको; पुरातत्व विभागले स्वीकृति दिए। ध्यानपूर्वक छुट्याउने काम।",
      category: "cleanup",
      addressText: "नुवाकोट दरबार, नुवाकोट",
      latitude: 27.9114,
      longitude: 85.1675,
      voteCount: 96,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 71 * 60_000).toISOString(),
      streamUrl: localDemoVideo("nuwakot-darbar"),
      previewEmbedUrl: localDemoVideo("nuwakot-darbar"),
      thumbnailUrl: localDemoPoster("nuwakot-darbar"),
      viewerCount: 108,
      videoSlug: "nuwakot-darbar"
    },
    imageSlug: "nuwakot-darbar",
    imagePrompt:
      "Nuwakot seven-storey palace courtyard with characteristic red-brick and timber Newar architecture rising in the background; volunteers carefully separating modern debris from heritage stone fragments into different baskets; a Department of Archaeology officer in uniform supervising; clear morning sky over the Trishuli valley."
  },
  {
    id: "demo-live-14",
    title: "मनाङ चेम भिलेज ट्रेल मर्मत",
    addressText: "चेम गाउँ ट्रेल, मनाङ",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 15,
    meetupNotes:
      "चेम गाउँ चेकपोस्टमा भेला। ट्रेल भिर भएकोले हाइकिङ बुट र हेल्मेट अनिवार्य; हाइकर ACAP कार्डधारी हुनुपर्ने।",
    linkedIssue: {
      id: "demo-issue-manang-l14",
      title: "चेम-मनाङ ट्रेलमा साइनबोर्ड गायब; पर्यटक हराउने",
      description:
        "मनाङको चेम-गाउँ ट्रेलमा १८ ठाउँमा साइन गायब; ACAP को नियमित मर्मत भएन। पर्यटक हराउने जोखिम। ACAP र स्थानीय गाइड संघको साझेदारी।",
      category: "trail",
      addressText: "मनाङ चेम, मनाङ",
      latitude: 28.6633,
      longitude: 84.0167,
      voteCount: 73,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 92 * 60_000).toISOString(),
      streamUrl: localDemoVideo("manang-trail"),
      previewEmbedUrl: localDemoVideo("manang-trail"),
      thumbnailUrl: localDemoPoster("manang-trail"),
      viewerCount: 134,
      videoSlug: "manang-trail"
    },
    imageSlug: "manang-trail",
    imagePrompt:
      "Manang Chame high-mountain trail with prayer flags strung between rough stone walls; volunteers in winter jackets mounting fresh wooden direction signs at a switchback; snow-dusted Annapurna peaks rising in the background; thin high-altitude air, clear cold light."
  },
  {
    id: "demo-live-15",
    title: "स्याङ्जा पाँडव गुफा वरपर सरसफाइ",
    addressText: "पाँडव गुफा, स्याङ्जा",
    rolesNeeded: DEMO_ROSTER,
    participantCount: 21,
    meetupNotes:
      "स्याङ्जा बजार बस पार्कमा भेला; बस ले गुफा सम्म लैजाने। टर्चलाइट र हेल्मेट टीमले उपलब्ध गराउने। गुफा भित्र सावधानी।",
    linkedIssue: {
      id: "demo-issue-syangja-l15",
      title: "पाँडव गुफा परिसर र भित्र फोहोर थुप्रिएको",
      description:
        "ऐतिहासिक पाँडव गुफा स्याङ्जाको प्रमुख पर्यटक स्थल; पर्यटकले छोडेर जाने प्लास्टिक र भित्र अन्धकारमा फोहोर थुप्रिने। पर्यटन समितिले सहयोग।",
      category: "cleanup",
      addressText: "पाँडव गुफा, स्याङ्जा",
      latitude: 28.0617,
      longitude: 83.8489,
      voteCount: 81,
      status: "EVENT_SCHEDULED"
    },
    liveStream: {
      isActive: true,
      startedAt: new Date(Date.now() - 43 * 60_000).toISOString(),
      streamUrl: localDemoVideo("syangja-cave"),
      previewEmbedUrl: localDemoVideo("syangja-cave"),
      thumbnailUrl: localDemoPoster("syangja-cave"),
      viewerCount: 88,
      videoSlug: "syangja-cave"
    },
    imageSlug: "syangja-cave",
    imagePrompt:
      "Pandav cave entrance in Syangja, limestone outcrop with the cave mouth visible behind; volunteers wearing helmets and headlamps coming out with bags of collected litter; the misty Syangja hills rolling in the background; soft overcast light filtering through trees."
  }
];

function hydrateEventLinkedIssue(event) {
  if (!event?.linkedIssue) return event;
  return { ...event, linkedIssue: attachIssueTranslations(event.linkedIssue) };
}

export function getDemoLiveEvents() {
  if (!isDev()) return [];
  return DEMO_LIVE_EVENTS.map(hydrateEventLinkedIssue);
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
    title: "श्री जनप्रिय मा.वि. भित्ता पेन्ट र पुस्तकालय मर्मत",
    addressText: "श्री जनप्रिय मा.वि., काठमाडौँ",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/school-paint.jpg",
    scheduledAt: inHours(96),
    durationMinutes: 300,
    meetupLatitude: 27.7037,
    meetupLongitude: 85.3346,
    leaderName: "सुनिल मगर",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
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
    }
  },
  {
    id: "demo-up-6",
    title: "स्वयम्भू सिँढी सरसफाइ र मर्मत",
    addressText: "स्वयम्भू महाचैत्य, काठमाडौँ",
    category: "trail",
    thumbnailUrl: "/images/demo-events/swayambhu-steps.jpg",
    scheduledAt: inHours(42),
    durationMinutes: 240,
    meetupLatitude: 27.7146,
    meetupLongitude: 85.2906,
    leaderName: "मञ्जु तामाङ",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "स्वयम्भू पूर्वी सिँढी मुनी (नागपोखरी छेउ) भेला। ३६५ सिँढी टोलीमा बाँडिने; तल्लो खण्डबाट सुरु। कलश समितिले हलुका खाजा र खानेपानी उपलब्ध गराउने।",
    linkedIssue: {
      id: "demo-issue-swayambhu-6",
      title: "स्वयम्भू पूर्वी सिँढी पुरानो र फोहोरयुक्त",
      description:
        "स्वयम्भू महाचैत्यको पूर्वी ३६५ सिँढी पुराना भएर माथिल्लो खण्डमा भत्किएका; पर्यटक र तीर्थयात्रीले फालेको प्लास्टिक थुप्रिएको। कलश समिति र पुरातत्व विभागको स्वीकृतिमा।",
      category: "trail",
      addressText: "स्वयम्भू महाचैत्य, काठमाडौँ",
      latitude: 27.7146,
      longitude: 85.2906,
      voteCount: 134,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "swayambhu-steps",
    imagePrompt:
      "Swayambhu eastern stairway from below, looking up the long stone ascent; community members sweeping individual steps and gathering debris into bags; monkeys watching from the stupa wall in the distance; prayer flags flickering in the morning breeze."
  },
  {
    id: "demo-up-7",
    title: "पाशुपति आर्यघाट परिसर सरसफाइ",
    addressText: "आर्यघाट, पाशुपतिनाथ, काठमाडौँ",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/pashupati-aryaghat.jpg",
    scheduledAt: inHours(66),
    durationMinutes: 180,
    meetupLatitude: 27.7106,
    meetupLongitude: 85.3489,
    leaderName: "हरि श्रेष्ठ",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH",
    meetupNotes:
      "पाशुपति पूर्वी गेट (कैलाशनाथ छेउ) भेला। आर्यघाट खण्ड संवेदनशील — कोषाध्यक्ष समितिले निर्देशन दिने। कुनै फोटो वा भिडियो अनुमति बिना नगर्नुहोला।",
    linkedIssue: {
      id: "demo-issue-pashupati-7",
      title: "आर्यघाट परिसर वरपर फोहोर र पूजा सामग्रीको ढुङ्ग्रो",
      description:
        "पाशुपति परिसरको आर्यघाट छेउ पूजा सामग्री र अरू अव्यवस्थित विसर्जन साप्ताहिक थुप्रिने। पाशुपति क्षेत्र विकास कोषको स्वीकृतिमा समय-समय मा सहयोग।",
      category: "cleanup",
      addressText: "आर्यघाट, पाशुपतिनाथ",
      latitude: 27.7106,
      longitude: 85.3489,
      voteCount: 87,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "pashupati-aryaghat",
    imagePrompt:
      "Pashupatinath Aryaghat area at dawn; small group of volunteers in respectful attire collecting offerings and debris into baskets along the stone river ghats; smoke from a distant cremation drifting; the temple gold roofs glowing in the first light. Treat the scene reverently."
  },
  {
    id: "demo-up-8",
    title: "लुम्बिनी सडक छेउ वृक्षारोपण",
    addressText: "लुम्बिनी सांस्कृतिक नगरपालिका, रुपन्देही",
    category: "afforestation",
    thumbnailUrl: "/images/demo-events/lumbini-roadside.jpg",
    scheduledAt: inHours(96),
    durationMinutes: 300,
    meetupLatitude: 27.4844,
    meetupLongitude: 83.2762,
    leaderName: "रोशन के.सी.",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "लुम्बिनी पवित्र क्षेत्र पूर्वी द्वार छेउ भेला। ३ किमी सडक छेउमा ४५० बिरुवा रोप्ने लक्ष्य; पानी छर्ने व्यवस्था कोषले गर्ने।",
    linkedIssue: {
      id: "demo-issue-lumbini-8",
      title: "लुम्बिनी प्रवेश सडक छेउ रित्तो; गर्मीमा यात्रुको असजिलो",
      description:
        "लुम्बिनी पवित्र क्षेत्रको पूर्वी प्रवेश ३ किमी सडक छेउ खाली — गर्मीमा बौद्ध यात्रु र स्थानीयलाई कष्ट। लुम्बिनी विकास कोषले बिरुवा र अनुमति दुवै उपलब्ध गराएको।",
      category: "afforestation",
      addressText: "लुम्बिनी, रुपन्देही",
      latitude: 27.4844,
      longitude: 83.2762,
      voteCount: 124,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "lumbini-roadside",
    imagePrompt:
      "Long straight road approaching Lumbini sacred area, flanked by recently planted saplings staked at regular intervals; volunteers walking the line watering each sapling from blue cans; the white peace pagoda visible distantly through clear winter haze."
  },
  {
    id: "demo-up-9",
    title: "जनकपुर रामजानकी परिसर सरसफाइ",
    addressText: "रामजानकी मन्दिर, जनकपुर",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/janakpur-temple.jpg",
    scheduledAt: inHours(132),
    durationMinutes: 240,
    meetupLatitude: 26.7286,
    meetupLongitude: 85.9251,
    leaderName: "बिनिता थापा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "रामजानकी मन्दिर पश्चिमी गेटमा भेला। मन्दिर समितिले स्वागत; जलपान उपलब्ध। तौलिया र साबुन आफ्नै ल्याउनुहोस्।",
    linkedIssue: {
      id: "demo-issue-janakpur-9",
      title: "जनकपुर रामजानकी मन्दिर परिसर र पोखरी फोहोरयुक्त",
      description:
        "जनकपुर रामजानकी मन्दिर परिसर र अग्निशाला पोखरीमा दैनिक श्रद्धालुले छोडेर जाने फोहोर। मन्दिर समिति र नगरपालिकाको साझेदारीमा यो सरसफाइ।",
      category: "cleanup",
      addressText: "रामजानकी मन्दिर, जनकपुर",
      latitude: 26.7286,
      longitude: 85.9251,
      voteCount: 98,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "janakpur-temple",
    imagePrompt:
      "Janakpur Ram Janaki temple courtyard at mid-morning; the distinctive white-and-pink Mithila architecture in the background; volunteers in saris and kurtas raking offerings and dried leaves into bamboo baskets; a small group cleaning the steps of the Agnishala pond off to one side."
  },
  {
    id: "demo-up-10",
    title: "इलाम चिया बारी पैदलमार्ग मर्मत",
    addressText: "कन्याम चिया बगान, इलाम",
    category: "trail",
    thumbnailUrl: "/images/demo-events/ilam-tea-trail.jpg",
    scheduledAt: inHours(168),
    durationMinutes: 300,
    meetupLatitude: 26.9018,
    meetupLongitude: 87.9347,
    leaderName: "गणेश राई",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH",
    meetupNotes:
      "कन्याम चिया बगान प्रवेश ढोकामा भेला। ५ किमी पैदलमार्ग टोलीमा बाँडिने; हाइकिङ बुट र पानी अनिवार्य। चिया बगानले दिउँसो खाजा उपलब्ध गराउने।",
    linkedIssue: {
      id: "demo-issue-ilam-10",
      title: "कन्याम चिया बगान वरपरको पैदलमार्ग पर्यटक अनुकूल नभएको",
      description:
        "कन्याम चिया बगान प्रसिद्ध पर्यटक स्थल — तर वरपरको ५ किमी पैदलमार्गमा साइनबोर्ड गायब, इरोसन र फोहोर। चिया उत्पादक संघ र पर्यटन समितिको साझेदारीमा यो अभियान।",
      category: "trail",
      addressText: "कन्याम, इलाम",
      latitude: 26.9018,
      longitude: 87.9347,
      voteCount: 81,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "ilam-tea-trail",
    imagePrompt:
      "Rolling tea garden hills of Kanyam in Ilam; a narrow trail winding through the manicured tea bushes; volunteers in light jackets mounting wooden directional signs at a junction; misty morning, the silver of dew still on the tea leaves."
  },
  {
    id: "demo-up-11",
    title: "मुग्लिङ बजार जल निकास सरसफाइ",
    addressText: "मुग्लिङ बस पार्क, चितवन",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/muglin-drains.jpg",
    scheduledAt: inHours(54),
    durationMinutes: 240,
    meetupLatitude: 27.8856,
    meetupLongitude: 84.5436,
    leaderName: "प्रदीप तामाङ",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH",
    meetupNotes:
      "मुग्लिङ बस पार्क मूल चोकमा भेला। नालीहरू टोलीमा बाँडिने; गहिरो नालीमा सुरक्षा बेल्ट प्रयोग गर्ने। पन्जा र मास्क अनिवार्य।",
    linkedIssue: {
      id: "demo-issue-muglin-11",
      title: "मुग्लिङ बजार नालीहरू बन्द; मनसुनमा जलमग्न",
      description:
        "मुग्लिङ बजार राजमार्ग जोडिने प्रमुख चोक — तर मुख्य नालीहरू वर्षौंदेखि सफा नभएको। प्रत्येक मनसुनमा बस पार्क र वरपरका पसल जलमग्न। नगरले अग्रिम र ट्रक उपलब्ध गराउने प्रतिबद्धता।",
      category: "infrastructure",
      addressText: "मुग्लिङ, चितवन",
      latitude: 27.8856,
      longitude: 84.5436,
      voteCount: 145,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "muglin-drains",
    imagePrompt:
      "Muglin bus park area with the main highway visible behind; volunteers crouched over open street drains pulling out packed dirt and plastic with long-handled rakes; municipal truck idling at the curb; commercial signs in Nepali Devanagari along the storefronts."
  },
  {
    id: "demo-up-12",
    title: "पाल्पा तानसेन दरबार परिसर सजावट",
    addressText: "श्रीनगर पार्क छेउ, तानसेन, पाल्पा",
    category: "beautification",
    thumbnailUrl: "/images/demo-events/tansen-darbar.jpg",
    scheduledAt: inHours(216),
    durationMinutes: 360,
    meetupLatitude: 27.8682,
    meetupLongitude: 83.5499,
    leaderName: "स्मिता शर्मा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "तानसेन दरबार मुख्य गेटमा हाजिर। नगरपालिकाले रङ र ब्रश ल्याइदिने; पुरानो लुगा लगाएर आउनुहोस्। प्रतिनिधि सदस्यबाट छोटो ऐतिहासिक परिचय हुने।",
    linkedIssue: {
      id: "demo-issue-tansen-12",
      title: "तानसेन ऐतिहासिक दरबार परिसर भित्ता रित्तो र पुरानो",
      description:
        "तानसेन दरबार पाल्पाको प्रमुख ऐतिहासिक स्थल — परिसरका भित्ता वर्षौंदेखि पेन्ट नभएको र केही ठाउँमा अव्यवस्थित भित्ते लेखन। पुरातत्व विभागले अनुमति दिए; स्थानीय कलाकारले मिथिला र नेवारी प्रेरित डिजाइन तयार पारेका।",
      category: "beautification",
      addressText: "तानसेन दरबार, पाल्पा",
      latitude: 27.8682,
      longitude: 83.5499,
      voteCount: 89,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "tansen-darbar",
    imagePrompt:
      "Tansen Darbar courtyard wall in the late afternoon; one half of a long wall freshly painted in muted ochre and cream, the other half still bare brick; two artists in stained smocks finishing a stylized lotus pattern in the corner; the hills of Palpa visible above the wall."
  },
  {
    id: "demo-up-13",
    title: "बर्दिया जंगल किनार सरसफाइ",
    addressText: "ठाकुरद्वारा बफर जोन, बर्दिया",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/bardia-buffer.jpg",
    scheduledAt: inHours(144),
    durationMinutes: 300,
    meetupLatitude: 28.3935,
    meetupLongitude: 81.4317,
    leaderName: "अमित गुरुङ",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "URGENT",
    meetupNotes:
      "ठाकुरद्वारा बफर जोन प्रवेश पोस्टमा भेला। निकुञ्ज प्रशासनको प्रतिनिधि र स्थानीय गाइड साथमा अनिवार्य; एक्लै जंगल छेउ नजानुहोला। हाइकिङ बुट र पानी ल्याउनुहोस्।",
    linkedIssue: {
      id: "demo-issue-bardia-13",
      title: "बर्दिया निकुञ्ज बफर जोन पर्यटक प्लास्टिकले प्रदूषित",
      description:
        "बर्दिया राष्ट्रिय निकुञ्जको बफर जोन — पर्यटक र पिकनिक समूहले छोडेर जाने प्लास्टिक जंगली जीवको लागि जोखिम। निकुञ्ज प्रशासन र बफर जोन उपभोक्ता समितिको साझेदारीमा।",
      category: "cleanup",
      addressText: "बर्दिया राष्ट्रिय निकुञ्ज, बर्दिया",
      latitude: 28.3935,
      longitude: 81.4317,
      voteCount: 167,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "bardia-buffer",
    imagePrompt:
      "Bardia National Park buffer zone trail; community members and a uniformed park guide walking single file along the forest edge, collecting plastic into clear bags; tall sal trees overhead, undergrowth in dry-season ochre; a sign warning of wildlife visible at the bend."
  },
  {
    id: "demo-up-14",
    title: "सुर्खेत बुलबुले हाइकिङ ट्रेल मर्मत",
    addressText: "बुलबुले झरना ट्रेल, सुर्खेत",
    category: "trail",
    thumbnailUrl: "/images/demo-events/surkhet-bulbule.jpg",
    scheduledAt: inHours(252),
    durationMinutes: 360,
    meetupLatitude: 28.6086,
    meetupLongitude: 81.6175,
    leaderName: "रोहित कार्की",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH",
    meetupNotes:
      "बुलबुले झरना मूल प्रवेश गेटमा भेला। ट्रेल भिर-भिरालो छ; हाइकिङ बुट र हेल्मेट सहित। नगरपालिकाले औजार र खाजा उपलब्ध गराउने।",
    linkedIssue: {
      id: "demo-issue-surkhet-14",
      title: "बुलबुले झरना ट्रेल खस्किएको र साइन गायब",
      description:
        "सुर्खेतको बुलबुले झरना स्थानीय पर्यटन स्थल — तर पुग्ने ट्रेलको दुई खण्ड पहिरोले खस्किएको र साइनबोर्ड गायब। नगरले औजार र अनुमति दिए; ट्रेलमा थप ल्याम्पपोस्ट पनि लगाउने।",
      category: "trail",
      addressText: "बुलबुले झरना, सुर्खेत",
      latitude: 28.6086,
      longitude: 81.6175,
      voteCount: 76,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "surkhet-bulbule",
    imagePrompt:
      "Bulbule waterfall trail in Surkhet, mid-morning; volunteers shoring up a landslide section with timber pickets and packed earth; the falls visible through trees in the background, fine spray catching the light; a freshly painted directional sign leaning against a rock waiting to be mounted."
  },
  {
    id: "demo-up-15",
    title: "ओखलढुंगा माविमा भित्ता पेन्ट",
    addressText: "श्री जलजला मा.वि., ओखलढुंगा",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/okhaldhunga-school.jpg",
    scheduledAt: inHours(108),
    durationMinutes: 360,
    meetupLatitude: 27.3158,
    meetupLongitude: 86.4992,
    leaderName: "मञ्जु तामाङ",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "स्कुलको मुख्य गेटमा हाजिर। SMC अध्यक्षले स्वागत। २४० विद्यार्थी पनि सहभागी हुने — सहभागीहरूले उनीहरूलाई हलुका काम लगाउने (कुची धुने, ब्रश सुकाउने)।",
    linkedIssue: {
      id: "demo-issue-okhal-15",
      title: "श्री जलजला मा.वि. ७ वर्षदेखि पेन्ट नभएको",
      description:
        "ओखलढुंगाको श्री जलजला मा.वि. भवनको भित्ता ७ वर्षदेखि पेन्ट नभएको; २४० विद्यार्थी प्रभावित। SMC ले रङ र सामग्री खर्च बेहोर्ने; हामी श्रम र समय जुटाउँछौँ।",
      category: "infrastructure",
      addressText: "श्री जलजला मा.वि., ओखलढुंगा",
      latitude: 27.3158,
      longitude: 86.4992,
      voteCount: 102,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "okhaldhunga-school",
    imagePrompt:
      "Hillside school in Okhaldhunga, freshly painted sky-blue exterior walls with white trim; a row of school children in uniform watching shyly from the courtyard while a handful of adult volunteers finish the last corner; pine-clad hills rolling behind the schoolyard."
  },
  {
    id: "demo-up-16",
    title: "धादिङ्ग गलछी सडक छेउ वृक्षारोपण",
    addressText: "गलछी चोक, धादिङ",
    category: "afforestation",
    thumbnailUrl: "/images/demo-events/galchhi-roadside.jpg",
    scheduledAt: inHours(78),
    durationMinutes: 240,
    meetupLatitude: 27.8447,
    meetupLongitude: 84.9886,
    leaderName: "दिनेश गुरुङ",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "गलछी चोक बस स्टपमा भेला। पृथ्वी राजमार्ग छेउ — सडक यातायातसँग सावधानी। डिभिजन वन कार्यालयले बिरुवा र पानी पुर्‍याउने।",
    linkedIssue: {
      id: "demo-issue-galchhi-16",
      title: "पृथ्वी राजमार्ग गलछी खण्ड छेउ रित्तो; धुलो र गर्मीको कष्ट",
      description:
        "गलछी देखि मलेखु ४ किमी राजमार्ग छेउ खाली; गर्मीमा बस यात्रु र स्थानीयलाई असजिलो। ३५० बिरुवा रोप्ने योजना।",
      category: "afforestation",
      addressText: "गलछी, धादिङ",
      latitude: 27.8447,
      longitude: 84.9886,
      voteCount: 79,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "galchhi-roadside",
    imagePrompt:
      "Prithvi Highway near Galchhi with traffic streaming past; volunteers planting saplings in a long row along the roadside, water cans staged at intervals; the Trishuli river visible below the road; dry afternoon light with hills hazy in the distance."
  },
  {
    id: "demo-up-17",
    title: "रौतहट गौर बजार सरसफाइ",
    addressText: "गौर मूल बजार, रौतहट",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/gaur-bazaar.jpg",
    scheduledAt: inHours(102),
    durationMinutes: 240,
    meetupLatitude: 26.7625,
    meetupLongitude: 85.2811,
    leaderName: "रामकुमार यादव",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "गौर मूल बजार चोकमा भेला। हाटको दिनलाई जोडिने; नगरले ट्रक र अग्रिम छुट्याउने काम सहयोग गर्ने।",
    linkedIssue: {
      id: "demo-issue-rautahat-17",
      title: "गौर बजार हाट दिन फोहोरको चाङ",
      description:
        "रौतहटको गौर बजारमा हाट दिन (आइतबार/बुधबार) फोहोर थुप्रिएर बजार सम्बन्धी व्यवसाय असजिलो। नगर र व्यापारी सङ्घको साझेदारी।",
      category: "cleanup",
      addressText: "गौर, रौतहट",
      latitude: 26.7625,
      longitude: 85.2811,
      voteCount: 64,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "gaur-bazaar",
    imagePrompt:
      "Gaur market in Rautahat after the haat day; volunteers in everyday Madhesi clothing sweeping stall lanes piled with vegetable scraps and torn polythene; a municipal cart waiting at the edge to receive the gathered waste; warm late-afternoon dust hanging in the air."
  },
  {
    id: "demo-up-18",
    title: "मकवानपुर बेन्द्राङ्ग ट्रेल सरसफाइ",
    addressText: "बेन्द्राङ्ग ट्रेल, मकवानपुर",
    category: "trail",
    thumbnailUrl: "/images/demo-events/bendrang-trail.jpg",
    scheduledAt: inHours(186),
    durationMinutes: 300,
    meetupLatitude: 27.5333,
    meetupLongitude: 85.1167,
    leaderName: "कमला अधिकारी",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH",
    meetupNotes:
      "बेन्द्राङ्ग गाउँ ब्रिज छेउ भेला। ट्रेल भिर भएकोले हाइकिङ बुट र पानी अनिवार्य; मौसम अनुसार रेन्कोट।",
    linkedIssue: {
      id: "demo-issue-bendrang-18",
      title: "बेन्द्राङ्ग हाइकिङ ट्रेलमा साइन गायब र इरोसन",
      description:
        "मकवानपुरको बेन्द्राङ्ग ट्रेल पर्यटक र स्थानीय हाइकरको प्रिय; तर साइन गायब र दुई खण्डमा इरोसन। नगरले अनुमति र सामग्री दिए।",
      category: "trail",
      addressText: "बेन्द्राङ्ग, मकवानपुर",
      latitude: 27.5333,
      longitude: 85.1167,
      voteCount: 87,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "bendrang-trail",
    imagePrompt:
      "Forested hiking trail in Makwanpur winding through pine and rhododendron; volunteers steadying a fresh wooden direction post into the ground while another lays packed stone over an eroded patch nearby; soft filtered light through the canopy."
  },
  {
    id: "demo-up-19",
    title: "तापलेजुङ कन्जरभेसन एरिया सरसफाइ",
    addressText: "घुन्सा बस्ती, तापलेजुङ",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/ghunsa-conservation.jpg",
    scheduledAt: inHours(312),
    durationMinutes: 360,
    meetupLatitude: 27.6500,
    meetupLongitude: 87.9167,
    leaderName: "कर्ण शेर्पा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "URGENT",
    meetupNotes:
      "घुन्सा बस्ती मध्य भेला। उच्च हिमाली क्षेत्र — कमसेकम ६,००० मि. सम्म जान सक्ने तयारी। KCAP कार्ड अनिवार्य।",
    linkedIssue: {
      id: "demo-issue-taplejung-19",
      title: "कञ्चनजङ्घा कन्जरभेसन एरिया ट्रेकर प्लास्टिक",
      description:
        "KCAP को ट्रेक मार्गमा पर्यटकले छोडेका प्लास्टिक र क्यानमा वन्यजन्तु जोखिम; उच्च उचाइको कारण विघटन ढिलो। KCAP प्रशासन र स्थानीय गाइड संघको साझेदारी।",
      category: "cleanup",
      addressText: "घुन्सा, तापलेजुङ",
      latitude: 27.6500,
      longitude: 87.9167,
      voteCount: 128,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "ghunsa-conservation",
    imagePrompt:
      "Ghunsa village in the Kanchenjunga Conservation Area; trekkers and local porters in down jackets gathering bags of plastic and tin debris from the trail edges; stone-built Sherpa houses and prayer flags in the background; thin air and crisp light, mountains hazy in the distance."
  },
  {
    id: "demo-up-20",
    title: "कैलाली घोडाघोडी सरसफाइ",
    addressText: "घोडाघोडी ताल, कैलाली",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/ghodaghodi-lake.jpg",
    scheduledAt: inHours(126),
    durationMinutes: 240,
    meetupLatitude: 28.7333,
    meetupLongitude: 80.9333,
    leaderName: "बिनिता चौधरी",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH",
    meetupNotes:
      "घोडाघोडी ताल मूल प्रवेश द्वार छेउ भेला। ताल किनार वर्षायाममा हिलाम्मे — चप्पल वा रबर बुट ल्याउनुहोस्।",
    linkedIssue: {
      id: "demo-issue-kailali-20",
      title: "घोडाघोडी ताल किनार पर्यटक प्लास्टिकले प्रदूषित",
      description:
        "कैलालीको घोडाघोडी रामसार सूचीकृत ताल; पर्यटक वृद्धि र स्थानीय अव्यवस्थित विसर्जनले किनार प्रदूषित। रामसार समिति र वडाको साझेदारीमा।",
      category: "cleanup",
      addressText: "घोडाघोडी ताल, कैलाली",
      latitude: 28.7333,
      longitude: 80.9333,
      voteCount: 102,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "ghodaghodi-lake",
    imagePrompt:
      "Ghodaghodi lake in Kailali at sunset, lotus pads floating on still water; volunteers in rolled-up trousers gathering plastic bottles and packets from the marshy edge into clear bags; reeds and small wading birds along the shoreline."
  },
  {
    id: "demo-up-21",
    title: "बझाङ खप्तड मन्दिर ट्रेल मर्मत",
    addressText: "खप्तड डाँडा, बझाङ",
    category: "trail",
    thumbnailUrl: "/images/demo-events/khaptad-trail.jpg",
    scheduledAt: inHours(264),
    durationMinutes: 360,
    meetupLatitude: 29.3667,
    meetupLongitude: 81.1833,
    leaderName: "देव बहादुर थापा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH",
    meetupNotes:
      "खप्तड क्याम्प छेउ हाजिर। उच्च उचाइ; तातो लुगा अनिवार्य। निकुञ्ज प्रशासनको गाइड साथमा।",
    linkedIssue: {
      id: "demo-issue-bajhang-21",
      title: "खप्तड मन्दिर ट्रेल साइन र पैदलमार्ग जीर्ण",
      description:
        "खप्तड राष्ट्रिय निकुञ्ज भित्र खप्तड मन्दिरसम्मको ट्रेलमा साइन गायब र भिर खण्डमा पैदलमार्ग जीर्ण। निकुञ्ज प्रशासनले अनुमति र सामग्री।",
      category: "trail",
      addressText: "खप्तड, बझाङ",
      latitude: 29.3667,
      longitude: 81.1833,
      voteCount: 58,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "khaptad-trail",
    imagePrompt:
      "Khaptad high-altitude grassland trail with the small whitewashed temple visible in the distance; volunteers mounting stone-and-wood directional cairns at a junction; herds of grazing yaks in the meadow nearby; cold thin air and broad blue sky over the Khaptad plateau."
  },
  {
    id: "demo-up-22",
    title: "रसुवा लाङटाङ बस्ती मर्मत",
    addressText: "लाङटाङ बस्ती, रसुवा",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/langtang-village.jpg",
    scheduledAt: inHours(156),
    durationMinutes: 360,
    meetupLatitude: 28.2167,
    meetupLongitude: 85.5500,
    leaderName: "तेन्जिङ शेर्पा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "URGENT",
    meetupNotes:
      "नयाँ लाङटाङ बस्ती चियाघरमा भेला। भूकम्प जोखिम क्षेत्र — स्थानीय गाइडको निर्देशन अनिवार्य। उच्च उचाइ।",
    linkedIssue: {
      id: "demo-issue-rasuwa-22",
      title: "लाङटाङ बस्ती समुदाय भवन मर्मत आवश्यक",
      description:
        "२०७२ भूकम्प पछि नयाँ लाङटाङ बस्तीको सामुदायिक भवन र खानेपानी प्रणाली अधुरो। ट्रेकिङ सिजन अघि मर्मत आवश्यक।",
      category: "infrastructure",
      addressText: "लाङटाङ, रसुवा",
      latitude: 28.2167,
      longitude: 85.5500,
      voteCount: 174,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "langtang-village",
    imagePrompt:
      "Langtang village rebuilt after the earthquake; volunteers and local Tamang villagers fitting timber beams onto the community hall under reconstruction; snow-capped Langtang Lirung visible behind the village; cold blue mid-morning sky."
  },
  {
    id: "demo-up-23",
    title: "तेह्रथुम विद्यालय पुस्तकालय मर्मत",
    addressText: "श्री तीनथरे मा.वि., तेह्रथुम",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/terhathum-library.jpg",
    scheduledAt: inHours(204),
    durationMinutes: 300,
    meetupLatitude: 27.1167,
    meetupLongitude: 87.5333,
    leaderName: "लक्ष्मी राई",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "स्कुलको खेलमैदान छेउ हाजिर; SMC अध्यक्षको स्वागत। पुरानो लुगा र पुस्तक हेरफेर तालिका टीमसँग।",
    linkedIssue: {
      id: "demo-issue-terhathum-23",
      title: "श्री तीनथरे मा.वि. पुस्तकालय भवन र किताब अव्यवस्थित",
      description:
        "तेह्रथुमको श्री तीनथरे मा.वि. को पुस्तकालय भवनको झ्याल टुटेका र किताब क्रमबद्ध नभएको। ३४० विद्यार्थी प्रभावित। SMC ले सामग्री बेहोर्ने।",
      category: "infrastructure",
      addressText: "श्री तीनथरे मा.वि., तेह्रथुम",
      latitude: 27.1167,
      longitude: 87.5333,
      voteCount: 71,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "terhathum-library",
    imagePrompt:
      "Terhathum hillside school library with sunlight streaming through freshly repaired wooden windows; volunteers and older students arranging books on newly built bamboo shelves; younger students watching from the doorway; cool afternoon light, the Mechi hills visible outside."
  },
  {
    id: "demo-up-24",
    title: "हुम्ला सिमिकोट खानेपानी पाइप मर्मत",
    addressText: "सिमिकोट बस्ती, हुम्ला",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/simikot-water.jpg",
    scheduledAt: inHours(348),
    durationMinutes: 480,
    meetupLatitude: 29.9667,
    meetupLongitude: 81.8167,
    leaderName: "पासाङ लामा",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "URGENT",
    meetupNotes:
      "सिमिकोट विमानस्थल छेउ भेला। उच्च हिमाली क्षेत्र — तातो लुगा र हेड्ल्याम्प अनिवार्य। स्थानीय गाइडको निर्देशन।",
    linkedIssue: {
      id: "demo-issue-humla-24",
      title: "सिमिकोट खानेपानी पाइप ३ ठाउँमा फुटेको",
      description:
        "हुम्लाको सिमिकोट मूल बस्तीको खानेपानी पाइप ३ ठाउँमा फुटेर पानीको आपूर्ति अनियमित। खानेपानी संस्थानको प्राविधिक र हेलिकप्टरबाट सामग्री।",
      category: "infrastructure",
      addressText: "सिमिकोट, हुम्ला",
      latitude: 29.9667,
      longitude: 81.8167,
      voteCount: 146,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "simikot-water",
    imagePrompt:
      "Simikot village high in Humla district with snow on distant peaks; volunteers and water-supply technicians in heavy jackets fitting replacement sections of PVC pipe across a rocky stretch; villagers carrying brass and copper pots watching from a path above; thin cold air and bright high-altitude sun."
  },
  {
    id: "demo-up-25",
    title: "इलाम सुर्योदय ट्रेल सरसफाइ",
    addressText: "अन्तु डाँडा, इलाम",
    category: "trail",
    thumbnailUrl: "/images/demo-events/antu-trail.jpg",
    scheduledAt: inHours(174),
    durationMinutes: 300,
    meetupLatitude: 26.9214,
    meetupLongitude: 88.0286,
    leaderName: "गणेश राई",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "अन्तु डाँडा होटेल छेउ भेला। सूर्योदय व्यू पोइन्टसम्म ३ किमी हिँड्ने; तातो लुगा बिहान आवश्यक।",
    linkedIssue: {
      id: "demo-issue-antu-25",
      title: "अन्तु डाँडा सूर्योदय व्यू पोइन्ट प्लास्टिकले फोहोर",
      description:
        "इलामको अन्तु डाँडा प्रसिद्ध सूर्योदय व्यू पोइन्ट; पर्यटकले छोडेका प्लास्टिक र चियाको कप थुप्रिएको। पर्यटन समितिले अनुमति र सामग्री।",
      category: "trail",
      addressText: "अन्तु डाँडा, इलाम",
      latitude: 26.9214,
      longitude: 88.0286,
      voteCount: 89,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "antu-trail",
    imagePrompt:
      "Antu Danda sunrise viewpoint in Ilam at dawn; volunteers in light jackets collecting plastic cups and food packets along the ridge trail; the Kanchenjunga massif glowing pink-gold above a sea of cloud below; tea bushes terraced across the foreground."
  },
  {
    id: "demo-up-26",
    title: "सिरहा गाउँले विद्यालय भित्ता पेन्ट",
    addressText: "श्री जय बजरङबली मा.वि., सिरहा",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/siraha-school.jpg",
    scheduledAt: inHours(138),
    durationMinutes: 360,
    meetupLatitude: 26.6500,
    meetupLongitude: 86.2167,
    leaderName: "सुनिल यादव",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "NORMAL",
    meetupNotes:
      "स्कुलको मुख्य गेट छेउ भेला; SMC अध्यक्षको स्वागत। मधेसी सङ्गीतसँग खाजा।",
    linkedIssue: {
      id: "demo-issue-siraha-26",
      title: "श्री जय बजरङबली मा.वि. भित्ता ७ वर्षदेखि पेन्ट नभएको",
      description:
        "सिरहाको ग्रामीण विद्यालय; भित्ता र शौचालय वर्षौंदेखि मर्मत नभएको। ५२० विद्यार्थी प्रभावित। SMC र वडाले सामग्री बेहोर्ने।",
      category: "infrastructure",
      addressText: "श्री जय बजरङबली मा.वि., सिरहा",
      latitude: 26.6500,
      longitude: 86.2167,
      voteCount: 73,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "siraha-school",
    imagePrompt:
      "Rural Madhesh school courtyard in Siraha district; freshly painted walls in cream and turquoise drying in afternoon sun; younger students in uniform watching from a doorway while volunteers in stained smocks finish the last corner; mango trees casting dappled shade across the yard."
  },
  {
    id: "demo-up-27",
    title: "सिन्धुपाल्चोक मेलम्ची नदी किनार सरसफाइ",
    addressText: "मेलम्ची बजार, सिन्धुपाल्चोक",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/melamchi-riverbank.jpg",
    scheduledAt: inHours(90),
    durationMinutes: 240,
    meetupLatitude: 27.8333,
    meetupLongitude: 85.5167,
    leaderName: "रोहित कार्की",
    rolesNeeded: DEMO_ROSTER,
    riskLevel: "WATCH",
    meetupNotes:
      "मेलम्ची बजार मुख्य पुलमा भेला। नदी किनार जोखिमपूर्ण; सुरक्षित दूरी कायम। पन्जा अनिवार्य।",
    linkedIssue: {
      id: "demo-issue-melamchi-27",
      title: "मेलम्ची नदी किनार बाढी पछि फोहोरयुक्त",
      description:
        "२०७८ बाढीपछि मेलम्ची नदी किनार पूरा बस्ती फोहोरले प्रदूषित। नगरले अग्रिम र ट्रक उपलब्ध गराउने; बाढी पुनःस्थापना समितिको साझेदारी।",
      category: "cleanup",
      addressText: "मेलम्ची, सिन्धुपाल्चोक",
      latitude: 27.8333,
      longitude: 85.5167,
      voteCount: 134,
      status: "EVENT_SCHEDULED"
    },
    imageSlug: "melamchi-riverbank",
    imagePrompt:
      "Melamchi river bank in the post-flood landscape; volunteers in everyday clothing with municipal workers shovelling debris and silted plastic into truck beds; flood-damaged village buildings on either side of the river; overcast morning, the broad gravel bed of the river stretching upstream."
  }
];

export function getDemoUpcomingEvents() {
  if (!isDev()) return [];
  return DEMO_UPCOMING_EVENTS.map(hydrateEventLinkedIssue);
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
  },
  {
    id: "demo-past-5",
    title: "बौद्ध परिसर साप्ताहिक सरसफाइ",
    addressText: "बौद्धनाथ स्तूप, काठमाडौँ",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/boudha-done.jpg",
    scheduledAt: daysAgo(7),
    completedAt: daysAgo(7),
    durationMinutes: 180,
    meetupLatitude: 27.7215,
    meetupLongitude: 85.3620,
    leaderName: "गणेश राई",
    participantCount: 33,
    resultSummary:
      "स्तूप परिसर र छेउछाउका १२ पसल अघिल्तिर सफा; ३३ सहभागी; १.६ टन फोहोर हटाइयो। मठाधीशले अनुमोदन।",
    meetupNotes:
      "बौद्ध स्तूप पूर्वी प्रवेश छेउ भेला। मठ समितिले स्वागत र जलपान।",
    linkedIssue: {
      id: "demo-issue-boudha-p5",
      title: "बौद्ध परिसर वरपर फोहोर र पसल अघिल्तिर अव्यवस्थित",
      description:
        "बौद्ध स्तूप परिसर वरपर साप्ताहिक रूपमा फोहोर थुप्रिने; पसलेहरूको सहभागिताबाट दिगो सरसफाइ।",
      category: "cleanup",
      addressText: "बौद्ध, काठमाडौँ",
      latitude: 27.7215,
      longitude: 85.3620,
      voteCount: 87,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/cleanup.jpg", "/images/event-types/cleanup.jpg"],
    beforeAfter: {
      before: "/images/event-types/cleanup.jpg",
      after: "/images/homepage/cleanup-areas/roadside.jpg"
    },
    testimonials: [
      {
        name: "गणेश राई",
        role: "संयोजक",
        quote: "स्थानीय पसलेहरू पनि सहभागी भए — अब साप्ताहिक भनेर बैठक तय गरेका छौँ।"
      },
      {
        name: "तेन्जिङ शेर्पा",
        role: "स्थानीय व्यवसायी",
        quote: "स्तूप परिसर सफा देख्दा तीर्थयात्रीले आफै फोहोर फाल्न डराउने भएका छन्।"
      }
    ],
    imageSlug: "boudha-done",
    imagePrompt:
      "Boudhanath stupa courtyard at end of day, recently cleared; shopkeepers and volunteers chatting in small groups near the eastern entrance; the great white dome glowing pink in sunset, prayer flags strung overhead; clean stone-paved circuit around the stupa."
  },
  {
    id: "demo-past-6",
    title: "नागदह पोखरी सरसफाइ र मर्मत",
    addressText: "नागदह, ललितपुर",
    category: "dam",
    thumbnailUrl: "/images/demo-events/nagdah-done.jpg",
    scheduledAt: daysAgo(35),
    completedAt: daysAgo(35),
    durationMinutes: 420,
    meetupLatitude: 27.6017,
    meetupLongitude: 85.3258,
    leaderName: "बिनिता थापा",
    participantCount: 51,
    resultSummary:
      "नागदह पोखरीको दक्षिणी पाल मर्मत; ५१ सहभागी; ८ क्युबिक मिटर माटो खस्किएको हटाइयो। पोखरी संरक्षण समितिले पुनःस्थापना अनुगमन।",
    meetupNotes:
      "नागदह पोखरी पूर्वी छेउ भेला। डिभिजन वन कार्यालयले अग्रिम र पाल मर्मत सामग्री ल्याइदिए।",
    linkedIssue: {
      id: "demo-issue-nagdah-p6",
      title: "नागदह पोखरीको पाल खस्किएर पानी कम भएको",
      description:
        "ऐतिहासिक नागदह पोखरीको दक्षिणी पाल बर्षायाममा खस्किएर पोखरीको पानी सतह घटेको; स्थानीय खेती र वातावरण दुवै प्रभावित।",
      category: "dam",
      addressText: "नागदह, ललितपुर",
      latitude: 27.6017,
      longitude: 85.3258,
      voteCount: 119,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/dam.jpg"],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/empty-lands.jpg",
      after: "/images/event-types/dam.jpg"
    },
    testimonials: [
      {
        name: "बिनिता थापा",
        role: "संयोजक",
        quote: "ऐतिहासिक पोखरी पुनःस्थापना हुँदै — स्थानीय खेतीलाई पनि सकारात्मक असर पर्ने अपेक्षा।"
      },
      {
        name: "केशव श्रेष्ठ",
        role: "पोखरी संरक्षण समिति",
        quote: "१७ वर्षदेखि गुनासो दिँदै थियौँ; एकै दिनमा यति परिवर्तन — आगामी मनसुनमा पनि टिक्ने आशा छ।"
      }
    ],
    imageSlug: "nagdah-done",
    imagePrompt:
      "Nagdah pond in Lalitpur after restoration, southern earthen embankment freshly repaired with packed soil and stone facing; villagers walking the perimeter inspecting the work; pond water calm with reflections of surrounding trees; community committee members in conversation by a small notice board."
  },
  {
    id: "demo-past-7",
    title: "चन्द्रागिरी हाइकिङ ट्रेल मर्मत",
    addressText: "चन्द्रागिरी डाँडा, काठमाडौँ",
    category: "trail",
    thumbnailUrl: "/images/demo-events/chandragiri-done.jpg",
    scheduledAt: daysAgo(21),
    completedAt: daysAgo(21),
    durationMinutes: 360,
    meetupLatitude: 27.6586,
    meetupLongitude: 85.2247,
    leaderName: "स्मिता शर्मा",
    participantCount: 38,
    resultSummary:
      "७ किमी ट्रेल मर्मत; ३८ सहभागी; ९ नयाँ साइनबोर्ड; इरोसन भएको ३ खण्डमा ढुङ्गा फेरि मिलाइयो।",
    meetupNotes:
      "थानकोट देखि केबल कार स्टेसन छेउ भेला। ३ टोलीमा बाँडिने।",
    linkedIssue: {
      id: "demo-issue-chandra-p7",
      title: "चन्द्रागिरी ट्रेल फोहोर र साइन गायब",
      description:
        "चन्द्रागिरी डाँडासम्मको हाइकिङ ट्रेलमा साइन गायब र इरोसन; पर्यटनलाई असर। नगर र पर्यटन समितिको सहयोगमा।",
      category: "trail",
      addressText: "चन्द्रागिरी, काठमाडौँ",
      latitude: 27.6586,
      longitude: 85.2247,
      voteCount: 92,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/trail.jpg", "/images/event-types/trail.jpg"],
    beforeAfter: {
      before: "/images/event-types/trail.jpg",
      after: "/images/event-types/trail.jpg"
    },
    testimonials: [
      {
        name: "स्मिता शर्मा",
        role: "संयोजक",
        quote: "अब ट्रेलमा हराउने डर छैन। केबल कारका यात्रुहरूले पनि पैदल फर्किने विकल्प पाए।"
      }
    ],
    imageSlug: "chandragiri-done",
    imagePrompt:
      "Chandragiri ridge trail in winter clarity; freshly mounted wooden directional signs at a Y-junction; volunteers in fleeces resting near the markers with thermoses; the Kathmandu valley spread out below the ridge, Annapurna visible to the north."
  },
  {
    id: "demo-past-8",
    title: "बागलुङ हाइस्कुल मर्मत",
    addressText: "श्री गल्कोट मा.वि., बागलुङ",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/baglung-school-done.jpg",
    scheduledAt: daysAgo(50),
    completedAt: daysAgo(50),
    durationMinutes: 420,
    meetupLatitude: 28.2167,
    meetupLongitude: 83.6000,
    leaderName: "रोहित कार्की",
    participantCount: 44,
    resultSummary:
      "विद्यालयको ३ कक्षा कोठा पेन्ट; २ शौचालय ढोका पुनःस्थापना; पुस्तकालय कक्षको सिलिङ मर्मत। ४४ सहभागी।",
    meetupNotes:
      "स्कुलको खेलमैदान छेउ भेला; SMC अध्यक्षको स्वागत।",
    linkedIssue: {
      id: "demo-issue-baglung-p8",
      title: "श्री गल्कोट मा.वि. भौतिक संरचना मर्मतयोग्य",
      description:
        "बागलुङको श्री गल्कोट मा.वि.का कक्षाकोठा र शौचालय वर्षौंदेखि मर्मत नभएको। SMC ले सामग्री बेहोर्ने; हामी श्रम।",
      category: "infrastructure",
      addressText: "श्री गल्कोट मा.वि., बागलुङ",
      latitude: 28.2167,
      longitude: 83.6000,
      voteCount: 104,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/infrastructure.jpg"],
    beforeAfter: {
      before: "/images/event-types/infrastructure.jpg",
      after: "/images/event-types/infrastructure.jpg"
    },
    testimonials: [
      {
        name: "रोहित कार्की",
        role: "संयोजक",
        quote: "विद्यार्थीहरूले पनि सहयोग गरे; अब उनीहरूको स्कुलप्रति अपनत्व भाव बढ्यो।"
      },
      {
        name: "लक्ष्मी शर्मा",
        role: "SMC अध्यक्ष",
        quote: "सामग्री किन्न साढे २ लाख खर्च गऱ्यौँ; श्रम जुटेन भने यो काम ३ महिनासम्म जान सक्थ्यो — एकै दिनमा सकियो।"
      }
    ],
    imageSlug: "baglung-school-done",
    imagePrompt:
      "Baglung hillside secondary school after restoration; freshly painted classroom block in pale yellow, repaired toilet doors visible at the far end; students in uniform crossing the courtyard at recess; pine and oak forested hills behind the school."
  },
  {
    id: "demo-past-9",
    title: "कीर्तिपुर खानेपानी मर्मत",
    addressText: "कीर्तिपुर मूल बस्ती, काठमाडौँ",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/kirtipur-water.jpg",
    scheduledAt: daysAgo(40),
    completedAt: daysAgo(40),
    durationMinutes: 300,
    meetupLatitude: 27.6781,
    meetupLongitude: 85.2767,
    leaderName: "हरि श्रेष्ठ",
    participantCount: 36,
    resultSummary:
      "मूल बस्तीका ४ ओटा सार्वजनिक धारा मर्मत; ३६ सहभागी; खानेपानी संस्थानको प्राविधिक सहयोग।",
    meetupNotes:
      "कीर्तिपुर मूल चोकमा भेला। खानेपानी संस्थानको प्राविधिकले प्रत्येक धारामा निर्देशन दिने।",
    linkedIssue: {
      id: "demo-issue-kirtipur-p9",
      title: "कीर्तिपुर सार्वजनिक धारा सुख्खा वा फुटेका",
      description:
        "कीर्तिपुरका ४ सार्वजनिक धारा महिनौंदेखि सुख्खा वा फुटेका; स्थानीय आमासमूहले खानेपानी ल्याउन धेरै टाढा जानुपर्ने।",
      category: "infrastructure",
      addressText: "कीर्तिपुर, काठमाडौँ",
      latitude: 27.6781,
      longitude: 85.2767,
      voteCount: 142,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/infrastructure.jpg"],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/drains.jpg",
      after: "/images/event-types/infrastructure.jpg"
    },
    testimonials: [
      {
        name: "हरि श्रेष्ठ",
        role: "संयोजक",
        quote: "खानेपानी संस्थानको प्राविधिकले सिकाएको — अब स्थानीयले आफै सानो मर्मत गर्न सक्ने भए।"
      },
      {
        name: "गीता तामाङ",
        role: "स्थानीय आमासमूह",
        quote: "धारा फेरि चल्न थाल्यो। पानी ल्याउन बिहान-बेलुका हिँड्नुपर्ने अब हटेको।"
      }
    ],
    imageSlug: "kirtipur-water",
    imagePrompt:
      "Kirtipur old town public water tap restored; women filling brass and steel water pots at the spout; a community volunteer in jeans showing a teenager how to fit a replacement washer; old brick walls and carved wooden windows framing the scene."
  },
  {
    id: "demo-past-10",
    title: "ठिमी पार्क सजावट र मूर्ति मर्मत",
    addressText: "ठिमी पार्क, मध्यपुर ठिमी",
    category: "beautification",
    thumbnailUrl: "/images/demo-events/thimi-park-done.jpg",
    scheduledAt: daysAgo(70),
    completedAt: daysAgo(70),
    durationMinutes: 300,
    meetupLatitude: 27.6822,
    meetupLongitude: 85.3858,
    leaderName: "मञ्जु तामाङ",
    participantCount: 26,
    resultSummary:
      "पार्कका ६ बेन्च मर्मत; ३ मूर्ति पेन्ट; प्रवेश गेटको साइन नवीकरण। २६ सहभागी।",
    meetupNotes:
      "ठिमी पार्क मुख्य गेटमा भेला। मूर्ति समिति र नगरपालिकाको साझेदारी।",
    linkedIssue: {
      id: "demo-issue-thimi-p10",
      title: "ठिमी पार्क पुरानो; बेन्च टुटेका, साइन फिक्का",
      description:
        "ठिमी पार्क स्थानीय बच्चा र वृद्धहरूको प्रिय ठाउँ; तर बेन्च र साइनबोर्ड वर्षौंदेखि मर्मत नभएको।",
      category: "beautification",
      addressText: "ठिमी पार्क, मध्यपुर",
      latitude: 27.6822,
      longitude: 85.3858,
      voteCount: 71,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/beautification.jpg"],
    beforeAfter: {
      before: "/images/event-types/beautification.jpg",
      after: "/images/event-types/beautification.jpg"
    },
    testimonials: [
      {
        name: "मञ्जु तामाङ",
        role: "संयोजक",
        quote: "वडाध्यक्षले औपचारिक उद्घाटन गरे; अब पार्कको दैनिक हेरचाह स्थानीयले आफै गर्ने भए।"
      }
    ],
    imageSlug: "thimi-park-done",
    imagePrompt:
      "Thimi Park in late afternoon, restored; freshly painted benches under flowering trees; children sketching the repainted statues at the centre; an elderly couple resting on a corner bench watching; old Newar brick gateway visible at the entrance."
  },
  {
    id: "demo-past-11",
    title: "नौबिसे राजमार्ग छेउ नाली सरसफाइ",
    addressText: "नौबिसे चोक, धादिङ",
    category: "infrastructure",
    thumbnailUrl: "/images/demo-events/naubise-drains.jpg",
    scheduledAt: daysAgo(18),
    completedAt: daysAgo(18),
    durationMinutes: 240,
    meetupLatitude: 27.7878,
    meetupLongitude: 85.1747,
    leaderName: "प्रदीप तामाङ",
    participantCount: 41,
    resultSummary:
      "राजमार्ग छेउको १.२ किमी नाली खुलाइयो; ४१ सहभागी; ३.८ टन माटो र फोहोर हटाइयो। यातायात व्यवस्था र नगरपालिकाको साझेदारी।",
    meetupNotes:
      "नौबिसे मूल चोक छेउ भेला। यातायातका साथीहरूले अग्रिम र ट्रक उपलब्ध गराइदिए।",
    linkedIssue: {
      id: "demo-issue-naubise-p11",
      title: "नौबिसे राजमार्ग छेउ नाली पुरिएको; यातायातमा बाधा",
      description:
        "नौबिसे चोक वरपरको राजमार्ग नाली बर्षौंदेखि सफा नभएको; वर्षायाममा सडक जलमग्न र पुरिने। यातायात अवरुद्ध हुने।",
      category: "infrastructure",
      addressText: "नौबिसे, धादिङ",
      latitude: 27.7878,
      longitude: 85.1747,
      voteCount: 88,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/infrastructure.jpg"],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/drains.jpg",
      after: "/images/event-types/infrastructure.jpg"
    },
    testimonials: [
      {
        name: "प्रदीप तामाङ",
        role: "संयोजक",
        quote: "१.२ किमी नालीमा ३.८ टन फोहोर थियो — सोचेभन्दा बढी। अब अर्को मनसुनमा सडक जलमग्न नहुने अपेक्षा।"
      },
      {
        name: "रामकुमार थापा",
        role: "यातायात व्यवसायी",
        quote: "गाडी हिलोले पुग्न नसक्ने अवस्था अब हट्यो। हाम्रो व्यवसायलाई पनि सकारात्मक।"
      }
    ],
    imageSlug: "naubise-drains",
    imagePrompt:
      "Naubise highway junction after roadside drains have been cleared; volunteers piling shovel loads of excavated dirt into a municipal tipper; long-haul trucks rolling through in the background; the western hills hazy under afternoon sun; clean concrete drain channels visible alongside the highway."
  },
  {
    id: "demo-past-12",
    title: "लामाटार सामुदायिक पार्क रोपण",
    addressText: "लामाटार, ललितपुर",
    category: "afforestation",
    thumbnailUrl: "/images/demo-events/lamatar-done.jpg",
    scheduledAt: daysAgo(90),
    completedAt: daysAgo(90),
    durationMinutes: 360,
    meetupLatitude: 27.5947,
    meetupLongitude: 85.4022,
    leaderName: "अमित गुरुङ",
    participantCount: 58,
    resultSummary:
      "सामुदायिक पार्कमा ३७० बिरुवा रोपिए — बकैनो, अप्रिकोट, सिमल। ५८ सहभागी; वडा कार्यालय र वन कार्यालयको साझेदारी।",
    meetupNotes:
      "लामाटार सामुदायिक पार्क प्रवेश गेटमा भेला। बिरुवा र पानी टीमले उपलब्ध गराएको।",
    linkedIssue: {
      id: "demo-issue-lamatar-p12",
      title: "लामाटार सामुदायिक पार्क खाली; छहारी अभाव",
      description:
        "लामाटारको नयाँ सामुदायिक पार्क १.६ हेक्टर खाली; ३ वर्षदेखि बिरुवा रोप्न नसकिएको। वडा कार्यालय र वन कार्यालयले बिरुवा र पानी उपलब्ध गराउने प्रतिबद्धता।",
      category: "afforestation",
      addressText: "लामाटार, ललितपुर",
      latitude: 27.5947,
      longitude: 85.4022,
      voteCount: 137,
      status: "COMPLETED"
    },
    photos: [
      "/images/event-types/afforestation.jpg",
      "/images/event-types/afforestation.jpg"
    ],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/empty-lands.jpg",
      after: "/images/event-types/afforestation.jpg"
    },
    testimonials: [
      {
        name: "अमित गुरुङ",
        role: "संयोजक",
        quote: "३७० बिरुवा एकै दिनमा। अब ३ महिनासम्म नियमित पानी हाल्ने टोली बनाएका छौँ।"
      },
      {
        name: "रश्मि श्रेष्ठ",
        role: "स्थानीय शिक्षक",
        quote: "विद्यार्थीहरूले पनि रोपे — अब प्रत्येक बिरुवालाई आफ्नो नाम दिए। बच्चाहरूको पार्कप्रति ओत्ती बस्यो।"
      }
    ],
    imageSlug: "lamatar-done",
    imagePrompt:
      "Lamatar community park three months after planting; rows of young saplings staked into mounded earth, just beginning to leaf out; children walking between the rows with hand-painted name tags tied to selected trees; volunteers refilling watering cans from a community tap; soft early morning light."
  },
  {
    id: "demo-past-13",
    title: "कास्की सरङ्कोट हाइकिङ ट्रेल मर्मत",
    addressText: "सरङ्कोट ट्रेल, पोखरा",
    category: "trail",
    thumbnailUrl: "/images/demo-events/sarangkot-done.jpg",
    scheduledAt: daysAgo(11),
    completedAt: daysAgo(11),
    durationMinutes: 300,
    meetupLatitude: 28.2435,
    meetupLongitude: 83.9469,
    leaderName: "बिनिता थापा",
    participantCount: 42,
    resultSummary:
      "४.५ किमी सरङ्कोट हाइकिङ ट्रेल मर्मत; ४२ सहभागी; ११ नयाँ साइनबोर्ड; इरोसन भएको २ खण्डमा ढुङ्गा फेरि मिलाइयो।",
    meetupNotes:
      "सरङ्कोट हाइकिङ प्रवेश छेउ भेला। पर्यटन समितिले औजार र खाजा उपलब्ध गराइदिए।",
    linkedIssue: {
      id: "demo-issue-sarangkot-p13",
      title: "सरङ्कोट सूर्योदय ट्रेल फोहोर र साइन गायब",
      description:
        "पोखराको प्रसिद्ध सरङ्कोट सूर्योदय व्यू ट्रेलमा साइन गायब, फोहोर र इरोसन। पर्यटक उच्च तर मर्मत नियमित नभएको।",
      category: "trail",
      addressText: "सरङ्कोट, कास्की",
      latitude: 28.2435,
      longitude: 83.9469,
      voteCount: 115,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/trail.jpg"],
    beforeAfter: {
      before: "/images/event-types/trail.jpg",
      after: "/images/event-types/trail.jpg"
    },
    testimonials: [
      {
        name: "बिनिता थापा",
        role: "संयोजक",
        quote: "अब पर्यटक हराउने डर छैन — हाइकिङ अनुभव नै फरक हुनेछ। पोखरा पर्यटनलाई पनि सहयोग।"
      }
    ],
    imageSlug: "sarangkot-done",
    imagePrompt:
      "Sarangkot ridge trail in Pokhara at sunrise after restoration; freshly mounted wooden signs and stone steps along the path; trekkers from the morning sunrise tour passing by; the Annapurna range glowing pink-gold above Phewa lake in the distance."
  },
  {
    id: "demo-past-14",
    title: "मोरङ बेलबारी सडक छेउ रोपण",
    addressText: "बेलबारी बजार, मोरङ",
    category: "afforestation",
    thumbnailUrl: "/images/demo-events/belbari-done.jpg",
    scheduledAt: daysAgo(33),
    completedAt: daysAgo(33),
    durationMinutes: 240,
    meetupLatitude: 26.5667,
    meetupLongitude: 87.4667,
    leaderName: "सुनिल मगर",
    participantCount: 37,
    resultSummary:
      "बेलबारी बजार-पथरी सडक छेउ ३.२ किमीमा २८० बिरुवा रोपिए; ३७ सहभागी; अशोक, बकैनो र असुरो।",
    meetupNotes:
      "बेलबारी बस पार्क छेउ भेला। डिभिजन वन कार्यालयले बिरुवा र ट्र्याक्टर पुर्‍याइदिए।",
    linkedIssue: {
      id: "demo-issue-belbari-p14",
      title: "बेलबारी पथरी सडक छेउ छहारीविहीन; गर्मीमा यात्रुको कष्ट",
      description:
        "मोरङको बेलबारी-पथरी सडक खण्ड लामो; गर्मीमा छहारीविहीन। वडाले बिरुवा अनुरोध गरेको लामो समयदेखि।",
      category: "afforestation",
      addressText: "बेलबारी, मोरङ",
      latitude: 26.5667,
      longitude: 87.4667,
      voteCount: 84,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/afforestation.jpg"],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/roadside.jpg",
      after: "/images/event-types/afforestation.jpg"
    },
    testimonials: [
      {
        name: "सुनिल मगर",
        role: "संयोजक",
        quote: "३ वर्षमा यो सडक छहारीले भरिने अपेक्षा छ। बेलबारी वडाले पनि नियमित पानी हाल्ने प्रतिबद्धता गऱ्यो।"
      }
    ],
    imageSlug: "belbari-done",
    imagePrompt:
      "Belbari roadside in Morang, eastern Terai; long row of young saplings staked along the road shoulder, leaves beginning to spread; a tractor parked at the end with empty sapling trays; pedestrians and bicycles passing by in the dusty afternoon."
  },
  {
    id: "demo-past-15",
    title: "काभ्रे पनौती पुरातत्व सरसफाइ",
    addressText: "पनौती पुरानो बस्ती, काभ्रे",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/panauti-done.jpg",
    scheduledAt: daysAgo(24),
    completedAt: daysAgo(24),
    durationMinutes: 240,
    meetupLatitude: 27.5786,
    meetupLongitude: 85.5239,
    leaderName: "रोहित कार्की",
    participantCount: 31,
    resultSummary:
      "पनौती मूल चोक र इन्द्रेश्वर मन्दिर परिसर सरसफाइ; ३१ सहभागी; पुरातत्व विभागको प्रतिनिधि उपस्थित।",
    meetupNotes:
      "पनौती मूल बजार चोक भेला; मन्दिर समिति र पुरातत्वले स्वागत।",
    linkedIssue: {
      id: "demo-issue-panauti-p15",
      title: "पनौती ऐतिहासिक बस्ती फोहोर र पुरातात्त्विक संरचना जोखिम",
      description:
        "काभ्रेको पनौती युनेस्को सूचीकृत पुरातात्त्विक बस्ती; तर अव्यवस्थित विसर्जनले बिग्रिँदै। पुरातत्व विभाग, मन्दिर समिति र वडाको साझेदारी।",
      category: "cleanup",
      addressText: "पनौती, काभ्रे",
      latitude: 27.5786,
      longitude: 85.5239,
      voteCount: 96,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/cleanup.jpg"],
    beforeAfter: {
      before: "/images/event-types/cleanup.jpg",
      after: "/images/event-types/cleanup.jpg"
    },
    testimonials: [
      {
        name: "रोहित कार्की",
        role: "संयोजक",
        quote: "पुरातत्व विभागको कर्मचारी उपस्थितिले हाम्रो काम झन गहन भयो — कुन ढुङ्गा छुने, कुन नछुने प्रत्यक्ष सिकाइ।"
      }
    ],
    imageSlug: "panauti-done",
    imagePrompt:
      "Panauti old town courtyard after cleaning, traditional Newar brick-and-timber architecture in the background; volunteers chatting near a freshly cleared corner; the Indreshwar temple peeking above the rooftops; soft late afternoon light catching the carved struts."
  },
  {
    id: "demo-past-16",
    title: "बारा सिमरा बस पार्क सरसफाइ",
    addressText: "सिमरा मूल बस पार्क, बारा",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/simara-done.jpg",
    scheduledAt: daysAgo(17),
    completedAt: daysAgo(17),
    durationMinutes: 240,
    meetupLatitude: 27.1611,
    meetupLongitude: 84.9844,
    leaderName: "रामकुमार यादव",
    participantCount: 29,
    resultSummary:
      "सिमरा बस पार्क र वरपर ३०० मि. सडक छेउ सफा; २९ सहभागी; २.४ टन फोहोर हटाइयो।",
    meetupNotes:
      "सिमरा बस पार्क मुख्य प्रवेश छेउ भेला; नगरले ट्रक र अग्रिम छुट्याउने सहयोग।",
    linkedIssue: {
      id: "demo-issue-simara-p16",
      title: "सिमरा बस पार्क वर्षौंदेखि फोहोरयुक्त",
      description:
        "बाराको सिमरा बस पार्क मुख्य ट्रान्जिट प्वाइन्ट; तर वर्षौंदेखि व्यवस्थित सरसफाइ नभएको। यातायात व्यवसायी सङ्घको साझेदारी।",
      category: "cleanup",
      addressText: "सिमरा, बारा",
      latitude: 27.1611,
      longitude: 84.9844,
      voteCount: 67,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/cleanup.jpg"],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/roadside.jpg",
      after: "/images/event-types/cleanup.jpg"
    },
    testimonials: [
      {
        name: "रामकुमार यादव",
        role: "संयोजक",
        quote: "यातायात व्यवसायीले पनि सहभागी भए — अब साप्ताहिक सरसफाइको योजना बनेको छ।"
      }
    ],
    imageSlug: "simara-done",
    imagePrompt:
      "Simara bus park after cleanup; tour buses lined up along the dusty terminal; municipal cart being loaded with the day's collected waste; passengers and drivers chatting near a tea stall in the cleared corner; hot Terai afternoon sun."
  },
  {
    id: "demo-past-17",
    title: "गोरखा दरबार ट्रेल मर्मत",
    addressText: "गोरखा दरबार, गोरखा",
    category: "trail",
    thumbnailUrl: "/images/demo-events/gorkha-done.jpg",
    scheduledAt: daysAgo(58),
    completedAt: daysAgo(58),
    durationMinutes: 360,
    meetupLatitude: 28.0000,
    meetupLongitude: 84.6333,
    leaderName: "देव बहादुर थापा",
    participantCount: 49,
    resultSummary:
      "गोरखा बजार देखि दरबारसम्म १,६०० सिँढी सरसफाइ र साइन मर्मत; ४९ सहभागी।",
    meetupNotes:
      "गोरखा बजार चोक भेला; पुरातत्व विभागको प्रतिनिधिले स्वागत।",
    linkedIssue: {
      id: "demo-issue-gorkha-p17",
      title: "गोरखा दरबार सिँढी जीर्ण र साइन गायब",
      description:
        "ऐतिहासिक गोरखा दरबारसम्मको पैदलमार्ग १,६०० सिँढी जीर्ण; पुरातत्व विभाग र नगरको साझेदारीमा मर्मत।",
      category: "trail",
      addressText: "गोरखा दरबार, गोरखा",
      latitude: 28.0000,
      longitude: 84.6333,
      voteCount: 138,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/trail.jpg"],
    beforeAfter: {
      before: "/images/event-types/trail.jpg",
      after: "/images/event-types/trail.jpg"
    },
    testimonials: [
      {
        name: "देव बहादुर थापा",
        role: "संयोजक",
        quote: "सिँढी मर्मतले पर्यटक अनुभव सुधार्ने मात्र होइन — ऐतिहासिक धरोहरको सम्मान पनि बढायो।"
      }
    ],
    imageSlug: "gorkha-done",
    imagePrompt:
      "Gorkha durbar stairway after restoration; long stone steps climbing the ridge with the historic palace silhouetted at the top; volunteers resting near the midpoint with water bottles; the Manaslu range visible behind the durbar in clear morning air."
  },
  {
    id: "demo-past-18",
    title: "कान्छनपुर शुक्लाफाँट बफर सरसफाइ",
    addressText: "शुक्लाफाँट बफर जोन, कान्छनपुर",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/shuklaphanta-done.jpg",
    scheduledAt: daysAgo(72),
    completedAt: daysAgo(72),
    durationMinutes: 360,
    meetupLatitude: 28.8333,
    meetupLongitude: 80.1500,
    leaderName: "बिनिता चौधरी",
    participantCount: 53,
    resultSummary:
      "शुक्लाफाँट बफर जोन ४ खण्डमा सरसफाइ; ५३ सहभागी; ३.६ टन प्लास्टिक र काँचको बोतल सङ्कलन।",
    meetupNotes:
      "शुक्लाफाँट प्रवेश पोस्ट छेउ भेला; निकुञ्ज प्रशासन र गाइडको निर्देशन।",
    linkedIssue: {
      id: "demo-issue-shuklaphanta-p18",
      title: "शुक्लाफाँट बफर जोन पर्यटक फोहोर थुप्रिएको",
      description:
        "कान्छनपुरको शुक्लाफाँट राष्ट्रिय निकुञ्ज बफर जोनमा पर्यटक र पिकनिक समूहले छोडेको फोहोर। निकुञ्ज प्रशासनको साझेदारी।",
      category: "cleanup",
      addressText: "शुक्लाफाँट, कान्छनपुर",
      latitude: 28.8333,
      longitude: 80.1500,
      voteCount: 91,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/cleanup.jpg"],
    beforeAfter: {
      before: "/images/event-types/cleanup.jpg",
      after: "/images/homepage/cleanup-areas/riverbanks.jpg"
    },
    testimonials: [
      {
        name: "बिनिता चौधरी",
        role: "संयोजक",
        quote: "निकुञ्जका पार्क रेन्जरले सहभागिता र निर्देशन दिए — संरक्षणलाई जोडिएको सरसफाइ भन्ने अनुभव।"
      }
    ],
    imageSlug: "shuklaphanta-done",
    imagePrompt:
      "Shuklaphanta buffer zone grassland in Kanchanpur after cleanup; volunteers in earth-tone clothing carrying bags of plastic out of the tall grass; park rangers in green uniform supervising; deer visible far off in the meadow; warm late afternoon sun across the savanna."
  },
  {
    id: "demo-past-19",
    title: "रामेछाप मन्थली ट्रेल मर्मत",
    addressText: "मन्थली बजार ट्रेल, रामेछाप",
    category: "trail",
    thumbnailUrl: "/images/demo-events/manthali-done.jpg",
    scheduledAt: daysAgo(82),
    completedAt: daysAgo(82),
    durationMinutes: 300,
    meetupLatitude: 27.5089,
    meetupLongitude: 86.0833,
    leaderName: "कमला अधिकारी",
    participantCount: 28,
    resultSummary:
      "मन्थली देखि सहरे डाँडा ३.८ किमी ट्रेल मर्मत; २८ सहभागी; ७ साइन र इरोसन मर्मत।",
    meetupNotes:
      "मन्थली बजार बस पार्क भेला; नगरले औजार पुर्‍याइदिए।",
    linkedIssue: {
      id: "demo-issue-manthali-p19",
      title: "मन्थली-सहरे ट्रेलमा इरोसन र साइन गायब",
      description:
        "रामेछापको मन्थली बस्ती देखि सहरे डाँडा हाइकिङ ट्रेल लामो; नियमित मर्मत नभएकोले इरोसन। नगरले अनुमति र सामग्री।",
      category: "trail",
      addressText: "मन्थली, रामेछाप",
      latitude: 27.5089,
      longitude: 86.0833,
      voteCount: 58,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/trail.jpg"],
    beforeAfter: {
      before: "/images/event-types/trail.jpg",
      after: "/images/event-types/trail.jpg"
    },
    testimonials: [
      {
        name: "कमला अधिकारी",
        role: "संयोजक",
        quote: "स्थानीय हाइकर समूहले अब साप्ताहिक चहार-मर्मत प्रतिबद्धता गऱ्यो। टिकाउ हुने सङ्केत।"
      }
    ],
    imageSlug: "manthali-done",
    imagePrompt:
      "Manthali to Sahare ridge trail in Ramechhap after restoration; fresh wooden signs along the path and packed stone reinforcing eroded sections; the broad Sun Koshi valley visible far below; cool clear post-monsoon air."
  },
  {
    id: "demo-past-20",
    title: "ताप्लेजुङ फाक्ताङ्लुङ डाँडा सरसफाइ",
    addressText: "फाक्ताङ्लुङ डाँडा, ताप्लेजुङ",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/phaktanglung-done.jpg",
    scheduledAt: daysAgo(105),
    completedAt: daysAgo(105),
    durationMinutes: 300,
    meetupLatitude: 27.5500,
    meetupLongitude: 87.7333,
    leaderName: "कर्ण शेर्पा",
    participantCount: 22,
    resultSummary:
      "फाक्ताङ्लुङ डाँडा हाइकिङ ट्रेल सरसफाइ; २२ सहभागी; ऐतिहासिक स्तूप परिसर पनि सम्मिलित।",
    meetupNotes:
      "फाक्ताङ्लुङ ट्रेल प्रवेश छेउ भेला। उच्च उचाइ; तातो लुगा अनिवार्य।",
    linkedIssue: {
      id: "demo-issue-phaktanglung-p20",
      title: "फाक्ताङ्लुङ डाँडा पर्यटक प्लास्टिकले प्रदूषित",
      description:
        "ताप्लेजुङको फाक्ताङ्लुङ डाँडा बौद्ध तीर्थस्थल; तीर्थयात्री र हाइकरले छोडेको प्लास्टिक। स्थानीय बौद्ध समिति र वडाको साझेदारी।",
      category: "cleanup",
      addressText: "फाक्ताङ्लुङ, ताप्लेजुङ",
      latitude: 27.5500,
      longitude: 87.7333,
      voteCount: 47,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/cleanup.jpg"],
    beforeAfter: {
      before: "/images/event-types/cleanup.jpg",
      after: "/images/event-types/cleanup.jpg"
    },
    testimonials: [
      {
        name: "कर्ण शेर्पा",
        role: "संयोजक",
        quote: "बौद्ध स्तूप परिसर सफा देख्दा तीर्थयात्रीले पनि आफै ध्यान दिने भएका छन्। सानो शुरुवात तर महत्वपूर्ण।"
      }
    ],
    imageSlug: "phaktanglung-done",
    imagePrompt:
      "Phaktanglung ridge in Taplejung at sunset; small whitewashed Buddhist stupa with prayer flags fluttering; volunteers in winter jackets resting after a day of collection; the eastern Himalayan ridges fading into haze."
  },
  {
    id: "demo-past-21",
    title: "दाङ देउखुरी सडक छेउ रोपण",
    addressText: "लम्ही चोक, दाङ",
    category: "afforestation",
    thumbnailUrl: "/images/demo-events/lamhi-done.jpg",
    scheduledAt: daysAgo(120),
    completedAt: daysAgo(120),
    durationMinutes: 240,
    meetupLatitude: 28.0500,
    meetupLongitude: 82.5000,
    leaderName: "अमित गुरुङ",
    participantCount: 35,
    resultSummary:
      "लम्ही-देउखुरी ४ किमी सडक छेउ ३०० बिरुवा रोपिए; ३५ सहभागी।",
    meetupNotes:
      "लम्ही चोक छेउ भेला; वडा कार्यालय र वन कार्यालयको स्वागत।",
    linkedIssue: {
      id: "demo-issue-lamhi-p21",
      title: "लम्ही-देउखुरी सडक छहारीविहीन",
      description:
        "दाङको लम्ही-देउखुरी सडक खण्ड लामो; गर्मीमा यात्रुलाई कष्ट। डिभिजन वन कार्यालयले बिरुवा र अनुमति।",
      category: "afforestation",
      addressText: "लम्ही, दाङ",
      latitude: 28.0500,
      longitude: 82.5000,
      voteCount: 76,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/afforestation.jpg"],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/empty-lands.jpg",
      after: "/images/event-types/afforestation.jpg"
    },
    testimonials: [
      {
        name: "अमित गुरुङ",
        role: "संयोजक",
        quote: "वडा कार्यालयले ३ महिनासम्म नियमित पानी हाल्ने टोली बनाएको — दिगो हुने सम्भावना बढी।"
      }
    ],
    imageSlug: "lamhi-done",
    imagePrompt:
      "Lamhi to Deukhuri road in Dang district; young saplings staked along both sides of the gravel road; a tractor moving slowly with water tank in the distance; flat Terai farmland stretching to the horizon."
  },
  {
    id: "demo-past-22",
    title: "सोलुखुम्बु लुक्ला विमानस्थल सरसफाइ",
    addressText: "लुक्ला बजार, सोलुखुम्बु",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/lukla-done.jpg",
    scheduledAt: daysAgo(48),
    completedAt: daysAgo(48),
    durationMinutes: 240,
    meetupLatitude: 27.6869,
    meetupLongitude: 86.7314,
    leaderName: "तेन्जिङ शेर्पा",
    participantCount: 31,
    resultSummary:
      "लुक्ला विमानस्थल वरपर र बजार ५०० मि. सफा; ३१ सहभागी; ट्रेकरले लाएको प्लास्टिक र क्यान सङ्कलन।",
    meetupNotes:
      "लुक्ला विमानस्थल बाहिर चोक भेला; SPCC र पर्यटन समितिको स्वागत।",
    linkedIssue: {
      id: "demo-issue-lukla-p22",
      title: "लुक्ला वरपर ट्रेकर प्लास्टिक",
      description:
        "एभरेस्ट ट्रेक प्रारम्भिक विन्दु लुक्ला; ट्रेकरले फालेका प्लास्टिक र क्यान। SPCC (सगरमाथा प्रदूषण नियन्त्रण समिति) र पर्यटन समितिको साझेदारी।",
      category: "cleanup",
      addressText: "लुक्ला, सोलुखुम्बु",
      latitude: 27.6869,
      longitude: 86.7314,
      voteCount: 158,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/cleanup.jpg"],
    beforeAfter: {
      before: "/images/event-types/cleanup.jpg",
      after: "/images/event-types/cleanup.jpg"
    },
    testimonials: [
      {
        name: "तेन्जिङ शेर्पा",
        role: "संयोजक",
        quote: "SPCC सँगै काम गर्दा ट्रेकर समूहलाई पनि स्पष्ट सन्देश गयो — अब लुक्ला सफा राख्ने जिम्मेवारी सबैको।"
      }
    ],
    imageSlug: "lukla-done",
    imagePrompt:
      "Lukla airstrip in Solukhumbu after cleanup; the famous sloped runway in the foreground with prayer flags strung along it; volunteers and SPCC staff in red jackets carrying bagged waste toward a transport area; snow-dusted peaks visible in the high distance."
  },
  {
    id: "demo-past-23",
    title: "मुस्ताङ मार्फा गाउँ सरसफाइ",
    addressText: "मार्फा बजार, मुस्ताङ",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/marpha-done.jpg",
    scheduledAt: daysAgo(98),
    completedAt: daysAgo(98),
    durationMinutes: 240,
    meetupLatitude: 28.7500,
    meetupLongitude: 83.6833,
    leaderName: "पासाङ लामा",
    participantCount: 24,
    resultSummary:
      "मार्फा गाउँ बस्ती र वरपर पैदलमार्ग सरसफाइ; २४ सहभागी; ऐतिहासिक भवनहरूको परिसर सम्मिलित।",
    meetupNotes:
      "मार्फा गाउँ मूल चोक भेला; गाउँ समितिले स्वागत र खाजा।",
    linkedIssue: {
      id: "demo-issue-marpha-p23",
      title: "मार्फा ऐतिहासिक गाउँ बस्ती फोहोर",
      description:
        "मुस्ताङको मार्फा ऐतिहासिक बस्ती; पर्यटक र ट्रेकरले छोडेका फोहोर। ACAP र गाउँ समितिको साझेदारी।",
      category: "cleanup",
      addressText: "मार्फा, मुस्ताङ",
      latitude: 28.7500,
      longitude: 83.6833,
      voteCount: 89,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/cleanup.jpg"],
    beforeAfter: {
      before: "/images/event-types/cleanup.jpg",
      after: "/images/event-types/cleanup.jpg"
    },
    testimonials: [
      {
        name: "पासाङ लामा",
        role: "संयोजक",
        quote: "मार्फाको पुरानो बजार सडक सफा देख्दा गाउँले र पर्यटक दुवैले फरक अनुभव पाए।"
      }
    ],
    imageSlug: "marpha-done",
    imagePrompt:
      "Marpha village in Mustang with whitewashed flat-roofed houses lining the cobbled main street; volunteers sweeping the lane while villagers in traditional dress watch from doorways; apple trees in the side garden; dry high-altitude sun and crisp shadows."
  },
  {
    id: "demo-past-24",
    title: "धनकुटा हिले बजार सरसफाइ",
    addressText: "हिले बजार, धनकुटा",
    category: "cleanup",
    thumbnailUrl: "/images/demo-events/hile-done.jpg",
    scheduledAt: daysAgo(63),
    completedAt: daysAgo(63),
    durationMinutes: 240,
    meetupLatitude: 27.0167,
    meetupLongitude: 87.3500,
    leaderName: "लक्ष्मी राई",
    participantCount: 26,
    resultSummary:
      "हिले बजार र नाली २०० मि. सफा; २६ सहभागी; १.८ टन फोहोर हटाइयो।",
    meetupNotes:
      "हिले बजार मूल चोक भेला; नगरले औजार र ट्रक उपलब्ध।",
    linkedIssue: {
      id: "demo-issue-hile-p24",
      title: "हिले बजार र नाली अव्यवस्थित",
      description:
        "धनकुटाको हिले बजार मुख्य ट्रान्जिट प्वाइन्ट; तर वर्षौंदेखि व्यवस्थित सरसफाइ नभएको। नगर र व्यापारी सङ्घको साझेदारी।",
      category: "cleanup",
      addressText: "हिले, धनकुटा",
      latitude: 27.0167,
      longitude: 87.3500,
      voteCount: 62,
      status: "COMPLETED"
    },
    photos: ["/images/event-types/cleanup.jpg"],
    beforeAfter: {
      before: "/images/homepage/cleanup-areas/drains.jpg",
      after: "/images/event-types/cleanup.jpg"
    },
    testimonials: [
      {
        name: "लक्ष्मी राई",
        role: "संयोजक",
        quote: "व्यापारीहरूले पनि सहयोग गरे; अब साप्ताहिक सरसफाइको योजना बनेको छ।"
      }
    ],
    imageSlug: "hile-done",
    imagePrompt:
      "Hile bazaar in Dhankuta after cleanup; the main bazaar lane lined with painted wooden shopfronts and tea shops; volunteers and shopkeepers chatting near a parked municipal cart loaded with cleared waste; cool eastern hills hazy in the distance."
  }
];

export function getDemoPastEvents() {
  if (!isDev()) return [];
  return DEMO_PAST_EVENTS.map(hydrateEventLinkedIssue);
}

export function getDemoAllEvents() {
  if (!isDev()) return { live: [], upcoming: [], past: [] };
  return {
    live: DEMO_LIVE_EVENTS.map(hydrateEventLinkedIssue),
    upcoming: DEMO_UPCOMING_EVENTS.map(hydrateEventLinkedIssue),
    past: DEMO_PAST_EVENTS.map(hydrateEventLinkedIssue)
  };
}

// --- Demo DRAFT events (no leader yet, nomination phase) -------------
// A small set of campaigns waiting on a community-elected leader.
// Surfaces the LeaderNominationPanel (roadmap 3.4.2 + 3.4.3) without
// needing a real backend.
const DEMO_DRAFT_EVENTS = [
  {
    id: "demo-draft-1",
    title: "बल्खु बजार सरसफाइ",
    addressText: "बल्खु चोक, काठमाडौँ",
    category: "cleanup",
    status: "DRAFT",
    meetupAddress: "बल्खु चोक, काठमाडौँ",
    meetupLatitude: 27.6841,
    meetupLongitude: 85.2861,
    meetupNotes:
      "मस्यौदा अभियान — संयोजक तय हुनेबित्तिकै मिति र विवरण तय गरिनेछ।",
    eventLeader: { name: null },
    eventLeaderId: null,
    rolesNeeded: DEMO_ROSTER,
    linkedIssue: {
      id: "demo-issue-balkhu-1",
      title: "बल्खु बजार छेउ फोहोरको चाङ; मनसुनमा नाली पुरिने",
      description:
        "बल्खु बजार र वरपरको खण्ड वर्षौंदेखि नियमित सरसफाइ नभएको। हाटको दिनहरूमा फोहोर थुप्रिएर वर्षायाममा नालीहरू पुरिने। नगर र व्यापार समितिले सामग्री र अग्रिमको प्रतिबद्धता।",
      category: "cleanup",
      addressText: "बल्खु, काठमाडौँ",
      latitude: 27.6841,
      longitude: 85.2861,
      voteCount: 54,
      status: "PROMOTED"
    },
    nominations: [
      {
        id: "nom-balkhu-rohit",
        memberId: "demo-member-rohit",
        memberName: "रोहित कार्की",
        voteCount: 7,
        votedByMe: false,
        createdAt: daysAgo(4)
      },
      {
        id: "nom-balkhu-stmita",
        memberId: "demo-member-smita",
        memberName: "स्मिता शर्मा",
        voteCount: 7,
        votedByMe: false,
        createdAt: daysAgo(3)
      },
      {
        id: "nom-balkhu-binita",
        memberId: "demo-member-binita",
        memberName: "बिनिता थापा",
        voteCount: 3,
        votedByMe: false,
        createdAt: daysAgo(2)
      }
    ]
  },
  {
    id: "demo-draft-2",
    title: "टेकु घाट सरसफाइ",
    addressText: "टेकु, काठमाडौँ",
    category: "cleanup",
    status: "DRAFT",
    // Promoted with no WANT_TO_LEAD volunteers, so leader voting opened in the
    // recruitment (SEEKING) window — exercises the live self-nominate flow.
    leaderVotingStatus: "SEEKING",
    meetupAddress: "टेकु घाट, काठमाडौँ",
    meetupLatitude: 27.6939,
    meetupLongitude: 85.3009,
    meetupNotes:
      "मस्यौदा अभियान — कसैले संयोजन गर्न अघि सरेपछि मिति र विवरण तय हुनेछ।",
    eventLeader: { name: null },
    eventLeaderId: null,
    rolesNeeded: DEMO_ROSTER,
    linkedIssue: {
      id: "demo-issue-teku-1",
      title: "टेकु घाट वरपर फोहोरको चाङ; नदी किनार बिग्रँदै",
      description:
        "टेकु घाटको नदी किनारमा वर्षौंदेखि फोहोर थुप्रिएको। स्थानीयले सरसफाइ अभियान चाहेका; नगरले सोहोर्ने सामग्री र फोहोर उठाउने प्रबन्धमा सहयोगको प्रतिबद्धता।",
      category: "cleanup",
      addressText: "टेकु, काठमाडौँ",
      latitude: 27.6939,
      longitude: 85.3009,
      voteCount: 38,
      status: "PROMOTED"
    },
    nominations: [
      {
        id: "nom-teku-anil",
        memberId: "demo-member-anil",
        memberName: "अनिल मगर",
        voteCount: 0,
        votedByMe: false,
        createdAt: daysAgo(1)
      }
    ]
  }
];

export function getDemoDraftEvents() {
  if (!isDev()) return [];
  return DEMO_DRAFT_EVENTS;
}

// Lookup for the event-detail page so demo-* IDs can resolve to a
// payload without hitting the backend. Handles live, upcoming, past,
// and draft demo events.
export function getDemoEventById(id) {
  if (!isDev()) return null;

  const draft = DEMO_DRAFT_EVENTS.find((event) => event.id === id);
  if (draft) {
    return {
      ...draft,
      issue: attachIssueTranslations(draft.linkedIssue) || null,
      uploads: [],
      photos: [],
      resultSummary: null
    };
  }

  const live = DEMO_LIVE_EVENTS.find((event) => event.id === id);
  if (live) {
    const linkedIssue = attachIssueTranslations(live.linkedIssue);
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
      issue: linkedIssue || null,
      linkedIssue: linkedIssue || null,
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
    const linkedIssue = attachIssueTranslations(upcoming.linkedIssue);
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
      issue: linkedIssue || null,
      linkedIssue: linkedIssue || null,
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
    const linkedIssue = attachIssueTranslations(past.linkedIssue);
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
      issue: linkedIssue || null,
      linkedIssue: linkedIssue || null,
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
      np: "बागमती नदी सरसफाइ अहिले लाइभ प्रसारण भइरहेको छ।",
      en: "Bagmati cleanup is streaming live right now."
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

// --- Threaded comments mock -----------------------------------------
// Deterministic per-target comment thread, shared shape for issues and
// events. Each pool entry is a node tree (author + text + optional
// `replies` recursing up to 3 levels). getDemoComments() picks 2-4
// threads per target keyed off the targetId hash and emits the flat
// canonical shape consumed by [src/lib/comments.js](src/lib/comments.js):
//   { id, targetType, targetId, parentId, depth, author:{id,name,role},
//     text, mentions, reactions, createdAt }
// Same hashed seed → same thread set forever; different ids → different
// sets, so /issues/a and /issues/b never look identical.

const DEMO_ISSUE_THREAD_POOL = [
  {
    author: { name: "कमला अधिकारी", role: "स्थानीय बासिन्दा" },
    text: "यो ठाउँ अब फेरि सफा देख्ने आशा गरेँ। कुनै मद्दत चाहिए मलाई पनि भन्नुहोला।",
    replies: [
      {
        author: { name: "हरि श्रेष्ठ", role: "स्वयंसेवक" },
        text: "मेरो टोलले सुक्रबार बेलुका २ घण्टा निकाल्न सक्छ। औजार पनि छ।",
        replies: [
          {
            author: { name: "कमला अधिकारी", role: "स्थानीय बासिन्दा" },
            text: "धन्यवाद! साथीहरूलाई पनि सुनाउँछु। ४ बजे भेला हुने त?"
          }
        ]
      },
      {
        author: { name: "रोहित कार्की", role: "नक्शा र समन्वय" },
        text: "ड्रोन तस्बिर अघि र पछिको — मसँग छ। प्रमाण कागजमा राख्न सजिलो।"
      }
    ]
  },
  {
    author: { name: "रिता पाण्डे", role: "नगर वार्ड समर्थक" },
    text: "वडा कार्यालयलाई औपचारिक खबर पठाएको छु — फोहोर ट्रकको व्यवस्था हुनेछ।",
    replies: [
      {
        author: { name: "स्मिता शर्मा", role: "शिक्षक" },
        text: "विद्यार्थीहरूलाई पनि ल्याउने तरिका सोचौँ — सिकाइको पाठ पनि हुन्छ।"
      }
    ]
  },
  {
    author: { name: "प्रदीप तामाङ", role: "पुरानो सहभागी" },
    text: "अघिको अभियानमा प्रयोग गरेको रजिस्टर र चेकलिस्ट छन्। चाहिए शेयर गरौँला।"
  },
  {
    author: { name: "बिनिता थापा", role: "स्थानीय व्यवसायी" },
    text: "मेरो पसलबाट चिया र पानीको बन्दोबस्त मिल्छ। दिन निश्चित भएपछि भन्नुहोला।",
    replies: [
      {
        author: { name: "रिता पाण्डे", role: "नगर वार्ड समर्थक" },
        text: "धन्यवाद! आइतबार बिहान ७ बजेबाट सुरु गर्ने सोचमा छौँ।"
      }
    ]
  },
  {
    author: { name: "गणेश राई", role: "फोटोग्राफर" },
    text: "अघि-पछिको तस्बिरका लागि म नि:शुल्क सेवा दिन्छु। तपाईंहरूको कामलाई दस्तावेजीकरण गर्न सकिन्छ।"
  }
];

const DEMO_EVENT_THREAD_POOL = [
  {
    author: { name: "हरि श्रेष्ठ", role: "स्वयंसेवक" },
    text: "मलाई पुर्ण समय आउन मिल्ने भयो। औजार आफूसँग ल्याउनुपर्ने हो?",
    replies: [
      {
        author: { name: "कमला अधिकारी", role: "संयोजक" },
        text: "पन्जा र मास्क लिएर आउनुहोस् — बाँकी टोलीले व्यवस्था गर्छ।",
        replies: [
          {
            author: { name: "हरि श्रेष्ठ", role: "स्वयंसेवक" },
            text: "ठिक छ, धन्यवाद!"
          }
        ]
      },
      {
        author: { name: "सुनिल मगर", role: "स्वयंसेवक" },
        text: "मलाई पनि अभियानमा सहभागी हुनु छ। नयाँ हुँ — पहिलो पटक।"
      }
    ]
  },
  {
    author: { name: "रोहित कार्की", role: "नक्शा र समन्वय" },
    text: "भेला हुने ठाउँ देखि कार्य स्थलसम्म कति टाढा हो? पैदल मिल्छ?",
    replies: [
      {
        author: { name: "कमला अधिकारी", role: "संयोजक" },
        text: "१० मिनेट पैदल — सबै सँगै हिँड्छौँ। हराउने डर छैन।"
      }
    ]
  },
  {
    author: { name: "स्मिता शर्मा", role: "शिक्षक" },
    text: "विद्यालयका ८ जना विद्यार्थी पनि ल्याउँदै छु। सहभागिता प्रमाणपत्र पाइन्छ कि?"
  },
  {
    author: { name: "गणेश राई", role: "फोटोग्राफर" },
    text: "लाइभ-स्ट्रीम र फोटो डकुमेन्टेशन मसँग छ। बिहान ६:४५ मा पुग्छु — सेटअपका लागि।",
    replies: [
      {
        author: { name: "अमित गुरुङ", role: "लाइभस्ट्रिमर" },
        text: "म पनि त्यही समय। सँगै सेटअप गरौँ।"
      }
    ]
  },
  {
    author: { name: "मञ्जु तामाङ", role: "स्वयंसेवक" },
    text: "मेरो साथमा सानो ट्रक छ — सामान ओसार्न मद्दत गर्न सक्छु।"
  }
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

// English translations for demo issues, keyed by issue id. Used by
// attachIssueTranslations() to build the bilingual translations[] array
// that mirrors the real API shape. Items absent from this map fall back
// to re-using the Nepali title/description as the EN entry — a known
// degraded state that still renders something readable.
const DEMO_ISSUE_EN_TRANSLATIONS = {
  // --- DEMO_LIVE_EVENTS linkedIssues -------------------------------
  "demo-issue-bagmati-1": {
    title: "Bagmati riverbank choked with litter",
    description:
      "The 500-metre stretch upstream of Teenkune Bridge fills with plastic and debris every monsoon. With more than 1,200 daily pedestrians along the bank, local businesses report rising mosquito complaints and stench. Today's drive will separate plastics, collect inorganics, and lay groundwork for ongoing monitoring."
  },
  "demo-issue-kamal-5": {
    title: "Kamal Pokhari walkway murals and signage outdated",
    description:
      "A 500-m stretch of the Kamal Pokhari walkway has faded murals and missing wayfinding. The municipality has issued permits for 8 new murals and 4 fresh signboards. Local artists have prepared designs; volunteers will paint and refinish on the day."
  },
  "demo-issue-tree-3": {
    title: "Tree plantation drive at the Surya Binayak slope",
    description:
      "A 0.8-hectare bare slope behind Surya Binayak Temple is at landslide risk. The municipality is providing chilaune, uttis and apricot saplings free of charge. We plant, fence the saplings, and commit to a 3-month watering rotation."
  },
  "demo-issue-hanumante-l4": {
    title: "Hanumante river at Lokanthali silting up with waste again",
    description:
      "Just 60 days after the last drive, plastic is piling up again — most of it carried downstream from upper reaches. This round pairs collection with riverbank signage to discourage repeat dumping."
  },
  "demo-issue-fewa-l5": {
    title: "South shore of Phewa Lake polluted by drifting plastic",
    description:
      "Plastic from upstream washes ashore on the south bank during monsoon. The Pokhara tourism merchants' committee and the ward are partnering with local boatmen to retrieve floating waste alongside the on-shore sweep."
  },
  "demo-issue-taumadhi-l6": {
    title: "Taumadhi Square heritage zone littered and disorganised",
    description:
      "Tourists and locals alike leave waste at Taumadhi Square, where modern plastic mixes with the carved stone fragments around the temple steps. The Department of Archaeology has approved a careful sorting and cleanup."
  },
  "demo-issue-nagarkot-l7": {
    title: "Nagarkot sunrise trail missing signs and showing erosion",
    description:
      "The 2.8-km trail from Nagarkot to the sunrise viewpoint has lost five signposts and shows erosion at three switchbacks. The tourism committee is providing materials and permits."
  },
  "demo-issue-dharan-l8": {
    title: "Waste piles at Dharan haat-bazaar after every market day",
    description:
      "Every Tuesday and Friday haat day, the Dharan bazaar leaves heaps of organic and packaging waste behind. A five-year search for a lasting fix; this round starts the evening of haat day and aims to finish before the next one begins."
  },
  "demo-issue-hetauda-l9": {
    title: "Ratna Park east section bare; no shade in summer heat",
    description:
      "The 0.4-hectare eastern section of Hetauda's Ratna Park has no canopy — park-goers struggle in summer. In partnership with the forest office and municipality, we plant bakaino and asuro saplings."
  },
  "demo-issue-sankhu-l10": {
    title: "Bajrayogini temple grounds and street fronts littered",
    description:
      "Daily offerings and tourist plastic accumulate around the historic Bajrayogini temple at Sankhu. The temple committee and ward are partnering on a twice-weekly cleanup rotation."
  },
  "demo-issue-sauraha-l11": {
    title: "Sauraha buffer zone polluted by visitor plastic",
    description:
      "Chitwan National Park's Sauraha buffer zone — high tourist footfall has produced a plastic-waste problem. Critical habitat for rhinos and elephants, so cleanup is urgent."
  },
  "demo-issue-panchthar-l12": {
    title: "Tree plantation needed at the Ome ridge",
    description:
      "The Ome ridge in Panchthar is bare, raising landslide risk during monsoon. The Division Forest Office has supplied 300 saplings — chilaune and uttis."
  },
  "demo-issue-nuwakot-l13": {
    title: "Nuwakot palace grounds disorganised and littered",
    description:
      "The historic seven-storey palace at Nuwakot has not seen organised cleanup in years. The Department of Archaeology has authorised a careful sort-and-clear operation."
  },
  "demo-issue-manang-l14": {
    title: "Chame–Manang trail signs missing; trekkers go astray",
    description:
      "On the Chame–Manang circuit trail, 18 directional signs have gone missing and ACAP's maintenance has lapsed — trekkers occasionally lose the path. ACAP and the local guide association are partnering on this drive."
  },
  "demo-issue-syangja-l15": {
    title: "Pandav Cave grounds and interior piling up with litter",
    description:
      "The historic Pandav Cave is Syangja's main tourist site. Visitors leave plastic outside and, more troubling, inside the cave's dark recesses. The tourism committee is supporting this cleanup."
  },

  // --- DEMO_UPCOMING_EVENTS linkedIssues ---------------------------
  "demo-issue-ratna-1": {
    title: "Ratnapark grounds and roadside trash problem",
    description:
      "Ratnapark is the central public space in the city, but fortnight-long litter accumulation has made the grounds and roadside unpleasant for the 10,000+ daily walkers. The municipality is supplying trucks; we sort, bag, and load."
  },
  "demo-issue-tripureshwar-2": {
    title: "Riverbank stabilisation near Tripureshwar Bridge",
    description:
      "Both banks near Tripureshwar Bridge have eroded — landslide risk in monsoon. The forest office is providing 300 saplings (bakaino, ritha, apricot) free. We plant, then organise a 3-month watering rotation."
  },
  "demo-issue-trail-3": {
    title: "Gokarneshwar trail: erosion, missing signs, and litter",
    description:
      "The 4.2-km hiking trail from Gokarneshwar to Shivapuri has three core problems — four signs missing, erosion at two switchbacks, and tourist plastic strewn along the route. This day covers signage, stonework, and waste collection."
  },
  "demo-issue-school-4": {
    title: "Shree Durga Devi Secondary School: 320 students, building in disrepair",
    description:
      "The school walls have not been painted in six years; two toilet doors are broken; the library ceiling leaks. 320 students affected. The School Management Committee will cover paint and materials; we contribute labour and coordination."
  },
  "demo-issue-school-2": {
    title: "Shree Janapriya Secondary: wall painting and library repair",
    description:
      "The main building has not been painted in eight years; three library windows are broken. 480 students affected. The SMC is committed to materials; we organise the labour and time."
  },
  "demo-issue-swayambhu-6": {
    title: "Swayambhu eastern stairway worn and littered",
    description:
      "Swayambhu's eastern 365-step stairway has cracking upper sections, and tourists and pilgrims leave plastic on the lower steps. The Federation of Buddhist Communities and the Department of Archaeology have authorised the cleanup and repair."
  },
  "demo-issue-pashupati-7": {
    title: "Aryaghat area littered with offerings and packaging",
    description:
      "The area around Aryaghat at Pashupatinath accumulates offerings and unsorted disposal weekly. Periodic clearance is approved by the Pashupati Area Development Fund."
  },
  "demo-issue-lumbini-8": {
    title: "Lumbini entrance road bare; summer travel is gruelling",
    description:
      "The 3 km eastern approach to the sacred area at Lumbini is treeless, leaving Buddhist pilgrims and locals exposed during summer. The Lumbini Development Trust has provided saplings and approvals."
  },
  "demo-issue-janakpur-9": {
    title: "Janakpur Ram Janaki temple grounds and pond littered",
    description:
      "Daily devotees leave waste around the Ram Janaki temple and at the Agnishala pond. This drive is a partnership between the temple committee and the municipality."
  },
  "demo-issue-ilam-10": {
    title: "Trail through Kanyam tea gardens not visitor-ready",
    description:
      "The Kanyam tea gardens are a major tourist draw, but the 5 km walking trail has missing signs, erosion patches, and accumulated litter. Run jointly with the tea growers' association and the tourism committee."
  },
  "demo-issue-muglin-11": {
    title: "Muglin bazaar drains blocked; chronic monsoon flooding",
    description:
      "Muglin sits at the junction of major highways, but its main drains have not been cleared in years. Every monsoon, the bus park and nearby shops flood. The municipality is supplying loaders and trucks."
  },
  "demo-issue-tansen-12": {
    title: "Tansen Durbar grounds bare-walled and dated",
    description:
      "Tansen Durbar is Palpa's flagship heritage site — its compound walls are unpainted and parts have unauthorised graffiti. The Department of Archaeology has approved the work; local artists have prepared Mithila and Newari-inspired designs."
  },
  "demo-issue-bardia-13": {
    title: "Bardia National Park buffer zone polluted by visitor plastic",
    description:
      "Visitors and picnic groups leave plastic at the Bardia buffer zone, posing a risk to wildlife. Park administration and the buffer zone users' committee are partnering on this drive."
  },
  "demo-issue-surkhet-14": {
    title: "Bulbule waterfall trail damaged and signage missing",
    description:
      "Surkhet's Bulbule waterfall is a regional draw, but two trail sections have collapsed and signboards are missing. The municipality has approved tools and new lampposts along the trail."
  },
  "demo-issue-okhal-15": {
    title: "Shree Jaljala Secondary unpainted for seven years",
    description:
      "Shree Jaljala Secondary in Okhaldhunga has not been painted in seven years; 240 students affected. The SMC is covering paint and materials; we contribute labour and time."
  },
  "demo-issue-galchhi-16": {
    title: "Prithvi Highway near Galchhi treeless; dust and summer heat",
    description:
      "The 4 km highway stretch from Galchhi toward Malekhu is bare — bus passengers and locals suffer through summer. Plan: plant 350 saplings."
  },

  // --- Standalone + draft event linkedIssues -----------------------
  "demo-issue-lakeside-1": {
    title: "Plastic litter along the Lakeside shoreline",
    description: "Long stretches of the Lakeside walking promenade have collected plastic carried in by the wind off Phewa Lake."
  },
  "demo-issue-shivapuri-1": {
    title: "Shivapuri trail in need of repair",
    description: "Sections of the popular hiking trail through Shivapuri National Park have eroded and lost wayfinding."
  },
  "demo-issue-balkhu-1": {
    title: "Balkhu bazaar trash piles up; monsoon drains clog",
    description:
      "Balkhu and the surrounding stretch have not seen regular cleanup in years. Haat-day rubbish accumulates and the drains clog every monsoon. The municipality and the merchants' association have committed materials and a loader."
  }
};

// Attach a translations[] array to a demo issue so the localizeIssue()
// helper can render it in the requested language. Keeps the top-level
// title/description in place as a safety net for any caller that hasn't
// been migrated to the localized helper yet.
export function attachIssueTranslations(issue) {
  if (!issue || !issue.id) return issue;
  if (Array.isArray(issue.translations) && issue.translations.length > 0) {
    return issue;
  }
  const enOverride = DEMO_ISSUE_EN_TRANSLATIONS[issue.id];
  return {
    ...issue,
    translations: [
      {
        locale: "en",
        title: enOverride?.title || issue.title || "",
        description: enOverride?.description || issue.description || ""
      },
      {
        locale: "ne",
        title: issue.title || "",
        description: issue.description || ""
      }
    ]
  };
}

// Vote-count history mini-trend (8 data points). Used by the sparkline
// on /issues/[id]. Deterministic from issue id so the curve doesn't
// twitch between renders.
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

// Curated emoji set used to seed reactions on demo comments. Subset of
// the picker palette — these are the ones that feel natural on
// volunteer-coordination chatter. Phase 2 of the comment system.
const SEED_REACTION_EMOJIS = ["👏", "🌱", "❤️", "🙏", "💪", "🎉", "🌟", "🔥"];

// Hash-deterministic seed reactions for a single comment. We want the
// same comment to always have the same reaction set + counts across
// reloads, so we derive both from the comment id.
function seedReactionsForId(id) {
  const h = hashStringToInt(id);
  const emojiCount = 1 + (h % 3); // 1-3 distinct emojis per seeded comment
  const out = {};
  for (let i = 0; i < emojiCount; i += 1) {
    const emoji = SEED_REACTION_EMOJIS[(h + i * 31) % SEED_REACTION_EMOJIS.length];
    // 2-15 count per emoji — feels populated without looking botted.
    const count = 2 + ((h >> (i + 1)) % 14);
    out[emoji] = (out[emoji] || 0) + count;
  }
  return out;
}

// Walk a seed thread node into the flat canonical comment shape.
// `idPath` segments are joined with "-" → comment ids are stable per
// (targetType, targetId, threadIdx, nesting path), so the same target
// always renders the same tree, including reply ordering.
function flattenSeedThread({ node, parentId, depth, targetType, targetId, idPath, headMinAgo }) {
  if (!node || typeof node !== "object") return [];
  const id = `${targetType}:${targetId}:s-${idPath}`;
  const out = [
    {
      id,
      targetType,
      targetId,
      parentId,
      depth,
      author: {
        // Seed comments belong to no real user → id namespaced so the
        // canEdit/canDelete checks never accidentally treat them as
        // owned by the current viewer.
        id: `seed:${node.author?.name || "anon"}`,
        name: node.author?.name || "—",
        role: node.author?.role || null
      },
      text: node.text || "",
      mentions: [],
      reactions: seedReactionsForId(id),
      createdAt: minutesAgoIso(Math.max(1, headMinAgo))
    }
  ];
  const replies = Array.isArray(node.replies) ? node.replies : [];
  // Each reply lags its parent by 4-12 minutes so the transcript reads
  // naturally and "Newest" sort (Phase 3) does the right thing.
  replies.forEach((reply, i) => {
    out.push(
      ...flattenSeedThread({
        node: reply,
        parentId: id,
        depth: Math.min(depth + 1, 2),
        targetType,
        targetId,
        idPath: `${idPath}-${i}`,
        headMinAgo: headMinAgo - (4 + i * 8)
      })
    );
  });
  return out;
}

// Returns a flat list of canonical comments for the given target. The
// list is intentionally NOT sorted — `buildTree()` in
// [src/lib/comments.js](src/lib/comments.js) handles ordering per depth.
export function getDemoComments({ targetType, targetId } = {}) {
  if (!isDev()) return [];
  if (!targetType || !targetId) return [];
  const pool = targetType === "event" ? DEMO_EVENT_THREAD_POOL : DEMO_ISSUE_THREAD_POOL;
  if (!pool.length) return [];
  const h = hashStringToInt(`${targetType}:${targetId}`);
  const threadCount = 2 + (h % 3); // 2-4 threads per target
  const start = h % pool.length;
  const flat = [];
  for (let i = 0; i < threadCount; i += 1) {
    const node = pool[(start + i) % pool.length];
    const headMinAgo = 15 + i * 95 + (h % 30);
    flat.push(
      ...flattenSeedThread({
        node,
        parentId: null,
        depth: 0,
        targetType,
        targetId,
        idPath: `${i}`,
        headMinAgo
      })
    );
  }
  return flat;
}

// --- Transparency ledger mock (roadmap Phase 6) ----------------------
// Donations + expenses against past events. Anonymous donors mixed
// with named ones; in-kind + funds entries; bank/Esewa/Khalti channel
// mix. Inert in production.

function hashSeed(s) {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const DEMO_DONOR_POOL = [
  "कमला अधिकारी",
  "हरि श्रेष्ठ",
  "रिता पाण्डे",
  "प्रदीप तामाङ",
  "स्मिता शर्मा",
  "रोहित कार्की",
  "बिनिता थापा",
  "गणेश राई",
  "सुनिल मगर",
  "मञ्जु तामाङ",
  null,
  null,
  "तारा गुरुङ",
  "लक्ष्मी राई",
  null,
  "देव बहादुर थापा",
  "अमित गुरुङ"
];

const DEMO_VENDORS = [
  "नगरपालिका कार्यालय",
  "हार्डवेयर पसल — रत्नपार्क",
  "जलपान केन्द्र",
  "ट्रान्सपोर्ट सेवा",
  "औषधि पसल",
  "हाटको खुद्रा",
  "नर्सरी आपूर्ति"
];

const DONATION_CHANNELS = ["ESEWA", "KHALTI", "BANK", "IN_KIND", "OTHER"];
const EXPENSE_KINDS = [
  "TOOLS",
  "MATERIALS",
  "TRANSPORT",
  "REFRESHMENTS",
  "PERMITS",
  "MEDICAL",
  "OTHER"
];

function buildLedgerForPastEvents() {
  if (!isDev()) return { donations: [], expenses: [] };
  const donations = [];
  const expenses = [];
  DEMO_PAST_EVENTS.forEach((event) => {
    const seed = hashSeed(event.id);
    const completedAt = event.completedAt
      ? new Date(event.completedAt).getTime()
      : Date.now();
    const donationCount = 3 + (seed % 5);
    for (let i = 0; i < donationCount; i += 1) {
      const donorPick = (seed + i * 11) % DEMO_DONOR_POOL.length;
      const channel = DONATION_CHANNELS[(seed + i * 7) % DONATION_CHANNELS.length];
      const isInKind = channel === "IN_KIND";
      const amount = isInKind ? null : 500 + ((seed + i * 173) % 19) * 250;
      donations.push({
        id: `don-${event.id}-${i}`,
        eventId: event.id,
        kind: isInKind ? "MATERIALS" : "FUNDS",
        amount,
        currency: "NPR",
        description: isInKind ? "पन्जा, मास्क, पानी — सामग्री दान" : null,
        donorName: DEMO_DONOR_POOL[donorPick],
        channel,
        receivedAt: new Date(
          completedAt - (donationCount - i) * 24 * 60 * 60_000
        ).toISOString(),
        note: null
      });
    }
    const expenseCount = 2 + (seed % 4);
    for (let i = 0; i < expenseCount; i += 1) {
      const kind = EXPENSE_KINDS[(seed + i * 13) % EXPENSE_KINDS.length];
      const amount = 300 + ((seed + i * 211) % 17) * 200;
      expenses.push({
        id: `exp-${event.id}-${i}`,
        eventId: event.id,
        kind,
        amount,
        currency: "NPR",
        description:
          kind === "TOOLS"
            ? "औजार किनेको"
            : kind === "MATERIALS"
              ? "सामग्री खरिद"
              : kind === "TRANSPORT"
                ? "ढुवानी / यातायात"
                : kind === "REFRESHMENTS"
                  ? "खाजा र पानी"
                  : kind === "PERMITS"
                    ? "अनुमति शुल्क"
                    : kind === "MEDICAL"
                      ? "प्राथमिक उपचार सामग्री"
                      : "अन्य खर्च",
        paidToName: DEMO_VENDORS[(seed + i * 5) % DEMO_VENDORS.length],
        receiptUploadId: null,
        paidAt: new Date(completedAt + (i + 1) * 60_000 * 60).toISOString()
      });
    }
  });
  return { donations, expenses };
}

let _ledgerCache = null;

export function getDemoLedger() {
  if (!isDev()) return { donations: [], expenses: [] };
  if (!_ledgerCache) _ledgerCache = buildLedgerForPastEvents();
  return _ledgerCache;
}

// --- Impact stories (roadmap 7.2) ------------------------------------
// Short narrative posts linked to past events. Inert in production.

const DEMO_STORIES = [
  {
    slug: "guheswari-cleanup-day",
    title: "गुह्येश्वरीमा एकै दिनको परिवर्तन",
    excerpt:
      "मन्दिर परिसरबाट २.८ टन फोहोर एकै दिनमा हटाइयो — ४७ सहभागीको हातले। यो कथा त्यो दिनको।",
    author: "कमला अधिकारी",
    publishedAt: "2026-05-20T10:00:00.000Z",
    coverEvent: "demo-past-1",
    body: [
      "बिहान ६ बजेमै मन्दिर परिसरमा भीड जुटिसकेको थियो। प्रत्येक सहभागी पन्जा, मास्क, र एउटा खाली बोरा बोकेर तयार।",
      "मन्दिर समितिले स्वागत गऱ्यो, चियाको प्रबन्ध भयो, र नगरले ट्रक पठाएको थियो — परन्तु काम चाहिँ हाम्रै हातले गर्ने थियौँ।",
      "तीन घण्टा पछि नदी किनार चिनिनसक्ने भएको थियो। नौ बजेसम्म त्यहाँबाट २.८ टन फोहोर हटिसकेको थियो।",
      "त्यो दिनको सबैभन्दा सुन्दर पाटो थियो — मन्दिर पुजारीले हाम्रो टोलीलाई भनेका कुरा: 'अब अर्को महिनासम्म यो ठाउँ यस्तै राख्ने जिम्मा हाम्रो।'",
      "श्रमदान भनेको एक दिनको अभियान मात्र होइन। समुदायको अपनत्व बढाउने माध्यम पनि हो।"
    ]
  },
  {
    slug: "shivapuri-480-saplings",
    title: "शिवपुरीमा ४८० बिरुवा — एक बिहानको योगदान",
    excerpt:
      "निकुञ्ज प्रशासन र ६२ सहभागीको साझेदारीमा एकै बिहान ४८० बिरुवा रोपिए।",
    author: "हरि श्रेष्ठ",
    publishedAt: "2026-05-06T08:00:00.000Z",
    coverEvent: "demo-past-2",
    body: [
      "शिवपुरी निकुञ्जको दक्षिणी छेउ १.२ हेक्टर खाली ठाउँ देख्दा सबैको मन कुटुक्कै लाग्थ्यो।",
      "त्यो ठाउँमा निकुञ्ज प्रशासन र हाम्रो टोली मिलेर ४८० बिरुवा रोप्यौं। चिलाउने, उत्तिस, र अप्रिकोट — तीन प्रजाति, मिश्रित रोपण।",
      "बच्चाबच्चीहरूले पनि भाग लिए। एउटी सानी छोरीले आमालाई भनिन्: 'आमा, यो रुख ठूलो भएपछि म फेरि आउँछु। हेर्न।'",
      "त्यही नै हो श्रमदानको अर्थ — आफ्ना सन्तान सम्म पुग्ने योगदान।"
    ]
  },
  {
    slug: "sinamangal-180m-walk",
    title: "सिनामंगल फुटपाथ — हिँड्न मिल्ने सडक",
    excerpt:
      "टुटेका फुटपाथ र ढलेका सडक बत्ती — एकै दिनमा १८० मिटर मर्मत।",
    author: "रिता पाण्डे",
    publishedAt: "2026-04-19T14:00:00.000Z",
    coverEvent: "demo-past-3",
    body: [
      "सिनामंगल चोकको पूर्व दिशा ३ वर्षदेखि हिँडुवालाई सकस थियो। फुटपाथ टुटेर सडकमा झर्ने अवस्था; ४ ओटा बत्ती ढलेका।",
      "नगरले निर्माण सामग्री ल्याइदियो। हाम्रो टोलीले श्रम जुटायो। २८ सहभागी, ५ घण्टा।",
      "अब हिँड्न पाइन्छ। साँझ बत्ती बल्छ। एक स्थानीय बासिन्दाले भने: 'फुटपाथमै हिँड्न पाउँदा सडकको हर्न पनि कम सुनिन्छ।'"
    ]
  },
  {
    slug: "hanumante-4-tons",
    title: "हनुमन्ते खोला — ४.२ टन प्लास्टिक हटायौँ",
    excerpt:
      "१.५ किमी खोला किनार सफा; ५४ सहभागी; ४.२ टन फोहोर सङ्कलन।",
    author: "प्रदीप तामाङ",
    publishedAt: "2026-04-04T07:00:00.000Z",
    coverEvent: "demo-past-4",
    body: [
      "हनुमन्ते खोलाले बर्षायाममा बगाएर ल्याएको प्लास्टिक लोकन्थली पुल छेउमा थुप्रिएको थियो।",
      "तीन टोलीमा बाँडिएर ५४ सहभागीले ५ घण्टामा १.५ किमी सफा गऱ्यौँ। ट्रक तीन फेरामा भरियो।",
      "अब खोला बर्षात स्वतन्त्र बग्न सक्छ। पुलमुनिको जाम पनि कम हुनेछ। यो दीर्घकालीन समाधानको पहिलो खुड्किलो थियो।",
      "एक सहभागीले भने: 'मेरी आमा अर्को पटक आउनुहुने भयो। पूरा परिवार आउँछ।'"
    ]
  },
  {
    slug: "why-we-do-this",
    title: "किन गर्छौँ श्रमदान",
    excerpt:
      "हरेक अभियान पछाडि एउटा कारण छ — सरकार पर्खिएर बस्न मिल्दैन भन्ने अनुभव।",
    author: "श्रमेश",
    publishedAt: "2026-03-15T09:00:00.000Z",
    coverEvent: null,
    body: [
      "श्रमदान भनेको एक दर्शन हो। आफ्नो समुदाय आफै बनाउने भन्ने सोच।",
      "देशका हरेक समस्या सरकारको प्रतीक्षा गरेर समाधान हुँदैन। साना-साना हातहरू मिलेर ठूला परिवर्तन सम्भव हुन्छ।",
      "श्रमदान मञ्च त्यही प्रयासको आधुनिक रूप हो — स्थानीय समस्या रिपोर्ट गर्न, समुदायको समर्थन जुटाउन, र अभियान सुरु गर्न।",
      "हामी पारदर्शी छौँ — हरेक रुपैयाँ, हरेक घण्टा, हरेक सहभागी सार्वजनिक रूपमा देखिन्छ। यो विश्वासको आधार हो।"
    ]
  }
];

export function getDemoStories() {
  if (!isDev()) return [];
  return DEMO_STORIES;
}

// --- Community polls (roadmap 14.3) ----------------------------------
// Public-facing votes on open product decisions. Each poll links
// (optionally) back to a roadmap leaf via `roadmapLeafId`.

const DEMO_POLLS = [
  {
    slug: "next-event-category-priority",
    titleNp: "अर्को अभियानको प्रकार के होस्?",
    titleEn: "What should the next campaign type prioritize?",
    descriptionNp:
      "श्रमदान अभियानको अर्को लहर कुन प्रकारमा बढी लगानी गर्ने भन्नेमा समुदायको आवाज।",
    descriptionEn:
      "Which campaign category should the next wave of शृमदान invest in?",
    scope: "feature",
    options: [
      {
        id: "afforestation",
        labelNp: "वृक्षारोपण",
        labelEn: "Afforestation",
        voteCount: 134
      },
      {
        id: "infrastructure",
        labelNp: "विद्यालय / पूर्वाधार मर्मत",
        labelEn: "School / infrastructure repair",
        voteCount: 142
      },
      {
        id: "cleanup",
        labelNp: "नदी सरसफाइ",
        labelEn: "Riverbank cleanup",
        voteCount: 98
      },
      {
        id: "trail",
        labelNp: "ट्रेल मर्मत",
        labelEn: "Hiking trail repair",
        voteCount: 64
      }
    ],
    roadmapLeafId: null,
    closesAt: "2026-08-31T18:00:00.000Z"
  },
  {
    slug: "first-payment-rail",
    titleNp: "Phase 5 मा कुन भुक्तानी मार्ग पहिले?",
    titleEn: "Which payment rail should Phase 5 ship first?",
    descriptionNp:
      "Phase 5 अन्तर्गत Esewa, Khalti, बैंक ट्रान्सफर, वा विदेशी दान — कुन एकीकरण पहिले बनाउने भन्नेमा तपाईंको मत।",
    descriptionEn:
      "Within Phase 5, which payment rail should we wire up first — eSewa, Khalti, bank transfer, or foreign donations?",
    scope: "feature",
    options: [
      { id: "esewa", labelNp: "eSewa", labelEn: "eSewa", voteCount: 87 },
      { id: "khalti", labelNp: "Khalti", labelEn: "Khalti", voteCount: 79 },
      {
        id: "bank",
        labelNp: "बैंक ट्रान्सफर",
        labelEn: "Bank transfer",
        voteCount: 41
      },
      {
        id: "foreign",
        labelNp: "विदेशी दान (SWC)",
        labelEn: "Foreign donations (SWC)",
        voteCount: 28
      }
    ],
    roadmapLeafId: "5.4",
    closesAt: "2026-07-15T18:00:00.000Z"
  },
  {
    slug: "homepage-pulse-style",
    titleNp: "गृहपृष्ठमा सामुदायिक नब्ज कस्तो देखियोस्?",
    titleEn: "How should the homepage community pulse look?",
    descriptionNp:
      "ImpactPulseStrip लाई गृहपृष्ठमा कुन शैलीमा embed गर्ने — सानो stat strip, ठूलो hero panel, वा छुट्टै section?",
    descriptionEn:
      "How should ImpactPulseStrip embed on the home page — small stat strip, large hero panel, or its own section?",
    scope: "design",
    options: [
      {
        id: "strip",
        labelNp: "Hero मुनी सानो stat strip",
        labelEn: "Small stat strip under the hero",
        voteCount: 56
      },
      {
        id: "hero",
        labelNp: "Hero panel मै ठूलो KPI",
        labelEn: "Large KPI inside the hero panel",
        voteCount: 34
      },
      {
        id: "section",
        labelNp: "छुट्टै section तल",
        labelEn: "Separate section further down",
        voteCount: 22
      }
    ],
    roadmapLeafId: "13.3",
    closesAt: "2026-07-01T18:00:00.000Z"
  },
  {
    slug: "leader-tie-break-policy",
    titleNp: "नेतृत्व मनोनयन बराबर समर्थन भए कसले निर्णय गरोस्?",
    titleEn: "Who breaks a tie in leader nomination?",
    descriptionNp:
      "दुई वा बढी मनोनयन बराबर समर्थन पाएमा अन्तिम निर्णय कसले गरोस्?",
    descriptionEn:
      "When two or more nominations tie on supports, who should break the tie?",
    scope: "policy",
    options: [
      {
        id: "admin",
        labelNp: "प्रशासन",
        labelEn: "Admin team",
        voteCount: 31
      },
      {
        id: "runoff",
        labelNp: "रन-अफ मतदान",
        labelEn: "Run-off vote",
        voteCount: 78
      },
      {
        id: "lottery",
        labelNp: "लाटरी",
        labelEn: "Lottery",
        voteCount: 12
      },
      {
        id: "first-nominated",
        labelNp: "पहिलो मनोनयन भएको",
        labelEn: "First nominee wins",
        voteCount: 19
      }
    ],
    roadmapLeafId: "3.4.3",
    closesAt: "2026-07-20T18:00:00.000Z"
  }
];

export function getDemoPolls() {
  if (!isDev()) return [];
  return DEMO_POLLS;
}

export function getDemoPollBySlug(slug) {
  if (!isDev() || !slug) return null;
  return DEMO_POLLS.find((p) => p.slug === slug) || null;
}

export function getDemoStoryBySlug(slug) {
  if (!isDev() || !slug) return null;
  return DEMO_STORIES.find((s) => s.slug === slug) || null;
}

export function getDemoFundSummaryForEvent(eventId) {
  if (!isDev() || !eventId) {
    return {
      donatedTotal: 0,
      spentTotal: 0,
      surplus: 0,
      donationCount: 0,
      expenseCount: 0,
      inKindCount: 0
    };
  }
  const { donations, expenses } = getDemoLedger();
  const eventDonations = donations.filter((d) => d.eventId === eventId);
  const eventExpenses = expenses.filter((e) => e.eventId === eventId);
  const donatedTotal = eventDonations
    .filter((d) => d.kind === "FUNDS")
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const spentTotal = eventExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  return {
    donatedTotal,
    spentTotal,
    surplus: donatedTotal - spentTotal,
    donationCount: eventDonations.length,
    expenseCount: eventExpenses.length,
    inKindCount: eventDonations.filter((d) => d.kind !== "FUNDS").length
  };
}

