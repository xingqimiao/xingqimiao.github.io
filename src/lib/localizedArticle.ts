import type { Locale } from '../i18n/locale'

export type LocalizableArticle = {
  type: string
  title: string
  contentHtml: string
  desc?: string | null
}

export type LocalizedArticleResolution = {
  title: string
  description: string | undefined
  contentHtml: string
  effectiveLocale: Locale
  fallback: boolean
}

function nonBlank(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function resolveLocalizedArticle(
  _requestedLocale: Locale,
  article: LocalizableArticle,
): LocalizedArticleResolution {
  return {
    title: article.title,
    description: nonBlank(article.desc) ? article.desc : undefined,
    contentHtml: article.contentHtml,
    effectiveLocale: 'zh',
    fallback: false,
  }
}
