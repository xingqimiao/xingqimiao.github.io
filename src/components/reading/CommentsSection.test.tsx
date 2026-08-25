// @vitest-environment jsdom
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList) as typeof window.matchMedia
}
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

  it('collapses to a single trigger row until the reader opens it', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} />)
    expect(html).toContain('添加公开评论…')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('id="cusdis_thread"')
    expect(html).not.toContain('data-app-id')
  })

  it('ships the full Simplified Chinese pack for the widget', () => {
    expect(CUSDIS_ZH_CN_LOCALE.nickname).toBe('昵称')
    expect(CUSDIS_ZH_CN_LOCALE.powered_by).toBe('评论由 Cusdis 提供')
    expect(CUSDIS_ZH_CN_LOCALE.reply_placeholder).toBe('回复内容…')
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

  const expand = async () => {
    const trigger = container.querySelector('button') as HTMLButtonElement
    expect(trigger).toBeTruthy()
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
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

  it('stays collapsed to a single trigger row until clicked, then mounts the widget', async () => {
    await mount()
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.textContent).toContain('添加公开评论…')
    await expand()
    await waitForAssert(() => {
      if (!container.querySelector('iframe')) {
        throw new Error('widget iframe not mounted after expand')
      }
    })
  }, 4000)

  it('sizes the widget iframe as soon as the widget renders', async () => {
    await mount()
    await expand()
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeTruthy()
    await waitForAssert(() => {
      if (iframe!.style.height !== '200px') {
        throw new Error(`iframe height still ${iframe!.style.height}`)
      }
    })
  }, 4000)

  it('grows the iframe immediately when the widget content changes', async () => {
    await mount()
    await expand()
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

  it('re-sizes the widget once its inner document finishes loading', async () => {
    // The widget first renders a temporary document and swaps in the real
    // srcdoc document after it loads, so the height observer armed at render
    // time watches a dead document. The iframe load event must re-tune.
    let innerDoc: Document | null = null
    ;(window as unknown as { CUSDIS?: unknown }).CUSDIS = {
      renderTo: (el: HTMLElement) => {
        const iframe = document.createElement('iframe')
        Object.defineProperty(iframe, 'contentDocument', {
          get: () => innerDoc,
          configurable: true,
        })
        el.appendChild(iframe)
      },
      setTheme: () => {},
    }
    await mount()
    await expand()
    const iframe = container.querySelector('iframe')!
    expect(iframe.style.height).toBe('')
    innerDoc = document.implementation.createHTMLDocument('widget')
    iframe.dispatchEvent(new Event('load'))
    await waitForAssert(() => {
      if (iframe.style.height !== '200px') {
        throw new Error(`iframe height still ${iframe.style.height}`)
      }
    })
  }, 4000)

  it('re-tunes when the widget box grows without any DOM mutation (font/image load)', async () => {
    // Font loading and image decoding change the widget's box height without
    // adding/removing nodes, so no DOM mutation fires. The widget's own
    // ResizeObserver must be wired up so the host page still follows.
    let widgetResize: (() => void) | null = null
    ;(window as unknown as { CUSDIS?: unknown }).CUSDIS = {
      renderTo: (el: HTMLElement) => {
        const iframe = document.createElement('iframe')
        el.appendChild(iframe)
        Object.defineProperty(iframe.contentWindow!, 'ResizeObserver', {
          value: class {
            constructor(cb: () => void) {
              widgetResize = cb
            }
            observe() {}
            unobserve() {}
            disconnect() {}
          },
          configurable: true,
        })
      },
      setTheme: () => {},
    }
    await mount()
    await expand()
    const iframe = container.querySelector('iframe')!
    expect(widgetResize).toBeTruthy()
    const body = iframe.contentDocument!.body
    Object.defineProperty(body, 'scrollHeight', { get: () => 600, configurable: true })
    widgetResize!()
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
