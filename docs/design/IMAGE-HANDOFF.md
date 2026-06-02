# Shramdan Image Handoff

> ⚠️ **2026-06-02 reset.** The Tier 1 sections of this doc were written on a faulty assumption that `event-types/`, `homepage/cleanup-areas/`, and `homepage/core-idea/` were placeholder-only. They were not — all three folders had real, intentionally-shipped images already (May 14 / May 27 / May 29 commits by the project owner). A regeneration round was started and reverted; **do not regenerate Tier 1**.
>
> **Active work today: Tier 2 only** (per-event demo thumbnails — a new path, no overwrites). Tier 3 is parked until the UI surfaces that would consume those assets are designed and wired.

Copy-pasteable spec for image-generation work. Save every output at the exact file path listed. After Tier 2 files land, the coding agent will update `src/lib/devMockData.js` to point each demo event at its dedicated thumbnail.

---

## Global style notes (apply to all photographic tiers)

- **Setting:** Nepal — Kathmandu Valley, Pokhara, mid-hills, or Terai depending on the prompt. Visible Nepali context (terrain, attire, signage, vehicles, architecture) wherever natural.
- **Lighting:** Natural daylight. Mid-morning or golden hour preferred. No harsh studio light, no flashes, no overlays.
- **People:** Mid-distance group shots — no identifiable close-up faces. Mixed ages and genders. Modest, practical attire (safety vests, kurta-suruwal, jeans, gloves). Avoid staged poses; favour caught-in-the-action moments.
- **Mood:** Hopeful, active, dignified. Not desperate, not heroic — just real community work.
- **No text in image.** No watermarks, no logos, no overlay captions. The site's UI handles all labels.
- **No AI tells.** Avoid the giveaway hyper-saturated colors, oddly-symmetric faces, six-fingered hands, melted brand logos.

---

## Tier 1 — ❌ DO NOT RUN

The Tier 1 sections (1A event types, 1B cleanup areas, 1C core-idea) were authored on the false premise that those paths held placeholders. They hold real, shipped images already. Regeneration is a net loss (larger file sizes, marginal-at-best visual change).

- **1A** — `public/images/event-types/*.jpg` (8 files) — real images committed in `61b29e1` on 2026-05-29. Regenerated in `1b06d71` and reverted in the next commit.
- **1B** — `public/images/homepage/cleanup-areas/*.jpg` (6 files) — real images committed by 2026-05-27 (refresh `cf3b59d`). Do not regenerate.
- **1C** — `public/images/homepage/core-idea/*.png` (5 files) — real images committed by 2026-05-14. Do not regenerate.

The original prompts and specs are preserved below for reference only — they describe the existing images, not work to do.

### 1A. Event types (8 photos) — ✅ already shipped, do not touch

**Spec:** 3:2 landscape, 1200×800 px, JPG, ~150–250 KB target. Photographic. Save under `public/images/event-types/`.

| File path | Prompt |
|---|---|
| `public/images/event-types/cleanup.jpg` | A group of Nepali community volunteers in safety vests cleaning a public street or riverbank in Nepal, holding brooms, gloves and trash bags, visible piles of collected waste, daylight, active and hopeful mood, Kathmandu Valley urban setting with familiar Nepali street elements. |
| `public/images/event-types/afforestation.jpg` | Nepali community volunteers planting saplings on a Himalayan hillside or community land, holding shovels and sapling pots, terraced fields or forested slopes in the background, golden-hour lighting, sense of hope and continuity. |
| `public/images/event-types/beautification.jpg` | A local Nepali artist painting a colorful mural on a previously blank concrete wall or under a flyover in a Nepali city, with bystanders watching, paint cans and ladders around, bright and creative atmosphere, urban Kathmandu or Pokhara backdrop. |
| `public/images/event-types/trail.jpg` | Nepali volunteers maintaining a mountain hiking trail in Nepal — clearing fallen rocks, repairing erosion damage with stone work, placing wooden trail markers and signage, surrounded by forested or terraced mountain landscape, daylight, practical working scene. |
| `public/images/event-types/dam.jpg` | Nepali community workers building a small check dam, gabion wall, or retaining wall along a mountain road or stream in Nepal — wire mesh filled with stones, slope reinforcement with stone work, hillside landscape with monsoon greenery, technical supervisor visible. |
| `public/images/event-types/infrastructure.jpg` | Nepali community volunteers helping at a rural school or hospital in Nepal — painting classroom walls, installing library shelves, fixing school furniture, with children or staff visible in background, bright cheerful colors, sense of community support. |
| `public/images/event-types/seasonal.jpg` | Nepali volunteers distributing blankets, warm clothes, or cool drinking water to community members during seasonal extreme weather in Nepal — winter Terai cold-wave with blankets and a small fire, or summer heat-wave with water distribution, compassionate scene. |
| `public/images/event-types/disaster.jpg` | Nepali community emergency response volunteers in high-visibility vests coordinating after an earthquake, flood, or landslide in Nepal — distributing relief supplies, search and rescue activity with ropes and stretchers, damaged buildings or muddy terrain in background, serious yet hopeful tone. |

### 1B. Homepage cleanup-areas grid (6 photos) — ✅ already shipped, do not touch

**Spec:** 3:2 landscape, 1200×800 px, JPG, ~150–250 KB. Photographic. Save under `public/images/homepage/cleanup-areas/`.

| File path | Prompt |
|---|---|
| `public/images/homepage/cleanup-areas/roadside.jpg` | Nepali community volunteers in safety vests sweeping and bagging trash along a main street or sidewalk in Kathmandu or Pokhara, brooms and trash bags in hand, traffic and shop signage visible but blurred in background, mid-morning daylight, active mood. |
| `public/images/homepage/cleanup-areas/empty-lands.jpg` | A small group of Nepali volunteers clearing accumulated trash from a vacant urban plot or unused lot in Nepal, tall grass and discarded plastic visible, two or three people bent over collecting waste into sacks, neighbouring houses in the background, overcast daylight. |
| `public/images/homepage/cleanup-areas/riverbanks.jpg` | Nepali community members cleaning a polluted river bank — likely Bagmati or a similar mid-hill river — wading at the shoreline with bags, plastic and debris being collected from the water's edge, bridge or temple visible in the distance, late afternoon daylight. |
| `public/images/homepage/cleanup-areas/drains.jpg` | A small Nepali community team clearing a blocked roadside drain or storm channel — one volunteer shovelling sediment out, another bagging plastic waste, the open drain visible along a narrow Kathmandu lane, practical working scene, mid-day. |
| `public/images/homepage/cleanup-areas/parks.jpg` | Nepali volunteers tidying a small neighbourhood park or public square in Nepal — picking up litter, sweeping, a couple of children helping nearby, benches and trees visible, a calm warm morning. |
| `public/images/homepage/cleanup-areas/nature-trails.jpg` | Nepali hikers turned volunteers cleaning a forested nature trail in the Kathmandu Valley foothills (e.g. Shivapuri or Chandragiri), collecting plastic and snack wrappers into sacks, narrow stone trail and rhododendron forest around, dappled morning light. |

### 1C. Homepage core-idea workflow (5 illustrations) — ✅ already shipped, do not touch

These are **diagrammatic illustrations, not photos.** They live in the "5-step how it works" panel. Style should match each other as a set — same colour palette, same line weight, same character/iconography.

**Spec:** Square (1:1), 800×800 px, **PNG with transparent background**, ~80–120 KB. Save under `public/images/homepage/core-idea/`.

**Shared style:** Flat illustration, two-tone — primary green `#176b5c` and accent orange `#e75f1b` against transparent background. Small accent strokes can use a soft gray. Minimal detail, friendly, mobile-readable at small sizes. No text labels inside the image. Think Headspace × Linear illustrations — clean geometric shapes, mild shadows, no shading.

| File path | Prompt |
|---|---|
| `public/images/homepage/core-idea/listing.png` | Flat illustration of a person holding a smartphone, marking a location pin on a small map, with a tiny photo thumbnail clipped to the pin. Two-tone (deep green + orange accent), transparent background. Style: friendly, minimal, geometric. |
| `public/images/homepage/core-idea/vote.png` | Flat illustration of three or four diverse community member silhouettes, each raising a hand or tapping a thumbs-up button on a phone, with a tally counter rising above. Two-tone (deep green + orange accent), transparent background. |
| `public/images/homepage/core-idea/plan.png` | Flat illustration of a calendar with a pin on a date, surrounded by small role icons (broom, camera, first-aid kit), suggesting an event being scheduled and roles being assigned. Two-tone, transparent background. |
| `public/images/homepage/core-idea/events.png` | Flat illustration of a small group of community volunteers actively working together — brooms, trash bags, sapling pots — under a sun, with a small live-broadcast camera icon floating above the scene to suggest YouTube Live coverage. Two-tone, transparent background. |
| `public/images/homepage/core-idea/results.png` | Flat illustration of a transparent results card showing before/after thumbnails and a small bar chart, with a checkmark seal and a tiny share-icon, conveying public, transparent results. Two-tone, transparent background. |

---

## Tier 2 — Per-event demo thumbnails (12 photos) — ✅ ACTIVE

The 12 demo events on `/events` and the homepage live rail currently all share the same 8 event-type photos (because `devMockData.js` points each event at `/images/event-types/<category>.jpg`). Distinct per-event thumbnails make demo data feel real and let presentation surfaces visually differentiate each event.

**Status:** New path, no overwrites. After files land, the coding agent will update `src/lib/devMockData.js` to wire them up.

**Spec:** 16:9 landscape, 1280×720 px, JPG, ~150–250 KB target. Save under `public/images/demo-events/` (the folder does not yet exist — create it).

| File name | Prompt |
|---|---|
| `bagmati-cleanup.jpg` | Volunteers in safety vests cleaning the polluted Bagmati riverbank in Kathmandu near Teenkune bridge, plastic and household waste being collected into sacks, the river and a low concrete bridge visible, urban Kathmandu backdrop, mid-morning. |
| `school-paint.jpg` | A handful of Nepali volunteers painting the walls of a community school in Kathmandu, ladders and paint buckets visible, blue and white walls being refreshed, schoolchildren peeking from a doorway, bright daylight. |
| `suryabinayak-trees.jpg` | A community tree-planting drive at Suryabinayak in Bhaktapur — Nepali volunteers digging shallow pits and placing saplings into the ground, forested hill backdrop, soft morning light. |
| `ratnapark-cleanup.jpg` | Volunteers gathered at the main gate of Ratna Park in central Kathmandu, holding brooms and trash bags, the park entrance and busy street visible, ready-to-start mood. |
| `bagmati-tree-line.jpg` | A line of volunteers planting saplings along the embankment beside Tripureshwar bridge over Bagmati river, with the bridge visible behind, weekend morning. |
| `gokarneshwar-trail.jpg` | A small group repairing the Gokarneshwar hiking trail just outside Kathmandu — moving stones, clearing fallen branches, applying trail markers, forested hillside path. |
| `durga-devi-paint.jpg` | Volunteers painting the outer walls of a community school in Gaushala, Kathmandu — Shri Durga Devi school sign barely visible — bright mid-day. |
| `kamalpokhari-beautify.jpg` | An artist painting a small mural on a wall along the Kamalpokhari pedestrian walkway in Kathmandu, with onlookers, paint cans on the ground, late afternoon. |
| `guheswari-cleanup-done.jpg` | A satisfied group of volunteers finishing a cleanup at the Guheshwari temple precinct in Kathmandu — bags of collected waste stacked at the side, the temple visible, late-morning light. Slight golden tone (post-event archival). |
| `shivapuri-done.jpg` | A group of volunteers posing modestly with planted saplings inside Shivapuri National Park boundary near Budhanilkantha, forest canopy above, archival warm tone. |
| `sinamangal-walk.jpg` | A repaired section of urban footpath in Sinamangal, Kathmandu, with a newly straightened lamp post and a few volunteers walking on it, evening tone, archival feel. |
| `hanumante-cleanup-done.jpg` | An archival shot of volunteers loading collected sacks of plastic onto a small truck beside the Hanumante river in Bhaktapur, with the Lokanthali bridge visible, evening, warm tone. |

---

## Tier 3 — ⏸ PARKED

Not active. Two of the four items in earlier drafts overwrote already-real files (`hero-shramdaan-bg.png`, `og-shramdan.jpg`) — same lesson as Tier 1. The other two (`shramesh-portrait.png`, `intro-hero-bg.png`) are not referenced anywhere in code yet — the consuming UI surfaces (`/learn/shramesh` portrait slot, `/intro` background image) haven't been designed. Generating those assets now would mean files sitting around unused.

Revisit only after a coding-side design decision answers:

- Where on `/learn/shramesh` does the portrait go (hero band? side card? inline near "Meet श्रमेश"?), and what aspect ratio + size does that slot need?
- Does `/intro` actually need a background image, or does the GSAP-driven type + accent shapes already carry the cinematic feel?

---

## Delivery checklist

For each batch, confirm:

- [ ] File saved at the exact path listed above (overwrites placeholder).
- [ ] Format matches spec (JPG vs PNG, transparent bg or not).
- [ ] Dimensions within ±10% of target.
- [ ] File size within target range — re-compress if larger.
- [ ] No text, no watermark, no logo inside the image.
- [ ] Nepali / Himalayan context visible where the prompt asks.

After dropping files in, no rebuild needed — Next.js dev server picks them up on the next request.

---

## Where the prompts come from

The Tier 1A prompts are the canonical `imagePrompt` fields in [src/lib/siteContent.js](../../src/lib/siteContent.js) under `eventTypes.items[]`. If a prompt is later edited there, this doc should be re-synced.

The Tier 1B cleanup-area prompts are authored here because `siteContent.js` doesn't yet carry per-item `imagePrompt` for that section. Same for Tier 1C, Tier 2, and Tier 3.
