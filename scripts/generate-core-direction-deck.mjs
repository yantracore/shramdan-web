import fs from "node:fs";
import path from "node:path";
import pptxgen from "pptxgenjs";

const root = process.cwd();
const image = (...parts) => path.join(root, "public", "images", ...parts);
const outDir = path.join(root, "docs", "presentations");
const outFile = path.join(outDir, "shramdan-core-direction-change.pptx");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "SHRAMDAN";
pptx.company = "SHRAMDAN";
pptx.subject = "Core direction change notes";
pptx.title = "SHRAMDAN Core Direction Change";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US"
};
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";

const W = 13.333;
const H = 7.5;
const C = {
  forest: "176B5C",
  forestDark: "0F3F38",
  mint: "DFF0E6",
  cream: "F8F4EA",
  paper: "FFFDF7",
  orange: "E75F1B",
  gold: "F3B04D",
  ink: "17211C",
  muted: "66746D",
  white: "FFFFFF"
};

const slides = [
  {
    kicker: "Core Direction 01",
    title: "SHRAMDAN Is Becoming an Action Platform",
    nepali: "समस्या देख्ने मात्र होइन, समाधानतर्फ लैजाने प्रणाली।",
    body:
      "SHRAMDAN moves from public listings into a system for coordination, decisions, and real community action.",
    image: image("hero-shramdaan-bg.png"),
    accent: C.orange,
    stat: "List → Discuss → Act"
  },
  {
    kicker: "Core Direction 02",
    title: "Events + Issues Become the Core Discovery Layer",
    nepali: "खोज, फिल्टर, स्थान, श्रेणी — सबै एउटै अनुभवमा।",
    body:
      "Search, filters, category, location, and event/issue switching become the front door to civic work.",
    image: image("homepage", "core-idea", "events.png"),
    accent: C.forest,
    stat: "Discover what needs action"
  },
  {
    kicker: "Core Direction 03",
    title: "Trust Through Transparent Funding",
    nepali: "योगदान कहाँ जान्छ, सबै सदस्यले स्पष्ट देख्ने।",
    body:
      "Monthly needs, operating costs, contributors, and usage become visible so SHRAMDAN can sustain itself with trust.",
    image: image("homepage", "core-idea", "results.png"),
    accent: C.gold,
    stat: "Transparent by default"
  },
  {
    kicker: "Core Direction 04",
    title: "Shramesh: The 24x7 Digital Helper",
    nepali: "सहयोग, सुझाव, बैठक, समन्वय — एउटै साथी।",
    body:
      "Shramesh becomes SHRAMDAN's friendly digital staff: helping members coordinate, learn, organize, and eventually connect through LLM/RAG and WhatsApp.",
    image: image("forms", "join-contributors.webp"),
    accent: C.orange,
    stat: "Always-on coordination"
  },
  {
    kicker: "Core Direction 05",
    title: "App Development Becomes a Community Forum",
    nepali: "एप पनि श्रमदानकै मुद्दा हो — छलफल, मतदान, अनुमोदन, कार्यान्वयन।",
    body:
      "Building SHRAMDAN follows the same civic model: discuss current issues and upcoming features, vote on priorities, approve implementation, and track progress.",
    image: image("homepage", "core-idea", "vote.png"),
    accent: C.forest,
    stat: "Discuss → Vote → Approve → Build"
  },
  {
    kicker: "Core Direction 06",
    title: "Live Stats + System Pages Make SHRAMDAN Operable",
    nepali: "मञ्च अब देखिने, मापन हुने, सुधारिने प्रणाली बन्छ।",
    body:
      "Live stats, UI components, discussions, and operational pages turn SHRAMDAN into a measurable, improvable, publicly understandable system.",
    image: image("homepage", "core-idea", "listing.png"),
    accent: C.orange,
    stat: "Visible. Measured. Improved."
  }
];

function addFullBleed(slide, imgPath, opacity = 0.25) {
  slide.addImage({ path: imgPath, x: 0, y: 0, w: W, h: H, sizing: { type: "cover", x: 0, y: 0, w: W, h: H } });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: H,
    fill: { color: C.cream, transparency: Math.round((1 - opacity) * 100) },
    line: { color: C.cream, transparency: 100 }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: H,
    fill: { color: C.forestDark, transparency: 74 },
    line: { color: C.forestDark, transparency: 100 }
  });
}

function addTopBrand(slide, i) {
  slide.addImage({ path: image("logo.png"), x: 0.52, y: 0.34, w: 0.42, h: 0.42 });
  slide.addText("SHRAMDAN", {
    x: 1.02,
    y: 0.38,
    w: 1.72,
    h: 0.24,
    fontFace: "Aptos Display",
    fontSize: 10,
    bold: true,
    color: C.forestDark,
    margin: 0
  });
  slide.addText(String(i).padStart(2, "0"), {
    x: 12.06,
    y: 0.34,
    w: 0.74,
    h: 0.34,
    fontFace: "Aptos Display",
    fontSize: 13,
    bold: true,
    color: C.forestDark,
    align: "right",
    margin: 0
  });
}

function addAccentBars(slide, accent) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.12,
    h: H,
    fill: { color: accent },
    line: { color: accent }
  });
  slide.addShape(pptx.ShapeType.arc, {
    x: 10.7,
    y: -1.1,
    w: 4.2,
    h: 4.2,
    adjustPoint: 0.16,
    line: { color: accent, transparency: 35, width: 2 },
    fill: { color: accent, transparency: 100 },
    rotate: 18
  });
}

function addPhotoPanel(slide, imgPath, accent) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.2,
    y: 1.05,
    w: 5.28,
    h: 5.62,
    rectRadius: 0.12,
    fill: { color: C.white, transparency: 0 },
    line: { color: C.white, transparency: 100 },
    shadow: { type: "outer", color: "26352F", opacity: 0.2, blur: 2, angle: 45, distance: 1.2 }
  });
  slide.addImage({
    path: imgPath,
    x: 7.42,
    y: 1.28,
    w: 4.84,
    h: 4.28,
    sizing: { type: "cover", x: 7.42, y: 1.28, w: 4.84, h: 4.28 }
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 7.42,
    y: 5.16,
    w: 4.84,
    h: 0.4,
    fill: { color: C.forestDark, transparency: 20 },
    line: { color: C.forestDark, transparency: 100 }
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 7.74,
    y: 5.76,
    w: 4.18,
    h: 0.52,
    rectRadius: 0.08,
    fill: { color: accent, transparency: 0 },
    line: { color: accent, transparency: 100 }
  });
}

function addTextBlock(slide, item, i) {
  slide.addText(item.kicker.toUpperCase(), {
    x: 0.84,
    y: 1.08,
    w: 4.4,
    h: 0.22,
    fontFace: "Aptos",
    fontSize: 8.5,
    bold: true,
    color: item.accent,
    charSpace: 0.8,
    margin: 0
  });
  slide.addText(item.title, {
    x: 0.8,
    y: 1.5,
    w: 5.95,
    h: 1.62,
    fontFace: "Aptos Display",
    fontSize: i === 5 ? 31 : 34,
    bold: true,
    breakLine: false,
    fit: "shrink",
    color: C.ink,
    margin: 0,
    valign: "mid"
  });
  slide.addText(item.nepali, {
    x: 0.84,
    y: 3.28,
    w: 5.62,
    h: 0.44,
    fontFace: "Nirmala UI",
    fontSize: 15,
    bold: true,
    fit: "shrink",
    color: C.forestDark,
    margin: 0
  });
  slide.addText(item.body, {
    x: 0.84,
    y: 3.95,
    w: 5.62,
    h: 0.9,
    fontFace: "Aptos",
    fontSize: 15,
    color: C.muted,
    breakLine: false,
    fit: "shrink",
    margin: 0,
    valign: "top"
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.84,
    y: 5.45,
    w: 4.6,
    h: 0.58,
    rectRadius: 0.1,
    fill: { color: C.paper, transparency: 0 },
    line: { color: item.accent, transparency: 42, width: 1.2 }
  });
  slide.addText(item.stat, {
    x: 1.08,
    y: 5.63,
    w: 4.1,
    h: 0.2,
    fontFace: "Aptos",
    fontSize: 11.5,
    bold: true,
    color: C.forestDark,
    margin: 0,
    fit: "shrink"
  });
}

function makeSlide(item, index) {
  const slide = pptx.addSlide();
  slide.background = { color: C.cream };
  addFullBleed(slide, item.image, index === 1 ? 0.3 : 0.2);
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: W,
    h: H,
    fill: { color: C.cream, transparency: 5 },
    line: { color: C.cream, transparency: 100 }
  });
  addAccentBars(slide, item.accent);
  addTopBrand(slide, index);
  addTextBlock(slide, item, index);
  addPhotoPanel(slide, item.image, item.accent);
  slide.addText("Major direction changes only", {
    x: 8.08,
    y: 5.91,
    w: 3.5,
    h: 0.18,
    fontFace: "Aptos",
    fontSize: 8.5,
    color: C.white,
    bold: true,
    margin: 0,
    align: "center"
  });
}

for (const [idx, item] of slides.entries()) {
  if (!fs.existsSync(item.image)) {
    throw new Error(`Missing image asset: ${item.image}`);
  }
  makeSlide(item, idx + 1);
}

fs.mkdirSync(outDir, { recursive: true });
await pptx.writeFile({ fileName: outFile });
console.log(`Wrote ${outFile}`);
