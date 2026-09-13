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
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CommentsSection, COMMENT_COPY, CAT_EMPTY_LINES } from './CommentsSection'

const base = {
  apiUrl: 'https://api.kiramyao.com',
  pageId: 'story:47228326',
  pageUrl: 'https://kiramyao.com/stories/47228326',
  pageTitle: '逃离上精卫',
}

const emptyPayload = { viewer: { loggedIn: false }, comments: [] }

const comment = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  bodyHtml: '第一句话',
  createdAt: '2026-09-01T10:00:00.000Z',
  edited: false,
  isMine: false,
  author: { username: 'neko', name: '猫猫', avatar: null },
  replies: [],
  ...overrides,
})

const stubFetch = (body: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    ),
  )

// Flush the two rAF hops the grow animations wait on, plus a timer turn.
const settle = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

const setTextarea = async (textarea: HTMLTextAreaElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(textarea, value)
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const buttonByText = (container: HTMLElement, label: string) =>
  Array.from(container.querySelectorAll('button')).find((button) => button.textContent === label)

describe('CommentsSection (self-hosted)', () => {
  it('renders nothing until an API URL is configured', () => {
    expect(renderToStaticMarkup(<CommentsSection {...base} apiUrl="" />)).toBe('')
  })

  it('renders the floating pill in server HTML on short pages', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} shortPage={true} />)
    expect(html).toContain(COMMENT_COPY.pill)
    expect(html).toContain('fixed')
    expect(html).toContain('bottom-4')
    expect(html).toContain('comment-pill-float')
    expect(html).toContain('grid-template-rows:0fr')
    // No third-party widget markup survives the migration.
    expect(html).not.toContain('cusdis')
    expect(html).not.toContain('data-app-id')
    const headlineIndex = html.indexOf(COMMENT_COPY.heading)
    const pillIndex = html.indexOf(COMMENT_COPY.pill)
    expect(headlineIndex).toBeGreaterThan(-1)
    expect(pillIndex).toBeGreaterThan(headlineIndex)
  })

  it('renders the pill in normal document flow for long articles without fixing it to viewport', () => {
    const html = renderToStaticMarkup(<CommentsSection {...base} shortPage={false} />)
    expect(html).toContain(COMMENT_COPY.pill)
    expect(html).not.toContain('fixed')
    expect(html).not.toContain('bottom-4')
    expect(html).not.toContain('comment-pill-float')
    expect(html).toContain('mx-auto mb-3 max-w-[720px]')
  })

  it('keeps the composer off the site palette so it can follow the reader theme', async () => {
    // The composer used to carry bg-white/60 + border-black/10, which painted a
    // near-white box onto the dark reader. Those utilities must stay out; the
    // reader-scoped .comment-composer rules own its colours instead.
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const source = await fs.readFile(
      path.resolve(process.cwd(), 'src/components/reading/CommentsSection.tsx'),
      'utf8',
    )
    expect(source).toContain('className="comment-composer"')
    expect(source).not.toMatch(/comment-composer[^"]*bg-white/)
    expect(source).not.toMatch(/comment-composer[^"]*border-black/)
  })

  it('ships reader-dark composer rules in the stylesheet', async () => {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const css = await fs.readFile(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf8')
    // Both palettes must style the composer, or one of them gets a foreign box.
    expect(css).toContain('.comment-composer {')
    expect(css).toMatch(/\.reading-page\[data-theme="dark"\] \.comment-composer \{/)
    expect(css).toMatch(/\.comment-composer:focus-visible/)
    // It grows first; scrolling only appears once the JS cap is reached.
    expect(css).toMatch(/\.comment-composer \{[^}]*overflow-y: hidden/)
  })

  it('keys the pill colours off the reader theme, not the site theme', () => {
    // The reading page manages its own light/dark palette through
    // main[data-theme]; the site-wide `.dark` class is independent of that
    // toggle, so site-scoped colour utilities leave the pill light on a dark read.
    const html = renderToStaticMarkup(<CommentsSection {...base} />)
    expect(html).toContain('comment-pill')
    expect(html).not.toContain('bg-background/90')
    expect(html).not.toContain('dark:border-white/15')
    expect(html).not.toContain('dark:bg-white/10')
  })

  it('carries no third-party widget code', async () => {
    const fs = await import('node:fs/promises')
    const path = await import('node:path')
    const source = await fs.readFile(
      path.resolve(process.cwd(), 'src/components/reading/CommentsSection.tsx'),
      'utf8',
    )
    expect(source).not.toMatch(/cusdis/i)
    expect(source).not.toContain('<iframe')
    expect(source).not.toContain("createElement('script')")
    expect(source).not.toContain('contentDocument')
  })
})

describe('CommentsSection (self-hosted) thread', () => {
  let root: Root
  let container: HTMLDivElement

  const mount = async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<CommentsSection {...base} />)
    })
    await settle()
  }

  const expand = async () => {
    const trigger = buttonByText(container, COMMENT_COPY.pill) as HTMLButtonElement
    expect(trigger).toBeTruthy()
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    // openThread fades the pill away first and mounts the thread 160ms later.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200))
    })
    await settle()
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    container?.remove()
    if (root) {
      void act(() => {
        root.unmount()
      })
    }
  })

  it('lists published comments straight from our API without opening the thread', async () => {
    stubFetch({ viewer: { loggedIn: false }, comments: [comment()] })
    await mount()
    expect(container.textContent).toContain('第一句话')
    expect(container.textContent).toContain('猫猫')
    expect(container.textContent).toContain('@neko')
    expect(container.textContent).toContain('2026-09-01')
  })

  it('renders a cat line when the thread is empty', async () => {
    stubFetch(emptyPayload)
    await mount()
    const text = container.textContent ?? ''
    expect(CAT_EMPTY_LINES.some((line) => text.includes(line))).toBe(true)
  })

  it('shows a recoverable message when the API is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )
    await mount()
    expect(container.textContent).toContain(COMMENT_COPY.loadFailed)
  })

  it('requests the thread for the page it was given', async () => {
    stubFetch(emptyPayload)
    await mount()
    const called = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as string
    expect(called).toBe(
      `https://api.kiramyao.com/comments/api/comments?pageId=${encodeURIComponent('story:47228326')}`,
    )
  })

  it('renders nested replies from the API payload', async () => {
    stubFetch({
      viewer: { loggedIn: false },
      comments: [
        comment({
          replies: [
            comment({
              id: 'c2',
              bodyHtml: '回复你',
              author: { username: 'other', name: '别人', avatar: null },
            }),
          ],
        }),
      ],
    })
    await mount()
    expect(container.textContent).toContain('第一句话')
    expect(container.textContent).toContain('回复你')
    expect(container.querySelector('.comment-reply-thread')).toBeTruthy()
  })

  it('offers X login when nobody is signed in', async () => {
    stubFetch(emptyPayload)
    await mount()
    await expand()
    expect(container.textContent).toContain(COMMENT_COPY.loginCta)
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    expect(textarea.disabled).toBe(true)
    expect(textarea.placeholder).toBe(COMMENT_COPY.loginRequired)
  })

  it('sends the reader to our own OAuth start with a return path', async () => {
    stubFetch(emptyPayload)
    await mount()
    await expand()
    const assigned: string[] = []
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/stories/47228326',
        search: '',
        hash: '',
        set href(value: string) {
          assigned.push(value)
        },
        get href() {
          return 'https://kiramyao.com/stories/47228326'
        },
      },
    })
    const loginButton = buttonByText(container, COMMENT_COPY.loginCta) as HTMLButtonElement
    await act(async () => {
      loginButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    expect(assigned).toHaveLength(1)
    expect(assigned[0].startsWith('https://api.kiramyao.com/comments/auth/x/start?return_to=')).toBe(true)
    expect(decodeURIComponent(assigned[0])).toContain('/stories/47228326')
    // The reopen intent survives the round trip through X.
    expect(window.sessionStorage.getItem('kira-comments-open')).toBe('story:47228326')
  })

  it('reopens the thread when the reader comes back from X', async () => {
    stubFetch({ viewer: { loggedIn: true, username: 'neko' }, comments: [comment({ isMine: true })] })
    window.sessionStorage.setItem('kira-comments-open', base.pageId)
    await mount()
    // No pill means openThread already ran on mount.
    expect(container.querySelector('.comment-pill-float')).toBeNull()
    expect(container.textContent).toContain(COMMENT_COPY.heading)
    expect((container.querySelector('textarea') as HTMLTextAreaElement).disabled).toBe(false)
    expect(window.sessionStorage.getItem('kira-comments-open')).toBeNull()
  })

  it('posts a signed-in comment and reloads the thread', async () => {
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return new Response(JSON.stringify({ comment: { id: 'new' } }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(
        JSON.stringify({ viewer: { loggedIn: true, username: 'neko' }, comments: [comment()] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    await mount()
    await expand()
    await setTextarea(container.querySelector('textarea') as HTMLTextAreaElement, ' 第二句话 ')

    await act(async () => {
      (container.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      )
    })
    await settle()

    const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'POST')
    expect(post).toBeTruthy()
    const body = JSON.parse((post![1] as RequestInit).body as string)
    expect(body.pageId).toBe('story:47228326')
    expect(body.body).toBe('第二句话')
    expect(body.pageTitle).toBe('逃离上精卫')
    // An absent parentId means a top-level comment, not a reply.
    expect(body.parentId).toBeUndefined()
    // The box is cleared once the comment is accepted.
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('')
  })

  it('turns a failed post into a message instead of losing the text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: unknown, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return new Response(JSON.stringify({ error: 'too many comments' }), { status: 429 })
        }
        return new Response(
          JSON.stringify({ viewer: { loggedIn: true, username: 'neko' }, comments: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }),
    )
    await mount()
    await expand()
    await setTextarea(container.querySelector('textarea') as HTMLTextAreaElement, '会失败的评论')
    await act(async () => {
      (container.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      )
    })
    await settle()
    expect(container.textContent).toContain(COMMENT_COPY.sendFailed)
    // The reader's text is still there to retry.
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toBe('会失败的评论')
  })

  it('only offers delete on the reader’s own comments', async () => {
    stubFetch({
      viewer: { loggedIn: true, username: 'neko' },
      comments: [
        comment({ id: 'mine', bodyHtml: '我的', isMine: true }),
        comment({
          id: 'theirs',
          bodyHtml: '别人的',
          isMine: false,
          author: { username: 'other', name: '别人', avatar: null },
        }),
      ],
    })
    await mount()
    await expand()
    const removeButtons = Array.from(container.querySelectorAll('button')).filter(
      (button) => button.textContent === COMMENT_COPY.remove,
    )
    expect(removeButtons).toHaveLength(1)
  })

  it('replies to a specific comment by sending its id', async () => {
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return new Response(JSON.stringify({ comment: { id: 'r1' } }), { status: 201 })
      }
      return new Response(
        JSON.stringify({ viewer: { loggedIn: true, username: 'neko' }, comments: [comment()] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    await mount()
    await expand()

    await act(async () => {
      (buttonByText(container, COMMENT_COPY.reply) as HTMLButtonElement).dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
    })
    expect(container.textContent).toContain('回复 @猫猫')

    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    expect(textarea.placeholder).toBe(COMMENT_COPY.replyPlaceholder)
    await setTextarea(textarea, '回复内容')
    await act(async () => {
      (container.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      )
    })
    await settle()

    const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'POST')
    expect(JSON.parse((post![1] as RequestInit).body as string).parentId).toBe('c1')
  })

  it('surfaces a failed X login from the callback flag', async () => {
    stubFetch(emptyPayload)
    const replaceState = vi.fn()
    Object.defineProperty(window, 'history', { configurable: true, value: { replaceState } })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/stories/47228326',
        search: '?comment_error=login_failed',
        hash: '',
        href: 'https://kiramyao.com/stories/47228326?comment_error=login_failed',
      },
    })
    await mount()
    expect(container.textContent).toContain(COMMENT_COPY.loginFailed)
    expect(replaceState).toHaveBeenCalled()
  })

  it('reports a blocked account distinctly from a failed login', async () => {
    stubFetch(emptyPayload)
    Object.defineProperty(window, 'history', { configurable: true, value: { replaceState: vi.fn() } })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/stories/47228326',
        search: '?comment_error=blocked',
        hash: '',
        href: 'https://kiramyao.com/stories/47228326?comment_error=blocked',
      },
    })
    await mount()
    expect(container.textContent).toContain(COMMENT_COPY.loginBlocked)
  })
})
