import type { MetadataRoute } from 'next'
import compiledArticles from '@/data/compiled_articles.json'
import globalConfig from '@/data/global_config.json'
import { getArticleHref } from '@/lib/articleRoute'

export const dynamic = 'force-static'

const BASE_URL = String(globalConfig.website_url || 'https://kiraequal.org').replace(/\/+$/, '')

const staticPages = [
  { path: '/', priority: 1 },
  { path: '/about-kiramyao', priority: 0.8 },
  { path: '/action', priority: 0.8 },
  { path: '/cat-cave', priority: 0.8 },
  { path: '/documents', priority: 0.8 },
  { path: '/join', priority: 0.8 },
  { path: '/privacy', priority: 0.8 },
  { path: '/report', priority: 0.8 },
  { path: '/stories', priority: 0.8 },
] as const

function articleDate(value: string | undefined, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value.replaceAll('.', '-'))
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export default function sitemap(): MetadataRoute.Sitemap {
  const generatedAt = new Date()
  const pages: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: new URL(page.path, BASE_URL).toString(),
    lastModified: generatedAt,
    changeFrequency: 'weekly',
    priority: page.priority,
  }))
  const articles: MetadataRoute.Sitemap = compiledArticles.map((article) => ({
    url: new URL(getArticleHref(article.type, article.slug), BASE_URL).toString(),
    lastModified: articleDate(article.date, generatedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...pages, ...articles]
}
