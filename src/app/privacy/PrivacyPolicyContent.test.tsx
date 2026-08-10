import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PrivacyPolicyContent } from './PrivacyPolicyContent'
import PrivacyPolicyPage from '@/app/(zh)/privacy/page'

const content = {
  title: '隐私与数据处理说明',
  content_html: '<p>中文隐私正文</p>',
  content_html_en: '<p>English privacy body</p>',
}

describe('privacy policy localized rendering', () => {
  it('renders the Chinese policy without fallback UI', () => {
    const html = renderToStaticMarkup(
      <PrivacyPolicyContent locale="zh" content={content} />,
    )

    expect(html).toContain('>隐私与数据处理说明</h1>')
    expect(html).toContain('lang="zh-CN"')
    expect(html).toContain('中文隐私正文')
    expect(html).not.toContain('English privacy body')
    expect(html).toContain('>Back to home</a>')
    expect(html).toContain('href="/"')
    expect(html).not.toContain('role="note"')
  })

  it('renders the default route with the Chinese shell', () => {
    const html = renderToStaticMarkup(<PrivacyPolicyPage />)

    expect(html).toContain('>隐私与数据处理说明</h1>')
    expect(html).toContain('lang="zh-CN"')
    expect(html).not.toContain('role="note"')
    expect(html).toContain('>Back to home</a>')
  })
})
