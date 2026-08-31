import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { FriendLinkCard, FriendLinksGrid } from './FriendLinkCard'
import type { FriendLink } from '@/lib/friendLinks'

const plainLink: FriendLink = {
  id: 'example-a',
  name: '示例友链甲',
  url: 'https://example.com/a',
  description: '占位描述',
  cover: null,
}

const coveredLink: FriendLink = {
  id: 'example-b',
  name: '示例友链乙',
  url: 'https://example.com/b',
  cover: '/pic/friends/example-b.webp',
}

describe('FriendLinkCard', () => {
  it('renders the 4:3 front face with a first-letter block and title only', () => {
    const html = renderToStaticMarkup(
      <FriendLinkCard link={plainLink} confirming={false} onOpen={() => {}} onCancel={() => {}} onGo={() => {}} />,
    )

    expect(html).toContain('aspect-[4/3]')
    expect(html).toContain('data-friend-card="initial"')
    // 背面（确认层）始终在 DOM 中由 CSS 掌管可见性，正面断言须限定在正面片段内
    const front = html.slice(html.indexOf('friend-card__front'), html.indexOf('friend-card__back'))
    expect(front).toContain('示例友链甲')
    expect(front).toContain('>示</span>')
    expect(front).not.toContain('占位描述')
    expect(front).not.toContain('example.com')
    expect(front).not.toContain('<img')
  })

  it('renders the cover image when the link provides one', () => {
    const html = renderToStaticMarkup(
      <FriendLinkCard link={coveredLink} confirming={false} onOpen={() => {}} onCancel={() => {}} onGo={() => {}} />,
    )

    expect(html).toContain('data-friend-card="covered"')
    expect(html).toContain('src="/pic/friends/example-b.webp"')
    expect(html).toContain('loading="lazy"')
  })

  it('hides the confirm layer from assistive tech until the card flips', () => {
    const html = renderToStaticMarkup(
      <FriendLinkCard link={plainLink} confirming={false} onOpen={() => {}} onCancel={() => {}} onGo={() => {}} />,
    )

    expect(html).not.toContain('friend-card--flipped')
    expect(html).toMatch(/aria-hidden="true"[^>]*>确认前往/)
  })

  it('flips upward to an embedded confirm layer with description, host and go/cancel actions', () => {
    const html = renderToStaticMarkup(
      <FriendLinkCard link={plainLink} confirming={true} onOpen={() => {}} onCancel={() => {}} onGo={() => {}} />,
    )

    expect(html).toContain('friend-card--flipped')
    expect(html).toContain('即将离开本站，前往外部链接')
    expect(html).toContain('占位描述')
    expect(html).toContain('example.com')
    expect(html).toContain('>确认前往</button>')
    expect(html).toContain('>取消</button>')
  })
})

describe('FriendLinksGrid', () => {
  const noop = () => {}

  it('lays the friend cards out on the same responsive grid as stories', () => {
    const html = renderToStaticMarkup(
      <FriendLinksGrid links={[plainLink, coveredLink]} confirmingId={null} onOpen={noop} onCancel={noop} onGo={noop} emptyText="友链会显示在这里。" />,
    )

    expect(html).toContain('grid-cols-1')
    expect(html).toContain('min-[600px]:grid-cols-2')
    expect(html).toContain('min-[840px]:grid-cols-3')
    expect(html.match(/data-friend-card=/g)).toHaveLength(2)
  })

  it('flips the card whose id matches confirmingId', () => {
    const html = renderToStaticMarkup(
      <FriendLinksGrid links={[plainLink, coveredLink]} confirmingId="example-a" onOpen={noop} onCancel={noop} onGo={noop} emptyText="友链会显示在这里。" />,
    )

    expect(html).toContain('friend-card--flipped')
  })

  it('shows the caller-provided empty state when no links match', () => {
    const html = renderToStaticMarkup(
      <FriendLinksGrid links={[]} confirmingId={null} onOpen={noop} onCancel={noop} onGo={noop} emptyText="当前视图中没有匹配的友链。" />,
    )

    expect(html).not.toContain('data-friend-card=')
    expect(html).toContain('当前视图中没有匹配的友链。')
  })
})
