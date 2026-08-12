/**
 * Generates social-card OG images (1200×630) at build setup time.
 *
 * Sharp can rasterise SVG; we compose a brand-themed SVG per card and write
 * it out as a PNG. The output is committed to public/ — no runtime cost.
 *
 * Run: `node scripts/generate-og.mjs`
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = new URL("../public/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);

// LA Digital brand palette — kept inline so this script doesn't import the
// site's TypeScript config.
const BG = "#07080a";
const SURFACE = "#14171c";
const BORDER = "rgba(255,255,255,0.08)";
const BRAND = "#ff6a00";
const BRAND_SOFT = "#ff8a3d";
const FG = "#f5f6f7";
const MUTED = "#a3a7ad";

const cards = [
  {
    file: "og-default.png",
    eyebrow: "LA Digital · Ottawa",
    title: "The business platform for ambitious companies.",
    sub: "Websites · Automation · AI · Growth services — on a monthly plan.",
  },
  {
    file: "og-presence.png",
    eyebrow: "Presence plan · From $199/mo",
    title: "A managed business website, sold as a subscription.",
    sub: "Hosting · Maintenance · Support · Basic SEO — all included.",
  },
  {
    file: "og-growth.png",
    eyebrow: "Growth plan · From $399/mo",
    title: "Your website, working as your operating system.",
    sub: "Booking · Payments · Customer accounts · Automated reminders.",
  },
  {
    file: "og-scale.png",
    eyebrow: "Scale plan · From $799/mo",
    title: "Automation built to help your business scale.",
    sub: "AI assistant · CRM · Reporting · Workflow automation.",
  },
];

function svgFor(card) {
  // Hand-wrapped title at ~30 chars to fit two lines in the typographic
  // hierarchy. SVG <text> doesn't auto-wrap, so we split manually.
  const titleLines = wrap(card.title, 32);
  const lineH = 80;
  const titleY = 290;

  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="${SURFACE}"/>
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="${BRAND}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${BRAND}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="1200" height="6" fill="${BRAND}"/>

  <!-- Card frame inset -->
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="none" stroke="${BORDER}"/>

  <!-- Logo mark — orange "LA" badge -->
  <g transform="translate(100, 110)">
    <rect width="64" height="64" rx="14" fill="#ffffff"/>
    <text x="32" y="46" text-anchor="middle"
          font-family="Arial Black, Impact, sans-serif"
          font-size="34" font-weight="900" fill="#000000"
          letter-spacing="-2">LA</text>
    <rect x="22" y="50" width="20" height="4" rx="2" fill="${BRAND}"/>
  </g>
  <text x="180" y="135" font-family="Inter, system-ui, sans-serif"
        font-size="22" font-weight="700" fill="${FG}" letter-spacing="0.4">LA Digital</text>
  <text x="180" y="160" font-family="Inter, system-ui, sans-serif"
        font-size="14" fill="${MUTED}" letter-spacing="3" text-transform="uppercase">WEB · APPS · AI</text>

  <!-- Eyebrow -->
  <text x="100" y="240" font-family="Inter, system-ui, sans-serif"
        font-size="20" font-weight="700" fill="${BRAND}"
        letter-spacing="3">${escape(card.eyebrow.toUpperCase())}</text>

  <!-- Title (manually wrapped) -->
  ${titleLines
    .map(
      (line, i) =>
        `<text x="100" y="${titleY + i * lineH}" font-family="Inter, system-ui, sans-serif"
        font-size="64" font-weight="700" fill="${FG}" letter-spacing="-1.5">${escape(line)}</text>`,
    )
    .join("\n  ")}

  <!-- Sub -->
  <text x="100" y="${titleY + titleLines.length * lineH + 40}"
        font-family="Inter, system-ui, sans-serif"
        font-size="26" fill="${MUTED}">${escape(card.sub)}</text>

  <!-- Bottom-right URL chip -->
  <g transform="translate(1100, 540)" text-anchor="end">
    <text font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="600" fill="${BRAND_SOFT}">ladigital.ca</text>
  </g>
</svg>
`.trim();
}

function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3); // hard-cap at 3 lines
}

function escape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

for (const card of cards) {
  const svg = svgFor(card);
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const out = join(PUBLIC_DIR, card.file);
  await writeFile(out, buffer);
  console.log(`✓ ${card.file} (${buffer.length.toLocaleString()} bytes)`);
}

console.log("Done. OG images regenerated.");
