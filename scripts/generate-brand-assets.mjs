// Regenerate every brand raster from a single master logo.
//
//   node scripts/generate-brand-assets.mjs
//
// Master  : public/branding/logo.png  (full lockup: emblem + "श्रमदान / SHRAMDAN" wordmark, transparent).
//           Drop a new master in at that path and re-run to refresh the whole brand surface.
// Emblem  : derived by cropping the wordmark off the master, then trimming transparent margins.
//           The wordmark is unreadable at favicon sizes and duplicates adjacent UI text, so every
//           square placement (favicons, app icons, header/footer mark) uses the emblem, not the lockup.
//
// Produces: in-place optimized lockup, a square emblem master (logo-mark), the full favicon set,
//           apple-touch, android-chrome, a maskable PWA icon, a PNG-embedded multi-size .ico, and an
//           OG banner with its corner badge refreshed. PNG beats WebP for this flat, transparent
//           artwork, so everything ships as optimized PNG (next/image re-encodes per request anyway).

import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const BRANDING = "public/branding";
const FAVICON = `${BRANDING}/favicon`;
const MASTER = `${BRANDING}/logo.png`;
const OG = "public/images/og-shramdan.jpg";
const CREAM = { r: 247, g: 245, b: 239, alpha: 1 }; // #f7f5ef — manifest background_color
const png = (extra = {}) => ({ compressionLevel: 9, effort: 10, ...extra });

// Buffer the source images up front so we can safely overwrite them in place.
const masterBuf = await sharp(MASTER).png().toBuffer();
const ogBuf = await sharp(OG).toBuffer();
const meta = await sharp(masterBuf).metadata();

// ---- 1. Derive a high-res, trimmed emblem (wordmark cropped off) ----
const emblemBuf = await sharp(masterBuf)
  .extract({ left: 0, top: 0, width: meta.width, height: 448 }) // wordmark starts ~y=470
  .trim({ threshold: 10 })
  .png()
  .toBuffer();
const em = await sharp(emblemBuf).metadata();
console.log(`emblem (trimmed): ${em.width}x${em.height}`);

// Square the emblem on a transparent canvas with a little breathing room — the reusable icon master.
const PAD = 0.06;
const side = Math.round(Math.max(em.width, em.height) * (1 + PAD * 2));
const emblemSquare = await sharp({
  create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
}).composite([{ input: emblemBuf, gravity: "centre" }]).png().toBuffer();

// One square icon at `size`, optionally on an opaque bg with extra safe-zone padding.
async function icon(size, { bg = null, safe = 0 } = {}) {
  const inner = Math.round(size * (1 - safe * 2));
  const resized = await sharp(emblemSquare).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  const base = sharp({ create: { width: size, height: size, channels: 4, background: bg || { r: 0, g: 0, b: 0, alpha: 0 } } });
  return base.composite([{ input: resized, gravity: "centre" }]).png(png()).toBuffer();
}

// ---- 2. Emblem master (square, transparent) for in-app logo placements ----
await sharp(emblemSquare).resize(512, 512).png(png()).toFile(`${BRANDING}/logo-mark.png`);

// ---- 3. Optimize the lockup in place ----
await sharp(masterBuf).png(png()).toFile(MASTER);

// ---- 4. Favicon set ----
await writeFile(`${FAVICON}/favicon-16x16.png`, await icon(16));
await writeFile(`${FAVICON}/favicon-32x32.png`, await icon(32));
await writeFile(`${FAVICON}/android-chrome-192x192.png`, await icon(192));
await writeFile(`${FAVICON}/android-chrome-512x512.png`, await icon(512));
await writeFile(`${FAVICON}/apple-touch-icon.png`, await icon(180, { bg: CREAM, safe: 0.10 }));
await writeFile(`${FAVICON}/maskable-512x512.png`, await icon(512, { bg: CREAM, safe: 0.16 }));

// ---- 5. PNG-embedded multi-size .ico (16/32/48) ----
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(icoSizes.map((s) => icon(s)));
function buildIco(images, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  images.forEach((img, i) => {
    const s = sizes[i], e = i * 16;
    dir.writeUInt8(s >= 256 ? 0 : s, e); dir.writeUInt8(s >= 256 ? 0 : s, e + 1);
    dir.writeUInt16LE(1, e + 4); dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(img.length, e + 8); dir.writeUInt32LE(offset, e + 12);
    offset += img.length;
  });
  return Buffer.concat([header, dir, ...images]);
}
await writeFile(`${FAVICON}/favicon.ico`, buildIco(icoPngs, icoSizes));

// ---- 6. Refresh the OG banner badge (replace the old corner mark) ----
const CARD = { x: 72, y: 78, size: 104, radius: 22, pad: 15 }; // detected white-card bbox
const M = 14; // margin so the drop shadow isn't clipped
const cardSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.size + M * 2}" height="${CARD.size + M * 2}">
     <defs><filter id="s" x="-40%" y="-40%" width="180%" height="180%">
       <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0b1f18" flood-opacity="0.30"/>
     </filter></defs>
     <rect x="${M}" y="${M}" width="${CARD.size}" height="${CARD.size}" rx="${CARD.radius}" fill="#ffffff" filter="url(#s)"/>
   </svg>`
);
const inner = CARD.size - CARD.pad * 2;
const embForCard = await sharp(emblemSquare).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
const card = await sharp(cardSvg).composite([{ input: embForCard, top: M + CARD.pad, left: M + CARD.pad }]).png().toBuffer();
await sharp(ogBuf).composite([{ input: card, top: CARD.y - M, left: CARD.x - M }]).jpeg({ quality: 88, mozjpeg: true }).toFile(OG);

console.log("done");
