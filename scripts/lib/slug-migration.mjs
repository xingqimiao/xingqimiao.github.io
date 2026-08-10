import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const SLUG_MAPPINGS = [
  ['2026-trans-survival-survey', '2026-transgender-survival-survey'],
  ['ApplePride2026', 'ios-26-5-pride-wallpapers'],
  ['Becoming-a-Cat-cat!', 'becoming-a-cat-a-story-about-srs'],
  ['blacknotebook', 'illustrated-hardcover-notebook-with-ribbon'],
  ['Meow-lets-survive', 'china-mtf-survival-guide'],
  ['KiraMyao_Equal__China_Trans', 'kiraequal-china-transgender-status-report'],
  ['China-Transgender-Healthcare-Report', 'china-transgender-healthcare-assessment-report'],
  ['article1', 'un-free-and-equal-transgender-status-and-challenges'],
  ['cat-birthday-17-kira', '45648863'],
  ['88737526', '45648863'],
]

const TEXT = new Set(['.md', '.json', '.mjs', '.js', '.ts', '.tsx', '.txt', '.html', '.css', '.xml'])
const SKIP_FILES = new Set([
  'scripts/lib/slug-migration.mjs',
  'scripts/migrate-slugs.mjs',
  'scripts/slug-migration.test.mjs',
  'scripts/story-slug-compat.test.mjs',
  'public/_worker.js',
  'src/lib/storySlugAliases.ts',
  'src/lib/storySlugAliases.test.ts',
])
const digest = (value) => createHash('sha256').update(value).digest('hex')
export function replaceSlugs(value) { return SLUG_MAPPINGS.reduce((next, [from, to]) => next.replaceAll(from, to), value) }

async function filesUnder(root, relative) {
  const directory = path.join(root, relative)
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = path.join(relative, entry.name)
    if (entry.isDirectory()) files.push(...await filesUnder(root, child))
    else if (entry.isFile()) files.push(child)
  }
  return files
}

export async function planSlugMigration(root) {
  const files = (await Promise.all(['content', 'public', 'scripts', 'src'].map((dir) => filesUnder(root, dir)))).flat()
  const changes = []
  for (const relative of files) {
    if (SKIP_FILES.has(relative.replaceAll('\\', '/'))) continue
    const target = replaceSlugs(relative)
    const content = await readFile(path.join(root, relative))
    const text = TEXT.has(path.extname(relative).toLowerCase()) ? content.toString('utf8') : undefined
    const nextText = text === undefined ? undefined : replaceSlugs(text)
    if (target !== relative || nextText !== text) changes.push({ source: relative, target, sha256: digest(content), nextText })
  }
  const targets = new Set()
  for (const change of changes) {
    if (targets.has(change.target)) throw new Error(`SLUG_TARGET_COLLISION:${change.target}`)
    targets.add(change.target)
    if (change.source !== change.target) {
      try { if ((await stat(path.join(root, change.target))).isFile()) throw new Error(`SLUG_TARGET_EXISTS:${change.target}`) } catch (error) { if (error.code !== 'ENOENT') throw error }
    }
  }
  return { mapping: Object.fromEntries(SLUG_MAPPINGS), changes }
}

export async function applySlugMigration(root, plan) {
  const id = digest(JSON.stringify({ mapping: plan.mapping, files: plan.changes.map(({ source, sha256 }) => [source, sha256]) })).slice(0, 12)
  const backupRoot = path.join(root, 'migration-backups', `slug-migration-${id}`)
  await mkdir(backupRoot, { recursive: false })
  for (const change of plan.changes) {
    const source = path.join(root, change.source)
    if (digest(await readFile(source)) !== change.sha256) throw new Error(`REVISION_CONFLICT:${change.source}`)
    const backup = path.join(backupRoot, change.source)
    await mkdir(path.dirname(backup), { recursive: true })
    await copyFile(source, backup)
  }
  await writeFile(path.join(backupRoot, 'manifest.json'), `${JSON.stringify({ mapping: plan.mapping, changes: plan.changes.map(({ source, target, sha256 }) => ({ source, target, sha256 })) }, null, 2)}\n`, { flag: 'wx' })
  for (const change of plan.changes) {
    let source = path.join(root, change.source)
    if (change.nextText !== undefined) {
      const temporary = `${source}.${process.pid}.${Date.now()}.tmp`
      await writeFile(temporary, change.nextText, { encoding: 'utf8', flag: 'wx' })
      await rename(temporary, source)
    }
    if (change.target !== change.source) {
      const target = path.join(root, change.target)
      await mkdir(path.dirname(target), { recursive: true })
      await rename(source, target)
    }
  }
  return backupRoot
}
