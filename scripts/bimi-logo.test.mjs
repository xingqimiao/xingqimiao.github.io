import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('bimi-logo', () => {
  it('satisfies BIMI SVG Tiny PS requirements', () => {
    const filePath = path.resolve('public/pic/logo/bimi-logo.svg');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    const stat = fs.statSync(filePath);

    // 1. File size must be under 32KB
    expect(stat.size).toBeLessThan(32 * 1024);

    // 2. SVG Attributes: version="1.2", baseProfile="tiny-ps"
    expect(content).toMatch(/version="1\.2"/);
    expect(content).toMatch(/baseProfile="tiny-ps"/);
    expect(content).toMatch(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);

    // 3. Aspect Ratio: viewBox must be square
    const vbMatch = content.match(/viewBox="([^"]+)"/);
    expect(vbMatch).toBeTruthy();
    const [, , width, height] = (vbMatch ? vbMatch[1] : '').trim().split(/\s+/).map(Number);
    expect(width).toBe(height);

    // 4. Must have <title> tag
    expect(content).toMatch(/<title>[^<]+<\/title>/);

    // 5. Must NOT contain forbidden tags for SVG Tiny PS
    const forbidden = [
      '<script',
      '<style',
      '<image',
      '<foreignObject',
      '<audio',
      '<video',
      '<animate',
      '<use',
      'onclick',
      'onload'
    ];
    for (const f of forbidden) {
      expect(content.toLowerCase().includes(f)).toBe(false);
    }

    // 6. Must have solid background rect
    expect(content).toMatch(/<rect[^>]+fill="#[fF]{6}"/);
  });
});
