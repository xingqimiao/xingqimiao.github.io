import { describe, expect, it } from 'vitest'
import sitemap from './sitemap'

describe('public sitemap', () => {
  it('publishes Chinese routes only and omits the organization About page', () => {
    const entries = sitemap()
    const urls = entries.map((entry) => new URL(entry.url).pathname)

    expect(urls).toContain('/')
    expect(urls).toContain('/about-kiramyao')
    expect(urls).not.toContain('/about')
    expect(urls.some((url) => url === '/en' || url.startsWith('/en/'))).toBe(false)
    expect(entries.every((entry) => entry.alternates === undefined)).toBe(true)
  })
})
