"use client";

import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";
import { EmailContactCard } from "@/components/ui/EmailContactCard";
import React, { useRef } from "react";
import joinData from "@/data/join.json";
import joinLinks from "@/data/join_links.json";
import type { Locale } from "@/i18n/locale";
import { resolveLocalizedContent } from "@/lib/localizedContent";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

type JoinContent = {
  description_html: string;
  description_html_en?: string;
  wechat_qr?: string;
  twitter_intro?: string;
  twitter_url?: string;
};

type JoinLink = {
  id: string;
  enabled: boolean;
  label: string;
  url: string;
  source: string;
  logo: string;
  order: number;
};

const joinCopy = {
  title: "加入我们，让改变发生",
  defaultEntryLabel: "打开入口",
  open: "Open",
  sponsorTitle: "微信赞助",
  sponsorDescription: "扫码支持项目持续维护与更新。",
  sponsorAlt: "微信赞助二维码",
  twitterTitle: "关注 Twitter (X)",
  twitterDescription: "获取最新动态，也可以直接通过主页与我们联系。",
  twitterAlt: "Twitter 简介预览截图",
  openProfile: "Open profile",
  submitEmailLabel: "投稿邮箱",
  feedbackEmailLabel: "反馈邮箱",
} as const;

const EMAIL_CARDS = [
  { label: joinCopy.submitEmailLabel, address: "stories@kiramyao.com" },
  { label: joinCopy.feedbackEmailLabel, address: "report@kiramyao.com" },
] as const;

function SurveyCard({
  href,
  logo,
  logoAlt,
  source,
  label,
}: {
  href: string;
  logo: string;
  logoAlt: string;
  source: string;
  label?: string;
}) {
  const displayLabel = label || joinCopy.defaultEntryLabel;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-between gap-5 rounded-[24px] border border-black/10 bg-[#f5f5f7] px-6 py-4 text-left transition-all hover:scale-[1.01] hover:border-black/15"
    >
      <span className="flex min-w-0 items-center gap-4">
        <img src={logo} alt={logoAlt} className="h-12 w-12 shrink-0 rounded-[14px]" />
        <span className="min-w-0">
          <span className="block text-title-large font-medium text-text-main">{displayLabel}</span>
          <span className="mt-1 block text-label-large text-text-sub">{source}</span>
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-white px-4 py-2 text-label-large text-text-main">{joinCopy.open}</span>
    </a>
  );
}

export default function JoinClient({
  locale = "zh",
  content = joinData as JoinContent,
  links = joinLinks as JoinLink[],
}: {
  locale?: Locale;
  content?: JoinContent;
  links?: JoinLink[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLinks = links.filter((item) => item.enabled).sort((a, b) => a.order - b.order);
  const copy = joinCopy;
  const description = resolveLocalizedContent(
    locale,
    content.description_html,
    content.description_html_en,
  );

  useGSAP(() => {
    gsap.fromTo(
      ".fade-in",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="min-h-screen bg-white px-6 pb-24 pt-32">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="fade-in mb-8 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          {copy.title}
        </h1>

        {activeLinks.length > 0 && (
          <div className="fade-in mb-10 grid w-full grid-cols-1 gap-4">
            {activeLinks.map((item) => {
              return (
                <SurveyCard
                  key={item.id}
                  href={item.url}
                  logo={item.logo}
                  logoAlt={item.label}
                  source={item.source}
                  label={item.label}
                />
              );
            })}
          </div>
        )}

        <div
          lang="zh-CN"
          className="g2-markdown fade-in prose prose-lg mb-16 max-w-3xl text-text-sub prose-p:leading-relaxed prose-a:text-text-main prose-a:underline prose-strong:text-text-main"
          dangerouslySetInnerHTML={{ __html: description.value }}
        />

        <div className="fade-in mb-16 grid w-full grid-cols-1 gap-4 md:grid-cols-2">
          {EMAIL_CARDS.map((card) => (
            <EmailContactCard key={card.address} label={card.label} address={card.address} />
          ))}
        </div>

        <div className="fade-in grid w-full grid-cols-1 gap-8 md:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
          {content.wechat_qr && (
            <section className="flex flex-col rounded-[28px] border border-black/10 bg-white p-6 transition-all hover:scale-[1.01]">
              <div>
                <h2 className="mb-3 text-title-large font-semibold text-text-main">{copy.sponsorTitle}</h2>
                <p className="mb-6 text-body-large text-text-sub">
                  {copy.sponsorDescription}
                </p>
              </div>
              <div className="mt-auto aspect-square w-full overflow-hidden rounded-[22px] border border-black/5 bg-[#f5f5f7] p-4">
                <img src={content.wechat_qr} alt={copy.sponsorAlt} className="h-full w-full object-contain" />
              </div>
            </section>
          )}

          {content.twitter_intro && (
            <section className="flex flex-col rounded-[28px] border border-black/10 bg-white p-6 transition-all hover:scale-[1.01]">
              <div>
                <h2 className="mb-3 text-title-large font-semibold text-text-main">{copy.twitterTitle}</h2>
                <p className="mb-6 text-body-large text-text-sub">
                  {copy.twitterDescription}
                </p>
              </div>
              <div className="aspect-[16/9] w-full overflow-hidden rounded-[22px] border border-black/5 bg-[#f5f5f7]">
                <img src={content.twitter_intro} alt={copy.twitterAlt} className="h-full w-full object-contain" />
              </div>
              <a
                href={content.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center rounded-full bg-[#121317] px-6 py-3 text-label-large text-white transition-all hover:scale-105 hover:bg-[#3C4043] dark:bg-[#f4f5f7] dark:text-[#121317] dark:hover:bg-white/85"
              >
                {copy.openProfile}
              </a>
            </section>
          )}
        </div>

        <div className="fade-in mt-16">
          <ReturnHomeButton locale={locale} label="Back to home" />
        </div>
      </div>
    </main>
  );
}
