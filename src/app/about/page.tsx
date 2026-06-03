"use client";

import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";

import React, { useRef } from "react";
import aboutData from "@/data/about.json";
import { splitAboutHtml } from "@/lib/aboutSections";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type AboutContent = typeof aboutData & {
  content_html?: string;
  content_markdown?: string;
  kiramyao_html?: string;
  kiramyao_markdown?: string;
};

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const content = aboutData as AboutContent;
  const { organizationHtml } = splitAboutHtml(content.content_html || "", content.kiramyao_html);

  useGSAP(() => {
    gsap.fromTo(
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

        <div
          className="g2-markdown fade-in prose prose-lg max-w-3xl text-text-sub prose-headings:text-text-main prose-p:leading-relaxed prose-a:text-text-main prose-a:underline"
          dangerouslySetInnerHTML={{ __html: organizationHtml }}
        />

        <div className="fade-in mt-16">
          <ReturnHomeButton />
        </div>
      </div>
    </main>
  );
}
