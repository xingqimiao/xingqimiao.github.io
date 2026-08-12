import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import JoinClient from './JoinClient'
import JoinUsPage from '@/app/(zh)/join/page'

const content = {
  description_html: '<p>中文加入正文</p><p>中文加入补充</p>',
  description_html_en: '<p>English join body</p>',
  wechat_qr: '/pic/join/qr.png',
  twitter_intro: '/pic/join/x.png',
  twitter_url: 'https://x.example/kira',
}

const links = [
  {
    id: 'volunteer-recruitment',
    enabled: true,
    label: '加入 KiraMyao Equal｜志愿者招募表',
    url: 'https://forms.example/volunteer',
    source: 'Google Forms',
    logo: '/pic/join/forms.svg',
    order: 1,
  },
]

describe('join page localized rendering', () => {
  it('renders Chinese content with only the three requested English button labels', () => {
    const html = renderToStaticMarkup(
      <JoinClient locale="zh" content={content} links={links} />,
    )

    expect(html).toContain('>加入我们，让改变发生</h1>')
    expect(html).toContain('lang="zh-CN"')
    expect(html).toContain('中文加入正文')
    expect(html).toContain('中文加入补充')
    expect(html).toContain('加入 KiraMyao Equal｜志愿者招募表')
    expect(html).toContain('>Open</span>')
    expect(html).toContain('微信赞助')
    expect(html).toContain('关注 Twitter (X)')
    expect(html).toContain('>Open profile</a>')
    expect(html).toContain('href="https://forms.example/volunteer"')
    expect(html).toContain('src="/pic/join/forms.svg"')
    expect(html).toContain('src="/pic/join/qr.png"')
    expect(html).toContain('src="/pic/join/x.png"')
    expect(html).toContain('href="https://x.example/kira"')
    expect(html).toContain('href="/"')
    expect(html).toContain('>Back to home</a>')
    expect(html).not.toContain('role="note"')
    expect(html).not.toContain('English content is unavailable')
  })

  it('renders the submission and feedback email cards', () => {
    const html = renderToStaticMarkup(
      <JoinClient locale="zh" content={content} links={links} />,
    )

    expect(html).toContain('>投稿邮箱</span>')
    expect(html).toContain('>反馈邮箱</span>')
    expect(html).toContain('mailto:stories@kiramyao.com')
    expect(html).toContain('mailto:report@kiramyao.com')
    expect(html).toContain('stories@kiramyao.com')
    expect(html).toContain('report@kiramyao.com')
  })

  it('renders the default route with the Chinese shell', () => {
    const html = renderToStaticMarkup(<JoinUsPage />)

    expect(html).toContain('>加入我们，让改变发生</h1>')
    expect(html).toContain('lang="zh-CN"')
    expect(html).toContain('>Open</span>')
    expect(html).toContain('>Back to home</a>')
    expect(html).not.toContain('role="note"')
  })
})
