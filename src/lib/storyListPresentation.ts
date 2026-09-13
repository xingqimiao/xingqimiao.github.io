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
  longForm: string
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
  longForm: 'Long-form',
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

export function stripWarningBlockquotes(html: string): string {
  return html.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '').trim()
}

/**
 * Removes tags by applying a single-tag pattern repeatedly.
 *
 * Two deliberate choices, both of which the naive `replace(/<[^>]+>/g, '')`
 * gets wrong. The class is `[^<>]*`, not `[^>]+`, so one match can never span
 * two tags and swallow the opening of the second (`'<a<b>'`). And the pass
 * repeats until the text stops changing, so nothing survives for a later pass
 * to expose. A bare `<` with no closing `>` is not a tag, so it is dropped
 * instead of being counted as text.
 *
 * This is a measuring helper, not a sanitiser: its result is only ever used
 * for length and word-count classification, and must never be rendered.
 */
function stripHtmlTags(html: string, separator: string): string {
  let text = String(html ?? '')
  for (;;) {
    const next = text.replace(/<[^<>]*>/g, separator)
    if (next === text) break
    text = next
  }
  const open = text.lastIndexOf('<')
  if (open !== -1 && text.indexOf('>', open) === -1) text = text.slice(0, open)
  return text
}

export function getStoryNarrativeText(html: string): string {
  return stripHtmlTags(stripWarningBlockquotes(html), ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Character count of a fragment's text, with tags removed.
 *
 * Measures the raw fragment, including any warning blockquote: this replaced an
 * inline `replace(/<[^>]+>/g, '').length` and is meant to preserve its result
 * exactly. Changing what is counted here would silently move the pill between
 * floating and in-flow, so blockquote stripping stays in
 * getStoryNarrativeText, where it belongs.
 */
export function htmlTextLength(html: string): number {
  return stripHtmlTags(html, '').trim().length
}

export function isLongFormStoryContent(html: string): boolean {
  return getStoryNarrativeText(html).replace(/\s+/g, '').length >= 100
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
