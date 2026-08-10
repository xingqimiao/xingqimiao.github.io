export const STORY_SLUG_ALIASES: Readonly<Record<string, string>> = {
  '88737526': '45648863',
  'cat-birthday-17-kira': '45648863',
}

export function migrateStoryBookmarks(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value
    .filter((item): item is string => typeof item === 'string')
    .map((slug) => STORY_SLUG_ALIASES[slug] ?? slug))]
}
