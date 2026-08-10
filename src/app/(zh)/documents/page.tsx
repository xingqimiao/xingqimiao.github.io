import DocumentsClient from "@/app/documents/DocumentsClient";
import compiledArticles from "@/data/compiled_articles.json";
import { buildArticleListMetadata } from "@/lib/articleListMetadata";

export const metadata = buildArticleListMetadata("zh", "documents", compiledArticles);

export default function DocumentsPage() {
  return <DocumentsClient locale="zh" />;
}
