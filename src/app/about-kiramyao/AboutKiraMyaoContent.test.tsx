import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AboutKiraMyaoContent } from './AboutKiraMyaoContent'
import AboutKiraMyaoPage from '@/app/(zh)/about/page'

const content = {
  title: '团结起来',
  content_html: '<p>中文组织正文</p>',
  kiramyao_html: '<p>中文 KiraMyao 正文</p>',
  content_html_en: '<p>English organization body</p>',
  kiramyao_html_en: '<p>English KiraMyao body</p>',
}

describe('About KiraMyao localized rendering', () => {
  it('renders only the Chinese KiraMyao section without a fallback notice', () => {
    const html = renderToStaticMarkup(
      <AboutKiraMyaoContent locale="zh" content={content} />,
    )

    expect(html).toContain('>关于 KiraMyao</h1>')
    expect(html).toContain('lang="zh-CN"')
    expect(html).toContain('中文 KiraMyao 正文')
    expect(html).not.toContain('English KiraMyao body')
    expect(html).toContain('href="/"')
    expect(html).toContain('>Back to home</a>')
    expect(html).not.toContain('role="note"')
  })
  it('renders the default route with the Chinese shell', () => {
    const html = renderToStaticMarkup(<AboutKiraMyaoPage />)

    expect(html).toContain('>关于 KiraMyao</h1>')
    expect(html).toContain('lang="zh-CN"')
    expect(html).not.toContain('role="note"')
    expect(html).toContain('Back to home')
  })
})
