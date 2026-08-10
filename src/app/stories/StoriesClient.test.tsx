import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import StoriesClient from './StoriesClient'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@gsap/react', () => ({
  useGSAP: () => undefined,
}))

const stories = [
  {
    type: 'stories',
    slug: 'covered-story',
    title: '中文故事一',
    contentHtml: '<p>中文正文一</p>',
    cover_name: '/pic/stories/covered.webp',
    date: '2026-08-09',
  },
  {
    type: 'stories',
    slug: 'tonal-story',
    title: '中文故事二',
    contentHtml: '<p>中文正文二</p>',
    date: '2025-06-01',
  },
]

describe('StoriesClient Material 3 feed', () => {
  it('renders a Chinese 1/2/3-column feed with uniform 4:3 cards', () => {
    const html = renderToStaticMarkup(<StoriesClient locale="zh" articles={stories} />)

    expect(html).toContain('>经历</h1>')
    expect(html).toContain('值得被看见')
    expect(html).toContain('placeholder="搜索故事…"')
    expect(html).toContain('href="/join"')
    expect(html).toContain('href="/stories/covered-story"')
    expect(html).toContain('href="/stories/tonal-story"')
    expect(html).toContain('grid-cols-1')
    expect(html).toContain('min-[600px]:grid-cols-2')
    expect(html).toContain('min-[840px]:grid-cols-3')
    expect(html.match(/aspect-\[4\/3\]/g)).toHaveLength(2)
    expect(html).not.toMatch(/<article[^>]*style=/)
    expect(html).not.toContain('col-span')
  })

  it('uses a full-bleed cover or a tonal brand motif on the card itself', () => {
    const html = renderToStaticMarkup(<StoriesClient locale="zh" articles={stories} />)

    expect(html).toContain('data-story-card="covered"')
    expect(html).toContain('data-story-card="tonal"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
    expect(html).toContain('object-cover')
    expect(html).toContain('data-story-motif="book-lines"')
    expect(html.match(/h-12 w-12/g)).toHaveLength(2)
    expect(html).not.toContain('role="note"')
  })
})
