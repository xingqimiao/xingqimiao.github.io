import CatCaveClient from "@/app/cat-cave/CatCaveClient";
import compiledArticles from "@/data/compiled_articles.json";
import { buildArticleListMetadata } from "@/lib/articleListMetadata";
import { pageJsonLd } from "@/lib/jsonLd";
import { articleListCopy } from "@/lib/articleListPresentation";

const copy = articleListCopy("zh", "blog");

export const metadata = buildArticleListMetadata("zh", "blog", compiledArticles);

export default function CatCavePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            pageJsonLd({
              title: copy.metadataTitle,
              description: copy.metadataDescription,
              path: "/cat-cave",
            }),
          ),
        }}
      />
      <CatCaveClient locale="zh" />
    </>
  );
}
