import storiesPolicyData from "@/data/stories_policy.json";
import { buildLocalizedMetadata } from "@/lib/localizedMetadata";
import { pageJsonLd } from "@/lib/jsonLd";
import { StoriesPolicyContent } from "@/app/stories/StoriesPolicyContent";

const page = {
  title: storiesPolicyData.title || "Stories 内容政策",
  description: "KiraMyao Equal Stories 投稿前需要了解的收录范围、编辑原则与投稿须知。",
  path: "/stories/policy",
};

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: page.path,
  title: page.title,
  description: page.description,
});

export default function StoriesPolicyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd(page)) }}
      />
      <StoriesPolicyContent locale="zh" />
    </>
  );
}