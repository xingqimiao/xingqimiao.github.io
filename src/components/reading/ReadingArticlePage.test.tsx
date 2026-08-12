import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReadingArticlePage } from './ReadingArticlePage'

const baseProps = {
  locale: 'zh' as const,
  backHref: '/report',
  backLabel: '← 返回报告列表',
  categoryLabel: '报告',
  kicker: 'KiraEqual 报告',
  title: '中文标题',
  contentHtml: '<p>中文正文</p>',
}

describe('ReadingArticlePage Chinese boundary', () => {
  it('renders Chinese content without a translation fallback notice', () => {
    const html = renderToStaticMarkup(
      <ReadingArticlePage
        {...baseProps}
        contentLanguage="zh-CN"
      />,
    )

    expect(html).not.toContain('role="note"')
    expect(html).toContain('<h1 lang="zh-CN"')
    expect(html).toContain('<article lang="zh-CN"')
    expect(html).toContain('aria-label="Switch to dark reading"')
  })

  it('renders a collapsed 内容说明 toggle at the bottom of the reader', () => {
    const disclaimer = '内容来自用户匿名投稿，不代表 KiraEqual 立场或支持其观点、行为。'
    const html = renderToStaticMarkup(
      <ReadingArticlePage
        {...baseProps}
        contentLanguage="zh-CN"
        disclaimer={disclaimer}
      />,
    )

    expect(html).toContain('内容说明')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-controls="story-disclaimer-content"')
    expect(html).toContain(disclaimer)
    // the disclaimer sits after the article body, below the divider
    expect(html.indexOf(disclaimer)).toBeGreaterThan(html.indexOf('</article>'))
  })

  it('does not render a disclaimer block when not provided', () => {
    const html = renderToStaticMarkup(
      <ReadingArticlePage {...baseProps} contentLanguage="zh-CN" />,
    )
    expect(html).not.toMatch(/内容来自用户匿名投稿/)
    expect(html).not.toContain('内容说明')
  })
})
