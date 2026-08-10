import { describe, expect, it } from 'vitest'
import { htmlLanguage, stripLocalePath, toLocalePath, uiDictionary, type Locale } from './locale'

describe('locale public contract', () => {
  it('accepts the supported locale identifiers', () => {
    const supported: Locale[] = ['zh', 'en']
    expect(supported.length).toBe(2)
  })

  it('maps every locale to the Chinese HTML language tag', () => {
    expect(htmlLanguage('zh')).toBe('zh-CN')
    expect(htmlLanguage('en')).toBe('zh-CN')
  })

  it('keeps Chinese paths unchanged for locale helpers', () => {
    expect(toLocalePath('/stories/猫?from=/zh#quote', 'zh')).toBe('/stories/猫?from=/zh#quote')
    expect(toLocalePath('/', 'zh')).toBe('/')
    expect(toLocalePath('/en/stories/', 'zh')).toBe('/en/stories/')
    expect(stripLocalePath('/join')).toBe('/join')
    expect(stripLocalePath('/en')).toBe('/en')
  })

  it('exposes a single site dictionary with English labels on the Chinese site', () => {
    expect(uiDictionary.navigation).toEqual({
      stories: 'Stories',
      reports: 'Reports',
      documents: 'Documents',
      projects: 'Projects',
      catCave: 'Cat Cave',
      join: 'Join Us',
    })
    expect(uiDictionary.accessibility).toEqual({
      primaryNavigation: 'Primary navigation',
      mobileNavigation: 'Mobile navigation',
      footerNavigation: 'Footer navigation',
      openMenu: 'Open navigation menu',
      closeMenu: 'Close navigation menu',
    })
    expect(uiDictionary).not.toHaveProperty('zh')
    expect(uiDictionary).not.toHaveProperty('en')
  })
})
