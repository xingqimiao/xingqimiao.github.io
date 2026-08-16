export type DatedStory = { date?: string; experience_date?: string };

export function storyYear(story: DatedStory): string {
  const source = story.experience_date || story.date || "";
  const match = source.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/);
  return match?.[1] || "";
}

/** "2026.08.16" -> 20260816, "2026" -> 20260101, invalid -> -Infinity */
export function articleDateValue(story: DatedStory): number {
  const source = story.experience_date || story.date || "";
  const match = source.match(/(\d{4})(?:[-.](\d{1,2}))?(?:[-.](\d{1,2}))?/);
  if (!match) return Number.NEGATIVE_INFINITY;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : 1;
  const day = match[3] ? Number(match[3]) : 1;
  return year * 10000 + month * 100 + day;
}

export function sortStoriesByDateDescending<T extends DatedStory>(stories: readonly T[]): T[] {
  return stories
    .map((story, index) => ({ story, index, value: articleDateValue(story) }))
    .sort((a, b) => b.value - a.value || a.index - b.index)
    .map(({ story }) => story);
}

export function selectRandomStory<T>(stories: readonly T[], random = Math.random): T | undefined {
  if (stories.length === 0) return undefined;
  const index = Math.min(stories.length - 1, Math.floor(Math.max(0, random()) * stories.length));
  return stories[index];
}
