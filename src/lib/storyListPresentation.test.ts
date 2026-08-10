import { describe, expect, it } from 'vitest'
import { localizeStoryItems, storyListCopy } from './storyListPresentation'

const stories = [
  {
    type: 'stories',
    slug: 'translated-story',
    title: '中文故事一',
    contentHtml: '<p>中文正文一</p>',
  },
  {
    type: 'stories',
    slug: 'fallback-story',
    title: '中文故事二',
    contentHtml: '<p>中文正文二</p>',
  },
]

describe('Stories list localization', () => {
  it('always localizes story cards from the Chinese source', () => {
    expect(localizeStoryItems('zh', stories)).toMatchObject([
      {
        title: '中文故事一',
        contentHtml: '<p>中文正文一</p>',
        contentLanguage: 'zh-CN',
        fallback: false,
      },
      {
        title: '中文故事二',
        contentHtml: '<p>中文正文二</p>',
        contentLanguage: 'zh-CN',
        fallback: false,
      },
    ])
  })

  it('keeps Chinese story content headings with English button labels', () => {
    expect(storyListCopy('zh')).toMatchObject({
      heading: '经历',
      subtitle: '值得被看见',
      all: 'All Stories',
      bookmarked: 'Bookmarked',
      randomStory: 'Open a random story',
      shareStory: 'Share Your Story',
      clear: 'Clear',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      addBookmark: 'Bookmark story',
      removeBookmark: 'Remove bookmark',
    })
  })
})
