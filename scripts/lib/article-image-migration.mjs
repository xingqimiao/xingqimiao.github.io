import path from 'node:path'

const IMAGE_LINK = /!\[([^\]]*)\]\(\s*(<[^>\n]+>|.*?\.(?:png|jpe?g|gif|webp|svg)(?:[?#][^)\s]*)?)(\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/gi

export function extractMarkdownImageUrls(markdown) {
  return [...String(markdown).matchAll(IMAGE_LINK)].map((match) => {
    const wrapped = match[2]
    return wrapped.startsWith('<') && wrapped.endsWith('>') ? wrapped.slice(1, -1) : wrapped
  })
}

export function safeArticleStem(slug) {
  return String(slug).normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '') || 'article'
}

export async function planMarkdownImages({ markdown, slug, category, locate, preferredSources = new Map() }) {
  const matches = [...markdown.matchAll(IMAGE_LINK)]
  const sourceTargets = new Map(preferredSources)
  const urlTargets = new Map()
  const files = []
  const missing = []
  const stem = safeArticleStem(slug)

  for (const match of matches) {
    const wrapped = match[2]
    const url = wrapped.startsWith('<') && wrapped.endsWith('>') ? wrapped.slice(1, -1) : wrapped
    if (urlTargets.has(url)) continue
    const located = await locate(url)
    if (!located) { missing.push(url); urlTargets.set(url, undefined); continue }
    let planned = sourceTargets.get(located.sourcePath)
    if (!planned) {
      const sequence = String(files.length + 1).padStart(2, '0')
      const extension = located.extension.toLowerCase() || path.extname(located.sourcePath).toLowerCase()
      const targetName = `${stem}-${sequence}${extension}`
      planned = { sourcePath: located.sourcePath, targetName, publicUrl: `/pic/${category}/${targetName}` }
      sourceTargets.set(located.sourcePath, planned)
      files.push(planned)
    }
    urlTargets.set(url, planned.publicUrl)
  }

  let cursor = 0
  let next = ''
  for (const match of matches) {
    const index = match.index ?? 0
    next += markdown.slice(cursor, index)
    const wrapped = match[2]
    const url = wrapped.startsWith('<') && wrapped.endsWith('>') ? wrapped.slice(1, -1) : wrapped
    const replacement = urlTargets.get(url)
    next += replacement ? `![${match[1]}](${replacement}${match[3] ?? ''})` : match[0]
    cursor = index + match[0].length
  }
  next += markdown.slice(cursor)
  const rewrites = [...urlTargets.entries()].filter(([, publicUrl]) => publicUrl).map(([url, publicUrl]) => ({ url, publicUrl }))
  return { markdown: next, files, missing, rewrites }
}
