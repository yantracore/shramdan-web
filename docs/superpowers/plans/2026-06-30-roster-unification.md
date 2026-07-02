# Roster Unification + Row Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the participant roster render identically in the modal and the detail body (same data + same content), move "I'm interested" into the shared panel, and make role rows whole-row clickable with the core pair highlighted.

**Architecture:** All roster UI lives in the one `ParticipantsPanel`. The detail body must feed it the SAME `panelProps` the modal uses — the event roster (`useEventJoin`) when promoted, the issue roster (`useRoleSupport`) when OPEN — and share one hook instance with the topline button. The interested block, row-click, and core highlight all live in `ParticipantsPanel`.

**Tech Stack:** Next.js · React · Ant Design icons · plain CSS (`event-roster.css`). No test runner — verify with `npm run lint` + real-browser checks (chrome-devtools MCP). Spec: `docs/superpowers/specs/2026-06-30-roster-row-interaction-design.md`.

## Global Constraints

- **No API/logic changes** — `useRoleSupport`, `useEventJoin`, join/leave/vote untouched.
- **One component** — every change is in `ParticipantsPanel` (+ its callers feeding it), so modal + body stay identical.
- **Copy:** NP Devanagari; reuse existing strings.
- **Commits:** conventional prefix, only the task's files (never `git add -A`), local only (no push). Branch `stage`. End every commit message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Move "I'm interested" into ParticipantsPanel; intro always shown

**Files:**
- Modify: `src/components/ParticipantsPanel.js`
- Modify: `src/components/CampaignParticipationModal.js`

**Interfaces:**
- Produces: `ParticipantsPanel` gains props `onInterested`, `interestedActive`, `onWithdraw`; renders the interested block + divider when `onInterested` is set. Consumed by the modal (Task 1) and `CampaignDetailView` (Task 3).

- [ ] **Step 1: ParticipantsPanel — import HeartOutlined**

In `src/components/ParticipantsPanel.js`, add `HeartOutlined` to the `@ant-design/icons` import list (alphabetical, near `CrownOutlined`). (`CheckCircleFilled` is already imported.)

- [ ] **Step 2: ParticipantsPanel — add interested copy**

In the `COPY.np` object add these keys (anywhere among the existing np keys):

```js
    interested: "मलाई रुचि छ",
    interestedHint: "अहिले भूमिका नछानी, समर्थन मात्र दर्ता गर्नुहोस्",
    interestedSaving: "दर्ता हुँदै…",
    interestedActiveLabel: "समर्थन गरियो",
    interestedWithdrawHint: "हटाउन क्लिक गर्नुहोस्",
    interestedWithdrawing: "हट्दै…",
    orJoinInRole: "वा कुनै भूमिकामा जोडिनुहोस्",
```
and in `COPY.en`:
```js
    interested: "I'm interested",
    interestedHint: "Just register your support, no role yet",
    interestedSaving: "Registering…",
    interestedActiveLabel: "Supported",
    interestedWithdrawHint: "Click to withdraw",
    interestedWithdrawing: "Withdrawing…",
    orJoinInRole: "Or join in a role",
```
(Distinct key names — `interestedActiveLabel`, `orJoinInRole` — avoid clashing with the role-`COPY` keys already present.)

- [ ] **Step 3: ParticipantsPanel — add props + state + handlers**

In the `ParticipantsPanel({ ... })` destructure, add after `language = "np"` (before the closing `}`):

```js
  onInterested,
  interestedActive = false,
  onWithdraw,
```

After the existing `const [leadLeaving, setLeadLeaving] = useState(false);` add:

```js
  const [interestedPending, setInterestedPending] = useState(false);
  const [withdrawPending, setWithdrawPending] = useState(false);
```

After `handleLeaveLead` (before `const viewerStatusPill =`) add:

```js
  const handleInterested = async () => {
    if (interestedPending || !onInterested) return;
    setInterestedPending(true);
    try {
      await onInterested();
    } catch {
      /* caller surfaces its own error toast */
    } finally {
      setInterestedPending(false);
    }
  };

  const handleWithdraw = async () => {
    if (withdrawPending || !onWithdraw) return;
    setWithdrawPending(true);
    try {
      await onWithdraw();
    } catch {
      /* caller surfaces its own error toast */
    } finally {
      setWithdrawPending(false);
    }
  };
```

- [ ] **Step 4: ParticipantsPanel — always show intro + render interested block**

In the `return`, replace the header's intro line and add the interested block between `</header>` and `<div className="participants-groups">`. Change:

```jsx
        {embedded ? null : <p>{t.intro}</p>}
      </header>

      <div className="participants-groups">
```
to:
```jsx
        <p className="participants-intro">{t.intro}</p>
      </header>

      {onInterested ? (
        <div className="participants-interested">
          {interestedActive ? (
            <button
              type="button"
              className="support-modal-interested is-active"
              onClick={handleWithdraw}
              disabled={withdrawPending}
              aria-label={`${t.interestedActiveLabel} — ${t.interestedWithdrawHint}`}
            >
              <span className="support-modal-interested-icon">
                <CheckCircleFilled aria-hidden="true" />
              </span>
              <span className="support-modal-interested-text">
                <strong>{withdrawPending ? t.interestedWithdrawing : t.interestedActiveLabel}</strong>
                <span>{t.interestedWithdrawHint}</span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="support-modal-interested"
              onClick={handleInterested}
              disabled={interestedPending}
            >
              <span className="support-modal-interested-icon">
                <HeartOutlined aria-hidden="true" />
              </span>
              <span className="support-modal-interested-text">
                <strong>{interestedPending ? t.interestedSaving : t.interested}</strong>
                <span>{t.interestedHint}</span>
              </span>
            </button>
          )}
          <div className="support-modal-divider">
            <span>{t.orJoinInRole}</span>
          </div>
        </div>
      ) : null}

      <div className="participants-groups">
```

- [ ] **Step 5: CampaignParticipationModal — delegate the interested block to the panel**

In `src/components/CampaignParticipationModal.js`:

Remove the now-unused icon imports `CheckCircleFilled` and `HeartOutlined` from the `@ant-design/icons` import (keep `CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, TeamOutlined`).

Remove the interested COPY keys from both `np` and `en` (`interested`, `interestedHint`, `interestedSaving`, `interestedActive`, `interestedWithdrawHint`, `interestedWithdrawing`, `orJoin`). Keep `fallbackTitle`, `durationMin`, `planningHint`.

Remove the `interestedPending` / `withdrawPending` state and the `handleInterested` / `handleWithdraw` functions.

Replace the body (the `{onInterested ? ( ... ) : null}` interested block AND the `<ParticipantsPanel ... />` that follows) with just:

```jsx
      <ParticipantsPanel
        {...wrappedPanelProps}
        embedded
        language={language}
        onInterested={onInterested ? closeAfter(onInterested) : undefined}
        interestedActive={interestedActive}
        onWithdraw={onWithdraw ? closeAfter(onWithdraw) : undefined}
      />
```
(`closeAfter` already exists and wraps a handler to dismiss the modal on success; on error it re-throws and the panel keeps the modal open. `interestedActive` and `onWithdraw` are already modal props.)

- [ ] **Step 6: Add minimal CSS for the panel-hosted interested block**

In `src/styles/event-roster.css`, append:

```css
/* "I'm interested" block now lives inside ParticipantsPanel (shared by modal +
 * body). Spacing when it sits between the panel header and the role groups. */
.participants-interested {
  margin-top: 4px;
}
.participants-intro {
  margin: 0;
}
```

- [ ] **Step 7: Lint**

Run: `npx eslint src/components/ParticipantsPanel.js src/components/CampaignParticipationModal.js`
Expected: no errors (no unused `CheckCircleFilled`/`HeartOutlined` in the modal).

- [ ] **Step 8: Verify in browser (OPEN modal still shows interested)**

Logged in, open the OPEN support modal from `/campaigns?status=open` → the "मलाई रुचि छ" block still renders (now from the panel), above "वा कुनै भूमिकामा जोडिनुहोस्" + roles. Support, then reopen → it shows the "समर्थन गरियो · हटाउन क्लिक गर्नुहोस्" toggle; withdraw works. Clean up.

- [ ] **Step 9: Commit**

```bash
git add src/components/ParticipantsPanel.js src/components/CampaignParticipationModal.js src/styles/event-roster.css
git commit -m "refactor(roster): move 'I'm interested' into shared ParticipantsPanel

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Whole role row clickable + core-role highlight

**Files:**
- Modify: `src/components/ParticipantsPanel.js` (`renderRoleRow`, `renderLeaderRow`)
- Modify: `src/styles/event-roster.css`

- [ ] **Step 1: renderRoleRow — clickable row + pill as span**

In `src/components/ParticipantsPanel.js` `renderRoleRow`, after the `const roleDesc = ...` line add:

```js
    const rowJoinable = canJoinThis && !isFullTargetRow && !isOwnRole;
    const rowClickProps = rowJoinable
      ? {
          role: "button",
          tabIndex: isPending ? -1 : 0,
          "aria-label": `${t.join} — ${roleLabel}`,
          "aria-busy": isPending || undefined,
          onClick: () => handleJoin(role),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleJoin(role);
            }
          }
        }
      : {};
```

Change the `<li>` opening tag to add `--role-color`, the `is-clickable` class, and spread the click props:

```jsx
      <li
        key={role}
        className={`event-roster-row${full ? " event-roster-row--full" : ""}${
          isOwnRole ? " is-own-role" : ""
        }${lockedByOther ? " is-locked" : ""}${rowJoinable ? " is-clickable" : ""}`}
        style={{ "--role-color": roleColor }}
        {...rowClickProps}
      >
```

Change the open-pill from a `<button>` to a decorative `<span>` (the row owns the click now):

```jsx
        ) : canJoinThis && !isFullTargetRow ? (
          <span className="event-roster-open-pill" aria-hidden="true">
            {isPending
              ? t.joining
              : openCount !== null
                ? t.openPill.replace("{n}", localizeDigits(openCount, language))
                : t.join}
          </span>
        ) : isFullTargetRow ? (
```

- [ ] **Step 2: renderLeaderRow — clickable when canLead + CTA as span**

In `renderLeaderRow`, compute joinability and make the `<li>` clickable. Add right after `if (!leaderSlot) return null;`:

```js
    const leaderRowJoinable =
      !leaderSlot.viewerIsLeader && !leaderSlot.name && Boolean(leaderSlot.canLead);
    const leaderClickProps = leaderRowJoinable
      ? {
          role: "button",
          tabIndex: leadPending ? -1 : 0,
          "aria-label": t.wantToLead,
          "aria-busy": leadPending || undefined,
          onClick: handleLead,
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleLead();
            }
          }
        }
      : {};
```

Change the leader `<li>` opening tag to add the class + spread:

```jsx
      <li
        key="__leader"
        className={`event-roster-row event-roster-row--full participants-leader-row${
          leaderSlot.viewerIsLeader ? " is-own-role" : ""
        }${leaderRowJoinable ? " is-clickable" : ""}`}
        style={{ "--role-color": LEAD_COLOR }}
        {...leaderClickProps}
      >
```

Change the "be coordinator" CTA from a `<button>` to a decorative `<span>`:

```jsx
        ) : leaderSlot.canLead ? (
          <span className="event-roster-open-pill participants-lead-cta" aria-hidden="true">
            {leadPending ? t.joining : t.wantToLead}
          </span>
        ) : (
```

- [ ] **Step 3: CSS — clickable affordance + core highlight**

In `src/styles/event-roster.css`, append:

```css
/* Whole joinable role row is the click target (the pill is a decorative cue). */
.event-roster-row.is-clickable {
  cursor: pointer;
  transition: transform 0.14s var(--ease-out-soft, ease),
    box-shadow 0.14s var(--ease-out-soft, ease),
    border-color 0.14s var(--ease-out-soft, ease),
    background 0.14s var(--ease-out-soft, ease);
}
@media (hover: hover) {
  .event-roster-row.is-clickable:hover {
    transform: translateY(-1px);
    border-color: var(--role-color, var(--primary));
    box-shadow: 0 4px 14px color-mix(in srgb, var(--role-color, var(--primary)) 18%, transparent);
  }
  .event-roster-row.is-clickable:hover .event-roster-open-pill {
    background: color-mix(in srgb, var(--role-color, var(--primary)) 16%, transparent);
    border-color: var(--role-color, var(--primary));
  }
}
.event-roster-row.is-clickable:focus-visible {
  outline: 2px solid var(--role-color, var(--primary));
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .event-roster-row.is-clickable {
    transition: none;
  }
  .event-roster-row.is-clickable:hover {
    transform: none;
  }
}

/* Core roles (Cleaner + Coordinator) — role-tinted card so the must-fill pair
 * pops over the quiet "additional" group. Own-role keeps its green wash. */
.participants-group--core .event-roster-row:not(.is-own-role) {
  background: color-mix(in srgb, var(--role-color, var(--primary)) 8%, var(--surface));
  border: 1.5px solid color-mix(in srgb, var(--role-color, var(--primary)) 38%, var(--line));
}
```

- [ ] **Step 4: Lint**

Run: `npx eslint src/components/ParticipantsPanel.js`
Expected: no errors.

- [ ] **Step 5: Verify in browser**

Open a DRAFT/SCHEDULED join modal: hovering a joinable role row lifts it + shows pointer; clicking ANYWHERE on the row joins that role (the Join pill is still visible); core rows (Cleaner green, Coordinator gold) read as tinted cards; additional rows stay quiet. Keyboard: Tab to a row, Enter joins. Withdraw to clean up.

- [ ] **Step 6: Commit**

```bash
git add src/components/ParticipantsPanel.js src/styles/event-roster.css
git commit -m "feat(roster): whole role row clickable + core-role highlight

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Feed the detail body the same roster data as the modal

**Files:**
- Modify: `src/components/IssueJoinButton.js` (controlled `join` prop)
- Modify: `src/components/CampaignDetailView.js` (event roster + interested + shared instance)

**Interfaces:**
- Consumes: `ParticipantsPanel` interested props (Task 1); `useEventJoin` (`panelProps`, `open`, `openModal`, `closeModal`, `viewerRole`, `eventData`, `loading`).
- Produces: `IssueJoinButton` accepts optional `join` (a `useEventJoin` return) and uses it instead of its own.

- [ ] **Step 1: IssueJoinButton — accept a controlled join instance**

In `src/components/IssueJoinButton.js`, add `join: controlledJoin` to the props destructure (after `block = false`):

```js
  block = false,
  // Optional controlled useEventJoin instance — when a page already drives one
  // (so its body roster and this button's modal stay one live-synced source),
  // it's passed in; otherwise the button creates its own.
  join: controlledJoin
}) {
```

Change the hook line from `const join = useEventJoin(...)` to:

```js
  const ownJoin = useEventJoin(eventId, {
    language,
    eager: phase.label === "contributed" && Boolean(eventId)
  });
  const join = controlledJoin ?? ownJoin;
```

- [ ] **Step 2: CampaignDetailView — import useEventJoin**

In `src/components/CampaignDetailView.js`, add after the `useRoleSupport` import:

```js
import { useEventJoin } from "@/lib/useEventJoin";
```

- [ ] **Step 3: CampaignDetailView — drive the event roster**

Right after the `support = useRoleSupport(...)` call (the block ending `});` near line 206), add:

```js
  // The promoted campaign's event roster — the SAME source the join modal uses,
  // so the body roster matches the modal exactly. eventId resolves from the
  // issue's linked event (null while OPEN → the hook stays idle).
  const rosterEventId = support.resolvedEventId || getIssueEventId(rawIssue);
  const eventJoin = useEventJoin(rosterEventId, {
    seed: eventData,
    language,
    eager: Boolean(rosterEventId)
  });
```

- [ ] **Step 4: CampaignDetailView — pick the status-correct roster props**

Immediately after the existing `const isCompleted = campaignStatus === "COMPLETED";` line, add:

```js
  // Promoted → the event roster (eventJoin); OPEN → the issue roster (support).
  const isPromotedRoster = Boolean(rosterEventId) && campaignStatus !== "OPEN";
  const rosterProps = isPromotedRoster ? eventJoin.panelProps : support.panelProps;
```

- [ ] **Step 5: CampaignDetailView — remove the topline conversion duplicate**

The panel heading now shows progress in both surfaces, so drop the topline copy. Replace:

```jsx
                <div className="public-issue-detail-support" id="issue-vote">
                  {support.panelProps.progress ? (
                    <CompactConversionProgress
                      language={language}
                      progress={support.panelProps.progress}
                    />
                  ) : null}
                  {actionMode === "support" ? (
```
with:
```jsx
                <div className="public-issue-detail-support" id="issue-vote">
                  {actionMode === "support" ? (
```

Then remove the now-unused `CompactConversionProgress` from the `@/components/ParticipantsPanel` import (keep `ParticipantsPanel`).

- [ ] **Step 6: CampaignDetailView — share the event instance with the topline button**

In the `IssueJoinButton` element (topline), add `join={eventJoin}`:

```jsx
                    <IssueJoinButton
                      issue={issue}
                      eventId={support.resolvedEventId || getIssueEventId(rawIssue)}
                      eventStatus={eventStatus}
                      language={language}
                      size="large"
                      join={eventJoin}
                    />
```

- [ ] **Step 7: CampaignDetailView — feed the body panel the unified props**

Replace the body `<ParticipantsPanel ... />` (the one with `totalOverride` + `progress={null}`) with:

```jsx
              <ParticipantsPanel
                {...rosterProps}
                language={language}
                onInterested={isPromotedRoster ? undefined : support.onInterested}
                interestedActive={
                  !isPromotedRoster && support.voted && support.voterRole === "INTERESTED"
                }
                onWithdraw={isPromotedRoster ? undefined : support.retract}
              />
```

- [ ] **Step 8: Lint**

Run: `npx eslint src/components/IssueJoinButton.js src/components/CampaignDetailView.js`
Expected: no errors (no unused `CompactConversionProgress`).

- [ ] **Step 9: Verify in browser — body == modal**

1. **Promoted** (`/campaign/southern-shore-of-fewa-lake-polluted-by-plastic`): the BODY roster now shows the **event** roster — Cleaner `2/8` with filled chips + "open" pill, "Coordinated by …", additional roles `1/1` "Full" — identical to the join modal opened from the topline. Joining via the topline modal updates the body (shared instance).
2. **OPEN** (`/campaign/drain-blockage-near-traffic-junction-a-monsoon-hazard`): the BODY now shows the "I'm interested" block + conversion progress in the panel heading, matching the modal; clicking a role row joins; core highlighted. Clean up test joins.

- [ ] **Step 10: Commit**

```bash
git add src/components/IssueJoinButton.js src/components/CampaignDetailView.js
git commit -m "fix(roster): detail body uses the event roster (same as modal)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Part A (body == modal data) → Task 3. ✓
- Part B (interested in panel) → Task 1. ✓
- Part C (intro/progress identical content) → Task 1 (intro always) + Task 3 (panel owns progress, topline dup removed). ✓
- Part D (row clickable) → Task 2. ✓
- Part E (core highlight) → Task 2. ✓

**Placeholder scan:** No TBD/TODO; every step has full code. ✓

**Type consistency:** `ParticipantsPanel` interested props (`onInterested`, `interestedActive`, `onWithdraw`) defined in Task 1, consumed by the modal (Task 1) and `CampaignDetailView` (Task 3) with identical names. `IssueJoinButton` controlled prop is `join` (Task 3 def + use). `rosterProps` / `isPromotedRoster` named consistently. New copy keys (`interestedActiveLabel`, `orJoinInRole`) are distinct from existing keys. ✓

**Deliberate notes:** the body's own `eventData` fetch stays (drives schedule/meetup/recap blocks) alongside `eventJoin` (drives the roster) — a small duplicate `/events` GET, acceptable; converging them is out of scope. `embedded` now controls only outer spacing, not content (intro shows in both).
