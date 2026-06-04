import React from "react";
import { Metadata } from "next";
import privacyData from "@/data/privacy.json";
import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";

export const metadata: Metadata = {
  title: "隐私政策",
  description: "KiraMyao Equal 跨性别与性少数群体 (LGBTQ+) 关怀与倡导组织的隐私政策。我们尊重并保障每一位参与问卷调研和浏览本站的用户的隐私安全，对所有敏感调研数据均采取严格的去标识化与匿名处理保护措施。",
};

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
