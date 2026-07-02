#!/usr/bin/env node
// Make two specific records *richest possible* — विवेक's flagship-pair demand:
//   1. Bouddha Ring Road North Stretch (issue, slug = boudha-ring-road-trash)
//   2. Suryabinayak Nagar Bhaktapur (event, slug = suryabinayak-afforestation)
//
// Adds:
//   - 25 additional members (rich vote/comment pool)
//   - 30+ votes on Bouddha issue (mixed voterRoles)
//   - 15+ top-level comments + 12+ nested replies on Bouddha
//   - Reactions on most Bouddha comments
//   - 10+ additional participants on Suryabinayak (fills role-plan)
//   - 12+ top-level comments + 10+ nested replies on Suryabinayak event
//   - Reactions on most Suryabinayak comments
//
// Reads/updates scripts/.seed-manifest.json — idempotent (skips already-done
// records by member+issue or comment text fingerprint).

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, ".seed-manifest.json");

const API_BASE = "https://backend.shramdan.org/api/v1";
const ADMIN = { email: "contact@yantracore.com", password: "123456" };
const MEMBER_PASSWORD = "Demo123!@#";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...m) => console.log(...m);

let manifest;
async function loadManifest() {
  manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
}
let savingNow = false;
let savePending = false;
async function saveManifest() {
  if (savingNow) { savePending = true; return; }
  savingNow = true;
  try {
    manifest.updatedAt = new Date().toISOString();
    const tmp = `${MANIFEST_PATH}.tmp`;
    const content = JSON.stringify(manifest, null, 2);
    for (let i = 0; i < 4; i += 1) {
      try {
        await writeFile(tmp, content, "utf8");
        const { rename } = await import("node:fs/promises");
        await rename(tmp, MANIFEST_PATH);
        break;
      } catch (e) {
        if (i === 3) throw e;
        await sleep(120 * (i + 1));
      }
    }
  } finally {
    savingNow = false;
    if (savePending) { savePending = false; setTimeout(() => saveManifest(), 0); }
  }
}

// ── auth helpers ────────────────────────────────────────────────────────────
let adminToken = null;
const memberTokens = new Map();
async function adminLogin() {
  if (adminToken) return adminToken;
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ADMIN)
  });
  const body = await res.json();
  adminToken = body?.data?.accessToken;
  if (!adminToken) throw new Error("admin login failed: " + JSON.stringify(body).slice(0, 200));
  return adminToken;
}
async function memberLogin(slug, email) {
  if (memberTokens.has(slug)) return memberTokens.get(slug);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: MEMBER_PASSWORD })
  });
  const body = await res.json();
  if (!body?.data?.accessToken) {
    throw new Error(`login ${slug}: ${JSON.stringify(body).slice(0, 200)}`);
  }
  memberTokens.set(slug, body.data.accessToken);
  return body.data.accessToken;
}

async function api(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return json;
}

// ── 25 additional members ───────────────────────────────────────────────────
const EXTRA_MEMBERS = [
  { slug: "deepika",  name: "Deepika Sharma",      email: "deepika.seed@shramdan.org",   phone: "+9779820100011" },
  { slug: "rajiv",    name: "Rajiv Khadka",        email: "rajiv.seed@shramdan.org",     phone: "+9779820100012" },
  { slug: "nisha",    name: "Nisha Pandey",        email: "nisha.seed@shramdan.org",     phone: "+9779820100013" },
  { slug: "kushal",   name: "Kushal Bhattarai",    email: "kushal.seed@shramdan.org",    phone: "+9779820100014" },
  { slug: "saraswati", name: "Saraswati Subedi",   email: "saraswati.seed@shramdan.org", phone: "+9779820100015" },
  { slug: "naresh",   name: "Naresh Pokharel",     email: "naresh.seed@shramdan.org",    phone: "+9779820100016" },
  { slug: "asmita",   name: "Asmita Joshi",        email: "asmita.seed@shramdan.org",    phone: "+9779820100017" },
  { slug: "milan",    name: "Milan Rana",          email: "milan.seed@shramdan.org",     phone: "+9779820100018" },
  { slug: "yamuna",   name: "Yamuna Acharya",      email: "yamuna.seed@shramdan.org",    phone: "+9779820100019" },
  { slug: "sandip",   name: "Sandip Bhandari",     email: "sandip.seed@shramdan.org",    phone: "+9779820100020" },
  { slug: "kabita",   name: "Kabita Tharu",        email: "kabita.seed@shramdan.org",    phone: "+9779820100021" },
  { slug: "rabindra", name: "Rabindra Dahal",      email: "rabindra.seed@shramdan.org",  phone: "+9779820100022" },
  { slug: "ishwori",  name: "Ishwori Chaudhary",   email: "ishwori.seed@shramdan.org",   phone: "+9779820100023" },
  { slug: "manish",   name: "Manish Kafle",        email: "manish.seed@shramdan.org",    phone: "+9779820100024" },
  { slug: "rojina",   name: "Rojina Bista",        email: "rojina.seed@shramdan.org",    phone: "+9779820100025" },
  { slug: "subash",   name: "Subash Neupane",      email: "subash.seed@shramdan.org",    phone: "+9779820100026" },
  { slug: "anu",      name: "Anu Maharjan",        email: "anu.seed@shramdan.org",       phone: "+9779820100027" },
  { slug: "krishna",  name: "Krishna Limbu",       email: "krishna.seed@shramdan.org",   phone: "+9779820100028" },
  { slug: "muna",     name: "Muna Shrestha",       email: "muna.seed@shramdan.org",      phone: "+9779820100029" },
  { slug: "binod",    name: "Binod Aryal",         email: "binod.seed@shramdan.org",     phone: "+9779820100030" },
  { slug: "sushma",   name: "Sushma Pradhan",      email: "sushma.seed@shramdan.org",    phone: "+9779820100031" },
  { slug: "dilip",    name: "Dilip Khanal",        email: "dilip.seed@shramdan.org",     phone: "+9779820100032" },
  { slug: "bandana",  name: "Bandana Lamsal",      email: "bandana.seed@shramdan.org",   phone: "+9779820100033" },
  { slug: "umesh",    name: "Umesh Adhikari",      email: "umesh.seed@shramdan.org",     phone: "+9779820100034" },
  { slug: "junu",     name: "Junu Magar",          email: "junu.seed@shramdan.org",      phone: "+9779820100035" }
];

async function phaseMembers() {
  log(`\n👥 Phase 1: register ${EXTRA_MEMBERS.length} extra members`);
  const token = await adminLogin();
  let created = 0, skipped = 0;
  for (const m of EXTRA_MEMBERS) {
    if (manifest.members[m.slug]) { skipped += 1; continue; }
    try {
      const res = await api("POST", "/users", {
        token,
        body: { name: m.name, email: m.email, password: MEMBER_PASSWORD, phone: m.phone, role: "USER" }
      });
      const userId = res?.data?.user?.id || res?.data?.id;
      manifest.members[m.slug] = { id: userId, email: m.email, name: m.name, phone: m.phone };
      log(`   ✓ ${m.slug} → ${userId.slice(0, 8)}`);
      created += 1;
      await saveManifest();
    } catch (err) {
      log(`   ✗ ${m.slug}: ${err.message}`);
    }
  }
  log(`   → ${created} created, ${skipped} skipped`);
}

// ── Bouddha votes ──────────────────────────────────────────────────────────
const BOUDDHA_ISSUE_SLUG = "boudha-ring-road-trash";

async function phaseBouddhaVotes() {
  log(`\n🗳  Phase 2: votes on Bouddha`);
  const issue = manifest.issues[BOUDDHA_ISSUE_SLUG];
  if (!issue?.id) { log(`   ⚠️ Bouddha issue not in manifest`); return; }
  const alreadyVoted = new Set(
    manifest.votes
      .filter((v) => v.issueSlug === BOUDDHA_ISSUE_SLUG)
      .map((v) => v.memberSlug)
  );
  // All members get to vote — mostly INTERESTED, a few GOING, a couple WANT_TO_LEAD
  const allMembers = Object.keys(manifest.members);
  let cast = 0;
  for (let i = 0; i < allMembers.length; i += 1) {
    const slug = allMembers[i];
    if (alreadyVoted.has(slug)) continue;
    const member = manifest.members[slug];
    const voterRole = i % 15 === 0 ? "WANT_TO_LEAD" : i % 7 === 0 ? "GOING" : "INTERESTED";
    try {
      const token = await memberLogin(slug, member.email);
      await api("POST", `/issues/${issue.id}/vote`, { token, body: { voterRole } });
      manifest.votes.push({ memberSlug: slug, issueSlug: BOUDDHA_ISSUE_SLUG });
      cast += 1;
      if (cast % 5 === 0) await saveManifest();
    } catch (err) {
      if (/already voted|ALREADY_VOTED/i.test(err.message)) {
        manifest.votes.push({ memberSlug: slug, issueSlug: BOUDDHA_ISSUE_SLUG });
      } else {
        log(`   ✗ ${slug}: ${err.message.slice(0, 120)}`);
      }
    }
  }
  await saveManifest();
  log(`   → ${cast} new votes cast`);
}

// ── Comments fixtures ───────────────────────────────────────────────────────
// Thread shape: each top-level entry has { author, text, replies?: [...] }
// Replies recurse 1-2 levels. memberSlug references manifest.members.

const BOUDDHA_THREADS = [
  {
    author: "deepika",
    text: "मैले हिजो साँझ Ring Road मा हिँडेर आउँदा देखेँ — Bouddha तर्फको दक्षिणी छेउ साँच्चै बिग्रिएको रहेछ। पर्यटक ओर्लिने ठाउँमै फोहोर जमेर बसेको छ।",
    replies: [
      { author: "rajiv", text: "साँच्चै। मेरो होटेल त्यहीँ छ; अतिथिले पहिलो दिन नै सोध्छन्।" },
      { author: "nisha", text: "नगरपालिकाको ट्रक हप्ताको एकपटक मात्र आउँछ कि भन्ने सुनेँ।",
        replies: [{ author: "rajiv", text: "अहो, त्यसैले हो। आर्थिक रूपमा सहयोग गर्न पनि व्यापारीहरू तयार छन्।" }] }
    ]
  },
  {
    author: "kushal",
    text: "स्थानीय व्यापार सङ्घले पनि सहयोग गर्ने भनेका छन् — तर coordinate गर्ने एउटा point of contact चाहिएको रहेछ। श्रमदान ले त्यो भूमिका लिन सक्छ?",
    replies: [
      { author: "arjun", text: "हुन्छ — coordinator role plan मा छ। तपाईंले अघि बढ्ने भए application पठाउनुहोस्।" }
    ]
  },
  {
    author: "saraswati",
    text: "Boudha Stupa भित्र-बाहिर सबै पर्यटक र भक्तजनको गन्तव्य हो। यो ठाउँको पहिलो प्रभाव खराब हुनु भनेको देशकै प्रतिष्ठाको कुरा हो।"
  },
  {
    author: "naresh",
    text: "मेरो परिवारको ४ जना सहभागी हुन तयार छन् — खाली शनिबार वा आइतबार उत्तम।",
    replies: [
      { author: "asmita", text: "हाम्रो office team पनि CSR day मा यो अभियानमा जोडिन सक्छ। 20-25 जना अनुमानित।" }
    ]
  },
  {
    author: "milan",
    text: "Plastic बिक्री गर्ने scrap dealer सँग पनि कुरा गरौँ — सङ्कलित प्लास्टिक उनीहरूले लग्न तयार छन् भने पुनःप्रयोग पनि हुन्छ।"
  },
  {
    author: "yamuna",
    text: "मैले गत हप्ता तस्बिर खिचेर आफ्नो instagram मा पोस्ट गरेकी थिएँ — साथीहरूले reach out गरिरहेका छन् कसरी सहयोग गर्ने भनेर। पर्खाइ-पर्खाइको ठाउँ हो यो।",
    replies: [
      { author: "ramesh", text: "तस्बिरको लिंक share गर्न मिल्छ? Live stream को content मा reference राख्न मिल्छ।",
        replies: [{ author: "yamuna", text: "हुन्छ, DM गरेँ। Visual story powerful छ।" }] }
    ]
  },
  {
    author: "sandip",
    text: "Ring Road को यो खण्ड मेरो दैनिक commute मा पर्छ। सडक माथिको पुरानो टायर र building debris देख्दा साँच्चै दुख लाग्छ।"
  },
  {
    author: "kabita",
    text: "महिला समूहले पनि coordinate गर्न सक्छन् — हाम्रो स्थानीय बैठकमा यो विषय उठाउँछौँ। 10-12 जना confirmed आउँछन्।"
  },
  {
    author: "rabindra",
    text: "नगरपालिकाको permit लाई कस्तो process छ? मैले अघि incident plan पनि चाहिने भनेर सुनेको थिएँ।",
    replies: [
      { author: "priya", text: "Safety lead role को क्षेत्र हो यो — मैले permit + insurance दुवै कुरा गर्दैछु। आउँदो साताभित्र clear हुन्छ।" }
    ]
  },
  {
    author: "ishwori",
    text: "Tharu Society Bouddha शाखाले पनि सहयोग गर्ने प्रतिज्ञा गरेका छन्। प्रत्येक सदस्यले औंलो छेउ बजाएर मिल्छु भन्ने जवाफ दिए।"
  },
  {
    author: "manish",
    text: "Photographer/videographer छन् भने मलाई DM गर्नुहोस् — content team को coordination मेरो जिम्मा हो। Post-event recap video बनाउने योजना छ।",
    replies: [
      { author: "maya", text: "म PHOTOGRAPHER role मा apply गर्दैछु। Two cameras लिएर आउँछु।" }
    ]
  },
  {
    author: "rojina",
    text: "नगरपालिकाको bin व्यवस्थापन सुधार नभई दिगो समाधान आउँदैन। यो अभियानले त्यो दिशामा pressure पनि बनाउँछ।"
  },
  {
    author: "subash",
    text: "Volunteer हरुलाई कस्तो dress code छ? Branded T-shirt? मैले अघिल्लो अभियानमा देखेँ छुट्टै रङ्गको थियो।",
    replies: [
      { author: "arjun", text: "हो — हरियो polo त्यो दिनमा हामी सबैले लगाउँछौँ। Distribution venue मा हुन्छ।" }
    ]
  },
  {
    author: "anu",
    text: "Drinking water + light snacks coordination मेरो जिम्मा लिन्छु। LOGISTICS role मा apply गर्दैछु — local supplier सँग tie-up पनि छ।"
  },
  {
    author: "krishna",
    text: "Limbu Cultural Centre बाट volunteer हरु पठाउने tentative commitment छ। Final list यो हप्ताभित्रमा confirm हुन्छ।",
    replies: [
      { author: "arjun", text: "🙏 Cross-community participation साँच्चै beautiful हुन्छ।" }
    ]
  }
];

const SURYABINAYAK_THREADS = [
  {
    author: "deepika",
    text: "११० बिरुवा लागेका छन् अहिले — चिलाउनेको line एकदम राम्रो देखिएको। बच्चाहरूले पनि खुसी मानेर रोप्दैछन्।",
    replies: [
      { author: "arjun", text: "बच्चाहरूको photo को permission ल पहिले लिँदा राम्रो। Maya, छ?" },
      { author: "maya", text: "लिएँ — सबै अभिभावकले सही दिएको form आज सबेरै हो।",
        replies: [{ author: "arjun", text: "Perfect. Continue गर्नुहोस्।" }] }
    ]
  },
  {
    author: "rajiv",
    text: "नगरपालिकाको technician आइसके — soil quality test को result २ हप्तामा आउँछ। त्यो आधारमा अर्को batch को बिरुवा छनोट हुन्छ।"
  },
  {
    author: "nisha",
    text: "बच्चाहरूलाई पानी हाल्ने responsibility असाइन गऱ्यौँ — आउँदो ३ महिनासम्म साप्ताहिक schedule तयार छ।",
    replies: [
      { author: "hari", text: "मेरो जिम्मा हरेक आइतबार। SMS reminder आउँछ?" },
      { author: "arjun", text: "SMS reminder backend ले अझै handle गरेको छैन — manual whatsapp group ले अहिले replace गरेको छ।" }
    ]
  },
  {
    author: "kushal",
    text: "Bhaktapur municipality को heritage committee पनि आज visit गर्न आउने रहेछन्। Coordination ramping up छ।"
  },
  {
    author: "saraswati",
    text: "साइनबोर्ड मा local language र English दुवै राख्ने योजना? तब टुरिस्टले पनि बिरुवाको नाम र महत्व बुझ्न सक्छन्।",
    replies: [
      { author: "bishnu", text: "हो — bilingual सबै सूचना। मैले अघि draft पठाएको थिएँ।" }
    ]
  },
  {
    author: "asmita",
    text: "मेडिकल team मा कुनै emergency आयो भने Bhaktapur Hospital बाट ambulance ५ मिनेटमा pickup हुने commitment मिलेको रहेछ।"
  },
  {
    author: "milan",
    text: "धन्यवाद bishnu doctor — हिजो दिनभर बस्नुभयो, हिजो आजसम्म कुनै दुर्घटना छैन। यो organizing को quality हो।",
    replies: [
      { author: "bishnu", text: "Team को discipline को कारण हो। Hands-on लीडरशिप ले काम सजिलो बनाइदियो।" }
    ]
  },
  {
    author: "naresh",
    text: "Live stream को viewer count धेरै राम्रो छ — पहिलो दिन मात्र ३५० बढी viewer थिए। Geographical reach Australia, USA, Middle East बाट पनि।"
  },
  {
    author: "yamuna",
    text: "Post-event का लागि photo collection को drive folder प्रत्येक participant ले upload गर्न सक्ने बनाउनुपर्छ। Memory archive long term value।",
    replies: [
      { author: "manish", text: "मैले shared drive open गरें — group मा link पठायौँ।" }
    ]
  },
  {
    author: "sandip",
    text: "खाजाको quality र distribution flow पनि सहज छ — पन्जा र मास्क पनि सबैले उपयोग गरिरहेका छन्। Hygiene प्रोटोकल proper।"
  },
  {
    author: "kabita",
    text: "Day 2 मा कति बिरुवा हुने अनुमान? Soil prep हिजो जति ज्यादा भयो — पानी पनि सजिलै सेच्न मिल्ने।",
    replies: [
      { author: "arjun", text: "लक्ष्य 200 आज, total 300+ within next 36 hours। Materials supply pipeline ready छ।" }
    ]
  },
  {
    author: "rabindra",
    text: "मेरो organization ले yearly CSR contribution यो अभियानमा लिने proposal अहिले bordroom मा छ। Update आउने बित्तिकै share गर्छु।"
  },
  {
    author: "ishwori",
    text: "Limbu, Tharu, Magar — हाम्रो टीम मा अहिले ५ different ethnic background का साथीहरू एकैसाथ काम गर्दैछौँ। यो साँच्चै beautiful मिसन हो।",
    replies: [
      { author: "suman", text: "🌱 Diversity ले strength बनाउँछ। Photo opportunity पनि powerful छ।" }
    ]
  },
  {
    author: "subash",
    text: "Tree-tagging GPS app proposal आज planning मा थियो — हरेक रोपिएको बिरुवालाई unique ID + lat/long record गर्ने। Maintenance ट्रयाक सजिलो।"
  },
  {
    author: "anu",
    text: "Lunch coordination पूर्ण भयो आजको — local catering ले ५ thousand rupee discount दिए। Sustainability + community support दुवै।",
    replies: [
      { author: "bikash", text: "Donor समूहले lunch cost पनि sponsor गर्ने आग्रह आजै आयो।" }
    ]
  }
];

// ── Walk a thread, post comments + reply chain ──────────────────────────────
async function postThread({ targetType, targetId, node, parentId = null, targetKey }) {
  const member = manifest.members[node.author];
  if (!member?.email) { log(`   ⚠️ author ${node.author} not in manifest`); return null; }
  try {
    const token = await memberLogin(node.author, member.email);
    const body = { targetType, targetId, text: node.text };
    if (parentId) body.parentId = parentId;
    const res = await api("POST", "/comments", { token, body });
    const commentId = res?.data?.comment?.id || res?.data?.id;
    if (!manifest.comments[targetKey]) manifest.comments[targetKey] = [];
    manifest.comments[targetKey].push({ id: commentId, memberSlug: node.author, text: node.text, parentId });
    log(`     ✓ ${parentId ? "↳" : "•"} ${node.author}: ${node.text.slice(0, 50)}...`);
    if (Array.isArray(node.replies)) {
      for (const reply of node.replies) {
        await postThread({ targetType, targetId, node: reply, parentId: commentId, targetKey });
      }
    }
    return commentId;
  } catch (err) {
    log(`   ✗ comment by ${node.author}: ${err.message.slice(0, 120)}`);
    return null;
  }
}

async function phaseBouddhaComments() {
  log(`\n💬 Phase 3: Bouddha comments + replies`);
  const issue = manifest.issues[BOUDDHA_ISSUE_SLUG];
  if (!issue?.id) return;
  const targetKey = `issue:${BOUDDHA_ISSUE_SLUG}`;
  const existing = manifest.comments[targetKey] || [];
  const existingTexts = new Set(existing.map((c) => c.text));
  for (const thread of BOUDDHA_THREADS) {
    if (existingTexts.has(thread.text)) continue;
    await postThread({ targetType: "issue", targetId: issue.id, node: thread, targetKey });
    await saveManifest();
  }
}

const SURYA_EVENT_SLUG = "suryabinayak-afforestation";

async function phaseSuryaComments() {
  log(`\n💬 Phase 4: Suryabinayak comments + replies`);
  const event = manifest.events[SURYA_EVENT_SLUG];
  if (!event?.id) return;
  const targetKey = `event:${SURYA_EVENT_SLUG}`;
  const existing = manifest.comments[targetKey] || [];
  const existingTexts = new Set(existing.map((c) => c.text));
  for (const thread of SURYABINAYAK_THREADS) {
    if (existingTexts.has(thread.text)) continue;
    await postThread({ targetType: "event", targetId: event.id, node: thread, targetKey });
    await saveManifest();
  }
}

// ── Reactions on top-level comments ─────────────────────────────────────────
const REACTIONS = ["👏", "🌱", "❤️", "🙏", "💪", "🎉", "🌟", "🔥"];

async function phaseReactions(targetKey) {
  log(`\n🎯 Phase: reactions on ${targetKey}`);
  const comments = (manifest.comments[targetKey] || []).filter((c) => !c.parentId && c.id);
  const allMembers = Object.keys(manifest.members);
  let cast = 0;
  for (const c of comments) {
    // 3-6 reactors per top-level comment
    const reactorCount = 3 + Math.floor((c.id?.charCodeAt(0) || 0) % 4);
    for (let i = 0; i < reactorCount; i += 1) {
      const reactor = allMembers[(c.id?.charCodeAt(i + 2) || i) % allMembers.length];
      if (reactor === c.memberSlug) continue; // don't react to own
      const member = manifest.members[reactor];
      if (!member?.email) continue;
      const emoji = REACTIONS[(c.id?.charCodeAt(i) || i) % REACTIONS.length];
      try {
        const token = await memberLogin(reactor, member.email);
        await api("POST", `/comments/${c.id}/reactions`, { token, body: { emoji } });
        cast += 1;
      } catch { /* duplicate or already reacted — fine */ }
    }
  }
  log(`   → ${cast} reactions cast`);
}

// ── Suryabinayak participants ───────────────────────────────────────────────
// Fill remaining role-plan: WORKER x7, LOGISTICS x2, SAFETY_LEAD x1
const SURYA_PARTICIPANTS_NEEDED = [
  { memberSlug: "priya",     role: "SAFETY_LEAD" },
  { memberSlug: "anu",       role: "LOGISTICS" },
  { memberSlug: "rajiv",     role: "LOGISTICS" },
  { memberSlug: "deepika",   role: "WORKER" },
  { memberSlug: "nisha",     role: "WORKER" },
  { memberSlug: "kushal",    role: "WORKER" },
  { memberSlug: "saraswati", role: "WORKER" },
  { memberSlug: "naresh",    role: "WORKER" },
  { memberSlug: "asmita",    role: "WORKER" },
  { memberSlug: "milan",     role: "WORKER" }
];

async function phaseSuryaParticipants() {
  log(`\n🧑‍🤝‍🧑 Phase 5: Suryabinayak participants (fill role-plan)`);
  const event = manifest.events[SURYA_EVENT_SLUG];
  if (!event?.id) return;
  const existing = manifest.participants[SURYA_EVENT_SLUG] || [];
  const existingSet = new Set(existing.map((p) => `${p.memberSlug}:${p.role}`));
  for (const p of SURYA_PARTICIPANTS_NEEDED) {
    const key = `${p.memberSlug}:${p.role}`;
    if (existingSet.has(key)) continue;
    const member = manifest.members[p.memberSlug];
    if (!member?.email) { log(`   ⚠️ ${p.memberSlug} missing`); continue; }
    try {
      const token = await memberLogin(p.memberSlug, member.email);
      await api("POST", `/events/${event.id}/participants`, { token, body: { role: p.role } });
      if (!manifest.participants[SURYA_EVENT_SLUG]) manifest.participants[SURYA_EVENT_SLUG] = [];
      manifest.participants[SURYA_EVENT_SLUG].push({ memberSlug: p.memberSlug, role: p.role });
      log(`     ✓ ${p.memberSlug} → ${p.role}`);
      await saveManifest();
    } catch (err) {
      if (/already|409|DUPLICATE|PARTICIPANT_/i.test(err.message)) {
        log(`     ↺ ${p.memberSlug}/${p.role}: ${err.message.slice(0, 100)}`);
      } else {
        log(`     ✗ ${p.memberSlug}/${p.role}: ${err.message.slice(0, 120)}`);
      }
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log(`\n🌱 seed-rich-pair — Bouddha + Suryabinayak deep-fill`);
  log(`   API: ${API_BASE}`);
  await loadManifest();
  log(`   Manifest: ${Object.keys(manifest.members).length} members, ${Object.keys(manifest.issues).length} issues, ${Object.keys(manifest.events).length} events`);

  await phaseMembers();
  await phaseBouddhaVotes();
  await phaseBouddhaComments();
  await phaseSuryaParticipants();
  await phaseSuryaComments();
  await phaseReactions("issue:" + BOUDDHA_ISSUE_SLUG);
  await phaseReactions("event:" + SURYA_EVENT_SLUG);
  await saveManifest();

  log(`\n✅ seed-rich-pair complete`);
  log(`   Bouddha comments: ${(manifest.comments["issue:" + BOUDDHA_ISSUE_SLUG] || []).length}`);
  log(`   Suryabinayak comments: ${(manifest.comments["event:" + SURYA_EVENT_SLUG] || []).length}`);
  log(`   Suryabinayak participants: ${(manifest.participants[SURYA_EVENT_SLUG] || []).length}`);
}

main().catch((err) => {
  console.error("\n❌ Failed:", err.message);
  process.exit(1);
});
