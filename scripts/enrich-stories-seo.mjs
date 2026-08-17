import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const storiesDir = path.join(root, 'content', 'stories')
const apply = process.argv.includes('--apply')

const files = readdirSync(storiesDir).filter((f) => f.endsWith('.md'))
let updatedCount = 0

for (const file of files) {
  const filePath = path.join(storiesDir, file)
  const content = readFileSync(filePath, 'utf8')
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---([\s\S]*)$/)
  if (!match) continue

  const rawYaml = match[1]
  const body = match[2]
  const doc = YAML.parse(rawYaml) || {}

  let keywords = Array.isArray(doc.keywords) ? [...doc.keywords] : []
  let changed = false

  // Ensure "跨性别故事" is present
  if (!keywords.includes('跨性别故事')) {
    keywords.push('跨性别故事')
    changed = true
  }

  // Ensure "跨性别" is present
  if (!keywords.includes('跨性别')) {
    keywords.unshift('跨性别')
    changed = true
  }

  if (changed) {
    doc.keywords = keywords
    const newYaml = YAML.stringify(doc).trim()
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n'
    const newContent = `---${lineEnding}${newYaml}${lineEnding}---${body}`
    if (apply) {
      writeFileSync(filePath, newContent, 'utf8')
    }
    updatedCount++
  }
}

console.log(`[SEO Enrich] Processed ${files.length} stories, updated ${updatedCount} files (apply=${apply})`)
