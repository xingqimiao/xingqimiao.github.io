import { describe, expect, it } from 'vitest'
import { buildArticlePagePresentation } from './articlePagePresentation'

const report = {
  type: 'report',
  title: '中文报告',
  desc: '中文摘要',
  contentHtml: '<p>中文正文</p>',
}

describe('article page presentation', () => {
  it('builds a Chinese report presentation with the Chinese section copy', () => {
    expect(buildArticlePagePresentation('zh', report)).toEqual({
      title: '中文报告',
      description: '中文摘要',
      contentHtml: '<p>中文正文</p>',
      contentLanguage: 'zh-CN',
      backHref: '/report',
      backLabel: '← Back to reports',
      categoryLabel: '报告',
      kicker: 'KiraEqual 报告',
    })
  })

  it('uses a category description for Stories without restoring a summary field', () => {
    const result = buildArticlePagePresentation('zh', {
      type: 'stories',
      title: '一个故事',
      contentHtml: '<p>中文正文</p>',
    })

    expect(result).toMatchObject({
      title: '一个故事',
      description: '来自 KiraMyao Equal 社群的匿名故事。',
      backHref: '/stories',
      backLabel: '← Back to stories',
      categoryLabel: '故事',
    })
    expect(result).not.toHaveProperty('summary')
  })
})
