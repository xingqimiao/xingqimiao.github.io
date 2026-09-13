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

// Tests below replace these with Object.defineProperty, which
// vi.restoreAllMocks does not undo — so they leak into the next test (a stale
// ?comments=1 makes an unrelated test think the reader asked for the thread).
const ORIGINAL_LOCATION = window.location
const ORIGINAL_HISTORY = window.history
const ORIGINAL_SCROLL_TO = window.scrollTo

const restoreWindowGlobals = () => {
  Object.defineProperty(window, 'location', { configurable: true, value: ORIGINAL_LOCATION })
  Object.defineProperty(window, 'history', { configurable: true, value: ORIGINAL_HISTORY })
  Object.defineProperty(window, 'scrollTo', { configurable: true, value: ORIGINAL_SCROLL_TO })
  window.sessionStorage.clear()
}

const emptyPayload = { viewer: { loggedIn: false }, comments: [] }

const comment = (overrides: Record<string, unknown> = {}) => ({
  id: 'c1',
  bodyHtml: '第一句话',
  createdAt: '2026-09-01T10:00:00.000Z',
  edited: false,
  isMine: false,
  author: { name: '猫猫' },
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

  it('reserves the 40vh gap only on short pages', () => {
    // Short pages float the pill over the body, so the gap keeps it clear of
    // the text. Long pages have no floating pill and must butt straight up
    // against the article rather than leaving a screen of empty space.
    const short = renderToStaticMarkup(<CommentsSection {...base} shortPage={true} />)
    expect(short).toContain('mt-[40vh]')

    const long = renderToStaticMarkup(<CommentsSection {...base} shortPage={false} />)
    expect(long).not.toContain('mt-[40vh]')
    expect(long).not.toContain('40vh')
    // The separator rule and heading stay; only the gap goes.
    expect(long).toContain('reading-rule')
    expect(long).toContain(COMMENT_COPY.heading)
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
    restoreWindowGlobals()
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
    // No X handle is shown for a comment: the nickname is the identity.
    expect(container.textContent).not.toContain('@')
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
              author: { name: '别人' },
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
    // The intent rides in the query, because the callback is a server redirect
    // and a URL fragment would never reach the server.
    const returnTo = decodeURIComponent(assigned[0].split('return_to=')[1])
    expect(returnTo).toContain('/stories/47228326')
    expect(returnTo).toContain('comments=1')
    // sessionStorage backs it up for the case where the query is stripped.
    expect(window.sessionStorage.getItem('kira-comments-open')).toBe('story:47228326')
  })

  it('keeps an existing query string when building the login return path', async () => {
    stubFetch(emptyPayload)
    await mount()
    await expand()
    const assigned: string[] = []
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/stories/47228326',
        search: '?utm_source=x',
        hash: '#top',
        set href(value: string) {
          assigned.push(value)
        },
        get href() {
          return 'https://kiramyao.com/stories/47228326'
        },
      },
    })
    await act(async () => {
      ;(buttonByText(container, COMMENT_COPY.loginCta) as HTMLButtonElement).dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      )
    })
    const returnTo = decodeURIComponent(assigned[0].split('return_to=')[1])
    expect(returnTo).toContain('utm_source=x')
    expect(returnTo).toContain('comments=1')
  })

  it('reopens the thread when the reader comes back from X', async () => {
    stubFetch({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [comment({ isMine: true })] })
    window.sessionStorage.setItem('kira-comments-open', base.pageId)
    await mount()
    // No pill means openThread already ran on mount.
    expect(container.querySelector('.comment-pill-float')).toBeNull()
    expect(container.textContent).toContain(COMMENT_COPY.heading)
    expect((container.querySelector('textarea') as HTMLTextAreaElement).disabled).toBe(false)
    expect(window.sessionStorage.getItem('kira-comments-open')).toBeNull()
  })

  it('reopens from the ?comments=1 query marker when storage is empty', async () => {
    stubFetch({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [] })
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname: '/stories/47228326', search: '?comments=1', hash: '', href: 'https://kiramyao.com/stories/47228326?comments=1' },
    })
    Object.defineProperty(window, 'history', { configurable: true, value: { replaceState: vi.fn() } })
    await mount()
    expect(container.textContent).toContain(COMMENT_COPY.heading)
    expect(container.querySelector('.comment-pill-float')).toBeNull()
  })

  it('scrolls the reader back to the thread on the return trip', async () => {
    stubFetch(emptyPayload)
    const scrollTo = vi.fn()
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: scrollTo })
    window.sessionStorage.setItem('kira-comments-open', base.pageId)
    await mount()
    // Landing at the top of a long article is exactly what this prevents.
    expect(scrollTo).toHaveBeenCalled()
    const arg = scrollTo.mock.calls.at(-1)![0] as { top: number }
    expect(typeof arg.top).toBe('number')
    expect(arg.top).toBeGreaterThanOrEqual(0)
  })

  it('does not scroll when the reader never asked for the thread', async () => {
    stubFetch(emptyPayload)
    const scrollTo = vi.fn()
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: scrollTo })
    await mount()
    expect(scrollTo).not.toHaveBeenCalled()
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
        JSON.stringify({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [comment()] }),
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
          JSON.stringify({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [] }),
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
      viewer: { loggedIn: true, identity: '猫猫' },
      comments: [
        comment({ id: 'mine', bodyHtml: '我的', isMine: true }),
        comment({
          id: 'theirs',
          bodyHtml: '别人的',
          isMine: false,
          author: { name: '别人' },
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
        JSON.stringify({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [comment()] }),
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
    expect(container.textContent).toContain('回复 猫猫')

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

describe('CommentsSection (self-hosted) logout', () => {
  let root: Root
  let container: HTMLDivElement

  const mount = async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<CommentsSection {...base} />)
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
  }

  const expand = async () => {
    const trigger = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === COMMENT_COPY.pill,
    ) as HTMLButtonElement
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    restoreWindowGlobals()
    container?.remove()
    if (root) {
      void act(() => {
        root.unmount()
      })
    }
  })

  it('offers a way out once signed in, and names the account', async () => {
    stubFetch({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [] })
    await mount()
    await expand()
    const text = container.textContent ?? ''
    expect(text).toContain(COMMENT_COPY.logout)
    // Logging out is only meaningful if the reader can see who they are.
    expect(text).toContain('猫猫')
  })

  it('signed-out readers see login, never logout', async () => {
    stubFetch(emptyPayload)
    await mount()
    await expand()
    const text = container.textContent ?? ''
    expect(text).toContain(COMMENT_COPY.loginCta)
    expect(text).not.toContain(COMMENT_COPY.logout)
  })

  it('posts to the logout endpoint and returns the form to signed-out', async () => {
    let signedIn = true
    const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/auth/logout')) {
        expect(init?.method).toBe('POST')
        signedIn = false
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      return new Response(
        JSON.stringify({
          viewer: signedIn ? { loggedIn: true, identity: '猫猫' } : { loggedIn: false },
          comments: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    await mount()
    await expand()

    const logoutButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === COMMENT_COPY.logout,
    ) as HTMLButtonElement
    expect(logoutButton).toBeTruthy()
    await act(async () => {
      logoutButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/auth/logout'))).toBe(true)
    // The form must actually flip back, not just hide the button.
    expect(container.textContent).toContain(COMMENT_COPY.loginCta)
    expect(container.textContent).not.toContain(COMMENT_COPY.logout)
  })

  it('says so if logging out fails, instead of silently staying signed in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown) => {
        if (String(input).endsWith('/auth/logout')) return new Response('{}', { status: 500 })
        return new Response(
          JSON.stringify({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }),
    )
    await mount()
    await expand()
    const logoutButton = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === COMMENT_COPY.logout,
    ) as HTMLButtonElement
    await act(async () => {
      logoutButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(container.textContent).toContain(COMMENT_COPY.sendFailed)
  })
})

describe('CommentsSection (self-hosted) nickname', () => {
  let root: Root
  let container: HTMLDivElement

  const mount = async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root.render(<CommentsSection {...base} />)
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
  }

  const expand = async () => {
    const trigger = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent === COMMENT_COPY.pill,
    ) as HTMLButtonElement
    await act(async () => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
  }

  const nicknameInput = () => container.querySelector('#kira-comment-nickname') as HTMLInputElement

  const typeInto = async (el: HTMLInputElement | HTMLTextAreaElement, value: string) => {
    const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement : window.HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value')!.set!
    await act(async () => {
      setter.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    restoreWindowGlobals()
    container?.remove()
    if (root) {
      void act(() => {
        root.unmount()
      })
    }
  })

  it('offers a nickname field, defaulting to the reader’s own name', async () => {
    stubFetch({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [] })
    await mount()
    await expand()
    const input = nicknameInput()
    expect(input).toBeTruthy()
    // Convenient default, not a locked-in handle.
    expect(input.value).toBe('猫猫')
    expect(container.textContent).toContain(COMMENT_COPY.nicknameLabel)
    expect(container.textContent).toContain(COMMENT_COPY.nicknameHint)
  })

  it('posts the typed nickname, not the account name', async () => {
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return new Response(JSON.stringify({ comment: { id: 'n' } }), { status: 201 })
      }
      return new Response(
        JSON.stringify({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    await mount()
    await expand()

    await typeInto(nicknameInput(), '  匿名小鱼干  ')
    await typeInto(container.querySelector('textarea') as HTMLTextAreaElement, '你好')
    await act(async () => {
      (container.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    const post = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'POST')
    const body = JSON.parse((post![1] as RequestInit).body as string)
    expect(body.displayName).toBe('匿名小鱼干')
    // The account identity must never be sent as the published name.
    expect(body.displayName).not.toBe('猫猫')
    expect(JSON.stringify(body)).not.toContain('identity')
  })

  it('refuses an over-long nickname instead of silently trimming it', async () => {
    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      if (init?.method === 'POST') return new Response('{}', { status: 201 })
      return new Response(
        JSON.stringify({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })
    vi.stubGlobal('fetch', fetchMock)
    await mount()
    await expand()
    await typeInto(nicknameInput(), '喵'.repeat(33))
    await typeInto(container.querySelector('textarea') as HTMLTextAreaElement, '内容')
    await act(async () => {
      (container.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      )
    })
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    expect(container.textContent).toContain(COMMENT_COPY.nicknameTooLong)
    expect(fetchMock.mock.calls.some(([, i]) => (i as RequestInit)?.method === 'POST')).toBe(false)
  })

  it('remembers the nickname for next time', async () => {
    stubFetch({ viewer: { loggedIn: true, identity: '猫猫' }, comments: [] })
    window.localStorage.setItem('kira-comments-nickname', '上次用的名字')
    await mount()
    await expand()
    expect(nicknameInput().value).toBe('上次用的名字')
  })

  it('shows no nickname field to a signed-out reader', async () => {
    stubFetch(emptyPayload)
    await mount()
    await expand()
    expect(nicknameInput()).toBeNull()
  })
})
