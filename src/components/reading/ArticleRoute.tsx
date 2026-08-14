import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import compiledArticles from '@/data/compiled_articles.json'
import storyContentNotes from '@/data/story_content_notes.json'
import type { Locale } from '@/i18n/locale'
import { getArticleHref, normalizeRouteSlug } from '@/lib/articleRoute'
import { stripDuplicateLeadImage } from '@/lib/articleContent'
import { buildArticlePagePresentation } from '@/lib/articlePagePresentation'
import { buildLocalizedMetadata } from '@/lib/localizedMetadata'
import { articleJsonLd } from '@/lib/jsonLd'
import type { LocalizableArticle } from '@/lib/localizedArticle'
import { ReadingArticlePage } from './ReadingArticlePage'

export const ARTICLE_PLACEHOLDER_SLUG = '__placeholder'

export const STORY_DISCLAIMER =
  '内容来自用户匿名投稿，不代表 KiraEqual 立场或支持其观点、行为。经基本筛查与匿名化处理，如有不当请联系report@kiramyao.com。感谢每一位投稿者。'

export function storyDisclaimer(slug: string) {
  const note = (storyContentNotes as Record<string, string | undefined>)[slug]
  return note ? `${STORY_DISCLAIMER}\n\n${note}` : STORY_DISCLAIMER
}

export type SiteArticle = LocalizableArticle & {
  slug: string
  date?: string
  cover_name?: string
  seoDescription?: string
  keywords?: string[]
}

const siteArticles = compiledArticles as SiteArticle[]

export function findSiteArticle(type: string, routeSlug: string) {
  const slug = normalizeRouteSlug(routeSlug)
  return siteArticles.find((article) => article.type === type && article.slug === slug)
}

export function articleStaticParams(type: string) {
  const params = siteArticles
    .filter((article) => article.type === type)
    .map((article) => ({ slug: article.slug }))

  return params.length ? params : [{ slug: ARTICLE_PLACEHOLDER_SLUG }]
}

export function buildArticleRouteMetadata(
  locale: Locale,
  article: SiteArticle,
): Metadata {
  const presentation = buildArticlePagePresentation(locale, article)
  const chinesePath = getArticleHref(article.type, article.slug)
  const seoDescription = article.seoDescription?.trim()
  const keywords = article.keywords?.map(String).filter(Boolean)

  return buildLocalizedMetadata({
    locale,
    chinesePath,
    title: presentation.title,
    description: seoDescription || presentation.description,
    keywords,
    openGraphImage: article.cover_name,
    openGraphImageAlt: presentation.title,
    openGraphType: 'article',
  })
}

export function articleRouteMetadata(
  locale: Locale,
  type: string,
  routeSlug: string,
): Metadata {
  const normalizedSlug = normalizeRouteSlug(routeSlug)
  if (normalizedSlug === ARTICLE_PLACEHOLDER_SLUG) {
    return { title: 'Articles', robots: { index: false, follow: false } }
  }

  const article = findSiteArticle(type, normalizedSlug)
  if (!article) {
    return { title: 'Article not found', robots: { index: false, follow: false } }
  }

  return buildArticleRouteMetadata(locale, article)
}

export function ArticleRouteView({
  locale,
  type,
  routeSlug,
}: {
  locale: Locale
  type: string
  routeSlug: string
}) {
  const normalizedSlug = normalizeRouteSlug(routeSlug)
  if (normalizedSlug === ARTICLE_PLACEHOLDER_SLUG) notFound()

  const article = findSiteArticle(type, normalizedSlug)
  if (!article) notFound()

  const presentation = buildArticlePagePresentation(locale, article)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              type: article.type,
              slug: article.slug,
              title: article.title,
              description: article.seoDescription,
              cover: article.cover_name,
              date: article.date,
            }),
          ),
        }}
      />
      <ReadingArticlePage
        locale={locale}
        backHref={presentation.backHref}
        backLabel={presentation.backLabel}
        categoryLabel={presentation.categoryLabel}
        kicker={presentation.kicker}
        title={presentation.title}
        date={article.date}
        coverName={article.cover_name}
        contentHtml={stripDuplicateLeadImage(presentation.contentHtml, article.cover_name)}
        contentLanguage={presentation.contentLanguage}
        initialTheme={article.type === 'stories' ? 'dark' : 'light'}
        disclaimer={article.type === 'stories' ? storyDisclaimer(article.slug) : undefined}
      />
    </>
  )
}
