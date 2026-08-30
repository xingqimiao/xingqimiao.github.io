import { describe, expect, it } from 'vitest'
import {
  localizeStoryItems,
  storyListCopy,
  stripWarningBlockquotes,
  getStoryNarrativeText,
  isLongFormStoryContent,
} from './storyListPresentation'

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

describe('Stories list presentation and filtering', () => {
  it('strips blockquote content warnings from narrative text and word count', () => {
    const htmlWithWarning = `<blockquote><p><strong>阅前提示：含自杀情节</strong></p><p>不要只追问绝望者为何选择错误逃生方式，更要看见什么将TA逼至没有正确出口的境地。若此刻身处低谷，请勿勉强阅读。保护自己的心永远最重要。</p></blockquote><p>这里是真实的短篇叙事正文。</p>`
    
    expect(stripWarningBlockquotes(htmlWithWarning)).toBe('<p>这里是真实的短篇叙事正文。</p>')
    expect(getStoryNarrativeText(htmlWithWarning)).toBe('这里是真实的短篇叙事正文。')
    expect(isLongFormStoryContent(htmlWithWarning)).toBe(false)
  })

  it('classifies story with >=100 narrative characters as long-form', () => {
    const longNarrative = '<p>' + '长篇正文字符'.repeat(25) + '</p>'
    expect(isLongFormStoryContent(longNarrative)).toBe(true)
  })

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
