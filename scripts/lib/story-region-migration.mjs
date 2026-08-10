export function planStoryRegionMigration({ compiledRaw, storySources }) {
  const removed = []
  const compiled = JSON.parse(compiledRaw)
  const nextCompiled = compiled.map((article) => {
    if (article?.type !== 'stories' || !Object.hasOwn(article, 'region')) return article
    const { region, ...next } = article
    removed.push({ source: 'compiled_articles.json', slug: String(article.slug ?? ''), region })
    return next
  })

  const storyNext = new Map()
  for (const [name, source] of storySources) {
    if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) {
      storyNext.set(name, source)
      continue
    }
    const normalized = source.replace(/\r\n/g, '\n')
    const end = normalized.indexOf('\n---', 4)
    if (end < 0) {
      storyNext.set(name, source)
      continue
    }
    const frontMatter = normalized.slice(4, end)
    let removedRegion
    const nextFrontMatter = frontMatter.split('\n').filter((line) => {
      const match = line.match(/^region:\s*(.*)$/)
      if (!match) return true
      removedRegion = match[1].replace(/^['"]|['"]$/g, '')
      return false
    }).join('\n')
    if (removedRegion !== undefined) removed.push({ source: name, region: removedRegion })
    storyNext.set(name, removedRegion === undefined ? source : `---\n${nextFrontMatter}\n---${normalized.slice(end + 4)}`)
  }

  return { compiledNext: `${JSON.stringify(nextCompiled, null, 2)}\n`, storyNext, removed }
}
