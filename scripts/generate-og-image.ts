/**
 * Renders the Open Graph / Twitter card preview image shown when this
 * app's link is shared (WhatsApp, X, LinkedIn, iMessage, ...). Kept as a
 * regenerable script rather than a hand-exported PNG so the design can be
 * tweaked later without needing an image editor — just edit the SVG below
 * and re-run `bun run generate:og-image`.
 *
 * Colors match the app's actual theme tokens (src/styles.css): dark navy
 * sidebar background + the indigo "ai" accent used for every AI surface.
 */
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const WIDTH = 1200;
const HEIGHT = 630;

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0f1e" />
      <stop offset="100%" stop-color="#161c33" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#8b8bf0" />
    </linearGradient>
    <radialGradient id="glow" cx="82%" cy="18%" r="55%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)" />

  <!-- Abstract skyline motif -->
  <g opacity="0.5">
    <rect x="70" y="430" width="46" height="150" fill="#1e2544" />
    <rect x="126" y="380" width="46" height="200" fill="#232b4d" />
    <rect x="182" y="450" width="46" height="130" fill="#1e2544" />
    <rect x="238" y="400" width="46" height="180" fill="#232b4d" />
    <rect x="294" y="460" width="46" height="120" fill="#1e2544" />
  </g>

  <!-- Grid dots -->
  <g fill="#6366f1" opacity="0.25">
    <circle cx="1080" cy="90" r="3" /><circle cx="1120" cy="90" r="3" /><circle cx="1160" cy="90" r="3" />
    <circle cx="1080" cy="130" r="3" /><circle cx="1120" cy="130" r="3" /><circle cx="1160" cy="130" r="3" />
    <circle cx="1080" cy="170" r="3" /><circle cx="1120" cy="170" r="3" /><circle cx="1160" cy="170" r="3" />
  </g>

  <!-- Sparkle / AI mark -->
  <g transform="translate(70, 120)">
    <path d="M20 0 L25 15 L40 20 L25 25 L20 40 L15 25 L0 20 L15 15 Z" fill="url(#accent)" />
  </g>

  <text x="70" y="330" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="700" fill="#ffffff">
    Estatum <tspan fill="#8b8bf0">ERP</tspan>
  </text>
  <text x="72" y="390" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="400" fill="#a9b0cc">
    AI-powered Real Estate Operating System
  </text>

  <g transform="translate(72, 440)">
    <rect width="14" height="14" rx="4" fill="#22c55e" />
    <text x="24" y="12" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#c6cbe0">Leads &amp; Sales</text>

    <rect x="220" width="14" height="14" rx="4" fill="#6366f1" />
    <text x="244" y="12" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#c6cbe0">AI Calling Agent</text>

    <rect x="470" width="14" height="14" rx="4" fill="#f59e0b" />
    <text x="494" y="12" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#c6cbe0">RERA &amp; Compliance</text>
  </g>
</svg>`.trim();

async function main() {
  const png = await sharp(Buffer.from(svg)).resize(WIDTH, HEIGHT).png().toBuffer();
  await writeFile("public/og-image.png", png);
  console.log(`Wrote public/og-image.png (${png.length} bytes)`);
}

main().catch((err) => {
  console.error("Failed to generate OG image:", err);
  process.exit(1);
});
