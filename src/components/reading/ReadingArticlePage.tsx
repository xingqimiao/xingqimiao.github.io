"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/locale";
import {
  applyDocumentLanguage,
  detectInitialLanguage,
  storeLanguage,
} from "@/i18n/language";
import { prefersSiteDark } from "@/components/layout/ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

type ReadingTheme = "light" | "dark";

interface ReadingArticlePageProps {
  locale?: Locale;
  backHref: string;
  backLabel: string;
  categoryLabel: string;
  kicker: string;
  title: string;
  date?: string;
  coverName?: string;
  contentHtml: string;
  contentLanguage?: "zh-CN" | "en";
  /** English translation of the article body; readers without one hide the switch. */
  enArticle?: { title: string; contentHtml: string } | null;
  initialTheme?: ReadingTheme;
  /** Small print rendered at the bottom of the reader (e.g. stories disclaimer). */
  disclaimer?: string;
}

const STORAGE_KEY = "kira-reading-theme";
const TRANSLATION_NOTICE = "AI translation of the Chinese original — may not be fully accurate.";

export function ReadingArticlePage({
  locale = "zh",
  backHref,
  backLabel,
  categoryLabel,
  kicker,
  title,
  date,
  coverName,
  contentHtml,
  contentLanguage,
  enArticle,
  initialTheme = "light",
  disclaimer,
}: ReadingArticlePageProps) {
  const [theme, setTheme] = useState<ReadingTheme>(() => {
    if (initialTheme === "dark" || typeof window === "undefined") {
      return initialTheme;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    // No explicit reader preference: follow the site-wide theme.
    return prefersSiteDark() ? "dark" : initialTheme;
  });
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [language, setLanguage] = useState<Locale>("zh");

  // First visit picks the language from the stored preference or the system
  // language list (Chinese conditions → zh, otherwise the English translation).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const initial = detectInitialLanguage();
      setLanguage(initial);
      applyDocumentLanguage(initial);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const toggleLabel = useMemo(
    () => theme === "dark" ? "Switch to light reading" : "Switch to dark reading",
    [theme]
  );
  const resolvedContentLanguage = contentLanguage ?? "zh-CN";
  const showEnglish = language === "en" && Boolean(enArticle);
  const shownTitle = showEnglish && enArticle ? enArticle.title : title;
  const shownContentHtml = showEnglish && enArticle ? enArticle.contentHtml : contentHtml;
  const shownContentLanguage = showEnglish ? "en" : resolvedContentLanguage;

  function toggleTheme() {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  function toggleLanguage() {
    setLanguage((current) => {
      const next = current === "zh" ? "en" : "zh";
      storeLanguage(next);
      applyDocumentLanguage(next);
      return next;
    });
  }

  return (
    <main
      data-theme={theme}
      className="reading-page min-h-screen px-6 pb-24 pt-32 text-[#121317] transition-colors duration-300"
    >
      <div className="page-enter mx-auto max-w-[880px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href={backHref} className="reading-link text-label-large text-text-sub transition-colors hover:text-text-main" prefetch={false}>
            {backLabel}
          </Link>
          <div className="flex items-center gap-3">
            <span className="reading-chip rounded-full bg-primary/10 px-3 py-1 text-label-large font-medium text-primary">
              {categoryLabel}
            </span>
            {enArticle && (
              <LanguageToggle language={language} onToggle={toggleLanguage} />
            )}
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

        <h1 lang={shownContentLanguage} className="article-title mb-4 text-center text-display-medium font-medium leading-tight md:text-display-medium">
          {shownTitle}
        </h1>

        <div className="reading-subtle mb-12 flex items-center justify-center gap-4 text-label-large text-text-sub">
          <span>{kicker}</span>
          <span>{"\u00b7"}</span>
          <span>{date}</span>
        </div>

        {showEnglish && (
          <p role="note" className="reading-subtle mx-auto -mt-6 mb-12 max-w-[720px] text-center text-label-medium text-text-sub/85">
            {TRANSLATION_NOTICE}
          </p>
        )}

        {coverName && (
          <div className="reading-rule mb-12 aspect-video w-full overflow-hidden rounded-[32px] border border-black/5 shadow-soft-giant">
            <img src={coverName} alt={shownTitle} className="h-full w-full object-cover" />
          </div>
        )}

        <article
          lang={shownContentLanguage}
          className="g2-markdown prose prose-lg mx-auto max-w-[720px] text-body-large leading-[1.85] text-text-main"
          dangerouslySetInnerHTML={{ __html: shownContentHtml }}
        />

        {disclaimer && (
          <div className="reading-rule mx-auto mt-16 max-w-[720px] border-t border-black/5 pt-6">
            <button
              type="button"
              onClick={() => setDisclaimerOpen((open) => !open)}
              aria-expanded={disclaimerOpen}
              aria-controls="story-disclaimer-content"
              className="reading-link flex cursor-pointer items-center gap-1.5 text-label-large text-text-sub transition-colors hover:text-text-main"
            >
              <span>内容说明</span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={`h-4 w-4 transition-transform duration-300 ${disclaimerOpen ? "rotate-180" : ""}`}
              >
                <path
                  d="m6 9 6 6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              id="story-disclaimer-content"
              className={`grid transition-all duration-300 ${disclaimerOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                {disclaimer.split(/\n\n+/).map((paragraph, index) => (
                  <p key={index} className="reading-subtle pt-3 text-label-medium leading-relaxed text-text-sub/85">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="reading-rule mx-auto mt-10 flex max-w-[720px] justify-end">
          <Link
            href={backHref}
            className="reading-link rounded-full bg-black/5 px-6 py-3 text-label-large text-text-main transition-colors hover:bg-black/10"
            prefetch={false}
          >
            {backLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
