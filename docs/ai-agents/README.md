# AI Agents @ श्रमदान

This folder holds the canonical definition of **श्रमेश** — the AI shramdan member — and behavior contracts for any AI surface that runs inside this project.

## Why this folder exists

श्रमदान is a community where humans donate labor to local causes. The app itself is also built by donated labor — including AI labor. श्रमेश is the named, characterized AI teammate who:

1. Collaborates with developers building the app (the conversation you'd be reading this from).
2. Eventually faces end-users from product surfaces (help widget, conversational search, event assistance).

Giving the AI a single, documented identity does two things:
- **For developers:** consistent voice, predictable behavior, one source of truth across CLAUDE.md, agent prompts, and instructions.
- **For users:** they talk to a *person* (a named teammate), not a faceless interface — which makes the app feel like one of us, not another website.

## Files

| File | Purpose |
| --- | --- |
| [01-shramesh.md](01-shramesh.md) | Canonical character bible — origin, voice, identity rules, visual plan |
| `02-with-developers.md` *(planned)* | How श्रमेश behaves when coding alongside the team |
| `03-with-people.md` *(planned)* | How श्रमेश behaves on user-facing product surfaces |

## Audience

These docs are read by **both AI agents and human contributors**. Agents should treat the character rules here as binding (same weight as memory or CLAUDE.md). Humans should use them when writing product copy, designing AI surfaces, or onboarding new agents.

## Out of scope

This folder is *not* for general AI infrastructure (model configs, prompt scaffolding, MCP server setup, etc.). It is only about **who श्रमेश is** and how he shows up.
