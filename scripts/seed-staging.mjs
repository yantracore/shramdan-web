#!/usr/bin/env node
// Seed the staging backend with a rich curated dataset:
// 10 members, ~20 issues, 5 LIVE + 3 upcoming + 3 past events,
// ~70 comments, ~12 volunteer applications, per-event participants,
// 1 settled + 1 open leader-voting flow, 2 feedback entries.
//
// Idempotent via scripts/.seed-manifest.json — re-runs skip already-seeded
// records. Manifest entries can be deleted to force re-seed of that slice.
//
// Phases (run in order, or independently via --phase=<name>):
//   members  → POST /auth/register × 10
//   uploads  → /uploads/presign → PUT R2 → /uploads/{id}/confirm × ~40
//   issues   → POST /issues/bulk (5 rich + 5 event-parent + 3 upcoming-parent
//              + 3 past-parent + 5 light = 21 issues)
//   events   → POST /issues/{id}/convert-to-event × 11
//              + PATCH /events/{id}/schedule (live + upcoming)
//              + POST /events/{id}/complete (past)
//              + PUT /events/{id}/role-plan (rich)
//   actions  → votes, comments, reactions, participants, applications,
//              leader-voting (1 settled + 1 open)
//   feedback → POST /feedback × 2
//
// Usage:
//   node scripts/seed-staging.mjs                 → run all phases
//   node scripts/seed-staging.mjs --phase=members → run one phase
//   node scripts/seed-staging.mjs --dry-run       → simulate
//   node scripts/seed-staging.mjs --smoke         → 1-member subset
//   node scripts/seed-staging.mjs --reset         → wipe manifest (careful)

import { readFile, writeFile, access, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, ".seed-manifest.json");
const MEDIA_DIR = join(ROOT, "public", "images", "demo-events");

const API_BASE = "https://backend.shramdan.org/api/v1";
const ADMIN = { email: "contact@yantracore.com", password: "123456" };
const MEMBER_PASSWORD = "Demo123!@#";

// ──────────────────────────────────────────────────────────────────────────
// CLI
// ──────────────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));
const DRY = !!args.dryRun;
const SMOKE = !!args.smoke;
const VERBOSE = !!args.verbose;
const PHASE = args.phase || "all";

function parseArgs(argv) {
  const out = { dryRun: false, smoke: false, verbose: false, reset: false, phase: null };
  for (const a of argv) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--smoke") out.smoke = true;
    else if (a === "--verbose" || a === "-v") out.verbose = true;
    else if (a === "--reset") out.reset = true;
    else if (a.startsWith("--phase=")) out.phase = a.slice("--phase=".length);
  }
  return out;
}

const log = (...m) => console.log(...m);
const vlog = (...m) => { if (VERBOSE) console.log(...m); };

// ──────────────────────────────────────────────────────────────────────────
// Manifest
// ──────────────────────────────────────────────────────────────────────────

const EMPTY_MANIFEST = {
  startedAt: null,
  updatedAt: null,
  members: {},      // key: slug (e.g. "arjun") → { id, email, name }
  uploads: {},      // key: filename → { id, downloadUrl, mimeType }
  issues: {},       // key: slug → { id, backendSlug, status }
  events: {},       // key: issue slug → { id, eventSlug, state, scheduledAt }
  participants: {}, // key: event slug → [ { memberEmail, role } ]
  votes: [],        // [ { memberSlug, issueSlug } ]
  comments: {},     // key: "<type>:<key>" → [ { id, memberSlug, text } ]
  applications: [], // [ { id, memberSlug, role } ]
  leaderVoting: {}, // key: event slug → { state: "settled" | "open", winner?: memberSlug }
  feedback: []      // [ { id, name } ]
};

let manifest = { ...EMPTY_MANIFEST };

async function loadManifest() {
  if (args.reset) {
    log("⚠️  --reset: starting from empty manifest (existing backend records NOT deleted)");
    manifest = { ...EMPTY_MANIFEST, startedAt: nowIso() };
    return;
  }
  try {
    const text = await readFile(MANIFEST_PATH, "utf8");
    manifest = { ...EMPTY_MANIFEST, ...JSON.parse(text) };
    log(`📋 Loaded manifest (${countManifest()} records, last updated ${manifest.updatedAt})`);
  } catch {
    manifest = { ...EMPTY_MANIFEST, startedAt: nowIso() };
    log("📋 No existing manifest — starting fresh");
  }
}

let savingNow = false;
let savePending = false;
async function saveManifest() {
  if (DRY) return;
  if (savingNow) { savePending = true; return; }
  savingNow = true;
  try {
    manifest.updatedAt = nowIso();
    const tmp = `${MANIFEST_PATH}.tmp`;
    const content = JSON.stringify(manifest, null, 2);
    // Atomic write via rename + retry on Windows file locks
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        await writeFile(tmp, content, "utf8");
        const { rename } = await import("node:fs/promises");
        await rename(tmp, MANIFEST_PATH);
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await sleep(120 * (attempt + 1));
      }
    }
  } finally {
    savingNow = false;
    if (savePending) { savePending = false; setTimeout(() => saveManifest(), 0); }
  }
}

function countManifest() {
  return (
    Object.keys(manifest.members).length +
    Object.keys(manifest.uploads).length +
    Object.keys(manifest.issues).length +
    Object.keys(manifest.events).length +
    Object.values(manifest.comments).reduce((s, a) => s + a.length, 0) +
    manifest.applications.length +
    manifest.votes.length +
    manifest.feedback.length
  );
}

function nowIso() {
  return new Date().toISOString();
}

// ──────────────────────────────────────────────────────────────────────────
// API helpers
// ──────────────────────────────────────────────────────────────────────────

let adminToken = null;
const memberTokens = new Map(); // memberSlug → accessToken

async function adminLogin() {
  if (adminToken) return adminToken;
  if (DRY) { adminToken = "DRY_RUN_ADMIN_TOKEN"; return adminToken; }
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ADMIN)
  });
  const body = await res.json();
  if (!res.ok || !body?.data?.accessToken) {
    throw new Error(`Admin login failed: ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  }
  adminToken = body.data.accessToken;
  vlog(`🔐 Admin token acquired (len ${adminToken.length})`);
  return adminToken;
}

async function memberLogin(memberSlug, email) {
  if (memberTokens.has(memberSlug)) return memberTokens.get(memberSlug);
  if (DRY) { memberTokens.set(memberSlug, `DRY_${memberSlug}`); return memberTokens.get(memberSlug); }
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: MEMBER_PASSWORD })
  });
  const body = await res.json();
  if (!res.ok || !body?.data?.accessToken) {
    throw new Error(`Member login failed (${memberSlug}): ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  }
  memberTokens.set(memberSlug, body.data.accessToken);
  return body.data.accessToken;
}

async function api(method, path, { token, body, retries = 2 } = {}) {
  if (DRY) {
    vlog(`   [DRY] ${method} ${path}`);
    return { success: true, data: { id: `dry-${Math.random().toString(36).slice(2, 10)}` } };
  }
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (err) {
      // Network/transport errors only — retry these
      if (attempt >= retries) throw err;
      vlog(`   ⚠️ retry ${attempt + 1} (network): ${err.message}`);
      await sleep(500 * (attempt + 1));
      continue;
    }
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-json body */ }
    if (!res.ok) {
      const msg = `${method} ${path} → ${res.status}: ${text.slice(0, 300)}`;
      // Retry only 5xx and 429; surface 4xx immediately
      if (attempt < retries && (res.status >= 500 || res.status === 429)) {
        vlog(`   ⚠️ retry ${attempt + 1} (${res.status}): ${msg.slice(0, 120)}`);
        await sleep(500 * (attempt + 1));
        continue;
      }
      throw new Error(msg);
    }
    return json;
  }
  throw new Error("unreachable");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ──────────────────────────────────────────────────────────────────────────
// Fixtures — Members (10)
// ──────────────────────────────────────────────────────────────────────────

const MEMBERS = [
  { slug: "arjun",   name: "Arjun Shrestha",      email: "arjun.seed@shramdan.org",   phone: "+9779820100001" },
  { slug: "maya",    name: "Maya Tamang",         email: "maya.seed@shramdan.org",    phone: "+9779820100002" },
  { slug: "bishnu",  name: "Bishnu Adhikari",     email: "bishnu.seed@shramdan.org",  phone: "+9779820100003" },
  { slug: "ramesh",  name: "Ramesh Karki",        email: "ramesh.seed@shramdan.org",  phone: "+9779820100004" },
  { slug: "sita",    name: "Sita Gurung",         email: "sita.seed@shramdan.org",    phone: "+9779820100005" },
  { slug: "hari",    name: "Hari KC",             email: "hari.seed@shramdan.org",    phone: "+9779820100006" },
  { slug: "priya",   name: "Priya Lama",          email: "priya.seed@shramdan.org",   phone: "+9779820100007" },
  { slug: "suman",   name: "Suman Rai",           email: "suman.seed@shramdan.org",   phone: "+9779820100008" },
  { slug: "anjali",  name: "Anjali Magar",        email: "anjali.seed@shramdan.org",  phone: "+9779820100009" },
  { slug: "bikash",  name: "Bikash Thapa",        email: "bikash.seed@shramdan.org",  phone: "+9779820100010" }
];

// ──────────────────────────────────────────────────────────────────────────
// Fixtures — Issues (21 total)
// ──────────────────────────────────────────────────────────────────────────
// `cover` is the local filename in public/images/demo-events/ that should be
// uploaded as the issue cover. `gallery` lists additional photos that get
// uploaded but are kept for later attachment to event galleries.

const ISSUES = [
  // ─── 5 rich standalone issues ──────────────────────────────────────────
  {
    slug: "shankhamul-bagmati-plastic",
    title: "शङ्खमुलमा बागमतीमा प्लास्टिक र स्टाइरोफोम थुप्रिएको",
    description: "शङ्खमुल पुलको दक्षिणी छेउ बागमती किनारको ३०० मिटर खण्डमा प्लास्टिक थैला, स्टाइरोफोम र पानीमा नफुट्ने फोहोर थुप्रिएको छ। माथिल्लो खण्डबाट बजारिया फोहोर बगेर यहाँ अड्किने क्रम जारी छ। स्थानीय बासिन्दा, मन्दिर समिति र वडा सबैले गुनासो गरिरहेका छन्। चार-पाँच दिने अभियानमा छुट्टाछुट्टै टोलीले फोहोर सङ्कलन गर्ने र नदी किनारमा साइनबोर्ड लगाएर अघिल्लो बासिन्दालाई पनि चेतावनी दिने योजना।",
    language: "ne",
    category: "RIVERBANK",
    latitude: 27.6803,
    longitude: 85.3270,
    addressText: "शङ्खमुल पुल, काठमाडौँ",
    cover: "bagmati-tree-line.jpg",
    role: "rich-standalone"
  },
  {
    slug: "boudha-ring-road-trash",
    title: "Bouddha Ring Road किनार फोहोरले अव्यवस्थित",
    description: "Bouddha Stupa बाहिरी Ring Road को १.२ कि.मि. खण्डमा सडक छेउ ठाउँठाउँ फोहोर, पुराना टायर र निर्माण सामग्री छरिएको छ। पर्यटक नियमित आउने यो ठाउँको पहिलो प्रभाव खराब परिरहेको। स्थानीय व्यापार सङ्घले सहयोग गर्ने भनेका छन्; नगरपालिकाले ट्रक उपलब्ध गराउने सहमति भएको।",
    language: "ne",
    category: "ROADSIDE",
    latitude: 27.7212,
    longitude: 85.3618,
    addressText: "Bouddha Ring Road, काठमाडौँ",
    cover: "boudha-done.jpg",
    role: "rich-standalone"
  },
  {
    slug: "asan-main-bazaar-blocked",
    title: "असन मेन बजार पैदलयात्रीले धाकिएको — फोहोर र अव्यवस्थित बिक्री",
    description: "असन चोकको मेन बजार खण्ड व्यापारीहरूको सामान र फोहोरले भरिएर पैदलयात्रीको हिँडाइ अप्ठेरो भएको। हरेक दिन अनुमानित ८,००० व्यक्ति आउजाउ गर्ने यो ठाउँमा सुरक्षा र स्वच्छता दुवै कमजोर। नगरपालिका, स्थानीय बजार समिति र हाम्रो टोलीले मिलेर सामान व्यवस्थापन र फोहोर सङ्कलन गर्ने योजना।",
    language: "ne",
    category: "ROADSIDE",
    latitude: 27.7095,
    longitude: 85.3122,
    addressText: "असन बजार, काठमाडौँ",
    cover: "gaur-bazaar.jpg",
    role: "rich-standalone"
  },
  {
    slug: "traffic-chowk-drain-jam",
    title: "ट्राफिक चोक छेउको ढल जाम — मनसुनमा खतरा",
    description: "ट्राफिक चोकको पश्चिमी छेउको मूल ढल पुरानो र पेट्रोलेरी कारणले बारम्बार जाम भइरहेको। पानी पर्दा सडकमा फर्केर बग्ने, यातायात ठप्प हुने, र पैदलयात्रीलाई पनि असुविधा। पाइप मर्मत र बायाँ छेउमा थप ढाल लगाउने काम तत्कालै चाहिएको।",
    language: "ne",
    category: "DRAINAGE",
    latitude: 27.7041,
    longitude: 85.3145,
    addressText: "ट्राफिक चोक, काठमाडौँ",
    cover: "naubise-drains.jpg",
    role: "rich-standalone"
  },
  {
    slug: "sarangkot-sunrise-trail-trash",
    title: "सारंकोट सूर्योदय पदमार्गमा यात्रीले छाडेको फोहोर",
    description: "सारंकोट दृश्यबिन्दु तर्फ जाने पदमार्ग सूर्योदय हेर्न आउने हजारौँ यात्रीले छाडेको प्लास्टिक बोतल, खाजाको खाली प्याकेट र चुरोटले भरिएको छ। पर्यटन प्रवर्द्धन समिति, स्थानीय गाइड र हाम्रो स्वयंसेवक मिलेर हरेक १५ दिनमा सरसफाइ गर्ने योजना; पहिलो चरण यो अभियान।",
    language: "ne",
    category: "HIKING_TRAIL",
    latitude: 28.2434,
    longitude: 83.9482,
    addressText: "सारंकोट दृश्यबिन्दु, पोखरा",
    cover: "antu-trail.jpg",
    role: "rich-standalone"
  },

  // ─── 5 rich event-parent issues (will convert to LIVE events) ──────────
  {
    slug: "bagmati-tinkune-cleanup",
    title: "बागमती नदी किनार अव्यवस्थित फोहोर",
    description: "तीनकुने पुल अघिको ५०० मिटर खण्ड वर्षायाममा फोहोर र प्लास्टिकले भरिएको छ। नदी किनार सङ्ग दैनिक १,२०० भन्दा बढी हिँडुवा यात्रु; स्थानीय व्यवसायहरूले बढ्दो मच्छर र दुर्गन्धको गुनासो गरिरहेका छन्। आजको सरसफाइले प्लास्टिक छुट्याउने, अजैविक सङ्कलन, र दीर्घकालीन निगरानीको आधार बनाउनेछ।",
    language: "ne",
    category: "RIVERBANK",
    latitude: 27.6749,
    longitude: 85.3491,
    addressText: "तीनकुने पुल, ललितपुर",
    cover: "bagmati-cleanup.jpg",
    gallery: ["bagmati-tree-line.jpg"],
    video: "bagmati-cleanup.mp4",
    role: "rich-event-live"
  },
  {
    slug: "kamalpokhari-beautification",
    title: "कमलपोखरी पैदलमार्ग भित्ता र साइनबोर्ड पुराना",
    description: "कमलपोखरी ५०० मि. पैदलमार्ग पुरानो र अदृश्य। नगरपालिकाले अनुमति दिएको; ८ भित्ता चित्र र ४ साइनबोर्ड नयाँ बनाउने। स्थानीय कलाकारहरूले डिजाइन तयार पारेका — सहभागीहरूले पेन्ट र चित्रकोलोले रङ हाल्ने।",
    language: "ne",
    category: "PARK_PUBLIC_SPACE",
    latitude: 27.7155,
    longitude: 85.3260,
    addressText: "कमलपोखरी पैदलमार्ग, काठमाडौँ",
    cover: "kamalpokhari-beautify.jpg",
    gallery: ["durga-devi-paint.jpg"],
    video: "kamalpokhari-beautify.mp4",
    role: "rich-event-live"
  },
  {
    slug: "suryabinayak-afforestation",
    title: "सूर्यविनायक खाली ढिक्कामा वृक्षारोपण",
    description: "सूर्यविनायक मन्दिर पछाडिको खाली ढिक्का (०.८ हेक्टर) पहिरो जोखिममा। नगरपालिकाले निःशुल्क बिरुवा (चिलाउने, उत्तिस, अप्रिकोट) उपलब्ध गराउने भनेको। हाम्रो काम: रोप्ने, सुरक्षा घेरा हाल्ने, ३ महिनासम्म पानी हाल्ने प्रतिबद्धता।",
    language: "ne",
    category: "VACANT_LAND",
    latitude: 27.6566,
    longitude: 85.4366,
    addressText: "सूर्यविनायक नगर, भक्तपुर",
    cover: "suryabinayak-trees.jpg",
    gallery: ["bagmati-tree-line.jpg"],
    video: "suryabinayak-trees.mp4",
    role: "rich-event-live"
  },
  {
    slug: "hanumante-lokanthali-cleanup",
    title: "हनुमन्ते खोला लोकन्थली खण्डमा फोहोर पुनः थुप्रिएको",
    description: "अघिल्लो अभियानको ६० दिनमा पुनः फोहोर थुप्रिने क्रम जारी छ — माथिल्लो किनारबाट बगेर आउने प्लास्टिक मुख्य कारण। यो पटक सङ्कलनसँगै किनार किनारका साइनबोर्ड पनि लगाउने।",
    language: "ne",
    category: "RIVERBANK",
    latitude: 27.6766,
    longitude: 85.3804,
    addressText: "लोकन्थली पुल, ललितपुर",
    cover: "hanumante-live.jpg",
    gallery: ["hanumante-cleanup-done.jpg"],
    video: "hanumante-live.mp4",
    role: "rich-event-live"
  },
  {
    slug: "fewa-shoreline-cleanup",
    title: "फेवातालको दक्षिणी किनार प्लास्टिकले प्रदूषित",
    description: "बर्षायाममा माथिल्लो खण्डबाट बगेर आउने प्लास्टिक तालको दक्षिणी छेउमा थुप्रिने। पर्यटन व्यवसायी समिति र वडाको साझेदारी; डुङ्गा र अग्रिम छुट्याउने काम स्थानीयले।",
    language: "ne",
    category: "RIVERBANK",
    latitude: 28.2096,
    longitude: 83.9586,
    addressText: "फेवाताल दक्षिणी किनार, पोखरा",
    cover: "fewa-cleanup.jpg",
    gallery: ["fewa-cleanup-poster.jpg"],
    video: "fewa-cleanup.mp4",
    role: "rich-event-live"
  },

  // ─── 3 upcoming-event parent issues ────────────────────────────────────
  {
    slug: "nagarkot-trail-upcoming",
    title: "नागरकोट पदयात्रा मार्ग सरसफाइ",
    description: "नागरकोट दृश्यबिन्दु तर्फको पदयात्रा मार्ग यात्रीको प्लास्टिक र खाजा बाँकीले अव्यवस्थित। पर्यटन व्यवसायी र स्थानीय युवा क्लबको साझेदारीमा अर्को साता सरसफाइ।",
    language: "ne",
    category: "HIKING_TRAIL",
    latitude: 27.7150,
    longitude: 85.5212,
    addressText: "नागरकोट दृश्यबिन्दु, भक्तपुर",
    cover: "nagarkot-trail.jpg",
    role: "upcoming-event"
  },
  {
    slug: "taumadhi-heritage-cleanup",
    title: "तौमढी स्क्वायर सम्पदा मर्मत",
    description: "भक्तपुरको तौमढी स्क्वायर ढुङ्गा मार्ग र मूर्ति आधार पुराना र फोहोरले भरिएका। सम्पदा संरक्षण समितिको निगरानीमा मर्मत र सरसफाइ अभियान।",
    language: "ne",
    category: "PARK_PUBLIC_SPACE",
    latitude: 27.6710,
    longitude: 85.4280,
    addressText: "तौमढी स्क्वायर, भक्तपुर",
    cover: "taumadhi-heritage.jpg",
    role: "upcoming-event"
  },
  {
    slug: "dharan-bazaar-cleanup",
    title: "धरान बजार छेउछाउ सरसफाइ",
    description: "धरान भन्दिकोनेर बजार खण्डमा फोहोर र अव्यवस्थित बिक्रीको समस्या लामो समयदेखि। स्थानीय वडा र बजार समितिको आग्रहमा संयुक्त सरसफाइ।",
    language: "ne",
    category: "ROADSIDE",
    latitude: 26.8124,
    longitude: 87.2817,
    addressText: "धरान भन्दिकोनेर बजार, सुनसरी",
    cover: "dharan-bazaar.jpg",
    role: "upcoming-event"
  },

  // ─── 3 past-event parent issues ────────────────────────────────────────
  {
    slug: "hile-village-cleanup-past",
    title: "हिले गाउँ सरसफाइ अभियान",
    description: "हिले बजार खण्ड पुरानो र फोहोरले अव्यवस्थित थियो। गाउँपालिका र युवा क्लबको पहलमा एक दिने अभियान।",
    language: "ne",
    category: "ROADSIDE",
    latitude: 27.0427,
    longitude: 87.2825,
    addressText: "हिले बजार, धनकुटा",
    cover: "hile-done.jpg",
    role: "past-event"
  },
  {
    slug: "panauti-temple-cleanup-past",
    title: "पनौती मन्दिर परिसर सरसफाइ",
    description: "पनौती मन्दिर परिसर र छेउछाउको पैदलमार्ग वर्षायाममा अव्यवस्थित। समुदाय र सम्पदा समितिको साझेदारीमा सम्पन्न।",
    language: "ne",
    category: "PARK_PUBLIC_SPACE",
    latitude: 27.5851,
    longitude: 85.5210,
    addressText: "पनौती मन्दिर, काभ्रे",
    cover: "panauti-done.jpg",
    role: "past-event"
  },
  {
    slug: "gorkha-darbar-cleanup-past",
    title: "गोरखा पुरानो दरबार परिसर सरसफाइ",
    description: "गोरखा दरबार पुगेका यात्रीले छाडेको फोहोर र पैदलमार्ग किनारको सरसफाइ। पुरातत्व विभागको अनुमतिमा सम्पन्न।",
    language: "ne",
    category: "PARK_PUBLIC_SPACE",
    latitude: 28.0044,
    longitude: 84.6298,
    addressText: "गोरखा दरबार परिसर, गोरखा",
    cover: "gorkha-done.jpg",
    role: "past-event"
  },

  // ─── 5 light standalone issues ─────────────────────────────────────────
  {
    slug: "bardia-buffer-zone-trash",
    title: "बर्दिया बफर जोनमा फोहोर",
    description: "बर्दिया राष्ट्रिय निकुञ्जको बफर जोनमा यात्री र स्थानीयको फोहोर मिश्रित। वनजन्तुलाई पनि हानि पुग्न सक्ने।",
    language: "ne",
    category: "OTHER",
    latitude: 28.4000,
    longitude: 81.4000,
    addressText: "बर्दिया बफर जोन, बर्दिया",
    cover: "bardia-buffer.jpg",
    role: "light-standalone"
  },
  {
    slug: "ghodaghodi-lake-shore",
    title: "घोडाघोडी ताल किनार सरसफाइ चाहिएको",
    description: "घोडाघोडी सिमसार क्षेत्रको किनार किनारमा पर्यटक र स्थानीयको फोहोर बढ्दो। आद्रभूमि संरक्षणको चिन्ता।",
    language: "ne",
    category: "RIVERBANK",
    latitude: 28.6826,
    longitude: 80.9489,
    addressText: "घोडाघोडी ताल, कैलाली",
    cover: "ghodaghodi-lake.jpg",
    role: "light-standalone"
  },
  {
    slug: "khaptad-trail-trash",
    title: "खप्तड पदयात्रा मार्गमा फोहोर",
    description: "खप्तड राष्ट्रिय निकुञ्ज भित्रको पदयात्रा मार्गमा यात्रीले छाडेका प्लास्टिक र क्यानहरू। चित्र खिच्ने ठाउँहरूमा बढी।",
    language: "ne",
    category: "HIKING_TRAIL",
    latitude: 29.3970,
    longitude: 81.1570,
    addressText: "खप्तड पदयात्रा मार्ग, बझाङ",
    cover: "khaptad-trail.jpg",
    role: "light-standalone"
  },
  {
    slug: "melamchi-riverbank-trash",
    title: "मेलम्ची नदी किनार फोहोर",
    description: "मेलम्ची बजार छेउको नदी किनारमा निर्माण फोहोर र घरेलु फोहोर मिश्रित। पानीको गुणस्तरमा प्रभाव।",
    language: "ne",
    category: "RIVERBANK",
    latitude: 27.8470,
    longitude: 85.5670,
    addressText: "मेलम्ची बजार, सिन्धुपाल्चोक",
    cover: "melamchi-riverbank.jpg",
    role: "light-standalone"
  },
  {
    slug: "manang-trail-cleanup-needed",
    title: "मनाङ पदयात्रा मार्गमा फोहोर बढ्दो",
    description: "मनाङ क्षेत्रमा बढ्दो ट्रेकर सङ्ख्यासँगै फोहोर पनि बढिरहेको। उचाइमा फोहोर व्यवस्थापन गाह्रो छ; स्थानीय गाइड र संरक्षण क्षेत्रको साझा पहल चाहिएको।",
    language: "ne",
    category: "HIKING_TRAIL",
    latitude: 28.6680,
    longitude: 84.0200,
    addressText: "मनाङ पदयात्रा मार्ग, मनाङ",
    cover: "manang-trail.jpg",
    role: "light-standalone"
  }
];

// ──────────────────────────────────────────────────────────────────────────
// Fixtures — Events (11: 5 LIVE + 3 upcoming + 3 past)
// ──────────────────────────────────────────────────────────────────────────

const EVENTS = [
  // ─── 5 LIVE (scheduledAt ~30-100 min in past, no completion) ───────────
  {
    issueSlug: "bagmati-tinkune-cleanup",
    state: "live",
    minutesAgo: 37,
    durationMinutes: 180,
    meetupNotes: "तीनकुने पुलको दक्षिणी छेउमा भेला हुने। पन्जा र मास्क लिएर आउनुहोस् — टीमले अरू सामग्री ल्याउँछ।",
    rolePlan: { WORKER: 8, PHOTOGRAPHER: 1, LIVESTREAMER: 1, MEDIC: 1, SAFETY_LEAD: 1, LOGISTICS: 1 },
    leaderVoting: "settled", // arjun wins
    leaderCandidates: ["arjun", "suman"],
    leaderWinner: "arjun"
  },
  {
    issueSlug: "kamalpokhari-beautification",
    state: "live",
    minutesAgo: 22,
    durationMinutes: 240,
    meetupNotes: "कमलपोखरी मन्दिर छेउ भेला। पैदलमार्गको दुई किनारका ८ ठाउँमा भित्ता चित्र।",
    rolePlan: { WORKER: 6, PHOTOGRAPHER: 1, LIVESTREAMER: 1, SAFETY_LEAD: 1, LOGISTICS: 1 },
    leaderVoting: "open", // unsettled, votes still coming
    leaderCandidates: ["bishnu", "suman"]
  },
  {
    issueSlug: "suryabinayak-afforestation",
    state: "live",
    minutesAgo: 102,
    durationMinutes: 200,
    meetupNotes: "सूर्यविनायक मन्दिर परिसरको पश्चिम गेटमा भेला। बिरुवा, चित्रकोलो, पानी, हलुका खाजा सब टीमले ल्याउँछ।",
    rolePlan: { WORKER: 10, PHOTOGRAPHER: 1, MEDIC: 1, SAFETY_LEAD: 1, LOGISTICS: 2 }
  },
  {
    issueSlug: "hanumante-lokanthali-cleanup",
    state: "live",
    minutesAgo: 18,
    durationMinutes: 180,
    meetupNotes: "लोकन्थली पुलको पूर्वी किनारमा भेला हुने। तीन टोलीमा बाँडिने।",
    rolePlan: { WORKER: 7, PHOTOGRAPHER: 1, LIVESTREAMER: 1, MEDIC: 1, SAFETY_LEAD: 1 }
  },
  {
    issueSlug: "fewa-shoreline-cleanup",
    state: "live",
    minutesAgo: 64,
    durationMinutes: 240,
    meetupNotes: "बारही टोलको ताल किनार पैदलमार्गमा भेला हुने। डुङ्गा प्रयोग गरेर पानीमा तैरिने प्लास्टिक पनि सङ्कलन।",
    rolePlan: { WORKER: 8, PHOTOGRAPHER: 1, LIVESTREAMER: 1, MEDIC: 1, SAFETY_LEAD: 1, LOGISTICS: 2 }
  },

  // ─── 3 upcoming (scheduledAt in future) ────────────────────────────────
  {
    issueSlug: "nagarkot-trail-upcoming",
    state: "upcoming",
    daysAhead: 3,
    durationMinutes: 240,
    meetupNotes: "नागरकोट दृश्यबिन्दुको मूल गेटमा भेला। राम्रो जुत्ता र पानी आफै ल्याउनुहोस्।"
  },
  {
    issueSlug: "taumadhi-heritage-cleanup",
    state: "upcoming",
    daysAhead: 7,
    durationMinutes: 200,
    meetupNotes: "तौमढी स्क्वायरको दक्षिणी छेउमा भेला। ब्रश र पेन्ट टीमले ल्याउँछ।"
  },
  {
    issueSlug: "dharan-bazaar-cleanup",
    state: "upcoming",
    daysAhead: 10,
    durationMinutes: 180,
    meetupNotes: "धरान भन्दिकोनेर बजार चोकमा भेला हुने।"
  },

  // ─── 3 past (completed events) ────────────────────────────────────────
  {
    issueSlug: "hile-village-cleanup-past",
    state: "past",
    daysAgo: 14,
    durationMinutes: 180,
    meetupNotes: "हिले बजार चोकमा भेला हुने।",
    resultSummary: "१४ स्वयंसेवक, ६० किलो फोहोर सङ्कलन। बजार खण्ड स्पष्ट र साइनबोर्ड पनि नयाँ।",
    attendeeCount: 14
  },
  {
    issueSlug: "panauti-temple-cleanup-past",
    state: "past",
    daysAgo: 28,
    durationMinutes: 240,
    meetupNotes: "पनौती मन्दिर मूल गेटमा भेला हुने।",
    resultSummary: "२२ स्वयंसेवक, मन्दिर परिसर र पैदलमार्ग दुवै सरसफाइ। ८५ किलो फोहोर सङ्कलन।",
    attendeeCount: 22
  },
  {
    issueSlug: "gorkha-darbar-cleanup-past",
    state: "past",
    daysAgo: 45,
    durationMinutes: 300,
    meetupNotes: "गोरखा दरबार मूल गेटमा भेला हुने।",
    resultSummary: "१८ स्वयंसेवक, ७० किलो फोहोर सङ्कलन। पुरातत्व विभाग र स्थानीय व्यवसायीहरू सहभागी।",
    attendeeCount: 18
  }
];

// ──────────────────────────────────────────────────────────────────────────
// Fixtures — Participants per event (memberSlug → role)
// ──────────────────────────────────────────────────────────────────────────

const PARTICIPANTS = {
  // arjun is seeded as this event's leader via the leader-voting flow (phase
  // 5f), and coordination ≡ leadership since the 2026-06-23 enum change — so he
  // is NOT also a participation-grid row.
  "bagmati-tinkune-cleanup": [
    { memberSlug: "maya",   role: "PHOTOGRAPHER" },
    { memberSlug: "bishnu", role: "MEDIC" },
    { memberSlug: "ramesh", role: "LIVESTREAMER" },
    { memberSlug: "priya",  role: "SAFETY_LEAD" },
    { memberSlug: "sita",   role: "WORKER" },
    { memberSlug: "hari",   role: "WORKER" }
  ],
  // bishnu is a leader candidate for this event (open leader voting, phase 5f);
  // coordination ≡ leadership, so no separate participation-grid row.
  "kamalpokhari-beautification": [
    { memberSlug: "maya",   role: "PHOTOGRAPHER" },
    { memberSlug: "ramesh", role: "LIVESTREAMER" },
    { memberSlug: "priya",  role: "SAFETY_LEAD" },
    { memberSlug: "sita",   role: "WORKER" }
  ],
  // Past event, no leader-voting seeded — the former coordinator joins as a
  // worker (COORDINATOR was dropped from the participation enum 2026-06-23).
  "suryabinayak-afforestation": [
    { memberSlug: "arjun",  role: "WORKER" },
    { memberSlug: "bishnu", role: "MEDIC" },
    { memberSlug: "maya",   role: "PHOTOGRAPHER" },
    { memberSlug: "hari",   role: "WORKER" },
    { memberSlug: "sita",   role: "WORKER" },
    { memberSlug: "bikash", role: "WORKER" }
  ],
  "hanumante-lokanthali-cleanup": [
    { memberSlug: "suman",  role: "WORKER" },
    { memberSlug: "ramesh", role: "LIVESTREAMER" },
    { memberSlug: "bishnu", role: "MEDIC" },
    { memberSlug: "priya",  role: "SAFETY_LEAD" },
    { memberSlug: "hari",   role: "WORKER" }
  ],
  "fewa-shoreline-cleanup": [
    { memberSlug: "arjun",  role: "WORKER" },
    { memberSlug: "maya",   role: "PHOTOGRAPHER" },
    { memberSlug: "ramesh", role: "LIVESTREAMER" },
    { memberSlug: "bishnu", role: "MEDIC" },
    { memberSlug: "priya",  role: "SAFETY_LEAD" },
    { memberSlug: "sita",   role: "WORKER" },
    { memberSlug: "bikash", role: "WORKER" }
  ]
};

// ──────────────────────────────────────────────────────────────────────────
// Fixtures — Votes (memberSlug votes on issueSlug)
// ──────────────────────────────────────────────────────────────────────────

const VOTES = [
  // 5 rich standalone — heavy voting from many members
  // (Event-parent issues skipped: once convert-to-event runs, the issue is no
  // longer OPEN and rejects new votes. To seed pre-convert vote counts, the
  // script's phase order would need votes-on-issue → convert. Future work.)
  ...["shankhamul-bagmati-plastic", "boudha-ring-road-trash", "asan-main-bazaar-blocked", "traffic-chowk-drain-jam", "sarangkot-sunrise-trail-trash"]
    .flatMap((issueSlug) =>
      ["arjun", "maya", "bishnu", "ramesh", "sita", "hari", "priya", "suman", "bikash"]
        .map((memberSlug) => ({ memberSlug, issueSlug }))
    ),
  // Light standalone — 1-2 votes each
  { memberSlug: "anjali", issueSlug: "bardia-buffer-zone-trash" },
  { memberSlug: "arjun",  issueSlug: "ghodaghodi-lake-shore" },
  { memberSlug: "maya",   issueSlug: "khaptad-trail-trash" },
  { memberSlug: "hari",   issueSlug: "melamchi-riverbank-trash" },
  { memberSlug: "bikash", issueSlug: "manang-trail-cleanup-needed" }
];

// ──────────────────────────────────────────────────────────────────────────
// Fixtures — Comments (target → list of comments by memberSlug)
// ──────────────────────────────────────────────────────────────────────────
// targetKey shape: "issue:<slug>" or "event:<slug>" (event slug = issue slug)

const COMMENTS = {
  "issue:shankhamul-bagmati-plastic": [
    { memberSlug: "arjun",  text: "यो स्थानमा हामीले पहिले पनि अभियान चलाएका थियौँ — स्थायी समाधान चाहिएको हो। साइनबोर्डले मात्र पुग्दैन।" },
    { memberSlug: "priya",  text: "मनसुनको पानी सँगै आउने प्लास्टिक रोक्न ने माथिल्लो खण्डमा छाननी लगाउनुपर्छ। नगरपालिकालाई सिफारिस गरौँ।" },
    { memberSlug: "bishnu", text: "अग्रिम अभियान चलाउनु अघि बासिन्दा बैठक राख्ने सुझाव।" },
    { memberSlug: "sita",   text: "मेरो परिवारका सबै सहभागी हुन तयार छन्। शनिबार उपयुक्त हुनेछ।" }
  ],
  "issue:boudha-ring-road-trash": [
    { memberSlug: "ramesh", text: "मैले हिजो विडियो गरें — दृश्य साँच्चै खराब छ। टायर र पुराना सिमेन्ट पनि छन्।" },
    { memberSlug: "bishnu", text: "नगरपालिकाको ट्रक के बेला आउँछ निश्चित गरौँ — नभए सङ्कलित फोहोर त्यहीँ नै बस्छ।" },
    { memberSlug: "maya",   text: "व्यापार सङ्घले स्वयंसेवक पनि ल्याउने भनेका छन् भन्ने सुनेँ।" }
  ],
  "issue:asan-main-bazaar-blocked": [
    { memberSlug: "hari",   text: "असनमा बजार खण्ड मेरो दैनिक हिँडाइको बाटो — एकदम साँचो प्रश्न उठाइएको।" },
    { memberSlug: "arjun",  text: "व्यापारीहरूसँग पनि कुरा गर्नुपर्ने हुन्छ; जबरजस्ती हटाउँदा उल्टो प्रभाव पर्न सक्छ।" },
    { memberSlug: "priya",  text: "बजार समितिको सहयोग बिना यो सम्भव छैन। पहिले उहाँहरूसँग भेट तय गरौँ।" }
  ],
  "issue:traffic-chowk-drain-jam": [
    { memberSlug: "bikash", text: "मनसुन सुरु हुनुअघि नै काम सकाउनुपर्छ। ढिलाइ गर्न मिल्दैन।" },
    { memberSlug: "ramesh", text: "नगरपालिकाको इन्जिनियरिङ शाखासँग छलफल भएको छ कि छैन?" },
    { memberSlug: "bishnu", text: "ढल मर्मत स्वयंसेवकको कामभन्दा प्राविधिक टोलीको हो जस्तो लाग्छ।" }
  ],
  "issue:sarangkot-sunrise-trail-trash": [
    { memberSlug: "maya",   text: "मैले पनि अघिल्लो साता हेरें — साँच्चै अव्यवस्थित। यात्रीहरूलाई पनि शिक्षा चाहिएको।" },
    { memberSlug: "suman",  text: "स्थानीय गाइडसँग समन्वय गरेर हरेक १५ दिनमा छोटो सरसफाइ राख्ने सुझाव दिन्छु।" }
  ],
  "event:bagmati-tinkune-cleanup": [
    { memberSlug: "arjun",  text: "टोली एकदम राम्रो आइरहेको छ। प्लास्टिक सङ्कलन पनि व्यवस्थित।" },
    { memberSlug: "maya",   text: "तस्बिर खिच्ने ठाउँ राम्रो छ — पुलबाट र दक्षिणी किनारबाट दुवैतर्फ।" },
    { memberSlug: "ramesh", text: "लाइभ स्ट्रिम चलिरहेको छ; viewer count राम्रो छ।" },
    { memberSlug: "priya",  text: "सुरक्षा जोखिम भएको ठाउँमा साइनबोर्ड लगायौँ। पन्जा र मास्क सबैले लगाएका छन्।" },
    { memberSlug: "sita",   text: "पहिलो दिन यतिकै सहभागी आउँदा साँच्चै राम्रो लागिरहेको छ।" }
  ],
  "event:kamalpokhari-beautification": [
    { memberSlug: "bishnu", text: "रङ चयन र डिजाइन एकदम राम्रो। स्थानीय कलाकारलाई धन्यवाद।" },
    { memberSlug: "maya",   text: "भित्ता चित्र क्षेत्र सकिनै लाग्यो; अगाडिको साइनबोर्ड पनि सुरु गरौँ।" },
    { memberSlug: "ramesh", text: "लाइभ चलिरहेको छ — कमेन्ट र likes राम्रो आइरहेका छन्।" }
  ],
  "event:suryabinayak-afforestation": [
    { memberSlug: "arjun",  text: "१०० बिरुवा सकियो; अब सुरक्षा घेरा हाल्न सुरु गर्दैछौँ।" },
    { memberSlug: "bishnu", text: "मेडिकल टोली तयार छ। अहिलेसम्म कुनै दुर्घटना छैन।" },
    { memberSlug: "hari",   text: "साँच्चै थकिएको तर सन्तुष्ट छु। ३ महिनासम्म पानी हाल्ने जिम्मा मेरो।" }
  ],
  "event:hanumante-lokanthali-cleanup": [
    { memberSlug: "suman",  text: "तीन टोली नै बाँडिएका छन्; प्रगति राम्रो।" },
    { memberSlug: "bishnu", text: "साइनबोर्ड लगाउने ठाउँ चयन गरिसकेँ।" }
  ],
  "event:fewa-shoreline-cleanup": [
    { memberSlug: "arjun",  text: "डुङ्गा टोली पानीको प्लास्टिक उठाउँदै छन्। राम्रो coordination।" },
    { memberSlug: "maya",   text: "तस्बिर र विडियो राम्रो भइरहेको छ — सूर्यास्त सम्ममा सकिने आशा।" },
    { memberSlug: "ramesh", text: "लाइभ stream पर्यटकहरूको पनि ध्यान आकर्षण गरिरहेको छ।" }
  ]
};

// ──────────────────────────────────────────────────────────────────────────
// Fixtures — Volunteer applications (~12, mixed roles)
// ──────────────────────────────────────────────────────────────────────────

const APPLICATIONS = [
  { memberSlug: "maya",   role: "GRAPHICS_DESIGNER",   motivation: "तस्बिर र डिजाइन मेरो दैनिक काम हो — श्रमदान अभियानहरूको visual storytelling मा योगदान दिन चाहन्छु।" },
  { memberSlug: "bishnu", role: "VOLUNTEER",           motivation: "चिकित्सक भएको नाताले स्वयंसेवी अभियानमा मेडिकल सपोर्ट दिन्छु।" },
  { memberSlug: "ramesh", role: "COMMUNITY_MANAGER",   motivation: "लाइभ स्ट्रिमिङ र समुदाय engagement मेरो सीप; अनलाइन सहभागीहरूलाई जोड्न मद्दत गर्न चाहन्छु।" },
  { memberSlug: "arjun",  role: "FRONTEND_DEVELOPER",  motivation: "React/Next.js मा ३ वर्षको अनुभव छ। App र वेबसाइट दुवैमा सहयोग गर्न तयार।" },
  { memberSlug: "suman",  role: "BACKEND_DEVELOPER",   motivation: "Node.js र PostgreSQL मा गहिरो अनुभव। शृमदान को infrastructure scale गर्न मद्दत गर्न चाहन्छु।" },
  { memberSlug: "priya",  role: "LEGAL",               motivation: "कानुनी पक्ष — संस्था दर्ता, अनुमति, बीमा र volunteer protection जस्ता विषयमा सहयोग।" },
  { memberSlug: "sita",   role: "COMMUNITY_MANAGER",   motivation: "स्थानीय समुदायसँग जोडिएको छु। अभियानमा सहभागी बढाउन र outreach मा सहयोग गर्न सक्छु।" },
  { memberSlug: "hari",   role: "VOLUNTEER",           motivation: "जुनसुकै काममा सहयोग गर्न तयार। शारीरिक रूपले सक्षम छु, समय छ।" },
  { memberSlug: "bikash", role: "DONOR",               motivation: "मासिक रूपमा NPR 5,000 सम्म दान दिन सक्छु। अरू व्यवसायीसँग पनि कुरा गर्न तयार।" },
  { memberSlug: "anjali", role: "UI_UX_DESIGNER",      motivation: "नयाँ हो प्रोडक्टमा तर UI/UX डिजाइनमा रुचि छ। शिक्षा र अनुभव दुवै पाइनेमा काम गर्न उत्साहित।" },
  { memberSlug: "maya",   role: "OTHER",               motivation: "Volunteer photographer / videographer — अभियानहरूमा free मा सेवा दिन तयार। दोस्रो application छुट्टै रोलमा।" },
  { memberSlug: "bishnu", role: "FINANCE",             motivation: "मेडिकल साथसाथै finance background पनि छ; ledger र transparency मा सहयोग गर्न सक्छु।" }
];

// ──────────────────────────────────────────────────────────────────────────
// Fixtures — Feedback (2 entries)
// ──────────────────────────────────────────────────────────────────────────

const FEEDBACK = [
  {
    name: "Niraj Pant",
    email: "niraj.pant@example.com",
    type: "SUGGESTION",
    message: "Mobile app कहिले आउने हो? Notification PWA भन्दा native push राम्रो हुने थियो।"
  },
  {
    name: "Sangita Karki",
    email: "sangita.karki@example.com",
    type: "BUG_REPORT",
    message: "/events page मा कहिले काहीँ live stream player काम गर्दैन — Chrome on Windows बाट हेर्दा।"
  }
];

// ──────────────────────────────────────────────────────────────────────────
// Phase 1 — Members
// ──────────────────────────────────────────────────────────────────────────

async function phaseMembers() {
  log(`\n👥 Phase 1: register ${MEMBERS.length} members via admin POST /users (auto-verifies phone)`);
  const token = await adminLogin();
  let created = 0;
  let skipped = 0;
  for (const m of MEMBERS) {
    if (manifest.members[m.slug]) {
      vlog(`   ⊘ skip ${m.slug} (already in manifest)`);
      skipped += 1;
      continue;
    }
    try {
      const res = await api("POST", "/users", {
        token,
        body: { name: m.name, email: m.email, password: MEMBER_PASSWORD, phone: m.phone, role: "USER" }
      });
      const userId = res?.data?.user?.id || res?.data?.id;
      manifest.members[m.slug] = { id: userId, email: m.email, name: m.name, phone: m.phone };
      log(`   ✓ registered ${m.slug} (${m.email}) → ${userId?.slice(0, 8)}`);
      created += 1;
      await saveManifest();
    } catch (err) {
      const msg = err.message || String(err);
      if (/EMAIL_TAKEN|already exists|409|EMAIL_EXISTS|conflict/i.test(msg)) {
        try {
          const memberToken = await memberLogin(m.slug, m.email);
          const me = await api("GET", "/auth/me", { token: memberToken });
          manifest.members[m.slug] = { id: me?.data?.user?.id || me?.data?.id, email: m.email, name: m.name, phone: m.phone };
          log(`   ↺ ${m.slug} already exists, captured id from login`);
          await saveManifest();
          skipped += 1;
          continue;
        } catch (loginErr) {
          log(`   ✗ ${m.slug}: create failed AND login failed: ${loginErr.message}`);
          throw loginErr;
        }
      }
      log(`   ✗ ${m.slug}: ${msg}`);
      throw err;
    }
  }
  log(`   → ${created} created, ${skipped} skipped`);

  // 1b — Admin grants: medical credential to bishnu (MEDIC role), leader
  // eligibility to arjun + bishnu + suman (so they qualify as leader candidates
  // when issue → event conversion picks from WANT_TO_LEAD voters).
  log(`\n   1b: admin grants (medical credential + leader eligibility)`);
  const grants = [
    { slug: "bishnu", kind: "medical" },
    { slug: "arjun",  kind: "eligibility" },
    { slug: "bishnu", kind: "eligibility" },
    { slug: "suman",  kind: "eligibility" }
  ];
  for (const g of grants) {
    const m = manifest.members[g.slug];
    if (!m?.id) { log(`      ⚠️ ${g.slug}: no id`); continue; }
    try {
      if (g.kind === "medical") {
        await api("POST", `/users/${m.id}/verify-medical-credential`, { token, body: { verified: true } });
        log(`      ✓ ${g.slug}: medical credential verified`);
      } else {
        await api("PATCH", `/users/${m.id}/leader-eligibility`, { token, body: { leaderEligibility: "ELIGIBLE" } });
        log(`      ✓ ${g.slug}: leaderEligibility = ELIGIBLE`);
      }
    } catch (err) {
      log(`      ⚠️ ${g.slug} ${g.kind}: ${err.message.slice(0, 120)}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 2 — Uploads
// ──────────────────────────────────────────────────────────────────────────

async function phaseUploads() {
  // Collect unique filenames referenced by issues + events (cover + gallery + video)
  const files = new Set();
  for (const i of ISSUES) {
    if (i.cover) files.add(i.cover);
    if (Array.isArray(i.gallery)) i.gallery.forEach((g) => files.add(g));
    if (i.video) files.add(i.video);
  }
  const filenames = Array.from(files).sort();
  log(`\n📦 Phase 2: upload ${filenames.length} media files to R2`);
  const token = await adminLogin();
  let uploaded = 0;
  let skipped = 0;
  for (const filename of filenames) {
    if (manifest.uploads[filename]) {
      vlog(`   ⊘ skip ${filename}`);
      skipped += 1;
      continue;
    }
    const localPath = join(MEDIA_DIR, filename);
    let fileStat;
    try {
      fileStat = await stat(localPath);
    } catch {
      log(`   ⚠️ ${filename}: file missing on disk, skipping`);
      continue;
    }
    const ext = filename.split(".").pop().toLowerCase();
    const mimeType = ext === "mp4" ? "video/mp4" : ext === "png" ? "image/png" : "image/jpeg";
    const fileType = ext === "mp4" ? "VIDEO" : "IMAGE";
    try {
      const presign = await api("POST", "/uploads/presign", {
        token,
        body: { filename, mimeType, size: fileStat.size, isPublic: true, fileType }
      });
      const uploadId = presign?.data?.upload?.id;
      const presignedUrl = presign?.data?.presignedUrl;
      const downloadUrl = presign?.data?.upload?.downloadUrl || presign?.data?.upload?.url;
      if (!uploadId || !presignedUrl) {
        throw new Error(`presign returned no id/url: ${JSON.stringify(presign).slice(0, 300)}`);
      }
      if (!DRY) {
        const buffer = await readFile(localPath);
        const put = await fetch(presignedUrl, {
          method: "PUT",
          headers: { "Content-Type": mimeType },
          body: buffer
        });
        if (!put.ok) {
          const errText = await put.text();
          throw new Error(`R2 PUT ${filename} failed: ${put.status} ${errText.slice(0, 300)}`);
        }
        await api("POST", `/uploads/${uploadId}/confirm`, { token });
      }
      manifest.uploads[filename] = { id: uploadId, downloadUrl, mimeType };
      log(`   ✓ uploaded ${filename} (${(fileStat.size / 1024).toFixed(0)}kB) → ${uploadId.slice(0, 8)}`);
      uploaded += 1;
      await saveManifest();
    } catch (err) {
      log(`   ✗ ${filename}: ${err.message}`);
      throw err;
    }
  }
  log(`   → ${uploaded} uploaded, ${skipped} skipped`);
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 3 — Issues
// ──────────────────────────────────────────────────────────────────────────

async function phaseIssues() {
  log(`\n🐛 Phase 3: create ${ISSUES.length} issues via /issues/bulk`);
  const token = await adminLogin();
  const pending = ISSUES.filter((i) => !manifest.issues[i.slug]);
  if (pending.length === 0) {
    log(`   ⊘ all issues already in manifest`);
    return;
  }
  // Batch by 20 (under the 25 max)
  const BATCH = 20;
  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    const items = batch.map((iss) => {
      const upload = manifest.uploads[iss.cover];
      if (!upload?.id) throw new Error(`Cover upload missing for ${iss.slug} (${iss.cover})`);
      return {
        title: iss.title,
        description: iss.description,
        language: iss.language,
        coverImageId: upload.id,
        category: iss.category,
        latitude: iss.latitude,
        longitude: iss.longitude,
        addressText: iss.addressText
      };
    });
    const res = await api("POST", "/issues/bulk", { token, body: { items } });
    const results = res?.data?.results || [];
    results.forEach((r, idx) => {
      const src = batch[idx];
      if (r.success && r.data?.id) {
        manifest.issues[src.slug] = {
          id: r.data.id,
          backendSlug: r.data.slug,
          status: r.data.status,
          role: src.role
        };
        log(`   ✓ ${src.slug} → ${r.data.id.slice(0, 8)} (${r.data.status})`);
      } else {
        log(`   ✗ ${src.slug}: ${JSON.stringify(r.error || r).slice(0, 200)}`);
      }
    });
    await saveManifest();
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 4 — Events (convert + schedule + complete + role-plan)
// ──────────────────────────────────────────────────────────────────────────

async function phaseEvents() {
  log(`\n🎬 Phase 4: convert + schedule + complete ${EVENTS.length} events`);
  const token = await adminLogin();
  for (const ev of EVENTS) {
    if (manifest.events[ev.issueSlug]?.state === ev.state) {
      vlog(`   ⊘ skip ${ev.issueSlug} (already ${ev.state})`);
      continue;
    }
    const issue = manifest.issues[ev.issueSlug];
    if (!issue?.id) {
      log(`   ✗ ${ev.issueSlug}: parent issue not in manifest`);
      continue;
    }
    try {
      let eventId = manifest.events[ev.issueSlug]?.id;
      if (!eventId) {
        const conv = await api("POST", `/issues/${issue.id}/convert-to-event`, { token });
        eventId = conv?.data?.event?.id || conv?.data?.id;
        if (!eventId) throw new Error(`convert returned no id: ${JSON.stringify(conv).slice(0, 300)}`);
        manifest.events[ev.issueSlug] = { id: eventId, state: "draft" };
        await saveManifest();
        log(`   ✓ converted ${ev.issueSlug} → event ${eventId.slice(0, 8)}`);
      }

      // Compute scheduledAt
      let scheduledAt;
      if (ev.state === "live") {
        scheduledAt = new Date(Date.now() - ev.minutesAgo * 60_000).toISOString();
      } else if (ev.state === "upcoming") {
        scheduledAt = new Date(Date.now() + ev.daysAhead * 24 * 60 * 60_000).toISOString();
      } else { // past
        scheduledAt = new Date(Date.now() - ev.daysAgo * 24 * 60 * 60_000).toISOString();
      }
      const issueSrc = ISSUES.find((i) => i.slug === ev.issueSlug);
      await api("PATCH", `/events/${eventId}/schedule`, {
        token,
        body: {
          scheduledAt,
          durationMinutes: ev.durationMinutes,
          meetupLatitude: issueSrc.latitude,
          meetupLongitude: issueSrc.longitude,
          meetupAddress: issueSrc.addressText,
          meetupNotes: ev.meetupNotes
        }
      });
      log(`   ✓ scheduled ${ev.issueSlug} @ ${scheduledAt}`);

      // Role plan for rich events: array of {role, count}
      if (ev.rolePlan) {
        const rolePlan = Object.entries(ev.rolePlan).map(([role, count]) => ({ role, count }));
        await api("PUT", `/events/${eventId}/role-plan`, { token, body: { rolePlan } });
        log(`   ✓ role-plan set for ${ev.issueSlug}`);
      }

      // Complete past events (collect uploaded gallery photos)
      if (ev.state === "past") {
        const galleryIds = (issueSrc.gallery || [])
          .map((f) => manifest.uploads[f]?.id)
          .filter(Boolean);
        await api("POST", `/events/${eventId}/complete`, {
          token,
          body: {
            resultSummary: ev.resultSummary,
            attendeeCount: ev.attendeeCount,
            ...(galleryIds.length ? { uploadIds: galleryIds.slice(0, 20) } : {})
          }
        });
        log(`   ✓ completed ${ev.issueSlug} (${ev.attendeeCount} attendees)`);
      }

      manifest.events[ev.issueSlug] = { id: eventId, state: ev.state, scheduledAt };
      await saveManifest();
    } catch (err) {
      log(`   ✗ ${ev.issueSlug}: ${err.message}`);
      throw err;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 5 — Member actions
// ──────────────────────────────────────────────────────────────────────────

async function phaseActions() {
  log(`\n⚡ Phase 5: member actions`);

  // 5a — Votes
  log(`\n   5a: ${VOTES.length} votes`);
  for (const v of VOTES) {
    const key = `${v.memberSlug}:${v.issueSlug}`;
    if (manifest.votes.some((x) => `${x.memberSlug}:${x.issueSlug}` === key)) {
      vlog(`      ⊘ skip ${key}`); continue;
    }
    const member = manifest.members[v.memberSlug];
    const issue = manifest.issues[v.issueSlug];
    if (!member?.id || !issue?.id) {
      log(`      ✗ ${key}: member or issue missing in manifest`); continue;
    }
    try {
      const token = await memberLogin(v.memberSlug, member.email);
      // 80% INTERESTED, 20% WANT_TO_LEAD — varies by member slug for determinism
      const voterRole = ["arjun", "suman", "bishnu"].includes(v.memberSlug) && v.issueSlug.includes("bagmati")
        ? "WANT_TO_LEAD"
        : "INTERESTED";
      await api("POST", `/issues/${issue.id}/vote`, { token, body: { voterRole } });
      manifest.votes.push({ memberSlug: v.memberSlug, issueSlug: v.issueSlug });
      vlog(`      ✓ vote ${key}`);
      if (manifest.votes.length % 10 === 0) await saveManifest();
    } catch (err) {
      // Already voted is fine
      if (/already voted|ALREADY_VOTED|409/i.test(err.message)) {
        manifest.votes.push({ memberSlug: v.memberSlug, issueSlug: v.issueSlug });
        vlog(`      ↺ ${key} already voted`);
      } else {
        log(`      ✗ ${key}: ${err.message}`);
      }
    }
  }
  await saveManifest();

  // 5b — Comments
  log(`\n   5b: comments on ${Object.keys(COMMENTS).length} targets`);
  for (const [targetKey, list] of Object.entries(COMMENTS)) {
    const [targetType, slug] = targetKey.split(":");
    const target = targetType === "event" ? manifest.events[slug] : manifest.issues[slug];
    if (!target?.id) {
      log(`      ⚠️ ${targetKey}: target not in manifest, skipping`); continue;
    }
    const existing = manifest.comments[targetKey] || [];
    if (existing.length >= list.length) {
      vlog(`      ⊘ skip ${targetKey} (${existing.length} already)`); continue;
    }
    for (let i = existing.length; i < list.length; i += 1) {
      const c = list[i];
      const member = manifest.members[c.memberSlug];
      if (!member?.email) { log(`      ✗ ${targetKey}: member ${c.memberSlug} missing`); continue; }
      try {
        const token = await memberLogin(c.memberSlug, member.email);
        const res = await api("POST", "/comments", {
          token,
          body: { targetType, targetId: target.id, text: c.text }
        });
        const commentId = res?.data?.comment?.id || res?.data?.id;
        if (!manifest.comments[targetKey]) manifest.comments[targetKey] = [];
        manifest.comments[targetKey].push({ id: commentId, memberSlug: c.memberSlug, text: c.text });
        vlog(`      ✓ comment ${targetKey} by ${c.memberSlug}`);
      } catch (err) {
        log(`      ✗ comment ${targetKey} by ${c.memberSlug}: ${err.message}`);
      }
    }
    await saveManifest();
  }

  // 5c — Reactions (seed on a sample of comments)
  log(`\n   5c: reactions on sampled comments`);
  const REACTIONS = ["👏", "🌱", "❤️", "🙏", "💪"];
  for (const [targetKey, list] of Object.entries(manifest.comments)) {
    for (const c of list.slice(0, 2)) { // first 2 comments per target get reactions
      if (!c.id) continue;
      const reactors = MEMBERS.filter((m) => m.slug !== c.memberSlug).slice(0, 2);
      for (const reactor of reactors) {
        const member = manifest.members[reactor.slug];
        if (!member?.email) continue;
        try {
          const token = await memberLogin(reactor.slug, member.email);
          const emoji = REACTIONS[Math.floor((c.id?.charCodeAt(0) || 0) % REACTIONS.length)];
          await api("POST", `/comments/${c.id}/reactions`, { token, body: { emoji } });
          vlog(`      ✓ reaction ${emoji} on ${c.id?.slice(0, 8)} by ${reactor.slug}`);
        } catch (err) {
          // Reaction conflict / duplicate is acceptable
          vlog(`      ↺ reaction skip: ${err.message.slice(0, 80)}`);
        }
      }
    }
  }

  // 5d — Participants
  log(`\n   5d: participants across ${Object.keys(PARTICIPANTS).length} events`);
  for (const [eventSlug, list] of Object.entries(PARTICIPANTS)) {
    const event = manifest.events[eventSlug];
    if (!event?.id) { log(`      ⚠️ ${eventSlug}: event missing`); continue; }
    const existing = manifest.participants[eventSlug] || [];
    for (const p of list) {
      if (existing.some((x) => x.memberSlug === p.memberSlug && x.role === p.role)) continue;
      const member = manifest.members[p.memberSlug];
      if (!member?.email) continue;
      try {
        const token = await memberLogin(p.memberSlug, member.email);
        await api("POST", `/events/${event.id}/participants`, { token, body: { role: p.role } });
        if (!manifest.participants[eventSlug]) manifest.participants[eventSlug] = [];
        manifest.participants[eventSlug].push({ memberSlug: p.memberSlug, role: p.role });
        vlog(`      ✓ ${p.memberSlug} → ${p.role} @ ${eventSlug}`);
      } catch (err) {
        if (/already|409|DUPLICATE/i.test(err.message)) {
          if (!manifest.participants[eventSlug]) manifest.participants[eventSlug] = [];
          manifest.participants[eventSlug].push({ memberSlug: p.memberSlug, role: p.role });
        } else {
          log(`      ✗ ${p.memberSlug}@${eventSlug}: ${err.message}`);
        }
      }
    }
    await saveManifest();
  }

  // 5e — Applications
  log(`\n   5e: ${APPLICATIONS.length} volunteer applications`);
  for (const a of APPLICATIONS) {
    const member = manifest.members[a.memberSlug];
    if (!member?.email) continue;
    if (manifest.applications.some((x) => x.memberSlug === a.memberSlug && x.role === a.role)) {
      vlog(`      ⊘ skip ${a.memberSlug}/${a.role}`); continue;
    }
    try {
      const token = await memberLogin(a.memberSlug, member.email);
      const res = await api("POST", "/applications", {
        token,
        body: {
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: a.role,
          motivation: a.motivation
        }
      });
      const id = res?.data?.application?.id || res?.data?.id;
      manifest.applications.push({ id, memberSlug: a.memberSlug, role: a.role });
      log(`      ✓ application ${a.memberSlug} → ${a.role}`);
      await saveManifest();
    } catch (err) {
      log(`      ✗ ${a.memberSlug}/${a.role}: ${err.message}`);
    }
  }

  // 5f — Leader voting (state-aware)
  // Backend opens leader-voting state automatically when 2+ WANT_TO_LEAD votes
  // are cast on the issue BEFORE conversion. Our seed converts before voting,
  // so leader-voting status is "NONE" with eventLeader=admin for now.
  // We check status; if OPEN, we cast votes; otherwise log + skip.
  log(`\n   5f: leader voting (state-aware)`);
  const adminTok = await adminLogin();
  for (const ev of EVENTS.filter((e) => e.leaderCandidates)) {
    const event = manifest.events[ev.issueSlug];
    if (!event?.id) continue;
    let state;
    try {
      const st = await api("GET", `/events/${event.id}/leader-voting`, { token: adminTok });
      state = st?.data;
    } catch (err) {
      log(`      ⚠️ ${ev.issueSlug}: state check failed: ${err.message.slice(0, 100)}`);
      continue;
    }
    if (state?.status !== "OPEN") {
      log(`      ⊘ ${ev.issueSlug}: voting status=${state?.status} (need OPEN) — skipping`);
      manifest.leaderVoting[ev.issueSlug] = { state: state?.status || "UNKNOWN", note: "ordering bug — votes must precede convert" };
      continue;
    }
    const candidates = state?.candidates || [];
    if (candidates.length < 2) {
      log(`      ⊘ ${ev.issueSlug}: only ${candidates.length} candidate(s)`);
      continue;
    }
    const voters = ["arjun", "maya", "bishnu", "ramesh", "sita", "hari", "priya", "bikash", "anjali"];
    let castCount = 0;
    for (let i = 0; i < voters.length; i += 1) {
      const voterSlug = voters[i];
      const voter = manifest.members[voterSlug];
      if (!voter?.email) continue;
      const candidateId = candidates[i % 10 < 7 ? 0 : 1]?.id;
      if (!candidateId) continue;
      try {
        const token = await memberLogin(voterSlug, voter.email);
        await api("POST", `/events/${event.id}/leader-vote`, { token, body: { candidateId } });
        castCount += 1;
      } catch (err) {
        vlog(`      ↺ leader-vote ${voterSlug}: ${err.message.slice(0, 80)}`);
      }
    }
    log(`      ✓ ${ev.issueSlug}: ${castCount} leader votes cast`);

    if (ev.leaderVoting === "settled") {
      try {
        await api("POST", `/events/${event.id}/leader-voting/settle`, { token: adminTok });
        manifest.leaderVoting[ev.issueSlug] = { state: "settled" };
        log(`      ✓ ${ev.issueSlug}: leader voting settled`);
      } catch (err) {
        log(`      ⚠️ settle failed for ${ev.issueSlug}: ${err.message.slice(0, 120)}`);
        manifest.leaderVoting[ev.issueSlug] = { state: "open" };
      }
    } else {
      manifest.leaderVoting[ev.issueSlug] = { state: "open" };
    }
    await saveManifest();
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 6 — Feedback
// ──────────────────────────────────────────────────────────────────────────

async function phaseFeedback() {
  log(`\n💬 Phase 6: ${FEEDBACK.length} feedback entries`);
  for (const f of FEEDBACK) {
    if (manifest.feedback.some((x) => x.email === f.email && x.message === f.message)) {
      vlog(`   ⊘ skip ${f.email}`); continue;
    }
    try {
      const res = await api("POST", "/feedback", { body: f });
      const id = res?.data?.feedback?.id || res?.data?.id;
      manifest.feedback.push({ id, name: f.name, email: f.email, message: f.message });
      log(`   ✓ feedback from ${f.name}`);
      await saveManifest();
    } catch (err) {
      log(`   ✗ ${f.name}: ${err.message}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Orchestrator
// ──────────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n🌱 shramdan-web seed-staging`);
  log(`   API:     ${API_BASE}`);
  log(`   Mode:    ${DRY ? "DRY RUN" : "LIVE"}${SMOKE ? " · SMOKE" : ""}`);
  log(`   Phase:   ${PHASE}`);
  log(`   Started: ${nowIso()}`);

  await loadManifest();

  if (SMOKE) {
    // Trim fixtures to 1-2 of each kind
    MEMBERS.length = 2;
    const keepIssues = new Set(["shankhamul-bagmati-plastic", "bagmati-tinkune-cleanup"]);
    for (let i = ISSUES.length - 1; i >= 0; i -= 1) {
      if (!keepIssues.has(ISSUES[i].slug)) ISSUES.splice(i, 1);
    }
    for (let i = EVENTS.length - 1; i >= 0; i -= 1) {
      if (!keepIssues.has(EVENTS[i].issueSlug)) EVENTS.splice(i, 1);
    }
    log(`   ⚠️ SMOKE: trimmed to ${MEMBERS.length} members, ${ISSUES.length} issues, ${EVENTS.length} events`);
  }

  try {
    if (PHASE === "all" || PHASE === "members")  await phaseMembers();
    if (PHASE === "all" || PHASE === "uploads")  await phaseUploads();
    if (PHASE === "all" || PHASE === "issues")   await phaseIssues();
    if (PHASE === "all" || PHASE === "events")   await phaseEvents();
    if (PHASE === "all" || PHASE === "actions")  await phaseActions();
    if (PHASE === "all" || PHASE === "feedback") await phaseFeedback();
  } finally {
    await saveManifest();
  }

  log(`\n✅ Seed complete (${countManifest()} records in manifest)`);
  log(`   Manifest: ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  if (VERBOSE) console.error(err.stack);
  process.exit(1);
});
