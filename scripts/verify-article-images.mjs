import { access, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractMarkdownImageUrls, safeArticleStem } from './lib/article-image-migration.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicRoot = path.join(root, 'public')
const folders = { blog: 'blog', stories: 'stories', report: 'report', documents: 'documents' }
const failures = []
let markdownImages = 0
let covers = 0

async function exists(file) { try { await access(file); return true } catch { return false } }
for (const [type, folder] of Object.entries(folders)) {
  const directory = path.join(root, 'content', folder)
  const names = (await readdir(directory).catch(() => [])).filter((name) => name.endsWith('.md'))
  for (const name of names) {
    const slug = path.basename(name, '.md')
    const stem = safeArticleStem(slug)
    const urls = extractMarkdownImageUrls(await readFile(path.join(directory, name), 'utf8'))
    for (const href of urls) {
      markdownImages += 1
      const expected = new RegExp(`^/pic/${folder}/${stem}-(?:cover|\\d{2})\\.(?:png|jpe?g|gif|webp|svg)$`, 'iu')
      if (!expected.test(href)) failures.push(`${type}:${slug}:noncanonical:${href}`)
      const target = path.resolve(publicRoot, href.replace(/^\/+/, ''))
      if (!target.startsWith(publicRoot)) failures.push(`${type}:${slug}:outside-public:${href}`)
      else if (!await exists(target)) failures.push(`${type}:${slug}:missing:${href}`)
    }
  }
}
const compiled = JSON.parse(await readFile(path.join(root, 'src', 'data', 'compiled_articles.json'), 'utf8'))
for (const article of compiled) {
  if (article.cover_name) {
    covers += 1
    const folder = folders[article.type]
    const stem = safeArticleStem(article.slug)
    const expected = new RegExp(`^/pic/${folder}/${stem}-cover\\.(?:png|jpe?g|gif|webp|svg)$`, 'iu')
    if (!expected.test(article.cover_name)) failures.push(`${article.type}:${article.slug}:cover-noncanonical:${article.cover_name}`)
    if (!await exists(path.resolve(publicRoot, article.cover_name.replace(/^\/+/, '')))) failures.push(`${article.type}:${article.slug}:cover-missing:${article.cover_name}`)
  }
  for (const match of String(article.contentHtml ?? '').matchAll(/(?:src|href)=["'](\/pic\/[^"']+)["']/gi)) {
    const folder = folders[article.type]
    const stem = safeArticleStem(article.slug)
    const expected = new RegExp(`^/pic/${folder}/${stem}-(?:cover|\\d{2})\\.(?:png|jpe?g|gif|webp|svg)$`, 'iu')
    if (!expected.test(match[1])) failures.push(`${article.type}:${article.slug}:compiled-noncanonical:${match[1]}`)
    if (!await exists(path.resolve(publicRoot, match[1].replace(/^\/+/, '')))) failures.push(`${article.type}:${article.slug}:compiled-missing:${match[1]}`)
  }
}
if (failures.length) { console.error(JSON.stringify({ markdownImages, covers, failures }, null, 2)); process.exit(1) }
console.log(JSON.stringify({ markdownImages, covers, broken: 0 }, null, 2))
