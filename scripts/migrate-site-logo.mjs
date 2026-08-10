import { constants } from 'node:fs'
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.resolve(root, '..', 'equal-admin', 'public', 'branding', 'kiraequal-book-mark.png')
const target = path.join(root, 'public', 'pic', 'logo', 'Logo.png')
const sha256 = (content) => createHash('sha256').update(content).digest('hex')

async function renderNavbarLogo() {
  const mark = await sharp(source)
    .resize(112, 112, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer()

  return sharp({
    create: {
      width: 128,
      height: 128,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function atomicWrite(content, expectedSha256) {
  if (sha256(await readFile(target)) !== expectedSha256) {
    throw new Error(`REVISION_CONFLICT: ${target}`)
  }
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, content, { flag: 'wx' })
  await rename(temporary, target)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [sourceContent, original] = await Promise.all([
    readFile(source),
    readFile(target),
  ])
  const originalSha256 = sha256(original)
  const backup = path.join(root, 'migration-backups', `site-logo-navbar-${originalSha256.slice(0, 12)}`)
  const backupTarget = path.join(backup, 'public', 'pic', 'logo', 'Logo.png')

  await mkdir(path.dirname(backupTarget), { recursive: true })
  await copyFile(target, backupTarget, constants.COPYFILE_EXCL)
  await writeFile(
    path.join(backup, 'manifest.json'),
    `${JSON.stringify({
      source: path.relative(root, source),
      sourceSha256: sha256(sourceContent),
      files: [{ path: path.relative(root, target), sha256: originalSha256 }],
    }, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  )

  await atomicWrite(await renderNavbarLogo(), originalSha256)
  console.log(`Generated the transparent navbar logo. Backup: ${backup}`)
}
