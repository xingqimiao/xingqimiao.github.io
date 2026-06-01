"use client";

import React, { useRef } from "react";
import Link from "next/link";
import joinData from "@/data/join.json";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function JoinUsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      ".fade-in",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="min-h-screen bg-white px-6 pb-24 pt-32 dark:bg-background">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="fade-in mb-8 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          加入我们，让改变发生
        </h1>

        {joinData.survey_url && (
          <a
            href={joinData.survey_url}
            target="_blank"
            rel="noopener noreferrer"
            className="fade-in mb-10 flex w-full items-center justify-between gap-6 rounded-[24px] border border-black/10 bg-[#f5f5f7] px-6 py-4 text-left transition-all hover:scale-[1.01] hover:border-black/15"
          >
            <span className="text-title-large font-medium text-text-main">{joinData.survey_label || "填写问卷"}</span>
            <span className="shrink-0 rounded-full bg-white px-4 py-2 text-label-large text-text-main">Open</span>
          </a>
        )}

        <div
          className="g2-markdown fade-in prose prose-lg mb-16 max-w-3xl text-text-sub prose-p:leading-relaxed prose-a:text-text-main prose-a:underline prose-strong:text-text-main"
          dangerouslySetInnerHTML={{ __html: joinData.description_html }}
        />

        <div className="fade-in grid w-full grid-cols-1 gap-8 md:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
          {joinData.wechat_qr && (
            <section className="flex flex-col rounded-[28px] border border-black/10 bg-white p-6 transition-all hover:scale-[1.01]">
              <div>
                <h2 className="mb-3 text-title-large font-semibold text-text-main">微信赞赏</h2>
                <p className="mb-6 text-body-large text-text-sub">扫码支持项目继续维护与更新。</p>
              </div>
              <div className="mt-auto aspect-square w-full overflow-hidden rounded-[22px] border border-black/5 bg-[#f5f5f7] p-4">
                <img src={joinData.wechat_qr} alt="微信赞赏二维码" className="h-full w-full object-contain" />
              </div>
            </section>
          )}

          {joinData.twitter_intro && (
            <section className="flex flex-col rounded-[28px] border border-black/10 bg-white p-6 transition-all hover:scale-[1.01]">
              <div>
                <h2 className="mb-3 text-title-large font-semibold text-text-main">关注 Twitter (X)</h2>
                <p className="mb-6 text-body-large text-text-sub">获取最新动态，也可以直接通过主页与我们联系。</p>
              </div>
              <div className="aspect-[16/9] w-full overflow-hidden rounded-[22px] border border-black/5 bg-[#f5f5f7]">
                <img src={joinData.twitter_intro} alt="Twitter 简介预览截图" className="h-full w-full object-contain" />
              </div>
              <a
                href={joinData.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center rounded-full bg-[#121317] px-6 py-3 text-label-large text-white transition-all hover:scale-105 hover:bg-[#3C4043]"
              >
                打开主页
              </a>
            </section>
          )}
        </div>

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
