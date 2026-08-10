export type ContentLocale = 'zh' | 'en'

export type LocalizedContentResolution = {
  value: string
  effectiveLocale: ContentLocale
  fallback: boolean
}

export function resolveLocalizedContent(
  _requestedLocale: ContentLocale,
  chineseValue: string,
  _englishValue?: string | null,
): LocalizedContentResolution {
  return {
    value: chineseValue,
    effectiveLocale: 'zh',
    fallback: false,
  }
}
