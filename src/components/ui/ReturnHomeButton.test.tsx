import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReturnHomeButton } from './ReturnHomeButton'

describe('ReturnHomeButton locale path', () => {
  it('supports the Join page English label without changing the Chinese home path', () => {
    const html = renderToStaticMarkup(<ReturnHomeButton locale="zh" label="Back to home" />)
    expect(html).toContain('href="/"')
    expect(html).toContain('Back to home')
  })

  it('uses the English button label on the Chinese home path', () => {
    const html = renderToStaticMarkup(<ReturnHomeButton locale="zh" />)
    expect(html).toContain('href="/"')
    expect(html).toContain('Back to home')
    expect(html).not.toContain('返回首页')
  })
})
