# Role-based join model everywhere — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "all roles visible by default" role-based join model the single model on every issue/event surface (cards, preview panes, map popups, detail pages), driven by one shared data-owning hook per domain, and delete the superseded radio-picker modal.

**Architecture:** Two new hooks own all wiring — `useRoleSupport(issueId,{seed})` (issue vote model) and `useEventJoin(eventId,{seed})` (event participant model). Each lazily loads data on first modal-open, derives the exact `panelProps` the detail pages build today, and exposes role handlers. `IssueVoteButton` and a new `EventJoinButton` render the button + the shared `ParticipantsPanel` modal shell from these hooks. Both detail pages are refactored to consume the same hooks so the wiring lives in exactly one place.

**Tech Stack:** Next.js (App Router, `next dev --webpack -p 7777`), React, antd (`Modal`, `Popconfirm`, `message` via `App.useApp()`), react-leaflet popups, existing `apiClient.js` helpers.

## Global Constraints

- No backend changes. Reuse endpoints + enums verbatim: issue `voterRole` ∈ `INTERESTED | GOING | WANT_TO_LEAD`; event/issue `eventRole` ∈ `WORKER | PHOTOGRAPHER | LIVESTREAMER | MEDIC | SAFETY_LEAD | COORDINATOR | LOGISTICS`. `eventRole` is required iff `voterRole === "GOING"`; omit it otherwise.
- Copy is bilingual EN + NE (`language` ∈ `"en" | "np"`); NE prose in Devanagari, brand as श्रमदान. Reuse the existing `COPY`/`ROLE_COPY` objects — do not invent new strings.
- No unit-test harness exists. Per-task verification = `npm run lint` clean for touched files + drive the surface in a real browser (Playwright MCP) logged in as a QA member, asserting the visible artifact. HTTP-200/lint alone is not "done".
- Maps must not fan out network requests: participation data loads only when a popup's modal is opened, never on marker mount.
- Commit per task with a conventional prefix; never `git add -A`; local only, current branch `stage`.
- Dev server runs on `http://localhost:7777`.

---

### Task 1: `useRoleSupport` hook + `IssueVoteButton` swap to the new modal

Extract the issue-support wiring into a reusable hook and make `IssueVoteButton` open the new `SupportRolesModal` (all roles visible) instead of its built-in radio `Modal`. This automatically upgrades `PublicIssueCard` and `IssuePreviewPane`.

**Files:**
- Create: `src/lib/useRoleSupport.js`
- Modify: `src/components/IssueVoteButton.js` (delete the `pickerOpen` radio `Modal` at lines ~347-399, the `ROLE_COPY.options`/`eventRoles` radio flow, and the `onRequestSupport` fork at lines ~281-288; render `SupportRolesModal` driven by the hook)
- Reference (read first, do not duplicate logic): `src/app/issues/[id]/page.js` lines 120-165 (data load), 222-375 (handlers), 410-470 (panelProps), 652-670 (SupportRolesModal usage)

**Interfaces:**
- Produces: `useRoleSupport(issueId, { seed, content, language, onVoteChange } )` →
  `{ open, openModal(), closeModal(), loading, voteCount, voted, voterRole, eventRole, panelProps, onInterested }`
  where `panelProps` matches the `ParticipantsPanel` contract:
  `{ roles:[{role,count,names:string[]}], viewer, progress, joinableRoles, canLeave, leaderSlot, canLeaveLead, onJoin(role), onLead(), onLeave(), onLeaveLead() }`.
- Consumes: `apiClient` `getJson`, `voteOnIssue`, `retractVoteOnIssue`, `fetchIssueParticipants`, `fetchMyIssueVotes`, `getListItems`; `getAuthSession`, `buildLoginHref`; `App.useApp()` for `message`.

- [ ] **Step 1: Write the hook skeleton with lazy load**

`src/lib/useRoleSupport.js` — load on first `openModal()` only:

```js
"use client";
import { useCallback, useState } from "react";
import { App } from "antd";
import { usePathname, useRouter } from "next/navigation";
import {
  getJson, voteOnIssue, retractVoteOnIssue,
  fetchIssueParticipants, fetchMyIssueVotes, getListItems
} from "@/lib/apiClient";
import { getAuthSession } from "@/lib/authSession"; // confirm exact path while reading the page
import { buildLoginHref } from "@/lib/loginHref";   // confirm exact path while reading the page

const PARTICIPANT_ROLE_ORDER = [
  "WORKER","PHOTOGRAPHER","LIVESTREAMER","MEDIC","SAFETY_LEAD","COORDINATOR","LOGISTICS"
];

export function useRoleSupport(issueId, { seed = null, content, language = "np", onVoteChange } = {}) {
  const { message } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();

  const [issue, setIssue] = useState(seed);
  const [myVote, setMyVote] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [detail, myVotesRes, partsRes] = await Promise.all([
      getJson(`/issues/${issueId}`).catch(() => null),
      getAuthSession()?.user ? fetchMyIssueVotes({ limit: 100 }).catch(() => null) : Promise.resolve(null),
      fetchIssueParticipants(issueId, { limit: 100 }).catch(() => null)
    ]);
    const data = detail?.data ?? detail ?? seed ?? {};
    if (data) setIssue((prev) => ({ ...(prev || {}), ...data }));
    const mine = myVotesRes ? getListItems(myVotesRes).find((v) => v.id === (data.id ?? issueId)) : null;
    setMyVote(mine ? { voterRole: mine.voterRole || "INTERESTED", eventRole: mine.eventRole || null } : null);
    setParticipants(getListItems(partsRes));
  }, [issueId, seed]);

  const openModal = useCallback(async () => {
    setOpen(true);
    if (loaded) return;
    setLoading(true);
    try { await load(); setLoaded(true); } finally { setLoading(false); }
  }, [loaded, load]);

  const closeModal = useCallback(() => setOpen(false), []);
  // ... panelProps + handlers in next steps
}
```

- [ ] **Step 2: Add `panelProps` derivation (verbatim from the issue page)**

Inside the hook, after the issue/myVote/participants state, compute (mirrors `issues/[id]/page.js` lines 410-470):

```js
const viewerName = getAuthSession()?.user?.name || null;
const isOpenIssue = issue?.status === "OPEN";

const roles = (() => {
  const countByRole = new Map();
  if (Array.isArray(issue?.eventRoleCounts))
    for (const e of issue.eventRoleCounts) countByRole.set(e?.eventRole, Number(e?.voterCount) || 0);
  const namesByRole = new Map();
  for (const p of participants) {
    if (!p?.eventRole || !p?.user?.name) continue;
    namesByRole.set(p.eventRole, [...(namesByRole.get(p.eventRole) || []), p.user.name]);
  }
  return PARTICIPANT_ROLE_ORDER.filter((r) => r !== "COORDINATOR").map((role) => {
    const names = namesByRole.get(role) || [];
    return { role, count: countByRole.has(role) ? countByRole.get(role) : names.length, names };
  });
})();

const viewer = myVote?.voterRole === "GOING" && myVote?.eventRole
  ? { role: myVote.eventRole, status: "GOING", name: viewerName } : null;
const viewerIsLeader = myVote?.voterRole === "WANT_TO_LEAD";
const progress = isOpenIssue && Number(issue?.conversionThreshold) > 0
  ? { current: Number(issue?.attendingCount) || 0, target: Number(issue?.conversionThreshold), variant: "conversion" } : null;
const joinableRoles = isOpenIssue && !myVote ? null : [];
const canLeave = isOpenIssue && Boolean(viewer);
const leaderSlot = isOpenIssue || viewerIsLeader
  ? { viewerIsLeader, name: viewerIsLeader ? viewerName : null, count: viewerIsLeader ? 1 : 0, canLead: isOpenIssue && !myVote } : null;
const canLeaveLead = isOpenIssue && viewerIsLeader;
```

- [ ] **Step 3: Add the handlers (mirror the page handler bodies)**

Add `applyVoteChange(payload)` (mirrors page lines 222-257: update `myVote`, patch issue counts/status, refetch roster via `fetchIssueParticipants`, call `onVoteChange?.(payload)`), then `join(role)` → `voteOnIssue(issueId,"GOING",role)`, `lead()` → `voteOnIssue(issueId,"WANT_TO_LEAD")`, `interested()` → `voteOnIssue(issueId,"INTERESTED")`, `leave()` → `retractVoteOnIssue(issueId)`. Copy the auth-redirect, `ALREADY_VOTED`/403/`ISSUE_NOT_OPEN` branches and `message` calls verbatim from page lines 264-375, swapping `rawIssue.id`→`issueId` and `messageApi`→`message`. Return `{ open, openModal, closeModal, loading, voteCount: Number(issue?.voteCount)||0, voted: Boolean(myVote), voterRole: myVote?.voterRole, eventRole: myVote?.eventRole, panelProps: { roles, viewer, progress, joinableRoles, canLeave, leaderSlot, canLeaveLead, onJoin: join, onLead: lead, onLeave: leave, onLeaveLead: leave }, onInterested: interested }`.

- [ ] **Step 4: Rewire `IssueVoteButton`**

In `src/components/IssueVoteButton.js`: keep the button face + `Popconfirm` withdraw. Replace the unvoted-click branch so it calls `support.openModal()`; delete the `pickerOpen` state, the `<Modal>` block (lines ~347-399), the `EVENT_ROLE_ORDER` radio usage, and the `onRequestSupport` prop + fork. Render `<SupportRolesModal open={support.open} onClose={support.closeModal} language={language} onInterested={support.onInterested} panelProps={support.panelProps} />`. Wire `seed`/`onVoteChange` props through to `useRoleSupport`. Keep the existing `initialVoterRole`/`initialEventRole`/voted-chip label logic, sourcing live role from `support.voterRole`/`support.eventRole` when present.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: no new errors in `src/lib/useRoleSupport.js` or `src/components/IssueVoteButton.js`.

- [ ] **Step 6: Browser-verify on the issues preview pane**

Start dev (`npm run dev`), log in as QA member. Navigate `http://localhost:7777/issues`, select an OPEN issue, click the Support button in the right preview pane. Assert: the new modal opens showing **all roles with counts by default** (not a radio-first picker), "I'm interested" header present; pick a role → it joins and the voted chip updates; reopen → withdraw works. Screenshot before/after.

- [ ] **Step 7: Commit**

```bash
git add src/lib/useRoleSupport.js src/components/IssueVoteButton.js
git commit -m "feat(support): drive IssueVoteButton from shared useRoleSupport hook, drop radio modal"
```

---

### Task 2: Issue detail page consumes `useRoleSupport`

Remove the issue detail page's inline wiring + page-level `SupportRolesModal`; the body `ParticipantsPanel` and the topline support button now both come from the hook (one source of truth).

**Files:**
- Modify: `src/app/issues/[id]/page.js` (remove inline data load for votes/participants feeding the panel, the `handleJoinRole/handleLeaveRole/handleLeadVote/handleInterestedVote/handleVoteChange` bodies now living in the hook, the local `SupportRolesModal` at lines ~652-670, and the `onRequestSupport` wiring; pass `seed={rawIssue}` to `IssueVoteButton`; feed the body `<ParticipantsPanel>` from `support.panelProps`)

**Interfaces:**
- Consumes: `useRoleSupport` from Task 1.

- [ ] **Step 1: Swap the page over**

Read the current file fully. Replace the inline participation state + handlers with `const support = useRoleSupport(issueId, { seed: rawIssue, content, language, onVoteChange: ... });`. Render the body roster as `<ParticipantsPanel {...support.panelProps} language={language} />` and the topline as `<IssueVoteButton seed={rawIssue} ... />`. Delete the now-dead inline handlers, the page's `SupportRolesModal`, and `supportModalOpen` state. Keep any page-only concerns (e.g. conversion progress shown in the body) sourced from `support.panelProps.progress`.

- [ ] **Step 2: Lint** — `npm run lint` clean for the file.

- [ ] **Step 3: Browser-verify the issue detail page**

Navigate to an OPEN issue detail page logged in as QA member. Assert all four paths still work: **I'm interested**, **join as a role** (GOING+eventRole), **want to lead**, and **withdraw**; the body roster reflects each change; the voted chip on the topline button updates. Verify a non-OPEN issue shows the roster read-only (no join). Screenshot.

- [ ] **Step 4: Commit**

```bash
git add src/app/issues/[id]/page.js
git commit -m "refactor(issues): issue detail page consumes useRoleSupport (single source of truth)"
```

---

### Task 3: Issue map popup gets the role-based support button

Add the support action to the glassy issue map popup, lazy-loaded, click-safe inside Leaflet.

**Files:**
- Modify: `src/components/IssueMap.js` (in `IssueMarker`'s popup footer, lines ~253-274, add `<IssueVoteButton seed={rawIssue} issueId={issue.id} content={content} language={language} size="small" showCount={false} />` alongside the "View" link)

**Interfaces:**
- Consumes: `IssueVoteButton` (Task 1).

- [ ] **Step 1: Render the button in the popup**

Import `IssueVoteButton`; pass `seed={rawIssue}` so the modal renders instantly from card data and refreshes in the background. Wrap the button's click region so the Leaflet popup does not swallow it (the button's `handleClick` already calls `stopPropagation`; verify the antd `Modal` opens above the map).

- [ ] **Step 2: Lint** — `npm run lint` clean.

- [ ] **Step 3: Browser-verify on the map**

Navigate to a page with the issue map (home or `/issues` map). Open a Network panel; click several issue markers — assert **no** `/participants` or `/me/votes` requests fire from merely opening popups. Click Support inside a popup → assert the modal opens with all roles, join works, count updates. Screenshot.

- [ ] **Step 4: Commit**

```bash
git add src/components/IssueMap.js
git commit -m "feat(map): role-based support button in the issue map popup"
```

---

### Task 4: `useEventJoin` hook + `EventJoinButton` + event modal shell, wired into `EventPreviewPane`

Build the event-side mirror and prove it on the event preview pane (events have no preview action today).

**Files:**
- Create: `src/lib/useEventJoin.js`
- Create: `src/components/EventJoinButton.js`
- Modify: `src/components/EventPreviewPane.js` (add `<EventJoinButton eventId={event.id} seed={event} language={language} />` near the "Open Full" link, lines ~408-414)
- Reference (read first): `src/app/events/[id]/page.js` lines 175-303 (load + viewer), 408-533 (handlers + panelProps); `src/lib/eventParticipants.js` (`buildRolesNeeded`, `findViewerRoleByName`, `isActiveParticipationStatus`, `countActiveParticipants`)

**Interfaces:**
- Produces: `useEventJoin(eventId, { seed, language })` →
  `{ open, openModal(), closeModal(), loading, panelProps }` where `panelProps` matches `ParticipantsPanel` (event variant: `target` per role, `progress.variant:"fill"`, leader read-only, no `onLead/onInterested`).
- Produces: `EventJoinButton({ eventId, seed, language, size })` — button + event modal shell.
- Consumes: `getJson, postJson, deleteJson` from `apiClient`; `eventParticipants` helpers; `App.useApp()`; `getAuthSession`, `buildLoginHref`; `ParticipantsPanel`.

- [ ] **Step 1: Build `useEventJoin` (lazy load + derive)**

Mirror Task 1's lazy pattern. On open: `getJson(/events/{id})`; if `rolePlan` without `rolesNeeded`, `getJson(/events/{id}/participants?limit=200)` and aggregate with `buildRolesNeeded`; if authed, `getJson(/events/{id}/participants/me,{requireAuth:true})` → `myParticipation`. Derive `panelProps` verbatim from page lines 485-533: `roles` (`{role,count:filled,target:count,names:filledNames}`, exclude COORDINATOR), `viewer`, `progress` (`variant:"fill"`), `joinableRoles` (`ACTIVE→["WORKER"]`, `DRAFT|SCHEDULED→null`, else `[]`), `canLeave`, `leaderSlot` (`canLead:false`). Handlers `join(role)` → `postJson(/events/{id}/participants,{role},{requireAuth:true})` with the 403-MEDIC / 409 / INVITED branches from page lines 408-465; `leave()` → `deleteJson(/events/{id}/participants/{myParticipation.id},{requireAuth:true})`. Refetch event + `/participants/me` after each (page `handleJoinChanged`/`handleLeaveChanged`).

- [ ] **Step 2: Build `EventJoinButton`**

A button (label from existing event `JOIN_COPY`/panel copy; reuse, don't invent) that calls `openModal()` and renders the event modal shell: `<Modal open={join.open} onCancel={join.closeModal} footer={null} title={...}><ParticipantsPanel {...join.panelProps} embedded language={language} /></Modal>`. No "I'm interested" header (events have no INTERESTED).

- [ ] **Step 3: Wire into `EventPreviewPane`** — render `<EventJoinButton eventId={event.id} seed={event} language={language} />`.

- [ ] **Step 4: Lint** — `npm run lint` clean for the three files.

- [ ] **Step 5: Browser-verify on the events preview pane**

Navigate `http://localhost:7777/events`, select a SCHEDULED event, click Join in the preview pane. Assert: modal shows all planned roles with fill/target counts; joining as a role lands (or waitlists with INVITED), the viewer chip appears; leave works; ACTIVE event offers WORKER only; COMPLETED/CANCELLED is read-only. Screenshot.

- [ ] **Step 6: Commit**

```bash
git add src/lib/useEventJoin.js src/components/EventJoinButton.js src/components/EventPreviewPane.js
git commit -m "feat(events): shared useEventJoin hook + EventJoinButton on the event preview pane"
```

---

### Task 5: Event detail page consumes `useEventJoin`

Single source of truth for event join.

**Files:**
- Modify: `src/app/events/[id]/page.js` (replace inline participant load + `handleJoinRole/handleLeaveRole/handleJoinChanged/handleLeaveChanged` + panelProps derivation with `useEventJoin`; feed the body `<ParticipantsPanel>` from `join.panelProps`)

- [ ] **Step 1: Swap the page over**

Read the file fully. Introduce `const join = useEventJoin(eventId, { seed: eventData, language });` and render the body roster as `<ParticipantsPanel {...join.panelProps} language={language} />`. Preserve demo-event behavior (`isDemoEvent` local-mutation path) — keep it in the hook behind the same `seed`/demo branch, or guard in the page; do not regress demo events. Delete the now-dead inline handlers/state.

- [ ] **Step 2: Lint** — `npm run lint` clean.

- [ ] **Step 3: Browser-verify the event detail page**

On a SCHEDULED event detail page (and a demo event), assert join/leave + body roster still work and CHECKED_IN cannot leave. Screenshot.

- [ ] **Step 4: Commit**

```bash
git add src/app/events/[id]/page.js
git commit -m "refactor(events): event detail page consumes useEventJoin (single source of truth)"
```

---

### Task 6: Event map popup gets the role-based join button

**Files:**
- Modify: `src/components/EventMap.js` (in `EventMarker`'s popup footer, lines ~189-199, add `<EventJoinButton eventId={event.id} seed={event} language={language} size="small" />` alongside the "View" link)

- [ ] **Step 1: Render the button** — import + place `EventJoinButton` in the popup footer; verify click-through inside the Leaflet popup.

- [ ] **Step 2: Lint** — `npm run lint` clean.

- [ ] **Step 3: Browser-verify** — open event markers (no eager `/participants` fetch); open Join in a popup → modal works, join lands. Screenshot.

- [ ] **Step 4: Commit**

```bash
git add src/components/EventMap.js
git commit -m "feat(map): role-based join button in the event map popup"
```

---

### Task 7: Dead-code sweep + cross-surface verification

**Files:**
- Modify: `src/components/IssueVoteButton.js` (remove any now-unused `ROLE_COPY` radio-only keys — `modalTitle`, `modalIntro`, `options`, `eventRolePrompt`, `eventRoleHint`, `submit`, `cancel`, `EVENT_ROLE_ORDER` — only if no longer referenced anywhere)
- Grep: confirm no remaining references to `onRequestSupport` or the old picker.

- [ ] **Step 1: Find dead code**

Run: `npx --no-install grep -rn "onRequestSupport\|pickerOpen\|voter-role-modal" src` (or Grep tool). Expected: no matches outside removed code.

- [ ] **Step 2: Remove unused copy/constants** confirmed dead by Step 1.

- [ ] **Step 3: Lint + build**

Run: `npm run lint && npm run build`
Expected: clean lint, successful build.

- [ ] **Step 4: Full cross-surface browser sweep**

Logged in as QA member, verify the new model is identical on: issue map popup, `PublicIssueCard` (home/search grid), `IssuePreviewPane`, issue detail page, event map popup, `EventPreviewPane`, event detail page. Confirm no surface shows the old radio-first picker. Screenshot each.

- [ ] **Step 5: Commit**

```bash
git add -u src
git commit -m "chore(support): remove superseded radio-picker copy + dead support paths"
```

---

## Self-Review

**Spec coverage:** root cause (dumb panel/duplicated wiring) → Tasks 1,4 hooks + Tasks 2,5 page refactors; old model deleted → Tasks 1,7; surfaces table → Tasks 1 (cards+preview pane auto), 3 (issue map), 4 (event preview pane), 6 (event map); events included → Tasks 4-6; divergence prevention (one owner each) → Tasks 2,5; risks (Leaflet click, no eager fetch, detail regression) → verification steps in Tasks 3,6 (network assertion) and 2,5 (regression). Navigation-only surfaces untouched per out-of-scope. Covered.

**Placeholder scan:** Handlers in Tasks 1/4 say "mirror page lines X-Y verbatim" rather than re-pasting ~120 lines of identical existing code — the source location is exact and the API calls/branches are enumerated; this is a faithful lift, not a TBD. Import paths for `getAuthSession`/`buildLoginHref` are marked "confirm exact path while reading the page" because the page already imports them — the implementer copies the real path. No other placeholders.

**Type consistency:** `panelProps` keys match the `ParticipantsPanel` contract (`roles`, `viewer`, `progress`, `joinableRoles`, `canLeave`, `leaderSlot`, `canLeaveLead`, `onJoin`, `onLead`, `onLeave`, `onLeaveLead`) in every task; issue roles use `{role,count,names}`, event roles add `target`; hook return shapes are consistent between Task 1 (`openModal/closeModal/open/panelProps/onInterested`) and its consumers (Tasks 2,3) and between Task 4 and consumers (Tasks 5,6).
