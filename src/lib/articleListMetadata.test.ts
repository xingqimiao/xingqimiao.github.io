import { describe, expect, it } from 'vitest'
import { buildArticleListMetadata } from './articleListMetadata'

const translatedReport = {
  type: 'report',
  title: '中文标题',
  contentHtml: '<p>中文正文</p>',
}

const translatedBlog = {
  type: 'blog',
  title: '中文随笔',
  contentHtml: '<p>中文正文</p>',
}

describe('article list metadata', () => {
  it('publishes the Chinese report index with high-value SEO metadata', () => {
    expect(buildArticleListMetadata('zh', 'report', [translatedReport])).toMatchObject({
      title: '跨性别研究与调研报告 · 核心数据',
      description: expect.stringContaining('跨性别'),
      alternates: {
        canonical: '/report',
      },
      robots: { index: true, follow: true },
    })
  })

  it('publishes the Chinese blog index with metadata', () => {
    expect(buildArticleListMetadata('zh', 'blog', [translatedBlog])).toMatchObject({
      title: '猫窝 · 随笔与社群札记',
      alternates: {
        canonical: '/cat-cave',
      },
      robots: { index: true, follow: true },
    })
  })
})
