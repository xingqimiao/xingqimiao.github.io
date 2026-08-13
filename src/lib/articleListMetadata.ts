import type { Metadata } from 'next'
import type { Locale } from '../i18n/locale'
import {
  articleListCopy,
  type ArticleListType,
} from './articleListPresentation'
import { getArticleSectionPath } from './articleRoute'
import type { LocalizableArticle } from './localizedArticle'
import { buildLocalizedMetadata } from './localizedMetadata'

export function buildArticleListMetadata(
  locale: Locale,
  type: ArticleListType,
  articles: readonly LocalizableArticle[],
): Metadata {
  const copy = articleListCopy(locale, type)
  const chinesePath = `/${getArticleSectionPath(type)}`

  return buildLocalizedMetadata({
    locale,
    chinesePath,
    title: copy.metadataTitle,
    description: copy.metadataDescription,
    openGraphImage: '/pic/index/og-home.png',
    openGraphImageAlt: copy.metadataTitle,
  })
}
