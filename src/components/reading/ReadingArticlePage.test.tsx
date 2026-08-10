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
})
