import React from "react";
import aboutData from "@/data/about.json";
import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";
import { splitAboutHtml } from "@/lib/aboutSections";

type AboutContent = typeof aboutData & {
  content_html?: string;
  kiramyao_html?: string;
  kiramyao_markdown?: string;
};

export default function AboutKiraMyaoPage() {
  const content = aboutData as AboutContent;
  const { kiraMyaoHtml } = splitAboutHtml(content.content_html || "", content.kiramyao_html);

  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-32 dark:bg-background">
      <div className="page-enter mx-auto max-w-3xl">
        <h1 className="mb-8 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          About KiraMyao
        </h1>

        <div
          className="g2-markdown prose prose-lg max-w-none text-text-sub prose-headings:text-text-main prose-p:leading-relaxed prose-a:text-text-main prose-a:underline"
          dangerouslySetInnerHTML={{ __html: kiraMyaoHtml }}
        />

        <div className="mt-16">
          <ReturnHomeButton />
        </div>
      </div>
    </main>
  );
}
