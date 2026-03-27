/**
 * Generate PWA icons for c.k.v. Oranje Wit
 *
 * Produces 4 PNG files:
 *   - icon-192.png (192x192, regular)
 *   - icon-512.png (512x512, regular)
 *   - icon-maskable-192.png (192x192, maskable with safe zone padding)
 *   - icon-maskable-512.png (512x512, maskable with safe zone padding)
 *
 * Design:
 *   - Background: #0f1115 (dark theme surface-page)
 *   - Accent: #ff6b00 (OW oranje)
 *   - Text: "OW" in white bold
 *   - Regular icons have rounded corners
 *   - Maskable icons have extra padding (safe zone = 80%)
 */

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "apps", "web", "public", "icons");

const BG_COLOR = "#0f1115";
const ACCENT = "#ff6b00";
const TEXT_COLOR = "#ffffff";

/**
 * Generate a regular icon SVG with rounded corners
 */
function regularSvg(size) {
  const radius = Math.round(size * 0.2);
  const circleR = Math.round(size * 0.27);
  const circleCy = Math.round(size * 0.43);
  const fontSize = Math.round(size * 0.23);
  const textY = Math.round(size * 0.48);
  const subtitleSize = Math.round(size * 0.078);
  const subtitleY = Math.round(size * 0.82);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG_COLOR}"/>
  <circle cx="${size / 2}" cy="${circleCy}" r="${circleR}" fill="${ACCENT}"/>
  <text x="${size / 2}" y="${textY}" text-anchor="middle" dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${fontSize}" fill="${TEXT_COLOR}"
        letter-spacing="${Math.round(size * 0.01)}">OW</text>
  <text x="${size / 2}" y="${subtitleY}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="${subtitleSize}" fill="#e5e7eb">Oranje Wit</text>
</svg>`;
}

/**
 * Generate a maskable icon SVG with safe zone padding (80% safe zone = 10% padding each side)
 * The background fills the entire square (no rounded corners — the OS masks it).
 * The content is scaled down to fit within the safe zone.
 */
function maskableSvg(size) {
  // Safe zone: center 80% of the icon
  const padding = size * 0.1; // 10% on each side
  const safeSize = size * 0.8;
  const centerX = size / 2;

  // Scale elements to fit within safe zone
  const circleR = Math.round(safeSize * 0.27);
  const circleCy = Math.round(padding + safeSize * 0.4);
  const fontSize = Math.round(safeSize * 0.23);
  const textY = Math.round(padding + safeSize * 0.45);
  const subtitleSize = Math.round(safeSize * 0.078);
  const subtitleY = Math.round(padding + safeSize * 0.78);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG_COLOR}"/>
  <circle cx="${centerX}" cy="${circleCy}" r="${circleR}" fill="${ACCENT}"/>
  <text x="${centerX}" y="${textY}" text-anchor="middle" dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${fontSize}" fill="${TEXT_COLOR}"
        letter-spacing="${Math.round(safeSize * 0.01)}">OW</text>
  <text x="${centerX}" y="${subtitleY}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="${subtitleSize}" fill="#e5e7eb">Oranje Wit</text>
</svg>`;
}

async function generateIcon(svgString, outputFile, size) {
  const buffer = Buffer.from(svgString);
  await sharp(buffer, { density: 150 })
    .resize(size, size)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(path.join(OUTPUT_DIR, outputFile));
  console.log(`  Generated: ${outputFile}`);
}

async function main() {
  console.log("Generating PWA icons for c.k.v. Oranje Wit...\n");

  const icons = [
    { svg: regularSvg(512), file: "icon-192.png", size: 192 },
    { svg: regularSvg(512), file: "icon-512.png", size: 512 },
    { svg: maskableSvg(512), file: "icon-maskable-192.png", size: 192 },
    { svg: maskableSvg(512), file: "icon-maskable-512.png", size: 512 },
  ];

  for (const icon of icons) {
    await generateIcon(icon.svg, icon.file, icon.size);
  }

  console.log("\nDone! Icons saved to apps/web/public/icons/");
}

main().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
