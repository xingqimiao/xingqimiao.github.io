import { describe, expect, it } from 'vitest'
import { replaceSlugs, SLUG_MAPPINGS } from './lib/slug-migration.mjs'

describe('public slug migration contract', () => {
  it('migrates both historic Story slugs to the approved eight-digit numeric slug', () => {
    expect(Object.fromEntries(SLUG_MAPPINGS)).toMatchObject({
      article1: 'un-free-and-equal-transgender-status-and-challenges',
      'cat-birthday-17-kira': '45648863',
      '88737526': '45648863',
    })
    expect(Object.fromEntries(SLUG_MAPPINGS)['88737526']).toMatch(/^\d{8}$/)
    expect(replaceSlugs('/stories/cat-birthday-17-kira')).toBe('/stories/45648863')
    expect(replaceSlugs('/stories/88737526')).toBe('/stories/45648863')
  })
})
