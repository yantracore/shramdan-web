# Participate CTA on campaign thumbnails — Design

> Date: 2026-06-30 · Status: design approved, pending spec review.
> Let people support/join straight from a campaign **thumbnail** (grid + home
> rail + related) without opening the detail page — the same CTA + modal,
> rendered lazily and compactly on the card.

---

## Context

The participation CTA is the shared `CampaignActionButton`, driven by the
trigger wrappers (`IssueVoteButton` for OPEN issues, `EventJoinButton` for
events) that open the unified modal.

**`CampaignCard` is the one universal thumbnail** — used by the `/campaigns`
**grid** (`view=thumbnails`), the **home rail** (`CampaignRail`), AND the
detail page's **related** section. It is currently view-only (cover + title +
count + a "View" link). So adding the CTA to `CampaignCard` covers every
thumbnail surface at once.

**Dead-code cleanup (verified):** `PublicIssueCard` is no longer imported
anywhere (the related section moved to `CampaignCard`; no other consumer of it
or its exports) — it is **removed** as part of this work. `IssueListCard` /
`EventListCard` are NOT removed: they power the `/campaigns` **list** left rail
(`role=option` rows → preview pane, which already has the CTA), plus `/issues`
and `/events` lists. They are a different layout from `CampaignCard`, so they
stay; the list view's CTA is covered by its preview pane.

`CampaignCard` is data-light (a count only; no viewer participation, no role
fill). So the card CTA is **lazy**: it shows the act label and opens the modal
(which loads the accurate state + lets the viewer act). No per-card fetches.

## Goals

1. `CampaignCard` shows a **participation CTA** in its footer; clicking opens the
   unified modal — participate without entering the page.
2. The CTA is **small** (`sm`) with **compact labels** so long commitments don't
   blow out a narrow card.
3. Footer becomes `[count] [Participate]`; the card's cover + title remain the
   link to the detail page (no separate "View" button).

## Non-goals

- No eager per-card loading (perf). Accurate committed/Full on the card face is
  not guaranteed — the modal shows it on click. (A future backend enrichment of
  the list with viewer-role + fill could make the card face accurate cheaply;
  out of scope.)
- The list left-rail rows are unchanged (the preview pane covers them).

---

## Part A — compact labels on the wrappers

Add a `compact` boolean prop to `IssueVoteButton`, `EventJoinButton`, and
`IssueJoinButton`. When `compact`, the **committed** label drops the role-name
form for a short generic one (act/full labels are already short):

- `IssueVoteButton` committed (compact): WANT_TO_LEAD → `नेतृत्वमा`/`Leading`;
  GOING → `जोडिनुभयो`/`Joined`; else → `समर्थन गरियो`/`Supported`. (Not
  `{role}का रूपमा`.) (Lazy on a card it's `समर्थन गरियो` anyway, since the role
  isn't known without a fetch — fine.)
- `EventJoinButton` / `IssueJoinButton` committed (compact): COORDINATOR →
  `नेतृत्वमा`/`Leading`; else → `जोडिनुभयो`/`Joined`.

`CampaignActionButton` itself is unchanged — `sm` already exists; the label text
is the wrapper's job. Add a CSS safety so a label can't overflow the card:
`.campaign-action-btn--sm .campaign-action-btn-label { max-width: 12ch;
overflow: hidden; text-overflow: ellipsis; }` (compact labels fit; this only
guards edge cases).

Each wrapper's `onClick` calls `e?.stopPropagation()` (already so in
`IssueJoinButton`; add to `IssueVoteButton`/`EventJoinButton`) so the card-footer
button never bubbles into a card link.

## Part B — CTA in CampaignCard's footer

`CampaignCard` receives `campaign` as `{ kind, data }` (or a raw record). Derive
`kind` + `data` (the same way `normalizeCampaign` does) and render the matching
wrapper in the footer, **lazy** (no `eager`), `sm`, `compact`:

- `kind === "issue"`:
  - `actionMode = issueActionMode(data.status)`.
  - `"support"` → `<IssueVoteButton issueId={data.id} seed={data} content={…}
    showCount={false} compact language={language} />` (seed carries `isVoted`, so
    a voted issue card reads `समर्थन गरियो` for free).
  - `"join"` → `<IssueJoinButton issue={data} compact language={language} />`.
  - else (`"contributed"`/none) → no CTA.
- `kind === "event"`:
  - `<EventJoinButton eventId={data.id} seed={data} status={visual}
    compact language={language} />` (lazy; returns null when not joinable and the
    viewer has no role — e.g. COMPLETED — which is correct for a card).

`CampaignCard` needs the issue copy for `IssueVoteButton` (`content`). Import the
`copy` dictionary (as other cards do) and pass `copy[language].issues`.

### Footer layout

Replace the `.campaign-card-cta` "View" link with the CTA. Keep the
people/count cluster. Footer:

```
[ 👥 5 · supporters ]            [ ♡ समर्थन गर्ने ]   (issue/OPEN)
[ 👥 2 · participants ]          [ ＋ सामेल हुने ]     (event)
```

The card's `.campaign-card-media` and `.campaign-card-title` Links still go to
`/campaign/{slug}` — that's the "view" affordance, so the separate View button
is dropped. When there's no count, the footer shows the CTA alone (the existing
`--solo` modifier still applies).

CSS: `.campaign-card-foot` already lays out two items (`justify-content:
space-between`); the CTA (`.campaign-action-btn--sm`) drops in where the link
was. Ensure the CTA doesn't stretch (`flex: 0 0 auto`).

## Part C — remove the dead `PublicIssueCard`

`PublicIssueCard` is no longer used (grep: no `import … from
"@/components/PublicIssueCard"` anywhere; its exports `PublicIssueCardSkeleton`
/ `formatSupporters` / `toLocalDigits` have no importers — the `formatSupporters`
hit elsewhere is a different local `formatSupportersLabel`). Delete
`src/components/PublicIssueCard.js`. Nothing else changes — the related section
already renders `CampaignCard`, which now carries the CTA from Part B.

---

## Files

- `src/components/IssueVoteButton.js` — `compact` prop (short committed label) +
  `stopPropagation` on click.
- `src/components/EventJoinButton.js` — `compact` prop + `stopPropagation`.
- `src/components/IssueJoinButton.js` — `compact` prop (short committed label).
- `src/components/CampaignCard.js` — render the lazy `sm` `compact` CTA in the
  footer; drop the View link; import `copy` + `issueActionMode`.
- `src/components/PublicIssueCard.js` — **delete** (dead code).
- `src/styles/campaigns.css` (+ `event-roster.css` if needed) — footer CTA fit +
  the `--sm` label overflow guard.

## Verification

In the browser:
1. `/campaigns` **grid** (`view=thumbnails`): each card shows a small CTA —
   OPEN cards `समर्थन गर्ने` (voted ones `समर्थन गरियो`), event cards
   `सामेल हुने`/`अहिले जोडिने`; clicking opens the unified modal (participate
   without leaving the grid); COMPLETED cards show no CTA.
2. **Home rail** cards show the same CTA.
3. Labels stay on one line on a narrow card (compact + `sm`); the card cover +
   title still navigate to the detail page.
4. The detail page's **related** section (now `CampaignCard`) shows the CTA too
   and still renders after `PublicIssueCard` is deleted (no import errors; lint
   + the page load clean).
