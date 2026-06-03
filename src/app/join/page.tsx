"use client";
import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";

import React, { useRef } from "react";
import Link from "next/link";
import joinData from "@/data/join.json";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const defaultTencentSurveyUrl = "https://wj.qq.com/s2/26908864/cf79/";
const surveyLabel = joinData.survey_label || "\u586b\u5199\u95ee\u5377";

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
  const displayLabel = label || surveyLabel;
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
      <span className="shrink-0 rounded-full bg-white px-4 py-2 text-label-large text-text-main">Open</span>
    </a>
  );
}

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
    <main ref={containerRef} className="min-h-screen bg-white px-6 pb-24 pt-32">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="fade-in mb-8 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          {"\u52a0\u5165\u6211\u4eec\uff0c\u8ba9\u6539\u53d8\u53d1\u751f"}
        </h1>

        {joinData.survey_url && (
          <div className="fade-in mb-10 grid w-full grid-cols-1 gap-4">
            <SurveyCard
              href={joinData.survey_url}
              logo={joinData.google_survey_logo || "/pic/join/google_forms_logo.svg"}
              logoAlt="Google Forms"
              source="Google Forms"
            />
            <SurveyCard
              href={joinData.tencent_survey_url || defaultTencentSurveyUrl}
              logo={joinData.tencent_survey_logo || "/pic/join/tencent_wenjuan_logo.svg"}
              logoAlt={"\u817e\u8baf\u95ee\u5377"}
              source={"\u5907\u7528\u65b9\u6848\uff08\u817e\u8baf\u95ee\u5377\uff09"}
            />
          </div>
        )}

        <div
          className="g2-markdown fade-in prose prose-lg mb-16 max-w-3xl text-text-sub prose-p:leading-relaxed prose-a:text-text-main prose-a:underline prose-strong:text-text-main"
          dangerouslySetInnerHTML={{ __html: joinData.description_html }}
        />

        {joinData.recruitment_url && (
          <div className="fade-in mb-16 w-full">
            <SurveyCard
              href={joinData.recruitment_url}
              logo={joinData.google_survey_logo || "/pic/join/google_forms_logo.svg"}
              logoAlt="Google Forms"
              source="Google Forms"
              label={joinData.recruitment_label || "加入 KiraMyao Equal｜志愿者招募表"}
            />
          </div>
        )}

        {joinData.description_bottom_html && (
          <div
            className="g2-markdown fade-in prose prose-lg mb-16 max-w-3xl text-text-sub prose-p:leading-relaxed prose-a:text-text-main prose-a:underline prose-strong:text-text-main"
            dangerouslySetInnerHTML={{ __html: joinData.description_bottom_html }}
          />
        )}

        <div className="fade-in grid w-full grid-cols-1 gap-8 md:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
          {joinData.wechat_qr && (
            <section className="flex flex-col rounded-[28px] border border-black/10 bg-white p-6 transition-all hover:scale-[1.01]">
              <div>
                <h2 className="mb-3 text-title-large font-semibold text-text-main">{"\u5fae\u4fe1\u8d5e\u8d4f"}</h2>
                <p className="mb-6 text-body-large text-text-sub">
                  {"\u626b\u7801\u652f\u6301\u9879\u76ee\u6301\u7eed\u7ef4\u62a4\u4e0e\u66f4\u65b0\u3002"}
                </p>
              </div>
              <div className="mt-auto aspect-square w-full overflow-hidden rounded-[22px] border border-black/5 bg-[#f5f5f7] p-4">
                <img src={joinData.wechat_qr} alt={"\u5fae\u4fe1\u8d5e\u8d4f\u4e8c\u7ef4\u7801"} className="h-full w-full object-contain" />
              </div>
            </section>
          )}

          {joinData.twitter_intro && (
            <section className="flex flex-col rounded-[28px] border border-black/10 bg-white p-6 transition-all hover:scale-[1.01]">
              <div>
                <h2 className="mb-3 text-title-large font-semibold text-text-main">{"\u5173\u6ce8 Twitter (X)"}</h2>
                <p className="mb-6 text-body-large text-text-sub">
                  {"\u83b7\u53d6\u6700\u65b0\u52a8\u6001\uff0c\u4e5f\u53ef\u4ee5\u76f4\u63a5\u901a\u8fc7\u4e3b\u9875\u4e0e\u6211\u4eec\u8054\u7cfb\u3002"}
                </p>
              </div>
              <div className="aspect-[16/9] w-full overflow-hidden rounded-[22px] border border-black/5 bg-[#f5f5f7]">
                <img src={joinData.twitter_intro} alt={"Twitter \u7b80\u4ecb\u9884\u89c8\u622a\u56fe"} className="h-full w-full object-contain" />
              </div>
              <a
                href={joinData.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-fit items-center rounded-full bg-[#121317] px-6 py-3 text-label-large text-white transition-all hover:scale-105 hover:bg-[#3C4043]"
              >
                {"\u6253\u5f00\u4e3b\u9875"}
              </a>
            </section>
          )}
        </div>

        <div className="fade-in mt-16">
          <ReturnHomeButton />
        </div>
      </div>
    </main>
  );
}
