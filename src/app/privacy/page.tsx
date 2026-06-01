import React from "react";
import Link from "next/link";
import privacyData from "@/data/privacy.json";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-32 dark:bg-background">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-display-medium font-medium tracking-tight text-text-main">{privacyData.title}</h1>

        <div
          className="g2-markdown prose prose-lg max-w-none text-text-sub prose-headings:text-text-main prose-p:leading-relaxed prose-a:text-text-main prose-a:underline"
          dangerouslySetInnerHTML={{ __html: privacyData.content_html }}
        />

        <div className="mt-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-black/5 px-6 py-3 text-label-large text-text-main transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
