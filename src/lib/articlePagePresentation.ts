import type { Locale } from '../i18n/locale'
import { toLocalePath } from '../i18n/locale'
import { getArticleSectionPath } from './articleRoute'
import {
  resolveLocalizedArticle,
  type LocalizableArticle,
} from './localizedArticle'

type ArticleType = 'blog' | 'stories' | 'report' | 'documents'

type ArticlePageCopy = {
  backLabel: string
  categoryLabel: string
  kicker: string
  description: string
}

export type ArticlePagePresentation = {
  title: string
  description: string
  contentHtml: string
  contentLanguage: 'zh-CN'
  backHref: string
  backLabel: string
  categoryLabel: string
  kicker: string
}

const articlePageCopy: Record<ArticleType, ArticlePageCopy> = {
  blog: {
    backLabel: '← Back to Cat Cave',
    categoryLabel: '猫窝',
    kicker: 'KiraEqual 猫窝',
    description: 'KiraMyao Equal 的文章与社群札记。',
  },
  stories: {
    backLabel: '← Back to stories',
    categoryLabel: '故事',
    kicker: 'KiraEqual 故事',
    description: '来自 KiraMyao Equal 社群的匿名故事。',
  },
  report: {
    backLabel: '← Back to reports',
    categoryLabel: '报告',
    kicker: 'KiraEqual 报告',
    description: 'KiraMyao Equal 发布的研究与报告。',
  },
  documents: {
    backLabel: '← Back to documents',
    categoryLabel: '资料',
    kicker: 'KiraEqual 资料',
    description: 'KiraMyao Equal 整理的资料与参考。',
  },
}

function isArticleType(value: string): value is ArticleType {
  return value === 'blog'
    || value === 'stories'
    || value === 'report'
    || value === 'documents'
}

export function buildArticlePagePresentation(
  _locale: Locale,
  article: LocalizableArticle,
): ArticlePagePresentation {
  if (!isArticleType(article.type)) {
    throw new Error(`Unsupported article type: ${article.type}`)
  }

  const localized = resolveLocalizedArticle('zh', article)
  const copy = articlePageCopy[article.type]
  const sectionPath = `/${getArticleSectionPath(article.type)}`

  return {
    title: localized.title,
    description: localized.description || copy.description,
    contentHtml: localized.contentHtml,
    contentLanguage: 'zh-CN',
    backHref: toLocalePath(sectionPath, 'zh'),
    backLabel: copy.backLabel,
    categoryLabel: copy.categoryLabel,
    kicker: copy.kicker,
  }
}
