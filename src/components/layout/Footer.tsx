import React from "react";
import Link from "next/link";
import globalConfig from "@/data/global_config.json";

export default function Footer() {
  return (
    <footer className="relative z-20 w-full border-t border-black/5 bg-white py-16">
      <div className="w-full overflow-hidden select-none pb-8">
        <span className="block w-full text-center text-[12.8vw] font-medium leading-[0.8] tracking-tighter text-text-main">
          KiraMyaoEqual
        </span>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 border-t border-black/5 px-6 pt-8 md:flex-row md:px-12">
        <div className="text-body-large text-text-sub">
          © {new Date().getFullYear()} KiraMyao Equal. All rights reserved.
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          <Link href="/about-kiramyao" className="text-body-large text-text-sub transition-colors hover:text-text-main hover:underline" prefetch={false}>
            About KiraMyao
          </Link>
          <Link href="/privacy" className="text-body-large text-text-sub transition-colors hover:text-text-main hover:underline" prefetch={false}>
            Privacy Policy
          </Link>
          <a
            href="https://2345.lgbt/zh-cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-large text-text-sub transition-colors hover:text-text-main hover:underline"
          >
            Project Trans
          </a>
          <a
            href={globalConfig.twitter_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-large text-text-sub transition-colors hover:text-text-main hover:underline"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
