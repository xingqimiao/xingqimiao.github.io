import JoinClient from "@/app/join/JoinClient";
import { buildLocalizedMetadata } from "@/lib/localizedMetadata";
import { pageJsonLd } from "@/lib/jsonLd";

const page = {
  title: "加入我们",
  description: "参与 KiraMyao Equal 的研究、志愿服务与社区工作。",
  path: "/join",
} as const;

export const metadata = buildLocalizedMetadata({
  locale: "zh",
  chinesePath: page.path,
  title: page.title,
  description: page.description,
});

export default function JoinUsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd(page)) }}
      />
      <JoinClient locale="zh" />
    </>
  );
}
