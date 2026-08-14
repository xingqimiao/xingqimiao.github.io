// Optimize homepage action-card images: PNG/JPEG -> WebP at display-appropriate size.
// Usage: node scripts/optimize-action-images.mjs
// Outputs <basename>.webp next to the source file; keeps originals untouched.
import { readdirSync, statSync } from 'node:fs'
import { join, basename, extname } from 'node:path'
import sharp from 'sharp'

const dir = join(process.cwd(), 'public', 'pic', 'action')
const MAX_WIDTH = 1280 // covers 2x retina for ~620px display-width cards
const QUALITY = 82

const files = readdirSync(dir).filter((f) =>
  /\.(png|jpe?g)$/i.test(f) && !f.endsWith('.webp'),
)

for (const file of files) {
  const input = join(dir, file)
  const meta = await sharp(input).metadata()
  const out = join(dir, basename(file, extname(file)) + '.webp')
  const info = await sharp(input)
    .resize({ width: Math.min(MAX_WIDTH, meta.width), withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out)
  const before = statSync(input).size
  const after = statSync(out).size
  console.log(
    `${file}: ${meta.width}x${meta.height} (${(before / 1024).toFixed(0)} KiB) -> ` +
      `${info.width}x${info.height} ${info.format} (${(after / 1024).toFixed(0)} KiB) ` +
      `[${(100 - (after / before) * 100).toFixed(0)}% smaller]`,
  )
}
