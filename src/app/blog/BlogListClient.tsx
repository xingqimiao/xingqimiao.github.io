"use client";

import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";
import React, { useRef } from "react";
import compiledArticles from "@/data/compiled_articles.json";
import { ArticleIndex, type ArticleIndexItem } from "@/components/ui/ArticleIndex";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function BlogListClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blogs = (compiledArticles as ArticleIndexItem[]).filter((art) => art.type === "blog");

  useGSAP(() => {
    gsap.fromTo(
      ".fade-in",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="min-h-screen bg-white px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <h1 className="fade-in mb-12 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          最新博文与观点
        </h1>

        <ArticleIndex
          articles={blogs}
          type="blog"
          searchPlaceholder="搜索文章标题或关键词"
          emptyText="没有找到匹配的文章，请尝试其他关键词"
        />

        <div className="fade-in mt-16">
          <ReturnHomeButton />
        </div>
      </div>
    </main>
  );
}
