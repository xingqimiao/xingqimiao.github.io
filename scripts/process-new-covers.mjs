import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const covers = [
  {
    slug: '83512915',
    src: 'C:\\Users\\fkxw2\\Downloads\\ChatGPT Image Aug 17, 2026, 07_57_06 PM.png',
    dest: 'public/pic/stories/83512915-cover.webp',
  },
  {
    slug: '83512916',
    src: 'C:\\Users\\fkxw2\\Downloads\\ChatGPT Image Aug 17, 2026, 07_57_04 PM.png',
    dest: 'public/pic/stories/83512916-cover.webp',
  },
  {
    slug: '83512917',
    src: 'C:\\Users\\fkxw2\\Downloads\\ChatGPT Image Aug 17, 2026, 07_57_00 PM.png',
    dest: 'public/pic/stories/83512917-cover.webp',
  },
];

async function main() {
  for (const item of covers) {
    if (!fs.existsSync(item.src)) {
      console.error(`File not found: ${item.src}`);
      continue;
    }
    const origBuf = fs.readFileSync(item.src);
    const origSize = origBuf.length;
    
    // Convert to webp with quality 85 and limit width to 1536
    await sharp(origBuf)
      .resize({ width: 1536, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(item.dest);
      
    const newSize = fs.statSync(item.dest).size;
    console.log(`[Processed] ${item.slug}: ${(origSize / 1024).toFixed(1)}KiB -> ${(newSize / 1024).toFixed(1)}KiB (${item.dest})`);
  }
}

main().catch(console.error);
