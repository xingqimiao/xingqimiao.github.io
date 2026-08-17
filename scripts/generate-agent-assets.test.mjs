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
  ENGLISH_FALLBACK_NOTICE,
  generateAgentAssets,
  joinMarkdown,
  privacyMarkdown,
} from './generate-agent-assets.mjs'
import { verifyCloudflarePages } from './verify-cloudflare-pages.mjs'

describe('agent Markdown localization', () => {
  it('converts HTML bodies through the parser without double-escaping or script leakage', async () => {
    const article = {
      type: 'report',
      slug: 'entity-report',
      title: '实体测试',
      contentHtml: '<p>中文</p>',
      englishTitle: 'Entity test',
      englishContentHtml: '<p>a &amp;lt; b &amp;amp; c</p><script>alert(1)</script><p><img src="/pic/x.png" alt="a > b"> tail</p><ul><li>一</li><li>二</li></ul>',
    }

    const markdown = await articleMarkdown(article, { locale: 'en' })

    expect(markdown).toContain('a &lt; b &amp; c')
    expect(markdown).not.toContain('a < b')
    expect(markdown).not.toContain('alert(1)')
    expect(markdown).toContain('![a > b](/pic/x.png)')
    expect(markdown).toContain('- 一')
    expect(markdown).toContain('- 二')
  })

  it('uses complete English articles and explicitly falls back to the full Chinese article otherwise', async () => {    const complete = {
      type: 'report',
      slug: 'complete-report',
      title: '完整报告',
      contentHtml: '<p>中文正文</p>',
      englishTitle: 'Complete report',
      englishContentHtml: '<p>Full English body</p>',
    }
    const fallbackBody = `第一段\n\n${'完整中文正文'.repeat(1200)}\n\n最后一段`
    const incomplete = {
      type: 'report',
      slug: 'fallback-report',
      title: '需回退的报告',
      contentHtml: `<p>${fallbackBody}</p>`,
      englishTitle: 'Title without a translated body',
      englishContentHtml: '<p>   </p>',
    }

    const english = await articleMarkdown(complete, { locale: 'en' })
    const fallback = await articleMarkdown(incomplete, { locale: 'en' })

    expect(english).toContain('# Complete report')
    expect(english).toContain('Full English body')
    expect(english).not.toContain('中文正文')
    expect(fallback).toContain('English translation is not available yet. The complete Chinese original follows.')
    expect(fallback).toContain('# 需回退的报告')
    expect(fallback).toContain(fallbackBody)
    expect(fallback).not.toContain('Title without a translated body')
  })

  it('never reads Story summaries in either language or any AI resource shape', async () => {
    const forbidden = new Set(['desc', 'englishDescription', 'summary'])
    const story = new Proxy({
      type: 'stories',
      slug: 'safe-story',
      title: '故事标题',
      contentHtml: '<p>完整中文故事</p>',
      englishTitle: 'Story title',
      englishContentHtml: '<p>Complete English story</p>',
      date: '2026-08-09',
      keywords: ['memory'],
    }, {
      get(target, property, receiver) {
        if (forbidden.has(property)) {
          throw new Error(`forbidden Story summary read: ${String(property)}`)
        }
        return Reflect.get(target, property, receiver)
      },
    })

    for (const locale of ['zh', 'en']) {
      const article = await articleMarkdown(story, {
        locale,
        sourceMarkdown: '# 故事标题\n\n完整中文故事',
      })
      const list = articleListMarkdown(
        'stories',
        locale === 'en' ? 'Stories' : '故事',
        locale === 'en' ? 'Story archive.' : '故事归档。',
        [story],
        locale,
      )
      const resource = articleResource(story, locale)
      const index = articleSearchIndex([story], locale, () => new Date('2026-08-09T00:00:00Z'))
      const rendered = `${article}\n${list}\n${JSON.stringify(resource)}\n${JSON.stringify(index)}`

      expect(rendered).not.toContain('description_zh')
      expect(resource).not.toHaveProperty('description')
      expect(index.tokens['safe-story'].length).toBeGreaterThan(0)
    }
  })

  it('uses *_markdown_en for static pages and explicitly preserves every untranslated Chinese field', () => {
    const about = aboutKiraMarkdown(new Proxy({
      title: '关于 KiraMyao',
      englishTitle: 'About KiraMyao',
      kiramyao_markdown: '完整中文个人介绍',
      kiramyao_markdown_en: 'Complete English personal introduction',
    }, {
      get(target, property, receiver) {
        if (String(property).startsWith('content_')) {
          throw new Error('about-kiramyao AI resource must match the HTML route boundary')
        }
        return Reflect.get(target, property, receiver)
      },
    }), 'en')
    const join = joinMarkdown({
      description_markdown: '完整中文加入说明',
      description_markdown_en: 'Complete English joining instructions',
      description_bottom_markdown: '完整中文页尾说明',
      description_bottom_markdown_en: 'Complete English footer instructions',
    }, [{
      id: 'tencent-survey',
      enabled: true,
      label: '一起参与腾讯问卷',
      source: '腾讯问卷',
      url: 'https://example.test/tencent',
      order: 1,
    }], 'en')
    const privacy = privacyMarkdown({
      title: '隐私说明',
      content_markdown: '完整中文隐私正文',
      content_markdown_en: '',
    }, 'en')
    const aboutZh = aboutKiraMarkdown({
      title: '组织页标题不属于此路由',
      kiramyao_markdown: '中文 KiraMyao 介绍',
    }, 'zh')

    expect(about).toContain('Complete English personal introduction')
    expect(about).not.toContain('完整中文个人介绍')
    expect(aboutZh).toContain('# 关于 KiraMyao')
    expect(aboutZh).not.toContain('组织页标题不属于此路由')
    expect(join).toContain('Complete English joining instructions')
    expect(join).toContain('Complete English footer instructions')
    expect(join).not.toContain('完整中文加入说明')
    expect(join).toContain('Take part in the 2026 survey (Tencent Survey)')
    expect(join.match(/Tencent Survey/g)).toHaveLength(1)
    expect(join).not.toContain('腾讯问卷')
    expect(privacy).toContain(ENGLISH_FALLBACK_NOTICE)
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
          englishTitle: 'Current story',
          englishContentHtml: '<p>Complete English story</p>',
          desc: 'SECRET STORY DESC',
          englishDescription: 'SECRET ENGLISH STORY DESC',
          summary: 'SECRET STORY SUMMARY',
          date: '2026-08-09',
        },
        {
          type: 'report',
          slug: 'fallback-report',
          title: '中文报告',
          contentHtml: '<p>报告全文中文 HTML</p>',
          englishTitle: '',
          englishContentHtml: '',
          date: '2026-08-08',
        },
      ]
      await generateAgentAssets({
        outputDir,
        compiledArticles,
        about: {
          title: '关于 KiraMyao',
          kiramyao_markdown: '中文个人介绍',
          kiramyao_markdown_en: 'English personal introduction',
        },
        join: {
          description_markdown: '中文加入',
          description_markdown_en: 'Join in English',
          description_bottom_markdown: '中文页尾',
          description_bottom_markdown_en: 'English footer',
        },
        joinLinks: [],
        privacy: {
          title: '隐私',
          content_markdown: '完整中文隐私',
          content_markdown_en: '',
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
      expect(allStoryResources).not.toContain('SECRET ENGLISH STORY DESC')
      expect(allStoryResources).not.toContain('SECRET STORY SUMMARY')
      expect(zhSearch.language).toBe('zh-CN')
      expect(generatedWorker.STORY_SLUG_ALIASES).toEqual({
        '88737526': '45648863',
        'cat-birthday-17-kira': '45648863',
      })
      expect(generatedWorker.CAT_CAVE_SLUG_ALIASES).toEqual({
        'Becoming-a-Cat-cat!': 'becoming-a-cat-a-story-about-srs',
      })
      const redirect = await generatedWorker.default.fetch(
        new Request('https://kiraequal.org/stories/88737526?source=old'),
        {},
      )
      expect(redirect.status).toBe(308)
      expect(redirect.headers.get('location')).toBe('https://kiraequal.org/stories/45648863?source=old')
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
