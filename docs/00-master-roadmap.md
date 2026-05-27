# Shramdaan Master Roadmap

> Single source of truth for *what is left to build* and *how complete each piece is* across the public website, admin control center, member portal (`/app`), native mobile app, backend gaps, and operations.
>
> **This file is maintained by coding agents (Codex, Claude, etc.), not by humans.** Agents must update it inline as work progresses — see [Agent Update Protocol](#agent-update-protocol) below.
>
> **Companion doc:** improvements to *already-shipped* features live in [00-polish-backlog.md](00-polish-backlog.md), not here. The roadmap is for discrete ship work; polish is continuous and tracked separately so this file stays focused.

## Overall Progress — 24%

```
0% [========================----------------------------------------------------------------------------] 100%
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

## Currently Suggested Next Up

Use this section as a short-lived hint of what would be a sensible next step *right now*. Agents may rewrite this list freely as priorities shift. Keep to 3-5 items, ordered. When proposing "what's next", agents must also consult open `P1` items in [00-polish-backlog.md](00-polish-backlog.md) and mix them in here when they outweigh a fresh ship leaf.

1. Phase 9.11.1 EN+NE field pairs on admin `IssueForm` — frontend-only slice the user flagged 2026-05-27; unblocks bilingual public issue copy without waiting on the translation API (9.11.2 stays blocked).
2. Phase 2.1 phone+OTP member signup — biggest unlock; without member auth, 1.5 voting and `/app` dashboard stay blocked. Needs Phase 2 stack decision in the same swing.
3. Decide stack for member portal `/app` (Phase 2) — Expo / Capacitor / Next-only — feeds into 2.1.
4. Phase 3.2 public campaign detail page — backend `GET /events/{id}` is ready; sensible next read-only public surface after issues. *(Deferred per user 2026-05-27 — revisit later.)*
5. Triage Phase 9.5 issues CRUD against [09-backend-admin-gaps.md](09-backend-admin-gaps.md) — confirm which mutation endpoints have landed since the admin create page was added.
6. Set `metadataBase` in root layout + sitemap.xml + robots.txt (Phase 11.4 SEO leaf) — small, complements 1.4.2 OG work.

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

## Phase 1 — Public Issue Discovery & Voting `w:15` 📊 73%

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
  - [ ] 1.5.3 Voter role tagging (volunteer / donor / etc.) `w:1` *(Backend accepts `voterRole` enum but frontend hardcodes `INTERESTED`; needs a picker on the vote button or a modal before commit.)*

## Phase 2 — Member Portal `/app` (Mobile-style Web Shell) `w:18` 📊 0%

Goal: Authenticated member experience that ships before the native mobile app and shares the same components and API contracts. This is the surface where members sign up, list issues, vote, join campaigns, and submit KYC.

- [ ] 2.1 Phone + OTP signup `w:5`
  - [ ] 2.1.1 Phone entry + country code picker `w:1`
  - [ ] 2.1.2 OTP send + verify `w:2`
  - [ ] 2.1.3 Profile basics on account creation `w:1`
  - [ ] 2.1.4 Resend + rate-limit + error UX `w:1`
- [ ] 2.2 Member dashboard `/app` `w:3`
  - [ ] 2.2.1 My location-tagged issues `w:1`
  - [ ] 2.2.2 Upcoming events I joined `w:1`
  - [ ] 2.2.3 My contributions summary `w:1`
- [ ] 2.3 Mobile-first issue list `w:2`
- [ ] 2.4 Issue submission flow `w:3`
  - [ ] 2.4.1 Title, description, category, location, photos `w:1`
  - [ ] 2.4.2 Photo upload (multi-image) `w:1`
  - [ ] 2.4.3 Location picker (GPS / map) `w:1`
- [ ] 2.5 Voting from `/app` `w:1`
- [ ] 2.6 Join / contribute to campaigns from `/app` `w:2`
- [ ] 2.7 Profile + settings `w:1`
- [ ] 2.8 KYC submission flow (prospective leaders) `w:1`

## Phase 3 — Campaign / Event Execution `w:15` 📊 5%

Goal: A promoted issue becomes a real-world campaign with leader, schedule, roster, and completion.

- [x] 3.1 Admin events list (read) `w:1` ← done: 2026-05-19
- [ ] 3.2 Public campaign detail page `w:3`
  - [ ] 3.2.1 Date, time, meeting point, goal `w:1`
  - [ ] 3.2.2 Help-needed breakdown `w:1`
  - [ ] 3.2.3 Progress indicators (volunteers, funds, materials) `w:1`
- [ ] 3.3 Issue → campaign promotion `w:2`
  - [ ] 3.3.1 Vote-threshold rule + admin trigger `w:1`
  - [ ] 3.3.2 Auto-create campaign record on promote `w:1`
- [ ] 3.4 Leader nomination + voting `w:3`
  - [x] 3.4.1 Admin leader assignment (exists in `/admin/events`) ← done: 2026-05-19
  - [ ] 3.4.2 Member nomination flow on `/app` `w:1`
  - [ ] 3.4.3 Member-side tie-break + settle surface `w:1`
- [ ] 3.5 Scheduling + completion (leader-only) `w:3`
  - [ ] 3.5.1 Leader UI for `PATCH /events/{id}/schedule` `w:2`
  - [ ] 3.5.2 Leader UI for `POST /events/{id}/complete` `w:1`
- [ ] 3.6 Participation roster — volunteer / cameraman `w:2`
- [ ] 3.7 Reminder cadence: 3d / 24h / 1h `w:1`

## Phase 4 — Operational Safety & Incidents `w:8` 📊 0%

Goal: Safety leads, medical professionals, and admins can manage real-world risk without exposing private details publicly. Pre-implementation reading: [08-operational-safety-and-event-model.md](08-operational-safety-and-event-model.md).

- [ ] 4.1 Incident entity + backend contract finalized `w:2`
- [ ] 4.2 Incident reporting UI (leader / safety lead) `w:2`
  - [ ] 4.2.1 Type, severity, description, evidence upload `w:2`
- [ ] 4.3 Risk-level badge on campaign cards `w:1`
- [ ] 4.4 Notification rules by severity `w:1`
- [ ] 4.5 Public-safe vs private incident visibility `w:1`
- [ ] 4.6 Pre-event safety checklist gate `w:1`

## Phase 5 — Contribution Channels `w:10` 📊 0%

- [ ] 5.1 Labor + time donation intent UI `w:2`
- [ ] 5.2 Material donation intent `w:1`
- [ ] 5.3 Logistics donation intent `w:1`
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

## Phase 7 — Impact Stories `w:5` 📊 0%

- [ ] 7.1 Before / after gallery `w:2`
- [ ] 7.2 Blog / vlog story page `w:1`
- [ ] 7.3 Cameraman video upload (30+ min consolidated) `w:1`
- [ ] 7.4 Attendance verification from photos `w:1`

## Phase 8 — Notifications & Outreach `w:6` 📊 0%

- [ ] 8.1 Email notifications `w:2`
- [ ] 8.2 SMS for OTP + urgent alerts `w:1`
- [ ] 8.3 PWA push notifications `w:1`
- [ ] 8.4 AI assistant on WhatsApp / Messenger / IG `w:2` *(future / Meta API)*

## Phase 9 — Admin Control Center Expansion `w:10` 📊 57%

Goal: Every public-facing entity has an admin counterpart with full CRUD + audit, gated by role.

- [x] 9.1 Applications module `w:2` ← done: 2026-05-19
- [x] 9.2 Feedback module `w:1` ← done: 2026-05-19
- [x] 9.3 Issues read-only listing `w:1` ← done: 2026-05-19
- [x] 9.4 Events module (assign leader, tie-break, settle) `w:1` ← done: 2026-05-19
- [x] 9.5a Issues admin create page (`/admin/issues/create` via existing `POST /issues`) `w:0` ← done: 2026-05-25
- [x] 9.5b Issues admin edit page wired (`/admin/issues/[id]/edit`, shared `IssueForm`, `PATCH /issues/{id}` submit) `w:0` ← done: 2026-05-25 *(UI ready; PATCH endpoint not yet shipped on backend — submit errors with toast until then; see [09-backend-admin-gaps.md](09-backend-admin-gaps.md))*
- [!] 9.5 Issues full CRUD (status, notes, delete; PATCH endpoint for edit) `w:1` ← blocked: see [09-backend-admin-gaps.md](09-backend-admin-gaps.md)
- [ ] 9.6 Incidents admin view `w:1`
- [ ] 9.7 Roles / KYC verification panel `w:1`
- [ ] 9.8 Notifications admin (templates + queue) `w:1`
- [ ] 9.9 Audit log + activity feed `w:1`
- [x] 9.10 Users browse list (`/admin/users`, read-only) `w:1` ← done: 2026-05-25 *(UI ready; staging `GET /users` returns 500 due to backend `take` Int cast bug — see [09-backend-admin-gaps.md](09-backend-admin-gaps.md))*
- [ ] 9.11 Bilingual issue creation (admin EN+NE fields) `w:2` *(Admin shell stays EN-only, but free-text content authored here surfaces on the bilingual public site, so it must be captured in both languages at creation time. Today `IssueForm` accepts one language only and the public detail/list pages render whatever string was saved — there is no `np` / `en` split for issue records. See [project_language_scope](../../../.claude/projects/c--Users---------Desktop-Shramdan-apps-shramdan-web/memory/project_language_scope.md).)*
  - [ ] 9.11.1 EN + NE input pairs on `/admin/issues/create` + `/admin/issues/[id]/edit` for free-text fields (title, description, location label; category stays a dropdown) `w:1`
  - [!] 9.11.2 Translation API auto-suggest (NE ↔ EN on blur, editable) `w:1` ← blocked: backend translation endpoint not yet shipped
  - [ ] 9.11.3 Public `/issues` list + detail consume bilingual fields via existing `copy[language]` switch `w:0` *(downstream of 9.11.1 landing on backend; tracked here so it isn't forgotten — flip to a real weight once the data shape lands)*
- [x] 9.12 Admin reports analytics page + dashboard overhaul `w:2` ← done: 2026-05-27 *(Wires the admin-only `GET /api/v1/reports` aggregated endpoint into the control center. Public-facing counterpart for citizens lives in Phase 13, not here.)*
  - [x] 9.12.1 `/admin/reports` page — filter bar (date range, bucket, top-N, sections, geography, advanced per-domain) + 9 section panels (Overview / Users / Issues / Events / Engagement / Feedback / Applications / Uploads / Geographic) via `@ant-design/charts` `w:1` ← done: 2026-05-27
  - [x] 9.12.2 `/admin` dashboard rewrite — hero + quick actions + overview KPIs + "Needs attention" shortcuts + community pulse + key panels + jump-links (replaces the static module-card grid) `w:1` ← done: 2026-05-27

## Phase 10 — Native Mobile App `w:5` 📊 0%

Goal: Ship native iOS + Android once `/app` web shell is stable. Reuse the same API contracts and component vocabulary.

- [ ] 10.1 Stack decision (Expo / Capacitor / React Native + Next) `w:1`
- [ ] 10.2 Reuse `/app` design system + cards `w:2`
- [ ] 10.3 Push notification cert + storefront prep `w:1`
- [ ] 10.4 App Store + Play Store submission `w:1`

## Phase 11 — Cross-cutting Concerns `w:10` 📊 25%

- [x] 11.1 Responsive admin list pattern (`AdminResponsiveList`) `w:1` ← done: 2026-05-20
- [ ] 11.2 Accessibility audit (WCAG AA) `w:2`
- [x] 11.3 Bilingual EN/NE coverage across the public site `w:2` ← done: 2026-05-25 *(currently met; every existing public surface reads from `copy[language]`. Admin control center is intentionally EN-only. Standing rule: any new public page must ship with `np` + `en` entries — see `docs/05-design-language-guide.md` "Language Scope For Surfaces".)*
- [ ] 11.4 SEO + meta + sitemap `w:1`
- [ ] 11.5 Analytics + observability `w:1`
- [ ] 11.6 Performance (Lighthouse mobile > 90) `w:1`
- [ ] 11.7 Security review (XSS, CSRF, secret handling, rate limits) `w:1`
- [ ] 11.8 Legal: org registration, T&C, privacy, code of conduct `w:1`

## Phase 12 — Documentation & Community `w:5` 📊 40%

- [x] 12.1 Docs 01–10 set + this roadmap `w:2` ← done: 2026-05-25
- [ ] 12.2 CONTRIBUTING.md `w:1`
- [ ] 12.3 Public FAQ on website `w:1`
- [ ] 12.4 Decision log / ADRs `w:1`

## Phase 13 — Public Reports & Transparency Surface `w:6` 📊 0%

Goal: Surface a *public-safe* analytics layer across the website so citizens and members can see the community's footprint at a glance — how many issues, where they are, what's pending. Most numbers double as deep-links into filtered list pages, so a reader can click "Pending issues: 86" and land on `/issues?status=OPEN` ready to act. Distinct from Phase 9.12 (admin-only `/admin/reports`), which is operational and reveals admin-sensitive data. Pre-implementation: confirm the backend public-reports endpoint name and exactly which fields are public-safe (no PII, no admin-only counts) before wiring any UI.

- [!] 13.1 Public reports API client + bilingual labels `w:1` ← blocked: awaiting backend `GET /api/v1/public-reports` (name TBD) — confirm shape and the public-safe field allowlist before building the client
- [ ] 13.2 Dedicated public reports page (`/reports` or `/impact`, route TBD) `w:2`
  - [ ] 13.2.1 Page route + bilingual EN+NE shell + SEO meta `w:1` *(must ship with `np` + `en` copy per the standing rule in 11.3)*
  - [ ] 13.2.2 Headline KPIs + geographic distribution + issue/event mix + simple time-series (read-only; no admin filters, no PII) `w:1`
- [ ] 13.3 Homepage embed — community pulse strip `w:1` *(2–4 hero KPIs near the existing hero — e.g. issues reported, events held, volunteers active — each linking to its filtered list page; reuses chart-light primitives so it stays lightweight)*
- [ ] 13.4 Deep-link convention from KPIs → filtered list pages `w:1` *("Pending issues: N" → `/issues?status=OPEN`, "This week's events" → `/events?range=week`, etc. Spec the URL query contract once in [10-frontend-api-usage.md](10-frontend-api-usage.md) and reuse for every KPI link. Needs `/issues` (and eventually `/events`) to honor the listed query params.)*
- [ ] 13.5 Bilingual EN+NE copy across all public report surfaces `w:1` *(Brand stays श्रमदान in NE; numbers stay Latin digits unless we make a deliberate choice otherwise — open question.)*

---

# Aggregate Progress

Weighted across all phases (sum of phase weights = 131):

| Phase | Weight | Progress |
| --- | --- | --- |
| 0 Foundation | 10 | 100% |
| 1 Public Issue Discovery & Voting | 15 | 73% |
| 2 Member Portal `/app` | 18 | 0% |
| 3 Campaign Execution | 15 | 5% |
| 4 Operational Safety | 8 | 0% |
| 5 Contribution Channels | 10 | 0% |
| 6 Transparency & Ledger | 8 | 0% |
| 7 Impact Stories | 5 | 0% |
| 8 Notifications & Outreach | 6 | 0% |
| 9 Admin Control Center | 10 | 57% |
| 10 Native Mobile App | 5 | 0% |
| 11 Cross-cutting | 10 | 25% |
| 12 Documentation & Community | 5 | 40% |
| 13 Public Reports & Transparency Surface | 6 | 0% |

**Overall: ≈ 24%** (weighted sum / total weight; recompute on every edit, and redraw the [Overall Progress](#overall-progress--24) bar near the top of this file in the same edit).

# How To Update This Document

Update this document whenever you start, finish, drop, or discover a task. Update the affected phase percentage, the Aggregate Progress table, and the Overall figure in the same edit. Move "Currently Suggested Next Up" forward as work shifts. Do not let this document drift behind reality — a stale roadmap is worse than no roadmap.

Detailed *how* lives in the other docs (`02-product-plan.md` for feature scope, `04-website-structure.md` for pages, `06-implementation-notes.md` for engineering guardrails, `08-operational-safety-and-event-model.md` for safety modeling, `09-backend-admin-gaps.md` for backend dependencies). This file owns only the *what is left* and *how far along* questions.
