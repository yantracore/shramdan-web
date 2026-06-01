# Shramdaan Documentation

> Top-level index. Folders are organized by audience and purpose, not by ID.

If you are a **person new to श्रमदान**, start at [`public/00-intro.md`](public/00-intro.md). That is the front door.

If you are an **agent (AI or human contributor)**, the rest of this file is for you.

---

## Folder map

| Folder | For | Contents |
| --- | --- | --- |
| [`public/`](public/) | The world — non-technical readers | Intro, philosophy, "what is श्रमदान?", how to join, who builds this, who श्रमेश is |
| [`ai-agents/`](ai-agents/) | AI teammates (श्रमेश and others) + onboarding humans | Character bible + behavior contracts for developer mode + user-facing mode |
| [`product/`](product/) | Product thinking | Project summary, product plan, user journeys, website structure |
| [`design/`](design/) | Visual + interaction language | Design language guide, motion grammar, color/type, "pleasing-to-use" principle |
| [`engineering/`](engineering/) | Builders | Implementation notes, API reference, frontend usage map, backend gaps |
| [`ops/`](ops/) | What's being shipped, what's left | Master roadmap, polish backlog, safety + event model |

The `public/` and `ai-agents/` folders speak with character; the others are operational reference material.

---

## Standing rules

- **`ops/00-master-roadmap.md`** is the first file to read each session. ([Agent Update Protocol](ops/00-master-roadmap.md#agent-update-protocol))
- **`ops/00-polish-backlog.md`** is the second — open `P1` items should mix into "what's next" proposals.
- **`engineering/07-api-reference.json`** has a 6h freshness TTL. ([Freshness protocol](engineering/10-frontend-api-usage.md#freshness-protocol))
- **`ai-agents/01-shramesh.md`** is the character canon for all product copy and AI surfaces.

---

## Sister docs not in this tree

- `../.verify/` — Playwright verification artifacts (gitignored, ephemeral)
- `../CLAUDE.md` *(planned)* — top-level agent quickstart pointing at this folder
