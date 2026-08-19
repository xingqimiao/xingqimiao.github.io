import { describe, expect, it } from 'vitest'
import { workerSource } from './generate-agent-assets.mjs'

async function generatedWorker() {
  const encoded = Buffer.from(workerSource(), 'utf8').toString('base64')
  return import(`data:text/javascript;base64,${encoded}#${Date.now()}`)
}

describe('Story URL compatibility worker', () => {
  it('no longer 308-redirects old Story URLs and recovers /fetch to /stories', async () => {
    const { default: worker } = await generatedWorker()
    // Story alias redirects are removed: old slugs fall through to static hosting.
    for (const slug of ['88737526', 'cat-birthday-17-kira']) {
      const requestedPaths = []
      const response = await worker.fetch(
        new Request(`https://kiraequal.org/stories/${slug}?from=bookmark&lang=kept`),
        {
          ASSETS: {
            async fetch(request) {
              requestedPaths.push(new URL(request.url).pathname)
              return new Response('Not found', { status: 404 })
            },
          },
        },
      )
      expect(response.status).toBe(404)
      expect(response.headers.get('location')).toBeNull()
      expect(requestedPaths).toEqual([`/stories/${slug}`])

      // Removed English routes still fall through unchanged.
      const removedEnglishRoute = await worker.fetch(
        new Request(`https://kiraequal.org/en/stories/${slug}?from=bookmark&lang=kept`),
        {
          ASSETS: {
            async fetch(request) {
              requestedPaths.push(new URL(request.url).pathname)
              return new Response('Not found', { status: 404 })
            },
          },
        },
      )
      expect(removedEnglishRoute.status).toBe(404)
      expect(removedEnglishRoute.headers.get('location')).toBeNull()
      expect(requestedPaths).toEqual([`/stories/${slug}`, `/en/stories/${slug}`])
    }

      // Legacy /fetch (most-crawled 404) is left as an honest 404 and blocked
      // in robots.txt so probing bots stop re-crawling it — no redirect.
      const fetchProbe = await worker.fetch(new Request('https://kiraequal.org/fetch'), {
        ASSETS: {
          async fetch() {
            return new Response('Not found', { status: 404 })
          },
        },
      })
      expect(fetchProbe.status).toBe(404)
      expect(fetchProbe.headers.get('location')).toBeNull()
  })

  it('negotiates Chinese Markdown under /ai without restoring removed /en routes', async () => {
    const { default: worker } = await generatedWorker()
    const requestedPaths = []
    const env = {
      ASSETS: {
        async fetch(request) {
          const pathname = new URL(request.url).pathname
          requestedPaths.push(pathname)
          if (pathname.startsWith('/en/')) return new Response('Not found', { status: 404 })
          return new Response('# Markdown resource')
        },
      },
    }
    const cases = [
      ['/privacy', '/ai/privacy.md'],
      ['/stories/current-story', '/ai/stories/current-story.md'],
      ['/stories/current-story.html', '/ai/stories/current-story.md'],
    ]

    for (const [htmlPath, markdownPath] of cases) {
      const response = await worker.fetch(new Request(`https://kiraequal.org${htmlPath}`, {
        headers: { Accept: 'text/markdown' },
      }), env)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
      expect(requestedPaths.at(-1)).toBe(markdownPath)
    }

    for (const removedPath of ['/en/privacy', '/en/stories/current-story', '/en/stories/current-story.html']) {
      const response = await worker.fetch(new Request(`https://kiraequal.org${removedPath}`, {
        headers: { Accept: 'text/markdown' },
      }), env)
      expect(response.status).toBe(404)
      expect(response.headers.get('location')).toBeNull()
      expect(requestedPaths.at(-1)).toBe(removedPath)
    }
  })
})
