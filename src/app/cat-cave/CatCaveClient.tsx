"use client";

import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";
import React, { useRef } from "react";
import compiledArticles from "@/data/compiled_articles.json";
import { ArticleIndex, type ArticleIndexItem } from "@/components/ui/ArticleIndex";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/i18n/locale";
import { articleListCopy } from "@/lib/articleListPresentation";

export default function CatCaveClient({ locale = "zh" }: { locale?: Locale }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const catCaveArticles = (compiledArticles as ArticleIndexItem[]).filter((art) => art.type === "blog");
  const copy = articleListCopy(locale, "blog");

  useGSAP(() => {
    gsap.fromTo(
      ".fade-in",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="min-h-screen bg-background px-6 pb-24 pt-32">
      <div className="mx-auto max-w-7xl">
        <h1 className="fade-in mb-3 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          {copy.title}
        </h1>
        {copy.subtitle && <p className="fade-in mb-12 text-body-large text-text-sub">{copy.subtitle}</p>}

        <ArticleIndex
          articles={catCaveArticles}
          locale={locale}
          type="blog"
          searchPlaceholder={copy.searchPlaceholder}
          emptyText={copy.emptyText}
        />

        <div className="fade-in mt-16">
          <ReturnHomeButton locale={locale} />
        </div>
      </div>
    </main>
  );
}
