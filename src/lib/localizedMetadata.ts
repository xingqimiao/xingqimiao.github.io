import type { Metadata } from 'next'
import type { Locale } from '../i18n/locale'

export type BuildLocalizedMetadataInput = {
  locale: Locale
  chinesePath: string
  title: string
  description: string
  openGraphImage?: string
  openGraphImageAlt?: string
  openGraphType?: 'article' | 'website'
  siteName?: string
  keywords?: string[]
}

export function buildLocalizedMetadata({
  locale,
  chinesePath,
  title,
  description,
  openGraphImage,
  openGraphImageAlt,
  openGraphType = 'website',
  siteName = 'KiraMyao Equal',
  keywords,
}: BuildLocalizedMetadataInput): Metadata {
  const images = openGraphImage
    ? [{ url: openGraphImage, alt: openGraphImageAlt }]
    : [{ url: '/pic/index/og-home.png', alt: title }]
  const visibleKeywords = keywords?.length ? keywords : undefined

  return {
    title,
    description,
    ...(visibleKeywords ? { keywords: [...visibleKeywords] } : {}),
    alternates: { canonical: chinesePath },
    openGraph: {
      type: openGraphType,
      title,
      description,
      url: chinesePath,
      siteName,
      locale: 'zh_CN',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}
