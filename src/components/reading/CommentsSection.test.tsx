// @vitest-environment jsdom
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CommentsSection, CUSDIS_ZH_CN_LOCALE } from './CommentsSection'

describe('CommentsSection (Cusdis)', () => {
  const base = {
    appId: '12345',
    pageId: 'stories:47228326',
    pageUrl: 'https://kiramyao.com/stories/47228326',
    pageTitle: '逃离上精卫',
  }

  it('renders nothing until an App ID is configured', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} appId="" />)
    expect(html).toBe('')
  })

  it('renders the Cusdis thread with language and theme settings once configured', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} />)
    expect(html).toContain('id="cusdis_thread"')
    expect(html).toContain('data-host="https://cusdis.com"')
    expect(html).toContain('data-app-id="12345"')
    expect(html).toContain('data-page-id="stories:47228326"')
    expect(html).toContain('data-page-url="https://kiramyao.com/stories/47228326"')
    expect(html).toContain('data-page-title="逃离上精卫"')
    expect(html).toContain('data-lang="zh-CN"')
    expect(html).toContain('评论区')
    expect(html).toContain('data-theme="auto"')
  })

  it('ships the full Simplified Chinese pack for the widget', () => {
    expect(CUSDIS_ZH_CN_LOCALE.nickname).toBe('昵称')
    expect(CUSDIS_ZH_CN_LOCALE.powered_by).toBe('评论由 Cusdis 提供')
    expect(CUSDIS_ZH_CN_LOCALE.reply_placeholder).toBe('回复内容…')
  })

  it('keeps the comment thread out of the server HTML when comments are off', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} pageTitle="off" />)
    expect(html).toContain('id="cusdis_thread"')
  })
})

describe('CommentsSection (Cusdis) widget height sync', () => {
  const base = {
    appId: '12345',
    pageId: 'stories:47228326',
    pageUrl: 'https://kiramyao.com/stories/47228326',
    pageTitle: '逃离上精卫',
  }
  let root: Root
  let container: HTMLDivElement

  const mount = async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<CommentsSection {...base} />)
    })
  }

  beforeEach(() => {
    ;(window as unknown as { CUSDIS?: unknown }).CUSDIS = {
      renderTo: (el: HTMLElement) => {
        const iframe = document.createElement('iframe')
        el.appendChild(iframe)
      },
      setTheme: () => {},
    }
  })

  afterEach(async () => {
    delete (window as unknown as { CUSDIS?: unknown }).CUSDIS
    container?.remove()
    if (root) {
      await act(async () => {
        root.unmount()
      })
    }
  })

  it('sizes the widget iframe as soon as the widget renders', async () => {
    await mount()
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeTruthy()
    await waitForAssert(() => {
      if (iframe!.style.height !== '320px') {
        throw new Error(`iframe height still ${iframe!.style.height}`)
      }
    })
  }, 4000)

  it('grows the iframe immediately when the widget content changes', async () => {
    await mount()
    const iframe = container.querySelector('iframe')!
    const body = iframe.contentDocument!.body
    Object.defineProperty(body, 'scrollHeight', { get: () => 600, configurable: true })
    body.appendChild(document.createElement('p'))
    await waitForAssert(() => {
      if (iframe.style.height !== '600px') {
        throw new Error(`iframe height still ${iframe.style.height}`)
      }
    })
  }, 4000)
})

async function waitForAssert(assert: () => void, timeoutMs = 500) {
  const start = Date.now()
  let lastError: unknown
  while (Date.now() - start < timeoutMs) {
    try {
      assert()
      return
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw lastError
}
