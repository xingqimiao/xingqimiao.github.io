import { describe, expect, it } from "vitest";
import { buildUrlList } from "./ping-indexnow.mjs";

describe("buildUrlList", () => {
  it("covers static pages and every article route with absolute URLs", () => {
    const articles = [
      { type: "stories", slug: "10432746" },
      { type: "blog", slug: "becoming-a-cat-a-story-about-srs" },
      { type: "report", slug: "2026-transgender-life-survey-reader-edition" },
      { type: "documents", slug: "ikea-blahaj-empathy-manual-zh-cn" },
    ];
    const urls = buildUrlList(articles);
    expect(urls).toContain("https://kiramyao.com/");
    expect(urls).toContain("https://kiramyao.com/stories/10432746");
    expect(urls).toContain("https://kiramyao.com/cat-cave/becoming-a-cat-a-story-about-srs");
    expect(urls).toContain(
      "https://kiramyao.com/report/2026-transgender-life-survey-reader-edition",
    );
    expect(urls).toContain("https://kiramyao.com/documents/ikea-blahaj-empathy-manual-zh-cn");
  })

  it("URL-encodes special characters in slugs", () => {
    const urls = buildUrlList([{ type: "stories", slug: "猫 猫" }]);
    expect(urls[9]).toBe("https://kiramyao.com/stories/%E7%8C%AB%20%E7%8C%AB")
  })
})
