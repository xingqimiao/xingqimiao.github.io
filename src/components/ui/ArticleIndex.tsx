"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { SearchBox } from "@/components/ui/SearchBox";
import { cn } from "@/lib/utils";
import { encodeArticleSlug } from "@/lib/articleRoute";

export interface ArticleIndexItem {
  slug: string;
  title: string;
  desc: string;
  cover_name?: string;
  type: "blog" | "story" | "report";
  date?: string;
  grid_span?: "normal" | "featured" | string;
}

interface ArticleIndexProps {
  articles: ArticleIndexItem[];
  type: "blog" | "story" | "report";
  searchPlaceholder: string;
  emptyText: string;
}

function getYear(date?: string) {
  const match = date?.match(/\d{4}/);
  return match ? match[0] : "Undated";
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function ArticleIndex({ articles, type, searchPlaceholder, emptyText }: ArticleIndexProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const activeQuery = normalize(searchQuery);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (!activeQuery) return true;
      return (
        article.title.toLowerCase().includes(activeQuery) ||
        article.desc.toLowerCase().includes(activeQuery)
      );
    });
  }, [activeQuery, articles]);

  const years = useMemo(() => {
    return Array.from(new Set(articles.map((article) => getYear(article.date))));
  }, [articles]);

  const groupedArticles = useMemo(() => {
    return filteredArticles.reduce<Record<string, ArticleIndexItem[]>>((groups, article) => {
      const year = getYear(article.date);
      groups[year] = groups[year] || [];
      groups[year].push(article);
      return groups;
    }, {});
  }, [filteredArticles]);

  const visibleYears = Object.keys(groupedArticles);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,880px)_260px] lg:items-start lg:justify-center">
      <div className="space-y-14">
        {visibleYears.length > 0 ? (
          visibleYears.map((year) => (
            <section key={year} id={`${type}-${year}`} className="fade-in scroll-mt-28">
              <div className="mb-6 flex items-center gap-4">
                <span className="article-title text-title-large font-medium">{year}</span>
                <span className="h-px flex-1 bg-black/10" />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {groupedArticles[year].map((post) => {
                  const isFeatured = post.grid_span === "featured";
                  return (
                    <Link
                      key={post.slug}
                      href={`/${post.type}/${encodeArticleSlug(post.slug)}`}
                      className={cn(
                        "group rounded-[28px] border border-black/10 bg-white p-4 transition-all hover:-translate-y-0.5 hover:scale-[1.01] hover:border-black/15 hover:bg-white",
                        isFeatured && "md:col-span-2"
                      )}
                    >
                      <article
                        className={cn(
                          "grid h-full gap-5",
                          isFeatured ? "md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-center" : "grid-cols-1"
                        )}
                      >
                        <div className={cn("overflow-hidden rounded-[22px] bg-[#f5f5f7]", isFeatured ? "aspect-[16/9]" : "aspect-video")}>
                          {post.cover_name ? (
                            <img
                              src={post.cover_name}
                              alt={post.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fbff,#f6f1f5)]">
                              <span className="text-label-large text-text-sub/50">KiraEqual</span>
                            </div>
                          )}
                        </div>
                        <div className="flex min-h-0 flex-col justify-between gap-5 p-1">
                          <div>
                            <span className="mb-2 block text-label-large text-text-sub">{post.date}</span>
                            <h2 className={cn("article-title font-semibold leading-snug", isFeatured ? "text-headline-large" : "text-title-large")}>
                              {post.title}
                            </h2>
                          </div>
                          <p className={cn("text-body-large text-text-sub", isFeatured ? "line-clamp-3" : "line-clamp-2")}>
                            {post.desc}
                          </p>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="fade-in rounded-[28px] border border-black/10 bg-white p-10 text-center text-body-large text-text-sub">
            {emptyText}
          </div>
        )}
      </div>

      <aside className="fade-in lg:sticky lg:top-24">
        <div className="rounded-[28px] border border-black/10 bg-white p-4">
          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder={searchPlaceholder} />
          <div className="mt-6 flex flex-wrap gap-2 lg:flex-col">
            {years.map((year) => (
              <a
                key={year}
                href={`#${type}-${year}`}
                className="rounded-full px-4 py-2 text-label-large text-text-sub transition-colors hover:bg-black/5 hover:text-text-main"
              >
                {year}
              </a>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
