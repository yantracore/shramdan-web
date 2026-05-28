# Shramdaan Polish Backlog

> Sister document to [00-master-roadmap.md](00-master-roadmap.md). The roadmap tracks **what is left to ship** (discrete, binary). This file tracks **how shipped features can get better** (continuous, infinite).
>
> Polish never blocks new feature work, but it prevents shipped features from rotting. Keeping it separate keeps the roadmap focused.
>
> **This file is maintained by coding agents** — same protocol style as the roadmap.

## How To Read This File

Each polish item is a single-line entry under a phase section:

```
- [ ] P1 [from 1.1] Skeleton loader on /issues list — effort:S
- [x] P2 [from 0.3.3] Playlist autoplay next — effort:S ← done: 2026-05-26
- [-] P3 [from 1.2] Read-time indicator — effort:S *(dropped: not worth the complexity)*
```

### Fields

| Field | Meaning |
| --- | --- |
| `[ ]` `[~]` `[x]` `[-]` | Same markers as roadmap (pending / in progress / done / cancelled) |
| `P1` / `P2` / `P3` | Priority — see below |
| `[from X.Y]` | The roadmap leaf this polishes — cross-reference for context |
| Title | Terse, one line, what the improvement is |
| `effort:S/M/L` | Rough size — `S`: under 2h, `M`: half-day, `L`: full day or more |
| `← done: YYYY-MM-DD` | When closed (same convention as roadmap) |

### Priority levels

- **P1** — *Should do soon.* Visible user pain or rough edge that hurts every interaction.
- **P2** — *Worth a session.* Meaningful upgrade; not painful today but the feature feels unfinished without it.
- **P3** — *Nice-to-have.* Idle-time polish; do when bored, or cancel after long neglect.

### Scope rules

- **Only for shipped features.** If the underlying leaf in the roadmap is not `[x]` yet, finish shipping first. Don't pre-load polish for unshipped work.
- **Not for backend dependencies.** Items waiting on a backend endpoint belong in [09-backend-admin-gaps.md](09-backend-admin-gaps.md), not here. This file is for things we can ship from the web app alone.
- **Cancel freely.** If a P3 sits untouched for ~60 days and nobody has pushed for it, mark `[-]` with a one-line reason. Polish that nobody misses isn't real polish.

## Agent Update Protocol

When you (the coding agent) are working in this repo:

1. **Notice an improvement?** Add a polish item immediately, in the right phase section. Judgment-call the priority (P1/P2/P3) and effort (S/M/L). Better noisy than missed.
2. **Flip to `[~]` before starting** a polish item.
3. **Flip to `[x]` with `← done: <today>`** when done. Same ISO date convention as the roadmap.
4. **When the user asks "what's next?"** read *both* the roadmap and this file, then propose a mix: highest-leverage unblocked roadmap leaf + any open P1 polish items. Polish never blocks features, but P1 polish should not pile up.
5. **Prune P3s periodically.** Old P3s with no advocate get cancelled, not promoted.
6. **No fixed numbering.** Add items wherever they fit in the phase section; IDs are not load-bearing here (unlike the roadmap's `X.Y` tree).

---

# Phases

> Sections mirror the roadmap's phases. Add a phase section the first time it gets a polish item.

## Phase 0 — Foundation

- [ ] P2 [from 0.3.3] Playlist autoplay-next when a video ends — effort:S
- [ ] P3 [from 0.3] Subtle scroll-reveal animation on homepage sections — effort:M
- [ ] P1 [from 0.4.1] Honeypot / spam protection on `/join` and `/feedback` — effort:S **(Tier 0 launch-critical — bumped P2→P1 on 2026-05-28; see [00-master-roadmap.md § Launch Critical Path](00-master-roadmap.md#launch-critical-path--tier-0))**
- [ ] P3 [from 0.4] Success state with shareable confirmation link — effort:S
- [ ] P1 [from 0.5.1] Token-expiry / refresh UX (currently a stale token can hit 401 silently) — effort:M **(Tier 0 launch-critical)**
- [ ] P3 [from 0.7] Smoother visual transition on language switch — effort:S
- [ ] P3 [from 0.3.2] Post-launch: add Mobile App Dev, Translator (EN↔NE), Social Media, Photographer/Videographer, Event Coordinator roles to the volunteer invite — effort:S *(deferred until app release; current dev-phase roles are sufficient)*
- [ ] P2 [from 0.3.2] Backend `applicationRoles` enum must accept `QA_ENGINEER`, `DEVOPS_ENGINEER`, `CONTENT_WRITER` — frontend cards link to `/join?role=` with these values but the API still rejects them (see [09-backend-admin-gaps.md](09-backend-admin-gaps.md)) — effort:S

## Phase 1 — Public Issue Discovery & Voting

- [ ] P1 [from 1.1] Skeleton loader on `/issues` list (currently just `<Spin />`) — effort:S
- [ ] P1 [from 1.1] Pagination / load-more beyond the initial 50 — effort:M
- [ ] P2 [from 1.1.2] Persist filters in URL query params (shareable filtered views) — effort:S
- [ ] P3 [from 1.1] Map-preview thumbnail on issue cards — effort:M
- [ ] P2 [from 1.2.1] Lightbox / fullscreen for the evidence gallery — effort:S
- [ ] P2 [from 1.2.3] Related-issues ranking weighted by geo-distance, not category alone — effort:M
- [ ] P3 [from 1.2] Scroll-progress indicator on long issue descriptions — effort:S

## Phase 9 — Admin Control Center

- [ ] P2 [from 9.1] Bulk actions on applications (approve / reject multiple at once) — effort:M
- [ ] P3 [from 9.1] Export applications to CSV — effort:S
- [ ] P2 [from 9.4] Calendar view for events (currently list-only) — effort:M
- [ ] P2 [from 9.5a] Auto-save draft on issue create / edit (avoid lost work on reload) — effort:M
- [ ] P2 [from 9.10] Search + filter users by role / name — effort:S

## Phase 11 — Cross-cutting

- [ ] P2 [from 11.1] `AdminResponsiveList`: column-visibility toggle — effort:S

---

# How Polish Feeds "What's Next?"

When the user asks for the next task, the agent reads both files together and proposes a mix:

1. The highest-leverage unblocked `[ ]` leaf from [00-master-roadmap.md](00-master-roadmap.md) (new feature work)
2. Any open `P1` items from this file (urgent polish)
3. A concrete suggestion that combines them, e.g.: *"Ship roadmap 1.4 today (small), then close two P1 polish items in the same session."*

Polish never gates new feature work, but if `P1` polish items are accumulating faster than they are getting shipped, the agent should call that out before adding more `P3` items.

---

# How To Update This Document

Same spirit as the roadmap: update inline as work progresses. Add, flip status, mark done, cancel — without asking. Do not let this file drift behind reality.

A stale polish backlog is worse than no polish backlog, because it gives the false sense that someone is watching the rough edges.
