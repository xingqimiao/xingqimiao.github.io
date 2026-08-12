"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const SITE_THEME_KEY = "kira-site-theme";

/** Resolve the preferred site theme from storage, falling back to the OS. */
export function prefersSiteDark(): boolean {
  try {
    const stored = window.localStorage.getItem(SITE_THEME_KEY);
    if (stored === "dark" || stored === "light") return stored === "dark";
  } catch {
    /* storage unavailable — fall through to the media query */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function siteIsDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function applySiteTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    window.localStorage.setItem(SITE_THEME_KEY, dark ? "dark" : "light");
  } catch {
    /* storage may be unavailable; the class still applies for this session */
  }
}

/**
 * Re-applies the saved theme after React hydration. The inline <head> script
 * paints the right theme before first paint, but hydration resets the <html>
 * className, wiping the `.dark` class — this component puts it back.
 */
export function SiteThemeBootstrap() {
  useEffect(() => {
    applySiteTheme(prefersSiteDark());
  }, []);
  return null;
}

/**
 * Site-wide light/dark toggle. Uses the same icons as the reading page
 * (◐ half-filled circle for light → click to go dark, ◑ for dark).
 */
export function ThemeToggle({ className }: { className?: string }) {
  // Start light so the first client render matches the server HTML, then sync
  // the saved preference right after hydration (async, to avoid the
  // "setState synchronously within an effect" lint rule).
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setDark(prefersSiteDark()));
    return () => cancelAnimationFrame(id);
  }, []);

  function toggle() {
    const next = !siteIsDark();
    applySiteTheme(next);
    setDark(next);
  }

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={cn(
        "cursor-pointer bg-transparent p-0 text-label-large font-medium leading-none transition-colors",
        className,
      )}
    >
      {dark ? "\u25d1" : "\u25d0"}
    </button>
  );
}
