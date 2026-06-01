import React from "react";
import Link from "next/link";
import globalConfig from "@/data/global_config.json";

export default function Footer() {
  return (
    <footer className="w-full bg-white py-16 border-t border-black/5 relative z-20">
      {/* 1. Giant text container - spans full screen width, edge-to-edge, no padding */}
      <div className="w-full overflow-hidden select-none pb-8">
        <span className="text-[12.8vw] leading-[0.8] tracking-tighter font-medium text-text-main text-center block w-full">
          KiraMyaoEqual
        </span>
      </div>

      {/* 2. Bottom links layout - centered and padded within standard max-w-7xl */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-black/5 pt-8">
        {/* Left: Logo Name */}
        <div className="text-label-medium text-text-sub">
          © {new Date().getFullYear()} KiraMyao Equal. All rights reserved.
        </div>

        {/* Right: Horizontal links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          <Link 
            href="/about" 
            className="text-label-medium text-text-sub hover:text-text-main hover:underline transition-colors"
          >
            About KiraMyao
          </Link>
          <Link 
            href="/privacy" 
            className="text-label-medium text-text-sub hover:text-text-main hover:underline transition-colors"
          >
            Privacy Policy
          </Link>
          <a 
            href="https://2345.lgbt/zh-cn/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-label-medium text-text-sub hover:text-text-main hover:underline transition-colors"
          >
            Project Trans
          </a>
          <a 
            href={globalConfig.twitter_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-label-medium text-text-sub hover:text-text-main hover:underline transition-colors"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
