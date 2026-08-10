import { describe, expect, it } from 'vitest'
import { resolveLocalizedArticle } from './localizedArticle'

const chineseArticle = {
  type: 'report',
  title: '中文标题',
  desc: '中文摘要',
  contentHtml: '<p>中文正文</p>',
}

describe('localized article resolution', () => {
  it('always resolves the Chinese source for any requested locale', () => {
    expect(resolveLocalizedArticle('zh', chineseArticle)).toEqual({
      title: '中文标题',
      description: '中文摘要',
      contentHtml: '<p>中文正文</p>',
      effectiveLocale: 'zh',
      fallback: false,
    })
  })

  it('leaves the description undefined when a Chinese article has no summary', () => {
    const story = {
      type: 'stories',
      title: '中文故事',
      contentHtml: '<p>中文正文</p>',
    }

    expect(resolveLocalizedArticle('zh', story)).toMatchObject({
      title: '中文故事',
      description: undefined,
      effectiveLocale: 'zh',
      fallback: false,
    })
  })
})
