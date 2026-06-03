import fs from "node:fs";
import path from "node:path";

const ROADMAP_PATH = path.join(process.cwd(), "docs", "ops", "00-master-roadmap.md");
const OVERALL_RE = /^## Overall Progress\s*—\s*(\d+)%/;
const PHASE_RE = /^## Phase\s+(\d+)\s*—\s*(.+?)\s*`w:(\d+)`\s*📊\s*(\d+)%\s*$/;
const LEAF_RE = /^(\s*)-\s*\[([ x~!\-])\]\s*([\d.]+[a-z]?)\s+(.+?)\s*$/;
const DONE_DATE_RE = /←\s*done:\s*(\d{4}-\d{2}-\d{2})/;

const HIDDEN_PHASES = new Set([9, 11, 12]);
const RECENT_WINDOW_DAYS = 14;
const RECENT_DONE_CAP = 8;

function cleanLabel(rest) {
  return rest
    .replace(/\s*`w:\d+`\s*/g, " ")
    .replace(/\s*←\s*.+$/, "")
    .replace(/\s*\*\([\s\S]+?\)\*\s*$/, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function topId(id) {
  return id.split(".")[0];
}

let cached = null;

export function getRoadmapSummary() {
  if (cached && process.env.NODE_ENV === "production") return cached;

  const text = fs.readFileSync(ROADMAP_PATH, "utf8");
  const lines = text.split(/\r?\n/);

  let overallPercent = null;
  const phases = [];
  const inProgressAll = [];
  const pendingAll = [];
  const doneRecent = [];
  let currentPhase = null;

  const cutoffMs = Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  for (const line of lines) {
    const overall = line.match(OVERALL_RE);
    if (overall) {
      overallPercent = Number(overall[1]);
      continue;
    }

    const phase = line.match(PHASE_RE);
    if (phase) {
      currentPhase = {
        number: Number(phase[1]),
        title: phase[2].trim(),
        weight: Number(phase[3]),
        percent: Number(phase[4])
      };
      phases.push(currentPhase);
      continue;
    }

    const leaf = line.match(LEAF_RE);
    if (!leaf || !currentPhase) continue;

    const status = leaf[2];
    const id = leaf[3];
    const rest = leaf[4];
    const base = {
      id,
      label: cleanLabel(rest),
      depth: leaf[1].length,
      phaseNumber: currentPhase.number,
      phaseTitle: currentPhase.title
    };

    if (status === "~") {
      inProgressAll.push(base);
    } else if (status === " ") {
      if (HIDDEN_PHASES.has(currentPhase.number)) continue;
      pendingAll.push(base);
    } else if (status === "x") {
      const dateMatch = rest.match(DONE_DATE_RE);
      if (!dateMatch) continue;
      if (HIDDEN_PHASES.has(currentPhase.number)) continue;
      const ts = Date.parse(`${dateMatch[1]}T00:00:00Z`);
      if (Number.isNaN(ts) || ts < cutoffMs) continue;
      doneRecent.push({ ...base, doneAt: dateMatch[1] });
    }
  }

  const activeIds = new Set(inProgressAll.map((i) => i.id));
  const inProgress = inProgressAll.filter(
    (item) => ![...activeIds].some((other) => other !== item.id && other.startsWith(`${item.id}.`))
  );

  const pendingIds = new Set(pendingAll.map((p) => p.id));
  const upcoming = pendingAll.filter(
    (item) => ![...pendingIds].some((other) => other !== item.id && item.id.startsWith(`${other}.`))
  );

  const doneIds = new Set(doneRecent.map((d) => d.id));
  const recentlyDone = doneRecent
    .filter((item) => ![...doneIds].some((other) => other !== item.id && item.id.startsWith(`${other}.`)))
    .sort((a, b) => (a.doneAt < b.doneAt ? 1 : a.doneAt > b.doneAt ? -1 : 0))
    .slice(0, RECENT_DONE_CAP);

  cached = { overallPercent, phases, inProgress, upcoming, recentlyDone };
  return cached;
}

// Full phase-by-phase leaf tree (roadmap 14.2.2). Returns a map of
// phase number -> { phase, leaves: [{id, label, status, depth, doneAt?}] }
// covering ALL leaves regardless of status. Used by the /development
// Layer 2 tree view; the summary export above stays unchanged.
let cachedTree = null;

export function getRoadmapFullTree() {
  if (cachedTree && process.env.NODE_ENV === "production") return cachedTree;

  const text = fs.readFileSync(ROADMAP_PATH, "utf8");
  const lines = text.split(/\r?\n/);
  const map = new Map();
  let currentPhase = null;

  for (const line of lines) {
    const phase = line.match(PHASE_RE);
    if (phase) {
      currentPhase = {
        number: Number(phase[1]),
        title: phase[2].trim(),
        weight: Number(phase[3]),
        percent: Number(phase[4])
      };
      map.set(currentPhase.number, { phase: currentPhase, leaves: [] });
      continue;
    }

    const leaf = line.match(LEAF_RE);
    if (!leaf || !currentPhase) continue;

    const status = leaf[2];
    const id = leaf[3];
    const rest = leaf[4];
    const dateMatch = rest.match(DONE_DATE_RE);
    map.get(currentPhase.number).leaves.push({
      id,
      label: cleanLabel(rest),
      status,
      depth: leaf[1].length,
      doneAt: dateMatch ? dateMatch[1] : null
    });
  }

  cachedTree = Array.from(map.values()).sort(
    (a, b) => a.phase.number - b.phase.number
  );
  return cachedTree;
}

export { topId };
