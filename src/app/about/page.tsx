"use client";

import React, { useRef } from "react";
import Link from "next/link";
import aboutData from "@/data/about.json";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type AboutContent = typeof aboutData & {
  content_html?: string;
  content_markdown?: string;
};

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const content = aboutData as AboutContent;

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      ".fade-in",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="min-h-screen bg-white px-6 pb-24 pt-32 dark:bg-background">
      <div className="mx-auto max-w-4xl">
        <h1 className="fade-in mb-10 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          {content.title}
        </h1>

        {content.content_html ? (
          <div
            className="g2-markdown fade-in prose prose-lg max-w-3xl text-text-sub prose-headings:text-text-main prose-p:leading-relaxed prose-a:text-text-main prose-a:underline"
            dangerouslySetInnerHTML={{ __html: content.content_html }}
          />
        ) : (
          <div className="fade-in max-w-3xl space-y-8 text-body-large leading-loose text-text-sub">
            <p className="text-title-large leading-relaxed text-text-sub">{content.intro}</p>

            <p className="text-title-large font-semibold text-text-main">{content.funding_statement}</p>

            <hr className="my-8 border-black/5 dark:border-white/5" />

            <p className="text-[18px] font-medium leading-[28px] text-text-main">{content.declaration_header}</p>

            {content.paragraphs.map((para, index) => (
              <p key={index} className="text-body-large">
                {para}
              </p>
            ))}
          </div>
        )}

        <div className="fade-in mt-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-black/5 px-6 py-3 text-label-large text-text-main transition-all hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
