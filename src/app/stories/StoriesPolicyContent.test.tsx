import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StoriesPolicyPage from '@/app/(zh)/stories/policy/page'
import { StoriesPolicyContent } from './StoriesPolicyContent'

describe('stories content policy page', () => {
  it('renders the policy body and the join-us style submission email card', () => {
    const html = renderToStaticMarkup(<StoriesPolicyContent locale="zh" />)

    expect(html).toContain('>Stories 内容政策</h1>')
    expect(html).toContain('KiraEqual Stories 希望记录真实的个人经历')
    expect(html).toContain('明确鼓励、指导或美化自我伤害、伤害他人或其他严重危险行为的内容')
    expect(html).toContain('>投稿邮箱</span>')
    expect(html).toContain('mailto:stories@kiramyao.com')
    expect(html).toContain('stories@kiramyao.com')
  })

  it('ends the policy with a link to the privacy policy', () => {
    const html = renderToStaticMarkup(<StoriesPolicyContent locale="zh" />)

    expect(html).toContain('href="/privacy"')
    expect(html).toContain('Privacy Policy')
  })

  it('states the friend links policy including the content review clause', () => {
    const html = renderToStaticMarkup(<StoriesPolicyContent locale="zh" />)

    expect(html).toContain('>Friend Links（友链）政策</h2>')
    expect(html).toContain('先在你的网站上添加指向本站')
    expect(html).toContain('我们也会审查您网站中的内容是否适合被收录')
    expect(html).toContain('4:3 黑底展示图')
    expect(html).not.toContain('logo 或方形图')
    expect(html).toContain('注明“友链申请”')
  })

  it('renders the default route with the Chinese shell', () => {
    const html = renderToStaticMarkup(<StoriesPolicyPage />)

    expect(html).toContain('>Stories 内容政策</h1>')
    expect(html).toContain('lang="zh-CN"')
    expect(html).not.toContain('role="note"')
  })
})