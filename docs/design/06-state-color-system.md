# Campaign Lifecycle State Color System

The canonical reference for the five campaign lifecycle states and the one
colour each carries. Every surface that shows *where a campaign is in its
lifecycle* reads from this system — never an ad-hoc colour.

## The five states

A "campaign" is one continuum from a reported problem to a finished cleanup.
The lifecycle has exactly five states, in order:

| State | NE (खुला…) | data-status | core hue | meaning |
|-------|-----------|-------------|----------|---------|
| OPEN | खुला | `open` | indigo `#4f5bd5` | issue gathering support |
| DRAFT | तयारीमा | `planning` | amber `#d98309` | being organized, no firm date |
| SCHEDULED | आउँदै | `upcoming` | teal `#176b5c` (brand `--primary`) | date is set |
| ACTIVE | लाइभ | `live` | red `#e23b2e` | happening now |
| COMPLETED | सम्पन्न | `past` | slate-green `#5f7a72` | done |

Note: the internal `data-status` value for COMPLETED stays `past` (historical;
a lot of JS branches on `status === "past"` for date/section logic). The colour
it renders is the `completed` token.

## Two colour languages — keep them apart

- **State colour = identity.** Where the campaign is in its lifecycle.
  Informational. One hue per state, reused on *every* place the state appears.
- **Action colour = what you do.** The Join/Support button. Constant so the
  button is always recognisably "the thing to click."

Mixing them muddies both, and a red button reads as destructive. So the button
does NOT follow the state colour — with one deliberate exception (LIVE, below).

## Tokens

Declared once in `globals.css` (light + dark). Each state has a `core` (solid:
spine, dot, thumbnail tag, live badge) and an `-ink` (readable text on a tinted
pill). Tinted pill background is derived: `color-mix(core 14%, surface)`.

```
--state-open / --state-open-ink
--state-planning / --state-planning-ink
--state-upcoming / --state-upcoming-ink   (= --primary / --primary-dark)
--state-live / --state-live-ink
--state-completed / --state-completed-ink
```

## Where the colour must appear (the "everywhere" rule)

Wherever a campaign's status is shown, its state colour must read through —
in whichever channel that surface uses:

- **/campaigns** list-card status pill + left spine; preview-pane tag.
- **Issue/Event cards** anywhere (home rails, /issues, /events).
- **Home rails** poster badges and the **pulsing live dot** (LIVE = red dot).
- **Status tags** on thumbnails / posters.
- AntD `Tag` surfaces (issue detail, admin) align to the same hue family.

If a surface shows status only as text, the text takes the ink colour; if as a
dot, the dot takes the core; if as a border/background, those take the core/tint.

## Join / Support button (hybrid)

| State | Button colour | Label (NE) |
|-------|---------------|------------|
| OPEN | teal (CTA) | समर्थन गर्ने |
| DRAFT / SCHEDULED | teal (CTA) | जोडिने / सामेल हुने |
| ACTIVE (live) | **red** | अहिले जोडिने |
| COMPLETED | no button | योगदान गरियो / हेर्ने |

Teal is the single CTA colour. LIVE is the only state whose button turns red —
because "live = red, join now" is a near-universal convention and the urgency is
real. All join modals share one shell + width (680) so size never varies by
state.

## DRAFT "toward campaign" surfacing

Once an issue is promoted, a campaign row exists — surface that, don't hide it.
On a DRAFT (planning) event:

- Show an informative **"अभियान सिर्जना भयो"** cue (a campaign now exists).
- Show the toward-campaign count as **X/Y जोडिनुभयो** (sum of `rolesNeeded`
  filled / needed) so the planning progress is visible before a meetup is set.
