"use client";

import React, { useRef } from "react";
import Link from "next/link";
import joinData from "@/data/join.json";
import { BentoCard } from "@/components/ui/BentoCard";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function JoinUsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(".fade-in", 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="bg-white dark:bg-background min-h-screen pt-32 pb-24 px-6 flex flex-col justify-center items-center text-center">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
        {/* Header */}
        <div className="fade-in mb-6 text-label-large tracking-widest text-primary font-medium uppercase">
          🤝 Join Us / 加入我们
        </div>
        <h1 className="fade-in text-display-medium md:text-display-large text-text-main font-medium tracking-tight mb-8">
          加入我们，让改变发生
        </h1>

        {/* Centered Content */}
        <div 
          className="fade-in text-title-large text-text-sub leading-relaxed max-w-2xl mx-auto mb-16 text-center"
          dangerouslySetInnerHTML={{ __html: joinData.description_html }}
        />

        {/* Centered Cards Container (Grid) */}
        <div className="fade-in grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl justify-center">
          {/* Card 1: WeChat Donation */}
          {joinData.wechat_qr && (
            <BentoCard theme="light" className="p-8 flex flex-col items-center justify-between text-center min-h-[400px]" hoverEffect>
              <div className="flex flex-col items-center">
                <h3 className="text-title-large text-text-main font-semibold mb-3">微信赞赏</h3>
                <p className="text-body-large text-text-sub mb-6">扫一扫，请猫猫吃个罐头吧~</p>
              </div>
              <div className="w-48 h-48 rounded-[20px] overflow-hidden bg-white shadow-md flex items-center justify-center p-2">
                <img 
                  src={joinData.wechat_qr} 
                  alt="微信赞赏二维码" 
                  className="w-full h-full object-contain"
                />
              </div>
            </BentoCard>
          )}

          {/* Card 2: Twitter Support */}
          {joinData.twitter_intro && (
            <BentoCard theme="light" className="p-8 flex flex-col items-center justify-between text-center min-h-[400px]" hoverEffect>
              <div className="flex flex-col items-center">
                <h3 className="text-title-large text-text-main font-semibold mb-3">关注 Twitter (X)</h3>
                <p className="text-body-large text-text-sub mb-6">获取最新动态，一起交流互动</p>
              </div>
              <div className="w-48 h-32 rounded-[20px] overflow-hidden bg-black/5 flex items-center justify-center shadow-inner">
                <img 
                  src={joinData.twitter_intro} 
                  alt="推特简介" 
                  className="w-full h-full object-cover"
                />
              </div>
              <a 
                href={joinData.twitter_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-6 inline-block px-8 py-3 rounded-full bg-gradient-to-r from-brand-blue to-brand-pink text-white font-bold tracking-wide hover:shadow-lg hover:scale-105 transition-all"
              >
                一键跳转主页
              </a>
            </BentoCard>
          )}
        </div>

        {/* Back Button */}
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
