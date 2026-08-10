import { describe, expect, it } from 'vitest'
import { planMarkdownImages } from './lib/article-image-migration.mjs'

describe('article image filename migration', () => {
  it('repairs spaces and legacy folders using article-slug sequence names', async () => {
    const markdown = '![A](/pic/blog/ChatGPT Image.png)\n![B](/pic/story/old.jpg)'
    const found = new Map([
      ['/pic/blog/ChatGPT Image.png', { sourcePath: 'C:/site/public/pic/blog/ChatGPT Image.png', extension: '.png' }],
      ['/pic/story/old.jpg', { sourcePath: 'C:/site/public/pic/story/old.jpg', extension: '.jpg' }],
    ])
    const plan = await planMarkdownImages({ markdown, slug: 'ios-26-5-pride-wallpapers', category: 'blog', locate: async (url) => found.get(url) })

    expect(plan.markdown).toBe('![A](/pic/blog/ios-26-5-pride-wallpapers-01.png)\n![B](/pic/blog/ios-26-5-pride-wallpapers-02.jpg)')
    expect(plan.files.map((file) => file.publicUrl)).toEqual(['/pic/blog/ios-26-5-pride-wallpapers-01.png', '/pic/blog/ios-26-5-pride-wallpapers-02.jpg'])
  })

  it('reuses one target when the same source appears twice', async () => {
    const plan = await planMarkdownImages({
      markdown: '![](same.png)\n![](same.png)', slug: 'post', category: 'blog',
      locate: async () => ({ sourcePath: 'C:/same.png', extension: '.png' }),
    })
    expect(plan.files).toHaveLength(1)
    expect(plan.markdown).toBe('![](/pic/blog/post-01.png)\n![](/pic/blog/post-01.png)')
  })

  it('preserves missing images and reports them', async () => {
    const markdown = '![](/pic/blog/missing.png)'
    const plan = await planMarkdownImages({ markdown, slug: 'post', category: 'blog', locate: async () => undefined })
    expect(plan.markdown).toBe(markdown)
    expect(plan.missing).toEqual(['/pic/blog/missing.png'])
  })
})
