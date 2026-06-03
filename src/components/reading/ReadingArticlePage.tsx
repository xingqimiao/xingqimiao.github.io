"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface ReadingArticlePageProps {
  backHref: string;
  backLabel: string;
  categoryLabel: string;
  kicker: string;
  title: string;
  date?: string;
  coverName?: string;
  contentHtml: string;
}

type ReadingTheme = "light" | "dark";

const STORAGE_KEY = "kira-reading-theme";

export function ReadingArticlePage({
  backHref,
  backLabel,
  categoryLabel,
  kicker,
  title,
  date,
  coverName,
  contentHtml,
}: ReadingArticlePageProps) {
  const [theme, setTheme] = useState<ReadingTheme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
  }, []);

  const toggleLabel = useMemo(
    () => (theme === "dark" ? "\u5207\u6362\u5230\u767d\u5929\u9605\u8bfb" : "\u5207\u6362\u5230\u591c\u665a\u9605\u8bfb"),
    [theme]
  );

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <main
      data-theme={theme}
      className="reading-page min-h-screen bg-white px-6 pb-24 pt-32 text-[#121317] transition-colors duration-300"
    >
      <div className="page-enter mx-auto max-w-[880px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href={backHref} className="reading-link text-label-large text-text-sub transition-colors hover:text-text-main">
            {backLabel}
          </Link>
          <div className="flex items-center gap-3">
            <span className="reading-chip rounded-full bg-primary/10 px-3 py-1 text-label-large font-medium text-primary">
              {categoryLabel}
            </span>
            <button
              type="button"
              aria-label={toggleLabel}
              title={toggleLabel}
              onClick={toggleTheme}
              className="reading-link cursor-pointer bg-transparent p-0 text-label-large font-medium leading-none text-text-sub transition-colors hover:text-text-main"
            >
              {theme === "dark" ? "\u25d1" : "\u25d0"}
            </button>
          </div>
        </div>

        <h1 className="article-title mb-4 text-center text-display-medium font-medium leading-tight md:text-display-medium">
          {title}
        </h1>

        <div className="reading-subtle mb-12 flex items-center justify-center gap-4 text-label-large text-text-sub">
          <span>{kicker}</span>
          <span>{"\u00b7"}</span>
          <span>{date}</span>
        </div>

        {coverName && (
          <div className="reading-rule mb-12 aspect-video w-full overflow-hidden rounded-[32px] border border-black/5 shadow-soft-giant">
            <img src={coverName} alt={title} className="h-full w-full object-cover" />
          </div>
        )}

        <article
          className="g2-markdown prose prose-lg mx-auto max-w-[720px] text-body-large leading-[1.85] text-text-main"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        <div className="reading-rule mx-auto mt-16 flex max-w-[720px] justify-end border-t border-black/5 pt-8">
          <Link
            href={backHref}
            className="reading-link rounded-full bg-black/5 px-6 py-3 text-label-large text-text-main transition-colors hover:bg-black/10"
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
