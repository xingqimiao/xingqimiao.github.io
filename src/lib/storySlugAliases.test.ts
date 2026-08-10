import { describe, expect, it } from 'vitest'
import { migrateStoryBookmarks, STORY_SLUG_ALIASES } from './storySlugAliases'

describe('Story slug compatibility', () => {
  it('migrates old numeric and historic bookmarks without duplicates', () => {
    expect(STORY_SLUG_ALIASES).toEqual({
      '88737526': '45648863',
      'cat-birthday-17-kira': '45648863',
    })
    expect(migrateStoryBookmarks(['88737526', 'cat-birthday-17-kira', '45648863', 'other-story', 42])).toEqual([
      '45648863',
      'other-story',
    ])
  })
})
