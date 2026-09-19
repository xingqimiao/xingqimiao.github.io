// Let's write a script to inspect every path in docs/kiraequal_book_logo_native_exact.svg
// around the star area: x in [250, 550], y in [120, 400]
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function checkStarPaths() {
  const svg = await readFile('E:/dev-kiraequalcom/docs/kiraequal_book_logo_native_exact.svg', 'utf8');
  const pathRegex = /<path\s+fill="([^"]+)"\s+d="([^"]+)"\s*\/>/g;
  let match;

  console.log('Star region inspection:');
  const starPaths = [];
  while ((match = pathRegex.exec(svg)) !== null) {
    const fill = match[1];
    const d = match[2];
    const m = d.match(/M\s*([\d.]+)\s+([\d.]+)/);
    if (!m) continue;
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);

    if (x >= 250 && x <= 550 && y >= 120 && y <= 400) {
      starPaths.push({ fill, d, x, y });
    }
  }

  console.log(`Found ${starPaths.length} paths in star region.`);
  // Count by fill
  const fills = {};
  for (const p of starPaths) {
    fills[p.fill] = (fills[p.fill] || 0) + 1;
  }
  console.log('Fills in star region:', fills);
}

checkStarPaths().catch(console.error);
