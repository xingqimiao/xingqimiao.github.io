import { describe, expect, it } from 'vitest'
import { buildSiteMetadata } from './siteMetadata'

describe('root metadata locale boundary', () => {
  it('keeps Chinese defaults and keywords in every document root', () => {
    for (const locale of ['zh', 'en'] as const) {
      const metadata = buildSiteMetadata(locale)

      expect(metadata.description).toContain('性别多元群体')
      expect(metadata.keywords).toContain('跨性别')
      expect(metadata.openGraph).toMatchObject({ locale: 'zh_CN' })
    }
  })
})
