export type DatedStory = { date?: string; experience_date?: string };

export function storyYear(story: DatedStory): string {
  const source = story.experience_date || story.date || "";
  const match = source.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/);
  return match?.[1] || "";
}

export function sortStoriesByYearDescending<T extends DatedStory>(stories: readonly T[]): T[] {
  return stories
    .map((story, index) => ({ story, index, year: Number(storyYear(story)) || Number.NEGATIVE_INFINITY }))
    .sort((a, b) => b.year - a.year || a.index - b.index)
    .map(({ story }) => story);
}

export function selectRandomStory<T>(stories: readonly T[], random = Math.random): T | undefined {
  if (stories.length === 0) return undefined;
  const index = Math.min(stories.length - 1, Math.floor(Math.max(0, random()) * stories.length));
  return stories[index];
}
