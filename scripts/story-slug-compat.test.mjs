import { describe, expect, it } from 'vitest'
import { STORY_SLUG_ALIASES, workerSource } from './generate-agent-assets.mjs'

async function generatedWorker() {
  const encoded = Buffer.from(workerSource(), 'utf8').toString('base64')
  return import(`data:text/javascript;base64,${encoded}#${Date.now()}`)
}

describe('Story URL compatibility worker', () => {
  it('redirects old Chinese Story URLs while removed English routes fall through unchanged', async () => {
    const { default: worker } = await generatedWorker()
    expect(STORY_SLUG_ALIASES).toEqual({
      '88737526': '45648863',
      'cat-birthday-17-kira': '45648863',
    })

    for (const slug of Object.keys(STORY_SLUG_ALIASES)) {
      const response = await worker.fetch(new Request(`https://kiraequal.com/stories/${slug}?from=bookmark&lang=kept`), {})
      expect(response.status).toBe(308)
      expect(response.headers.get('location')).toBe('https://kiraequal.com/stories/45648863?from=bookmark&lang=kept')

      const requestedPaths = []
      const removedEnglishRoute = await worker.fetch(
        new Request(`https://kiraequal.com/en/stories/${slug}?from=bookmark&lang=kept`),
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
      expect(requestedPaths).toEqual([`/en/stories/${slug}`])
    }
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
