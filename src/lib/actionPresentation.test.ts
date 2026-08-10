import { describe, expect, it } from 'vitest'
import { buildActionPresentation } from './actionPresentation'

describe('action page presentation', () => {
  it('provides Chinese project names, descriptions, and statuses', () => {
    const result = buildActionPresentation('zh', [{
      id: '1',
      name: '2026年度处境调查',
      desc: '中文说明',
      status: 'running',
    }])

    expect(result).toMatchObject({
      heading: '行动，改变现在',
      actions: [{
        name: '2026年度处境调查',
        statusLabel: '正在执行',
        contentLanguage: 'zh-CN',
        fallback: false,
      }],
    })
  })
})
