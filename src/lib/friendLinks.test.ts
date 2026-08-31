import { describe, expect, it, vi } from 'vitest'
import { filterFriendLinks, friendLinksCopy, openFriendLink } from './friendLinks'

const links = [
  {
    id: 'a',
    name: '示例友链甲',
    url: 'https://example.com/a',
    description: '编程与生活的个人博客',
    cover: null,
  },
  {
    id: 'b',
    name: '乙的摄影站',
    url: 'https://photo.example.org',
    description: '胶片摄影作品集',
    cover: null,
  },
]

describe('friendLinksCopy', () => {
  it('exposes the zh sidebar label and embedded-confirm actions', () => {
    expect(friendLinksCopy.label).toBe('Friend Links')
    expect(friendLinksCopy.confirmNote).toBe('即将离开本站，前往外部链接')
    expect(friendLinksCopy.confirmGo).toBe('确认前往')
    expect(friendLinksCopy.confirmCancel).toBe('取消')
    expect(friendLinksCopy.empty).toBe('友链会显示在这里。')
    expect(friendLinksCopy.noMatch).toBe('当前视图中没有匹配的友链。')
  })
})

describe('filterFriendLinks', () => {
  it('returns all links when the query is blank', () => {
    expect(filterFriendLinks(links, '  ')).toHaveLength(2)
  })

  it('matches name, description, and host', () => {
    expect(filterFriendLinks(links, '甲').map((l) => l.id)).toEqual(['a'])
    expect(filterFriendLinks(links, '摄影').map((l) => l.id)).toEqual(['b'])
    expect(filterFriendLinks(links, 'example.org').map((l) => l.id)).toEqual(['b'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterFriendLinks(links, '不存在')).toEqual([])
  })
})

describe('openFriendLink', () => {
  it('opens the url in a new tab without leaking the opener', () => {
    const open = vi.fn()
    vi.stubGlobal('window', { open })
    try {
      openFriendLink('https://example.com')
      expect(open).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
