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
    .filter((art) => art.type === "report")
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
  const article = compiledArticles.find((art) => art.slug === normalizedSlug && art.type === "report");

  if (!article) {
    return {
      title: "报告未找到",
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

export default async function ReportDetailPage({ params }: Props) {
  const { slug } = await params;
  const normalizedSlug = normalizeRouteSlug(slug);
  const article = compiledArticles.find((art) => art.slug === normalizedSlug && art.type === "report");

  if (!article) {
    notFound();
  }

  return (
    <ReadingArticlePage
      backHref="/report"
      backLabel={"\u2190 \u8fd4\u56de\u62a5\u544a\u5217\u8868"}
      categoryLabel={"\u5206\u6790\u62a5\u544a"}
      kicker="KiraEqual Report"
      title={article.title}
      date={article.date}
      coverName={article.cover_name}
      contentHtml={stripDuplicateLeadImage(article.contentHtml, article.cover_name)}
    />
  );
}
