import { buildLocalizedMetadata } from "@/lib/localizedMetadata";
import { pageJsonLd } from "@/lib/jsonLd";
import { AboutKiraMyaoContent } from "@/app/about-kiramyao/AboutKiraMyaoContent";

const page = {
  title: "关于 KiraMyao",
  description: "了解 KiraMyao Equal 的起源与创始人的故事。",
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
