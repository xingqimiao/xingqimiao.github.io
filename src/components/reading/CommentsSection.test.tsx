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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommentsSection, CUSDIS_ZH_CN_LOCALE } from './CommentsSection'

const emptyComments = { data: { data: [], commentCount: 0 } }

const stubFetch = (body: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )

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

  it('renders a trigger under the headline without pre-mounting the lazy thread', () => {
    // The viewport check is client-only, so server HTML ships the pill in its
    // natural position under the headline; the float is applied after hydration.
    const html = renderToStaticMarkup(<CommentsSection {...base} />)
    expect(html).toContain('添加公开评论…')
    expect(html).not.toContain('fixed')
    expect(html).not.toContain('sticky')
    expect(html).not.toContain('id="cusdis_thread"')
    expect(html).not.toContain('data-app-id')
    const headlineIndex = html.indexOf('评论区')
    const pillIndex = html.indexOf('添加公开评论…')
    expect(headlineIndex).toBeGreaterThan(-1)
    expect(pillIndex).toBeGreaterThan(headlineIndex)
  })

  it('ships the full Simplified Chinese pack for the widget', () => {
    expect(CUSDIS_ZH_CN_LOCALE.nickname).toBe('昵称')
    expect(CUSDIS_ZH_CN_LOCALE.powered_by).toBe('评论由 Cusdis 提供')
    expect(CUSDIS_ZH_CN_LOCALE.reply_placeholder).toBe('回复内容…')
  })
})

describe('CommentsSection (Cusdis) lazy thread', () => {
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

  const expand = async () => {
    const trigger = container.querySelector('button') as HTMLButtonElement
    expect(trigger).toBeTruthy()
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    // openThread fades the pill away first, mounts the thread 160ms later.
    await waitForAssert(() => {
      if (!container.querySelector('button')) return
      throw new Error('pill still visible')
    })
  }

  beforeEach(() => {
    stubFetch(emptyComments)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete (window as unknown as { CUSDIS?: unknown }).CUSDIS
    container?.remove()
    if (root) {
      void act(() => {
        root.unmount()
      })
    }
  })

  it('renders approved comments from the public API without mounting the widget', async () => {
    stubFetch({
      data: {
        data: [
          {
            id: 'c1',
            by_nickname: '读者甲',
            content: '说得对',
            parsedContent: '<p>说得对</p>',
            createdAt: '2026-08-24T19:38:10.410Z',
            // The service-side field is broken; the host page must ignore it.
            parsedCreatedAt: 'Invalid Date',
          },
        ],
      },
    })
    await mount()
    await waitForAssert(() => {
      if (!container.textContent!.includes('读者甲')) {
        throw new Error('comment not rendered')
      }
    })
    expect(container.textContent).toContain('说得对')
    // createdAt is rendered as a local date; the broken field never leaks.
    expect(container.textContent).toContain('2026-')
    expect(container.textContent).not.toContain('Invalid Date')
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('floats the trigger at the bottom only when the page cannot fill the viewport', async () => {
    await mount()
    await waitForAssert(() => {
      const wrapper = container.querySelector('button')!.parentElement!
      if (!wrapper.className.includes('fixed')) {
        throw new Error('expected floating pill on a short page')
      }
    })
  }, 4000)

  it('keeps the trigger in flow on long stories that fill the viewport', async () => {
    // jsdom has no layout: the comment section reports top 0, which reads as
    // a short page. Fake a section deep below the viewport for this case.
    const spy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 99999, bottom: 99999, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect)
    try {
      await mount()
      await waitForAssert(() => {
        const wrapper = container.querySelector('button')!.parentElement!
        if (wrapper.className.includes('fixed')) {
          throw new Error('expected in-flow pill on a long page')
        }
      })
    } finally {
      spy.mockRestore()
    }
  }, 4000)

  it('keeps host-rendered comments visible after the thread is opened', async () => {
    stubFetch({
      data: {
        data: [
          { id: 'c1', by_nickname: '读者甲', parsedContent: '说得对', createdAt: '2026-08-24T19:38:10.410Z' },
        ],
      },
    })
    await mount()
    await expand()
    await waitForAssert(() => {
      if (!container.textContent!.includes('读者甲')) {
        throw new Error('comment list disappeared after expanding')
      }
    })
  }, 4000)

  it('hides the widget\u2019s own comment list so host-rendered comments never reload', async () => {
    await mount()
    await expand()
    const doc = container.querySelector('iframe')!.contentDocument!
    expect(doc.getElementById('kira-widget-list-hidden')).toBeTruthy()
  }, 4000)

  it('mounts the widget only when the sticky trigger is opened', async () => {
    await mount()
    expect(container.querySelector('iframe')).toBeNull()
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
      if (iframe!.style.height !== '48px') {
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
    await mount((el: HTMLElement) => {
      const iframe = document.createElement('iframe')
      Object.defineProperty(iframe, 'contentDocument', {
        get: () => innerDoc,
        configurable: true,
      })
      el.appendChild(iframe)
    })
    await expand()
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

  it('grows the reply box with input instead of scrolling', async () => {
    await mount()
    await expand()
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
