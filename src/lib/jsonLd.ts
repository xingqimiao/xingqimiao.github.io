import globalConfig from '@/data/global_config.json'
import { getArticleHref } from '@/lib/articleRoute'

const BASE_URL = String(globalConfig.website_url || 'https://kiramyao.com').replace(/\/+$/, '')

/** "2026" -> "2026-01-01", "2026.08.10" -> "2026-08-10"; invalid -> undefined */
export function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`
  const parsed = new Date(trimmed.replaceAll('.', '-'))
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10)
}

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: 'KiraMyao Equal',
  url: BASE_URL,
  logo: `${BASE_URL}/pic/logo/Logo.png`,
  sameAs: [String(globalConfig.twitter_url || 'https://X.com/KiraMyao')],
} as const

/** Homepage graph: Organization + WebSite. */
export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      ORGANIZATION,
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: BASE_URL,
        name: 'KiraMyao Equal',
        inLanguage: 'zh-CN',
        publisher: { '@id': `${BASE_URL}/#organization` },
      },
    ],
  }
}

const TYPE_TO_SCHEMA: Record<string, string> = {
  stories: 'Article',
  blog: 'BlogPosting',
  report: 'Report',
  documents: 'Article',
}

export type JsonLdArticle = {
  type: string
  slug: string
  title: string
  description?: string
  cover?: string
  date?: string
}

/** Article/Report/BlogPosting schema for article pages. */
export function articleJsonLd(article: JsonLdArticle) {
  const pageUrl = `${BASE_URL}${getArticleHref(article.type, article.slug)}`
  const datePublished = toIsoDate(article.date)
  return {
    '@context': 'https://schema.org',
    '@type': TYPE_TO_SCHEMA[article.type] ?? 'Article',
    headline: article.title,
    description: article.description?.trim() || undefined,
    image: article.cover ? `${BASE_URL}${article.cover}` : undefined,
    datePublished: datePublished ?? undefined,
    dateModified: datePublished ?? undefined,
    inLanguage: 'zh-CN',
    author: { '@type': 'Organization', name: 'KiraMyao Equal', url: BASE_URL },
    publisher: { '@id': `${BASE_URL}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
  }
}
