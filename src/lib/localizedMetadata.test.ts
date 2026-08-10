import { describe, expect, it } from 'vitest'
import { buildLocalizedMetadata } from './localizedMetadata'

describe('localized metadata contract', () => {
  it('publishes a complete, indexable Chinese article with a single canonical route', () => {
    expect(
      buildLocalizedMetadata({
        locale: 'zh',
        chinesePath: '/stories/a-story',
        title: '中文标题',
        description: '中文说明',
        openGraphImage: '/pic/stories/a-story.webp',
        openGraphImageAlt: '中文标题封面',
        openGraphType: 'article',
      }),
    ).toEqual({
      title: '中文标题',
      description: '中文说明',
      alternates: {
        canonical: '/stories/a-story',
      },
      openGraph: {
        type: 'article',
        title: '中文标题',
        description: '中文说明',
        url: '/stories/a-story',
        siteName: 'KiraMyao Equal',
        locale: 'zh_CN',
        images: [
          {
            url: '/pic/stories/a-story.webp',
            alt: '中文标题封面',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: '中文标题',
        description: '中文说明',
        images: [
          {
            url: '/pic/stories/a-story.webp',
            alt: '中文标题封面',
          },
        ],
      },
      robots: {
        index: true,
        follow: true,
      },
    })
  })

  it('never emits language alternates, alternate locales or English paths', () => {
    const metadata = buildLocalizedMetadata({
      locale: 'zh',
      chinesePath: '/report/sample-report',
      title: '中文报告',
      description: '中文摘要',
    })

    expect(metadata.alternates).toEqual({ canonical: '/report/sample-report' })
    expect(metadata.alternates).not.toHaveProperty('languages')
    expect(metadata.openGraph).not.toHaveProperty('alternateLocale')
    expect(JSON.stringify(metadata)).not.toContain('/en')
  })

  it('emits keywords only when a non-empty list is provided', () => {
    const withKeywords = buildLocalizedMetadata({
      locale: 'zh',
      chinesePath: '/report/sample-report',
      title: '中文报告',
      description: '搜索优化的描述',
      keywords: ['跨性别', '调研'],
    })
    const withoutKeywords = buildLocalizedMetadata({
      locale: 'zh',
      chinesePath: '/report/sample-report',
      title: '中文报告',
      description: '搜索优化的描述',
    })

    expect(withKeywords.keywords).toEqual(['跨性别', '调研'])
    expect(withoutKeywords).not.toHaveProperty('keywords')
  })
})
