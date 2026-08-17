"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import compiledArticles from "@/data/compiled_articles.json";
import { searchItems } from "@/lib/search";
import { selectRandomStory, sortStoriesByDateDescending, storyYear } from "@/lib/storyPresentation";
import { localizeStoryItems, storyListCopy, type StoryListCopy } from "@/lib/storyListPresentation";
import { getArticleHref } from "@/lib/articleRoute";
import { migrateStoryBookmarks } from "@/lib/storySlugAliases";
import { toLocalePath, type Locale } from "@/i18n/locale";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import React, { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type StoryItem = {
  slug: string;
  title: string;
  contentHtml: string;
  cover_name?: string;
  type: string;
  date?: string;
  identity_tags?: string[];
  region?: string;
  life_stage?: string;
  experience_year?: string;
  experience_date?: string;
  age_label?: string;
  role_label?: string;
  story_order?: number | string;
  contentLanguage?: "zh-CN";
  fallback?: boolean;
};

const BOOKMARK_KEY = "kira-story-bookmarks";

function readBookmarks() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BOOKMARK_KEY) || "[]");
    const migrated = migrateStoryBookmarks(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
      window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch {
    return [];
  }
}

type StoryView = "all" | "bookmarked" | "longform";

function htmlTextContent(html: string) {
  let text = "";
  let inTag = false;
  for (const char of html) {
    if (char === "<") {
      inTag = true;
    } else if (char === ">") {
      inTag = false;
    } else if (!inTag) {
      text += char;
    }
  }
  return text;
}

// A story counts as long-form when its rendered body has 100+ characters.
function isLongFormStory(story: StoryItem) {
  const text = htmlTextContent(String(story.contentHtml ?? "")).replace(/\s+/g, "");
  return text.length >= 100;
}

function IconBookmark({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M7 4.75A2.25 2.25 0 0 1 9.25 2.5h5.5A2.25 2.25 0 0 1 17 4.75v16l-5-3.15-5 3.15v-16Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="m20 20-4.4-4.4M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function IconShuffle() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M4 7h2.2c2.8 0 4 10 7.4 10H16m0 0-2-2m2 2-2 2M4 17h2.2c1.1 0 2-.8 2.8-2.1M13.6 7H16m0 0-2-2m2 2-2 2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconChevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d={direction === "prev" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function StoryCard({
  story,
  bookmarked,
  onToggleBookmark,
  locale,
  copy,
}: {
  story: StoryItem;
  bookmarked: boolean;
  onToggleBookmark: (slug: string) => void;
  locale: Locale;
  copy: StoryListCopy;
}) {
  const hasCover = Boolean(story.cover_name);
  const year = storyYear(story);

  return (
    <article
      lang={story.contentLanguage}
      data-story-card={hasCover ? "covered" : "tonal"}
      className={cn(
        "story-card group relative aspect-[4/3] overflow-hidden rounded-[var(--md-sys-shape-corner-large-increased)] border",
        hasCover ? "story-card--covered" : "story-card--tonal",
      )}
    >
      <Link
        href={toLocalePath(getArticleHref(story.type, story.slug), locale)}
        className="story-card__link absolute inset-0 z-10 block h-full rounded-[inherit]"
        prefetch={false}
      >
        {hasCover ? (
          <>
            <img
              src={story.cover_name}
              alt={story.title}
              loading="lazy"
              decoding="async"
              className="story-card__media absolute inset-0 h-full w-full object-cover"
            />
            <div className="story-card__scrim absolute inset-0" />
          </>
        ) : (
          <svg
            data-story-motif="book-lines"
            viewBox="0 0 320 220"
            aria-hidden="true"
            className="story-card__motif absolute right-0 top-0 h-[68%] w-[82%]"
            fill="none"
          >
            <path d="M48 60c42-28 82-28 120 0 38-28 78-28 120 0v92c-42-22-82-22-120 0-38-22-78-22-120 0V60Z" />
            <path d="M168 60v92M70 88c31-15 59-15 84 0M182 88c25-15 53-15 84 0" />
          </svg>
        )}

        <div className="relative z-10 flex h-full flex-col justify-end p-6 pr-16 min-[840px]:p-7 min-[840px]:pr-16">
          <div className="max-w-[92%]">
            <h2 className="mb-3 line-clamp-3 text-title-large font-semibold leading-snug text-[var(--md-sys-color-on-surface)]">
              {story.title}
            </h2>
            {year && <p className="text-label-large text-[var(--md-sys-color-on-surface-variant)]">{year}</p>}
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label={bookmarked ? copy.removeBookmark : copy.addBookmark}
        title={bookmarked ? copy.removeBookmark : copy.addBookmark}
        onClick={() => onToggleBookmark(story.slug)}
        className="story-card__bookmark absolute right-2 top-2 z-20 flex h-12 w-12 items-center justify-center rounded-full"
      >
        <IconBookmark filled={bookmarked} />
      </button>
    </article>
  );
}

function FilterButton({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-label-large transition-colors ${
        active ? "bg-white/10 text-white" : "text-white/62 hover:bg-white/[0.07] hover:text-white"
      }`}
    >
      <span>{label}</span>
      <span className="text-white/38">{count}</span>
    </button>
  );
}

function useStoryPageSize() {
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    function update() {
      const width = window.innerWidth;
      if (width >= 840) setPageSize(9);
      else if (width >= 600) setPageSize(6);
      else setPageSize(4);
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return pageSize;
}

export default function StoriesClient({
  locale = "zh",
  articles = compiledArticles as StoryItem[],
}: {
  locale?: Locale;
  articles?: StoryItem[];
}) {
  const router = useRouter();
  const copy = storyListCopy(locale);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<StoryView>("all");
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    return readBookmarks();
  });
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [searchTokens, setSearchTokens] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);
  const pageSize = useStoryPageSize();

  const stories = useMemo(
    () =>
      sortStoriesByDateDescending(
        localizeStoryItems(
          locale,
          articles.filter((article) => article.type === "stories"),
        ),
      ),
    [articles, locale],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/ai/search-index.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { tokens?: Record<string, string[]> } | null) => {
        if (!cancelled && data?.tokens) setSearchTokens(data.tokens);
      })
      .catch(() => {
        if (!cancelled) setSearchTokens({});
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([".stories-rise", ".story-card"], { clearProps: "all" });
        return;
      }
      gsap.fromTo(
        ".stories-rise",
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.05, ease: "power3.out" },
      );
      gsap.fromTo(
        ".story-card",
        { y: 30, opacity: 0, rotateX: -3 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.65, stagger: 0.045, ease: "power3.out", delay: 0.15 },
      );
    },
    { scope: containerRef },
  );

  function toggleBookmark(slug: string) {
    setBookmarks((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      return next;
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(searchInput.trim());
    setPage(1);
  }

  function commitSearch() {
    setSubmittedSearch(searchInput.trim());
    setPage(1);
  }

  const views: StoryView[] = ["all", "bookmarked", "longform"];

  const filteredStories = useMemo(() => {
    let result = stories;

    if (activeView === "bookmarked") {
      result = result.filter((story) => bookmarks.includes(story.slug));
    } else if (activeView === "longform") {
      result = result.filter(isLongFormStory);
    }

    if (submittedSearch) {
      result = searchItems(
        result,
        submittedSearch,
        [
          "title",
          "contentHtml",
          "date",
          "experience_date",
        ],
        searchTokens,
      );
    }

    return result;
  }, [activeView, bookmarks, searchTokens, stories, submittedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredStories.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleStories = filteredStories.slice((safePage - 1) * pageSize, safePage * pageSize);
  function randomStory() {
    const story = selectRandomStory(filteredStories);
    if (!story) return;
    router.push(toLocalePath(getArticleHref(story.type, story.slug), locale));
  }

  return (
    <main ref={containerRef} lang="zh-CN" className="stories-page min-h-screen bg-[var(--md-sys-color-surface)] px-5 pb-24 pt-28 text-white md:px-8">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="stories-rise lg:sticky lg:top-24 lg:self-start">
          <h1 className="mb-3 text-display-medium font-medium tracking-normal text-white md:text-display-large">
            {copy.heading}
          </h1>
          <p className="mb-10 text-body-large text-white/56">{copy.subtitle}</p>

          <nav className="space-y-8">
            <section className="space-y-2">
                <div className="space-y-1">
                  {views.map((view) => (
                    <FilterButton
                      key={view}
                      label={view === "all" ? copy.all : view === "bookmarked" ? copy.bookmarked : copy.longForm}
                      active={activeView === view}
                      count={view === "all" ? stories.length : view === "bookmarked" ? stories.filter((story) => bookmarks.includes(story.slug)).length : stories.filter(isLongFormStory).length}
                      onClick={() => {
                        setActiveView(view);
                        setPage(1);
                      }}
                    />
                  ))}
                </div>
              </section>
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="stories-rise mb-9 flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
            <form onSubmit={submitSearch} className="w-full md:max-w-[360px]">
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/45">
                  <IconSearch />
                </span>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSearchInput(value);
                    setSubmittedSearch(value.trim());
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitSearch();
                    }
                  }}
                  placeholder={copy.searchPlaceholder}
                  className="w-full rounded-[28px] border border-white/12 bg-white/[0.035] px-12 py-4 text-body-large text-white outline-none backdrop-blur-md transition-all placeholder:text-white/34 focus:border-[#d77abd]/45 focus:ring-4 focus:ring-[#d77abd]/10"
                />
                {searchInput && (
                  <button
                    type="button"
                    aria-label={copy.clearSearch}
                    onClick={() => {
                      setSearchInput("");
                      setSubmittedSearch("");
                    }}
                    className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/45 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <IconX />
                  </button>
                )}
              </div>
            </form>

            <button
              type="button"
              aria-label={copy.randomStory}
              onClick={randomStory}
              disabled={filteredStories.length === 0}
              title={filteredStories.length === 0 ? copy.randomUnavailable : copy.randomStory}
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.035] text-white/76 transition-all hover:border-[#d77abd]/45 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              <IconShuffle />
            </button>

            <Link
              href={toLocalePath("/stories/policy", locale)}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.035] px-6 py-4 text-label-large font-semibold text-white/82 transition-all hover:border-[#d77abd]/45 hover:text-white"
              prefetch={false}
            >
              {copy.shareStory}
            </Link>
          </div>

          {submittedSearch && (
            <div className="stories-rise mb-5 flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.035] px-5 py-3 text-label-large text-white/64">
              <span>
                {copy.searchResults(submittedSearch)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSubmittedSearch("");
                  setSearchInput("");
                }}
                className="rounded-full px-3 py-1 text-white/62 transition-colors hover:bg-white/10 hover:text-white"
              >
                {copy.clear}
              </button>
            </div>
          )}

          {visibleStories.length > 0 ? (
            <>
              <div className="stories-rise grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 min-[840px]:grid-cols-3 min-[1200px]:gap-6">
                {visibleStories.map((story) => (
                  <StoryCard
                    key={story.slug}
                    story={story}
                    bookmarked={bookmarks.includes(story.slug)}
                    onToggleBookmark={toggleBookmark}
                    locale={locale}
                    copy={copy}
                  />
                ))}
              </div>

              <div className="stories-rise mt-10 flex items-center justify-center gap-4 text-label-large text-white/62">
                <button
                  type="button"
                  aria-label={copy.previousPage}
                  disabled={safePage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.035] text-white/72 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
                >
                  <IconChevron direction="prev" />
                </button>
                <span>
                  {copy.page(safePage, totalPages)}
                </span>
                <button
                  type="button"
                  aria-label={copy.nextPage}
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.035] text-white/72 transition-colors hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
                >
                  <IconChevron direction="next" />
                </button>
              </div>
            </>
          ) : (
            <div className="stories-rise rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center text-body-large text-white/58">
              {stories.length === 0 ? copy.empty : copy.noMatch}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
