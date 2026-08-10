import { describe, expect, it } from "vitest";
import { selectRandomStory, sortStoriesByYearDescending, storyYear } from "./storyPresentation";

describe("story presentation contract", () => {
  it("shows only a four-digit year", () => {
    expect(storyYear({ experience_date: "2024-08-09" })).toBe("2024");
    expect(storyYear({ date: "Published 2021.06" })).toBe("2021");
    expect(storyYear({ date: "unknown" })).toBe("");
  });

  it("sorts descending by year and stays stable within the same year", () => {
    const stories = [
      { slug: "same-year-first", date: "2024-01-01" },
      { slug: "newest", date: "2026-01-01" },
      { slug: "same-year-second", experience_date: "2024-12-31" },
    ];
    expect(sortStoriesByYearDescending(stories).map((story) => story.slug)).toEqual([
      "newest",
      "same-year-first",
      "same-year-second",
    ]);
  });

  it("selects first, last and empty results safely", () => {
    const stories = ["first", "middle", "last"];
    expect(selectRandomStory(stories, () => 0)).toBe("first");
    expect(selectRandomStory(stories, () => 0.999999)).toBe("last");
    expect(selectRandomStory([], () => 0)).toBeUndefined();
  });
});
