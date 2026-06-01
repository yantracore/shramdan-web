#!/usr/bin/env node
// Refresh docs/engineering/07-api-reference.json from the backend OpenAPI source.
// Side-effects per run:
//   - backup current spec → docs/engineering/07-api-reference.prev.json
//   - overwrite docs/engineering/07-api-reference.json with the freshly fetched body
//   - write shape-level diff to docs/engineering/07-api-reference.changes.json
//   - update lastFetchedAt + lastFetchedAtDisplay in docs/engineering/07-api-reference.meta.json
//
// Exit codes: 0 on success (with or without diff baseline), 1 on fetch/parse failure.

import { readFile, writeFile, copyFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const metaPath = resolve(root, "docs/engineering/07-api-reference.meta.json");
const prevPath = resolve(root, "docs/engineering/07-api-reference.prev.json");
const changesPath = resolve(root, "docs/engineering/07-api-reference.changes.json");

const meta = JSON.parse(await readFile(metaPath, "utf8"));
const localPath = resolve(root, meta.localPath);

let hasPrevBaseline = false;
try {
  await access(localPath);
  await copyFile(localPath, prevPath);
  hasPrevBaseline = true;
} catch {
  // first run — no local spec yet, skip backup
}

const res = await fetch(meta.source);
if (!res.ok) {
  console.error(`Fetch failed: ${res.status} ${res.statusText} from ${meta.source}`);
  process.exit(1);
}
const body = await res.text();
JSON.parse(body); // validate JSON before overwriting
await writeFile(localPath, body, "utf8");

const previousFetchedAt = meta.lastFetchedAt;
const now = new Date();
const nptShifted = new Date(now.getTime() + (5 * 60 + 45) * 60_000);
const pad = (n) => String(n).padStart(2, "0");
const yyyy = nptShifted.getUTCFullYear();
const mm = pad(nptShifted.getUTCMonth() + 1);
const dd = pad(nptShifted.getUTCDate());
const hh = pad(nptShifted.getUTCHours());
const mi = pad(nptShifted.getUTCMinutes());
const ss = pad(nptShifted.getUTCSeconds());
const lastFetchedAt = `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}+05:45`;
const lastFetchedAtDisplay = `${yyyy}-${mm}-${dd} ${hh}:${mi} NPT`;

function flatten(spec) {
  const out = new Map();
  for (const [path, ops] of Object.entries(spec.paths || {})) {
    if (!ops || typeof ops !== "object") continue;
    for (const [method, def] of Object.entries(ops)) {
      if (!def || typeof def !== "object") continue;
      if (!/^(get|post|put|patch|delete|options|head)$/i.test(method)) continue;
      out.set(`${method.toUpperCase()} ${path}`, {
        params: Array.isArray(def.parameters) ? def.parameters.length : 0,
        hasBody: Boolean(def.requestBody),
        responses: Object.keys(def.responses || {}).sort().join(","),
        security: Array.isArray(def.security) && def.security.length > 0,
      });
    }
  }
  return out;
}

if (hasPrevBaseline) {
  const prev = JSON.parse(await readFile(prevPath, "utf8"));
  const curr = JSON.parse(body);
  const prevMap = flatten(prev);
  const currMap = flatten(curr);

  const added = [];
  const removed = [];
  const modified = [];

  for (const [endpoint, currShape] of currMap) {
    if (!prevMap.has(endpoint)) {
      added.push(endpoint);
      continue;
    }
    const prevShape = prevMap.get(endpoint);
    const changes = [];
    if (prevShape.params !== currShape.params) {
      changes.push(`params ${prevShape.params}→${currShape.params}`);
    }
    if (prevShape.hasBody !== currShape.hasBody) {
      changes.push(`requestBody ${prevShape.hasBody}→${currShape.hasBody}`);
    }
    if (prevShape.responses !== currShape.responses) {
      changes.push(`responses [${prevShape.responses}]→[${currShape.responses}]`);
    }
    if (prevShape.security !== currShape.security) {
      changes.push(`auth ${prevShape.security}→${currShape.security}`);
    }
    if (changes.length > 0) modified.push({ endpoint, changes });
  }
  for (const endpoint of prevMap.keys()) {
    if (!currMap.has(endpoint)) removed.push(endpoint);
  }

  const summary = {
    previousFetchedAt,
    currentFetchedAt: lastFetchedAt,
    comparedAt: new Date().toISOString(),
    totals: {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
    },
    added: added.sort(),
    removed: removed.sort(),
    modified: modified.sort((a, b) => a.endpoint.localeCompare(b.endpoint)),
    acknowledgedAt: null,
  };
  await writeFile(changesPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(
    `API docs refreshed. Diff vs ${previousFetchedAt}: +${added.length} -${removed.length} ~${modified.length}`,
  );
} else {
  console.log("API docs fetched (no prior baseline — diff will start on the next refresh).");
}

meta.lastFetchedAt = lastFetchedAt;
meta.lastFetchedAtDisplay = lastFetchedAtDisplay;
await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
