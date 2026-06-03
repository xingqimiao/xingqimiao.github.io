"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { HomepageActionCard } from "@/components/ui/HomepageActionCard";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
import { ParticleRipple } from "@/components/ui/ParticleRipple";

// Dynamic data imports
import bentoData from "@/data/homepage_bento.json";
import insightsData from "@/data/insights.json";
import compiledArticles from "@/data/compiled_articles.json";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger, TextPlugin);
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Extract text for typewriter
  const titleText = "KiraEqual 2.0";

  // Filter selected insights for the homepage
  const featuredArticles = insightsData
    .map((slug) => compiledArticles.find((art) => art.slug === slug))
    .filter(Boolean);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    gsap.set(".hero-text", { y: 42, opacity: 0, filter: "blur(18px)" });
    gsap.set(".hero-media", {
      y: 92,
      opacity: 0,
      scale: 0.94,
      filter: "blur(18px)",
      clipPath: "inset(16% 9% 16% 9% round 48px)",
    });

    tl.to(".hero-text", {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 1,
      stagger: 0.12,
    }).to(
      ".hero-media",
      {
        y: 0,
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        clipPath: "inset(0% 0% 0% 0% round 48px)",
        duration: 1.45,
      },
      "-=0.55"
    );

    gsap.to(".hero-media video", {
      scale: 1.08,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-media",
        start: "top 70%",
        end: "bottom top",
        scrub: 0.8,
      },
    });

    gsap.utils.toArray<HTMLElement>(".scroll-item").forEach((el) => {
      gsap.fromTo(
        el,
        { y: 72, opacity: 0, filter: "blur(14px)", rotateX: -8, transformOrigin: "50% 80%" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          rotateX: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: el,
            start: "top 84%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="bg-white dark:bg-background min-h-screen">
      {/* Section A: Hero */}
      <section className="flex flex-col items-center justify-center pt-32 pb-20 text-center w-full">
        {/* Title must have a fixed height so the layout doesn't jump during typewriter */}
        <h1 className="hero-text text-display-large mb-6 text-text-main tracking-tighter font-medium">{titleText}</h1>
        <p className="hero-text text-body-large text-text-sub max-w-2xl mx-auto px-6">
          KiraEqual 是一个致力于为跨性别与性少数群体 (LGBTQ+) 提供支持、关怀与减少歧视的去中心化开源项目。我们通过数据调研与故事宣传，推动社会理解与流动的性别平等。
        </p>

        <div className="hero-text mt-8 mb-16 flex justify-center">
          <Link href="/join">
            <Button variant="primary">Join Us</Button>
          </Link>
        </div>

        {/* Huge Video Container */}
        <div className="w-full px-4 md:px-6">
          <div className="hero-media relative w-full aspect-video md:min-h-[60vh] md:max-h-[85vh] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-black/5 dark:border-white/5">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full object-cover relative z-10"
            >
              <source src="/video/kirahero.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Fallback mockup overlay background */}
            <div className="absolute inset-0 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl flex items-center justify-center z-0">
               {/* Clean dark backdrop before video loads */}
            </div>
          </div>
        </div>
      </section>

      {/* Section B: Our Actions */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <h2 className="text-headline-large text-text-main mb-16 scroll-item">我们的行动</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-16">
          {bentoData.map((item) => (
            <div 
              key={item.id} 
              className={`${
                item.size === "large" ? "md:col-span-8" : "md:col-span-4"
              } flex flex-col gap-6 scroll-item`}
            >
              <HomepageActionCard title={item.title} coverName={item.cover_name} />
              <div className="px-2">
                <h3 className="text-title-large text-text-main mb-2">{item.title}</h3>
                <p className="text-[14px] leading-[20px] text-text-sub">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section C: Recent Blogs (最新洞察) */}
      <section className="py-24 px-6 max-w-7xl mx-auto scroll-item">
        <div className="flex justify-between items-end mb-16 px-2">
          <h2 className="text-headline-large text-text-main">最新洞察</h2>
          <Link href="/blog" className="text-label-large text-text-sub hover:text-text-main hover:underline underline-offset-4 cursor-pointer transition-all">
            查看全部文章 →
          </Link>
        </div>
        
        <div className="flex flex-col">
          {featuredArticles.map((post) => {
            if (!post) return null;
            return (
              <Link 
                key={post.slug} 
                href={`/${post.type}/${post.slug}`}
                className="group flex flex-col sm:flex-row sm:items-center py-8 border-b border-black/5 dark:border-white/5 cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 px-6 -mx-6 rounded-2xl"
              >
                <div className="flex items-center gap-4 w-full sm:w-1/4 mb-4 sm:mb-0">
                  <span className="text-label-large text-text-sub opacity-70">
                    {post.date || "2026.05"}
                  </span>
                  <Chip>
                    {post.type === "blog" ? "博客" : post.type === "story" ? "故事" : "报告"}
                  </Chip>
                </div>
                <div className="flex-1">
                  <h3 className="article-title text-title-large mb-2 group-hover:underline decoration-2 underline-offset-4 decoration-current transition-all">
                    {post.title}
                  </h3>
                  <p className="text-body-large text-text-sub line-clamp-1">{post.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Section D: Join Us — 巨幕粒子卡片 */}
      <div className="w-full px-4 md:px-6 my-24">
        <div className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-[#0D0D12] min-h-[70vh] flex flex-col items-center justify-center">
          {/* WebGL 粒子背景 */}
          <ParticleRipple />

          {/* 前景内容 */}
          <div className="relative z-10 flex flex-col items-center text-center pointer-events-auto">
            <h2 className="text-display-medium text-white mb-8 tracking-tight font-medium">加入我们，让改变发生</h2>
            <Link href="/join">
              <Button variant="glass" className="px-8 py-4 text-title-medium">Join Us</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
