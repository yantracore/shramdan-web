# Image Generation Agent Handoff

> Instructions for the image-generation agent producing visual assets for demo events in the शृमदान platform. The shramdan-web project author hands this document and the populated `imagePrompt` fields in [`../../src/lib/devMockData.js`](../../src/lib/devMockData.js) to a separate agent (typically a multimodal generation tool); this document captures the conventions that agent should follow.

This is operational documentation, not user-facing copy. English only.

---

## Output paths

All generated images go under [`/public/images/demo-events/`](../../public/images/demo-events/). The filename is derived from the event's `imageSlug` field (string slug — kebab-case, no extension). Each event uses one to three files:

| Purpose | Path pattern | Dimensions | Format | Required |
| --- | --- | --- | --- | --- |
| Card thumbnail | `<imageSlug>.jpg` | 1600 × 1067 (3:2) | JPEG, 85% quality | Yes |
| Live stream poster | `<imageSlug>-poster.jpg` | 1920 × 1080 (16:9) | JPEG, 85% quality | Only for events with `liveStream` |
| Before / after pair | `<imageSlug>-before.jpg` and `<imageSlug>-after.jpg` | 1600 × 1067 (3:2) | JPEG, 85% quality | Only for completed events that surface a `beforeAfter` shape |
| Live stream loop | `<imageSlug>.mp4` | 1280 × 720 | MP4, H.264, ten to twenty seconds, silent loop | Only for events whose `liveStream.streamUrl` points to a native loop |

Existing event slugs in the repo (do not regenerate these; they already exist):

- `bagmati-cleanup`
- `kamalpokhari-beautify`
- `suryabinayak-trees`
- `ratnapark-cleanup`
- `bagmati-tree-line`
- `gokarneshwar-trail`
- `durga-devi-paint`
- `school-paint`
- `guheswari-cleanup-done`
- `shivapuri-done`
- `sinamangal-walk`
- `hanumante-cleanup-done`

Any new event in `devMockData.js` should carry its own unique `imageSlug` not in this list.

---

## Style guide

Visual direction across the entire demo set:

- **Realism over polish.** Photographs feel like community contributors took them with phones, not like staged stock. Light should be available daylight; cloudy and golden-hour are both welcome; harsh midday is OK if true to the scene.
- **Nepali community context.** People wear everyday Nepali clothing — kurta, dhoti, jeans-and-tee, school uniform, sari, topi where appropriate. Religious sites, ward signs, devanagari signage all welcome in the frame.
- **People are working, not posing.** Hands occupied with brooms, gloves, paint, saplings, tools. Eye contact with camera should be incidental, not staged.
- **Mixed ages and genders.** Each crowd shot reflects intergenerational and gender-balanced participation. Children present in age-appropriate roles (handing water, watching, learning), not laboring.
- **Aftermath beats action where possible.** A "before" image is the problem; an "after" image is the visible outcome — both stronger when they show the result of labor rather than the labor itself.
- **Avoid foreign signifiers.** No western-style high-vis vests, no branded volunteer t-shirts, no foreign-language signs. Local visual vocabulary throughout.
- **No identifiable real persons.** Generated faces should not resemble real public figures or community members.

---

## Per-category prompt scaffolds

The `imagePrompt` field on each event in `devMockData.js` is the canonical prompt for that event's thumbnail. The category-level scaffolds below are the visual baseline that prompt is expected to layer on top of.

### `cleanup`

Baseline: a Nepali community site recently cleared of waste. Riverbank, footpath, market square, temple courtyard, or roadside, depending on the event location. Garbage bags consolidated to one side, broom resting against a wall, water running clear in a previously choked channel. Participants in a candid mid-task pose, not staged group photos.

### `afforestation`

Baseline: a hillside, riverbank, or open ground with freshly planted saplings staked into the soil. Participants kneeling or bending around plantings, water cans nearby, mature trees visible in the distance for scale. Soil disturbed; recent rain optional but flattering.

### `beautification`

Baseline: a wall or public surface mid-paint or freshly painted, with a community mural or solid color block. Brushes resting in trays, drop cloths on the ground, finished sections vivid against unpainted neighbors. Artist participants standing back to evaluate.

### `trail`

Baseline: a hiking trail in the mid-hills around Kathmandu Valley (Shivapuri, Phulchowki, Nagarkot ridge) or further out (Annapurna foothills, Helambu). Stone steps mended, signage freshly mounted, eroded sections shored up with timber and rocks. One or two hikers passing through as testament.

### `dam`

Baseline: a small community check-dam or gabion structure being built or reinforced. Stones and wire mesh, a stream visible alongside. Participants chest-deep in the work, soil-stained.

### `infrastructure`

Baseline: a school, library, community hall, or footpath under repair. Scaffolding, tools, painters in pairs, materials stacked nearby. Children present only at a distance or in supervisory roles.

### `seasonal`

Baseline: a seasonal preparedness scene — monsoon-readiness drainage clearing, winter blanket distribution staging area, festival site preparation. Time-of-year cues in the background (rain clouds, dry stubble, marigolds).

### `disaster`

Baseline: disaster recovery — flood debris being cleared, landslide path being stabilized, or earthquake-damaged structure being assessed. Participants in coordination poses (not chaos), tools and emergency vehicles in background. Avoid sensationalism; this is dignified work, not catastrophe.

---

## Per-event prompts

Each event object in `devMockData.js` carries an `imagePrompt` field with the specific prompt for that event's thumbnail. The agent should generate the thumbnail (`<imageSlug>.jpg`) for every event whose `imageSlug` is not in the "existing" list above.

For events whose record also includes `beforeAfter`, the agent should additionally generate `<imageSlug>-before.jpg` and `<imageSlug>-after.jpg`. The `before` image emphasizes the original problem; the `after` image emphasizes the resolved state. Both layer on the same category scaffold.

For events with a `liveStream` block whose `streamUrl` is a native `.mp4` path (not a YouTube URL), the agent should additionally generate the looped video file plus a poster JPEG.

---

## Handoff procedure

1. The project lead exports the current `devMockData.js` (or shares the file path).
2. The image agent reads every event object, extracts `imageSlug` and `imagePrompt`, skips any slug in the "existing" list above, and produces the required files at the documented paths.
3. The image agent reports any prompt that needed clarification; those go back to the shramdan-web author (Shramesh) for prompt refinement.
4. The image agent does not commit to the repo; the project lead drops the generated files into `/public/images/demo-events/` and commits with a `chore(assets): ...` message.

---

## Conventions on `imagePrompt`

When Shramesh adds a new demo event to `devMockData.js`, the `imagePrompt` field should:

- Be one to three sentences.
- Mention the location type (riverbank, school, hilltop, etc.) and specifically which place if it is a known landmark.
- Mention what state the scene is in (mid-event, completed, or before-state for `before` variants).
- Mention any anchor objects (saplings, brooms, scaffolding, signage) that ground the scene.
- Avoid prescribing camera angle or lens; leave aesthetic to the image agent.
- Avoid prescribing exact participant counts; leave crowd density to the agent unless the event explicitly hinges on scale (mass-cleanup vs. small repair crew).

A good `imagePrompt` is short, specific, and gives the image agent enough to layer on top of the category scaffold without dictating every detail.

---

## Recent changes

- `2026-06-03` — initial handoff document. Establishes path conventions, style guide, per-category scaffolds, and the `imagePrompt` field expectation.
