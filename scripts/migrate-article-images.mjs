import { constants } from 'node:fs'
import { access, copyFile, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { planMarkdownImages, safeArticleStem } from './lib/article-image-migration.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicRoot = path.join(root, 'public')
const contentRoot = path.join(root, 'content')
const compiledPath = path.join(root, 'src', 'data', 'compiled_articles.json')
const apply = process.argv.includes('--apply')
const folders = { blog: 'blog', stories: 'stories', report: 'report', documents: 'documents' }
let publicFilesCache

async function exists(file) { try { await access(file); return true } catch { return false } }
async function filesBelow(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? filesBelow(path.join(directory, entry.name), extension) : [path.join(directory, entry.name)]))
  return nested.flat().filter((file) => !extension || file.toLowerCase().endsWith(extension))
}
function inside(base, candidate) { const relative = path.relative(base, candidate); return !relative.startsWith('..') && !path.isAbsolute(relative) }
async function locateImage(url, articlePath) {
  if (/^https?:/i.test(url) || /^(?:data|javascript|ftp):/i.test(url)) return undefined
  let candidate
  try {
    if (url.startsWith('/')) candidate = path.resolve(publicRoot, decodeURIComponent(url).replace(/^\/+/, ''))
    else if (url.startsWith('file:')) candidate = fileURLToPath(url)
    else candidate = path.resolve(path.dirname(articlePath), decodeURIComponent(url.split(/[?#]/, 1)[0]))
  } catch { return undefined }
  if (!inside(root, candidate)) return undefined
  if (!await exists(candidate)) {
    publicFilesCache ??= await filesBelow(path.join(publicRoot, 'pic'))
    const normalizedName = (value) => path.basename(value).normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
    const wanted = normalizedName(candidate)
    const matches = publicFilesCache.filter((file) => normalizedName(file) === wanted)
    candidate = matches.find((file) => path.dirname(file).toLocaleLowerCase() === path.dirname(candidate).toLocaleLowerCase()) ?? matches[0]
    if (!candidate) return undefined
  }
  return { sourcePath: candidate, extension: path.extname(candidate) }
}
function replaceEvery(value, before, after) {
  let next = String(value ?? '').split(before).join(after)
  try { next = next.split(encodeURI(before)).join(after) } catch { /* raw replacement already applied */ }
  return next
}
async function atomicWrite(target, content) {
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' })
  await rename(temporary, target)
}

const compiledRaw = await readFile(compiledPath, 'utf8')
const compiled = JSON.parse(compiledRaw)
const articleFiles = (await Promise.all(Object.entries(folders).map(async ([type, folder]) =>
  (await filesBelow(path.join(contentRoot, folder), '.md')).map((articlePath) => ({ type, folder, articlePath })),
))).flat().sort((a, b) => a.articlePath.localeCompare(b.articlePath))
const sourceMaterial = [compiledRaw]
const plans = []
const allTargets = new Map()
const allSources = new Map()

for (const entry of articleFiles) {
  const markdown = await readFile(entry.articlePath, 'utf8')
  sourceMaterial.push(markdown)
  const slug = path.basename(entry.articlePath, path.extname(entry.articlePath))
  const legacy = compiled.find((article) => article.type === entry.type && article.slug === slug)
  const preferredSources = new Map()
  let cover
  if (legacy?.cover_name) {
    const located = await locateImage(legacy.cover_name, entry.articlePath)
    if (located) {
      const targetName = `${safeArticleStem(slug)}-cover${located.extension.toLowerCase()}`
      cover = { sourcePath: located.sourcePath, targetName, publicUrl: `/pic/${entry.folder}/${targetName}`, oldUrl: legacy.cover_name }
      preferredSources.set(located.sourcePath, cover)
    }
  }
  const body = await planMarkdownImages({ markdown, slug, category: entry.folder, locate: (url) => locateImage(url, entry.articlePath), preferredSources })
  const files = [...(cover ? [cover] : []), ...body.files]
  for (const file of files) {
    const targetPath = path.join(publicRoot, file.publicUrl.replace(/^\/+/, ''))
    const existing = allTargets.get(targetPath)
    if (existing && existing !== file.sourcePath) throw new Error(`TARGET_COLLISION:${targetPath}`)
    allTargets.set(targetPath, file.sourcePath)
  }
  for (const rewrite of [...(cover ? [{ url: cover.oldUrl, publicUrl: cover.publicUrl }] : []), ...body.rewrites]) {
    const located = await locateImage(rewrite.url, entry.articlePath)
    if (!located) continue
    const urls = allSources.get(located.sourcePath) ?? new Set()
    urls.add(rewrite.url)
    allSources.set(located.sourcePath, urls)
  }
  plans.push({ ...entry, slug, markdown, nextMarkdown: body.markdown, cover, body, files })
}

const sourceHash = createHash('sha256').update(sourceMaterial.join('\0')).digest('hex')
const backupRoot = path.join(root, 'migration-backups', `article-images-${sourceHash.slice(0, 12)}`)
const report = {
  mode: apply ? 'apply' : 'dry-run', sourceHash, backupRoot,
  articles: plans.filter((plan) => plan.files.length || plan.body.missing.length).map((plan) => ({
    type: plan.type, slug: plan.slug, bodyImages: plan.body.rewrites.length, cover: Boolean(plan.cover), missing: plan.body.missing,
  })),
  renamedFiles: allTargets.size,
  missingReferences: plans.flatMap((plan) => plan.body.missing.map((url) => ({ slug: plan.slug, url }))),
}

if (apply) {
  if (await exists(backupRoot)) throw new Error(`BACKUP_ALREADY_EXISTS:${backupRoot}`)
  await mkdir(backupRoot, { recursive: true })
  await copyFile(compiledPath, path.join(backupRoot, 'compiled_articles.json'), constants.COPYFILE_EXCL)
  for (const plan of plans) {
    const backupArticle = path.join(backupRoot, path.relative(root, plan.articlePath))
    await mkdir(path.dirname(backupArticle), { recursive: true })
    await copyFile(plan.articlePath, backupArticle, constants.COPYFILE_EXCL)
  }
  for (const [targetPath, sourcePath] of allTargets) {
    await mkdir(path.dirname(targetPath), { recursive: true })
    if (path.resolve(targetPath) !== path.resolve(sourcePath)) await copyFile(sourcePath, targetPath, constants.COPYFILE_EXCL)
  }
  for (const plan of plans) {
    if (plan.nextMarkdown !== plan.markdown) await atomicWrite(plan.articlePath, plan.nextMarkdown)
    const legacy = compiled.find((article) => article.type === plan.type && article.slug === plan.slug)
    if (!legacy) continue
    if (plan.cover) legacy.cover_name = plan.cover.publicUrl
    for (const rewrite of plan.body.rewrites) legacy.contentHtml = replaceEvery(legacy.contentHtml, rewrite.url, rewrite.publicUrl)
  }
  await atomicWrite(compiledPath, `${JSON.stringify(compiled, null, 2)}\n`)

  const searchableFiles = [...await filesBelow(contentRoot, '.md'), ...await filesBelow(path.join(root, 'src', 'data'), '.json')]
  const searchable = await Promise.all(searchableFiles.map((file) => readFile(file, 'utf8')))
  const retained = []
  for (const [sourcePath, oldUrls] of allSources) {
    const referenced = [...oldUrls].some((url) => searchable.some((text) => text.includes(url) || (() => { try { return text.includes(encodeURI(url)) } catch { return false } })()))
    if (referenced) { retained.push(sourcePath); continue }
    const backupFile = path.join(backupRoot, path.relative(root, sourcePath))
    await mkdir(path.dirname(backupFile), { recursive: true })
    await rename(sourcePath, backupFile)
  }
  report.retainedReferencedOriginals = retained.map((file) => path.relative(root, file))
  await writeFile(path.join(backupRoot, 'manifest.json'), `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
}

console.log(JSON.stringify(report, null, 2))
