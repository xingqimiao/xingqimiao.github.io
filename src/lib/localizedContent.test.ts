import { describe, expect, it } from 'vitest'
import { resolveLocalizedContent } from './localizedContent'

describe('localized content contract', () => {
  it('keeps every request on the Chinese value', () => {
    for (const locale of ['zh', 'en'] as const) {
      expect(resolveLocalizedContent(locale, '中文正文', 'English body')).toEqual({
        value: '中文正文',
        effectiveLocale: 'zh',
        fallback: false,
      })
    }
  })
})
