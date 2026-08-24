import type { Locale } from './locale'

export const READING_LANGUAGE_KEY = 'kira-reading-language'

// Chinese conditions: zh, zh-CN, zh-Hant, zh-TW, zh-HK, zh-MO, zh-SG, cmn, cn…
const CHINESE_LANGUAGE = /^(?:zh|cn|cmn)(?:[-_].*)?$/i

export function isChineseLanguage(language: string): boolean {
  return CHINESE_LANGUAGE.test(language.trim())
}

// Any Chinese match wins: a reader with zh anywhere in their language list
// stays on the Chinese original; everyone else defaults to the translation.
export function resolveInitialLanguage(languages: readonly string[]): Locale {
  for (const language of languages) {
    if (isChineseLanguage(language)) return 'zh'
  }
  return 'en'
}

export function getStoredLanguage(): Locale | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(READING_LANGUAGE_KEY)
    return stored === 'en' || stored === 'zh' ? stored : null
  } catch {
    return null
  }
}

export function storeLanguage(language: Locale) {
  try {
    window.localStorage.setItem(READING_LANGUAGE_KEY, language)
  } catch {
    /* storage unavailable — the preference still applies for this session */
  }
}

export function detectInitialLanguage(): Locale {
  const stored = getStoredLanguage()
  if (stored) return stored
  if (typeof navigator !== 'undefined') {
    const languages = navigator.languages?.length
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : []
    return resolveInitialLanguage(languages)
  }
  return 'zh'
}

export function applyDocumentLanguage(language: Locale) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'
}
