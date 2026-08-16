"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SearchBox } from "@/components/ui/SearchBox";
import { cn } from "@/lib/utils";
import { getArticleHref } from "@/lib/articleRoute";
import { searchItems } from "@/lib/search";
import { articleDateValue } from "@/lib/storyPresentation";
import type { Locale } from "@/i18n/locale";
import { toLocalePath } from "@/i18n/locale";
import { resolveLocalizedArticle } from "@/lib/localizedArticle";

export interface ArticleIndexItem {
  slug: string;
  title: string;
  desc?: string;
  contentHtml?: string;
  cover_name?: string;
  type: string;
  date?: string;
  grid_span?: "normal" | "featured" | string;
}

interface ArticleIndexProps {
  locale?: Locale;
  articles: ArticleIndexItem[];
  type: string;
  searchPlaceholder: string;
  emptyText: string;
}

type LocalizedArticleIndexItem = ArticleIndexItem & {
  desc: string
  contentHtml: string
  contentLanguage: "zh-CN" | "en"
  fallback: boolean
}

function getYear(date?: string) {
  const match = date?.match(/\d{4}/);
  return match ? match[0] : "Undated";
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function ArticleIndex({ locale = "zh", articles, type, searchPlaceholder, emptyText }: ArticleIndexProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTokens, setSearchTokens] = useState<Record<string, string[]>>({});
  const activeQuery = normalize(searchQuery);

  useEffect(() => {
    let cancelled = false;
    fetch("/ai/search-index.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { tokens?: Record<string, string[]> } | null) => {
        if (!cancelled && data?.tokens) {
          setSearchTokens(data.tokens);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchTokens({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const localizedArticles = useMemo<LocalizedArticleIndexItem[]>(() => articles.map((article) => {
    const localized = resolveLocalizedArticle(locale, {
      ...article,
      contentHtml: article.contentHtml || "",
    });
    return {
      ...article,
      title: localized.title,
      desc: localized.description || "",
      contentHtml: localized.contentHtml,
      contentLanguage: localized.effectiveLocale === "en" ? "en" : "zh-CN",
      fallback: localized.fallback,
    };
  }), [articles, locale]);

  const filteredArticles = useMemo(() => {
    return searchItems(
      localizedArticles,
      activeQuery,
      ["title", "desc", "contentHtml", "date", (article) => article.type],
      searchTokens,
    );
  }, [activeQuery, localizedArticles, searchTokens]);

  const years = useMemo(() => {
    return Array.from(new Set(localizedArticles.map((article) => getYear(article.date))));
  }, [localizedArticles]);

  const groupedArticles = useMemo(() => {
    const groups = filteredArticles.reduce<Record<string, LocalizedArticleIndexItem[]>>((groups, article) => {
      const year = getYear(article.date);
      groups[year] = groups[year] || [];
      groups[year].push(article);
      return groups;
    }, {});
    // Newest first within each year; keep relevance order while searching
    if (!activeQuery) {
      for (const year of Object.keys(groups)) {
        groups[year].sort((a, b) => articleDateValue(b) - articleDateValue(a));
      }
    }
    return groups;
  }, [filteredArticles, activeQuery]);

  const visibleYears = Object.keys(groupedArticles).sort((a, b) => (a === 'Undated' ? 1 : 0) - (b === 'Undated' ? 1 : 0) || b.localeCompare(a, undefined, { numeric: true }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,880px)_260px] lg:items-start lg:justify-center">
      <div className="space-y-14">
        {visibleYears.length > 0 ? (
          visibleYears.map((year) => (
            <section key={year} id={`${type}-${year}`} className="fade-in scroll-mt-28">
              <div className="mb-6 flex items-center gap-4">
                <span className="article-title text-title-large font-medium">{year}</span>
                <span className="h-px flex-1 bg-black/10" />
              </div>
              {groupedArticles[year]
                .filter((post) => post.grid_span === "featured")
                .map((post) => {
                  const isFeatured = post.grid_span === "featured";
                  const hasCover = Boolean(post.cover_name);
                  return (
                    <Link
                      key={post.slug}
                      href={toLocalePath(getArticleHref(post.type, post.slug), locale)}
                      className={cn(
                        "group mb-6 block rounded-[28px] border border-black/10 bg-white transition-all hover:-translate-y-0.5 hover:scale-[1.01] hover:border-black/15 hover:bg-white",
                        hasCover ? "p-4" : "p-5"
                      )}
                      prefetch={false}
                    >
                      <article
                        lang={post.contentLanguage}
                        className={cn(
                          "grid h-full gap-5",
                          isFeatured && hasCover ? "md:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] md:items-center" : "grid-cols-1",
                          !hasCover && "gap-4"
                        )}
                      >
                        {hasCover && (
                          <div className={cn("overflow-hidden rounded-[22px] bg-[#f5f5f7]", isFeatured ? "aspect-[16/9]" : "aspect-video")}>
                            <img
                              src={post.cover_name}
                              alt={post.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                            />
                          </div>
                        )}
                        <div className={cn("flex min-h-0 flex-col justify-between p-1", hasCover ? "gap-5" : "gap-3")}>
                          <div>
                            <span className="mb-2 block text-label-large text-text-sub">{post.date}</span>
                            <h2 className={cn("article-title font-semibold leading-snug", isFeatured && hasCover ? "text-headline-large" : "text-title-large")}>
                              {post.title}
                            </h2>
                          </div>
                          <p className={cn("text-body-large text-text-sub", isFeatured && hasCover ? "line-clamp-3" : "line-clamp-2")}>
                            {post.desc}
                          </p>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              <div className="columns-1 gap-6 md:columns-2">
                {groupedArticles[year]
                  .filter((post) => post.grid_span !== "featured")
                  .map((post) => {
                    const hasCover = Boolean(post.cover_name);
                    return (
                      <Link
                        key={post.slug}
                        href={toLocalePath(getArticleHref(post.type, post.slug), locale)}
                        className={cn(
                          "group mb-6 block break-inside-avoid rounded-[28px] border border-black/10 bg-white transition-all hover:-translate-y-0.5 hover:scale-[1.01] hover:border-black/15 hover:bg-white",
                          hasCover ? "p-4" : "p-5"
                        )}
                        prefetch={false}
                      >
                        <article lang={post.contentLanguage} className={cn("grid h-full gap-5", !hasCover && "gap-4")}>
                          {hasCover && (
                            <div className="aspect-video overflow-hidden rounded-[22px] bg-[#f5f5f7]">
                              <img
                                src={post.cover_name}
                                alt={post.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                              />
                            </div>
                          )}
                          <div className={cn("flex min-h-0 flex-col justify-between p-1", hasCover ? "gap-5" : "gap-3")}>
                            <div>
                              <span className="mb-2 block text-label-large text-text-sub">{post.date}</span>
                              <h2 className="article-title text-title-large font-semibold leading-snug">
                                {post.title}
                              </h2>
                            </div>
                            <p className="line-clamp-2 text-body-large text-text-sub">
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

      <aside className="fade-in min-w-0 lg:sticky lg:top-24">
        <div className="rounded-[28px] border border-black/10 bg-white p-4">
          <SearchBox
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={searchPlaceholder}
            clearLabel="Clear"
            className="w-full min-w-0"
          />
          <div className="mt-6 flex flex-wrap gap-2 lg:flex-col">
            {years.map((year) => (
              <a
                key={year}
                href={`#${type}-${year}`}
                className="rounded-full px-4 py-2 text-label-large text-text-sub transition-colors hover:bg-black/5 hover:text-text-main dark:hover:bg-white/10"
              >
                {year}
              </a>
            ))}
          </div>
        </div>
      </aside>
      </div>
    </div>
  );
}
