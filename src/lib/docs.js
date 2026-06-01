// Filesystem reader for the in-app /learn docs reader (Phase 3).
//
// Reads markdown files from docs/public/ at server-request time. Strict
// allowlist: only files inside docs/public/, only .md extension, no
// path traversal. Returns null when slug isn't safe — the route handles
// that as 404.

import { promises as fs } from "node:fs";
import path from "node:path";

const PUBLIC_DOCS_DIR = path.join(process.cwd(), "docs", "public");

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function isSafeSlug(slug) {
  return typeof slug === "string" && SLUG_PATTERN.test(slug);
}

export async function listPublicDocs() {
  const entries = await fs.readdir(PUBLIC_DOCS_DIR, { withFileTypes: true });
  const docs = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".md")) continue;
    const slug = entry.name.replace(/\.md$/, "");
    if (!isSafeSlug(slug)) continue;
    const title = await extractTitle(slug);
    docs.push({ slug, title, filename: entry.name });
  }
  docs.sort((a, b) => a.filename.localeCompare(b.filename, "en"));
  return docs;
}

export async function getPublicDoc(slug) {
  if (!isSafeSlug(slug)) return null;
  const filePath = path.join(PUBLIC_DOCS_DIR, `${slug}.md`);
  // Defense in depth: ensure resolved path stays under PUBLIC_DOCS_DIR.
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(PUBLIC_DOCS_DIR) + path.sep)) {
    return null;
  }
  try {
    const content = await fs.readFile(resolved, "utf8");
    const title = extractTitleFromContent(content) ?? slug;
    return { slug, title, content };
  } catch {
    return null;
  }
}

async function extractTitle(slug) {
  try {
    const content = await fs.readFile(path.join(PUBLIC_DOCS_DIR, `${slug}.md`), "utf8");
    return extractTitleFromContent(content) ?? slug;
  } catch {
    return slug;
  }
}

function extractTitleFromContent(content) {
  const match = content.match(/^#\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}
