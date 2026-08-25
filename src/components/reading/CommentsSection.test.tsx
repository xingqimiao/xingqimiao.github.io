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
import { afterEach, describe, expect, it } from 'vitest'
import { CommentsSection, CUSDIS_ZH_CN_LOCALE } from './CommentsSection'

// Builds a minimal widget document matching the real srcdoc structure:
// #root > div > div.grid.grid-cols-1.gap-4 (form) + div.mt-4.px-1 (list).
const buildWidgetDoc = (doc: Document) => {
  const root = doc.createElement('div')
  root.id = 'root'
  const shell = doc.createElement('div')
  const form = doc.createElement('div')
  form.className = 'grid grid-cols-1 gap-4'
  const list = doc.createElement('div')
  list.className = 'mt-4 px-1'
  const ta = doc.createElement('textarea')
  ta.name = 'reply_content'
  form.appendChild(ta)
  root.appendChild(shell)
  shell.appendChild(form)
  shell.appendChild(list)
  doc.body.appendChild(root)
}

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

  it('renders a sticky trigger and the always-visible thread container once configured', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} />)
    expect(html).toContain('添加公开评论…')
    expect(html).toContain('sticky bottom-4')
    expect(html).toContain('id="cusdis_thread"')
    expect(html).toContain('data-app-id="12345"')
    expect(html).toContain('data-page-id="stories:47228326"')
    expect(html).toContain('data-lang="zh-CN"')
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

  const mount = async (renderTo?: (el: HTMLElement) => void) => {
    ;(window as unknown as { CUSDIS?: unknown }).CUSDIS = {
      renderTo:
        renderTo ??
        ((el: HTMLElement) => {
          const iframe = document.createElement('iframe')
          el.appendChild(iframe)
          buildWidgetDoc(iframe.contentDocument!)
        }),
      setTheme: () => {},
    }
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<CommentsSection {...base} />)
    })
  }

  afterEach(async () => {
    delete (window as unknown as { CUSDIS?: unknown }).CUSDIS
    container?.remove()
    if (root) {
      await act(async () => {
        root.unmount()
      })
    }
  })

  it('mounts the widget immediately so existing comments are always visible', async () => {
    await mount()
    const iframe = container.querySelector('iframe')
    expect(iframe).toBeTruthy()
    await waitForAssert(() => {
      if (iframe!.style.height !== '48px') {
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

  it('re-sizes the widget once its inner document finishes loading', async () => {
    // The widget first renders a temporary document and swaps in the real
    // srcdoc document after it loads, so the height observer armed at render
    // time watches a dead document. The iframe load event must re-tune.
    let innerDoc: Document | null = null
    await mount((el: HTMLElement) => {
      const iframe = document.createElement('iframe')
      Object.defineProperty(iframe, 'contentDocument', {
        get: () => innerDoc,
        configurable: true,
      })
      el.appendChild(iframe)
    })
    const iframe = container.querySelector('iframe')!
    expect(iframe.style.height).toBe('')
    innerDoc = document.implementation.createHTMLDocument('widget')
    iframe.dispatchEvent(new Event('load'))
    await waitForAssert(() => {
      if (iframe.style.height !== '48px') {
        throw new Error(`iframe height still ${iframe.style.height}`)
      }
    })
  }, 4000)

  it('re-tunes when the widget box grows without any DOM mutation (font/image load)', async () => {
    // Font loading and image decoding change the widget's box height without
    // adding/removing nodes, so no DOM mutation fires. The widget's own
    // ResizeObserver must be wired up so the host page still follows.
    let widgetResize: (() => void) | null = null
    await mount((el: HTMLElement) => {
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
    })
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

describe('CommentsSection (Cusdis) form reveal', () => {
  const base = {
    appId: '12345',
    pageId: 'stories:47228326',
    pageUrl: 'https://kiramyao.com/stories/47228326',
    pageTitle: '逃离上精卫',
  }
  let root: Root
  let container: HTMLDivElement

  const mount = async () => {
    ;(window as unknown as { CUSDIS?: unknown }).CUSDIS = {
      renderTo: (el: HTMLElement) => {
        const iframe = document.createElement('iframe')
        el.appendChild(iframe)
        buildWidgetDoc(iframe.contentDocument!)
      },
      setTheme: () => {},
    }
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<CommentsSection {...base} />)
    })
  }

  afterEach(async () => {
    delete (window as unknown as { CUSDIS?: unknown }).CUSDIS
    container?.remove()
    if (root) {
      await act(async () => {
        root.unmount()
      })
    }
  })

  it('keeps the comment list visible while the form is collapsed', async () => {
    await mount()
    const doc = container.querySelector('iframe')!.contentDocument!
    expect(doc.getElementById('kira-form-collapsed')).toBeTruthy()
    // The injected style targets only the form container, never the list.
    const css = doc.getElementById('kira-form-collapsed')!.textContent!
    expect(css).toContain('grid-cols-1.gap-4')
    expect(css).toContain('display: none')
  }, 4000)

  it('reveals the form when the sticky trigger is clicked', async () => {
    await mount()
    const doc = container.querySelector('iframe')!.contentDocument!
    const trigger = container.querySelector('button') as HTMLButtonElement
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await waitForAssert(() => {
      if (!doc.getElementById('kira-form-collapsed')) return
      throw new Error('form still collapsed')
    })
  }, 4000)

  it('grows the reply box with input instead of scrolling', async () => {
    await mount()
    const doc = container.querySelector('iframe')!.contentDocument!
    const textarea = doc.querySelector('textarea')!
    Object.defineProperty(textarea, 'scrollHeight', { get: () => 120, configurable: true })
    textarea.value = '第一行\n第二行第三行'
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await waitForAssert(() => {
      if (textarea.style.height !== '120px') {
        throw new Error(`textarea height still ${textarea.style.height}`)
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
