import { readFile, readdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import YAML from 'yaml'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const compiledPath = path.join(root, 'src', 'data', 'compiled_articles.json')
const compiledEnPath = path.join(root, 'src', 'data', 'compiled_articles_en.json')
const folders = ['blog', 'stories', 'report', 'documents']

function renderMarkdown(markdown) {
  const tokens = marked.lexer(markdown)
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type !== 'code' || token.lang || !/^(?: {4}|\t)/.test(token.raw)) continue

    const hanCount = (token.text.match(/\p{Script=Han}/gu) || []).length
    const looksLikeChineseProse = hanCount >= 40 && /[。！？；：，、“”]/u.test(token.text)
    if (!looksLikeChineseProse) continue

    const text = token.text.replace(/^[ \t]+/gm, '').trim()
    tokens[index] = {
      type: 'paragraph',
      raw: token.raw,
      text,
      tokens: marked.Lexer.lexInline(text),
    }
  }
  const renderer = new marked.Renderer()
  const heading = renderer.heading.bind(renderer)
  renderer.heading = ({ tokens: headingTokens, depth }) => {
    const text = headingTokens.map((item) => item.text || '').join('')
    const id = text.trim().toLowerCase().replace(/\s+/g, '-')
    const html = heading({ tokens: headingTokens, depth })
    return id ? html.replace(/^<h([1-6])/, `<h$1 id="${id.replace(/"/g, '&quot;')}"`) : html
  }
  return marked.parser(tokens, { renderer })
}

export function parseArticleSource(raw, fallbackSlug, type, fallback = {}) {
  const normalized = raw.replace(/\r\n?/g, '\n')
  let data = {}; let markdown = normalized
  if (normalized.startsWith('---\n')) {
    const end = normalized.indexOf('\n---\n', 4)
    if (end >= 0) { data = YAML.parse(normalized.slice(4, end)) || {}; markdown = normalized.slice(end + 5).replace(/^\s+/, '') }
  }
  const slug = String(data.slug || fallbackSlug)
  const article = {
    slug, title: String(data.title || fallback.title || slug),
    cover_name: String(data.cover || data.cover_name || fallback.cover_name || ''), type,
    date: type === 'stories' ? String(data.year || fallback.date || fallback.experience_date || '') : String(data.date || fallback.date || ''),
    contentHtml: renderMarkdown(markdown),
    seoDescription: String(data.seoDescription || fallback.seoDescription || ''),
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : Array.isArray(fallback.keywords) ? fallback.keywords.map(String) : [],
  }
  if (type !== 'stories') {
    article.grid_span = String(data.gridSpan || data.grid_span || 'normal')
    article.desc = String(data.description || data.desc || fallback.desc || '')
  }
  return article
}

export async function compileArticles() {
  const previous = JSON.parse(await readFile(compiledPath, 'utf8'))
  const previousByKey = new Map(previous.map((item) => [`${item.type}:${item.slug}`, item]))
  const compiled = []
  for (const type of folders) {
    const directory = path.join(root, 'content', type)
    let names = []
    try { names = (await readdir(directory)).filter((name) => name.endsWith('.md')).sort() } catch (error) { if (error.code !== 'ENOENT') throw error }
    for (const name of names) {
      const fallbackSlug = path.basename(name, '.md'); const existing = previousByKey.get(`${type}:${fallbackSlug}`) || {}
      const article = parseArticleSource(await readFile(path.join(directory, name), 'utf8'), fallbackSlug, type, existing)
      const next = { ...existing, ...article, region: undefined, experience_date: undefined, story_card_template: undefined }
      delete next.englishTitle
      delete next.englishDescription
      delete next.englishContentHtml
      if (type === 'stories') { delete next.desc; delete next.grid_span }
      compiled.push(next)
    }
  }
  const temporary = `${compiledPath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, `${JSON.stringify(compiled, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  await rename(temporary, compiledPath)
  return compiled
}

// English translations live outside content/ so the zh pipeline stays untouched.
// Each file mirrors its zh source: frontmatter `title` + translated markdown body.
export function parseEnglishSource(raw, slug) {
  const normalized = raw.replace(/\r\n?/g, '\n')
  let data = {}; let markdown = normalized
  if (normalized.startsWith('---\n')) {
    const end = normalized.indexOf('\n---\n', 4)
    if (end >= 0) { data = YAML.parse(normalized.slice(4, end)) || {}; markdown = normalized.slice(end + 5).replace(/^\s+/, '') }
  }
  return {
    slug,
    title: String(data.title || slug),
    contentHtml: renderMarkdown(markdown),
  }
}

export async function compileEnglishTranslations() {
  const compiled = []
  for (const type of ['stories', 'report', 'blog', 'documents']) {
    const directory = path.join(root, 'translations', 'en', type)
    let names = []
    try { names = (await readdir(directory)).filter((name) => name.endsWith('.md')).sort() } catch (error) {
      if (error.code === 'ENOENT') continue
      throw error
    }
    for (const name of names) {
      const slug = path.basename(name, '.md')
      compiled.push({ type, ...parseEnglishSource(await readFile(path.join(directory, name), 'utf8'), slug) })
    }
  }
  const temporary = `${compiledEnPath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(temporary, `${JSON.stringify(compiled, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
  await rename(temporary, compiledEnPath)
  return compiled
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const compiled = await compileArticles()
  const compiledEn = await compileEnglishTranslations()
  console.log(`Compiled ${compiled.length} articles (+${compiledEn.length} English translations).`)
}
