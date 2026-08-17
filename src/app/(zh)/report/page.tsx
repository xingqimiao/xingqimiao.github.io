import ReportListClient from "@/app/report/ReportListClient";
import compiledArticles from "@/data/compiled_articles.json";
import { buildArticleListMetadata } from "@/lib/articleListMetadata";
import { collectionJsonLd } from "@/lib/jsonLd";

export const metadata = buildArticleListMetadata("zh", "report", compiledArticles);

export default function ReportListPage() {
  const reportArticles = (compiledArticles as readonly { type: string; title: string; slug: string }[])
    .filter((a) => a.type === "report")
    .map((a) => ({ title: a.title, path: `/report/${a.slug}` }));

  const jsonLd = collectionJsonLd({
    name: "跨性别研究与调研报告 · 核心数据",
    description:
      "阅读 KiraMyao Equal 发布的中国跨性别与性少数群体研究、调研数据与深度报告。",
    path: "/report",
    items: reportArticles,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReportListClient locale="zh" />
    </>
  );
}
