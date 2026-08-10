import { describe, expect, it } from 'vitest'
import { buildArticleRouteMetadata } from './ArticleRoute'

const report = {
  type: 'report',
  slug: 'sample-report',
  title: '中文报告',
  desc: '中文摘要',
  contentHtml: '<p>中文正文</p>',
  cover_name: '/pic/report/cover.webp',
}

describe('Chinese-only article route metadata', () => {
  it('publishes the Chinese article as the only canonical route', () => {
    expect(buildArticleRouteMetadata('zh', report)).toMatchObject({
      title: '中文报告',
      description: '中文摘要',
      alternates: { canonical: '/report/sample-report' },
      robots: { index: true, follow: true },
      openGraph: {
        url: '/report/sample-report',
        locale: 'zh_CN',
      },
    })
  })

  it('does not expose English alternates even when translation data exists', () => {
    const metadata = buildArticleRouteMetadata('zh', {
      ...report,
      englishTitle: 'English report',
      englishDescription: 'English summary',
      englishContentHtml: '<p>English body</p>',
    } as unknown as typeof report)

    expect(metadata).toMatchObject({
      title: '中文报告',
      description: '中文摘要',
      alternates: { canonical: '/report/sample-report' },
      robots: { index: true, follow: true },
      openGraph: {
        url: '/report/sample-report',
        locale: 'zh_CN',
        images: [{ url: '/pic/report/cover.webp', alt: '中文报告' }],
      },
    })
    expect(metadata.alternates).not.toHaveProperty('languages')
  })

  it('uses the Chinese category description for Stories without a summary contract', () => {
    const metadata = buildArticleRouteMetadata('zh', {
      type: 'stories',
      slug: 'quiet-river-lantern',
      title: '一个故事',
      contentHtml: '<p>中文正文</p>',
      englishTitle: 'A story',
      englishContentHtml: '<p>English body</p>',
    } as unknown as typeof report)

    expect(metadata.description).toBe('来自 KiraMyao Equal 社群的匿名故事。')
  })

  it('prefers the SEO description and emits keywords when present', () => {
    const metadata = buildArticleRouteMetadata('zh', {
      ...report,
      seoDescription: '搜索优化的描述',
      keywords: ['跨性别', '调研'],
    })

    expect(metadata).toMatchObject({
      title: '中文报告',
      description: '搜索优化的描述',
      keywords: ['跨性别', '调研'],
    })
  })

  it('omits keywords and falls back to the summary when no SEO fields exist', () => {
    const metadata = buildArticleRouteMetadata('zh', report)

    expect(metadata.description).toBe('中文摘要')
    expect(metadata).not.toHaveProperty('keywords')
  })
})
