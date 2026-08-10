import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { SearchBox } from './SearchBox'

describe('SearchBox locale boundary', () => {
  it('lets an empty placeholder use the full field width', () => {
    const html = renderToStaticMarkup(
      <SearchBox value="" onChange={vi.fn()} placeholder="搜索报告" />,
    )

    expect(html).toContain('min-w-0')
    expect(html).toContain('pl-12')
    expect(html).toContain('pr-4')
    expect(html).toContain('placeholder="搜索报告"')
  })

  it('reserves trailing space only while the clear action is visible', () => {
    const html = renderToStaticMarkup(
      <SearchBox value="报告" onChange={vi.fn()} placeholder="搜索报告" />,
    )

    expect(html).toContain('pl-12')
    expect(html).toContain('pr-20')
    expect(html).toContain('>Clear</button>')
  })
})
