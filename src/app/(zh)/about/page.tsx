import { buildLocalizedMetadata } from "@/lib/localizedMetadata";
import { pageJsonLd } from "@/lib/jsonLd";
import { AboutKiraMyaoContent } from "@/app/about-kiramyao/AboutKiraMyaoContent";

const page = {
  title: "关于 KiraMyao",
  description: "KiraMyao Equal（KiraEqual）关于页：了解这个关注中国跨性别与性少数群体的项目的起源、创始人故事与使命，以及 Stories、研究与行动如何帮更多真实经历被看见。",
  path: "/about",
} as const;

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: page.path,
  title: page.title,
  description: page.description,
});

export default function AboutKiraMyaoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd(page)) }}
      />
      <AboutKiraMyaoContent locale="zh" />
    </>
  );
}
