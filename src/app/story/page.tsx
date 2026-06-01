"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import compiledArticles from "@/data/compiled_articles.json";
import { BentoCard } from "@/components/ui/BentoCard";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function StoryListPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const stories = compiledArticles.filter((art) => art.type === "story");
  const filteredStories = stories.filter((art) =>
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useGSAP(() => {
    gsap.fromTo(".fade-in", 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="bg-white dark:bg-background min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="fade-in mb-6 text-label-large tracking-widest text-primary font-medium uppercase">
          📖 Stories / 项目经历与宣传故事
        </div>
        <h1 className="fade-in text-display-medium md:text-display-large text-text-main font-medium tracking-tight mb-12">
          真实的心声与记录
        </h1>

        {/* Search Bar */}
        <div className="fade-in mb-16 max-w-2xl">
          <div className="relative">
            <input 
              type="text" 
              placeholder="🔍 搜索故事标题或关键字..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 rounded-[20px] bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 text-body-large shadow-soft-giant transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main text-body-large"
              >
                清除
              </button>
            )}
          </div>
        </div>

        {/* Grid List */}
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map((post) => (
              <Link key={post.slug} href={`/story/${post.slug}`} className="fade-in flex">
                <BentoCard 
                  theme="light" 
                  className="w-full flex flex-col justify-between overflow-hidden cursor-pointer h-full min-h-[420px]"
                  hoverEffect
                >
                  <div className="w-full">
                    {/* Cover Photo */}
                    <div className="w-full aspect-video overflow-hidden rounded-[20px] mb-6 bg-black/5">
                      {post.cover_name ? (
                        <img 
                          src={post.cover_name} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-blue/10 to-brand-pink/10">
                          <span className="text-label-large text-text-sub/50">KiraEqual</span>
                        </div>
                      )}
                    </div>
                    {/* Date */}
                    <span className="text-label-large text-text-sub opacity-75 block mb-2">{post.date}</span>
                    {/* Title */}
                    <h3 className="text-title-large text-text-main font-semibold leading-snug mb-3">
                      {post.title}
                    </h3>
                  </div>
                  {/* Desc */}
                  <p className="text-body-large text-text-sub line-clamp-2">
                    {post.desc}
                  </p>
                </BentoCard>
              </Link>
            ))}
          </div>
        ) : (
          <div className="fade-in py-16 text-center text-text-sub text-body-large">
            没有找到匹配的故事，请尝试其他关键词
          </div>
        )}

        {/* Back to Home Button */}
        <div className="fade-in mt-16">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black/5 dark:bg-white/5 text-label-large text-text-main hover:bg-black/10 dark:hover:bg-white/10 transition-all"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
