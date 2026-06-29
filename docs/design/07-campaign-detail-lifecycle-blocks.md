# Campaign Detail — Lifecycle Block Matrix

> The single `/campaign/[slug]` detail page renders **one design** (the issue
> design — cover hero, status timeline, about, participants, full-width location
> map, reactions, discussion, related) for **every** status. Smaller blocks are
> revealed progressively as the campaign advances: each later stage *adds* info,
> because more is known once planning (the meeting) is done and the plan is
> confirmed / in execution / complete.
>
> Reference design = the **issue** detail (cover image + timeline + participants-
> progress-compact + about section + full-width map). The old **event** detail
> design (right-rail map, no cover, no timeline, "Campaign Goal — coming soon")
> is **retired**; do not use it for any status.
>
> Date: 2026-06-26 · API verified live against `api.shramdan.org`.

---

## Block × status matrix

| Block | OPEN | DRAFT (Planning) | SCHEDULED | ACTIVE (Ongoing) | COMPLETED | API source |
|---|:--:|:--:|:--:|:--:|:--:|---|
| Cover image (hero) | ✓ | ✓ | ✓ | ✓ | ✓ | `issue.coverImage.url` (fallback if null) |
| Title | ✓ | ✓ | ✓ | ✓ | ✓ | `issue.translations[].title` |
| Status tags + **timeline** | ✓ | ✓ | ✓ | ✓ | ✓ | derived from status |
| **About / campaign goal** | ✓ | ✓ | ✓ | ✓ | ✓ | `issue.translations[].description` |
| Conversion progress ("toward a campaign") | ✓ | — | — | — | — | `issue.voteCount / attendingCount / conversionThreshold` |
| Participants-compact + roster | vote · all roles | join · all roles | join · **WORKER** | join · **WORKER** | final · no join | `rolePlan` + `GET /events/{id}/participants` |
| Support / Join button | support/vote | join | join (worker) | join (worker) | — | `eventJoinPhase()` gating |
| Leader nomination / leader | — | nominate | leader set | leader | leader | `event.eventLeader`, leader-voting endpoints |
| **Schedule** (date/time + duration) | — | "not set yet" | ✓ | ✓ | ✓ (past) | `event.scheduledAt`, `event.durationMinutes` |
| **Meetup point** (address + notes) | — | — | ✓ | ✓ | ✓ | `event.meetupAddress / meetupLatitude / meetupLongitude / meetupNotes` |
| What to bring · planning notes · coordination link | — | — | if present | if present | — | `event.whatToBring / planningNotes / coordinationLink` |
| Risk level badge | — | — | if set | if set | — | `event.riskLevel` |
| **Recap** (result + attendees + photos) | — | — | — | — | ✓ | `event.resultSummary / attendeeCount / completedAt` (+ completion uploads) |
| Full-width location map | ✓ | ✓ | ✓ | ✓ | ✓ | `issue.latitude / longitude` |
| Reactions · Discussion · Related | ✓ | ✓ | ✓ | ✓ | ✓ | issue endpoints |

**Progressive-disclosure rule:** OPEN/DRAFT show *less* (no schedule/meetup —
planning isn't done); SCHEDULED onward show schedule + meetup + bring/notes
(plan confirmed); COMPLETED swaps join for the recap. Join narrows: all roles
(OPEN/DRAFT) → WORKER only (SCHEDULED/ACTIVE) → none (COMPLETED/PAUSED).

---

## Data model

Canonical id = the **issue slug**. `/campaign/[slug]`:

1. `GET /issues/{slug}` → base: `coverImage.url`, `translations` (title + description = goal), `latitude/longitude`, `category`, OPEN progress (`voteCount/attendingCount/conversionThreshold`), `status`, and (when promoted) the embedded `event { id, slug, status, scheduledAt, leaderId }`.
2. If promoted (`status` past OPEN / `issue.event` present) → `GET /events/{event.slug}` for `scheduledAt, durationMinutes, meetup*, whatToBring, planningNotes, coordinationLink, riskLevel, resultSummary, attendeeCount, completedAt, eventLeader, rolePlan` + `GET /events/{id}/participants` for the roster.
3. Render the issue design, adding the blocks above per status.

Old routes resolve to this one: `/issues/:slug` → `/campaign/:slug`; `/events/:slug` → `/campaign/:issueSlug` (resolve via `event.issue.slug` / `linkedIssueId`).

---

## Why images were missing (root cause + fix)

The retired event design pulled the cover from the **event** response — but an
event carries **no** `coverImage.url` (only the embedded `issue.coverImageId`,
an id with no URL). So the hero was always empty. The issue response **does**
carry the expanded `coverImage.url`, so the issue-based unified detail renders
the hero correctly. When `coverImage` is null (some campaigns have no cover),
show a **representative fallback** (map thumbnail / category image) — never an
empty placeholder (per the staging "representative image always" rule).

---

## Backend status

Every lifecycle field above is **already supported and live** on
`api.shramdan.org` — no new backend work is required for this page. One thing to
confirm during build: the field that carries COMPLETED completion photos
(expected under `event.uploads`); if it isn't usable, that is the only item to
raise with Pranish.
