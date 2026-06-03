import React from "react";
import privacyData from "@/data/privacy.json";
import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white px-6 pb-24 pt-32 dark:bg-background">
      <div className="page-enter mx-auto max-w-3xl">
        <h1 className="mb-8 text-display-medium font-medium tracking-tight text-text-main">{privacyData.title}</h1>

        <div
          className="g2-markdown prose prose-lg max-w-none text-text-sub prose-headings:text-text-main prose-p:leading-relaxed prose-a:text-text-main prose-a:underline"
          dangerouslySetInnerHTML={{ __html: privacyData.content_html }}
        />

        <div className="mt-16">
          <ReturnHomeButton />
        </div>
      </div>
    </main>
  );
}
