import type { Locale } from '../i18n/locale'

export type ArticleListType = 'report' | 'blog' | 'documents'

export type ArticleListCopy = {
  title: string
  subtitle: string | undefined
  searchPlaceholder: string
  emptyText: string
  metadataTitle: string
  metadataDescription: string
}

const copy: Record<ArticleListType, ArticleListCopy> = {
  report: {
    title: '研究、数据与正义',
    subtitle: undefined,
    searchPlaceholder: '搜索报告标题或关键词',
    emptyText: '没有找到匹配的报告，请尝试其他关键词',
    metadataTitle: '研究、数据与报告',
    metadataDescription: '阅读 KiraMyao Equal 发布的跨性别与性少数群体研究、数据与报告。',
  },
  blog: {
    title: '猫窝碎碎念',
    subtitle: undefined,
    searchPlaceholder: '搜索猫窝文章',
    emptyText: '没有找到匹配的猫窝文章。',
    metadataTitle: '猫窝',
    metadataDescription: '阅读 KiraMyao Equal 的文章、随笔与社群札记。',
  },
  documents: {
    title: '资料，让事实有出处',
    subtitle: undefined,
    searchPlaceholder: '搜索资料',
    emptyText: '没有找到匹配的资料。',
    metadataTitle: '资料',
    metadataDescription: '浏览 KiraMyao Equal 整理的资料与参考内容。',
  },
}

export function articleListCopy(_locale: Locale, type: ArticleListType): ArticleListCopy {
  return copy[type]
}
