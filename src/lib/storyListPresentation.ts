import type { Locale } from '../i18n/locale'
import {
  resolveLocalizedArticle,
  type LocalizableArticle,
} from './localizedArticle'

export type StoryListCopy = {
  heading: string
  subtitle: string
  all: string
  bookmarked: string
  searchPlaceholder: string
  clearSearch: string
  randomStory: string
  randomUnavailable: string
  shareStory: string
  searchResults: (query: string) => string
  clear: string
  previousPage: string
  nextPage: string
  page: (current: number, total: number) => string
  empty: string
  noMatch: string
  addBookmark: string
  removeBookmark: string
}

const copy: StoryListCopy = {
  heading: '经历',
  subtitle: '值得被看见',
  all: 'All Stories',
  bookmarked: 'Bookmarked',
  searchPlaceholder: '搜索故事…',
  clearSearch: 'Clear search',
  randomStory: 'Open a random story',
  randomUnavailable: 'No story is available in the current results.',
  shareStory: 'Share Your Story',
  searchResults: (query) => `“${query}”的搜索结果`,
  clear: 'Clear',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  page: (current, total) => `第 ${current} / ${total} 页`,
  empty: '故事会显示在这里。',
  noMatch: '当前视图中没有匹配的故事。',
  addBookmark: 'Bookmark story',
  removeBookmark: 'Remove bookmark',
}

export function storyListCopy(_locale: Locale): StoryListCopy {
  return copy
}

export function localizeStoryItems<T extends LocalizableArticle>(
  _locale: Locale,
  stories: readonly T[],
) {
  return stories.map((story) => {
    const localized = resolveLocalizedArticle('zh', story)
    return {
      ...story,
      title: localized.title,
      contentHtml: localized.contentHtml,
      contentLanguage: 'zh-CN' as const,
      fallback: localized.fallback,
    }
  })
}
