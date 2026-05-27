import fs from "node:fs";
import path from "node:path";

const ROADMAP_PATH = path.join(process.cwd(), "docs", "00-master-roadmap.md");
const OVERALL_RE = /^## Overall Progress\s*—\s*(\d+)%/;
const PHASE_RE = /^## Phase\s+(\d+)\s*—\s*(.+?)\s*`w:(\d+)`\s*📊\s*(\d+)%\s*$/;
const LEAF_RE = /^(\s*)-\s*\[([ x~!\-])\]\s*([\d.]+[a-z]?)\s+(.+?)\s*$/;

function cleanLabel(rest) {
  return rest
    .replace(/\s*`w:\d+`\s*/g, " ")
    .replace(/\s*←\s*.+$/, "")
    .replace(/\s*\*\([\s\S]+?\)\*\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

let cached = null;

export function getRoadmapSummary() {
  if (cached && process.env.NODE_ENV === "production") return cached;

  const text = fs.readFileSync(ROADMAP_PATH, "utf8");
  const lines = text.split(/\r?\n/);

  let overallPercent = null;
  const phases = [];
  const inProgressAll = [];
  let currentPhase = null;

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
    if (leaf && currentPhase && leaf[2] === "~") {
      inProgressAll.push({
        id: leaf[3],
        label: cleanLabel(leaf[4]),
        depth: leaf[1].length,
        phaseNumber: currentPhase.number,
        phaseTitle: currentPhase.title
      });
    }
  }

  const ids = new Set(inProgressAll.map((i) => i.id));
  const inProgress = inProgressAll.filter(
    (item) => ![...ids].some((other) => other !== item.id && other.startsWith(`${item.id}.`))
  );

  cached = { overallPercent, phases, inProgress };
  return cached;
}
