#!/usr/bin/env node
/**
 * Rebuild every figure in the reader edition (Chinese and English) as a
 * **live HTML chart**.
 *
 * Why: the bitmap figures (FIG001–026, FIG030) were English text painted into
 * pixel boxes shaped for Chinese labels, so wrapped labels collided. Charting in
 * the DOM removes that class of bug entirely — the layout engine sizes rows from
 * the real text — and keeps the same charts sharp on screen and in print.
 *
 * Also: all in-chart small print (sample-size badges, multi-select chips,
 * footnotes, "source/finding" lines, rho/p annotations) is removed. The report
 * body already states every number immediately around each figure; repeating it
 * inside the artwork only made the charts noisy and unreadable.
 *
 * Sources (read-only):
 *   survey_report_project/.runtime/stage3_master_snapshot_v001.json  (Result_ID rows)
 *   survey_report_project/scripts/stage4_panels_v002.json            (figure → rows)
 *   survey_report_project/07_qa/16_age_mental_health_exploratory_analysis_v001.json
 *   translations/en/report/_fig_dict.json                            (EN strings)
 *
 * Targets: content/report/ and translations/en/report/ reader editions.
 * Idempotent: re-running replaces each <figure id="FIGxxx"> block wholesale.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const surveyRoot = process.env.SURVEY_PROJECT || 'E:/dev-kiraequalcom/survey_report_project'

const SNAPSHOT = path.join(surveyRoot, '.runtime/stage3_master_snapshot_v001.json')
const PANELS_FILE = path.join(surveyRoot, 'scripts/stage4_panels_v002.json')
const AGE_FILE = path.join(surveyRoot, '07_qa/16_age_mental_health_exploratory_analysis_v001.json')
const DICT_FILE = path.join(root, 'translations/en/report/_fig_dict.json')
const TARGETS = [
  { locale: 'zh', md: path.join(root, 'content/report/2026-transgender-life-survey-reader-edition.md') },
  { locale: 'en', md: path.join(root, 'translations/en/report/2026-transgender-life-survey-reader-edition.md') },
]

const master = JSON.parse(await readFile(SNAPSHOT, 'utf8'))
const byResultId = new Map(master.records.map((r) => [r.Result_ID, r]))
const panels = JSON.parse(await readFile(PANELS_FILE, 'utf8')).panels
const ageAnalysis = JSON.parse(await readFile(AGE_FILE, 'utf8'))
const dict = JSON.parse(await readFile(DICT_FILE, 'utf8'))

// --- text helpers -----------------------------------------------------------
const escapeHtml = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** The dictionary stores HTML-escaped strings (it was built for an HTML swap); undo that
 *  before emitting, otherwise values print as literal "&lt;". */
const unescapeHtml = (s) =>
  String(s ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')

/** Labels carry editorial redactions in the source; keep them identical to the report. */
const LABEL_FIXES = [
  ['线上私域药商（例如推特QQ上面的）', '线上私域药商'],
  ['购买他人自制的药物（如社群内兜售的自制凝胶等）', '购买他人自制的药物'],
]
const cleanLabel = (value) => {
  let out = String(value ?? '')
  for (const [from, to] of LABEL_FIXES) out = out.replace(from, to)
  return out
}

const untranslated = new Set()
/** English lookup; the Chinese edition keeps the source wording verbatim. */
function trEn(value) {
  const raw = String(value ?? '')
  const hit = dict[raw] ?? dict[escapeHtml(raw)]
  if (hit == null) {
    untranslated.add(raw)
    return raw
  }
  return unescapeHtml(hit)
}
let tr = (value) => String(value ?? '')

const pct = (fraction) => `${(Number(fraction || 0) * 100).toFixed(1)}%`

// --- chapter colour identity (same palette as the printed report) -----------
const CHAPTER_COLORS = {
  2: '#5B6E84', 3: '#8B3F46', 4: '#B8784E', 5: '#A35A45',
  6: '#3F6F66', 7: '#7A5A3A', 8: '#6A5F8E', 9: '#4A5A6E', 10: '#5D7A54',
}
const FIG_CHAPTER = {
  FIG001: 2, FIG002: 3, FIG003: 3, FIG004: 3,
  FIG005: 4, FIG006: 4, FIG007: 4, FIG008: 4, FIG009: 4, FIG010: 4,
  FIG011: 5, FIG012: 5, FIG013: 5, FIG014: 5, FIG015: 5,
  FIG016: 6, FIG017: 6, FIG018: 6,
  FIG019: 7, FIG020: 8, FIG021: 8,
  FIG022: 9, FIG023: 9,
  FIG024: 10, FIG025: 10, FIG026: 10,
}
const accentFor = (figureId) => CHAPTER_COLORS[FIG_CHAPTER[figureId]] || '#8B3F46'

/** Five tonal steps of the chapter hue, for donut slices. */
function pieTonal(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255
  const l0 = (mx + mn) / 2
  const d = mx - mn
  let h = 0, s = 0
  if (d > 0) {
    s = l0 > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
    if (mx === r / 255) h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6
    else if (mx === g / 255) h = ((b / 255 - r / 255) / d + 2) / 6
    else h = ((r / 255 - g / 255) / d + 4) / 6
  }
  const toHex = (v) => Math.round(v).toString(16).padStart(2, '0')
  const hsl = (L) => {
    const c = (1 - Math.abs(2 * L - 1)) * (s || 0)
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = L - c / 2
    const i = Math.floor(h * 6)
    const [rr, gg, bb] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][i % 6]
    return `#${toHex((rr + m) * 255)}${toHex((gg + m) * 255)}${toHex((bb + m) * 255)}`
  }
  return [hsl(0.26), hsl(0.4), hsl(0.54), hsl(0.68), hsl(0.8)]
}

// --- chart renderers --------------------------------------------------------
// Bars are "label above, full-width track below": English category labels are
// long and multilingual, and a fixed label column forces 3–4 line wraps that
// disconnect the text from its bar. One label line + one full-width bar keeps
// every row equally scannable.
const barRowsHtml = (rows) =>
  rows
    .map(
      (row) => `<div class="chart-row">
<span class="chart-row-head"><span class="chart-label">${escapeHtml(row.label)}</span><span class="chart-value">${escapeHtml(row.value)}</span></span>
<span class="chart-track"><span class="chart-fill" style="width:${row.width.toFixed(1)}%"></span></span>
</div>`,
    )
    .join('\n')

/** Compact variant for small multiples: short fixed labels can stay inline. */
const compactRowsHtml = (rows) =>
  rows
    .map(
      (row) => `<div class="chart-row chart-row--inline">
<span class="chart-label">${escapeHtml(row.label)}</span>
<span class="chart-track"><span class="chart-fill" style="width:${row.width.toFixed(1)}%"></span></span>
<span class="chart-value">${escapeHtml(row.value)}</span>
</div>`,
    )
    .join('\n')

function barFigure({ id, title, rows }) {
  return `<figure class="report-figure chart-figure" id="${id}" role="figure" aria-label="${escapeHtml(title)}">
<figcaption class="chart-title">${escapeHtml(title)}</figcaption>
<div class="chart-bars" style="--chart-accent:${accentFor(id)}">
${barRowsHtml(rows)}
</div>
</figure>`
}

function pieFigure({ id, title, rows }) {
  const colors = pieTonal(accentFor(id))
  // SVG arcs rather than conic-gradient: identical look, but exports as plain
  // vector strokes so every PDF viewer renders it the same way.
  const R = 46
  let cursor = 0
  const arcs = rows
    .map((row, i) => {
      const start = cursor
      cursor += row.pct
      const dash = Math.max(row.pct - 0.4, 0)
      const color = colors[i % colors.length]
      return `<circle cx="60" cy="60" r="${R}" fill="none" stroke="${color}" stroke-width="17" pathLength="100" stroke-dasharray="${dash.toFixed(2)} ${(100 - dash).toFixed(2)}" stroke-dashoffset="${(-start).toFixed(2)}"></circle>`
    })
    .join('\n')
  const legend = rows
    .map(
      (row, i) => `<li><span class="chart-swatch" style="background:${colors[i % colors.length]}"></span><span class="chart-legend-label">${escapeHtml(row.label)}</span><span class="chart-legend-value">${escapeHtml(row.value)}</span></li>`,
    )
    .join('\n')
  return `<figure class="report-figure chart-figure" id="${id}" role="figure" aria-label="${escapeHtml(title)}">
<figcaption class="chart-title">${escapeHtml(title)}</figcaption>
<div class="chart-pie" style="--chart-accent:${accentFor(id)}">
<svg class="chart-donut" viewBox="0 0 120 120" role="img" aria-hidden="true">
<g transform="rotate(-90 60 60)">
${arcs}
</g>
</svg>
<ul class="chart-legend">
${legend}
</ul>
</div>
</figure>`
}

const AGE_LABELS_EN = {
  '12-15岁': '<16',
  '16-17岁': '16–17',
  '18-22岁': '18–22',
  '23-29岁': '23–29',
  '30岁及以上': '30+',
}
const AGE_LABELS_ZH = {
  '12-15岁': '12–15岁',
  '16-17岁': '16–17岁',
  '18-22岁': '18–22岁',
  '23-29岁': '23–29岁',
  '30岁及以上': '30岁及以上',
}
let AGE_LABELS = AGE_LABELS_EN
let AGE_TITLE = 'Age and mental health'
let AGE_ARIA = 'psychological distress and positive well-being across five age groups'
const AGE_ORDER = ['12-15岁', '16-17岁', '18-22岁', '23-29岁', '30岁及以上']

function ageMentalFigure() {
  const panelsHtml = ageAnalysis.outcomes
    .map((outcome) => {
      const rows = AGE_ORDER.map((band) => {
        const group = outcome.five_age_bands.groups.find((g) => g.group === band)
        const value = group?.selected_pct
        return {
          label: AGE_LABELS[band] || band,
          value: value == null ? '—' : `${Number(value).toFixed(1)}%`,
          pct: Number(value || 0),
          width: Number(value || 0),
        }
      })
      return `<div class="chart-panel">
<div class="chart-panel-title">${escapeHtml(tr(outcome.label))}</div>
<div class="chart-bars chart-bars--compact">
${compactRowsHtml(rows)}
</div>
</div>`
    })
    .join('\n')

  const title = AGE_TITLE
  return `<figure class="report-figure chart-figure" id="FIG030" role="figure" aria-label="${escapeHtml(title)} · ${AGE_ARIA}">
<figcaption class="chart-title">${escapeHtml(title)}</figcaption>
<div class="chart-multi" style="--chart-accent:${CHAPTER_COLORS[8]}">
${panelsHtml}
</div>
</figure>`
}

// --- source rows ------------------------------------------------------------
function figureFromPanel(panel) {
  const rows = panel.rows
    .map((id) => byResultId.get(id))
    .filter(Boolean)
    .sort((a, b) => (b.Percentage ?? 0) - (a.Percentage ?? 0))
    .map((record) => {
      const fraction = Number(record.Percentage || 0)
      return {
        label: tr(cleanLabel(record.Comparison_Group)),
        value: pct(fraction),
        pct: fraction * 100,
        width: Math.min(fraction * 100, 100),
      }
    })
  return { id: panel.figure_id, title: tr(panel.panel_title), rows }
}

// --- rewrite the markdown (both editions) -----------------------------------
const LOCALES = {
  zh: {
    ageLabels: AGE_LABELS_ZH,
    ageTitle: '年龄与心理健康',
    ageAria: '五个年龄组的心理困扰与正向幸福感',
    translate: (value) => String(value ?? ''),
  },
  en: {
    ageLabels: AGE_LABELS_EN,
    ageTitle: 'Age and mental health',
    ageAria: 'psychological distress and positive well-being across five age groups',
    translate: trEn,
  },
}

for (const target of TARGETS) {
  const config = LOCALES[target.locale]
  tr = config.translate
  AGE_LABELS = config.ageLabels
  AGE_TITLE = config.ageTitle
  AGE_ARIA = config.ageAria

  let md = await readFile(target.md, 'utf8')
  const applied = []
  const missingFigures = []

  for (const panel of panels) {
    const data = figureFromPanel(panel)
    if (!data.rows.length) throw new Error(`${data.id}: no category rows`)
    const html = panel.chart_type === 'pie' ? pieFigure(data) : barFigure(data)
    const pattern = new RegExp(`<figure[^>]*\\bid="${data.id}"[^>]*>[\\s\\S]*?</figure>`)
    if (!pattern.test(md)) { missingFigures.push(data.id); continue }
    md = md.replace(pattern, html)
    applied.push(`${data.id}:${panel.chart_type}`)
  }

  {
    const html = ageMentalFigure()
    const pattern = /<figure[^>]*\bid="FIG030"[^>]*>[\s\S]*?<\/figure>/
    if (pattern.test(md)) {
      md = md.replace(pattern, html)
      applied.push('FIG030:multi')
    } else {
      missingFigures.push('FIG030')
    }
  }

  // Cross-comparison figures are already DOM; strip their in-chart annotation
  // rows (n / rho / adjusted p and the long figure note). The prose beside each
  // one carries the numbers that matter — nothing is re-stated in the artwork.
  let strippedStats = 0
  md = md.replace(/<div class="xstat">[\s\S]*?<\/div>/g, () => { strippedStats += 1; return '' })
  let strippedFoot = 0
  md = md.replace(/<div class="xfoot">[\s\S]*?<\/div>/g, () => { strippedFoot += 1; return '' })

  await writeFile(target.md, md, 'utf8')
  console.log(`[${target.locale}] figures rebuilt: ${applied.length} (${applied.filter((a) => a.endsWith(':pie')).length} donuts); annotations removed: ${strippedStats} xstat, ${strippedFoot} xfoot`)
  if (missingFigures.length) console.log(`[${target.locale}] !! not found in markdown: ${missingFigures.join(', ')}`)
}

if (untranslated.size) {
  console.log(`!! untranslated strings (${untranslated.size}):`)
  for (const s of untranslated) console.log(`   ${JSON.stringify(s)}`)
  process.exitCode = 1
}
