import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceSvg = path.resolve(root, '..', 'docs', 'kiraequal_book_logo_native_exact.svg');
const targetSvg = path.resolve(root, 'public', 'pic', 'logo', 'bimi-logo.svg');

async function build() {
  console.log('Building 100% faithful BIMI Logo from native exact SVG...');
  const raw = await readFile(sourceSvg, 'utf8');

  const pathRegex = /<path\s+fill="([^"]+)"\s+d="([^"]+)"\s*\/>/g;
  let match;

  function getX(d) {
    const m = d.match(/M\s*([\d.]+)\s+([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  }
  function getY(d) {
    const m = d.match(/M\s*([\d.]+)\s+([\d.]+)/);
    return m ? parseFloat(m[2]) : 0;
  }

  // The true book boundaries in the 1254x1254 canvas:
  // Book X spans from ~245 (left spine) to ~1007 (right cover edge)
  // Book Y spans from ~120 (top cover edge) to ~1120 (bottom spine/edge)
  const BOOK_MIN_X = 244;
  const BOOK_MAX_X = 1008;
  const BOOK_MIN_Y = 120;
  const BOOK_MAX_Y = 1120;

  // Background near-white tints that exist OUTSIDE the book
  const bgShades = new Set([
    '#ffffff', '#fefefe', '#fdfdfd', '#fcfcfc', '#fbfbfb', '#fafafa',
    '#f9f9f9', '#f8f8f8', '#f7f7f7', '#f6f6f6', '#f5f5f5', '#f4f4f4',
    '#f3f3f3', '#f2f2f2', '#f1f1f1', '#f0f0f0'
  ]);

  const pathsByColor = new Map();
  let totalPaths = 0;
  let keptPaths = 0;

  while ((match = pathRegex.exec(raw)) !== null) {
    totalPaths++;
    const fill = match[1];
    const d = match[2];
    const x = getX(d);
    const y = getY(d);

    const isInsideBook = (x >= BOOK_MIN_X && x <= BOOK_MAX_X && y >= BOOK_MIN_Y && y <= BOOK_MAX_Y);

    if (!isInsideBook) {
      // Outside background canvas: skip
      continue;
    }

    // Inside the book:
    // If it's a near-white shade, ONLY skip if it's outside the book's white areas:
    // - Star sparkle (x: 320..500, y: 150..350)
    // - Middle white stripe (y: 450..780)
    // - Bottom book pages (y: 1000..1120)
    if (bgShades.has(fill.toLowerCase())) {
      const inStar = (x >= 320 && x <= 500 && y >= 150 && y <= 360);
      const inWhiteStripe = (y >= 450 && y <= 780);
      const inPages = (y >= 1000 && y <= 1120);

      if (!inStar && !inWhiteStripe && !inPages) {
        // If an artifact is in the blue or pink zone, it's a background bleed
        continue;
      }
    }

    keptPaths++;
    const key = fill;
    if (!pathsByColor.has(key)) {
      pathsByColor.set(key, []);
    }
    pathsByColor.get(key).push(d);
  }

  console.log(`Processed ${totalPaths} paths. Retained ${keptPaths} inside-book paths across ${pathsByColor.size} colors.`);

  // Assemble full SVG Tiny PS
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 1254 1254" width="100%" height="100%">
  <title>KiraEqual Brand Logo</title>
  <desc>KiraEqual Exact Native Vector Book Logo on Solid White Background for BIMI</desc>
  <rect width="1254" height="1254" fill="#FFFFFF"/>
`;

  for (const [fill, dList] of pathsByColor.entries()) {
    svg += `  <path fill="${fill}" d="${dList.join(' ')}"/>\n`;
  }

  svg += `</svg>\n`;

  await writeFile(targetSvg, svg, 'utf8');
  console.log(`Successfully generated perfect BIMI SVG: ${targetSvg}`);
}

build().catch(console.error);
