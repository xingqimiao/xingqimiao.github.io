import CatCaveClient from "@/app/cat-cave/CatCaveClient";
import compiledArticles from "@/data/compiled_articles.json";
import { buildArticleListMetadata } from "@/lib/articleListMetadata";

export const metadata = buildArticleListMetadata("zh", "blog", compiledArticles);

export default function CatCavePage() {
  return <CatCaveClient locale="zh" />;
}
