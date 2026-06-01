import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-black/5 dark:border-white/5 h-16">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between h-full">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 text-title-large font-medium tracking-tight text-text-main">
          <img src="/pic/logo/Logo.png" alt="KiraEqual Logo" className="h-8 w-8 rounded-full object-contain" />
          <span>KiraEqual</span>
        </Link>

        {/* Center: Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/action" className="px-4 py-2 rounded-full text-label-large text-text-sub transition-all duration-200 hover:bg-black/5 hover:text-text-main">
            Action
          </Link>
          <Link href="/blog" className="px-4 py-2 rounded-full text-label-large text-text-sub transition-all duration-200 hover:bg-black/5 hover:text-text-main">
            Blog
          </Link>
          <Link href="/story" className="px-4 py-2 rounded-full text-label-large text-text-sub transition-all duration-200 hover:bg-black/5 hover:text-text-main">
            Story
          </Link>
          <Link href="/report" className="px-4 py-2 rounded-full text-label-large text-text-sub transition-all duration-200 hover:bg-black/5 hover:text-text-main">
            Report
          </Link>
          <Link href="/about" className="px-4 py-2 rounded-full text-label-large text-text-sub transition-all duration-200 hover:bg-black/5 hover:text-text-main">
            About
          </Link>
        </div>

        {/* Right: CTA */}
        <div>
          <Link href="/join">
            <Button variant="primary">Join Us</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
