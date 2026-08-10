import { describe, expect, it } from 'vitest'
import { planStoryRegionMigration } from './lib/story-region-migration.mjs'

describe('Stories region migration', () => {
  it('removes region only from Stories metadata and Front Matter', () => {
    const plan = planStoryRegionMigration({
      compiledRaw: JSON.stringify([
        { type: 'stories', slug: 'cat', region: '浙江', experience_date: '2026' },
        { type: 'blog', slug: 'post', region: '保留' },
      ]),
      storySources: new Map([
        ['cat.md', '---\ntitle: 猫\nregion: 浙江\nyear: "2026"\n---\n\n正文\n'],
        ['plain.md', '正文提到 region: 浙江，但不是 Front Matter。\n'],
      ]),
    })

    expect(JSON.parse(plan.compiledNext)).toEqual([
      { type: 'stories', slug: 'cat', experience_date: '2026' },
      { type: 'blog', slug: 'post', region: '保留' },
    ])
    expect(plan.storyNext.get('cat.md')).not.toContain('region:')
    expect(plan.storyNext.get('plain.md')).toContain('region: 浙江')
    expect(plan.removed).toEqual([{ source: 'compiled_articles.json', slug: 'cat', region: '浙江' }, { source: 'cat.md', region: '浙江' }])
  })
})
