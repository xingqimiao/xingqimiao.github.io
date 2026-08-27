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
import { CommentsSection, CUSDIS_ZH_CN_LOCALE, CAT_EMPTY_LINES } from './CommentsSection'

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

  it('renders the floating pill in server HTML without pre-mounting the lazy thread', () => {
    // The float must hold from the very first paint: a measurement-applied
    // float only lands after hydration and re-decides on every scroll, which
    // is what dropped the pill back into the flow mid-read on phones.
    const html = renderToStaticMarkup(<CommentsSection {...base} />)
    expect(html).toContain('添加公开评论…')
    expect(html).toContain('fixed')
    expect(html).toContain('bottom-4')
    // The delayed entrance keeps the pill invisible while the page-rise
    // animation's live transform cages it (.page-enter becomes a containing
    // block mid-animation); it may only become visible pinned to the viewport.
    expect(html).toContain('comment-pill-float')
    // The preview row ships closed so its later opening is a smooth growth,
    // never a layout jump, and hydration sees the same collapsed row.
    expect(html).toContain('grid-template-rows:0fr')
    expect(html).not.toContain('id="cusdis_thread"')
    expect(html).not.toContain('data-app-id')
    const headlineIndex = html.indexOf('评论区')
    const pillIndex = html.indexOf('添加公开评论…')
    expect(headlineIndex).toBeGreaterThan(-1)
    expect(pillIndex).toBeGreaterThan(headlineIndex)
  })

  it('keys the pill colours off the reader theme, not the site theme', () => {
    // The reading page manages its own light/dark palette through
    // main[data-theme]; the site-wide `.dark` class (which tailwind `dark:`
    // variants and --background follow) is independent of that toggle, so
    // site-scoped colour utilities leave the pill light on a dark read.
    const html = renderToStaticMarkup(<CommentsSection {...base} />)
    expect(html).toContain('comment-pill')
    expect(html).not.toContain('bg-background/90')
    expect(html).not.toContain('dark:border-white/15')
    expect(html).not.toContain('dark:bg-white/10')
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
            replies: {
              data: [
                {
                  id: 'c2',
                  by_nickname: '作者',
                  content: '谢谢',
                  parsedContent: '<p>谢谢</p>',
                  createdAt: '2026-08-25T08:00:00.000Z',
                  parsedCreatedAt: 'Invalid Date',
                },
              ],
            },
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
    // The reply indent follows the reader theme like the pill does; the
    // site-scoped `dark:` variant never flips with main[data-theme].
    const replyList = container.querySelector('ul.comment-reply-thread')
    expect(replyList).not.toBeNull()
    expect(replyList!.className).not.toContain('dark:border-white/10')
  })

  it('pins the pill without ever measuring the viewport or listening to scroll', async () => {
    // The float must never be re-decided mid-read: on phones the URL bar
    // resizes the viewport and late images push the section down, which kept
    // flipping the old top <= innerHeight check and unpinning the pill while
    // the reader scrolled. No scroll/resize listener may ever exist.
    const listenerSpy = vi.spyOn(window, 'addEventListener')
    await mount()
    const wrapper = container.querySelector('button')!.parentElement!
    expect(wrapper.className).toContain('fixed')
    expect(wrapper.className).toContain('bottom-4')
    const listened = listenerSpy.mock.calls.filter(
      ([type]) => type === 'scroll' || type === 'resize',
    )
    expect(listened).toHaveLength(0)
    listenerSpy.mockRestore()
  }, 4000)

  it('grows the comment preview in instead of popping it', async () => {
    // The preview lands after the Cusdis round trip; without motion it pops
    // into place. It must arrive the same way the opened thread does: inside
    // a clipped grid row that transitions 0fr -> 1fr while the content fades
    // and rises, so everything below slides down with it.
    stubFetch({
      data: {
        data: [
          { id: 'c1', by_nickname: '读者甲', parsedContent: '<p>说得对</p>', createdAt: '2026-08-24T19:38:10.410Z' },
        ],
      },
    })
    await mount()
    await waitForAssert(() => {
      const list = container.querySelector('ol')
      if (!list) throw new Error('comment list missing')
      const enter = list.parentElement as HTMLElement
      if (!enter.className.includes('comment-preview-enter')) {
        throw new Error('preview content has no enter animation')
      }
      const clip = enter.parentElement as HTMLElement
      const row = clip.parentElement as HTMLElement
      if (!row.className.includes('transition-[grid-template-rows]')) {
        throw new Error('preview row is not animated')
      }
      if (row.style.gridTemplateRows !== '1fr') {
        throw new Error(`preview row still ${row.style.gridTemplateRows}`)
      }
      if (!clip.className.includes('overflow-hidden')) {
        throw new Error('preview row is not clipped while growing')
      }
    })
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

  it('greets with a cat line when there are no comments yet', async () => {
    await mount()
    await waitForAssert(() => {
      if (!container.textContent!.includes('喵')) {
        throw new Error('empty-state cat line missing')
      }
    })
  }, 4000)

  it('draws the empty-state line randomly from the cat phrase pool', async () => {
    expect(CAT_EMPTY_LINES.length).toBeGreaterThanOrEqual(5)
    for (const line of CAT_EMPTY_LINES) {
      expect(line).toContain('喵')
    }
    await mount()
    await waitForAssert(() => {
      const line = container.querySelector('.comment-preview-enter p')
      if (!line) throw new Error('empty-state line missing')
      if (!CAT_EMPTY_LINES.includes(line.textContent!.trim())) {
        throw new Error(`empty line not from pool: ${line.textContent}`)
      }
    })
  }, 4000)

  const setPointerCoarse = (coarse: boolean) => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query.includes('pointer: coarse') ? coarse : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList)
  }

  const stubScrollTo = () => {
    const scrollTo = vi.fn()
    Object.defineProperty(window, 'scrollTo', {
      value: scrollTo,
      configurable: true,
      writable: true,
    })
    return scrollTo
  }

  const deepSection = () =>
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 2000,
      bottom: 2000,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)

  it('glides the pill target into view on a coarse pointer, capped at 60% of the screen', async () => {
    setPointerCoarse(true)
    const scrollTo = stubScrollTo()
    const spy = deepSection()
    try {
      await mount()
      await expand()
      expect(scrollTo).toHaveBeenCalledTimes(1)
      const [arg] = scrollTo.mock.calls[0]
      expect(arg.behavior).toBe('smooth')
      // 2000px away, landing offset 35% of the viewport: the 60% cap wins.
      expect(arg.top).toBe(Math.round(window.innerHeight * 0.6))
    } finally {
      spy.mockRestore()
    }
  }, 4000)

  it('does not move the page at all on a fine pointer', async () => {
    setPointerCoarse(false)
    const scrollTo = stubScrollTo()
    const spy = deepSection()
    try {
      await mount()
      await expand()
      expect(scrollTo).not.toHaveBeenCalled()
    } finally {
      spy.mockRestore()
    }
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

  it('grows the thread open through an animated row instead of snapping in', async () => {
    // The reader sees everything below the thread slide down with it; that
    // only happens when the panel sits in a grid row that transitions from
    // 0fr to 1fr inside an overflow-clipped track. A bare panel mount is the
    // instant reflow readers experienced as the thread "jumping down".
    await mount()
    await expand()
    await waitForAssert(() => {
      const thread = container.querySelector('#cusdis_thread')
      if (!thread) throw new Error('thread missing')
      // thread -> panel -> clip -> row
      const clip = thread.parentElement!.parentElement as HTMLElement
      const row = clip.parentElement as HTMLElement
      if (!row.className.includes('transition-[grid-template-rows]')) {
        throw new Error('row is not animated')
      }
      if (row.style.gridTemplateRows !== '1fr') {
        throw new Error(`row still ${row.style.gridTemplateRows}`)
      }
      if (!clip.className.includes('overflow-hidden')) {
        throw new Error('row content is not clipped while growing')
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

  it('never lets the widget document scroll inside the iframe', async () => {
    // The srcdoc swap between the widget's temp and real documents can
    // briefly or permanently lose the compaction style and the height tune,
    // which lets the iframe grow its own inner scrollbar. The injected style
    // must clamp the widget document so no inner scrollbar can ever appear.
    await mount()
    await expand()
    const doc = container.querySelector('iframe')!.contentDocument!
    await waitForAssert(() => {
      const style = doc.getElementById('kira-comment-shape')
      if (style && style.textContent!.includes('overflow: hidden')) return
      if (style?.sheet && [...style.sheet.cssRules].some((r) => r.cssText.includes('overflow:hidden'))) return
      throw new Error('widget doc is not clamped from inner scrolling')
    })
  }, 4000)

  it('tunes the iframe to the taller of body and documentElement', async () => {
    // Some widget states grow the html box beyond the body (margins, swapped
    // root); body-only tuning left the iframe short and the doc scrollable.
    await mount()
    await expand()
    const iframe = container.querySelector('iframe')!
    const doc = iframe.contentDocument!
    Object.defineProperty(doc.body, 'scrollHeight', { get: () => 48, configurable: true })
    Object.defineProperty(doc.documentElement, 'scrollHeight', {
      get: () => 700,
      configurable: true,
    })
    doc.body.appendChild(document.createElement('p'))
    await waitForAssert(() => {
      if (iframe.style.height !== '700px') {
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
