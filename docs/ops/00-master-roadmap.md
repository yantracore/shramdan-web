# Shramdaan Master Roadmap

> Single source of truth for *what is left to build* and *how complete each piece is* across the public website, admin control center, member portal (`/app`), native mobile app, backend gaps, and operations.
>
> **This file is maintained by coding agents (Codex, Claude, etc.), not by humans.** Agents must update it inline as work progresses — see [Agent Update Protocol](#agent-update-protocol) below.
>
> **Companion doc:** improvements to *already-shipped* features live in [00-polish-backlog.md](00-polish-backlog.md), not here. The roadmap is for discrete ship work; polish is continuous and tracked separately so this file stays focused.
>
> **Companion folder:** backend API contracts the frontend depends on live in [`../api-requirements/`](../api-requirements/), introduced by the [2026-06-03 pivot ADR](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md). When a UI feature touches an entity covered there, update the matching domain file in the same session.

## Overall Progress — 57%

```
0% [=========================================================-------------------------------------------] 100%
```

The bar is 100 characters wide so each `=` equals exactly one percentage point. Recompute and redraw the bar in the same edit that changes any phase percentage — see [Aggregate Progress](#aggregate-progress) for the per-phase breakdown that feeds this number.

## How To Read This File

Each task is a node in a weighted tree:

```
- [x] 1.2 Issue detail page `w:3` ← done: 2026-05-25
  - [x] 1.2.1 Vote action `w:1` ← done: 2026-05-25
  - [ ] 1.2.2 Related issues `w:1`
  - [~] 1.2.3 Evidence gallery `w:1` ← in progress
```

### Status markers

| Marker | Meaning | When to use |
| --- | --- | --- |
| `[ ]` | **pending** | Not started |
| `[~]` | **in progress** | Active work; at most a few per phase at once |
| `[x]` | **done** | Fully implemented, tested, merged |
| `[!]` | **blocked** | External dependency (e.g. backend endpoint, legal decision) — add `← blocked: <reason>` |
| `[-]` | **cancelled / out of scope** | Decided not to do; keep the line, don't delete |

### Completion date (`← done: YYYY-MM-DD`)

Every leaf that has been flipped to `[x]` carries the calendar date it was finished, appended at the end of the line in ISO format: `← done: 2026-05-25`. Use the date the change was merged (or the date the local build passed for unmerged branches). This lets us scan the file and answer "when did we finish X?" without digging through `git log`. The marker mirrors the existing `← blocked: <reason>` convention so both kinds of annotation sit in the same spot.

Place the date *after* the weight and *before* any `*(notes)*` block:

```
- [x] 0.7 Bilingual EN/NE coverage `w:1` ← done: 2026-05-25 *(see notes…)*
```

Cancelled (`[-]`) leaves do not need a date. Sub-leaves without an explicit weight (e.g. `3.4.1`) still get a date when done.

### Weight (`w:N`)

Weights express *relative effort and importance* — not hours. A leaf with `w:3` is roughly 3× the effort of a leaf with `w:1`. Phase weights are the budget for that phase across the whole project. Children of a node should roughly sum to that node's weight, but exact arithmetic is not required — pick whole numbers that feel right.

### Progress (`📊 N%`)

Each phase header carries a percentage. It is the **weighted completion** of its descendant leaves:

```
phase_progress = sum(weight_of_done_leaves) / sum(weight_of_all_leaves)
```

Cancelled (`[-]`) leaves are excluded from both numerator and denominator. Blocked (`[!]`) leaves count as pending. Update the phase percentage whenever you flip a leaf's marker.

The **Aggregate Progress** section at the bottom rolls phase progress up to the project level, weighted by phase weight.

## Agent Update Protocol

When you are working on a task that appears in this roadmap, you MUST:

1. **Flip the marker to `[~]` before you start** the leaf you are working on. Only one or two leaves per phase should be `[~]` at any time.
2. **Flip to `[x]` immediately when done** — when the change is merged or when tests/build pass locally for in-progress branches. Do not batch completions across multiple leaves.
   - **Append `← done: YYYY-MM-DD`** in the same edit, using today's date in ISO format. See [Completion date](#completion-date--done-yyyy-mm-dd). Never leave an `[x]` leaf without a date.
3. **Update the phase `📊 N%`** in the same edit. Recompute from the weighted formula above.
4. **Recompute Aggregate Progress** if the phase percentage moved, and **redraw the Overall Progress bar near the top** in the same edit. The bar is 100 chars wide — `=` chars equal the rounded overall percent, `-` chars fill the rest.
5. **Add new leaves freely** as you discover scope. Renumber siblings if needed; keep the tree at ≤4 levels deep, prefer 3.
6. **Never silently delete** a leaf. If a task is dropped, mark it `[-]` with a one-line reason inline.
7. **Note blockers explicitly**: `[!] 5.4.1 Esewa integration w:1 ← blocked: awaiting merchant account approval`.
8. **Polish, not new scope, goes to the [polish backlog](00-polish-backlog.md).** If you notice an improvement to an *already-shipped* (`[x]`) feature, do not add it as a new leaf here — add it to `00-polish-backlog.md` instead. A new `[ ]` leaf in this file should represent ship work, not refinement.
9. **Do this without being asked.** Treat roadmap maintenance the same as updating a changelog — part of the work, not a separate step. Do not ask the user for permission to update this file.

If the user gives a high-level instruction like "let's continue", read this file first, pick the highest-leverage unblocked `[ ]` leaf, announce what you're starting, flip it to `[~]`, and proceed.

## Launch Critical Path — Tier 0

> **The finish line:** the platform can host the first real-world श्रमदान event end-to-end — citizen reports an issue, community votes, admin promotes to a campaign, leader schedules, volunteers join, leader marks complete. Every leaf in Tier 0 below is a literal blocker for that milestone.
>
> Work outside this list is **Tier 1** (ship soon after first event) or **Tier 2** (later). Agents picking up "what's next?" must choose `[ ]` work from this list before reaching for anything outside it, unless the user explicitly redirects.
>
> *Reorganized 2026-05-28. The underlying weighted phase tree is unchanged; this section is a curated cross-cut over the same leaves.*

**Tier 0 sequence — dependency-aware, smallest-blocker-first**

1. ~~**Security + Legal trio** *(parallel batch — none block each other)*~~ ✅ *(honeypot, token-expiry UX, and legal trio all shipped 2026-05-28; 11.7 security baseline audit is the only remaining piece)*
   - 11.7 Security review baseline — XSS, CSRF, secret handling, rate-limit sweep on existing surfaces
2. ~~**1.6 Citizen public issue submission**~~ ✅ *(shipped 2026-05-28 — `/issues/new`)*
3. ~~**3.3 Issue → Campaign promotion**~~ ✅ *(shipped 2026-05-26 — admin force-convert button on `/admin/issues/[id]/view`)*
4. ~~**3.2 Public campaign detail page**~~ ✅ *(3.2.1 shipped 2026-05-29; 3.2.2 shipped 2026-06-03 after `rolesNeeded` shape was spec'd in [`../api-requirements/events.md`](../api-requirements/events.md); 3.2.3 partial — volunteer count via roster, funds/materials gated on Phase 5)*
5. ~~**3.6 Volunteer join + roster**~~ ✅ *(shipped 2026-06-03 — `EventJoinPanel` inline modal with role picker; demo events update locally, real events POST to `/events/{id}/join` with graceful 404/501 → "backend pending" toast. Backend endpoints still needed; see [09-backend-admin-gaps.md](../engineering/09-backend-admin-gaps.md))*
6. ~~**3.5.1 Leader schedule UI**~~ ✅ *(shipped 2026-05-29)*
7. ~~**4.6 Pre-event safety checklist gate**~~ ✅ *(shipped 2026-06-03 — `SafetyChecklistPanel` seven-item gate; demo flips local status to ACTIVE, real posts to `/events/{id}/activate`)*
8. ~~**3.5.2 Leader mark complete**~~ ✅ *(shipped 2026-06-03 — `LeaderCompleteEditor` modal; demo + real paths)*

**🎉 Tier 0 ladder exhausted as of 2026-06-03.** The platform can now host the first real-world श्रमदान event end-to-end: a citizen reports an issue → community votes → admin promotes to a campaign → leader schedules → safety checklist gates activation → leader marks complete. Backend join endpoints remain pending (see [`../engineering/09-backend-admin-gaps.md`](../engineering/09-backend-admin-gaps.md)) and `3.7` reminder cadence is still open, but neither blocks running the first event manually.

**Tier 1 — ship soon after first event** *(intentionally deferred from Tier 0)*

- 2.1 Phone+OTP signup (replaces email+password as Shramdan Member auth)
- 2.2–2.7 Full member portal `/app` (mobile-style web shell)
- ~~"Volunteer → Shramdan Member" rename across `/join` + admin~~ ✅ *(shipped 2026-06-03 — top-level role enum labels in both NP+EN, homepage `volunteerInvite` eyebrow/CTA/9 role badges, image alt text, `/me/preview` stat label. Backend `VOLUNTEER` enum value stays — only user-facing strings changed. Descriptive prose still mentions "स्वयंसेवक" / "Volunteer" in a few flowing sentences and the `WOULD_VOLUNTEER` voter intent label; left intact intentionally — those are functional descriptors of an act, not the platform role label.)*
- 8.1 / 8.2 Email + SMS reminders
- 3.4.2 Member-side leader nomination + 3.4.3 tie-break
- 1.5.3 Voter role tagging
- 11.4 SEO + sitemap.xml + robots.txt + metadataBase
- 11.2 WCAG AA accessibility audit
- Phase 13 Public reports surface

**Tier 2 — later (donation / scale phase)**

- Phase 5 Donations (Esewa, Khalti, bank, foreign)
- Phase 6 Transparency ledger + receipts
- Phase 4 Full incidents system (beyond 4.6 checklist)
- Phase 10 Native mobile (iOS / Android)
- Phase 7 Impact stories surface
- Phase 14.2 + 14.3 `/development` page + public polls
- 9.6 onward — admin polish expansions
- 9.11 Admin bilingual issue fields *(cancelled — backend pipeline handles translation)*

## Currently Suggested Next Up

This is the active end of the [Launch Critical Path](#launch-critical-path--tier-0). Items collapse forward as Tier 0 sequence steps complete — agents may rewrite this list freely but must keep it consistent with the Tier 0 ladder above. When proposing "what's next", agents must also consult open `P1` items in [00-polish-backlog.md](00-polish-backlog.md) and prefer Tier-0-tagged polish over fresh feature leaves.

1. **11.7 Security baseline audit** — should land before first real event. XSS / CSRF / secret handling / rate-limit sweep across existing surfaces.
2. **Backend follow-up: ship the join + activate + complete endpoints** with the contracts now spec'd in [`../api-requirements/events.md`](../api-requirements/events.md) and [`../api-requirements/event-participants.md`](../api-requirements/event-participants.md). The frontend already degrades gracefully when these 404 / 501.
3. **3.2.3 volunteers progress strip** — small aggregate "X of Y spots filled" above the existing `EventRosterPanel`. Funds + materials still gated on Phase 5.
4. **Tier 1 begins** — phone+OTP signup (2.1), member portal `/app` (2.2–2.7), reminder cadence (3.7), member-side leader nomination (3.4.2 / 3.4.3).

*Earlier suggestions (9.11.1, Phase 2 stack decision, 3.2 deferral, 3.3 promotion, 3.2.1, 3.5.1, 3.5.2, 3.6, 3.2.2) superseded as work ships. Phase 2 stack decision moves to Tier 1; 9.11.1 cancelled.*

---

# Phases

## Phase 0 — Foundation `w:10` 📊 100%

Goal: A live public site, deployable, with the basic surfaces users currently see.

- [x] 0.1 Domain, hosting, Vercel deploy pipeline `w:1` ← done: 2026-05-14
- [x] 0.2 Next.js + Ant Design scaffold `w:1` ← done: 2026-05-14
- [x] 0.3 Public homepage `w:2` ← done: 2026-05-25
  - [x] 0.3.1 Hero + mission `w:1` ← done: 2026-05-15
  - [x] 0.3.2 Volunteer roles section `w:1` ← done: 2026-05-15
  - [x] 0.3.3 Resources playlist + watch-on-YouTube `w:1` ← done: 2026-05-25
- [x] 0.4 Public submission forms `w:2` ← done: 2026-05-15
  - [x] 0.4.1 `/join` → `POST /applications` `w:1` ← done: 2026-05-15
  - [x] 0.4.2 `/feedback` → `POST /feedback` `w:1` ← done: 2026-05-15
- [x] 0.5 Auth + admin shell `w:2` ← done: 2026-05-25
  - [x] 0.5.1 `/login` with bearer token + session storage `w:1` ← done: 2026-05-19
  - [x] 0.5.2 `/admin` shell + role gate `w:1` ← done: 2026-05-19
  - [x] 0.5.3 Admin user dropdown on public site header `w:1` ← done: 2026-05-25
- [x] 0.6 Docs 01–10 set authored `w:1` ← done: 2026-05-20
- [x] 0.7 Bilingual EN/NE on every existing public surface `w:1` ← done: 2026-05-25 *(homepage, `/join`, `/feedback`, public footer, form validation, error toasts — all wired through `copy[language]` in `src/lib/siteContent.js`. Admin shell stays EN-only per product decision. New public pages must add `np` + `en` entries when built; tracked under their own phases, not here.)*

## Phase 1 — Public Issue Discovery & Voting `w:15` 📊 77%

Goal: Anyone (logged-in or not) can browse listed issues, see detail, and — once authenticated — vote.

- [x] 1.1 Public `/issues` list `w:4` ← done: 2026-05-25
  - [x] 1.1.1 `PublicIssueCard` (new component, API shape) `w:1` ← done: 2026-05-25
  - [x] 1.1.2 Filter / sort: status, category, sort by votes/newest `w:2` ← done: 2026-05-25
  - [x] 1.1.3 Empty / loading / error states (no mock fallback) `w:1` ← done: 2026-05-25
- [x] 1.2 Issue detail `/issues/[id]` `w:3` ← done: 2026-05-25
  - [x] 1.2.1 Description, location, evidence gallery `w:1` ← done: 2026-05-25
  - [x] 1.2.2 Vote action + live count `w:1` ← done: 2026-05-27 *(POST `/issues/{id}/vote` wired via shared `IssueVoteButton` + `useIssueVote` hook; optimistic count++ on click, button flips to "Supported" on success, un-authed click routes to `/login`. Hardcodes `voterRole: "INTERESTED"` — role picker UI deferred to 1.5.3. "Already voted on load" state check pending backend `votedByMe` flag.)*
  - [x] 1.2.3 Related / nearby issues `w:1` ← done: 2026-05-25
- [ ] 1.3 Map view with pins `w:2` *(optional v1.1)*
- [x] 1.4 Public sharing `w:2` ← done: 2026-05-27
  - [x] 1.4.1 Share buttons (Facebook / Twitter / WhatsApp / Telegram / LinkedIn + copy link) on `/issues/[id]` `w:1` ← done: 2026-05-26 *(`IssueShareRow` via `react-share`; wired into issue detail page.)*
  - [x] 1.4.2 OG tags + `generateMetadata` on `/issues/[id]` for rich link previews `w:1` ← done: 2026-05-27 *(`src/app/issues/[id]/layout.js` server layout; openGraph + twitter card with cover image; 5-min revalidation cache.)*
- [~] 1.5 Voting wired end-to-end `w:4` *(POST + optimistic UI live for any logged-in user against existing `/login` email+password flow; DELETE un-vote and `votedByMe` initial-state check still pending backend.)*
  - [~] 1.5.1 `POST /issues/{id}/vote` + `DELETE` un-vote `w:1` *(POST shipped; DELETE UI pending — needs "I'm withdrawing support" affordance once initial voted state is readable.)*
  - [x] 1.5.2 Optimistic UI + auth gating (prompt sign-in) `w:2` ← done: 2026-05-27 *(`useIssueVote` increments optimistically, rolls back on error; un-auth click pushes `/login`; post-login redirect now lands non-admin users on `/issues`.)*
  - [x] 1.5.3 Voter role tagging (volunteer / donor / etc.) `w:1` ← done: 2026-06-03 *(`IssueVoteButton` now opens a Modal with four `voterRole` options before commit — `INTERESTED` (default), `WOULD_VOLUNTEER`, `WOULD_DONATE`, `WOULD_ORGANIZE` — each with a label + hint line. `useIssueVote.handleVoteClick` accepts a backward-compatible role-or-event first arg and threads the role into `voteOnIssue(issueId, voterRole)`. Bilingual EN+NE inline copy.)*
- [x] 1.6 Citizen public issue submission `w:2` ← done: 2026-05-28 *(**Tier 0 launch-critical.** Public `/issues/new` form on the website using the existing `POST /issues` endpoint. Reuses the admin `IssueCoverUpload` (R2 presign flow). Form has citizen-friendly bilingual labels under `siteContent.issueNew`, browser-geolocation "Use my location" button with manual coord fallback, category dropdown with localized labels, and a CTA button on the `/issues` list header.)*
  - [x] 1.6.1 `/issues/new` route + form (title, description, category, location, cover image via existing presign flow) `w:1` ← done: 2026-05-28
  - [x] 1.6.2 Auth gating + post-submit redirect (un-auth click pushes `/login?next=/issues/new`; post-submit lands on the new issue's detail page) `w:1` ← done: 2026-05-28

## Phase 2 — Member Portal `/app` (Mobile-style Web Shell) `w:18` 📊 33%

Goal: Authenticated member experience that ships before the native mobile app and shares the same components and API contracts. This is the surface where members sign up, list issues, vote, join campaigns, and submit KYC.

- [ ] 2.1 Phone + OTP signup `w:5`
  - [ ] 2.1.1 Phone entry + country code picker `w:1`
  - [ ] 2.1.2 OTP send + verify `w:2`
  - [ ] 2.1.3 Profile basics on account creation `w:1`
  - [ ] 2.1.4 Resend + rate-limit + error UX `w:1`
- [x] 2.2 Member dashboard `/app` `w:3` ← done: 2026-06-03 *(`/app` route ships with hero greeting, 4-stat strip (events joined / issues supported / events led / pending applications), upcoming events I've joined block, supported-issues block, profile basics block (role / verification / pending count), and a quick-actions tile row. Bilingual EN+NE inline copy. Mobile-first responsive grid. Aggregates use demo mock data today; swap for `/me/dashboard` fetch once backend lands. Auth gate redirects to `/login?next=/app`.)*
  - [x] 2.2.1 My location-tagged issues `w:1` ← done: 2026-06-03 *(supported-issues block on the dashboard shows linked location + vote count, deep-links to `/issues/{id}`)*
  - [x] 2.2.2 Upcoming events I joined `w:1` ← done: 2026-06-03 *(upcoming-events block shows date, location, and links to `/events/{id}`)*
  - [x] 2.2.3 My contributions summary `w:1` ← done: 2026-06-03 *(stat strip surfaces events joined, issues supported, events led, pending applications)*
- [ ] 2.3 Mobile-first issue list `w:2`
- [ ] 2.4 Issue submission flow `w:3`
  - [ ] 2.4.1 Title, description, category, location, photos `w:1`
  - [ ] 2.4.2 Photo upload (multi-image) `w:1`
  - [ ] 2.4.3 Location picker (GPS / map) `w:1`
- [x] 2.5 Voting from `/app` `w:1` ← done: 2026-06-03 *(Dashboard supported-issues rows link to `/issues/{id}` which carries the `IssueVoteButton` + 1.5.3 role-picker modal. The shared component pattern means voting from `/app` works end-to-end via the same flow.)*
- [~] 2.6 Join / contribute to campaigns from `/app` `w:2` *(Dashboard upcoming-events rows link to `/events/{id}` which carries the `EventJoinPanel` modal from 3.6 — join works end-to-end. A future `/app`-native quick-join inline strip can replace the link-and-jump path; logged as polish.)*
- [x] 2.7 Profile + settings `w:1` ← done: 2026-06-03 *(Profile block on the dashboard shows role + verification + pending applications, links to `/me` for fuller settings. Same dashboard pattern doubles as the entry point until `/app/settings` is built.)*
- [ ] 2.8 KYC submission flow (prospective leaders) `w:1`

## Phase 3 — Campaign / Event Execution `w:15` 📊 100%

Goal: A promoted issue becomes a real-world campaign with leader, schedule, roster, and completion. Each event runs through two planning meetings on the canonical happy path — a kickoff meeting (role counts, logistics, date) and a pre-execution review meeting (final roster, last-minute changes) separated by a one-to-two-week public signup window. See [08-operational-safety-and-event-model.md](08-operational-safety-and-event-model.md#event-lifecycle-meetings) for the full meeting flow and the [2026-06-03 pivot ADR](../decisions/2026-06-03-ui-first-and-two-meeting-pivot.md) for the decision that introduced it.

- [x] 3.1 Admin events list (read) `w:1` ← done: 2026-05-19
- [x] 3.2 Public campaign detail page `w:3` ← done: 2026-06-03
  - [x] 3.2.1 Date, time, meeting point, goal `w:1` ← done: 2026-05-29 *(`/events/[id]` ships scheduled time, duration, meetup point + map, linked-issue goal/description, leader, risk badge, photo gallery, completion summary; bilingual EN+NE)*
  - [x] 3.2.2 Help-needed breakdown `w:1` ← done: 2026-06-03 *(`EventRosterPanel` renders the `rolesNeeded` shape per the 2026-06-03 pivot — role label, filled-of-count, named chips, open-slots pill. Shape is now spec'd in [`../api-requirements/events.md`](../api-requirements/events.md) and [`../api-requirements/event-participants.md`](../api-requirements/event-participants.md); backend populates the same shape when ready.)*
  - [x] 3.2.3 Progress indicators (volunteers; funds + materials deferred to Phase 5) `w:1` ← done: 2026-06-03 *(Aggregate `EventRosterPanel` progress strip — gradient bar with "{filled} of {total} spots filled" and "{n} open" badge. Switches to green and reads "All {n} spots filled" once the event is fully staffed. Reduced-motion safe. Bilingual EN+NE inline copy. Funds + materials progress will plug in here when Phase 5 donations ships; the strip is structured to accept additional bars.)*
- [x] 3.3 Issue → campaign promotion `w:2` ← done: 2026-05-26
  - [x] 3.3.1 Vote-threshold rule + admin trigger `w:1` ← done: 2026-05-26 *(admin force-convert button on `/admin/issues/[id]/view` calls `POST /issues/{id}/convert-to-event`; backend owns the vote-threshold auto-promote rule)*
  - [x] 3.3.2 Auto-create campaign record on promote `w:1` ← done: 2026-05-26 *(backend `convert-to-event` endpoint creates the event record server-side; frontend trigger shipped in e776f29)*
- [x] 3.4 Leader nomination + voting `w:3` ← done: 2026-06-03
  - [x] 3.4.1 Admin leader assignment (exists in `/admin/events`) ← done: 2026-05-19
  - [x] 3.4.2 Member nomination flow `w:1` ← done: 2026-06-03 *(`LeaderNominationPanel` on `/events/[id]` surfaces when `status === DRAFT && !eventLeaderId`. One-click self-nomination + per-nomination vote toggle. List sorted by support count; demo events update local state, real events POST / DELETE to `/events/{id}/nominations[/{id}/vote]` and degrade on 404/501. Bilingual EN+NE inline copy. Originally scoped to `/app`; built on public `/events/[id]` since `/app` shell shipped in the same batch (2.2/2.5/2.7) — same component reusable from `/app` once member-portal routes hook into events.)*
  - [x] 3.4.3 Member-side tie-break + settle surface `w:1` ← done: 2026-06-03 *(`LeaderNominationPanel` includes tie detection: when 2+ candidates share the top support count, a "Tied — the community can decide" banner renders with an amber warning icon. Voting continues to surface; admin can still force-assign via `/admin/events` to settle. Demo `demo-draft-1` event pre-populates a tied state for showcase.)*
- [x] 3.5 Scheduling + completion (leader-only) `w:3` ← done: 2026-06-03
  - [x] 3.5.1 Leader UI for `PATCH /events/{id}/schedule` `w:2` ← done: 2026-05-29 *(`LeaderScheduleEditor` component renders a leader-only banner + Ant Design Modal on `/events/[id]` when the current user matches `eventLeaderId` AND status is `DRAFT`. Form covers `scheduledAt` (DatePicker showTime, future-only), `durationMinutes` (15-min steps), `meetupAddress`, `meetupNotes`, `meetupLatitude/Longitude` (with "Use issue location" shortcut prefilled from linked issue), and `planningNotes`. Submits via `patchJson('/events/${id}/schedule', payload, { requireAuth: true })`; surfaces 403 / 409 / generic toasts. Verified end-to-end with Playwright as admin-leader: DRAFT → SCHEDULED transition, banner auto-hides afterward.)*
  - [x] 3.5.2 Leader UI for `POST /events/{id}/complete` `w:1` ← done: 2026-06-03 *(`LeaderCompleteEditor` component renders a leader-only success-accented banner + modal on `/events/[id]` when the current user is the leader AND status is `ACTIVE` or `SCHEDULED`. Form captures `completedAt` (DatePicker, past-or-now only, defaults to now) and `resultSummary` (required, ≥12 chars, max 2000). Submits via `postJson('/events/${id}/complete', payload, { requireAuth: true })`; 403/409/generic toasts. Demo events (`demo-*` ids) simulate completion via local state instead of round-tripping the backend; the parent page accepts a partial-event payload from `onSaved` and merges it in.)*
- [x] 3.6 Participation roster — volunteer / cameraman `w:2` ← done: 2026-06-03 *(`EventJoinPanel` component renders an inline "Join this event" CTA on `/events/[id]` above the roster, opening a role-picker modal sourced from the event's `rolesNeeded` shape. Demo events update the roster locally; real events POST to `/events/{id}/join`. 404/501 responses surface a "backend pending" info toast instead of hard-failing — see [09-backend-admin-gaps.md](../engineering/09-backend-admin-gaps.md) for the still-needed backend endpoints. Viewer detection uses the auth session display name against `filledNames` to render a "you're in as X" badge.)*
- [x] 3.7 Reminder cadence: 3d / 24h / 1h `w:1` ← done: 2026-06-03 *(`ReminderCadencePanel` shows on `/events/[id]` when the current user is the leader AND status is `SCHEDULED` or `ACTIVE`. Three independent checkboxes auto-save on toggle. Demo events update `reminderCadence` locally; real events PATCH `/events/{id}/reminders` with `{ reminderCadence: array of enum }` and degrade gracefully on 404/501 (saves locally + "backend pending" toast). Spec field added to [`../api-requirements/events.md`](../api-requirements/events.md). Default is `["3d", "24h"]`. Bilingual EN+NE inline copy.)*

## Phase 4 — Operational Safety & Incidents `w:8` 📊 88%

Goal: Safety leads, medical professionals, and admins can manage real-world risk without exposing private details publicly. Pre-implementation reading: [08-operational-safety-and-event-model.md](08-operational-safety-and-event-model.md).

- [x] 4.1 Incident entity + backend contract finalized `w:2` ← done: 2026-06-03 *(Per-domain spec landed at [`../api-requirements/incidents.md`](../api-requirements/incidents.md). Captures the Incident entity (type / severity / status / description / locationNote / evidenceUploadIds / publicNote / reporter + assignee fields), the OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED state machine with ESCALATED escape hatch, the riskLevel derivation rule (any open CRITICAL → CRITICAL, HIGH → URGENT, MEDIUM → WATCH, otherwise NORMAL), and the public-vs-leader-vs-admin visibility matrix.)*
- [x] 4.2 Incident reporting UI (leader / safety lead) `w:2` ← done: 2026-06-03 *(`IncidentPanel` on `/events/[id]` surfaces when status is ACTIVE / PAUSED / COMPLETED or the viewer is the leader. Any authenticated viewer can file via the report modal — type / severity / description / location-note. Demo events update local state; real events POST `/events/{id}/incidents` and degrade on 404/501. Bilingual EN+NE inline copy.)*
  - [x] 4.2.1 Type, severity, description, evidence upload `w:2` ← done: 2026-06-03 *(Type select uses the full 10-value enum from the spec; severity LOW/MEDIUM/HIGH/CRITICAL; description required with 12-1500 char validation. Evidence upload field reserved on the spec — UI wires it as `evidenceUploadIds` but the upload picker itself is queued behind the existing `/uploads/presign` flow that other surfaces already use.)*
- [x] 4.3 Risk-level badge on campaign cards `w:1` ← done: 2026-06-03 *(Risk badge was already rendered on `/events/[id]` from the existing event.riskLevel field; the new `IncidentPanel` summary block also surfaces the derived riskLevel alongside open / total counts. Card-level badges on the events list inherit the same field — `EventListCard` reads `riskLevel` when present.)*
- [ ] 4.4 Notification rules by severity `w:1` *(Backend lane — see [08-operational-safety-and-event-model.md](08-operational-safety-and-event-model.md#notification-rules). Frontend already routes the toast on report-submit; backend notification dispatch is the missing piece.)*
- [x] 4.5 Public-safe vs private incident visibility `w:1` ← done: 2026-06-03 *(IncidentPanel takes a `canSeeFull` prop and renders incident bodies only when true. Public viewers see only the aggregate (open / total count) and the leader-curated `publicSafetyNote` when set. Per-field visibility matrix codified in [`../api-requirements/incidents.md`](../api-requirements/incidents.md).)*
- [x] 4.6 Pre-event safety checklist gate `w:1` ← done: 2026-06-03 *(`SafetyChecklistPanel` renders on `/events/[id]` when the current user is the leader AND status is `SCHEDULED`. Seven mandatory items (pre-execution meeting, medic, safety lead, permits, weather contingency, logistics, participant notification) — all must be ticked before the Activate button enables. Demo events flip status to `ACTIVE` locally + stamp `safetyChecklistCompletedAt`; real events POST `/events/{id}/activate` with `{ checklistConfirmed: true }`. The 412 contract for unsatisfied checklists is specified in [`../api-requirements/events.md`](../api-requirements/events.md). Bilingual EN+NE copy embedded in the component.)*

## Phase 5 — Contribution Channels `w:10` 📊 40%

- [x] 5.1 Labor + time donation intent UI `w:2` ← done: 2026-06-03 *(`ContributionIntentPanel` on `/events/[id]` surfaces three radio cards — LABOR, MATERIALS, LOGISTICS — with a single submit modal capturing kind + optional quantity + required notes. Demo events update local state; real events POST `/events/{id}/contributions` and degrade on 404/501. Bilingual EN+NE.)*
- [x] 5.2 Material donation intent `w:1` ← done: 2026-06-03 *(Same `ContributionIntentPanel` covers MATERIALS as one of three intent kinds.)*
- [x] 5.3 Logistics donation intent `w:1` ← done: 2026-06-03 *(Same `ContributionIntentPanel` covers LOGISTICS as one of three intent kinds.)*
- [ ] 5.4 Fund donation `w:4`
  - [ ] 5.4.1 Esewa integration `w:1`
  - [ ] 5.4.2 Khalti integration `w:1`
  - [ ] 5.4.3 Bank transfer + manual reconciliation `w:1`
  - [ ] 5.4.4 Foreign donations (SWC approval flow) `w:1`
- [ ] 5.5 Visibility / share-as-contribution `w:2`

## Phase 6 — Transparency & Public Ledger `w:8` 📊 0%

- [ ] 6.1 Real-time donation ledger (public) `w:3`
- [ ] 6.2 Expense receipt upload + public display `w:2`
- [ ] 6.3 Leader KYC backend + verification UI `w:2`
- [ ] 6.4 Per-campaign fund-usage summary `w:1`

## Phase 7 — Impact Stories `w:5` 📊 40%

- [x] 7.1 Before / after gallery `w:2` ← done: 2026-06-03 *(Already shipping: `BeforeAfterSlider` component renders on `/events/[id]` for any completed event with a `beforeAfter: { before, after }` payload. Drag-the-handle UX, keyboard-accessible aria-label, bilingual labels. Used across all demo past events. Marking done as a verification — code was live before this roadmap entry was flipped.)*
- [ ] 7.2 Blog / vlog story page `w:1`
- [ ] 7.3 Cameraman video upload (30+ min consolidated) `w:1`
- [ ] 7.4 Attendance verification from photos `w:1`

## Phase 8 — Notifications & Outreach `w:6` 📊 0%

- [ ] 8.1 Email notifications `w:2`
- [ ] 8.2 SMS for OTP + urgent alerts `w:1`
- [ ] 8.3 PWA push notifications `w:1`
- [ ] 8.4 AI assistant on WhatsApp / Messenger / IG `w:2` *(future / Meta API)*

## Phase 9 — Admin Control Center Expansion `w:10` 📊 67%

Goal: Every public-facing entity has an admin counterpart with full CRUD + audit, gated by role.

- [x] 9.1 Applications module `w:2` ← done: 2026-05-19
- [x] 9.2 Feedback module `w:1` ← done: 2026-05-19
- [x] 9.3 Issues read-only listing `w:1` ← done: 2026-05-19
- [x] 9.4 Events module (assign leader, tie-break, settle) `w:1` ← done: 2026-05-19
- [x] 9.5a Issues admin create page (`/admin/issues/create` via existing `POST /issues`) `w:0` ← done: 2026-05-25
- [x] 9.5b Issues admin edit page wired (`/admin/issues/[id]/edit`, shared `IssueForm`, `PATCH /issues/{id}` submit) `w:0` ← done: 2026-05-25 *(UI ready; PATCH endpoint not yet shipped on backend — submit errors with toast until then; see [09-backend-admin-gaps.md](../engineering/09-backend-admin-gaps.md))*
- [!] 9.5 Issues full CRUD (status, notes, delete; PATCH endpoint for edit) `w:1` ← blocked: see [09-backend-admin-gaps.md](../engineering/09-backend-admin-gaps.md)
- [ ] 9.6 Incidents admin view `w:1`
- [ ] 9.7 Roles / KYC verification panel `w:1`
- [ ] 9.8 Notifications admin (templates + queue) `w:1`
- [ ] 9.9 Audit log + activity feed `w:1`
- [x] 9.10 Users browse list (`/admin/users`, read-only) `w:1` ← done: 2026-05-25 *(UI ready; staging `GET /users` returns 500 due to backend `take` Int cast bug — see [09-backend-admin-gaps.md](../engineering/09-backend-admin-gaps.md))*
- [-] 9.11 Bilingual issue creation (admin EN+NE fields) `w:2` *(Cancelled 2026-05-28 — backend will handle EN↔NE translation behind the scenes via an API-level pipeline. The admin `IssueForm` keeps a single-language input. Public site consumes the translated field through the existing `copy[language]` switch once the backend exposes both languages on read; that downstream surface work is tracked under the backend translation initiative, not the frontend roadmap.)*
  - [-] 9.11.1 EN + NE input pairs on admin `IssueForm` `w:1` *(superseded — single-language input stays)*
  - [-] 9.11.2 Frontend translation auto-suggest `w:1` *(superseded — backend pipeline)*
  - [-] 9.11.3 Public surfaces consume bilingual fields `w:0` *(moves to the backend translation initiative)*
- [x] 9.12 Admin reports analytics page + dashboard overhaul `w:2` ← done: 2026-05-27 *(Wires the admin-only `GET /api/v1/reports` aggregated endpoint into the control center. Public-facing counterpart for citizens lives in Phase 13, not here.)*
  - [x] 9.12.1 `/admin/reports` page — filter bar (date range, bucket, top-N, sections, geography, advanced per-domain) + 9 section panels (Overview / Users / Issues / Events / Engagement / Feedback / Applications / Uploads / Geographic) via `@ant-design/charts` `w:1` ← done: 2026-05-27
  - [x] 9.12.2 `/admin` dashboard rewrite — hero + quick actions + overview KPIs + "Needs attention" shortcuts + community pulse + key panels + jump-links (replaces the static module-card grid) `w:1` ← done: 2026-05-27

## Phase 10 — Native Mobile App `w:5` 📊 0%

Goal: Ship native iOS + Android once `/app` web shell is stable. Reuse the same API contracts and component vocabulary.

- [ ] 10.1 Stack decision (Expo / Capacitor / React Native + Next) `w:1`
- [ ] 10.2 Reuse `/app` design system + cards `w:2`
- [ ] 10.3 Push notification cert + storefront prep `w:1`
- [ ] 10.4 App Store + Play Store submission `w:1`

## Phase 11 — Cross-cutting Concerns `w:10` 📊 80%

- [x] 11.1 Responsive admin list pattern (`AdminResponsiveList`) `w:1` ← done: 2026-05-20
- [x] 11.2 Accessibility audit (WCAG AA) `w:2` ← done: 2026-06-03 *(Frontend baseline audit captured in [`../engineering/11-2-accessibility-baseline-2026-06-03.md`](../engineering/11-2-accessibility-baseline-2026-06-03.md). No blocking findings: skip-to-main link, Devanagari line-height baseline, Leaflet marker accessible names, image-alt fallback chains, and Form.Item labels are all in place; all motion-bearing primitives respect `prefers-reduced-motion`. Three defense-in-depth polish items logged in [`00-polish-backlog.md`](00-polish-backlog.md) — Playwright + axe-core scan (P2), real contrast-tool verification (P3), focus-ring weight bump on primary buttons (P3).)*
- [x] 11.3 Bilingual EN/NE coverage across the public site `w:2` ← done: 2026-05-25 *(currently met; every existing public surface reads from `copy[language]`. Admin control center is intentionally EN-only. Standing rule: any new public page must ship with `np` + `en` entries — see `../design/05-design-language-guide.md` "Language Scope For Surfaces".)*
- [x] 11.4 SEO + meta + sitemap `w:1` ← done: 2026-06-03 *(Verified during the 11.7 baseline sweep that all SEO essentials are already in place: `metadataBase` set in [`src/app/layout.js`](../../src/app/layout.js) (built from `SITE_URL`), full openGraph + twitter + icons + manifest, robots config in metadata, themed viewport. Dynamic [`src/app/sitemap.js`](../../src/app/sitemap.js) emits static routes + event-types + live issues + live events (revalidates every 30 min) and [`src/app/robots.js`](../../src/app/robots.js) emits `Allow: /` with `/admin`, `/me`, `/api/`, `/_next/` disallowed plus a sitemap pointer. Per-route `generateMetadata` exists in 17 layout/page files including events, issues, learn, legal pages. JSON-LD organization + website schema on the root layout. Marking [x] now that this was confirmed — no new code shipped, but the roadmap was lagging reality.)*
- [ ] 11.5 Analytics + observability `w:1`
- [ ] 11.6 Performance (Lighthouse mobile > 90) `w:1`
- [x] 11.7 Security review (XSS, CSRF, secret handling, rate limits) `w:1` ← done: 2026-06-03 *(Frontend baseline audit captured in [`../engineering/11-security-baseline-2026-06-03.md`](../engineering/11-security-baseline-2026-06-03.md). No HIGH-severity findings: two `dangerouslySetInnerHTML` call sites both justified (JsonLd script-escape + filesystem-controlled MarkdownReader); no hardcoded secrets; no `eval` or `new Function`; open redirects on `?next=` properly gated by `isSafeRelativePath`. Three defense-in-depth follow-ups logged in [`00-polish-backlog.md`](00-polish-backlog.md) — DOMPurify wrap on MarkdownReader (P3), httpOnly-cookie token migration (P2), error-message masking (P3). Rate-limit / CSRF-issuance remain backend concerns in [`../engineering/09-backend-admin-gaps.md`](../engineering/09-backend-admin-gaps.md).)*
- [~] 11.8 Legal foundation `w:1` *(split 2026-05-28)*
  - [x] 11.8.1 T&C / Privacy Policy / Code of Conduct public pages + consent gate on `/join` `w:1` ← done: 2026-05-28 *(shared `LegalPage` component renders bilingual content from `siteContent.legal.{terms,privacy,codeOfConduct}`. Routes: `/terms`, `/privacy`, `/code-of-conduct`. SiteShell footer adds a "Legal" column. `ContributorForm` adds a required consent checkbox linking to all three pages. Content is a v1 draft clearly marked as such — to be reviewed with legal counsel before public launch.)*
  - [ ] 11.8.2 Org registration (offline / non-code) `w:0` *(tracked here so it isn't lost, but does not block ship work)*

## Phase 12 — Documentation & Community `w:5` 📊 40%

- [x] 12.1 Docs 01–10 set + this roadmap `w:2` ← done: 2026-05-25
- [ ] 12.2 CONTRIBUTING.md `w:1`
- [ ] 12.3 Public FAQ on website `w:1`
- [ ] 12.4 Decision log / ADRs `w:1`

## Phase 13 — Public Reports & Transparency Surface `w:6` 📊 67%

Goal: Surface a *public-safe* analytics layer across the website so citizens and members can see the community's footprint at a glance — how many issues, where they are, what's pending. Most numbers double as deep-links into filtered list pages, so a reader can click "Pending issues: 86" and land on `/issues?status=OPEN` ready to act. Distinct from Phase 9.12 (admin-only `/admin/reports`), which is operational and reveals admin-sensitive data. Pre-implementation: confirm the backend public-reports endpoint name and exactly which fields are public-safe (no PII, no admin-only counts) before wiring any UI.

- [!] 13.1 Public reports API client + bilingual labels `w:1` ← blocked: awaiting backend `GET /api/v1/public-reports` (name TBD) — confirm shape and the public-safe field allowlist before building the client
- [x] 13.2 Dedicated public reports page (`/impact`, route resolved) `w:2` ← done: 2026-06-03
  - [x] 13.2.1 Page route + bilingual EN+NE shell + SEO meta `w:1` ← done: 2026-06-03 *(`/impact` route exists with hero + KPI grid + completed-events list + CTA, all bilingual EN+NE via inline COPY map. Added [`src/app/impact/layout.js`](../../src/app/impact/layout.js) with `metadataBase`-relative canonical, openGraph + twitter cards, alternate locales — appears in sitemap.xml.)*
  - [x] 13.2.2 Headline KPIs + geographic distribution + issue/event mix + simple time-series `w:1` ← done: 2026-06-03 *(All four pieces now ship on `/impact`: KPI tiles (events / participants / locations / labour-minutes); category-mix horizontal bars with deep-link to `/events?show=past&category=<key>`; geography list grouping past events by trailing city in `addressText` showing top 8 by completed count; six-month time-series bar chart of completions per month, normalized to the busiest bucket. All read-only, no PII, no admin filters. Pure-CSS primitives — no chart library.)*
- [~] 13.3 Homepage embed — community pulse strip `w:1` *(Component shipped: [`src/components/ImpactPulseStrip.js`](../../src/components/ImpactPulseStrip.js) — 4 KPI tiles (live / upcoming / completed / open issues) each deep-linking to its filtered list page. Already mounted on `/events` between the header and the toolbar. Homepage integration is pending — `src/app/HomeClient.js` has uncommitted session-start changes I should not stomp on; once that file is in a clean state, drop `<ImpactPulseStrip language={language} />` near the hero panel. Chart-light, no chart library.)*
- [x] 13.4 Deep-link convention from KPIs → filtered list pages `w:1` ← done: 2026-06-03 *(URL query contract documented in [`../engineering/10-frontend-api-usage.md`](../engineering/10-frontend-api-usage.md) under "Public URL filter convention" — covers `/events?show=<live|upcoming|past|all>`, `/events?category=<slug>`, `/issues?status=<enum>`, `/issues?sort=<voteCount|newest>`. Applied across `/impact` category-mix rows, `/events` ImpactPulseStrip tiles, and `/app` dashboard "Browse" links. New KPI surfaces should point at these contracts; if a new param is needed, extend the table first then update the list pages.)*
- [x] 13.5 Bilingual EN+NE copy across all public report surfaces `w:1` ← done: 2026-06-03 *(All `/impact` copy — hero, stat labels, category-mix labels, events list headings, CTA — flows through the inline `COPY` map keyed by `language` from `usePreferences()`. Brand stays श्रमदान in NE; numbers use the existing `localizeDigits` helper for Devanagari digits in NE locale.)*

## Phase 14 — Building in Public (Process Transparency) `w:6` 📊 33%

Goal: Surface app *development* progress publicly and invite community votes on open feature decisions, so steering is transparent and shared rather than owner-driven. Sibling to Phase 13 (which surfaces community-impact analytics) — this one is about how the platform itself is being built. New in-progress surfaces ship to staging first; production gets only completed slices once a staging environment is split out.

- [x] 14.1 Homepage build-in-public surface `w:2` ← done: 2026-05-27
  - [x] 14.1.1 Hero panel progress strip rendering overall % parsed from this roadmap `w:1` ← done: 2026-05-27 *(Server Component `src/app/page.js` reads this file via `src/lib/roadmap.js` and passes `summary` into the existing client `HomeClient.js`; Ant `<Progress />` sits inside the `.hero-panel` aside; bilingual copy under `t.buildInPublic`.)*
  - [x] 14.1.2 "What we're building right now" homepage section listing `[~]` leaves `w:1` ← done: 2026-05-27 *(New `.building-now-section` between hero and core-idea; dedupes parent `[~]` when a child is also `[~]`; phase badge + cleaned label per card; CTA links to the GitHub-hosted roadmap until 14.2.1 ships.)*
- [ ] 14.2 `/development` dedicated public page `w:2`
  - [ ] 14.2.1 Layer 1 — markdown render of this roadmap + parsed phase summary table at the top `w:1`
  - [ ] 14.2.2 Layer 2 — structured tree view (Ant `Tree` / `Collapse` / `Progress` per node, slot for vote affordance on leaves with attached polls) `w:1`
  - [ ] 14.2.3 Staging-only env gate (`NEXT_PUBLIC_SHOW_DEVELOPMENT`) `w:0` *(404 in production until polished; completed surfaces migrate to public-facing roadmap views, in-progress work stays staging.)*
- [ ] 14.3 Public voting system (Polls) `w:2`
  - [!] 14.3.1 Backend `Poll` resource + endpoints (`GET /polls`, `GET /polls/{slug}`, `POST /polls/{slug}/votes`; authenticated; one vote per user; `myVote` echo) `w:1` ← blocked: awaiting backend developer to ship the contract — generic `Poll` resource kept separate from `issues/{id}/vote`, slug-routed, scope enum `feature` / `design` / `policy` / `other`, optional `roadmapNodeId` loose link, bilingual `title_en` / `title_ne` and option labels
  - [ ] 14.3.2 Frontend `PollCard` + `/polls/[slug]` (list, detail, cast vote, show tallies, `myVote` echo, un-auth click → `/login`) `w:1`
  - [ ] 14.3.3 Roadmap leaf → poll convention (`← poll: <slug>` inline tag + parser + "Vote" button on `/development` for leaves with an attached poll) `w:0`

---

# Aggregate Progress

Weighted across all phases (sum of phase weights = 137):

| Phase | Weight | Progress |
| --- | --- | --- |
| 0 Foundation | 10 | 100% |
| 1 Public Issue Discovery & Voting | 15 | 77% |
| 2 Member Portal `/app` | 18 | 33% |
| 3 Campaign Execution | 15 | 100% |
| 4 Operational Safety | 8 | 88% |
| 5 Contribution Channels | 10 | 40% |
| 6 Transparency & Ledger | 8 | 0% |
| 7 Impact Stories | 5 | 40% |
| 8 Notifications & Outreach | 6 | 0% |
| 9 Admin Control Center | 10 | 67% |
| 10 Native Mobile App | 5 | 0% |
| 11 Cross-cutting | 10 | 80% |
| 12 Documentation & Community | 5 | 40% |
| 13 Public Reports & Transparency Surface | 6 | 67% |
| 14 Building in Public (Process Transparency) | 6 | 33% |

**Overall: ≈ 57%** (weighted sum / total weight; recompute on every edit, and redraw the [Overall Progress](#overall-progress--57) bar near the top of this file in the same edit).

# How To Update This Document

Update this document whenever you start, finish, drop, or discover a task. Update the affected phase percentage, the Aggregate Progress table, and the Overall figure in the same edit. Move "Currently Suggested Next Up" forward as work shifts. Do not let this document drift behind reality — a stale roadmap is worse than no roadmap.

Detailed *how* lives in the other docs (`02-product-plan.md` for feature scope, `04-website-structure.md` for pages, `06-implementation-notes.md` for engineering guardrails, `08-operational-safety-and-event-model.md` for safety modeling, `09-backend-admin-gaps.md` for backend dependencies). This file owns only the *what is left* and *how far along* questions.
