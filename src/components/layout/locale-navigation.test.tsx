import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import Footer from './Footer'
import Navbar from './Navbar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/stories/a-story',
}))

function anchorAttributes(markup: string, label: string): string {
  const anchor = [...markup.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g)].find(
    ([, , content]) => content.replace(/<[^>]+>/g, '') === label,
  )

  expect(anchor, `missing link labelled ${label}`).toBeDefined()
  return anchor?.[1] ?? ''
}

describe('Chinese-content site navigation', () => {
  it('renders the English primary navigation and marks the current section', () => {
    const markup = renderToStaticMarkup(<Navbar locale="zh" />)

    expect(markup).toContain('aria-label="Primary navigation"')
    expect(anchorAttributes(markup, 'KiraEqual')).toContain('href="/"')
    expect(anchorAttributes(markup, 'Stories')).toContain('href="/stories"')
    expect(anchorAttributes(markup, 'Stories')).toContain('aria-current="page"')
    expect(anchorAttributes(markup, 'Reports')).toContain('href="/report"')
    expect(anchorAttributes(markup, 'Join Us')).toContain('href="/join"')
    expect(markup).not.toContain('>故事</a>')
    expect(markup).not.toContain('>加入我们</button>')
    expect(markup).not.toContain('aria-label="语言"')
    expect(markup).not.toContain('>English</a>')
  })

  it('renders the English footer links and an unbreakable license group', () => {
    const markup = renderToStaticMarkup(<Footer locale="zh" />)

    expect(markup).toContain('aria-label="Footer navigation"')
    expect(anchorAttributes(markup, 'About KiraMyao')).toContain('href="/about-kiramyao"')
    expect(anchorAttributes(markup, 'Privacy Policy')).toContain('href="/privacy"')
    expect(anchorAttributes(markup, 'Project Trans')).toContain('href="https://2345.lgbt/zh-cn/"')
    expect(markup).not.toContain('关于 KiraMyao')
    expect(markup).not.toContain('隐私政策')
    expect(markup).not.toContain('href="/about"')
    expect(markup).not.toContain('aria-label="语言"')
    expect(markup).toContain('whitespace-nowrap')
    expect(markup).toContain('<span>© 2026 KiraMyao Equal</span>')
    expect(markup).toContain('CC BY-NC 4.0')
  })
})
