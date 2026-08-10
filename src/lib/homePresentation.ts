import type { Locale } from '../i18n/locale'
import {
  resolveLocalizedArticle,
  type LocalizableArticle,
} from './localizedArticle'

type HomeAction = {
  id: number
  title: string
  desc: string
  cover_name: string
  size: string
}

type HomeArticle = LocalizableArticle & {
  slug: string
  date?: string
}

type HomeContent = {
  title: string
  description: string
  statement: string
  joinButton: {
    label: string
  }
}

const defaultHomeContent: HomeContent = {
  title: 'KiraEqual',
  description: 'KiraEqual是一个关注性别多元群体的独立研究、公共知识与数字公益项目',
  statement: '让真实经历成为改变社会的证据',
  joinButton: { label: 'Join Us' },
}

const homeCopy = {
  description: 'KiraEqual是一个关注性别多元群体的独立研究、公共知识与数字公益项目',
  statement: '让真实经历成为改变社会的证据',
  joinLabel: 'Join Us',
  actionHeading: '我们的行动',
  insightHeading: '最新洞察',
  viewAll: '查看全部文章 →',
  joinHeading: '加入我们，让改变发生',
  videoFallback: '你的浏览器不支持视频播放。',
} as const

const articleTypeLabels: Record<string, string> = {
  blog: '猫窝',
  stories: '故事',
  report: '报告',
  documents: '资料',
}

export function homeArticleTypeLabel(_locale: Locale, type: string) {
  return articleTypeLabels[type] || type
}

export function buildHomePresentation(
  _locale: Locale,
  actions: readonly HomeAction[],
  featuredArticles: readonly HomeArticle[],
  home: HomeContent = defaultHomeContent,
) {
  const localizedActions = actions.map((action) => ({
    ...action,
    title: action.title,
    desc: action.desc,
    contentLanguage: 'zh-CN' as const,
    fallback: false,
  }))

  const localizedArticles = featuredArticles.map((article) => {
    const localized = resolveLocalizedArticle('zh', article)
    return {
      ...article,
      title: localized.title,
      desc: localized.description || '',
      contentHtml: localized.contentHtml,
      contentLanguage: 'zh-CN' as const,
      fallback: localized.fallback,
    }
  })

  return {
    ...homeCopy,
    title: home.title,
    description: home.description,
    statement: home.statement,
    joinLabel: home.joinButton.label,
    actions: localizedActions,
    featuredArticles: localizedArticles,
    actionFallbackCount: 0,
    articleFallbackCount: localizedArticles.filter((article) => article.fallback).length,
  }
}
