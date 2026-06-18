#!/usr/bin/env node
// Refresh docs/engineering/07-api-reference.json from the backend OpenAPI source.
// Side-effects per (default) run:
//   - backup current spec → docs/engineering/07-api-reference.prev.json
//   - overwrite docs/engineering/07-api-reference.json with the freshly fetched body
//   - write a DEEP field-level diff to docs/engineering/07-api-reference.changes.json
//   - update lastFetchedAt + lastFetchedAtDisplay in docs/engineering/07-api-reference.meta.json
//
// Offline diff mode (no fetch, no file mutation):
//   node scripts/refresh-api-docs.mjs --from <oldSpec.json> --to <newSpec.json> [--out <changes.json>]
//   Compares two spec files on disk and prints the deep diff. Use --to current to read the
//   live local spec. Handy for auditing field drift across a range of backend deploys
//   (e.g. diff a git-historical spec against today's).
//
// Diff depth (added 2026-06-18, supersedes the 2026-05-28 "shape-level only" choice):
//   The comparison key is still `METHOD /path`. For each shared endpoint we now compare,
//   field by field:
//     - parameter NAMES (in + required + type), not just the count
//     - request-body property paths (recursive), each leaf's type/format/enum
//     - request-body `required` array membership
//     - response field paths per status code, drawn from `schema` when present else `example`
//   So a backend renaming a response field, flipping a type, or extending an enum now shows
//   up as a `~ modified` entry instead of silently passing as `~0`.
//
// Exit codes: 0 on success (with or without diff baseline), 1 on fetch/parse failure.

import { readFile, writeFile, copyFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const metaPath = resolve(root, "docs/engineering/07-api-reference.meta.json");
const prevPath = resolve(root, "docs/engineering/07-api-reference.prev.json");
const changesPath = resolve(root, "docs/engineering/07-api-reference.changes.json");

// ---------------------------------------------------------------------------
// Deep-diff helpers
// ---------------------------------------------------------------------------

const HTTP_METHODS = /^(get|post|put|patch|delete|options|head)$/i;

// Pick the JSON-ish content node out of a requestBody/response `content` map.
function jsonContent(content) {
  if (!content || typeof content !== "object") return null;
  return content["application/json"] || Object.values(content)[0] || null;
}

// One-line descriptor for a leaf schema: type[:format][{enum|sorted}].
function leafDesc(schema) {
  if (!schema || typeof schema !== "object") return "any";
  const type =
    schema.type ||
    (Array.isArray(schema.enum)
      ? "enum"
      : schema.properties
        ? "object"
        : schema.items
          ? "array"
          : "any");
  let d = type;
  if (schema.format) d += `:${schema.format}`;
  if (Array.isArray(schema.enum)) d += `{${schema.enum.map(String).sort().join("|")}}`;
  return d;
}

// Recursively flatten an OpenAPI schema into a Map<dottedPath, leafDesc>.
function flattenSchema(schema, prefix, out) {
  if (!schema || typeof schema !== "object") return;
  // Merge allOf members so composed objects still expand.
  if (Array.isArray(schema.allOf)) {
    for (const sub of schema.allOf) flattenSchema(sub, prefix, out);
  }
  if (schema.properties && typeof schema.properties === "object") {
    for (const [k, v] of Object.entries(schema.properties)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && (v.properties || v.type === "object" || Array.isArray(v.allOf))) {
        flattenSchema(v, key, out);
      } else if (v && v.type === "array" && v.items) {
        if (v.items.properties || v.items.type === "object") {
          flattenSchema(v.items, `${key}[]`, out);
        } else {
          out.set(`${key}[]`, leafDesc(v.items));
        }
      } else {
        out.set(key, leafDesc(v));
      }
    }
    return;
  }
  if (schema.type === "array" && schema.items) {
    flattenSchema(schema.items, `${prefix}[]`, out);
    return;
  }
  if (prefix) out.set(prefix, leafDesc(schema));
}

// Flatten a concrete example value into Map<dottedPath, jsType>.
function flattenExample(val, prefix, out) {
  if (Array.isArray(val)) {
    if (val.length) flattenExample(val[0], `${prefix}[]`, out);
    else out.set(`${prefix}[]`, "array");
  } else if (val && typeof val === "object") {
    for (const [k, v] of Object.entries(val)) {
      flattenExample(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else if (prefix) {
    out.set(prefix, val === null ? "null" : typeof val);
  }
}

function paramSig(p) {
  if (!p || typeof p !== "object") return "?";
  const loc = p.in || "?";
  const req = p.required ? "*" : "";
  const t = (p.schema && (p.schema.type || (p.schema.enum ? "enum" : ""))) || "";
  return `${loc}:${p.name}${req}${t ? `(${t})` : ""}`;
}

// Build a rich, comparable fingerprint for a single operation definition.
function fingerprint(def) {
  const fp = { params: [], reqRequired: [], reqProps: {}, responses: {}, security: false };

  if (Array.isArray(def.parameters)) {
    fp.params = def.parameters.map(paramSig).sort();
  }

  const reqSchema = jsonContent(def.requestBody?.content)?.schema;
  if (reqSchema) {
    fp.reqRequired = Array.isArray(reqSchema.required) ? reqSchema.required.slice().sort() : [];
    const m = new Map();
    flattenSchema(reqSchema, "", m);
    fp.reqProps = Object.fromEntries([...m.entries()].sort());
  }

  for (const [code, r] of Object.entries(def.responses || {})) {
    const cj = jsonContent(r?.content);
    const m = new Map();
    if (cj?.schema) flattenSchema(cj.schema, "", m);
    else if (cj && cj.example !== undefined) flattenExample(cj.example, "", m);
    fp.responses[code] = Object.fromEntries([...m.entries()].sort());
  }

  fp.security = Array.isArray(def.security) && def.security.length > 0;
  return fp;
}

function flatten(spec) {
  const out = new Map();
  for (const [path, ops] of Object.entries(spec.paths || {})) {
    if (!ops || typeof ops !== "object") continue;
    for (const [method, def] of Object.entries(ops)) {
      if (!def || typeof def !== "object") continue;
      if (!HTTP_METHODS.test(method)) continue;
      out.set(`${method.toUpperCase()} ${path}`, fingerprint(def));
    }
  }
  return out;
}

// Compare two field maps; push +added / -removed / ~typed-change lines into `changes`.
function diffFieldMap(prevObj, currObj, label, changes) {
  const prevKeys = new Set(Object.keys(prevObj));
  const currKeys = new Set(Object.keys(currObj));
  for (const k of currKeys) {
    if (!prevKeys.has(k)) changes.push(`${label} +${k}(${currObj[k]})`);
    else if (prevObj[k] !== currObj[k]) changes.push(`${label} ~${k} ${prevObj[k]}→${currObj[k]}`);
  }
  for (const k of prevKeys) {
    if (!currKeys.has(k)) changes.push(`${label} -${k}`);
  }
}

function diffList(prevArr, currArr, label, changes) {
  const prevSet = new Set(prevArr);
  const currSet = new Set(currArr);
  for (const v of currSet) if (!prevSet.has(v)) changes.push(`${label} +${v}`);
  for (const v of prevSet) if (!currSet.has(v)) changes.push(`${label} -${v}`);
}

function diffFingerprints(prev, curr) {
  const changes = [];
  diffList(prev.params, curr.params, "param", changes);
  diffList(prev.reqRequired, curr.reqRequired, "req.required", changes);
  diffFieldMap(prev.reqProps, curr.reqProps, "req.field", changes);

  const prevCodes = new Set(Object.keys(prev.responses));
  const currCodes = new Set(Object.keys(curr.responses));
  for (const code of currCodes) if (!prevCodes.has(code)) changes.push(`resp +${code}`);
  for (const code of prevCodes) if (!currCodes.has(code)) changes.push(`resp -${code}`);
  for (const code of currCodes) {
    if (prevCodes.has(code)) {
      diffFieldMap(prev.responses[code], curr.responses[code], `resp.${code}`, changes);
    }
  }

  if (prev.security !== curr.security) {
    changes.push(`auth ${prev.security}→${curr.security}`);
  }
  return changes;
}

// Compute the full added/removed/modified diff between two specs.
function diffSpecs(prevSpec, currSpec) {
  const prevMap = flatten(prevSpec);
  const currMap = flatten(currSpec);
  const added = [];
  const removed = [];
  const modified = [];

  for (const [endpoint, currFp] of currMap) {
    if (!prevMap.has(endpoint)) {
      added.push(endpoint);
      continue;
    }
    const changes = diffFingerprints(prevMap.get(endpoint), currFp);
    if (changes.length > 0) modified.push({ endpoint, changes });
  }
  for (const endpoint of prevMap.keys()) {
    if (!currMap.has(endpoint)) removed.push(endpoint);
  }

  added.sort();
  removed.sort();
  modified.sort((a, b) => a.endpoint.localeCompare(b.endpoint));
  return { added, removed, modified };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from") args.from = argv[++i];
    else if (a === "--to") args.to = argv[++i];
    else if (a === "--out") args.out = argv[++i];
  }
  return args;
}

// ---------------------------------------------------------------------------
// Offline diff mode: compare two spec files on disk, no fetch, no mutation.
// ---------------------------------------------------------------------------

const cli = parseArgs(process.argv.slice(2));
if (cli.from || cli.to) {
  if (!cli.from || !cli.to) {
    console.error("Offline diff needs both --from <oldSpec.json> and --to <newSpec.json>.");
    process.exit(1);
  }
  const meta = JSON.parse(await readFile(metaPath, "utf8"));
  const resolveSpec = (p) => (p === "current" ? resolve(root, meta.localPath) : resolve(p));
  const prevSpec = JSON.parse(await readFile(resolveSpec(cli.from), "utf8"));
  const currSpec = JSON.parse(await readFile(resolveSpec(cli.to), "utf8"));
  const { added, removed, modified } = diffSpecs(prevSpec, currSpec);

  const summary = {
    mode: "offline",
    from: cli.from,
    to: cli.to,
    totals: { added: added.length, removed: removed.length, modified: modified.length },
    added,
    removed,
    modified,
  };
  if (cli.out) {
    await writeFile(resolve(cli.out), JSON.stringify(summary, null, 2) + "\n", "utf8");
  }
  console.log(JSON.stringify(summary, null, 2));
  console.log(
    `\nOffline deep diff ${cli.from} → ${cli.to}: +${added.length} -${removed.length} ~${modified.length}`,
  );
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Default mode: fetch + backup + write + deep diff vs prev baseline.
// ---------------------------------------------------------------------------

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

if (hasPrevBaseline) {
  const prev = JSON.parse(await readFile(prevPath, "utf8"));
  const curr = JSON.parse(body);
  const { added, removed, modified } = diffSpecs(prev, curr);

  const summary = {
    previousFetchedAt,
    currentFetchedAt: lastFetchedAt,
    comparedAt: new Date().toISOString(),
    diffDepth: "field-level",
    totals: {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
    },
    added,
    removed,
    modified,
    acknowledgedAt: null,
  };
  await writeFile(changesPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(
    `API docs refreshed. Field-level diff vs ${previousFetchedAt}: +${added.length} -${removed.length} ~${modified.length}`,
  );
} else {
  console.log("API docs fetched (no prior baseline — diff will start on the next refresh).");
}

meta.lastFetchedAt = lastFetchedAt;
meta.lastFetchedAtDisplay = lastFetchedAtDisplay;
await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
