import { describe, expect, it } from 'vitest'
import { buildArticleListMetadata } from './articleListMetadata'

const translatedReport = {
  type: 'report',
  title: '中文标题',
  contentHtml: '<p>中文正文</p>',
}

describe('article list metadata', () => {
  it('publishes the Chinese report index with a single canonical route', () => {
    expect(buildArticleListMetadata('zh', 'report', [translatedReport])).toMatchObject({
      title: '研究、数据与报告',
      alternates: {
        canonical: '/report',
      },
      robots: { index: true, follow: true },
    })
  })
})
