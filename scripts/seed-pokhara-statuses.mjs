#!/usr/bin/env node
// Seed ~10 DEMO campaigns near Pokhara on the LIVE backend, spread across every
// lifecycle status, so the homepage "Nearby" feed and /campaigns thumbnails show
// varied states. Authorized demo data (user requested).
//
// Status mechanics (verified against live api.shramdan.org, 2026-06-29):
//   OPEN       → plain issue (POST /issues), no conversion.
//   DRAFT      → POST /issues/{id}/convert-to-event, stop.
//   SCHEDULED  → convert + PATCH /events/{id}/schedule with a FUTURE scheduledAt.
//   ACTIVE     → convert + schedule with a PAST scheduledAt. The backend derives
//                ACTIVE the moment scheduledAt <= now (stays ACTIVE until an
//                explicit complete) — there is NO /activate endpoint.
//   COMPLETED  → convert + schedule (past) + POST /events/{id}/complete.
// SCHEDULED/ACTIVE/COMPLETED also get a role-plan so the roster looks real.
//
// Reuses the seed-staging.mjs infrastructure (presign → R2 PUT → confirm,
// convert-to-event, schedule, complete, role-plan) but points at PROD and uses a
// self-contained idempotency manifest.
//
// Idempotent via scripts/.seed-pokhara-manifest.json — re-runs skip records
// already created and resume mid-flight.
//
// Usage:
//   node scripts/seed-pokhara-statuses.mjs
//   node scripts/seed-pokhara-statuses.mjs --dry-run
//   node scripts/seed-pokhara-statuses.mjs --verbose

import { readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, ".seed-pokhara-manifest.json");
const MEDIA_DIR = join(ROOT, "public", "images", "demo-events");

const API_BASE = "https://api.shramdan.org/api/v1";
const ADMIN = { email: "contact@yantracore.com", password: "123456" };

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose") || args.includes("-v");

const log = (...m) => console.log(...m);
const vlog = (...m) => { if (VERBOSE) console.log(...m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();

// ── Manifest ────────────────────────────────────────────────────────────────

const EMPTY = { startedAt: null, updatedAt: null, uploads: {}, campaigns: {} };
let manifest = { ...EMPTY };

async function loadManifest() {
  try {
    manifest = { ...EMPTY, ...JSON.parse(await readFile(MANIFEST_PATH, "utf8")) };
    log(`📋 Loaded manifest (${Object.keys(manifest.campaigns).length} campaigns, ${Object.keys(manifest.uploads).length} uploads)`);
  } catch {
    manifest = { ...EMPTY, startedAt: nowIso() };
    log("📋 No manifest — starting fresh");
  }
}

async function saveManifest() {
  if (DRY) return;
  manifest.updatedAt = nowIso();
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
}

// ── API helpers ───────────────────────────────────────────────────────────────

let adminToken = null;
let adminUserId = null;
async function adminLogin() {
  if (adminToken) return adminToken;
  if (DRY) { adminToken = "DRY"; adminUserId = "dry-admin"; return adminToken; }
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
  vlog(`🔐 Admin token acquired (role check follows)`);
  // Confirm we are actually ADMIN and capture our user id (used as event leader).
  const me = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const meBody = await me.json();
  const user = meBody?.data?.user || meBody?.data;
  if (user?.role !== "ADMIN") throw new Error(`Logged in but role is ${user?.role}, not ADMIN — privileged transitions will fail`);
  adminUserId = user.id;
  vlog(`   ✓ role = ADMIN, id = ${adminUserId}`);
  return adminToken;
}

async function api(method, path, { token, body, retries = 2 } = {}) {
  if (DRY) { vlog(`   [DRY] ${method} ${path}`); return { success: true, data: { id: `dry-${Math.random().toString(36).slice(2, 10)}` } }; }
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let res;
    try {
      res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(500 * (attempt + 1));
      continue;
    }
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
    if (!res.ok) {
      const msg = `${method} ${path} → ${res.status}: ${text.slice(0, 300)}`;
      if (attempt < retries && (res.status >= 500 || res.status === 429)) { await sleep(500 * (attempt + 1)); continue; }
      throw new Error(msg);
    }
    return json;
  }
  throw new Error("unreachable");
}

// ── Fixtures — 10 Pokhara campaigns across all statuses ──────────────────────
// base lat 28.21, lng 83.99; each scattered ±0.02–0.08 (~2–9 km apart).
// `cover` = filename under public/images/demo-events/ (real images on disk).

const CAMPAIGNS = [
  // ── 2 OPEN (plain issues) ──────────────────────────────────────────────
  {
    key: "fewa-lakeside-plastic",
    title: "फेवाताल लेकसाइड किनारमा प्लास्टिक थुप्रिएको",
    description: "लेकसाइड बाटो छेउको फेवाताल किनारमा पर्यटक र स्थानीयले छाडेका प्लास्टिक बोतल, खाजाका खाली प्याकेट र थर्मोकलले किनार अव्यवस्थित भएको छ। डुङ्गा घाट वरिपरि बढी फोहोर देखिन्छ। वडा र पर्यटन व्यवसायी समितिको सहयोगमा सरसफाइ अभियान चलाउने योजना — पानीमा तैरिने फोहोर पनि डुङ्गाबाट उठाउने।",
    category: "RIVERBANK",
    latitude: 28.2078, longitude: 83.9536,
    addressText: "लेकसाइड किनार, फेवाताल, पोखरा",
    cover: "fewa-cleanup.jpg",
    status: "OPEN"
  },
  {
    key: "mahendrapul-drain-jam",
    title: "महेन्द्रपुल चोक छेउको ढल जाम — मनसुनमा खतरा",
    description: "महेन्द्रपुल मूल चोकको पूर्वी छेउको ढल पुरानो भएर बारम्बार जाम हुने गरेको। पानी पर्दा सडकमा फर्केर बग्ने, यातायात ठप्प हुने र पैदलयात्रीलाई असुविधा। मनसुन सुरु हुनुअघि नै पाइप सफा गर्ने र छेउमा थप ढाल बनाउने काम चाहिएको। स्थानीय व्यापार सङ्घ सहयोगमा तयार।",
    category: "DRAINAGE",
    latitude: 28.2255, longitude: 83.9870,
    addressText: "महेन्द्रपुल चोक, पोखरा",
    cover: "naubise-drains.jpg",
    status: "OPEN"
  },

  // ── 2 DRAFT (convert only) ─────────────────────────────────────────────
  {
    key: "bagar-seti-riverbank",
    title: "बागर सेती नदी किनार फोहोरले प्रदूषित",
    description: "बागर खण्डको सेती नदी किनारमा घरेलु फोहोर र निर्माण सामग्री मिश्रित भएर थुप्रिएको। माथिल्लो खण्डबाट बगेर आउने प्लास्टिक किनारमा अड्किने क्रम जारी। स्थानीय टोल विकास संस्था र वडाको पहलमा सङ्कलन र किनारमा साइनबोर्ड लगाउने योजना तयार हुँदैछ।",
    category: "RIVERBANK",
    latitude: 28.2412, longitude: 83.9912,
    addressText: "बागर, सेती किनार, पोखरा",
    cover: "melamchi-riverbank.jpg",
    status: "DRAFT"
  },
  {
    key: "ranipauwa-roadside-trash",
    title: "रानीपौवा सडक किनार अव्यवस्थित फोहोर",
    description: "रानीपौवा बजार खण्डको सडक छेउ ठाउँठाउँ फोहोर, पुराना टायर र बिक्रीको बाँकी सामानले अव्यवस्थित। दैनिक धेरै आउजाउ हुने यो खण्डमा पहिलो प्रभाव खराब परिरहेको। वडा र बजार समितिले संयुक्त सरसफाइको इच्छा देखाएका — टोली व्यवस्थापन र फोहोर सङ्कलनको खाका बन्दैछ।",
    category: "ROADSIDE",
    latitude: 28.1856, longitude: 84.0188,
    addressText: "रानीपौवा बजार, पोखरा",
    cover: "gaur-bazaar.jpg",
    status: "DRAFT"
  },

  // ── 2 SCHEDULED (convert + schedule, future) ───────────────────────────
  {
    key: "sarangkot-trail-cleanup",
    title: "सारंकोट सूर्योदय पदमार्ग सरसफाइ",
    description: "सारंकोट दृश्यबिन्दु तर्फ जाने पदमार्ग सूर्योदय हेर्न आउने यात्रीले छाडेको प्लास्टिक बोतल, खाजाको प्याकेट र चुरोटले भरिएको। पर्यटन प्रवर्द्धन समिति, स्थानीय गाइड र हाम्रो स्वयंसेवक मिलेर सरसफाइ गर्ने। पन्जा, मास्क र पानी टोलीले ल्याउँछ।",
    category: "HIKING_TRAIL",
    latitude: 28.2461, longitude: 83.9472,
    addressText: "सारंकोट दृश्यबिन्दु, पोखरा",
    cover: "antu-trail.jpg",
    status: "SCHEDULED",
    daysAhead: 4, durationMinutes: 180,
    meetupNotes: "सारंकोट पार्किङ छेउमा भेला हुने। राम्रो जुत्ता र पानी आफै ल्याउनुहोस् — बाँकी सामग्री टोलीले ल्याउँछ।",
    rolePlan: { WORKER: 8, PHOTOGRAPHER: 1, SAFETY_LEAD: 1, LOGISTICS: 1 }
  },
  {
    key: "begnas-lakeshore-cleanup",
    title: "बेग्नासताल किनार सरसफाइ अभियान",
    description: "बेग्नासताल दक्षिणी किनारको पैदलमार्ग र डुङ्गा घाट वरिपरि पर्यटक र पिकनिक टोलीको फोहोरले अव्यवस्थित। सिमसार संरक्षणको चिन्तासँगै स्थानीय मत्स्य सहकारी र वडाको साझेदारीमा सरसफाइ। पानीमा तैरिने प्लास्टिक डुङ्गाबाट उठाउने।",
    category: "RIVERBANK",
    latitude: 28.1742, longitude: 84.0901,
    addressText: "बेग्नासताल किनार, पोखरा",
    cover: "ghodaghodi-lake.jpg",
    status: "SCHEDULED",
    daysAhead: 8, durationMinutes: 240,
    meetupNotes: "बेग्नास डुङ्गा घाटमा भेला। डुङ्गा र अग्रिम छुट्याउने सामग्री स्थानीय सहकारीले व्यवस्था गर्छ।",
    rolePlan: { WORKER: 9, PHOTOGRAPHER: 1, MEDIC: 1, SAFETY_LEAD: 1, LOGISTICS: 1 }
  },

  // ── 2 ACTIVE (convert + schedule in recent past) ───────────────────────
  {
    key: "lakeside-barahi-cleanup",
    title: "बाराही टोल ताल किनार सरसफाइ — आज चलिरहेको",
    description: "बाराही मन्दिर अघिको फेवाताल किनार पैदलमार्गमा प्लास्टिक र खाजाका बाँकीले अव्यवस्थित। पर्यटक नियमित आउने यो ठाउँको सफाइ तत्काल आवश्यक। डुङ्गा टोलीले पानीमा तैरिने प्लास्टिक पनि उठाउँदै, किनारमा साइनबोर्ड पनि लगाउँदै।",
    category: "RIVERBANK",
    latitude: 28.2105, longitude: 83.9588,
    addressText: "बाराही टोल, फेवाताल किनार, पोखरा",
    cover: "fewa-cleanup-poster.jpg",
    status: "ACTIVE",
    minutesAgo: 45, durationMinutes: 210,
    meetupNotes: "बाराही घाट पैदलमार्गमा भेला हुने। तीन टोलीमा बाँडिएर काम।",
    rolePlan: { WORKER: 8, PHOTOGRAPHER: 1, LIVESTREAMER: 1, MEDIC: 1, SAFETY_LEAD: 1, LOGISTICS: 1 }
  },
  {
    key: "buddha-park-tree-planting",
    title: "बुद्ध पार्क खाली ढिक्कामा वृक्षारोपण — आज चलिरहेको",
    description: "पोखरा बुद्ध पार्क छेउको खाली ढिक्का (०.६ हेक्टर) पहिरो जोखिममा। नगरले निःशुल्क बिरुवा (चिलाउने, उत्तिस, अमिलिसो) उपलब्ध गराएको। आज रोप्ने, सुरक्षा घेरा हाल्ने र ३ महिनासम्म पानी हाल्ने प्रतिबद्धतासहित अभियान चलिरहेको।",
    category: "VACANT_LAND",
    latitude: 28.2588, longitude: 84.0142,
    addressText: "बुद्ध पार्क, पोखरा",
    cover: "suryabinayak-trees.jpg",
    status: "ACTIVE",
    minutesAgo: 90, durationMinutes: 240,
    meetupNotes: "बुद्ध पार्क पश्चिम गेटमा भेला। बिरुवा, चित्रकोलो, पानी र हलुका खाजा टोलीले ल्याउँछ।",
    rolePlan: { WORKER: 10, PHOTOGRAPHER: 1, MEDIC: 1, SAFETY_LEAD: 1, LOGISTICS: 2 }
  },

  // ── 2 COMPLETED (convert + schedule past + complete) ───────────────────
  {
    key: "bindhyabasini-heritage-past",
    title: "बिन्ध्यवासिनी मन्दिर परिसर सरसफाइ",
    description: "बिन्ध्यवासिनी मन्दिर परिसर र छेउको पैदलमार्ग चाडपर्वमा यात्रुको चापले अव्यवस्थित हुने गरेको। सम्पदा संरक्षण समिति र स्थानीय युवा क्लबको साझेदारीमा एक दिने सरसफाइ अभियान सम्पन्न।",
    category: "PARK_PUBLIC_SPACE",
    latitude: 28.2389, longitude: 83.9818,
    addressText: "बिन्ध्यवासिनी मन्दिर, पोखरा",
    cover: "panauti-done.jpg",
    status: "COMPLETED",
    daysAgo: 12, durationMinutes: 200,
    meetupNotes: "बिन्ध्यवासिनी मन्दिर मूल गेटमा भेला भएको।",
    resultSummary: "१९ स्वयंसेवक, मन्दिर परिसर र पैदलमार्ग दुवै सरसफाइ। ७० किलो फोहोर सङ्कलन, साइनबोर्ड पनि नयाँ।",
    attendeeCount: 19,
    rolePlan: { WORKER: 12, PHOTOGRAPHER: 1, SAFETY_LEAD: 1, LOGISTICS: 2 }
  },
  {
    key: "pame-roadside-past",
    title: "पामे सडक किनार सरसफाइ अभियान",
    description: "पामे जाने सडक किनार खण्डमा फोहोर र निर्माण सामग्री छरिएर अव्यवस्थित थियो। वडा र स्थानीय टोल विकास संस्थाको पहलमा संयुक्त सरसफाइ सम्पन्न; किनारमा फोहोर नफाल्न साइनबोर्ड पनि लगाइयो।",
    category: "ROADSIDE",
    latitude: 28.2031, longitude: 83.9189,
    addressText: "पामे सडक किनार, पोखरा",
    cover: "sarangkot-done.jpg",
    status: "COMPLETED",
    daysAgo: 26, durationMinutes: 180,
    meetupNotes: "पामे बजार चोकमा भेला भएको।",
    resultSummary: "१५ स्वयंसेवक, ५५ किलो फोहोर सङ्कलन। सडक किनार खण्ड स्पष्ट र साइनबोर्ड नयाँ।",
    attendeeCount: 15,
    rolePlan: { WORKER: 10, PHOTOGRAPHER: 1, SAFETY_LEAD: 1, LOGISTICS: 1 }
  }
];

// ── Upload covers (presign → R2 PUT → confirm) ───────────────────────────────

async function ensureUpload(filename, token) {
  if (manifest.uploads[filename]?.id) return manifest.uploads[filename];
  const localPath = join(MEDIA_DIR, filename);
  const fileStat = await stat(localPath); // throws if missing → surfaces as blocker
  const ext = filename.split(".").pop().toLowerCase();
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";
  const presign = await api("POST", "/uploads/presign", {
    token,
    body: { filename, mimeType, size: fileStat.size, isPublic: true, fileType: "IMAGE" }
  });
  const uploadId = presign?.data?.upload?.id;
  const presignedUrl = presign?.data?.presignedUrl;
  const downloadUrl = presign?.data?.upload?.downloadUrl || presign?.data?.upload?.url;
  if (!uploadId || !presignedUrl) throw new Error(`presign returned no id/url for ${filename}: ${JSON.stringify(presign).slice(0, 200)}`);
  if (!DRY) {
    const buffer = await readFile(localPath);
    const put = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": mimeType }, body: buffer });
    if (!put.ok) throw new Error(`R2 PUT ${filename} failed: ${put.status} ${(await put.text()).slice(0, 200)}`);
    await api("POST", `/uploads/${uploadId}/confirm`, { token });
  }
  manifest.uploads[filename] = { id: uploadId, downloadUrl, mimeType };
  await saveManifest();
  log(`   ✓ uploaded cover ${filename} (${(fileStat.size / 1024).toFixed(0)}kB) → ${uploadId.slice(0, 8)}`);
  return manifest.uploads[filename];
}

// ── Drive one campaign to its target status ──────────────────────────────────

function computeScheduledAt(c) {
  if (c.status === "SCHEDULED") return new Date(Date.now() + (c.daysAhead || 5) * 86_400_000).toISOString();
  if (c.status === "ACTIVE") return new Date(Date.now() - (c.minutesAgo || 60) * 60_000).toISOString();
  if (c.status === "COMPLETED") return new Date(Date.now() - (c.daysAgo || 14) * 86_400_000).toISOString();
  return null;
}

async function seedCampaign(c, token) {
  const rec = manifest.campaigns[c.key] || {};

  // 1. Cover upload
  const upload = await ensureUpload(c.cover, token);

  // 2. Issue
  if (!rec.issueId) {
    const res = await api("POST", "/issues", {
      token,
      body: {
        title: c.title,
        description: c.description,
        language: "ne",
        coverImageId: upload.id,
        category: c.category,
        latitude: c.latitude,
        longitude: c.longitude,
        addressText: c.addressText
      }
    });
    const d = res?.data?.issue || res?.data;
    rec.issueId = d?.id;
    rec.issueSlug = d?.slug;
    rec.issueStatus = d?.status;
    if (!rec.issueId) throw new Error(`issue create returned no id: ${JSON.stringify(res).slice(0, 200)}`);
    manifest.campaigns[c.key] = rec;
    await saveManifest();
    log(`   ✓ [${c.key}] issue ${rec.issueSlug} (${rec.issueStatus})`);
  }

  if (c.status === "OPEN") {
    rec.finalStatus = "OPEN";
    manifest.campaigns[c.key] = rec;
    await saveManifest();
    return rec;
  }

  // 3. Convert to event (DRAFT)
  if (!rec.eventId) {
    const conv = await api("POST", `/issues/${rec.issueId}/convert-to-event`, { token });
    const ev = conv?.data?.event || conv?.data;
    rec.eventId = ev?.id;
    rec.eventSlug = ev?.slug;
    if (!rec.eventId) throw new Error(`convert returned no event id: ${JSON.stringify(conv).slice(0, 200)}`);
    manifest.campaigns[c.key] = rec;
    await saveManifest();
    log(`   ✓ [${c.key}] converted → event ${rec.eventSlug || rec.eventId.slice(0, 8)} (DRAFT)`);
  }

  if (c.status === "DRAFT") {
    rec.finalStatus = "DRAFT";
    manifest.campaigns[c.key] = rec;
    await saveManifest();
    return rec;
  }

  // 3b. Assign event leader (admin self). Force-convert with 0 WANT_TO_LEAD
  // voters leaves the event in a leader-SEEKING state with no leader, and the
  // schedule endpoint is EVENT_LEADER_ONLY. Assign the admin (verified) as
  // leader so the privileged transitions below succeed.
  if (!rec.leaderSet) {
    await api("PATCH", `/events/${rec.eventId}/leader`, { token, body: { eventLeaderId: adminUserId } });
    rec.leaderSet = true;
    manifest.campaigns[c.key] = rec;
    await saveManifest();
    log(`   ✓ [${c.key}] event leader → admin`);
  }

  // 4. Schedule
  if (!rec.scheduledAt) {
    const scheduledAt = computeScheduledAt(c);
    await api("PATCH", `/events/${rec.eventId}/schedule`, {
      token,
      body: {
        scheduledAt,
        durationMinutes: c.durationMinutes,
        meetupLatitude: c.latitude,
        meetupLongitude: c.longitude,
        meetupAddress: c.addressText,
        meetupNotes: c.meetupNotes
      }
    });
    rec.scheduledAt = scheduledAt;
    manifest.campaigns[c.key] = rec;
    await saveManifest();
    log(`   ✓ [${c.key}] scheduled @ ${scheduledAt}`);
  }

  // 5. Role plan
  if (c.rolePlan && !rec.rolePlanSet) {
    const rolePlan = Object.entries(c.rolePlan).map(([role, count]) => ({ role, count }));
    await api("PUT", `/events/${rec.eventId}/role-plan`, { token, body: { rolePlan } });
    rec.rolePlanSet = true;
    manifest.campaigns[c.key] = rec;
    await saveManifest();
    log(`   ✓ [${c.key}] role-plan set`);
  }

  // 6. Complete (only for COMPLETED)
  if (c.status === "COMPLETED" && !rec.completed) {
    await api("POST", `/events/${rec.eventId}/complete`, {
      token,
      body: { resultSummary: c.resultSummary, attendeeCount: c.attendeeCount }
    });
    rec.completed = true;
    rec.finalStatus = "COMPLETED";
    manifest.campaigns[c.key] = rec;
    await saveManifest();
    log(`   ✓ [${c.key}] completed (${c.attendeeCount} attendees)`);
    return rec;
  }

  // SCHEDULED stays SCHEDULED (future); ACTIVE is derived from past scheduledAt.
  rec.finalStatus = c.status;
  manifest.campaigns[c.key] = rec;
  await saveManifest();
  return rec;
}

// ── Verification ─────────────────────────────────────────────────────────────

async function verify(token) {
  log(`\n🔎 Verification (live API readback)`);
  // Pokhara bbox roughly: lat 28.10–28.30, lng 83.85–84.15
  const bbox = "&north=28.32&south=28.08&east=84.16&west=83.84";
  const openRes = await api("GET", `/issues?status=OPEN&limit=100${bbox}`, { token });
  const openItems = openRes?.data?.items || openRes?.data || [];
  const mySlugs = new Set(Object.values(manifest.campaigns).map((c) => c.issueSlug).filter(Boolean));
  const myOpen = openItems.filter((i) => mySlugs.has(i.slug));
  log(`   issues?status=OPEN (Pokhara bbox): ${openItems.length} total, ${myOpen.length} are mine`);

  for (const st of ["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED"]) {
    const res = await api("GET", `/events?status=${st}&limit=100${bbox}`, { token });
    const items = res?.data?.items || res?.data || [];
    const mine = items.filter((e) => e.slug && Object.values(manifest.campaigns).some((c) => c.eventSlug === e.slug));
    log(`   events?status=${st} (Pokhara bbox): ${items.length} total, ${mine.length} are mine`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`\n🌱 seed-pokhara-statuses`);
  log(`   API:  ${API_BASE}`);
  log(`   Mode: ${DRY ? "DRY RUN" : "LIVE"}`);
  log(`   Started: ${nowIso()}`);

  await loadManifest();
  const token = await adminLogin();

  const created = [];
  for (const c of CAMPAIGNS) {
    log(`\n▶ ${c.key} (target ${c.status})`);
    try {
      const rec = await seedCampaign(c, token);
      created.push({ key: c.key, ...rec, target: c.status, address: c.addressText });
    } catch (err) {
      log(`   ✗ ${c.key}: ${err.message}`);
      created.push({ key: c.key, target: c.status, address: c.addressText, error: err.message });
    }
  }

  if (!DRY) { try { await verify(token); } catch (e) { log(`   ⚠️ verify failed: ${e.message}`); } }

  // Summary table
  log(`\n📊 Summary`);
  const byStatus = {};
  for (const r of created) {
    const st = r.error ? "FAILED" : (r.finalStatus || r.target);
    (byStatus[st] ||= []).push(r);
  }
  for (const [st, rows] of Object.entries(byStatus)) {
    log(`\n  ${st} (${rows.length}):`);
    for (const r of rows) {
      if (r.error) { log(`    ✗ ${r.key} — ${r.error.slice(0, 120)}`); continue; }
      log(`    • slug=${r.issueSlug}  /campaign/${r.issueSlug}  event=${r.eventSlug || "—"}  @ ${r.address}`);
    }
  }
  const ok = created.filter((r) => !r.error).length;
  log(`\n✅ ${ok}/${created.length} campaigns seeded. Manifest: ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  if (VERBOSE) console.error(err.stack);
  process.exit(1);
});
