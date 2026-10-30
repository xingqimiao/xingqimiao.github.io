export type ContentLocale = 'zh' | 'en'

export type LocalizedContentResolution = {
  value: string
  effectiveLocale: ContentLocale
  fallback: boolean
}

/**
 * Pick the reader's language when a translation exists.
 *
 * Falls back to the Chinese original and reports `fallback: true`, so callers can
 * tell "no English version yet" apart from "the reader chose Chinese".
 */
export function resolveLocalizedContent(
  requestedLocale: ContentLocale,
  chineseValue: string,
  englishValue?: string | null,
): LocalizedContentResolution {
  if (requestedLocale === 'en' && englishValue) {
    return { value: englishValue, effectiveLocale: 'en', fallback: false }
  }
  return {
    value: chineseValue,
    effectiveLocale: 'zh',
    fallback: requestedLocale === 'en',
  }
}
