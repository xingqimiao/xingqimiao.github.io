import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { articleListCopy } from "./articleListPresentation";
import { buildHomePresentation } from "./homePresentation";
import { storyListCopy } from "./storyListPresentation";

const root = process.cwd();
const read = (relative: string) => readFile(path.join(root, relative), "utf8");

describe("equal-next requested public contract", () => {
  it("uses the exact Chinese section headings", () => {
    expect(articleListCopy("zh", "blog")).toMatchObject({ title: "猫窝碎碎念", subtitle: undefined });
    expect(articleListCopy("zh", "documents")).toMatchObject({ title: "资料，让事实有出处", subtitle: undefined });
    expect(storyListCopy("zh")).toMatchObject({ heading: "经历", subtitle: "值得被看见" });
  });

  it("keeps localized Documents zero-article empty states", () => {
    expect(articleListCopy("zh", "documents").emptyText).toBe("没有找到匹配的资料。");
  });

  it("keeps Stories navigation to All Stories and Bookmarked only", async () => {
    const source = await read("src/app/stories/StoriesClient.tsx");
    expect(source).toContain('type StoryView = "all" | "bookmarked"');
    expect(source).not.toContain("On This Day");
    expect(source).not.toContain("By Identity");
    expect(source).not.toContain("By Life Stage");
    expect(source).not.toContain("storyOrderValue");
  });

  it("uses one uniform Material 3 Story card contract", async () => {
    const source = await read("src/app/stories/StoriesClient.tsx");
    expect(source).toContain('aspect-[4/3]');
    expect(source).toContain('data-story-card={hasCover ? "covered" : "tonal"}');
    expect(source).not.toContain("storyCardPresets");
    expect(source).not.toContain("chooseStoryTemplate");
    expect(source).not.toContain("style={{ height:");
    await expect(stat(path.join(root, "src/data/story_card_presets.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("loads Story card covers lazily and decodes them asynchronously", async () => {
    const source = await read("src/app/stories/StoriesClient.tsx");
    expect(source).toContain('loading="lazy"');
    expect(source).toContain('decoding="async"');
  });

  it("renders only enabled ordered join links on web and AI from the new array", async () => {
    const links = JSON.parse(await read("src/data/join_links.json"));
    expect(links).toHaveLength(3);
    expect(new Set(links.map((item: { id: string }) => item.id)).size).toBe(3);
    const enabled = links.filter((item: { enabled: boolean }) => item.enabled).sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    const markdown = await read("public/ai/join.md");
    for (const item of enabled) expect(markdown).toContain(item.url);
    for (const item of links.filter((entry: { enabled: boolean }) => !entry.enabled)) expect(markdown).not.toContain(item.url);
    const source = await read("src/app/join/JoinClient.tsx");
    expect(source).toContain('import joinLinks from "@/data/join_links.json"');
    expect(source).not.toContain('joinData.survey_enabled');
  });

  it("uses the correct footer separator and canonical license URL", async () => {
    const source = await read("src/components/layout/Footer.tsx");
    expect(source).toContain('{" · "}');
    expect(source).toContain("https://creativecommons.org/licenses/by-nc/4.0/");
    expect(source).not.toContain("utm_source");
  });

  it("renders the editable homepage hero contract", async () => {
    const config = JSON.parse(await read("src/data/homepage.json"));
    expect(config).toMatchObject({
      title: "KiraEqual",
      description: "KiraEqual是一个关注性别多元群体的独立研究、公共知识与数字公益项目",
      statement: "让真实经历成为改变社会的证据",
      joinButton: { label: "Join Us", href: "/join" },
      video: { source: "local" },
    });
    expect(config.video.url).toMatch(/^\/video\/[^/]+\.(?:mp4|webm)$/);
    expect((await stat(path.join(root, "public", config.video.url.slice(1)))).isFile()).toBe(true);
    const presentation = buildHomePresentation("zh", [], [], {
      ...config,
      description: "可编辑后的简介",
      statement: "可编辑后的宣言",
    });
    expect(presentation).toMatchObject({
      title: "KiraEqual",
      description: "可编辑后的简介",
      statement: "可编辑后的宣言",
      joinLabel: "Join Us",
    });
  });

  it("uses the Chinese shell for every default public route", async () => {
    const rootRoutes = [
      "src/app/(zh)/layout.tsx",
      "src/app/(zh)/page.tsx",
      "src/app/(zh)/about-kiramyao/page.tsx",
      "src/app/(zh)/action/page.tsx",
      "src/app/(zh)/cat-cave/page.tsx",
      "src/app/(zh)/cat-cave/[slug]/page.tsx",
      "src/app/(zh)/documents/page.tsx",
      "src/app/(zh)/documents/[slug]/page.tsx",
      "src/app/(zh)/join/page.tsx",
      "src/app/(zh)/privacy/page.tsx",
      "src/app/(zh)/report/page.tsx",
      "src/app/(zh)/report/[slug]/page.tsx",
      "src/app/(zh)/stories/page.tsx",
      "src/app/(zh)/stories/[slug]/page.tsx",
      "src/app/(zh)/not-found.tsx",
    ];

    for (const route of rootRoutes) {
      const source = await read(route);
      expect(source, route).toMatch(/locale\s*[:=]\s*["']zh["']/);
      expect(source, route).not.toMatch(/locale\s*[:=]\s*["']en["']/);
    }
  });

  it("does not expose English routes or the organization About route", async () => {
    await expect(stat(path.join(root, "src/app/(en)/layout.tsx"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(stat(path.join(root, "src/app/(zh)/about/page.tsx"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
