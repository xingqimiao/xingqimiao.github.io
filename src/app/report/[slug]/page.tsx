import React from "react";
import Link from "next/link";
import compiledArticles from "@/data/compiled_articles.json";
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

export default async function ReportDetailPage({ params }: Props) {
  const { slug } = await params;
  const normalizedSlug = normalizeRouteSlug(slug);
  const article = compiledArticles.find((art) => art.slug === normalizedSlug && art.type === "report");

  if (!article) {
    notFound();
  }

  return (
    <main className="bg-white dark:bg-background min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Navigation & Category */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/report" 
            className="text-label-large text-text-sub hover:text-text-main transition-colors"
          >
            ← 返回报告列表
          </Link>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-label-large font-medium">
            分析报告
          </span>
        </div>

        {/* Title */}
        <h1 className="article-title text-display-medium md:text-display-medium font-medium leading-tight mb-4 text-center">
          {article.title}
        </h1>

        {/* Subtitle / Metadata */}
        <div className="flex justify-center items-center gap-4 text-label-large text-text-sub mb-12">
          <span>KiraEqual Report</span>
          <span>•</span>
          <span>{article.date}</span>
        </div>

        {/* Hero image if exists */}
        {article.cover_name && (
          <div className="w-full aspect-video rounded-[32px] overflow-hidden mb-12 shadow-soft-giant border border-black/5 dark:border-white/5">
            <img 
              src={article.cover_name} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <article 
          className="g2-markdown prose prose-lg max-w-none text-body-large text-text-main leading-relaxed space-y-6"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />

        {/* Footnotes / Share */}
        <div className="border-t border-black/5 dark:border-white/5 mt-16 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-label-large text-text-sub">
            欢迎来到由岛主导设计的空间。
          </div>
          <Link 
            href="/report" 
            className="px-6 py-3 rounded-full bg-black/5 dark:bg-white/5 text-label-large text-text-main hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            返回列表
          </Link>
        </div>
      </div>
    </main>
  );
}
