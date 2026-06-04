import React from "react";
import { Metadata } from "next";
import compiledArticles from "@/data/compiled_articles.json";
import { ReadingArticlePage } from "@/components/reading/ReadingArticlePage";
import { stripDuplicateLeadImage } from "@/lib/articleContent";
import { normalizeRouteSlug } from "@/lib/articleRoute";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
  return compiledArticles
    .filter((art) => art.type === "story")
    .map((post) => ({
      slug: post.slug,
    }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = normalizeRouteSlug(slug);
  const article = compiledArticles.find((art) => art.slug === normalizedSlug && art.type === "story");

  if (!article) {
    return {
      title: "故事未找到",
    };
  }

  return {
    title: article.title,
    description: article.desc,
    openGraph: {
      title: article.title,
      description: article.desc,
      type: "article",
      images: article.cover_name ? [{ url: article.cover_name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.desc,
      images: article.cover_name ? [article.cover_name] : [],
    },
  };
}

export default async function StoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const normalizedSlug = normalizeRouteSlug(slug);
  const article = compiledArticles.find((art) => art.slug === normalizedSlug && art.type === "story");

  if (!article) {
    notFound();
  }

  return (
    <ReadingArticlePage
      backHref="/story"
      backLabel={"\u2190 \u8fd4\u56de\u6545\u4e8b\u5217\u8868"}
      categoryLabel={"\u9879\u76ee\u6545\u4e8b"}
      kicker="KiraEqual Story"
      title={article.title}
      date={article.date}
      coverName={article.cover_name}
      contentHtml={stripDuplicateLeadImage(article.contentHtml, article.cover_name)}
    />
  );
}
