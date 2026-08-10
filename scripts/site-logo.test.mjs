import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'

const sha256 = (content) => createHash('sha256').update(content).digest('hex')

describe('website book-logo contract', () => {
  it('uses the exact book artwork for navigation and transparent application icons', async () => {
    const root = path.resolve(import.meta.dirname, '..')
    const navigationPath = path.join(root, 'public/pic/logo/Logo.png')
    const navigation = await sharp(navigationPath).ensureAlpha().metadata()
    const appIcon = await sharp(path.join(root, 'src/app/icon.png')).ensureAlpha().metadata()
    expect(navigation).toMatchObject({ width: 128, height: 128, hasAlpha: true })
    const { data: navigationPixels, info } = await sharp(navigationPath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const alphaAt = (x, y) => navigationPixels[(y * info.width + x) * info.channels + 3]
    expect([
      alphaAt(0, 0),
      alphaAt(info.width - 1, 0),
      alphaAt(0, info.height - 1),
      alphaAt(info.width - 1, info.height - 1),
    ]).toEqual([0, 0, 0, 0])
    expect(navigationPixels.some((value, index) => index % info.channels === 3 && value > 0)).toBe(true)
    expect(appIcon).toMatchObject({ width: 512, height: 512, hasAlpha: true })
    const appIconHash = sha256(await readFile(path.join(root, 'src/app/icon.png')))
    expect(sha256(await readFile(path.join(root, 'src/app/apple-icon.png')))).toBe(appIconHash)
    expect(sha256(await readFile(path.join(root, 'public/icon.png')))).toBe(appIconHash)
    expect(sha256(await readFile(path.join(root, 'public/apple-icon.png')))).toBe(appIconHash)
    const ico = await readFile(path.join(root, 'src/app/favicon.ico'))
    expect(ico.readUInt16LE(2)).toBe(1)
    expect(ico.readUInt16LE(4)).toBe(7)
    const icoHash = sha256(ico)
    expect(sha256(await readFile(path.join(root, 'public/icon.ico')))).toBe(icoHash)
    expect(sha256(await readFile(path.join(root, 'public/favicon.ico')))).toBe(icoHash)
  })
})
