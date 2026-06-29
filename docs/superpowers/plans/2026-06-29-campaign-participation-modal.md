# Campaign Participation Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three divergent join/support modal shells with one centred, status-aware `CampaignParticipationModal` that carries the campaign's identity (cover + title + status + when/where).

**Architecture:** A pure `buildCampaignHeader()` helper normalizes any issue/event into one header shape. Both participation hooks expose it. One rebuilt modal component renders a pinned header (cover strip + title + status chip + status-aware context line) above the existing `ParticipantsPanel`, with Ant Design's `centered` + a scrollable body fixing the positioning drift. The three button shells (`IssueVoteButton`, `EventJoinButton`, `IssueJoinButton`) all render this one modal.

**Tech Stack:** Next.js (App Router) · React · Ant Design v5 (`Modal`) · plain CSS (`src/styles/event-roster.css`). No test runner in this repo — verification is `npm run lint` + real-browser checks (Playwright/Chrome MCP), per the project's "verify in browser before done" rule.

## Global Constraints

- **No backend/API changes.** `ParticipantsPanel`, `useIssueVote`, `eventJoinPhase()` gating, and all join/leave/vote calls stay exactly as they are.
- **Copy:** NP strings in Devanagari; brand always `श्रमदान`. Status words come **only** from `campaignStatusLabel()` — invent no new status vocabulary. Reuse existing `support-modal-*` copy verbatim.
- **Status vocabulary:** lower-cased technical keys (`open|draft|scheduled|active|completed|paused`) via `campaignVisualStatus()`; colours via the existing `--state-<status>` / `--state-<status>-ink` tokens.
- **Representative image always (staging rule):** the cover strip must never be an empty box — render a gradient + icon fallback when no cover resolves.
- **CSS class token `support-roles-modal` is retained** on the unified modal (alongside a new `campaign-participation-modal` class) so the existing `.support-modal-*` styles keep applying through the migration.
- **Commits:** conventional prefix, only the task's files (never `git add -A`), local only (no push). Current branch: `stage`. End every commit message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Modal does NOT open at COMPLETED/CANCELLED** (the buttons render a read-only chip or hide), so the header intentionally handles OPEN/DRAFT/SCHEDULED/ACTIVE (+ PAUSED for an already-joined member) only — YAGNI on a COMPLETED recap context that no surface can reach.

---

### Task 1: `buildCampaignHeader` helper

**Files:**
- Create: `src/lib/campaignHeader.js`

**Interfaces:**
- Consumes: `getIssueCoverImageUrl`, `localizeIssue` from `@/lib/adminUtils`; `campaignStatusLabel`, `campaignVisualStatus`, `resolveCampaignStatus` from `@/lib/campaignStatus`.
- Produces: `buildCampaignHeader({ issue?, event?, language? }) => { title, coverUrl, status, statusLabel, location, scheduledAt, durationMinutes }` — consumed by Tasks 2 and 5.

- [ ] **Step 1: Write the helper**

Create `src/lib/campaignHeader.js`:

```js
// buildCampaignHeader — one place that turns whatever campaign object a surface
// holds (an issue, a normalized event, or both) into the compact header the
// CampaignParticipationModal renders: cover + title + status + when/where. Pure
// and presentation-only (no fetches, no React). Every participation surface
// calls it so the header never drifts from one entry point to the next.

import { getIssueCoverImageUrl, localizeIssue } from "@/lib/adminUtils";
import {
  campaignStatusLabel,
  campaignVisualStatus,
  resolveCampaignStatus
} from "@/lib/campaignStatus";

export function buildCampaignHeader({ issue = null, event = null, language = "np" } = {}) {
  const localizedIssue = issue ? localizeIssue(issue, language) : null;
  const localizedEventIssue = event?.issue ? localizeIssue(event.issue, language) : null;
  const statusKey = resolveCampaignStatus(issue?.status, event?.status);

  const title =
    localizedIssue?.title ||
    event?.title || // a normalized event seed (eventsApi.normalizeEvent) carries title
    localizedEventIssue?.title ||
    "";

  const coverUrl =
    getIssueCoverImageUrl(issue) ||
    event?.thumbnailUrl || // normalized event seed carries the resolved cover
    getIssueCoverImageUrl(event?.issue) ||
    getIssueCoverImageUrl(event) ||
    null;

  const location =
    issue?.addressText ||
    event?.addressText ||
    event?.meetupAddress ||
    event?.issue?.addressText ||
    null;

  return {
    title,
    coverUrl,
    status: campaignVisualStatus(statusKey),
    statusLabel: campaignStatusLabel(statusKey, language),
    location,
    scheduledAt: event?.scheduledAt || null,
    durationMinutes: Number(event?.durationMinutes) || null
  };
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors for `src/lib/campaignHeader.js`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/campaignHeader.js
git commit -m "feat(campaign): add buildCampaignHeader helper

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Expose `campaignHeader` (and `eventData`) from the participation hooks

**Files:**
- Modify: `src/lib/useRoleSupport.js` (import + compute + return)
- Modify: `src/lib/useEventJoin.js` (import + compute + return)

**Interfaces:**
- Consumes: `buildCampaignHeader` from `@/lib/campaignHeader` (Task 1).
- Produces:
  - `useRoleSupport(...)` return gains `campaignHeader` (header object).
  - `useEventJoin(...)` return gains `campaignHeader` and `eventData` (the raw/merged event snapshot, consumed by Task 5).

- [ ] **Step 1: useRoleSupport — import the helper**

In `src/lib/useRoleSupport.js`, add to the import block near the top (after the existing `@/lib/eventsApi` import on line 19):

```js
import { buildCampaignHeader } from "@/lib/campaignHeader";
```

- [ ] **Step 2: useRoleSupport — compute the header**

In `src/lib/useRoleSupport.js`, immediately **before** the `const panelProps = {` line (~271), add:

```js
  const campaignHeader = buildCampaignHeader({ issue, event: linkedEvent, language });
```

- [ ] **Step 3: useRoleSupport — return it**

In `src/lib/useRoleSupport.js`, in the returned object, add `campaignHeader` next to `panelProps` (after the `panelProps,` line ~317):

```js
    panelProps,
    campaignHeader,
```

- [ ] **Step 4: useEventJoin — import the helper**

In `src/lib/useEventJoin.js`, add after the `@/lib/devMockData` import (line 27):

```js
import { buildCampaignHeader } from "@/lib/campaignHeader";
```

- [ ] **Step 5: useEventJoin — compute the header**

In `src/lib/useEventJoin.js`, immediately **before** the `const panelProps = {` line (~392), add:

```js
  // Seed (normalized event: title + thumbnailUrl + addressText) merged under the
  // loaded snapshot (raw event: scheduledAt + duration + meetup + embedded issue)
  // so the header is complete the moment the modal opens and only sharpens on load.
  const campaignHeader = buildCampaignHeader({
    issue: eventData?.issue || null,
    event: { ...(seed || {}), ...(eventData || {}) },
    language
  });
```

- [ ] **Step 6: useEventJoin — return header + raw eventData**

In `src/lib/useEventJoin.js`, in the returned object add `campaignHeader` and `eventData` (after the `panelProps,` line ~410):

```js
    panelProps,
    campaignHeader,
    eventData,
```

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: no errors for the two hook files.

- [ ] **Step 8: Commit**

```bash
git add src/lib/useRoleSupport.js src/lib/useEventJoin.js
git commit -m "feat(campaign): hooks expose campaignHeader for the participation modal

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Build `CampaignParticipationModal` + CSS + wire the OPEN (support) path

**Files:**
- Create: `src/components/CampaignParticipationModal.js`
- Delete: `src/components/SupportRolesModal.js`
- Modify: `src/styles/event-roster.css` (rename comment + add header styles)
- Modify: `src/components/IssueVoteButton.js` (import + render)
- Modify: `src/components/IssuePreviewPane.js` (pass full `seed` for instant header)

**Interfaces:**
- Consumes: `campaignHeader` + `panelProps` from `useRoleSupport` (Task 2).
- Produces: `CampaignParticipationModal({ open, onClose, language, campaign, onInterested, panelProps })` — consumed by Tasks 4 and 5.

- [ ] **Step 1: Create the unified modal component**

Create `src/components/CampaignParticipationModal.js`:

```jsx
"use client";

// CampaignParticipationModal — the ONE modal for joining/supporting a campaign
// at every lifecycle stage and from every entry point (issue support, event
// join, promoted-issue join). It frames the shared ParticipantsPanel with the
// campaign's identity (cover + title + status + when/where) so a user who steps
// away and returns always knows what they're committing to, and is vertically
// centred with a scrollable role list so it never drifts by content height. The
// "I'm interested" shortcut shows only when onInterested is provided (OPEN
// issues). Purely presentational — all data + handlers come from the caller.

import { useState } from "react";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Modal } from "antd";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";

const NP_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
function localizeDigits(value, language) {
  const s = String(value ?? "");
  return language === "np" ? s.replace(/\d/g, (d) => NP_DIGITS[Number(d)]) : s;
}

function formatScheduledAt(value, language) {
  if (!value) return "";
  try {
    const locale = language === "np" ? "ne-NP" : "en-US";
    return new Date(value).toLocaleString(locale, {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return String(value);
  }
}

const COPY = {
  np: {
    interested: "मलाई रुचि छ",
    interestedHint: "अहिले भूमिका नछानी, समर्थन मात्र दर्ता गर्नुहोस्",
    interestedSaving: "दर्ता हुँदै…",
    orJoin: "वा कुनै भूमिकामा जोडिनुहोस्",
    fallbackTitle: "अभियान",
    durationMin: "{n} मिनेट",
    planningHint: "तालिका तय हुँदै"
  },
  en: {
    interested: "I'm interested",
    interestedHint: "Just register your support, no role yet",
    interestedSaving: "Registering…",
    orJoin: "Or join in a role",
    fallbackTitle: "Campaign",
    durationMin: "{n} min",
    planningHint: "Schedule being set"
  }
};

// Pinned header: small cover strip + title + status chip + a status-aware
// context line. Rendered as the Modal's `title` node so it stays fixed while the
// roster body scrolls. Conversion/fill progress is NOT shown here — the panel
// already shows it next to its "Participants" heading.
function CampaignModalHeader({ campaign, language, t }) {
  if (!campaign) return null;
  const { title, coverUrl, status, statusLabel, location, scheduledAt, durationMinutes } = campaign;

  let context = null;
  if (scheduledAt) {
    context = (
      <>
        <span>
          <CalendarOutlined aria-hidden="true" /> {formatScheduledAt(scheduledAt, language)}
        </span>
        {durationMinutes ? (
          <span>
            <ClockCircleOutlined aria-hidden="true" />{" "}
            {t.durationMin.replace("{n}", localizeDigits(durationMinutes, language))}
          </span>
        ) : null}
        {location ? (
          <span>
            <EnvironmentOutlined aria-hidden="true" /> {location}
          </span>
        ) : null}
      </>
    );
  } else if (status === "draft") {
    context = (
      <>
        <span>{t.planningHint}</span>
        {location ? (
          <span>
            <EnvironmentOutlined aria-hidden="true" /> {location}
          </span>
        ) : null}
      </>
    );
  } else if (location) {
    context = (
      <span>
        <EnvironmentOutlined aria-hidden="true" /> {location}
      </span>
    );
  }

  return (
    <div className="campaign-modal-header">
      <div
        className={`campaign-modal-cover${coverUrl ? "" : " campaign-modal-cover--fallback"}`}
        style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
        aria-hidden="true"
      >
        {coverUrl ? null : <TeamOutlined />}
      </div>
      <div className="campaign-modal-headmeta">
        <span className="campaign-modal-title">{title || t.fallbackTitle}</span>
        {statusLabel ? (
          <span className="campaign-modal-statusline">
            <span className="campaign-modal-status-chip" data-status={status}>
              {statusLabel}
            </span>
          </span>
        ) : null}
        {context ? <span className="campaign-modal-context">{context}</span> : null}
      </div>
    </div>
  );
}

export function CampaignParticipationModal({
  open,
  onClose,
  language = "np",
  campaign = null,
  onInterested,
  panelProps
}) {
  const t = COPY[language] || COPY.np;
  const [interestedPending, setInterestedPending] = useState(false);

  // A successful join/lead dismisses the modal; a thrown error keeps it open
  // (the page handler re-throws only on real failures).
  const closeAfter = (fn) =>
    fn
      ? async (...args) => {
          await fn(...args);
          onClose?.();
        }
      : fn;

  const wrappedPanelProps = {
    ...panelProps,
    onJoin: closeAfter(panelProps?.onJoin),
    onLead: closeAfter(panelProps?.onLead)
  };

  const handleInterested = async () => {
    if (interestedPending || !onInterested) return;
    setInterestedPending(true);
    try {
      await onInterested();
      onClose?.();
    } catch {
      /* page surfaces its own error toast; the modal stays open */
    } finally {
      setInterestedPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      title={<CampaignModalHeader campaign={campaign} language={language} t={t} />}
      destroyOnHidden
      className="support-roles-modal campaign-participation-modal"
      styles={{ body: { maxHeight: "62vh", overflowY: "auto" } }}
    >
      {onInterested ? (
        <>
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
          <div className="support-modal-divider">
            <span>{t.orJoin}</span>
          </div>
        </>
      ) : null}

      <ParticipantsPanel {...wrappedPanelProps} embedded language={language} />
    </Modal>
  );
}
```

- [ ] **Step 2: Delete the old modal file**

```bash
git rm src/components/SupportRolesModal.js
```

- [ ] **Step 3: Add header styles to CSS**

In `src/styles/event-roster.css`, change the block comment on line 1047 from `/* --- SupportRolesModal ...` to `/* --- CampaignParticipationModal ...`, and **append** the following immediately after the `.support-modal-intro { ... }` rule (the `.support-modal-intro` selector is now unused but harmless to keep):

```css
/* Campaign Participation Modal header — pinned cover + title + status + context.
 * Lives in the Modal `title` slot so the roster body scrolls beneath it. */
.campaign-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 28px; /* clear AntD's absolute close (×) button */
}

.campaign-modal-cover {
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.campaign-modal-cover--fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  background: linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 55%, #000));
}

.campaign-modal-headmeta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.campaign-modal-title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.campaign-modal-statusline {
  display: inline-flex;
}

.campaign-modal-status-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 14%, var(--surface));
}
.campaign-modal-status-chip[data-status="open"]      { color: var(--state-open-ink);      background: color-mix(in srgb, var(--state-open) 16%, var(--surface)); }
.campaign-modal-status-chip[data-status="draft"]     { color: var(--state-draft-ink);     background: color-mix(in srgb, var(--state-draft) 16%, var(--surface)); }
.campaign-modal-status-chip[data-status="scheduled"] { color: var(--state-scheduled-ink); background: color-mix(in srgb, var(--state-scheduled) 16%, var(--surface)); }
.campaign-modal-status-chip[data-status="active"]    { color: var(--state-active-ink);    background: color-mix(in srgb, var(--state-active) 16%, var(--surface)); }
.campaign-modal-status-chip[data-status="completed"] { color: var(--state-completed-ink); background: color-mix(in srgb, var(--state-completed) 16%, var(--surface)); }

.campaign-modal-context {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 12.5px;
  font-weight: 400;
  color: var(--muted);
}
.campaign-modal-context span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
```

- [ ] **Step 4: Wire IssueVoteButton to the unified modal**

In `src/components/IssueVoteButton.js`:

Change the import on line 6 from:

```js
import { SupportRolesModal } from "@/components/SupportRolesModal";
```
to:
```js
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
```

Then replace the render block (lines ~336–342):

```jsx
      <SupportRolesModal
        open={support.open}
        onClose={support.closeModal}
        language={language}
        onInterested={support.onInterested}
        panelProps={support.panelProps}
      />
```
with:
```jsx
      <CampaignParticipationModal
        open={support.open}
        onClose={support.closeModal}
        language={language}
        campaign={support.campaignHeader}
        onInterested={support.onInterested}
        panelProps={support.panelProps}
      />
```

- [ ] **Step 5: Feed IssuePreviewPane's support button a full seed (instant header)**

In `src/components/IssuePreviewPane.js`, in the `IssueVoteButton` element (around line 330), add a `seed={issue}` prop so the OPEN header paints immediately instead of after the modal's own fetch:

```jsx
              <IssueVoteButton
                key={issue.id}
                content={content}
                seed={issue}
                initialVoteCount={issue.voteCount}
                initialVoted={issue.isVoted}
                issueId={issue.id}
                language={language}
                showCount={false}
                size="large"
                type="primary"
                onVoteChange={(payload) => {
```
(Leave the rest of the element unchanged.)

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: no errors. (No remaining import of `SupportRolesModal`.)

- [ ] **Step 7: Verify in browser (OPEN)**

Start dev if needed: `npm run dev` (port 7777). Log in with a member test account, go to `/campaigns?status=open`, open an item's preview, click **Support**. Confirm: modal is **vertically centred**; header shows the small cover + title + an `OPEN` chip + location; the "I'm interested" block + role list render; the role list scrolls within the modal if tall.

- [ ] **Step 8: Commit**

```bash
git add src/components/CampaignParticipationModal.js src/components/SupportRolesModal.js src/styles/event-roster.css src/components/IssueVoteButton.js src/components/IssuePreviewPane.js
git commit -m "feat(campaign): unified CampaignParticipationModal + wire OPEN support path

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Wire the event Join path (`EventJoinButton`)

**Files:**
- Modify: `src/components/EventJoinButton.js`

**Interfaces:**
- Consumes: `campaignHeader` + `panelProps` from `useEventJoin` (Task 2); `CampaignParticipationModal` (Task 3).

- [ ] **Step 1: Swap imports**

In `src/components/EventJoinButton.js`, replace lines 8–9:

```js
import { Modal } from "antd";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
```
with:
```js
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
```

- [ ] **Step 2: Drop the now-unused modal title copy**

In `src/components/EventJoinButton.js`, remove the `modalTitle` entries from `BUTTON_COPY` (the `modalTitle: "अभियानमा सामेल हुने"` and `modalTitle: "Join this campaign"` lines) — the unified modal owns its header now.

- [ ] **Step 3: Replace the inline modal**

In `src/components/EventJoinButton.js`, replace the whole `<Modal>...</Modal>` block (lines ~102–118, including the leading comment) with:

```jsx
      <CampaignParticipationModal
        open={join.open}
        onClose={join.closeModal}
        language={lang}
        campaign={join.campaignHeader}
        panelProps={join.panelProps}
      />
```

(No `onInterested` — events have no INTERESTED concept, so the interested block stays hidden.)

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors; no unused `Modal` / `ParticipantsPanel` / `bc.modalTitle` references.

- [ ] **Step 5: Verify in browser (DRAFT + SCHEDULED)**

On `/campaigns?status=draft` open an item → **Join**: header shows the cover + title + `PLANNING` chip + "schedule being set" + location; all roles + coordinator (read-only) render, centred. Repeat on `?status=scheduled`: chip reads `SCHEDULED`, context shows 📅 date · ⏱ duration · 📍 location, and only the Cleaner role offers Join.

- [ ] **Step 6: Commit**

```bash
git add src/components/EventJoinButton.js
git commit -m "refactor(campaign): EventJoinButton uses CampaignParticipationModal

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Wire the promoted-issue Join path (`IssueJoinButton`)

**Files:**
- Modify: `src/components/IssueJoinButton.js`

**Interfaces:**
- Consumes: `buildCampaignHeader` (Task 1); `join.eventData` from `useEventJoin` (Task 2); `CampaignParticipationModal` (Task 3). `IssueJoinButton` holds the full `issue` prop, so it builds the header locally (the hook gets no seed here) for an instant cover + title.

- [ ] **Step 1: Swap imports**

In `src/components/IssueJoinButton.js`, replace lines 15–16:

```js
import { Button, Modal } from "antd";
import { ParticipantsPanel } from "@/components/ParticipantsPanel";
```
with:
```js
import { Button } from "antd";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { buildCampaignHeader } from "@/lib/campaignHeader";
```

- [ ] **Step 2: Build the header from the issue prop + loaded event**

In `src/components/IssueJoinButton.js`, inside the join-phases return (just before the `return (` near line 119), add:

```jsx
  // IssueJoinButton holds the full issue (instant cover + title); the hook's
  // eventData sharpens status + schedule once the modal loads.
  const campaign = buildCampaignHeader({
    issue,
    event: join.eventData || (eventStatus ? { status: eventStatus } : null),
    language
  });
```

- [ ] **Step 3: Replace the inline modal**

In `src/components/IssueJoinButton.js`, replace the `<Modal>...</Modal>` block (lines ~138–148) with:

```jsx
      <CampaignParticipationModal
        open={join.open}
        onClose={join.closeModal}
        language={language}
        campaign={campaign}
        panelProps={join.panelProps}
      />
```

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors; no unused `Modal` / `ParticipantsPanel` references. (`Button` is still used by the no-event / cancelled / contributed branches.)

- [ ] **Step 5: Verify in browser (promoted issue)**

From `/campaigns` open a promoted issue in **join** mode (an item whose preview shows a Join button via `IssuePreviewPane`/`PublicIssueCard`) → the unified modal opens, centred, with the issue's cover + title + correct status chip + context, and the role controls matching the event's stage.

- [ ] **Step 6: Commit**

```bash
git add src/components/IssueJoinButton.js
git commit -m "refactor(campaign): IssueJoinButton uses CampaignParticipationModal

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Full cross-status browser verification + cleanup

**Files:**
- (Verification only; modify any file only if a defect is found.)

- [ ] **Step 1: Confirm no dangling references**

Run (Grep, not committed): search the repo for `SupportRolesModal`. Expected: only the spec/plan docs mention it — **no** `src/` references remain.

- [ ] **Step 2: Lint the whole project**

Run: `npm run lint`
Expected: clean (no new warnings/errors from the changed files).

- [ ] **Step 3: Drive every reachable status in a real browser**

With the dev server on `:7777` and a logged-in member, open the participation modal from `/campaigns` for each status and assert with a screenshot each time:

| Status | Entry | Assert |
|---|---|---|
| OPEN | Support | centred · cover+title+`OPEN` chip+location · "I'm interested" + all roles + "Be the coordinator" |
| DRAFT | Join | centred · `PLANNING` chip · "schedule being set"+location · all roles + read-only coordinator |
| SCHEDULED | Join | centred · `SCHEDULED` chip · 📅 date · ⏱ duration · 📍 location · Cleaner-only Join |
| ACTIVE | Join | centred · `ONGOING` chip · date/location context · Cleaner-only Join (red CTA) |

Confirm the **vertical centring is identical** across all four (the original bug) and the cover never renders as an empty box (fallback gradient + icon when no cover).

- [ ] **Step 4: Final commit (only if cleanup was needed)**

```bash
git add -- <only the files you changed>
git commit -m "fix(campaign): polish participation modal after cross-status verification

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- 3→1 unification → Tasks 3 (create + OPEN), 4 (event), 5 (promoted issue). ✓
- Centred + scrollable body → Task 3 (`centered` + `styles.body`). ✓
- Header: cover + title + status + status-aware context → Tasks 1 (data) + 3 (render). ✓
- Participants primary / interested conditional → Task 3 (interested block gated on `onInterested`). ✓
- Data via existing helpers, no new fetch → Task 1 (`getIssueCoverImageUrl`, `localizeIssue`, `campaignStatus*`). ✓
- Lifecycle gating unchanged → no task touches `eventJoinPhase`/`ParticipantsPanel` logic. ✓
- Coordinator-on-OPEN kept → `useRoleSupport` leaderSlot logic untouched. ✓
- Representative cover fallback → Task 3 (`.campaign-modal-cover--fallback`). ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `buildCampaignHeader` returns `{ title, coverUrl, status, statusLabel, location, scheduledAt, durationMinutes }` (Task 1) — consumed identically by `CampaignModalHeader` (Task 3) and built the same way in Task 5. Hook return key is `campaignHeader` everywhere; modal prop is `campaign`. ✓

**Deliberate scope note:** COMPLETED/CANCELLED have no modal entry point (buttons render a chip or hide), so the header handles OPEN/DRAFT/SCHEDULED/ACTIVE(+PAUSED) only — no dead COMPLETED-recap branch.
