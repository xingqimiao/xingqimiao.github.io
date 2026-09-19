import { readFile, writeFile } from 'node:fs/promises';

async function generateExactPixelLogo() {
  const src = 'E:/dev-kiraequalcom/docs/kiraequal_book_logo_native_exact.svg';
  const dst = 'E:/dev-kiraequalcom/equal-next/public/pic/logo/bimi-logo.svg';

  const raw = await readFile(src, 'utf8');
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

  const pathsByColor = new Map();

  // Book boundary (excluding outside background canvas)
  const minX = 244, maxX = 1008;
  const minY = 120, maxY = 1120;

  // Star bounding box in 1254 coordinate system
  const starMinX = 320, starMaxX = 515;
  const starMinY = 160, starMaxY = 355;

  while ((match = pathRegex.exec(raw)) !== null) {
    const fill = match[1];
    const d = match[2];
    const x = getX(d);
    const y = getY(d);

    // Skip canvas background
    if (x < minX || x > maxX || y < minY || y > maxY) {
      continue;
    }

    // Skip any star area paths (we rebuild the star with perfect pixel-art geometry)
    if (x >= starMinX && x <= starMaxX && y >= starMinY && y <= starMaxY) {
      if (fill !== '#60c7f9' && fill !== '#5bcefa' && fill !== '#61c9f9' && fill !== '#62caf9') {
        continue;
      }
    }

    if (!pathsByColor.has(fill)) {
      pathsByColor.set(fill, []);
    }
    pathsByColor.get(fill).push(d);
  }

  // Exact Pixel Art Star:
  // S = 15.5 px (width/height of 1 pixel block)
  // Center of star: cx = 417.5, cy = 257.5
  const S = 15.5;
  const cx = 417.5;
  const cy = 257.5;

  // 11x11 Grid definition matching the pixel logo:
  // Row 0: .....B..... (Top tip 1)
  // Row 1: .....B..... (Top tip 2)
  // Row 2: ....BYB....
  // Row 3: ...BYYYB...
  // Row 4: ..BYYWYYB..
  // Row 5: BBYWWWWYBB (Left tip 2, Right tip 2, Center row)
  // Row 6: ..BYYWYYB..
  // Row 7: ...BYYYB...
  // Row 8: ....BYB....
  // Row 9: .....B..... (Bottom tip 2)
  // Row 10:.....B..... (Bottom tip 1)
  const starGrid = [
    ".....B.....",
    ".....B.....",
    "....BYB....",
    "...BYYYB...",
    "..BYYWYYB..",
    "BBYWWWWWYBB",
    "..BYYWYYB..",
    "...BYYYB...",
    "....BYB....",
    ".....B.....",
    ".....B....."
  ];

  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 11; c++) {
      const char = starGrid[r][c];
      if (char === '.') continue;

      const px = cx + (c - 5) * S - S / 2;
      const py = cy + (r - 5) * S - S / 2;
      const d = `M${px} ${py}h${S}v${S}h-${S}z`;

      let fill = '#000000';
      if (char === 'Y') fill = '#FED634';
      if (char === 'W') fill = '#FFFFFF';

      if (!pathsByColor.has(fill)) {
        pathsByColor.set(fill, []);
      }
      pathsByColor.get(fill).push(d);
    }
  }

  // Build BIMI SVG Tiny PS
  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" viewBox="0 0 1254 1254" width="100%" height="100%">\n`;
  svg += `  <title>KiraEqual Brand Logo</title>\n`;
  svg += `  <desc>KiraEqual Pixel-Perfect Vector Book Logo for BIMI</desc>\n`;
  svg += `  <rect width="1254" height="1254" fill="#FFFFFF"/>\n`;

  for (const [fill, dList] of pathsByColor.entries()) {
    svg += `  <path fill="${fill}" d="${dList.join(' ')}"/>\n`;
  }

  svg += `</svg>\n`;

  await writeFile(dst, svg, 'utf8');
  console.log('Successfully generated perfectly symmetric BIMI SVG!');
}

generateExactPixelLogo().catch(console.error);
