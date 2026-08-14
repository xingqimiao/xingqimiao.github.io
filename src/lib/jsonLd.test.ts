import { describe, expect, it } from 'vitest'
import { articleJsonLd, siteJsonLd, toIsoDate } from './jsonLd'

describe('toIsoDate', () => {
  it('converts year-only dates', () => {
    expect(toIsoDate('2026')).toBe('2026-01-01')
  })

  it('converts dotted dates', () => {
    expect(toIsoDate('2026.08.10')).toBe('2026-08-10')
  })

  it('returns undefined for invalid input', () => {
    expect(toIsoDate(undefined)).toBeUndefined()
    expect(toIsoDate('not-a-date')).toBeUndefined()
    expect(toIsoDate('')).toBeUndefined()
  })
})

describe('siteJsonLd', () => {
  it('exposes Organization and WebSite in a graph', () => {
    const graph = siteJsonLd()['@graph']
    expect(graph.map((node) => node['@type'])).toEqual(['Organization', 'WebSite'])
    const organization = graph[0]
    expect(organization['@id']).toBe('https://kiramyao.com/#organization')
    expect(organization.logo).toContain('/pic/logo/Logo.png')
  })
})

describe('articleJsonLd', () => {
  const base = {
    type: 'stories',
    slug: '10432746',
    title: '性别审判庭',
    description: '一位跨性别者眼中的二元性别世界',
    cover: '/pic/stories/10432746-cover.webp',
    date: '2026',
  }

  it('maps article types to schema types', () => {
    expect(articleJsonLd({ ...base, type: 'stories' })['@type']).toBe('Article')
    expect(articleJsonLd({ ...base, type: 'blog' })['@type']).toBe('BlogPosting')
    expect(articleJsonLd({ ...base, type: 'report' })['@type']).toBe('Report')
    expect(articleJsonLd({ ...base, type: 'documents' })['@type']).toBe('Article')
    expect(articleJsonLd({ ...base, type: 'unknown' })['@type']).toBe('Article')
  })

  it('publishes absolute URLs, ISO dates and organization authorship', () => {
    const jsonLd = articleJsonLd(base)
    expect(jsonLd.headline).toBe('性别审判庭')
    expect(jsonLd.image).toBe('https://kiramyao.com/pic/stories/10432746-cover.webp')
    expect(jsonLd.datePublished).toBe('2026-01-01')
    expect(jsonLd.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://kiramyao.com/stories/10432746',
    })
    expect(jsonLd.author).toMatchObject({ '@type': 'Organization', name: 'KiraMyao Equal' })
    expect(jsonLd.publisher).toEqual({ '@id': 'https://kiramyao.com/#organization' })
  })

  it('omits missing optional fields', () => {
    const jsonLd = articleJsonLd({ type: 'stories', slug: 'x', title: 'T' })
    expect(jsonLd.description).toBeUndefined()
    expect(jsonLd.image).toBeUndefined()
    expect(jsonLd.datePublished).toBeUndefined()
  })
})
