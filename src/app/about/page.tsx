"use client";

import React, { useRef } from "react";
import Link from "next/link";
import aboutData from "@/data/about.json";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();
    tl.fromTo(".fade-in", 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="bg-white dark:bg-background min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="fade-in mb-6 text-label-large tracking-widest text-primary font-medium uppercase">
          📖 About Us / 关于我们
        </div>
        
        {/* Title */}
        <h1 className="fade-in text-display-medium md:text-display-large text-text-main font-medium tracking-tight mb-8">
          {aboutData.title}
        </h1>

        {/* Intro Highlight Card */}
        <div className="fade-in p-8 md:p-10 rounded-[32px] bg-surface-light dark:bg-surface-dark border border-black/5 dark:border-white/5 shadow-soft-giant mb-12">
          <p className="text-title-large text-text-main leading-relaxed font-medium">
            {aboutData.intro}
          </p>
        </div>

        {/* Declaration & Body */}
        <div className="fade-in space-y-8 text-body-large text-text-sub leading-loose max-w-3xl">
          <p className="font-semibold text-text-main text-title-large">
            {aboutData.funding_statement}
          </p>

          <hr className="border-black/5 dark:border-white/5 my-8" />

          <p className="text-[18px] leading-[28px] font-medium text-brand-pink dark:text-brand-pink/90">
            {aboutData.declaration_header}
          </p>

          {aboutData.paragraphs.map((para, index) => (
            <p key={index} className="text-body-large">
              {para}
            </p>
          ))}
        </div>

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
