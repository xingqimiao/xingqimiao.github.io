import StoriesClient from "@/app/stories/StoriesClient";
import compiledArticles from "@/data/compiled_articles.json";
import { buildLocalizedMetadata } from "@/lib/localizedMetadata";

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: "/stories",
  title: "经历",
  description: "阅读由 KiraMyao Equal 收集的真实经历与个人故事。",
  openGraphImage: "/pic/index/og-home.png",
  openGraphImageAlt: "KiraMyao Equal 经历",
});

export default function StoriesPage() {
  return <StoriesClient locale="zh" />;
}
