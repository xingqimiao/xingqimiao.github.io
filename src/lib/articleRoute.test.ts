import { describe, expect, it } from "vitest";
import { getArticleHref } from "./articleRoute";

describe("legacy article route contract", () => {
  it.each([
    ["blog", "cat-cave"],
    ["stories", "stories"],
    ["report", "report"],
    ["documents", "documents"],
  ])("keeps %s on its public section", (type, section) => {
    expect(getArticleHref(type, "hello")).toBe(`/${section}/hello`);
  });

  it("encodes special slugs safely", () => {
    expect(getArticleHref("stories", "猫 birthday/1")).toBe("/stories/%E7%8C%AB%20birthday%2F1");
  });
});
