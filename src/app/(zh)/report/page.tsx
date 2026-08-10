import ReportListClient from "@/app/report/ReportListClient";
import compiledArticles from "@/data/compiled_articles.json";
import { buildArticleListMetadata } from "@/lib/articleListMetadata";

export const metadata = buildArticleListMetadata("zh", "report", compiledArticles);

export default function ReportListPage() {
  return <ReportListClient locale="zh" />;
}
