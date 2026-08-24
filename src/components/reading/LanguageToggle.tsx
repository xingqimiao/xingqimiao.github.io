"use client";

import type { Locale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * Internal language switch for the article reader. Keeps the exact footprint
 * and styling of the reading-page theme toggle (plain label text, no
 * container) so switching never shifts the layout or distracts from reading.
 */
export function LanguageToggle({
  language,
  onToggle,
  className,
}: {
  language: Locale;
  onToggle: () => void;
  className?: string;
}) {
  const isEnglish = language === "en";
  const label = isEnglish ? "中" : "EN";
  const ariaLabel = isEnglish ? "Switch to 中文" : "Switch to English";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onToggle}
      className={cn(
        "cursor-pointer bg-transparent p-0 text-label-large font-medium leading-none text-text-sub transition-colors hover:text-text-main",
        className,
      )}
    >
      {label}
    </button>
  );
}
