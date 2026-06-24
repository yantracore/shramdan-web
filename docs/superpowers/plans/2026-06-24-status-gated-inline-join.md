# Status-Gated Inline Participation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the issue/event "Join" act inline (no navigation), gated by the live event status, so a promoted issue is always joinable per the 5-phase model.

**Architecture:** Centralise the 5-phase rules in one pure module (`issueActions.js`). `useEventJoin` reads it to scope joinable roles and to synthesise default role rows when the event has no `rolePlan`. `IssueJoinButton` becomes an inline modal (mounts `useEventJoin`, opens `ParticipantsPanel` in a `Modal`) instead of linking to `/events/{id}`. The issue page routes its topline CTA by the corrected `issueActionMode`.

**Tech Stack:** Next.js (App Router, React, "use client"), Ant Design, plain-JS ESM libs. No unit-test framework in this repo — pure logic is checked with a one-off `node` assertion; UI is verified in a real browser (Playwright) against the temporary devtunnel backend, per the project's verify-before-done practice.

## Global Constraints

- Reply/UI copy bilingual: NP (Devanagari) + EN. NP clickable labels use the agentive `-ने` form (`जोडिने`), prose/headings keep `-नुहोस्`. Render brand as श्रमदान in NP.
- voterRole enum (issues): `INTERESTED | GOING | WANT_TO_LEAD`. eventRole / participant role enum: `WORKER | PHOTOGRAPHER | LIVESTREAMER | MEDIC | SAFETY_LEAD | LOGISTICS` (COORDINATOR excluded from the role grid — leadership is its own slot).
- Event lifecycle statuses: `DRAFT | SCHEDULED | ACTIVE | COMPLETED | CANCELLED`. Issue statuses: `OPEN | EVENT_DRAFT | COMPLETED` (coarse — `EVENT_DRAFT` spans event DRAFT/SCHEDULED/ACTIVE/CANCELLED).
- Gating is driven by **event.status** for promoted issues; `issue.status` only separates `OPEN` (vote) from promoted (join) and terminal `COMPLETED`.
- Temporary backend (real one down): `https://djrh0dg2-3021.usw2.devtunnels.ms/api/v1`. Set `NEXT_PUBLIC_API_BASE_URL` to it for local runs. Do NOT commit this URL into any source/doc default.
- Frontend-only. No backend changes. `POST /events/{id}/participants { role }` is reused as-is.

---

## File structure

- `src/lib/issueActions.js` — **modify.** Fix `issueActionMode`; add pure `eventJoinPhase(eventStatus)` + shared `PARTICIPANT_ROLE_ORDER`. The single source of the 5-phase rules.
- `src/lib/useEventJoin.js` — **modify.** Scope joinable roles via `eventJoinPhase`; synthesise default role rows when `rolePlan`/`rolesNeeded` is empty; expose a `phase` for the button label.
- `src/components/IssueJoinButton.js` — **rewrite.** Inline modal (mount `useEventJoin`, open `ParticipantsPanel` in a `Modal`); render the COMPLETED "Contributed as {role}" chip and the CANCELLED state. No more `<Link>`.
- `src/app/issues/[id]/page.js` — **modify.** `actionMode` now yields `join` for `EVENT_DRAFT` and `contributed` for `COMPLETED`; pass `eventId` + `eventStatus` to `IssueJoinButton`.
- `src/app/events/[id]/page.js` — **verify only.** Inherits the gating fix through `useEventJoin`; confirm SCHEDULED renders Cleaner-only even with an empty `rolePlan`.

---

## Task 1: Pure 5-phase gating helpers

**Files:**
- Modify: `src/lib/issueActions.js`

**Interfaces:**
- Produces:
  - `issueActionMode(status: string) => "support" | "join" | "contributed" | "none"`
  - `eventJoinPhase(eventStatus: string|null) => { label: "join"|"contributed"|"cancelled", roleScope: null | string[], joinable: boolean }` — `roleScope` null = all roles; `[]` = none; `["WORKER"]` = cleaner only.
  - `PARTICIPANT_ROLE_ORDER: string[]`
  - existing `getIssueEventId(issue)` unchanged.

- [ ] **Step 1: Write the failing check**

Create a throwaway assertion (no test framework in repo) — run from the project root:

```bash
node --input-type=module -e '
import { issueActionMode, eventJoinPhase, PARTICIPANT_ROLE_ORDER } from "./src/lib/issueActions.js";
const eq = (a,b,m) => { if (JSON.stringify(a)!==JSON.stringify(b)) { console.error("FAIL", m, "=>", JSON.stringify(a)); process.exit(1); } };
eq(issueActionMode("OPEN"), "support", "OPEN");
eq(issueActionMode("EVENT_DRAFT"), "join", "EVENT_DRAFT");
eq(issueActionMode("COMPLETED"), "contributed", "COMPLETED");
eq(issueActionMode("REJECTED"), "none", "REJECTED");
eq(eventJoinPhase("DRAFT"), { label:"join", roleScope:null, joinable:true }, "DRAFT");
eq(eventJoinPhase("SCHEDULED"), { label:"join", roleScope:["WORKER"], joinable:true }, "SCHEDULED");
eq(eventJoinPhase("ACTIVE"), { label:"join", roleScope:["WORKER"], joinable:true }, "ACTIVE");
eq(eventJoinPhase("COMPLETED"), { label:"contributed", roleScope:[], joinable:false }, "COMPLETED");
eq(eventJoinPhase("CANCELLED"), { label:"cancelled", roleScope:[], joinable:false }, "CANCELLED");
eq(eventJoinPhase(null), { label:"join", roleScope:null, joinable:true }, "null→draft-like");
eq(PARTICIPANT_ROLE_ORDER[0], "WORKER", "role order head");
console.log("OK");
'
```

Expected: FAIL — `eventJoinPhase` / `PARTICIPANT_ROLE_ORDER` not exported yet (and `issueActionMode("EVENT_DRAFT")` returns `"none"`).

- [ ] **Step 2: Implement**

Replace the body of `src/lib/issueActions.js` with:

```js
// Which primary action an issue surfaces, decided by its lifecycle status.
//
//   OPEN        → "support"      voting is open; supporters can still pile on.
//   EVENT_DRAFT → "join"         promoted into a campaign event; the call to
//                                action is to take part. (Issue status stays
//                                EVENT_DRAFT across event DRAFT/SCHEDULED/ACTIVE/
//                                CANCELLED — the fine phase comes from the event,
//                                see eventJoinPhase.)
//   COMPLETED   → "contributed"  campaign done; show the viewer's contribution.
//   anything else → "none"
//
// Single source of truth shared by every issue surface (detail page, grid card,
// preview pane) so they all agree on Support-vs-Join-vs-Contributed.
export function issueActionMode(status) {
  if (status === "OPEN") return "support";
  if (status === "EVENT_DRAFT") return "join";
  if (status === "COMPLETED") return "contributed";
  return "none";
}

// Role grid order, shared by the issue + event participation surfaces.
// COORDINATOR is excluded — leadership is its own slot (WANT_TO_LEAD / event
// leader), never a role-grid row.
export const PARTICIPANT_ROLE_ORDER = [
  "WORKER",
  "PHOTOGRAPHER",
  "LIVESTREAMER",
  "MEDIC",
  "SAFETY_LEAD",
  "LOGISTICS"
];

// The fine-grained join behaviour for a promoted issue, keyed on the linked
// EVENT's status (issue.status is too coarse — it's EVENT_DRAFT for all of
// DRAFT/SCHEDULED/ACTIVE/CANCELLED). Returns the CTA label kind, the role scope
// the picker may offer (null = all roles; [] = none; ["WORKER"] = cleaner only),
// and whether a join is possible at all. A null/unknown status is treated as
// DRAFT-like so a freshly-resolved event is joinable rather than dead.
export function eventJoinPhase(eventStatus) {
  switch (eventStatus) {
    case "SCHEDULED":
    case "ACTIVE":
      return { label: "join", roleScope: ["WORKER"], joinable: true };
    case "COMPLETED":
      return { label: "contributed", roleScope: [], joinable: false };
    case "CANCELLED":
      return { label: "cancelled", roleScope: [], joinable: false };
    case "DRAFT":
    default:
      return { label: "join", roleScope: null, joinable: true };
  }
}

// Resolve a link to the scheduled campaign event from an issue, if the backend
// exposes one. Issues do NOT yet carry their event id — the link is event →
// issue, never the reverse. This reads whichever field the backend eventually
// lands on so the Join CTA wires itself up the moment the link ships.
export function getIssueEventId(issue) {
  return (
    issue?.eventId ||
    issue?.event?.slug ||
    issue?.event?.id ||
    issue?.eventSlug ||
    null
  );
}
```

- [ ] **Step 3: Run the check — expect PASS**

Run the Step-1 command again. Expected: prints `OK`, exit 0.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no new errors in `src/lib/issueActions.js`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/issueActions.js
git commit -m "feat(join): 5-phase gating helpers (issueActionMode + eventJoinPhase)"
```

---

## Task 2: Status-gated, rolePlan-independent roles in useEventJoin

**Files:**
- Modify: `src/lib/useEventJoin.js`

**Interfaces:**
- Consumes: `eventJoinPhase`, `PARTICIPANT_ROLE_ORDER` from Task 1.
- Produces: the hook return gains `phase: { label, roleScope, joinable }` (from `eventJoinPhase(eventData.status)`); `panelProps.roles` is never empty for a joinable phase; `panelProps.joinableRoles` is `["WORKER"]` for SCHEDULED/ACTIVE, `null` for DRAFT, `[]` otherwise. `viewerRole`/`viewerStatus` unchanged.

- [ ] **Step 1: Add the import**

In `src/lib/useEventJoin.js`, add to the imports near the top (after the existing `@/lib/eventParticipants` import):

```js
import { eventJoinPhase, PARTICIPANT_ROLE_ORDER } from "@/lib/issueActions";
```

- [ ] **Step 2: Derive the phase and scope from status**

Replace the existing `participantJoinableRoles` block (currently the `eventData?.status === "ACTIVE" ? ["WORKER"] : …` ternary) with:

```js
  // Fine-grained join behaviour from the EVENT's status (issue.status is coarse).
  const phase = eventJoinPhase(eventData?.status);

  // joinableRoles: null = all roles open; ["WORKER"] = cleaner only; [] = none.
  const participantJoinableRoles = phase.roleScope;
```

- [ ] **Step 3: Synthesise default role rows when rolePlan is empty**

Replace the existing `participantRoles` derivation (the `.filter((row) => row.role !== "COORDINATOR").map(...)` over `eventData?.rolesNeeded`) with the version below. It keeps real `rolesNeeded` rows when present, but for a joinable phase with no plan it builds rows from the scope so the picker is never empty (the live root-cause: most events carry no `rolePlan`).

```js
  // Real plan rows (rolePlan → rolesNeeded), COORDINATOR excluded from the grid.
  const planRows = (Array.isArray(eventData?.rolesNeeded) ? eventData.rolesNeeded : [])
    .filter((row) => row.role !== "COORDINATOR")
    .map((row) => ({
      role: row.role,
      count: row.filled || 0,
      target: row.count,
      names: Array.isArray(row.filledNames) ? row.filledNames : []
    }));

  // Which roles this phase must be able to OFFER, even with no rolePlan:
  //   all roles (DRAFT) → the full menu;  ["WORKER"] (SCHEDULED/ACTIVE) → cleaner.
  const scopeRoles =
    participantJoinableRoles === null
      ? PARTICIPANT_ROLE_ORDER
      : participantJoinableRoles;

  // Merge: start from real plan rows, then add any scoped role missing from the
  // plan as an empty (count 0, no target) row so it renders a Join action.
  const participantRoles = (() => {
    const byRole = new Map(planRows.map((r) => [r.role, r]));
    for (const role of scopeRoles) {
      if (!byRole.has(role)) byRole.set(role, { role, count: 0, target: null, names: [] });
    }
    // Preserve a stable order: known order first, then any plan-only extras.
    const ordered = PARTICIPANT_ROLE_ORDER.filter((r) => byRole.has(r)).map((r) => byRole.get(r));
    const extras = planRows.filter((r) => !PARTICIPANT_ROLE_ORDER.includes(r.role));
    return [...ordered, ...extras];
  })();
```

- [ ] **Step 4: Recompute `joinable` and expose `phase`**

The existing `joinable` const and the final `return` should use the phase. Replace the existing `joinable` derivation with:

```js
  const joinable = phase.joinable;
```

and add `phase` to the hook's return object (next to `joinable`):

```js
  return {
    open,
    openModal,
    closeModal,
    loading,
    panelProps,
    joinable,
    phase,
    viewerRole,
    viewerStatus
  };
```

- [ ] **Step 5: Verify in the browser (event page, the gating)**

Start the dev server pointed at the temporary backend:

```bash
NEXT_PUBLIC_API_BASE_URL="https://djrh0dg2-3021.usw2.devtunnels.ms/api/v1" npm run dev
```

Then drive these with Playwright (`mcp__playwright__browser_navigate` + `browser_snapshot`), asserting the visible artifact:

- `http://localhost:7777/events/tree-planting-at-surya-binayak-empty-land` (SCHEDULED, has rolePlan) → Participants panel shows a **Cleaner (WORKER) Join** action; specialist rows (Photographer/Medic/…) show **no** Join button (cleaner-only scope).
- `http://localhost:7777/events/nagarkot-trekking-route-cleanup` (SCHEDULED, **empty rolePlan**) → the panel still renders and the **Cleaner Join** action is present (this is the empty-rolePlan fix).
- `http://localhost:7777/events/covered-drain-choke-at-main-bazaar-done` (COMPLETED) → no Join action anywhere (read-only).

Expected: all three as described. Capture a screenshot of the SCHEDULED empty-rolePlan page as evidence.

- [ ] **Step 6: Commit**

```bash
git add src/lib/useEventJoin.js
git commit -m "feat(join): status-gated, rolePlan-independent roles in useEventJoin"
```

---

## Task 3: IssueJoinButton — inline modal (no navigation)

**Files:**
- Rewrite: `src/components/IssueJoinButton.js`

**Interfaces:**
- Consumes: `useEventJoin` (Task 2, gains `phase`), `eventJoinPhase` (Task 1), `ParticipantsPanel`, antd `Modal`/`Button`, `getIssueEventId`.
- Produces: `<IssueJoinButton issue eventId eventStatus language size />` — renders the gated CTA inline. Join phases open a `Modal` containing `ParticipantsPanel`; `COMPLETED` renders a read-only "Contributed as {role}" chip; `CANCELLED` renders a disabled "Cancelled" chip. No route change.

- [ ] **Step 1: Rewrite the component**

Replace the entire contents of `src/components/IssueJoinButton.js` with:

```jsx
"use client";

// Primary CTA for a promoted issue (issue.status === EVENT_DRAFT) or its event.
// The join machinery is the event's ParticipantsPanel (POST /events/{id}/
// participants). Rather than navigate there, we mount useEventJoin for the
// resolved event and open that panel inline in a Modal — same component, no
// route change. What the CTA offers is gated by the EVENT's status:
//   DRAFT            → "Join", full role menu + Lead
//   SCHEDULED/ACTIVE → "Join", Cleaner only
//   COMPLETED        → read-only "Contributed as {role}" chip
//   CANCELLED        → disabled "Cancelled" chip
//   (no event id)    → an honest "almost ready" cue instead of a dead button.

import { CheckCircleFilled, StopOutlined, UserAddOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
import { useToast } from "@/lib/toast";
import { useEventJoin } from "@/lib/useEventJoin";
import { eventJoinPhase, getIssueEventId } from "@/lib/issueActions";

const COPY = {
  np: {
    join: "जोडिने",
    title: "कुन भूमिकामा जोडिनुहुन्छ?",
    contributed: "योगदान: {role}",
    contributedPlain: "योगदान गरियो",
    cancelled: "रद्द भयो",
    soon: "अभियानको तालिका तय भइसक्यो — जोडिने सुविधा छिट्टै सक्रिय हुन्छ।",
    roles: {
      WORKER: "सफाइकर्मी", PHOTOGRAPHER: "फोटोग्राफर", LIVESTREAMER: "लाइभस्ट्रिमर",
      MEDIC: "स्वास्थ्यकर्मी", SAFETY_LEAD: "सुरक्षा प्रमुख", LOGISTICS: "लजिस्टिक्स"
    }
  },
  en: {
    join: "Join",
    title: "Which role would you take?",
    contributed: "Contributed as {role}",
    contributedPlain: "Contributed",
    cancelled: "Cancelled",
    soon: "This campaign is scheduled — joining opens shortly.",
    roles: {
      WORKER: "Cleaner", PHOTOGRAPHER: "Photographer", LIVESTREAMER: "Livestreamer",
      MEDIC: "Medic", SAFETY_LEAD: "Safety Lead", LOGISTICS: "Logistics"
    }
  }
};

export function IssueJoinButton({
  issue,
  eventId: eventIdProp = null,
  eventStatus = null,
  language = "np",
  size,
  type = "primary",
  className,
  block = false
}) {
  const t = COPY[language] || COPY.np;
  const messageApi = useToast();
  const eventId = eventIdProp || getIssueEventId(issue);
  const phase = eventJoinPhase(eventStatus);

  // Eager-load only when we need the viewer's role for the COMPLETED chip; join
  // phases load lazily when the modal opens.
  const join = useEventJoin(eventId, {
    language,
    eager: phase.label === "contributed" && Boolean(eventId)
  });

  // No event resolved yet → keep the CTA honest, no dead navigation.
  if (!eventId) {
    return (
      <Button
        block={block}
        className={className}
        icon={<UserAddOutlined />}
        size={size}
        type={type}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          messageApi.info(t.soon);
        }}
      >
        {t.join}
      </Button>
    );
  }

  if (phase.label === "cancelled") {
    return (
      <Button block={block} className={className} icon={<StopOutlined />} size={size} disabled>
        {t.cancelled}
      </Button>
    );
  }

  if (phase.label === "contributed") {
    const role = join.viewerRole;
    const label = role
      ? t.contributed.replace("{role}", t.roles[role] || role)
      : t.contributedPlain;
    return (
      <Button block={block} className={className} icon={<CheckCircleFilled />} size={size} disabled>
        {label}
      </Button>
    );
  }

  // Join phases (DRAFT / SCHEDULED / ACTIVE) → open the role picker inline.
  return (
    <>
      <Button
        block={block}
        className={className}
        icon={<UserAddOutlined />}
        size={size}
        type={type}
        loading={join.loading}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          join.openModal();
        }}
      >
        {t.join}
      </Button>

      <Modal
        open={join.open}
        onCancel={join.closeModal}
        footer={null}
        width={680}
        title={t.title}
        destroyOnHidden
        className="support-roles-modal"
      >
        <ParticipantsPanel {...join.panelProps} embedded language={language} />
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new errors in `src/components/IssueJoinButton.js`.

- [ ] **Step 3: Commit**

```bash
git add src/components/IssueJoinButton.js
git commit -m "feat(join): IssueJoinButton opens an inline, status-gated role modal"
```

---

## Task 4: Wire the issue detail page

**Files:**
- Modify: `src/app/issues/[id]/page.js`

**Interfaces:**
- Consumes: `issueActionMode` (now returns `contributed`), `IssueJoinButton` (Task 3), `support.resolvedEventId` + `support.resolvedEventStatus` (existing on `useRoleSupport`).
- Produces: the topline renders Support (OPEN), inline Join (EVENT_DRAFT), or the Contributed chip (COMPLETED), passing the resolved event id + status.

- [ ] **Step 1: Pass event status into the topline CTA**

In `src/app/issues/[id]/page.js`, find the topline block that renders `IssueJoinButton` (the `actionMode === "join"` branch). Replace that branch so both the `join` and the new `contributed` modes render `IssueJoinButton`, and pass `eventStatus`:

```jsx
                  ) : actionMode === "join" || actionMode === "contributed" ? (
                    <IssueJoinButton
                      issue={issue}
                      eventId={support.resolvedEventId}
                      eventStatus={support.resolvedEventStatus}
                      language={language}
                      size="large"
                    />
                  ) : null}
```

(The existing `actionMode === "support"` branch rendering `IssueVoteButton` stays unchanged above it.)

- [ ] **Step 2: Verify EVENT_DRAFT inline join (the original bug)**

With the dev server running against the devtunnel (`NEXT_PUBLIC_API_BASE_URL=…devtunnels…/api/v1 npm run dev`), drive with Playwright:

- Navigate `http://localhost:7777/issues/qa-seek-two-01c75166` (issue.status `EVENT_DRAFT`, event `DRAFT`).
- Assert the topline shows a **Join** (NP: जोडिने) button.
- Click it. Assert a **modal opens in place** and the URL is still `/issues/qa-seek-two-01c75166` (NO navigation to `/events/...` — this is the bug being fixed).
- Assert the modal shows the **full role menu** (Cleaner + specialists) with Join actions.

Expected: all true. Screenshot the open modal as evidence.

- [ ] **Step 3: Verify COMPLETED chip**

- Find a COMPLETED issue slug: run
  ```bash
  curl -s "https://djrh0dg2-3021.usw2.devtunnels.ms/api/v1/issues?status=COMPLETED&limit=3" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log((JSON.parse(s).data?.items||[]).map(i=>i.slug)))'
  ```
- Navigate to `http://localhost:7777/issues/<that-slug>`.
- Assert the topline shows a disabled **"Contributed as {role}"** (or plain "योगदान गरियो" if the viewer held no role) chip, and NO Join button.

Expected: as described.

- [ ] **Step 4: Commit**

```bash
git add src/app/issues/[id]/page.js
git commit -m "feat(join): issue topline routes Support/Join/Contributed by phase"
```

---

## Task 5: Confirm the backend join contract + event-page regression

**Files:**
- None (verification + a throwaway probe).

**Interfaces:**
- Consumes: live `POST /events/{id}/participants { role }` on the devtunnel.

- [ ] **Step 1: Probe role acceptance across phases**

Confirm the backend accepts the roles the gated UI will send (specialist on DRAFT, WORKER on SCHEDULED — even when the event has no rolePlan). Use the QA harness helpers. Create `C:\Users\E0E1~1\AppData\Local\Temp\claude\...\scratchpad\probe-join-contract.mjs` (scratchpad, not the repo) — log in as a QA user, find a DRAFT and a SCHEDULED event, attempt joins, print status:

```js
const BASE = "https://djrh0dg2-3021.usw2.devtunnels.ms/api/v1";
const login = async (email, password) => {
  const r = await fetch(`${BASE}/auth/login`, { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ email, password }) });
  const j = await r.json(); return j.accessToken || j.data?.accessToken;
};
const token = await login("pranis.hpoudel01@gmail.com", "QaTest@123"); // qa_user_02
const items = (b) => b?.data?.items ?? b?.items ?? [];
const get = async (p) => (await fetch(`${BASE}${p}`)).json();
const join = async (id, role) => {
  const r = await fetch(`${BASE}/events/${id}/participants`, { method:"POST",
    headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
    body: JSON.stringify({ role }) });
  return { status: r.status, body: await r.json().catch(()=>null) };
};
const evs = items(await get(`/events?limit=100`));
const draft = evs.find((e)=>e.status==="DRAFT");
const sched = evs.find((e)=>e.status==="SCHEDULED");
console.log("DRAFT join PHOTOGRAPHER:", JSON.stringify(await join(draft.id, "PHOTOGRAPHER")).slice(0,180));
console.log("SCHEDULED join WORKER:", JSON.stringify(await join(sched.id, "WORKER")).slice(0,180));
```

Run it. Expected: both return 2xx (joined/waitlisted).
- If either returns 4xx because the role isn't in the event's `rolePlan`, STOP and flag a backend handoff to Pranish (seed a default `rolePlan` on promotion, or accept scoped roles regardless). The frontend gating in Tasks 1–4 is unaffected, but joining can't succeed until the contract allows it — record the exact error in the plan and surface it to the user.

- [ ] **Step 2: Event-page regression (no behaviour lost)**

With the dev server on the devtunnel, drive with Playwright and confirm the event detail page is unchanged for the happy paths:
- `/events/tree-planting-at-surya-binayak-empty-land` (SCHEDULED) → Cleaner Join present; can open and (as qa_user_02) join as Cleaner; toast "तपाईं जोडिनुभयो।".
- `/events/<a DRAFT event slug>` → full role menu joinable.

Expected: joins succeed and the roster reflects the new participant after reload.

- [ ] **Step 3: Final lint + commit (if the probe surfaced a doc note)**

Run: `npm run lint`
If Step 1 surfaced a backend gap, append a short "Backend follow-up" note to the spec and commit:

```bash
git add docs/superpowers/specs/2026-06-24-status-gated-inline-join-design.md
git commit -m "docs(join): record backend join-contract finding from live probe"
```

---

## Self-review notes

- **Spec coverage:** inline modal (Tasks 3–4) ✓; gate by event.status (Tasks 1–2) ✓; DRAFT full menu without rolePlan (Task 2 Step 3) ✓; SCHEDULED/ACTIVE WORKER-only (Task 1 + Task 2) ✓; COMPLETED "Contributed as {role}" (Tasks 3–4) ✓; `issueActionMode` EVENT_DRAFT fix (Task 1) ✓; event-page consistency (Task 2 + Task 5) ✓; backend verification (Task 5) ✓.
- **Type consistency:** `eventJoinPhase` returns `{label, roleScope, joinable}` used identically in `useEventJoin` (`phase.roleScope`, `phase.joinable`) and `IssueJoinButton` (`phase.label`). `PARTICIPANT_ROLE_ORDER` defined once in `issueActions.js`, imported by `useEventJoin`. `IssueJoinButton` props `{issue, eventId, eventStatus, language, size}` match the issue page's render call in Task 4.
- **CANCELLED:** not one of the five focus phases; handled as a disabled chip so it never dead-ends.
