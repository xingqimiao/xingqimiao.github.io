import storiesPolicyData from "@/data/stories_policy.json";
import { buildLocalizedMetadata } from "@/lib/localizedMetadata";
import { StoriesPolicyContent } from "@/app/stories/StoriesPolicyContent";

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: "/stories/policy",
  title: storiesPolicyData.title || "Stories 内容政策",
  description:
    "KiraMyao Equal Stories 投稿前需要了解的收录范围、编辑原则与投稿须知。",
});

export default function StoriesPolicyPage() {
  return <StoriesPolicyContent locale="zh" />;
}