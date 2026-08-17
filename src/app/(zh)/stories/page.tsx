import StoriesClient from "@/app/stories/StoriesClient";
import compiledArticles from "@/data/compiled_articles.json";
import { collectionJsonLd } from "@/lib/jsonLd";
import { buildLocalizedMetadata } from "@/lib/localizedMetadata";

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: "/stories",
  title: "跨性别故事与真实经历 · 个人叙事文集",
  description:
    "阅读 KiraMyao Equal 收集整理的中国跨性别群体真实经历、心路历程与口述叙事文集。",
  openGraphImage: "/pic/index/og-home.png",
  openGraphImageAlt: "KiraMyao Equal 跨性别故事",
});

export default function StoriesPage() {
  const storyArticles = (compiledArticles as readonly { type: string; title: string; slug: string }[])
    .filter((a) => a.type === "stories")
    .map((a) => ({ title: a.title, path: `/stories/${a.slug}` }));

  const jsonLd = collectionJsonLd({
    name: "跨性别故事与真实经历 · 个人叙事文集",
    description:
      "阅读 KiraMyao Equal 收集整理的中国跨性别群体真实经历、心路历程与口述叙事文集。",
    path: "/stories",
    items: storyArticles,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StoriesClient locale="zh" />
    </>
  );
}
