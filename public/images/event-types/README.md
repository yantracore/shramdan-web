# Event Types — Image Handoff

This directory will hold the photo for each event-type card on the
homepage `.event-types-section` and the dedicated `/event-types` page.

## What's needed

One landscape-orientation JPG per item id listed in
`src/lib/siteContent.js` under `eventTypes.items[]`, plus future
images for items under `eventTypes.page.additionalItems[]` if their
cards are upgraded to image cards later.

Expected files (8 for the homepage grid):

- `cleanup.jpg`
- `afforestation.jpg`
- `beautification.jpg`
- `trail.jpg`
- `dam.jpg`
- `infrastructure.jpg`
- `seasonal.jpg`
- `disaster.jpg`

## Spec

- Aspect ratio: **3:2 landscape** (e.g., 1200 × 800 px is fine)
- Format: `.jpg`, compressed for web (~150–250 KB target)
- Style: photographic / photoreal, daylight, action-oriented; show
  Nepali community context (people, terrain, attire, landmarks) where
  possible. Match the existing `/public/images/homepage/cleanup-areas/`
  treatment — natural lighting, no overlays, no embedded text.
- Faces should not be identifying / closeup; favor mid-distance group
  shots that focus on the activity.

## Prompt source

Each event-type item in
[src/lib/siteContent.js](../../../src/lib/siteContent.js) has an
`imagePrompt` field intended as the generation prompt. The English
version on the `en` branch is the canonical prompt — the Nepali side
holds the same prompt verbatim so prompts stay in sync across locales.

Suggested workflow:

1. Read the `imagePrompt` for the item from `siteContent.js` (`eventTypes.items`).
2. Generate at 3:2 landscape.
3. Save as `<id>.jpg` in this directory.
4. The card automatically picks it up — no code change required.

## Currently missing

All 8 are placeholders until generated. Until images land, Next.js
will surface `<Image>` 404s for the missing files; that is expected
and the layout will degrade gracefully (the `.event-type-image` area
shows the muted gradient fallback defined in `src/styles/home.css`).

## Out of scope here

- Additional-items cards on `/event-types` page intentionally have
  NO image (text-only) for now. If we ever upgrade them, add the
  same `image` / `imageAlt` / `imagePrompt` fields and drop files
  into this directory under the same id.
