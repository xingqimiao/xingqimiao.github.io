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

  it('renders year sections newest-first so 2026 leads 2025 with featured cards inside their year', () => {
    const html = renderToStaticMarkup(
      <ArticleIndex
        locale="zh"
        type="report"
        searchPlaceholder="搜索"
        emptyText="无"
        articles={[
          {
            type: 'report',
            slug: 'older-normal',
            title: '旧年普通',
            desc: '旧摘要',
            contentHtml: '<p>旧</p>',
            date: '2025-11-19',
            grid_span: 'normal',
          },
          {
            type: 'report',
            slug: 'new-featured',
            title: '新年读者版',
            desc: '新摘要',
            contentHtml: '<p>新</p>',
            date: '2026-08-10',
            grid_span: 'featured',
          },
        ]}
      />,
    )

    const year2026Idx = html.indexOf('>2026<')
    const year2025Idx = html.indexOf('>2025<')
    const featuredIdx = html.indexOf('新年读者版')
    const olderNormalIdx = html.indexOf('旧年普通')

    expect(year2026Idx).toBeGreaterThan(-1)
    expect(year2025Idx).toBeGreaterThan(-1)
    // newest year section renders first
    expect(year2026Idx).toBeLessThan(year2025Idx)
    // featured stays inside its year section (after the 2026 header)
    expect(featuredIdx).toBeGreaterThan(year2026Idx)
    expect(featuredIdx).toBeLessThan(year2025Idx)
    // older normal card stays inside the 2025 section
    expect(olderNormalIdx).toBeGreaterThan(year2025Idx)
  })
})
