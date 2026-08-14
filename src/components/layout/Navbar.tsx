"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { stripLocalePath, toLocalePath, uiDictionary, type Locale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

interface NavbarProps {
  locale: Locale;
}

const navItems = [
  { href: "/stories", label: "stories" },
  { href: "/report", label: "reports" },
  { href: "/documents", label: "documents" },
  { href: "/action", label: "projects" },
  { href: "/cat-cave", label: "catCave" },
] as const;

export default function Navbar({ locale }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const localPathname = stripLocalePath(pathname);
  const isStoriesArea = localPathname === "/stories" || localPathname.startsWith("/stories/");
  const dictionary = uiDictionary;

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isCurrent = (href: string) => localPathname === href || localPathname.startsWith(`${href}/`);

  return (
    <>
      <nav
        aria-label={dictionary.accessibility.primaryNavigation}
        className={cn(
          "fixed top-0 left-0 w-full z-50 h-16 border-b backdrop-blur-md transition-colors",
          isStoriesArea
            ? "border-white/10 bg-[#07080c]/88"
            : "border-black/5 bg-white/80 dark:border-white/5 dark:bg-background/80",
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between h-full">
          {/* Left: Logo */}
          <Link 
            href={toLocalePath("/", locale)}
            onClick={closeMenu} 
            className={`relative z-50 flex items-center gap-2 text-title-large font-medium tracking-tight ${
              isStoriesArea ? "text-white" : "text-text-main"
            }`}
            prefetch={false}
          >
            <img src="/pic/logo/Logo.png" alt="KiraEqual Logo" className="h-8 w-8 object-contain" />
            <span>KiraEqual</span>
          </Link>

          {/* Center: Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((link) => (
              <Link
                key={link.href}
                href={toLocalePath(link.href, locale)}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-label-large transition-all duration-200 ${
                  isCurrent(link.href)
                    ? isStoriesArea
                      ? "bg-white/10 text-white"
                      : "bg-black/5 text-text-main"
                    : isStoriesArea
                    ? "text-white/62 hover:bg-white/10 hover:text-white"
                    : "text-text-sub hover:bg-black/5 hover:text-text-main"
                }`}
                prefetch={false}
              >
                {dictionary.navigation[link.label]}
              </Link>
            ))}
          </div>

          {/* Right: Desktop CTA & Mobile Toggle */}
          <div className="flex items-center gap-4 relative z-50">
            <div className="hidden md:block">
              <Link href={toLocalePath("/join", locale)} prefetch={false}>
                <Button variant={isStoriesArea ? "glass" : "primary"}>{dictionary.navigation.join}</Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={toggleMenu}
              className={cn(
                "flex h-11 w-11 cursor-pointer flex-col items-center justify-center rounded-full transition-colors md:hidden",
                isStoriesArea ? "hover:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/5",
              )}
              aria-label={isOpen ? dictionary.accessibility.closeMenu : dictionary.accessibility.openMenu}
              aria-expanded={isOpen}
              aria-controls="site-mobile-navigation"
            >
              <span
                className={cn(
                  "h-0.5 w-4 transition-transform duration-300",
                  isStoriesArea ? "bg-white" : "bg-text-main",
                  isOpen ? "rotate-45 translate-y-1" : "-translate-y-0.5"
                )}
              />
              <span
                className={cn(
                  "mt-1 h-0.5 w-4 transition-transform duration-300",
                  isStoriesArea ? "bg-white" : "bg-text-main",
                  isOpen ? "-rotate-45 -translate-y-0.5" : "translate-y-0.5"
                )}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay placed outside the nav container to avoid backdrop-blur positioning containment */}
      {isOpen && (
        <div
          id="site-mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-label={dictionary.accessibility.mobileNavigation}
          className={cn(
            "fixed inset-0 top-16 z-50 flex animate-fade-in flex-col overflow-y-auto px-6 pb-24 pt-12 backdrop-blur-lg md:hidden",
            isStoriesArea ? "bg-[#07080c]/96" : "bg-white/95 dark:bg-background/95",
          )}
        >
          <div className="flex flex-col gap-6 text-center">
            {navItems.map((link) => (
              <Link
                key={link.href}
                href={toLocalePath(link.href, locale)}
                aria-current={isCurrent(link.href) ? "page" : undefined}
                onClick={closeMenu}
                className={`rounded-2xl py-3 text-headline-medium transition-all duration-200 ${
                  isCurrent(link.href)
                    ? isStoriesArea
                      ? "bg-white/10 text-white"
                      : "bg-black/5 text-text-main"
                    : isStoriesArea
                    ? "text-white/62 hover:bg-white/10 hover:text-white"
                    : "text-text-sub hover:bg-black/5 hover:text-text-main dark:hover:bg-white/5"
                }`}
                prefetch={false}
              >
                {dictionary.navigation[link.label]}
              </Link>
            ))}
            <div className={cn("mt-8 border-t pt-8", isStoriesArea ? "border-white/10" : "border-black/5 dark:border-white/5")}>
              <Link href={toLocalePath("/join", locale)} onClick={closeMenu} prefetch={false}>
                <Button variant={isStoriesArea ? "glass" : "primary"} className="w-full py-4 text-title-medium">
                  {dictionary.navigation.join}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
