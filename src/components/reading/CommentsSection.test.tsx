import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CommentsSection, CUSDIS_ZH_CN_LOCALE } from './CommentsSection'

describe('CommentsSection (Cusdis)', () => {
  const base = {
    appId: '12345',
    pageId: 'stories:47228326',
    pageUrl: 'https://kiramyao.com/stories/47228326',
    pageTitle: '逃离上精卫',
  }

  it('renders nothing until an App ID is configured', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} appId="" />)
    expect(html).toBe('')
  })

  it('renders the Cusdis thread with language and theme settings once configured', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} />)
    expect(html).toContain('id="cusdis_thread"')
    expect(html).toContain('data-host="https://cusdis.com"')
    expect(html).toContain('data-app-id="12345"')
    expect(html).toContain('data-page-id="stories:47228326"')
    expect(html).toContain('data-page-url="https://kiramyao.com/stories/47228326"')
    expect(html).toContain('data-page-title="逃离上精卫"')
    expect(html).toContain('data-lang="zh-CN"')
    expect(html).toContain('评论区')
    expect(html).toContain('data-theme="auto"')
  })

  it('ships the full Simplified Chinese pack for the widget', () => {
    expect(CUSDIS_ZH_CN_LOCALE.nickname).toBe('昵称')
    expect(CUSDIS_ZH_CN_LOCALE.powered_by).toBe('评论由 Cusdis 提供')
    expect(CUSDIS_ZH_CN_LOCALE.reply_placeholder).toBe('回复内容…')
  })

  it('keeps the comment thread out of the server HTML when comments are off', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} pageTitle="off" />)
    expect(html).toContain('id="cusdis_thread"')
  })
})
