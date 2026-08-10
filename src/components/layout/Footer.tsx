"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import globalConfig from "@/data/global_config.json";
import { stripLocalePath, toLocalePath, uiDictionary, type Locale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

interface FooterProps {
  locale: Locale;
}

export default function Footer({ locale }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const localPathname = stripLocalePath(pathname);
  const isStoriesArea = localPathname === "/stories" || localPathname.startsWith("/stories/");
  const dictionary = uiDictionary;
  const subtleLink = isStoriesArea ? "text-white/56 hover:text-white" : "text-text-sub hover:text-text-main";

  return (
    <footer
      className={cn(
        "relative z-20 w-full border-t py-16 transition-colors",
        isStoriesArea ? "border-white/10 bg-[#07080c]" : "border-black/5 bg-white",
      )}
    >
      <div className="w-full overflow-hidden select-none pb-10">
        <span
          className={cn(
            "block w-full text-center text-[12.8vw] font-medium leading-[0.8] tracking-normal",
            isStoriesArea ? "text-white" : "text-text-main",
          )}
        >
          KiraMyaoEqual
        </span>
      </div>

      <div
        className={cn(
          "mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 border-t px-6 pt-8 md:flex-row md:items-start md:px-12",
          isStoriesArea ? "border-white/10" : "border-black/5",
        )}
      >
        <div className={cn(
          "inline-flex shrink-0 items-baseline whitespace-nowrap text-center text-body-large md:text-left",
          isStoriesArea ? "text-white/56" : "text-text-sub",
        )}>
          <span>&copy; {currentYear} KiraMyao Equal</span>
          <span className={cn("px-2", isStoriesArea ? "text-white/24" : "text-black/25")}>{" · "}</span>
          <a
            href="https://creativecommons.org/licenses/by-nc/4.0/"
            target="_blank"
            rel="noopener noreferrer license"
            className={`transition-colors hover:underline ${subtleLink}`}
          >
            CC BY-NC 4.0
          </a>
        </div>

        <nav
          aria-label={dictionary.accessibility.footerNavigation}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 md:justify-end"
        >
          <Link href={toLocalePath("/about-kiramyao", locale)} className={`text-body-large transition-colors hover:underline ${subtleLink}`} prefetch={false}>
            {dictionary.footer.aboutKiramyao}
          </Link>
          <Link href={toLocalePath("/privacy", locale)} className={`text-body-large transition-colors hover:underline ${subtleLink}`} prefetch={false}>
            {dictionary.footer.privacy}
          </Link>
          <a
            href="https://2345.lgbt/zh-cn/"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-body-large transition-colors hover:underline ${subtleLink}`}
          >
            {dictionary.footer.projectTrans}
          </a>
          <a
            href={globalConfig.twitter_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-body-large transition-colors hover:underline ${subtleLink}`}
          >
            {dictionary.footer.twitter}
          </a>
        </nav>
      </div>
    </footer>
  );
}
