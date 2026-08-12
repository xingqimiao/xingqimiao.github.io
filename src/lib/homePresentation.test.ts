import { describe, expect, it } from 'vitest'
import { buildHomePresentation, homeArticleTypeLabel } from './homePresentation'

describe('home presentation', () => {
  it('keeps the public Join CTA in English on the Chinese-content homepage', () => {
    expect(buildHomePresentation('zh', [], []).joinLabel).toBe('Join Us')
  })

  it('provides Chinese hero and action copy without English content', () => {
    const result = buildHomePresentation('zh', [
      { id: 1, title: '年度处境调查', desc: '中文说明', cover_name: '/cover.png', size: 'large' },
    ], [])

    expect(result).toMatchObject({
      description: 'KiraEqual是一个关注性别多元群体的独立研究、公共知识与数字公益项目',
      actionHeading: '我们的行动',
      insightHeading: '最新洞察',
      actions: [{ title: '年度处境调查', desc: '中文说明', contentLanguage: 'zh-CN' }],
    })
  })

  it('labels homepage article category chips in Chinese', () => {
    expect(homeArticleTypeLabel('zh', 'report')).toBe('报告')
    expect(homeArticleTypeLabel('zh', 'unknown')).toBe('unknown')
  })

  it('builds featured articles from Chinese source with no fallbacks', () => {
    const result = buildHomePresentation('zh', [], [
      {
        type: 'report',
        slug: 'translated',
        title: '中文一',
        desc: '中文摘要一',
        contentHtml: '<p>中文一</p>',
      },
      {
        type: 'blog',
        slug: 'fallback',
        title: '中文二',
        desc: '中文摘要二',
        contentHtml: '<p>中文二</p>',
      },
    ])

    expect(result.featuredArticles).toMatchObject([
      { title: '中文一', desc: '中文摘要一', contentLanguage: 'zh-CN' },
      { title: '中文二', desc: '中文摘要二', contentLanguage: 'zh-CN' },
    ])
    expect(result.articleFallbackCount).toBe(0)
  })
})
