import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const width = 1200
const height = 630
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'public/pic/stories/og-home.png')
const coverPaths = [
  path.join(root, 'public/pic/stories/45648863-cover.webp'),
  path.join(root, 'public/pic/stories/22730020-cover.webp'),
  path.join(root, 'public/pic/stories/19770785-cover.webp'),
]

const coverLayers = await Promise.all(
  coverPaths.map(async (coverPath, index) => {
    const cardWidth = 302
    const cardHeight = 492
    const roundedMask = Buffer.from(
      `<svg width="${cardWidth}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${cardWidth}" height="${cardHeight}" rx="28" fill="white"/></svg>`,
    )
    const shadow = Buffer.from(`
      <svg width="${cardWidth}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs><filter id="blur"><feGaussianBlur stdDeviation="12"/></filter></defs>
        <rect x="10" y="14" width="${cardWidth - 20}" height="${cardHeight - 20}" rx="28" fill="#000000" opacity="0.7" filter="url(#blur)"/>
      </svg>
    `)
    const border = Buffer.from(`
      <svg width="${cardWidth}" height="${cardHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="${cardWidth - 3}" height="${cardHeight - 3}" rx="28" fill="none" stroke="#FFFFFF" stroke-opacity="0.24" stroke-width="3"/>
      </svg>
    `)
    const image = await sharp(coverPath)
      .resize({ width: cardWidth, height: cardHeight, fit: 'cover' })
      .composite([{ input: roundedMask, blend: 'dest-in' }])
      .png()
      .toBuffer()
    const card = await sharp({
      create: { width: cardWidth, height: cardHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: shadow }, { input: image }, { input: border }])
      .png()
      .toBuffer()
    const rotation = [-8, 3, 10][index]
    return {
      input: await sharp(card).rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
      left: [520, 748, 975][index],
      top: [78, 36, 86][index],
    }
  }),
)

const background = Buffer.from(`
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#000000"/>
</svg>
`)

const text = Buffer.from(`
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="48" y="336" font-family="Arial, sans-serif" font-size="82" font-weight="700" letter-spacing="-3" fill="#FFFFFF">KiraEqual</text>
  <text x="52" y="386" font-family="Arial, sans-serif" font-size="29" font-weight="400" letter-spacing="1.4" fill="#FFFFFF">Stories</text>
</svg>
`)

await sharp(background)
  .composite([
    ...coverLayers,
    { input: text, left: 0, top: 0 },
  ])
  .png()
  .toFile(output)

console.log(`Generated ${output}`)
