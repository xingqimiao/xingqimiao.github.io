import type { Metadata } from 'next'
import type { Locale } from '../i18n/locale'
import globalConfig from '@/data/global_config.json'

const siteUrl = String(globalConfig.website_url || 'https://kiraequal.org').replace(/\/+$/, '')

const rootCopy = {
  defaultTitle: 'KiraEqual · 跨性别研究报告与真实故事文集',
  description: 'KiraMyao Equal 是一个关注性别多元群体的独立研究、公共知识与数字公益项目，提供跨性别生活现状调研报告与真实经历叙事。',
  keywords: [
    'KiraEqual',
    'KiraMyao Equal',
    'kiramyao.com',
    '跨性别',
    '跨性别报告',
    '跨性别故事',
    '中国跨性别报告',
    '性别多元群体',
    'LGBTQ+',
    '性少数群体',
    'MtF',
    'FtM',
    'Non-binary',
    '性别认同',
    '公益信息',
    '性别平等',
  ],
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
      images: [{ url: '/pic/index/og-home.png', alt: 'KiraMyao Equal' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: rootCopy.defaultTitle,
      description: rootCopy.description,
      images: ['/pic/index/og-home.png'],
    },
    robots: { index: true, follow: true },
  }
}
