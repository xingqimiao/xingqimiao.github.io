import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ArticleIndex } from './ArticleIndex'

describe('ArticleIndex locale boundary', () => {
  it('renders only Chinese cards and root links without fallback notices', () => {
    const html = renderToStaticMarkup(
      <ArticleIndex
        locale="zh"
        type="report"
        searchPlaceholder="搜索报告"
        emptyText="没有找到匹配的报告。"
        articles={[
          {
            type: 'report',
            slug: 'translated',
            title: '中文标题一',
            desc: '中文摘要一',
            contentHtml: '<p>中文正文一</p>',
            date: '2026-08-09',
          },
          {
            type: 'report',
            slug: 'fallback',
            title: '中文标题二',
            desc: '中文摘要二',
            contentHtml: '<p>中文正文二</p>',
            date: '2026-08-08',
          },
        ]}
      />,
    )

    expect(html).not.toContain('role="note"')
    expect(html).toContain('href="/report/translated"')
    expect(html).toContain('lang="zh-CN"')
    expect(html).toContain('中文标题一')
    expect(html).toContain('中文摘要一')
    expect(html).toContain('中文标题二')
    expect(html).not.toContain('English title')
  })
})
