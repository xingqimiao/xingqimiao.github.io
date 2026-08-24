import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  articleListMarkdown,
  articleMarkdown,
  articleResource,
  articleSearchIndex,
  aboutKiraMarkdown,
  generateAgentAssets,
  joinMarkdown,
  privacyMarkdown,
} from './generate-agent-assets.mjs'
import { verifyCloudflarePages } from './verify-cloudflare-pages.mjs'

describe('agent Markdown zh-only contract', () => {
  it('converts HTML bodies through the parser without double-escaping or script leakage', async () => {
    const article = {
      type: 'report',
      slug: 'entity-report',
      title: '实体测试',
      contentHtml: '<p>中文</p><p>a &amp;lt; b &amp;amp; c</p><script>alert(1)</script><p><img src="/pic/x.png" alt="a > b"> tail</p><ul><li>一</li><li>二</li></ul>',
    }

    const markdown = await articleMarkdown(article)

    expect(markdown).toContain('a &lt; b &amp; c')
    expect(markdown).not.toContain('a < b')
    expect(markdown).not.toContain('alert(1)')
    expect(markdown).toContain('![a > b](/pic/x.png)')
    expect(markdown).toContain('- 一')
    expect(markdown).toContain('- 二')
  })

  it('renders the Chinese source and never reads the removed English fields', async () => {
    const complete = {
      type: 'report',
      slug: 'complete-report',
      title: '完整报告',
      contentHtml: '<p>中文正文</p>',
    }
    const fallbackBody = `第一段\n\n${'完整中文正文'.repeat(1200)}\n\n最后一段`
    const incomplete = {
      type: 'report',
      slug: 'fallback-report',
      title: '需回退的报告',
      contentHtml: `<p>${fallbackBody}</p>`,
    }
    const proxy = new Proxy(complete, {
      get(target, property, receiver) {
        if (String(property).startsWith('english')) {
          throw new Error(`removed English field read: ${String(property)}`)
        }
        return Reflect.get(target, property, receiver)
      },
    })

    const rendered = await articleMarkdown(proxy)
    const fallback = await articleMarkdown(incomplete)

    expect(rendered).toContain('# 完整报告')
    expect(rendered).toContain('中文正文')
    expect(fallback).toContain('# 需回退的报告')
    expect(fallback).toContain(fallbackBody)
  })

  it('never reads Story summaries in any AI resource shape', async () => {
    const forbidden = new Set(['desc', 'englishDescription', 'englishTitle', 'englishContentHtml', 'summary'])
    const story = new Proxy({
      type: 'stories',
      slug: 'safe-story',
      title: '故事标题',
      contentHtml: '<p>完整中文故事</p>',
      date: '2026-08-09',
      keywords: ['memory'],
    }, {
      get(target, property, receiver) {
        if (forbidden.has(property)) {
          throw new Error(`forbidden story field read: ${String(property)}`)
        }
        return Reflect.get(target, property, receiver)
      },
    })

    const article = await articleMarkdown(story, {
      sourceMarkdown: '# 故事标题\n\n完整中文故事',
    })
    const list = articleListMarkdown('stories', '故事', '故事归档。', [story])
    const resource = articleResource(story)
    const index = articleSearchIndex([story], 'zh', () => new Date('2026-08-09T00:00:00Z'))
    const rendered = `${article}\n${list}\n${JSON.stringify(resource)}\n${JSON.stringify(index)}`

    expect(rendered).not.toContain('description_zh')
    expect(resource).not.toHaveProperty('description')
    expect(index.tokens['safe-story'].length).toBeGreaterThan(0)
  })

  it('renders the static pages from their Chinese fields only', () => {
    const about = aboutKiraMarkdown({
      title: '关于 KiraMyao',
      kiramyao_markdown: '完整中文个人介绍',
    })
    const join = joinMarkdown({
      description_markdown: '完整中文加入说明',
      description_bottom_markdown: '完整中文页尾说明',
    }, [{
      id: 'tencent-survey',
      enabled: true,
      label: '一起参与腾讯问卷',
      source: '腾讯问卷',
      url: 'https://example.test/tencent',
      order: 1,
    }])
    const privacy = privacyMarkdown({
      title: '隐私说明',
      content_markdown: '完整中文隐私正文',
    })

    expect(about).toContain('# 关于 KiraMyao')
    expect(about).toContain('完整中文个人介绍')
    expect(join).toContain('完整中文加入说明')
    expect(join).toContain('完整中文页尾说明')
    expect(join).toContain('一起参与腾讯问卷 (腾讯问卷)')
    expect(privacy).toContain('完整中文隐私正文')
  })

  it('generates the Chinese AI tree and reconciles stale Story Markdown in a temporary directory', async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), 'equal-agent-assets-'))
    const read = (relativePath) => readFile(path.join(outputDir, relativePath), 'utf8')
    try {
      await mkdir(path.join(outputDir, 'ai', 'stories'), { recursive: true })
      await writeFile(path.join(outputDir, 'ai', 'stories', 'a.md'), 'stale zh')

      const compiledArticles = [
        {
          type: 'stories',
          slug: 'current-story',
          title: '当前故事',
          contentHtml: '<p>完整中文故事</p>',
          desc: 'SECRET STORY DESC',
          summary: 'SECRET STORY SUMMARY',
          date: '2026-08-09',
        },
        {
          type: 'report',
          slug: 'fallback-report',
          title: '中文报告',
          contentHtml: '<p>报告全文中文 HTML</p>',
          date: '2026-08-08',
        },
      ]
      await generateAgentAssets({
        outputDir,
        compiledArticles,
        about: {
          title: '关于 KiraMyao',
          kiramyao_markdown: '中文个人介绍',
        },
        join: {
          description_markdown: '中文加入',
          description_bottom_markdown: '中文页尾',
        },
        joinLinks: [],
        privacy: {
          title: '隐私',
          content_markdown: '完整中文隐私',
        },
        actions: [{
          id: '1',
          name: '中文行动名',
          desc: '中文行动说明',
          status: 'running',
        }],
        homepageCards: [{
          id: 1,
          title: '中文首页卡片',
          desc: '中文首页卡片说明',
        }],
        now: () => new Date('2026-08-09T00:00:00Z'),
        sourceMarkdownFor: async (article) => `# ${article.title}\n\n源 Markdown 全文`,
      })
      await writeFile(path.join(outputDir, 'index.html'), '<html lang="zh-CN"></html>')
      await writeFile(path.join(outputDir, 'sitemap.xml'), '<urlset></urlset>')

      const zhStory = await read('ai/stories/current-story.md')
      const zhCatalog = await read('.well-known/api-catalog.json')
      const zhStoryList = await read('ai/stories.md')
      const zhSearch = JSON.parse(await read('ai/search-index.json'))
      const generatedWorker = await import(`${pathToFileURL(path.join(outputDir, '_worker.js')).href}?test=${Date.now()}`)
      const allStoryResources = `${zhStory}\n${zhCatalog}\n${zhStoryList}\n${JSON.stringify(zhSearch)}`

      expect(allStoryResources).not.toContain('SECRET STORY DESC')
      expect(allStoryResources).not.toContain('SECRET STORY SUMMARY')
      expect(zhSearch.language).toBe('zh-CN')
      expect(generatedWorker.CAT_CAVE_SLUG_ALIASES).toEqual({
        'Becoming-a-Cat-cat!': 'becoming-a-cat-a-story-about-srs',
      })
      const removedStoryFallthrough = await generatedWorker.default.fetch(
        new Request('https://kiraequal.org/stories/88737526?source=old', {
          headers: { Accept: 'text/html' },
        }),
        {
          ASSETS: {
            async fetch() {
              return new Response('Not found', { status: 404 })
            },
          },
        },
      )
      expect(removedStoryFallthrough.status).toBe(404)
      expect(removedStoryFallthrough.headers.get('location')).toBeNull()
      const removedCatBirthdayFallthrough = await generatedWorker.default.fetch(
        new Request('https://kiraequal.org/stories/cat-birthday-17-kira'),
        {
          ASSETS: {
            async fetch() {
              return new Response('Not found', { status: 404 })
            },
          },
        },
      )
      expect(removedCatBirthdayFallthrough.status).toBe(404)
      expect(removedCatBirthdayFallthrough.headers.get('location')).toBeNull()
      const fetchProbe = await generatedWorker.default.fetch(
        new Request('https://kiraequal.org/fetch'),
        {
          ASSETS: {
            async fetch() {
              return new Response('Not found', { status: 404 })
            },
          },
        },
      )
      expect(fetchProbe.status).toBe(404)
      expect(fetchProbe.headers.get('location')).toBeNull()
      expect(generatedWorker.CAT_CAVE_SLUG_ALIASES['2026-trans-survival-survey']).toBeUndefined()
      const catRedirectEncoded = await generatedWorker.default.fetch(
        new Request('https://kiraequal.org/cat-cave/Becoming-a-Cat-cat%21'),
        {},
      )
      expect(catRedirectEncoded.status).toBe(308)
      expect(catRedirectEncoded.headers.get('location')).toBe(
        'https://kiraequal.org/cat-cave/becoming-a-cat-a-story-about-srs',
      )

      const englishRouteRequests = []
      const removedEnglishRoute = await generatedWorker.default.fetch(
        new Request('https://kiraequal.org/en/stories/88737526?source=old', {
          headers: { Accept: 'text/markdown' },
        }),
        {
          ASSETS: {
            async fetch(request) {
              englishRouteRequests.push(new URL(request.url).pathname)
              return new Response('Not found', { status: 404 })
            },
          },
        },
      )
      expect(removedEnglishRoute.status).toBe(404)
      expect(removedEnglishRoute.headers.get('location')).toBeNull()
      expect(englishRouteRequests).toEqual(['/en/stories/88737526'])

      await expect(verifyCloudflarePages(outputDir)).resolves.toMatchObject({
        zhLanguage: 'zh-CN',
      })

      await mkdir(path.join(outputDir, 'en'), { recursive: true })
      await writeFile(path.join(outputDir, 'en', 'index.html'), '<html lang="en"></html>')
      await expect(verifyCloudflarePages(outputDir)).rejects.toThrow('Deprecated public route generated: en/index.html')
      await rm(path.join(outputDir, 'en'), { recursive: true, force: true })

      await writeFile(path.join(outputDir, 'ai', 'stories', 'stale.md'), 'stale')
      await expect(verifyCloudflarePages(outputDir)).rejects.toThrow('Unexpected stale Story Markdown')
      await rm(path.join(outputDir, 'ai', 'stories', 'stale.md'))

      const leakingCatalog = JSON.parse(zhCatalog)
      const storyResource = leakingCatalog.resources.find((resource) => resource.kind === 'stories')
      storyResource.description = 'summary leak'
      await writeFile(
        path.join(outputDir, '.well-known', 'api-catalog.json'),
        JSON.stringify(leakingCatalog),
      )
      await expect(verifyCloudflarePages(outputDir)).rejects.toThrow('Story summary field')
      await expect(read('ai/stories/a.md')).rejects.toMatchObject({ code: 'ENOENT' })
    } finally {
      await rm(outputDir, { recursive: true, force: true })
    }
  })
})
