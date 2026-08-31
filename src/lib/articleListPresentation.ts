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
    metadataTitle: '跨性别研究与调研报告 · 核心数据',
    metadataDescription: '阅读 KiraMyao Equal 发布的中国跨性别与性少数群体研究、调研数据与深度报告。',
  },
  blog: {
    title: '猫窝，碎碎念',
    subtitle: undefined,
    searchPlaceholder: '搜索猫窝文章',
    emptyText: '没有找到匹配的猫窝文章。',
    metadataTitle: '猫窝 · 随笔与社群札记',
    metadataDescription: 'KiraMyao Equal 的猫窝：随笔与碎碎念，收录项目更新、社群札记与跨性别相关的轻松短文，是研究与报告之外更柔软的角落。',
  },
  documents: {
    title: '资料，让事实有出处',
    subtitle: undefined,
    searchPlaceholder: '搜索资料',
    emptyText: '没有找到匹配的资料。',
    metadataTitle: '参考资料与文献档案',
    metadataDescription: '浏览 KiraMyao Equal 整理的跨性别与性少数研究资料与参考档案。',
  },
}

export function articleListCopy(_locale: Locale, type: ArticleListType): ArticleListCopy {
  return copy[type]
}
