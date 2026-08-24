import { describe, expect, it } from 'vitest'
import { parseArticleSource } from './compile-articles.mjs'

describe('Front Matter content compiler', () => {
  it('compiles Story Markdown while removing every summary and English field', () => {
    const article = parseArticleSource(`---\ntitle: 一只猫\nslug: "12345678"\nyear: "2026"\nregion: 浙江\ndescription: 不应存在\nseoDescription: 搜索摘要\nkeywords: [猫, 经历]\nenglishTitle: A Cat\nenglishDescription: Must not exist\nenglishMarkdown: |\n  # Full story\n\n  ![image](/pic/stories/cat.webp)\n---\n# 正文`, 'fallback', 'stories', { desc: '旧故事摘要', englishDescription: 'Old summary' })
    expect(article).toMatchObject({ slug: '12345678', date: '2026', seoDescription: '搜索摘要', keywords: ['猫', '经历'] })
    expect(article.contentHtml).toContain('<h1 id="正文">正文</h1>')
    expect(article).not.toHaveProperty('desc')
    expect(article).not.toHaveProperty('englishTitle')
    expect(article).not.toHaveProperty('englishDescription')
    expect(article).not.toHaveProperty('englishContentHtml')
    expect(article).not.toHaveProperty('region')
  })

  it('marks stories commentable by default and honors comments: false', () => {
    const on = parseArticleSource('---\ntitle: 猫\nyear: "2026"\n---\n正文', 'a', 'stories')
    const off = parseArticleSource('---\ntitle: 猫\nyear: "2026"\ncomments: false\n---\n正文', 'b', 'stories')
    const report = parseArticleSource('---\ntitle: 报告\ndate: "2026"\n---\n正文', 'r', 'report')
    expect(on.allowComments).toBe(true)
    expect(off.allowComments).toBe(false)
    expect(report.allowComments).toBeUndefined()
  })
  it('preserves existing metadata when a legacy Markdown file has no Front Matter', () => {
    expect(parseArticleSource('# 正文', 'new-slug', 'blog', { title: '原标题', desc: '原摘要', date: '2026.05', cover_name: '/cover.png' })).toMatchObject({ slug: 'new-slug', title: '原标题', desc: '原摘要', date: '2026.05', cover_name: '/cover.png' })
  })

  it('keeps dated summaries and never compiles English fields', () => {
    const article = parseArticleSource(`---\ntitle: 报告\ndescription: 中文摘要\nenglishDescription: English summary\nenglishMarkdown: |\n  ## English report\n\n  [source](https://example.test)\n---\n# 中文报告`, 'report', 'report')
    expect(article).toMatchObject({ desc: '中文摘要' })
    expect(article.contentHtml).toContain('中文报告')
    expect(article).not.toHaveProperty('englishDescription')
    expect(article).not.toHaveProperty('englishContentHtml')
  })

  it('compiles gridSpan front matter into grid_span for non-Stories, defaulting to normal', () => {
    const featured = parseArticleSource(`---\ntitle: 报告\ndate: "2026-08-10"\ndescription: 摘要\ngridSpan: featured\n---\n# 正文`, 'report', 'report')
    expect(featured).toMatchObject({ grid_span: 'featured' })

    const normal = parseArticleSource(`---\ntitle: 报告\ndate: "2026-08-10"\ndescription: 摘要\n---\n# 正文`, 'other', 'blog')
    expect(normal).toMatchObject({ grid_span: 'normal' })

    const legacyKey = parseArticleSource(`---\ntitle: 报告\ndate: "2026-08-10"\ndescription: 摘要\ngrid_span: featured\n---\n# 正文`, 'legacy', 'documents')
    expect(legacyKey).toMatchObject({ grid_span: 'featured' })

    // front matter is the single source of truth: a missing gridSpan/grid_span key falls back to normal,
    // it does NOT inherit a previously-compiled featured value from the fallback object.
    const noFallback = parseArticleSource(`---\ntitle: 报告\ndate: "2026-08-10"\ndescription: 摘要\n---\n# 正文`, 'keep', 'report', { grid_span: 'featured' })
    expect(noFallback).toMatchObject({ grid_span: 'normal' })
  })

  it('gives every heading a stable lowercase id so in-page anchors resolve', () => {
    const article = parseArticleSource('## 转学\n\n### ZTZJ\n\n#### 睿', 'anchor-test', 'stories')
    expect(article.contentHtml).toContain('<h2 id="转学">转学</h2>')
    expect(article.contentHtml).toContain('<h3 id="ztzj">ZTZJ</h3>')
    expect(article.contentHtml).toContain('<h4 id="睿">睿</h4>')
  })

  it('repairs legacy indented Chinese prose while preserving explicit code blocks', () => {
    const article = parseArticleSource(`    这是一个被旧版编辑器整体缩进的中文自然段，其中包含 **需要保留的重点**，并且应当继续作为正常文章正文显示，而不是撑破阅读器的代码块。

\`\`\`js
const label = "这是真实代码。"
\`\`\``, 'legacy-report', 'report')

    expect(article.contentHtml).toContain('<p>这是一个被旧版编辑器整体缩进的中文自然段')
    expect(article.contentHtml).toContain('<strong>需要保留的重点</strong>')
    expect(article.contentHtml).toContain('<pre><code class="language-js">')
    expect(article.contentHtml).toContain('const label = &quot;这是真实代码。&quot;')
    expect(article.contentHtml.match(/<pre><code/g)).toHaveLength(1)
  })
})
