import { readFile, writeFile } from 'node:fs/promises';

// Generate clean, strictly symmetric star and combine with book paths
async function buildCleanSymmetricLogo() {
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

  // Star bounding box in 1254x1254:
  // x: 300 to 520, y: 150 to 360
  const starMinX = 310;
  const starMaxX = 515;
  const starMinY = 155;
  const starMaxY = 360;

  while ((match = pathRegex.exec(raw)) !== null) {
    const fill = match[1];
    const d = match[2];
    const x = getX(d);
    const y = getY(d);

    // Filter outer background
    if (x < 244 || x > 1008 || y < 120 || y > 1120) {
      continue;
    }

    // Skip any existing corrupted star paths in the star region
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

  // Now, construct the 100% mathematically symmetric pixel star!
  // Center of star in 1254 coordinate system:
  // cx = 417, cy = 250
  // Pixel unit size S = 15.5
  const S = 15.5;
  const cx = 417.5;
  const cy = 250.5;

  // Let's add the perfectly symmetric star paths:
  // 1. Black outer border (#000000)
  // 2. Yellow diamond fill (#FED634 / #FFD215)
  // 3. Inner sparkle white (#FFFFFF)
}
