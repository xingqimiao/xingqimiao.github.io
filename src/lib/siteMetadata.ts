import type { Metadata } from 'next'
import type { Locale } from '../i18n/locale'
import globalConfig from '@/data/global_config.json'

const siteUrl = String(globalConfig.website_url || 'https://kiraequal.org').replace(/\/+$/, '')

const rootCopy = {
  defaultTitle: 'KiraMyao Equal | 跨性别与性少数群体公益信息与倡导网站',
  description: 'KiraMyao Equal 是一个关注性别多元群体的独立研究、公共知识与数字公益项目。',
  keywords: ['KiraMyao Equal', 'KiraEqual', 'kiramyao.com', '跨性别', 'LGBTQ+', '性少数群体', '公益信息', '性别平等'],
  locale: 'zh_CN',
} as const

export function buildSiteMetadata(_locale: Locale): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: '%s | KiraMyao Equal',
      default: rootCopy.defaultTitle,
    },
    description: rootCopy.description,
    keywords: [...rootCopy.keywords],
    openGraph: {
      title: rootCopy.defaultTitle,
      description: rootCopy.description,
      url: siteUrl,
      siteName: 'KiraMyao Equal',
      locale: rootCopy.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: rootCopy.defaultTitle,
      description: rootCopy.description,
    },
    robots: { index: true, follow: true },
  }
}
