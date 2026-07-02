#!/usr/bin/env node
// One-shot repair: replace dead `cdn.shramdan.org` cover URLs on LIVE campaigns
// with real R2 uploads (authorized demo-data cleanup, requested 2026-07-02).
//
// Background: two old seed batches (`open15-*`, `seed-issue-cover-*`) wrote raw
// cover URLs on a host that no longer resolves, so those cards render empty and
// every page view logs ERR_NAME_NOT_RESOLVED. This script finds every campaign
// whose `image` still points at that host and gives its ISSUE a fresh cover via
// the real upload pipeline (presign → R2 PUT → confirm → PATCH coverImageId),
// reusing the local demo-events corpus, matched by category. Repeated artwork
// across campaigns is acceptable — the goal is zero dead hosts.
//
// Idempotent by construction: a re-run only sees campaigns still on the dead
// host. Each issue gets its OWN upload record (attaching one upload to two
// issues is rejected by the backend).
//
// Usage:
//   node scripts/fix-dead-cdn-covers.mjs --dry-run
//   node scripts/fix-dead-cdn-covers.mjs

import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MEDIA_DIR = join(ROOT, "public", "images", "demo-events");

const API_BASE = "https://api.shramdan.org/api/v1";
const ADMIN = { email: "contact@yantracore.com", password: "123456" };
const DEAD_HOST = "cdn.shramdan.org";

const DRY = process.argv.includes("--dry-run");
const log = (...m) => console.log(...m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Donor artwork per category — rotated so neighbours differ where possible.
const DONORS = {
  DRAINAGE: ["muglin-drains.jpg", "naubise-drains.jpg", "guheswari-cleanup-done.jpg"],
  ROADSIDE: ["galchhi-roadside.jpg", "lumbini-roadside.jpg", "boudha-done.jpg"],
  RIVERBANK: ["melamchi-riverbank.jpg", "bagmati-cleanup.jpg", "surkhet-bulbule.jpg"],
  PARK_PUBLIC_SPACE: ["ratnapark-cleanup.jpg", "thimi-park-done.jpg", "kamalpokhari-beautify.jpg"],
  HIKING_TRAIL: ["antu-trail.jpg", "nagarkot-trail.jpg", "gokarneshwar-trail.jpg"],
  VACANT_LAND: ["bardia-buffer.jpg", "sauraha-buffer.jpg", "shuklaphanta-done.jpg"],
  OTHER: ["school-paint.jpg", "sinamangal-walk.jpg", "ratnapark-cleanup.jpg"]
};
const donorCursors = {};
function pickDonor(category) {
  const key = DONORS[category] ? category : "OTHER";
  const list = DONORS[key];
  const i = donorCursors[key] || 0;
  donorCursors[key] = i + 1;
  return list[i % list.length];
}

async function api(method, path, { token, body, retries = 2 } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  for (let attempt = 0; ; attempt += 1) {
    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(500 * (attempt + 1));
      continue;
    }
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-json */ }
    if (!res.ok) {
      if (attempt < retries && (res.status >= 500 || res.status === 429)) {
        await sleep(500 * (attempt + 1));
        continue;
      }
      throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
    }
    return json;
  }
}

async function adminLogin() {
  const body = await api("POST", "/auth/login", { body: ADMIN });
  const token = body?.data?.accessToken;
  if (!token) throw new Error(`login returned no token: ${JSON.stringify(body).slice(0, 200)}`);
  const me = await api("GET", "/auth/me", { token });
  const user = me?.data?.user || me?.data;
  if (user?.role !== "ADMIN") throw new Error(`role is ${user?.role}, not ADMIN`);
  return token;
}

async function findBroken() {
  const broken = [];
  for (let page = 1, hasNext = true; hasNext; page += 1) {
    const res = await api("GET", `/campaigns?mode=maximum&limit=100&page=${page}`);
    const items = res?.data?.items || [];
    hasNext = Boolean(res?.data?.pagination?.hasNext);
    for (const item of items) {
      if ((item.image || "").includes(DEAD_HOST)) broken.push(item);
    }
  }
  return broken;
}

// presign → R2 PUT → confirm; returns the fresh upload id.
async function uploadDonor(filename, token) {
  const localPath = join(MEDIA_DIR, filename);
  const fileStat = await stat(localPath);
  const mimeType = "image/jpeg";
  const presign = await api("POST", "/uploads/presign", {
    token,
    body: { filename, mimeType, size: fileStat.size, isPublic: true, fileType: "IMAGE" }
  });
  const uploadId = presign?.data?.upload?.id;
  const presignedUrl = presign?.data?.presignedUrl;
  if (!uploadId || !presignedUrl) {
    throw new Error(`presign returned no id/url: ${JSON.stringify(presign).slice(0, 200)}`);
  }
  const buffer = await readFile(localPath);
  const put = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: buffer
  });
  if (!put.ok) throw new Error(`R2 PUT failed: ${put.status} ${(await put.text()).slice(0, 200)}`);
  await api("POST", `/uploads/${uploadId}/confirm`, { token });
  return uploadId;
}

const broken = await findBroken();
log(`🔍 ${broken.length} campaign(s) still on ${DEAD_HOST}`);
if (!broken.length) process.exit(0);

const token = DRY ? null : await adminLogin();
const failures = [];
for (const item of broken) {
  // In mode=maximum, item.id is always the ISSUE id (events carry their own id
  // under item.event.id) — the cover lives on the issue, so patch the issue.
  const donor = pickDonor(item.category);
  if (DRY) {
    log(`   [DRY] ${item.status.padEnd(9)} ${item.slug} ← ${donor}`);
    continue;
  }
  try {
    const uploadId = await uploadDonor(donor, token);
    await api("PATCH", `/issues/${item.id}`, { token, body: { coverImageId: uploadId } });
    log(`   ✓ ${item.status.padEnd(9)} ${item.slug} ← ${donor}`);
  } catch (err) {
    failures.push({ slug: item.slug, status: item.status, error: String(err.message || err) });
    log(`   ✗ ${item.status.padEnd(9)} ${item.slug}: ${err.message}`);
  }
}

if (failures.length) {
  log(`\n⚠️ ${failures.length} failed — statuses: ${[...new Set(failures.map((f) => f.status))].join(", ")}`);
  process.exitCode = 1;
} else if (!DRY) {
  log("\n✅ all dead-host covers replaced");
}
