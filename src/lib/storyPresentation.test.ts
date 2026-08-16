import { describe, expect, it } from "vitest";
import { selectRandomStory, sortStoriesByDateDescending, storyYear } from "./storyPresentation";

describe("story presentation contract", () => {
  it("shows only a four-digit year", () => {
    expect(storyYear({ experience_date: "2024-08-09" })).toBe("2024");
    expect(storyYear({ date: "Published 2021.06" })).toBe("2021");
    expect(storyYear({ date: "unknown" })).toBe("");
  });

  it("sorts descending by full date and stays stable for equal dates", () => {
    const stories = [
      { slug: "same-date-first", date: "2024-01-01" },
      { slug: "newest", date: "2026-08-16" },
      { slug: "same-date-second", experience_date: "2024-01-01" },
      { slug: "later-2024", date: "2024-12-31" },
    ];
    expect(sortStoriesByDateDescending(stories).map((story) => story.slug)).toEqual([
      "newest",
      "later-2024",
      "same-date-first",
      "same-date-second",
    ]);
  });

  it("ranks dotted dates above year-only dates within the same year", () => {
    const stories = [
      { slug: "year-only", date: "2026" },
      { slug: "spring", date: "2026.06.29" },
      { slug: "today", date: "2026.08.16" },
    ];
    expect(sortStoriesByDateDescending(stories).map((story) => story.slug)).toEqual([
      "today",
      "spring",
      "year-only",
    ]);
  });

  it("selects first, last and empty results safely", () => {
    const stories = ["first", "middle", "last"];
    expect(selectRandomStory(stories, () => 0)).toBe("first");
    expect(selectRandomStory(stories, () => 0.999999)).toBe("last");
    expect(selectRandomStory([], () => 0)).toBeUndefined();
  });
});
