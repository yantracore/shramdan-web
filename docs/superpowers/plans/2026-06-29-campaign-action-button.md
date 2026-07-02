# Campaign Action Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three differently-built participation CTAs with one `CampaignActionButton` so the support/join action looks identical on every page and at every lifecycle status, all opening the unified modal.

**Architecture:** A purely-presentational `CampaignActionButton` (native `<button>`) renders four modes — act / committed / readonly / disabled. The three existing trigger wrappers (`IssueVoteButton`, `EventJoinButton`, `IssueJoinButton`) keep their hook wiring but delegate rendering to it and feed `mode/label/accent/roleColor`. Act = solid (teal, red for LIVE) + sheen + lift; committed = tinted role chip that opens the modal; the modal's per-role dashed pills are left untouched.

**Tech Stack:** Next.js · React · Ant Design icons (the button itself is a plain `<button>`, not AntD `Button`) · plain CSS (`src/styles/event-roster.css`). No test runner — verification is `npm run lint` + real-browser checks (chrome-devtools/Playwright MCP). The new CTA is a **native `<button>`, so a11y-tree clicks fire its onClick** (unlike the old AntD `Button`, which needed `.click()` — see [[reference_browser_verify_antd_click]]).

## Global Constraints

- **No backend/API changes.** `useRoleSupport`, `useEventJoin`, `eventJoinPhase()`, and the modal are untouched.
- **Colours from the state-color system** (`docs/design/06-state-color-system.md`): act CTA is teal `var(--primary)`, LIVE-only red `var(--state-live)`. Committed tint uses the role colour. Never a white committed button.
- **Copy:** NP in Devanagari; brand `श्रमदान`. Reuse existing role/label copy; committed labels read as committed (no collision with act labels).
- **One size system:** `sm` (cards / preview panes) · `lg` (detail topline). Wrappers map `size="large"→lg`, `size="small"→sm`, unspecified→`sm`.
- **Every act/committed instance opens the unified modal**; no on-page `Popconfirm`.
- **Commits:** conventional prefix, only the task's files (never `git add -A`), local only (no push). Branch: `stage`. End every commit message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: `CampaignActionButton` component + CSS + shared role colours

**Files:**
- Create: `src/components/CampaignActionButton.js`
- Modify: `src/components/ParticipantsPanel.js` (export the existing `ROLE_COLORS` + `LEAD_COLOR`)
- Modify: `src/styles/event-roster.css` (append the `.campaign-action-btn` block)

**Interfaces:**
- Produces: `CampaignActionButton({ mode, label, accent, roleColor, icon, size, count, loading, block, onClick, ariaLabel, className, language })` — consumed by Tasks 2–4.
- Produces: `export const ROLE_COLORS`, `export const LEAD_COLOR` from `ParticipantsPanel` — consumed by Tasks 2–4 for committed tints.

- [ ] **Step 1: Export role colours from ParticipantsPanel**

In `src/components/ParticipantsPanel.js`, change the two existing declarations (around lines 44–68) to add `export`:

```js
export const LEAD_COLOR = "#b7791f";
```
```js
export const ROLE_COLORS = {
  WORKER: "#2e7d32",
  PHOTOGRAPHER: "#7b3fa0",
  LIVESTREAMER: "#d2360b",
  MEDIC: "#b42318",
  SAFETY_LEAD: "#b7791f",
  COORDINATOR: "#176b5c",
  LOGISTICS: "#1d4ed8"
};
```
(Only the `export` keyword is added; values unchanged.)

- [ ] **Step 2: Create the component**

Create `src/components/CampaignActionButton.js`:

```jsx
"use client";

// CampaignActionButton — the ONE participation CTA across every page + lifecycle
// status. Purely presentational: the three trigger wrappers (IssueVoteButton,
// EventJoinButton, IssueJoinButton) compute mode/label/accent/roleColor from
// their hook and render this; every act/committed instance opens the unified
// CampaignParticipationModal. Act = solid (teal, red for LIVE) + sheen + lift;
// committed = tinted role-aware chip (never white) that also opens the modal;
// readonly/disabled are non-interactive chips. The modal's per-role dashed
// "open slot" pills are a deliberately DIFFERENT (secondary) language — this is
// the single primary action, so it is solid (see the design spec).

import { CheckCircleFilled } from "@ant-design/icons";

// mode: "act" | "committed" | "readonly" | "disabled"
export function CampaignActionButton({
  mode = "act",
  label,
  accent = "primary", // "primary" | "live" — act only
  roleColor, // committed tint hue; defaults to --primary
  icon = null,
  size = "lg", // "sm" | "lg"
  count, // optional trailing tally (act mode only)
  loading = false,
  block = false,
  onClick,
  ariaLabel,
  className = ""
}) {
  const interactive = (mode === "act" || mode === "committed") && !loading;
  const isCommittedLike = mode === "committed" || mode === "readonly";
  const showCount =
    mode === "act" && count !== null && count !== undefined && count !== "";

  const style =
    mode === "committed" && roleColor ? { "--role-color": roleColor } : undefined;

  const lead = loading ? (
    <span className="campaign-action-btn-spinner" aria-hidden="true" />
  ) : isCommittedLike ? (
    <span className="campaign-action-btn-icon" aria-hidden="true">
      <CheckCircleFilled />
    </span>
  ) : icon ? (
    <span className="campaign-action-btn-icon" aria-hidden="true">
      {icon}
    </span>
  ) : null;

  const inner = (
    <>
      {lead}
      {showCount ? <span className="campaign-action-btn-count">{count}</span> : null}
      {label ? <span className="campaign-action-btn-label">{label}</span> : null}
    </>
  );

  const classes =
    `campaign-action-btn campaign-action-btn--${mode} campaign-action-btn--${size}` +
    (block ? " campaign-action-btn--block" : "") +
    (className ? ` ${className}` : "");

  if (!interactive) {
    return (
      <span
        className={classes}
        data-accent={mode === "act" ? accent : undefined}
        style={style}
        aria-label={ariaLabel || label}
        aria-disabled="true"
      >
        {inner}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      data-accent={mode === "act" ? accent : undefined}
      style={style}
      onClick={onClick}
      disabled={loading}
      aria-label={ariaLabel || label}
    >
      {inner}
    </button>
  );
}
```

- [ ] **Step 3: Append the CSS**

In `src/styles/event-roster.css`, append at the end of the file:

```css
/* --- CampaignActionButton -------------------------------------------
 * The ONE participation CTA across every page + status (see
 * docs/superpowers/specs/2026-06-29-campaign-action-button-design.md).
 * act = solid (teal / red LIVE) + sheen + lift; committed = tinted role
 * chip (never white) that opens the modal; readonly/disabled = quiet
 * chips. One size system (sm | lg) — only scale differs. */
.campaign-action-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.15s var(--ease-out-soft, ease),
    box-shadow 0.15s var(--ease-out-soft, ease),
    background-color 0.15s var(--ease-out-soft, ease);
}
.campaign-action-btn[aria-disabled="true"] {
  cursor: default;
}
.campaign-action-btn--block {
  width: 100%;
}
.campaign-action-btn--lg {
  padding: 10px 22px;
  font-size: 15px;
}
.campaign-action-btn--sm {
  padding: 6px 14px;
  font-size: 13px;
}
.campaign-action-btn-icon {
  display: inline-flex;
  font-size: 1.05em;
}
.campaign-action-btn-count {
  font-weight: 800;
}

/* ACT — solid action colour + sheen + soft shadow + hover lift. */
.campaign-action-btn--act {
  color: #fff;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 60%),
    var(--primary);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--primary) 32%, transparent);
}
.campaign-action-btn--act[data-accent="live"] {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 60%),
    var(--state-live);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--state-live) 38%, transparent);
}
@media (hover: hover) {
  .campaign-action-btn--act:hover,
  .campaign-action-btn--act:focus-visible {
    transform: translateY(-1px);
    box-shadow: 0 7px 20px color-mix(in srgb, var(--primary) 42%, transparent);
  }
  .campaign-action-btn--act[data-accent="live"]:hover,
  .campaign-action-btn--act[data-accent="live"]:focus-visible {
    box-shadow: 0 7px 20px color-mix(in srgb, var(--state-live) 48%, transparent);
  }
}
.campaign-action-btn--act:active {
  transform: translateY(0);
}
.campaign-action-btn--act:disabled {
  opacity: 0.75;
  cursor: progress;
}

/* LIVE subtle pulse ring */
.campaign-action-btn--act[data-accent="live"]::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  animation: campaign-cta-pulse 2.4s ease-out infinite;
}
@keyframes campaign-cta-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--state-live) 55%, transparent);
  }
  70% {
    box-shadow: 0 0 0 10px color-mix(in srgb, var(--state-live) 0%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--state-live) 0%, transparent);
  }
}

/* COMMITTED — tinted role chip (never white); opens the modal. */
.campaign-action-btn--committed {
  color: var(--role-color, var(--primary));
  background: color-mix(in srgb, var(--role-color, var(--primary)) 14%, var(--surface));
  border: 1.5px solid color-mix(in srgb, var(--role-color, var(--primary)) 38%, transparent);
}
@media (hover: hover) {
  .campaign-action-btn--committed:hover,
  .campaign-action-btn--committed:focus-visible {
    background: color-mix(in srgb, var(--role-color, var(--primary)) 20%, var(--surface));
  }
}

/* READONLY / DISABLED — quiet, non-interactive chips. */
.campaign-action-btn--readonly {
  color: var(--muted);
  background: color-mix(in srgb, var(--muted) 12%, var(--surface));
}
.campaign-action-btn--disabled {
  color: var(--muted);
  background: color-mix(in srgb, var(--muted) 9%, var(--surface));
}

/* loading spinner */
.campaign-action-btn-spinner {
  width: 1em;
  height: 1em;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: campaign-cta-spin 0.7s linear infinite;
}
@keyframes campaign-cta-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .campaign-action-btn {
    transition: none;
  }
  .campaign-action-btn--act:hover {
    transform: none;
  }
  .campaign-action-btn--act[data-accent="live"]::after {
    animation: none;
  }
}
```

- [ ] **Step 4: Lint**

Run: `npx eslint src/components/CampaignActionButton.js src/components/ParticipantsPanel.js`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/CampaignActionButton.js src/components/ParticipantsPanel.js src/styles/event-roster.css
git commit -m "feat(campaign): CampaignActionButton — unified participation CTA

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Wire `IssueVoteButton` (OPEN support) to the new button

**Files:**
- Modify: `src/components/IssueVoteButton.js`

**Interfaces:**
- Consumes: `CampaignActionButton` (Task 1); `ROLE_COLORS`, `LEAD_COLOR` (Task 1); `useRoleSupport` (`voted`, `voterRole`, `eventRole`, `voteCount`, `voting`, `isAuthenticated`, `open`, `openModal`, `closeModal`, `onInterested`, `campaignHeader`, `panelProps`).

- [ ] **Step 1: Add committed-label copy**

In `src/components/IssueVoteButton.js`, in `ROLE_COPY.np` change the `doneLabels` block and add `committedAs`:

```js
    doneLabels: {
      INTERESTED: "समर्थन गरियो",
      GOING: "जोडिनुभयो",
      WANT_TO_LEAD: "नेतृत्वमा"
    },
    committedAs: "{role}का रूपमा",
```
and in `ROLE_COPY.en`:
```js
    doneLabels: {
      INTERESTED: "Supported",
      GOING: "Joined",
      WANT_TO_LEAD: "Leading"
    },
    committedAs: "Joined as {role}",
```

- [ ] **Step 2: Replace imports**

In `src/components/IssueVoteButton.js`, replace lines 3–7:

```js
import { CheckOutlined, LikeOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { useRoleSupport } from "@/lib/useRoleSupport";
```
with:
```js
import { LikeOutlined } from "@ant-design/icons";
import { CampaignActionButton } from "@/components/CampaignActionButton";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { ROLE_COLORS, LEAD_COLOR } from "@/components/ParticipantsPanel";
import { useRoleSupport } from "@/lib/useRoleSupport";
```

- [ ] **Step 3: Replace the component body**

In `src/components/IssueVoteButton.js`, replace the entire `export function IssueVoteButton({ ... }) { ... }` (from `export function IssueVoteButton(` to its closing brace) with:

```jsx
export function IssueVoteButton({
  issueId,
  initialVoteCount,
  initialVoted,
  content,
  language = "np",
  size,
  // `type` is accepted for call-site compatibility but no longer used (the CTA
  // owns its own styling now). Same for showLabel.
  type,
  showCount = true,
  showLabel = true,
  className,
  onVoteChange,
  seed,
  support: controlledSupport
}) {
  const ownSupport = useRoleSupport(issueId, {
    seed: seed ?? { voteCount: initialVoteCount, isVoted: initialVoted },
    content,
    language,
    onVoteChange
  });
  const support = controlledSupport ?? ownSupport;
  const t = ROLE_COPY[language] || ROLE_COPY.np;

  const sizeKey = size === "large" ? "lg" : "sm";
  const voted = support.voted;
  const voterRole = support.voterRole; // INTERESTED | GOING | WANT_TO_LEAD | null
  const eventRole = support.eventRole; // role | null

  let mode = "act";
  let label = content.card.voteAction;
  let roleColor;
  if (voted) {
    mode = "committed";
    if (voterRole === "WANT_TO_LEAD") {
      label = t.doneLabels.WANT_TO_LEAD;
      roleColor = LEAD_COLOR;
    } else if (voterRole === "GOING" && eventRole) {
      label = t.committedAs.replace("{role}", t.eventRoles[eventRole] || eventRole);
      roleColor = ROLE_COLORS[eventRole];
    } else if (voterRole === "GOING") {
      label = t.doneLabels.GOING;
      roleColor = ROLE_COLORS.WORKER;
    } else {
      label = t.doneLabels.INTERESTED; // roleColor stays undefined → --primary tint
    }
  }

  const handleClick = () => {
    // Anonymous → the hook's interested path pushes to login; else open the modal.
    if (!support.isAuthenticated) {
      support.onInterested();
      return;
    }
    support.openModal();
  };

  return (
    <>
      <CampaignActionButton
        mode={mode}
        label={showLabel ? label : ""}
        accent="primary"
        roleColor={roleColor}
        icon={<LikeOutlined />}
        size={sizeKey}
        count={mode === "act" && showCount ? toLocalDigits(support.voteCount, language) : undefined}
        loading={support.voting}
        className={className}
        language={language}
        onClick={handleClick}
      />

      <CampaignParticipationModal
        open={support.open}
        onClose={support.closeModal}
        language={language}
        campaign={support.campaignHeader}
        onInterested={support.onInterested}
        panelProps={support.panelProps}
      />
    </>
  );
}
```

- [ ] **Step 4: Lint**

Run: `npx eslint src/components/IssueVoteButton.js`
Expected: no errors (no unused `Popconfirm`/`Tooltip`/`Button`/`CheckOutlined`/`useState`/`useEffect`/`useRef`).

- [ ] **Step 5: Verify in browser (OPEN)**

Dev on `:7777`, logged in. On `/campaigns?status=open` open a preview → the **Support** CTA is solid teal (sm). Click → unified modal opens. After supporting, the CTA becomes a tinted committed chip (check + label, never white) and re-clicking re-opens the modal. Open the same campaign's detail (`/campaign/<slug>`) → the topline CTA is the **same design**, `lg`.

- [ ] **Step 6: Commit**

```bash
git add src/components/IssueVoteButton.js
git commit -m "refactor(campaign): IssueVoteButton uses CampaignActionButton

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Wire `EventJoinButton` to the new button

**Files:**
- Modify: `src/components/EventJoinButton.js`

**Interfaces:**
- Consumes: `CampaignActionButton`, `ROLE_COLORS`, `LEAD_COLOR` (Task 1); `useEventJoin` (`joinable`, `viewerRole`, `loading`, `open`, `openModal`, `closeModal`, `campaignHeader`, `panelProps`).

- [ ] **Step 1: Replace imports + committed copy**

In `src/components/EventJoinButton.js`, replace the import block (the `CampaignParticipationModal` + `useEventJoin` imports near the top) so it reads:

```js
import { UserAddOutlined } from "@ant-design/icons";
import { CampaignActionButton } from "@/components/CampaignActionButton";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { ROLE_COLORS, LEAD_COLOR } from "@/components/ParticipantsPanel";
import { useEventJoin } from "@/lib/useEventJoin";
```

Change both `joinedAs` entries in `BUTTON_COPY` to read as a committed chip:
```js
    joinedAs: (role) => `${ROLE_LABELS_NP[role] || role}का रूपमा`,
```
(np) and
```js
    joinedAs: (role) => `Joined as ${ROLE_LABELS_EN[role] || role}`,
```
(en).

- [ ] **Step 2: Replace the render**

In `src/components/EventJoinButton.js`, replace everything from `// Hybrid CTA colour` / the `accent`/`label`/`btnType` derivation through the end of the returned JSX (the raw `<button>` + `<CampaignParticipationModal>`) with:

```jsx
  // viewerRole → committed chip; else the solid act CTA (red only when LIVE).
  const isLive = status === "active";
  let mode = "act";
  let label = isLive ? (lang === "np" ? "अहिले जोडिने" : "Join now") : bc.join;
  let roleColor;
  if (join.viewerRole) {
    mode = "committed";
    if (join.viewerRole === "COORDINATOR") {
      label = lang === "np" ? "नेतृत्वमा" : "Leading";
      roleColor = LEAD_COLOR;
    } else {
      label = bc.joinedAs(join.viewerRole);
      roleColor = ROLE_COLORS[join.viewerRole] || undefined;
    }
  }

  return (
    <>
      <CampaignActionButton
        mode={mode}
        label={label}
        accent={isLive ? "live" : "primary"}
        roleColor={roleColor}
        icon={<UserAddOutlined />}
        size={size === "large" ? "lg" : "sm"}
        loading={join.loading}
        language={lang}
        onClick={join.openModal}
      />

      <CampaignParticipationModal
        open={join.open}
        onClose={join.closeModal}
        language={lang}
        campaign={join.campaignHeader}
        panelProps={join.panelProps}
      />
    </>
  );
}
```

(Keep the `if (!join.joinable && !join.viewerRole) return null;` guard above this. Delete the old `accent`/`liveLabel`/`label`/`btnType` consts and the raw `<button ... style={{...}}>` entirely.)

- [ ] **Step 3: Lint**

Run: `npx eslint src/components/EventJoinButton.js`
Expected: no errors (no leftover unused consts).

- [ ] **Step 4: Verify in browser (DRAFT / SCHEDULED / ACTIVE)**

On `/campaigns?status=SCHEDULED` open a preview → **सामेल हुने** is solid teal (sm), opens the modal. On `?status=ACTIVE` (LIVE) the CTA is **red** "अहिले जोडिने" with the pulse. Confirm it matches the OPEN CTA's design exactly (same shape/size system).

- [ ] **Step 5: Commit**

```bash
git add src/components/EventJoinButton.js
git commit -m "refactor(campaign): EventJoinButton uses CampaignActionButton

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Wire `IssueJoinButton` to the new button

**Files:**
- Modify: `src/components/IssueJoinButton.js`

**Interfaces:**
- Consumes: `CampaignActionButton`, `ROLE_COLORS` (Task 1); `useEventJoin` (`viewerRole`, `eventData`, `loading`, `open`, `openModal`, `closeModal`, `panelProps`); `buildCampaignHeader`, `eventJoinPhase`, `getIssueEventId`, `useToast` (already imported).

- [ ] **Step 1: Replace imports**

In `src/components/IssueJoinButton.js`, replace lines 14–16:

```js
import { Button } from "antd";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { buildCampaignHeader } from "@/lib/campaignHeader";
```
with:
```js
import { StopOutlined, UserAddOutlined } from "@ant-design/icons";
import { CampaignActionButton } from "@/components/CampaignActionButton";
import { CampaignParticipationModal } from "@/components/CampaignParticipationModal";
import { ROLE_COLORS, LEAD_COLOR } from "@/components/ParticipantsPanel";
import { buildCampaignHeader } from "@/lib/campaignHeader";
```
(Remove the now-unused `CheckCircleFilled, StopOutlined, UserAddOutlined` from the line-14 antd-icons import — `StopOutlined`/`UserAddOutlined` move to the line above; `CheckCircleFilled` is dropped, the button renders its own check.)

- [ ] **Step 2: Replace the four return branches**

In `src/components/IssueJoinButton.js`, replace the body from `if (!eventId) {` through the final `</>;` / closing of the join-phase return with:

```jsx
  const sizeKey = size === "large" ? "lg" : "sm";

  // No event resolved yet → keep the CTA honest (info toast, no dead nav).
  if (!eventId) {
    return (
      <CampaignActionButton
        mode="act"
        accent="primary"
        icon={<UserAddOutlined />}
        size={sizeKey}
        block={block}
        className={className}
        label={t.join}
        language={language}
        onClick={(e) => {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          messageApi.info(t.soon);
        }}
      />
    );
  }

  if (phase.label === "cancelled") {
    return (
      <CampaignActionButton
        mode="disabled"
        icon={<StopOutlined />}
        size={sizeKey}
        block={block}
        className={className}
        label={t.cancelled}
        language={language}
      />
    );
  }

  if (phase.label === "contributed") {
    const role = join.viewerRole;
    const label = role
      ? t.contributed.replace("{role}", t.roles[role] || role)
      : t.contributedPlain;
    return (
      <CampaignActionButton
        mode="readonly"
        size={sizeKey}
        block={block}
        className={className}
        label={label}
        language={language}
      />
    );
  }

  // Join phases (DRAFT / SCHEDULED / ACTIVE) → open the role picker inline.
  const isLive = eventStatus === "ACTIVE";
  const campaign = buildCampaignHeader({
    issue,
    event: join.eventData || (eventStatus ? { status: eventStatus } : null),
    language
  });

  // committed chip if the viewer already holds a role in a still-joinable phase.
  let mode = "act";
  let label = isLive ? t.joinLive : t.join;
  let roleColor;
  if (join.viewerRole) {
    mode = "committed";
    if (join.viewerRole === "COORDINATOR") {
      label = language === "np" ? "नेतृत्वमा" : "Leading";
      roleColor = LEAD_COLOR;
    } else {
      label =
        language === "np"
          ? `${t.roles[join.viewerRole] || join.viewerRole}का रूपमा`
          : `Joined as ${t.roles[join.viewerRole] || join.viewerRole}`;
      roleColor = ROLE_COLORS[join.viewerRole] || undefined;
    }
  }

  return (
    <>
      <CampaignActionButton
        mode={mode}
        label={label}
        accent={isLive ? "live" : "primary"}
        roleColor={roleColor}
        icon={<UserAddOutlined />}
        size={sizeKey}
        block={block}
        className={className}
        loading={join.loading}
        language={language}
        onClick={(e) => {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          join.openModal();
        }}
      />

      <CampaignParticipationModal
        open={join.open}
        onClose={join.closeModal}
        language={language}
        campaign={campaign}
        panelProps={join.panelProps}
      />
    </>
  );
}
```

- [ ] **Step 3: Lint**

Run: `npx eslint src/components/IssueJoinButton.js`
Expected: no errors (no leftover `Button` / `CheckCircleFilled`).

- [ ] **Step 4: Verify in browser (promoted issue + contributed)**

From `/campaigns` open a promoted-issue **join** surface → solid `act` CTA opening the modal. On a COMPLETED campaign the CTA is a quiet `readonly` "योगदान: {role}" chip (non-interactive). Both match the unified design.

- [ ] **Step 5: Commit**

```bash
git add src/components/IssueJoinButton.js
git commit -m "refactor(campaign): IssueJoinButton uses CampaignActionButton

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Remove superseded CSS + full cross-page/status verification

**Files:**
- Modify: `src/styles/home.css` (remove dead button rules)

- [ ] **Step 1: Confirm the old selectors are dead**

Grep the repo for `public-issue-card-support` and `issue-topline-support-btn`. Expected: the only remaining JS references are the `className="public-issue-card-support"` / `className="issue-topline-support-btn"` props passed to the wrappers (harmless — they now land on a non-AntD element); no code depends on their old `.ant-btn` visual rules.

- [ ] **Step 2: Remove the dead CSS blocks**

In `src/styles/home.css`, delete the `.public-issue-card-support.ant-btn { ... }` block and its siblings (the contiguous run from `.public-issue-card-support.ant-btn {` through the last `.public-issue-card-support.ant-btn[disabled] .public-issue-card-support-count { ... }` rule, ~lines 6275–6326), and delete the `.public-issue-detail-support .issue-topline-support-btn.ant-btn[aria-pressed="true"]` block and its siblings (~lines 6792–6816). Leave `.public-issue-card-actions` / `.public-issue-detail-support` container rules intact.

- [ ] **Step 3: Lint the whole project**

Run: `npm run lint`
Expected: no NEW errors from the changed files (pre-existing unrelated warnings may remain).

- [ ] **Step 4: Full browser matrix**

With dev on `:7777`, logged in, verify the CTA in **both places** (campaigns preview pane + campaign detail topline) for each status, screenshotting each:

| Status | act CTA | committed |
|---|---|---|
| OPEN | solid teal "समर्थन गर्ने" | tinted "समर्थन गरियो" / role chip |
| DRAFT | solid teal "सामेल हुने" | role chip |
| SCHEDULED | solid teal "सामेल हुने" | role chip |
| ACTIVE | **red** "अहिले जोडिने" + pulse | role chip |
| COMPLETED | — | readonly "योगदान: {role}" |

Assert: (a) **identical design across both pages**, (b) one size system (no small/large mismatch), (c) committed is tinted (never white), (d) every act/committed CTA opens the one unified modal. (The CTA is a native `<button>`, so a11y-tree clicks fire onClick directly.)

- [ ] **Step 5: Commit**

```bash
git add src/styles/home.css
git commit -m "chore(campaign): drop superseded support-button CSS

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- One presentational `CampaignActionButton`, 4 modes → Task 1. ✓
- Act solid teal/red + sheen + lift → Task 1 CSS. ✓
- Committed tinted role chip (never white), opens modal → Task 1 + wrappers (Tasks 2–4). ✓
- All three wrappers feed it, all open the modal, Popconfirm removed → Tasks 2–4. ✓
- One size system sm/lg → Task 1 + wrapper `size` mapping. ✓
- Dashed left in modal (untouched) → no task touches the modal's `event-roster-open-pill`. ✓
- Committed label vocabulary normalized (no act/committed collision) → Task 2 copy + wrapper labels. ✓
- Remove old CSS → Task 5. ✓
- Role-colour tint sourced once → Task 1 exports `ROLE_COLORS`/`LEAD_COLOR`. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code. ✓

**Type consistency:** `CampaignActionButton` prop names (`mode/label/accent/roleColor/icon/size/count/loading/block/onClick/ariaLabel/className/language`) are used identically in Tasks 2–4. `mode` values (`act|committed|readonly|disabled`) match the CSS modifiers. `accent` values (`primary|live`) match `data-accent` selectors. `ROLE_COLORS`/`LEAD_COLOR` exported in Task 1, imported in Tasks 2–4. ✓

**Deliberate notes:** the vote `count` shows in `act` mode only (a committed chip with a tally reads cluttered); `type`/`showLabel` props are kept on `IssueVoteButton` for call-site compatibility but no longer style anything.
