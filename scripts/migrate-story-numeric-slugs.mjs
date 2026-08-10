import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEXT_EXTENSIONS = new Set(['.md', '.json', '.mjs', '.js', '.ts', '.tsx', '.txt', '.html', '.css', '.xml'])
const SCAN_ROOTS = ['content', 'public', 'src']
const PRESERVE_ALIAS_FILES = new Set(['public/_worker.js', 'src/lib/storySlugAliases.ts'])
const LEGACY_ALIAS_TARGET = 'steady-harbor-thread'

function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

async function filesUnder(relative) {
  const directory = path.join(root, relative)
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const child = path.join(relative, entry.name)
    if (entry.isDirectory()) files.push(...await filesUnder(child))
    else if (entry.isFile()) files.push(child)
  }
  return files
}

function replaceAll(value, mappings) {
  return mappings.reduce((next, [from, to]) => next.split(from).join(to), value)
}

function numericSlug(source, used) {
  const seed = Number.parseInt(digest(source).slice(0, 12), 16) % 90_000_000
  for (let offset = 0; offset < 90_000_000; offset += 1) {
    const candidate = String(10_000_000 + ((seed + offset) % 90_000_000))
    if (!used.has(candidate)) {
      used.add(candidate)
      return candidate
    }
  }
  throw new Error('STORY_NUMERIC_SLUG_SPACE_EXHAUSTED')
}

async function plan() {
  const storyFiles = (await filesUnder('content/stories')).filter((file) => path.extname(file).toLowerCase() === '.md')
  const used = new Set(storyFiles.map((file) => path.basename(file, '.md')).filter((slug) => /^\d{8}$/.test(slug)))
  const mapping = new Map()
  for (const file of storyFiles.sort()) {
    const slug = path.basename(file, '.md')
    mapping.set(slug, /^\d{8}$/.test(slug) ? slug : numericSlug(slug, used))
  }
  const legacyTarget = mapping.get(LEGACY_ALIAS_TARGET)
  if (legacyTarget) {
    mapping.set('88737526', legacyTarget)
    mapping.set('cat-birthday-17-kira', legacyTarget)
  }
  const mappings = [...mapping.entries()]
    .filter(([from, to]) => from !== to)
    .sort((a, b) => b[0].length - a[0].length)
  const changes = []
  for (const relative of (await Promise.all(SCAN_ROOTS.map(filesUnder))).flat()) {
    const normalized = relative.replaceAll('\\', '/')
    const target = PRESERVE_ALIAS_FILES.has(normalized) ? relative : replaceAll(relative, mappings)
    const content = await readFile(path.join(root, relative))
    let nextText
    if (TEXT_EXTENSIONS.has(path.extname(relative).toLowerCase())) {
      const sourceText = content.toString('utf8')
      nextText = PRESERVE_ALIAS_FILES.has(normalized)
        ? sourceText.replaceAll(LEGACY_ALIAS_TARGET, legacyTarget ?? LEGACY_ALIAS_TARGET)
        : replaceAll(sourceText, mappings)
    }
    if (target !== relative || (nextText !== undefined && nextText !== content.toString('utf8'))) {
      changes.push({ source: relative, target, sha256: digest(content), nextText })
    }
  }
  const targets = new Set()
  for (const change of changes) {
    if (targets.has(change.target)) throw new Error('STORY_SLUG_TARGET_COLLISION:' + change.target)
    targets.add(change.target)
    if (change.source !== change.target) {
      try {
        if ((await stat(path.join(root, change.target))).isFile()) throw new Error('STORY_SLUG_TARGET_EXISTS:' + change.target)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
  }
  return { mapping: Object.fromEntries(mapping), changes }
}

async function apply(value) {
  const id = digest(JSON.stringify({ mapping: value.mapping, files: value.changes.map(({ source, sha256 }) => [source, sha256]) })).slice(0, 12)
  const backupBase = path.join(root, 'migration-backups', 'story-numeric-slugs-' + id)
  let backupRoot = backupBase
  let retry = 0
  while (true) {
    try {
      await mkdir(backupRoot, { recursive: false })
      break
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
      retry += 1
      backupRoot = backupBase + '-retry-' + retry
    }
  }
  for (const change of value.changes) {
    const source = path.join(root, change.source)
    if (digest(await readFile(source)) !== change.sha256) throw new Error('REVISION_CONFLICT:' + change.source)
    const backup = path.join(backupRoot, change.source)
    await mkdir(path.dirname(backup), { recursive: true })
    await copyFile(source, backup)
  }
  await writeFile(path.join(backupRoot, 'manifest.json'), JSON.stringify({ mapping: value.mapping, changes: value.changes.map(({ source, target, sha256 }) => ({ source, target, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
  for (const change of value.changes) {
    const source = path.join(root, change.source)
    const payload = change.nextText === undefined ? await readFile(source) : Buffer.from(change.nextText, 'utf8')
    if (change.target !== change.source) {
      const target = path.join(root, change.target)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, payload, { flag: 'wx' })
      await unlink(source)
      continue
    }
    if (change.nextText !== undefined) {
      await writeFile(source, payload, { flag: 'w' })
    }
  }
  return backupRoot
}

const value = await plan()
console.log(JSON.stringify({
  storyCount: Object.keys(value.mapping).filter((slug) => slug !== '88737526' && slug !== 'cat-birthday-17-kira').length,
  mappingCount: Object.keys(value.mapping).length,
  changedFiles: value.changes.length,
  renamedFiles: value.changes.filter((item) => item.source !== item.target).length,
  sample: Object.entries(value.mapping).slice(0, 8),
}, null, 2))
if (process.argv.includes('--apply')) console.log('BACKUP=' + await apply(value))
