import { describe, expect, it } from 'vitest'
import { resolveLocalizedContent } from './localizedContent'

describe('localized content contract', () => {
  it('serves the English body to an English reader when a translation exists', () => {
    expect(resolveLocalizedContent('en', '中文正文', 'English body')).toEqual({
      value: 'English body',
      effectiveLocale: 'en',
      fallback: false,
    })
  })

  it('keeps a Chinese reader on the Chinese original', () => {
    expect(resolveLocalizedContent('zh', '中文正文', 'English body')).toEqual({
      value: '中文正文',
      effectiveLocale: 'zh',
      fallback: false,
    })
  })

  it('falls back to Chinese and says so when no translation exists', () => {
    expect(resolveLocalizedContent('en', '中文正文')).toEqual({
      value: '中文正文',
      effectiveLocale: 'zh',
      fallback: true,
    })
  })
})
