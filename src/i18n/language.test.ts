import { describe, expect, it } from 'vitest'
import { isChineseLanguage, resolveInitialLanguage } from './language'

describe('language detection', () => {
  it('recognises every common Chinese language tag', () => {
    const chineseTags = ['zh', 'zh-CN', 'zh-Hans', 'zh-Hant', 'zh-TW', 'zh-HK', 'zh-MO', 'zh-SG', 'cmn', 'cn', 'ZH-cn']
    for (const tag of chineseTags) {
      expect(isChineseLanguage(tag), tag).toBe(true)
    }
  })

  it('rejects non-Chinese tags', () => {
    const otherTags = ['en', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', '', 'english']
    for (const tag of otherTags) {
      expect(isChineseLanguage(tag), tag).toBe(false)
    }
  })

  it('defaults to Chinese when any listed language is Chinese', () => {
    expect(resolveInitialLanguage(['zh-CN', 'en-US'])).toBe('zh')
    expect(resolveInitialLanguage(['en-US', 'zh-TW'])).toBe('zh')
    expect(resolveInitialLanguage(['ja-JP', 'zh-Hans'])).toBe('zh')
  })

  it('defaults to English when no Chinese language is present', () => {
    expect(resolveInitialLanguage(['en-US'])).toBe('en')
    expect(resolveInitialLanguage(['en-GB', 'fr-FR'])).toBe('en')
    expect(resolveInitialLanguage([])).toBe('en')
  })
})
