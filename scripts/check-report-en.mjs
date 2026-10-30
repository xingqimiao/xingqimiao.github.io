#!/usr/bin/env node
/**
 * English report proofing pass.
 *
 * Checks the English reader edition for the defects a translated report
 * actually suffers from, in order of how much they damage credibility:
 *
 *   1. leftover Chinese in visible text
 *   2. HTML entities leaking into rendered text ("n&lt;5")
 *   3. full-width Chinese punctuation in English prose
 *   4. duplicated words / spacing artefacts from find-replace translation
 *   5. percentages that contradict the audited result table
 *   6. percentages/denominators that disagree inside the same paragraph
 *
 * Read-only: it reports, it never rewrites. Exit code 1 when anything fails.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const surveyRoot = process.env.SURVEY_PROJECT || 'E:/dev-kiraequalcom/survey_report_project'
const MD = path.join(root, 'translations/en/report/2026-transgender-life-survey-reader-edition.md')

const source = await readFile(MD, 'utf8')
const body = source.slice(source.indexOf('<div class="report-full">'))

const problems = []
const report = (kind, detail) => problems.push({ kind, detail })

/** Strip markup but keep the words a reader actually sees. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
}

// 1. Chinese characters outside attributes ------------------------------------
// A Chinese document title or community name followed by an English gloss is
// correct practice, not a defect — only unglossed Chinese blocks a reader.
{
  const withoutAttrs = body
    .replace(/\b(id|href|alt|aria-label|class|title)="[^"]*"/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
  const text = visibleText(withoutAttrs)
  const glossed = []
  const unglossed = []
  for (const m of text.matchAll(/[\u4e00-\u9fff][\u4e00-\u9fff\s（）()、·]*/g)) {
    const run = m[0].trim()
    if (!run) continue
    const after = text.slice(m.index, m.index + run.length + 180)
    const hasGloss = /\([^)]*[A-Za-z][^)]*\)/.test(after)
    ;(hasGloss ? glossed : unglossed).push(run)
  }
  if (unglossed.length) {
    for (const run of [...new Set(unglossed)].slice(0, 20)) report('cjk', `untranslated Chinese with no English gloss: “${run.slice(0, 40)}”`)
  }
  if (glossed.length) report('info', `${glossed.length} Chinese citations/names kept with an English gloss (intended)`)
}

// 2. Entity leakage ----------------------------------------------------------
// The source is HTML, so "&lt;" is legitimate — it renders as "<". Only a
// double-escaped entity ("&amp;lt;") would actually reach the reader.
{
  const text = visibleText(body)
  for (const entity of ['&amp;lt;', '&amp;gt;', '&amp;quot;', '&amp;amp;', '&amp;nbsp;']) {
    const count = text.split(entity).length - 1
    if (count > 0) report('entity', `double-escaped ${entity} appears ${count}× (prints literally)`)
  }
}

// 3. Full-width punctuation in English prose ---------------------------------
{
  const text = visibleText(body)
  for (const [mark, name] of [['，', 'comma'], ['。', 'full stop'], ['、', 'enumeration comma'], ['；', 'semicolon'], ['：', 'colon']]) {
    const count = text.split(mark).length - 1
    if (count > 0) report('punctuation', `full-width Chinese ${name} “${mark}” appears ${count}×`)
  }
}

// 4. Find/replace artefacts --------------------------------------------------
// Strip comments and tags with no replacement character: substituting a space
// for an inline tag would manufacture " ," / " ." that no reader ever sees.
{
  const tight = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[ \t]+/g, ' ')
  const patterns = [
    [/\b([A-Za-z]{3,}) \1\b/g, 'duplicated word'],
    [/(?<![(\[])\s,(?!\d)|\s\.(?=\s)/g, 'space before punctuation'],
    [/\(\s*\)/g, 'empty parentheses'],
  ]
  const seen = new Map()
  for (const [re, label] of patterns) {
    for (const m of tight.matchAll(re)) {
      const snippet = tight.slice(Math.max(0, m.index - 40), m.index + 40).trim()
      const key = `${label}:${m[0].trim() || '(space)'}`
      if (!seen.has(key)) seen.set(key, snippet)
    }
  }
  for (const [key, snippet] of [...seen].slice(0, 15)) report('typo', `${key.split(':')[0]} “${key.split(':')[1]}” — …${snippet}…`)
}

// 5/6. Percentage arithmetic against the audited table ----------------------
{
  const master = JSON.parse(await readFile(path.join(surveyRoot, '.runtime/stage3_master_snapshot_v001.json'), 'utf8'))
  const validDenominators = new Set()
  for (const r of master.records) {
    if (Number.isInteger(r.Valid_N) && r.Valid_N > 0) validDenominators.add(r.Valid_N)
  }

  const text = visibleText(body).replace(/\s+/g, ' ')
  for (const m of text.matchAll(/(\d{1,3}\.\d)%/g)) {
    if (Number(m[1]) > 100) report('number', `percentage above 100%: ${m[0]}`)
  }

  // Every "X% (N people)" pair implies a denominator N/(X/100). Rather than
  // compare that raw quotient (one-decimal rounding makes it wildly imprecise
  // for small percentages), recompute the count each candidate denominator
  // would produce. Candidates are the audited denominators plus any "n=" the
  // paragraph itself declares (recomputed subsets are not in the table).
  const pairRe = /(\d{1,3}\.\d)%\s*\((\d[\d,]*)\s*(?:people|respondents|persons)\)/g
  const countsFor = (pctValue, n) => Math.abs((pctValue / 100) * n - Math.round((pctValue / 100) * n))
  let pairs = 0
  let unmatched = 0
  for (const paragraph of text.split(/(?<=[.!?])\s+(?=[A-Z])/)) {
    const localDenominators = [...paragraph.matchAll(/\bn\s*=\s*(\d[\d,]*)/g)].map((m) => Number(m[1].replace(/,/g, '')))
    const candidates = [...validDenominators, ...localDenominators]
    for (const m of paragraph.matchAll(pairRe)) {
      pairs += 1
      const pctValue = Number(m[1])
      const count = Number(m[2].replace(/,/g, ''))
      if (pctValue <= 0) continue
      const ok = candidates.some((n) => Math.abs((pctValue / 100) * n - count) <= Math.max(1, n * 0.0008))
      if (!ok) {
        unmatched += 1
        report('number', `${m[0]} matches no denominator in the audited table or the paragraph's own n=`)
      }
    }
  }
  report('info', `${pairs} “X% (N people)” pairs checked (${unmatched} unmatched) against ${validDenominators.size} audited denominators`)

  // Labels quoted verbatim next to a percentage must match the audited value.
  const byLabel = new Map()
  for (const r of master.records) {
    if (!/row_type=CATEGORY/.test(r.Filter || '')) continue
    const label = String(r.Comparison_Group || '').trim()
    if (label.length < 4 || r.Percentage == null) continue
    byLabel.set(label, Number(r.Percentage) * 100)
  }
  let checked = 0
  for (const [label, audited] of byLabel) {
    const quoted = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    for (const m of text.matchAll(new RegExp(`${quoted}[^.%]{0,40}?(\\d{1,3}\\.\\d)%`, 'g'))) {
      checked += 1
      if (Math.abs(Number(m[1]) - audited) > 0.15) {
        report('number', `“${label}” quoted as ${m[1]}% but the audited value is ${audited.toFixed(1)}%`)
      }
    }
  }
  report('info', `${checked} label↔percentage pairs cross-checked against the audited table`)
}

// Output ---------------------------------------------------------------------
const byKind = new Map()
for (const p of problems) {
  if (!byKind.has(p.kind)) byKind.set(p.kind, [])
  byKind.get(p.kind).push(p.detail)
}
for (const [kind, items] of byKind) {
  if (kind === 'info') { for (const i of items) console.log(`· ${i}`); continue }
  console.log(`\n[${kind}] ${items.length}`)
  for (const i of items) console.log(`  - ${i}`)
}
const failures = problems.filter((p) => p.kind !== 'info')
console.log(failures.length ? `\n${failures.length} issue(s) found` : '\nno issues found')
process.exitCode = failures.length ? 1 : 0
