import DocumentsClient from "@/app/documents/DocumentsClient";
import compiledArticles from "@/data/compiled_articles.json";
import { buildArticleListMetadata } from "@/lib/articleListMetadata";
import { pageJsonLd } from "@/lib/jsonLd";
import { articleListCopy } from "@/lib/articleListPresentation";

const copy = articleListCopy("zh", "documents");

export const metadata = buildArticleListMetadata("zh", "documents", compiledArticles);

export default function DocumentsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            pageJsonLd({
              title: copy.metadataTitle,
              description: copy.metadataDescription,
              path: "/documents",
            }),
          ),
        }}
      />
      <DocumentsClient locale="zh" />
    </>
  );
}
