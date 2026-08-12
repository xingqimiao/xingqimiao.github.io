"use client";

import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";
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

function IconEnvelope() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-6 w-6">
      <path d="M6.66767 3C5.78504 2.99999 5.07696 2.99999 4.50438 3.04677C3.91605 3.09484 3.40518 3.19469 2.97472 3.43437C2.43971 3.72915 2.04618 4.19978 1.85891 4.74032C1.77091 5.0087 1.73975 5.30742 1.73445 5.67458C1.73025 5.95518 1.74296 6.27982 1.76498 6.66705L10.8873 12.8357C11.5632 13.2858 12.4368 13.2858 13.1127 12.8357L22.235 6.66705C22.257 6.27982 22.2698 5.95518 22.2655 5.67458C22.2602 5.30742 22.2291 5.0087 22.1411 4.74032C21.9538 4.19978 21.5603 3.72915 21.0253 3.43437C20.5948 3.19469 20.084 3.09484 19.4956 3.04677C18.923 2.99999 18.215 2.99999 17.3323 3H6.66767Z"/>
      <path d="M6.2679 3H17.7321C18.5449 2.99999 19.2006 2.99999 19.7315 3.04336C20.2781 3.08804 20.7085 3.17968 21.0631 3.37621C21.5679 3.65511 21.9677 4.06764 22.2155 4.58123C22.3913 4.94771 22.4888 5.41172 22.5348 6.05055C22.5435 6.17189 22.5435 6.32747 22.5435 6.55562V7.62408L13.4751 13.7562C12.5741 14.3593 11.4259 14.3593 10.5249 13.7562L1.45648 7.62408V6.55562C1.45648 6.32747 1.4565 6.17189 1.46525 6.05055C1.51118 5.41172 1.60869 4.94771 1.78453 4.58123C2.03234 4.06764 2.4321 3.65511 2.93686 3.37621C3.29154 3.17968 3.72191 3.08804 4.26852 3.04336C4.79943 2.99999 5.45507 2.99999 6.2679 3Z"/>
      <path d="M1.38704 8.13444C1.18389 7.98019 1.08231 7.90307 0.995849 7.90451C0.92093 7.9057 0.850693 7.93483 0.797858 7.98568C0.737001 8.04389 0.696401 8.13317 0.650043 8.30556C0.590675 8.52225 0.546216 8.82175 0.511593 9.20502C0.486506 9.48693 0.46791 9.82436 0.456475 10.2278C0.442169 10.7395 0.437832 11.4057 0.437832 12.2108V12.6125C0.437832 13.327 0.441491 13.9155 0.454215 14.3862C0.468157 14.9006 0.493803 15.3522 0.541266 15.757C0.575646 16.0485 0.621257 16.3489 0.690459 16.6241C0.769304 16.9377 0.881554 17.2072 1.05551 17.4312C1.26177 17.6977 1.54235 17.888 1.84233 18.0065C2.12229 18.1174 2.45055 18.175 2.82164 18.2055C3.09862 18.2278 3.41403 18.2376 3.78093 18.2431C4.18874 18.2493 4.68335 18.25 5.2754 18.25H9.02319V17.4167H5.29023C4.70908 17.4167 4.25574 17.4159 3.89148 17.4105C3.56648 17.4057 3.34639 17.3985 3.17277 17.3865C3.12499 17.3831 3.08237 17.3794 3.04483 17.3754C2.73043 17.3427 2.56542 17.2918 2.4827 17.2594C2.25708 17.1714 2.13799 17.0914 2.0846 17.0454C2.05252 17.0182 2.02303 16.9762 1.98353 16.8856C1.95679 16.824 1.9341 16.7554 1.91417 16.6796C1.85471 16.4606 1.82687 16.1606 1.80687 15.7218C1.79155 15.3832 1.78843 14.9502 1.78843 14.4184V13.366C1.78843 12.5052 1.7919 11.7869 1.80165 11.2077C1.81203 10.5899 1.83204 10.0839 1.86808 9.68402C1.8794 9.55305 1.8932 9.43556 1.91014 9.33083C1.92375 9.24824 1.94476 9.16643 1.97434 9.08855C2.02444 8.95069 2.08843 8.82482 2.1673 8.70968C2.22239 8.6278 2.2865 8.54847 2.36091 8.47268C2.24293 8.38917 2.11039 8.30974 1.96274 8.23985C1.76082 8.1453 1.55236 8.11707 1.38704 8.13444Z"/>
    </svg>
  );
}

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
            <a
              key={card.address}
              href={`mailto:${card.address}`}
              className="flex w-full items-center gap-4 rounded-[24px] border border-black/10 bg-[#f5f5f7] px-6 py-4 text-left transition-all hover:scale-[1.01] hover:border-black/15"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white text-text-main">
                <IconEnvelope />
              </span>
              <span className="min-w-0">
                <span className="block text-title-large font-normal text-text-main">{card.label}</span>
                <span className="mt-1 block break-all text-label-large text-text-sub">{card.address}</span>
              </span>
            </a>
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
