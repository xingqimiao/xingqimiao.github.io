import { describe, expect, it } from 'vitest'
import { articleListCopy } from './articleListPresentation'

describe('article list copy', () => {
  it('provides complete Chinese report controls', () => {
    expect(articleListCopy('zh', 'report')).toEqual({
      title: '研究、数据与正义',
      subtitle: undefined,
      searchPlaceholder: '搜索报告标题或关键词',
      emptyText: '没有找到匹配的报告，请尝试其他关键词',
      metadataTitle: '研究、数据与报告',
      metadataDescription: '阅读 KiraMyao Equal 发布的跨性别与性少数群体研究、数据与报告。',
    })
  })

  it('promotes the Documents and Cat Cave descriptors into their Chinese headings', () => {
    expect(articleListCopy('zh', 'documents')).toMatchObject({
      title: '资料，让事实有出处',
      subtitle: undefined,
    })
    expect(articleListCopy('zh', 'blog')).toMatchObject({
      title: '猫窝碎碎念',
      subtitle: undefined,
    })
  })

  it.each([
    ['report', '研究、数据与正义', '搜索报告标题或关键词'],
    ['blog', '猫窝碎碎念', '搜索猫窝文章'],
    ['documents', '资料，让事实有出处', '搜索资料'],
  ] as const)('keeps every %s section on the Chinese list copy', (type, title, searchPlaceholder) => {
    expect(articleListCopy('zh', type)).toMatchObject({ title, searchPlaceholder })
  })
})
