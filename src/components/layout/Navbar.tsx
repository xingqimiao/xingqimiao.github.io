"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

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

  const navLinks = [
    { href: "/action", label: "Action" },
    { href: "/blog", label: "Blog" },
    { href: "/story", label: "Story" },
    { href: "/report", label: "Report" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 h-16">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between h-full">
          {/* Left: Logo */}
          <Link 
            href="/" 
            onClick={closeMenu} 
            className="flex items-center gap-2 text-title-large font-medium tracking-tight text-text-main relative z-50"
          >
            <img src="/pic/logo/Logo.png" alt="KiraEqual Logo" className="h-8 w-8 rounded-full object-contain" />
            <span>KiraEqual</span>
          </Link>

          {/* Center: Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-label-large text-text-sub transition-all duration-200 hover:bg-black/5 hover:text-text-main"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Desktop CTA & Mobile Toggle */}
          <div className="flex items-center gap-4 relative z-50">
            <div className="hidden md:block">
              <Link href="/join">
                <Button variant="primary">Join Us</Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={toggleMenu}
              className="flex flex-col justify-center items-center w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/5 md:hidden transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <span
                className={`w-4 h-0.5 bg-text-main transition-transform duration-300 ${
                  isOpen ? "rotate-45 translate-y-1" : "-translate-y-0.5"
                }`}
              />
              <span
                className={`w-4 h-0.5 bg-text-main transition-transform duration-300 mt-1 ${
                  isOpen ? "-rotate-45 -translate-y-0.5" : "translate-y-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay placed outside the nav container to avoid backdrop-blur positioning containment */}
      {isOpen && (
        <div className="fixed inset-0 top-16 bg-white/95 dark:bg-background/95 backdrop-blur-lg z-50 md:hidden flex flex-col pt-12 px-6 animate-fade-in overflow-y-auto pb-24">
          <div className="flex flex-col gap-6 text-center">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="text-headline-medium text-text-sub hover:text-text-main py-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-8 border-t border-black/5 dark:border-white/5 pt-8">
              <Link href="/join" onClick={closeMenu}>
                <Button variant="primary" className="w-full py-4 text-title-medium">
                  Join Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
