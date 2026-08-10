import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NotFoundContent } from './NotFoundContent'

describe('NotFoundContent locale', () => {
  it('keeps the Chinese recovery path and copy on every route', () => {
    const html = renderToStaticMarkup(<NotFoundContent locale="zh" />)
    expect(html).toContain('荒无猫烟')
    expect(html).toContain('href="/"')
    expect(html).toContain('Back to home')
    expect(html).toContain('lang="zh-CN"')
  })
})
