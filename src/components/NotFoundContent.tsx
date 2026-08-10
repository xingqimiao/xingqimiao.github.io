"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/locale";
import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";

const phrases = [
  "喵呜……这里是一片荒无猫烟的虚无之地。",
  "喵~ 目标页面跑去捉蝴蝶了，换个地方找找吧！",
  "猫咪老师把这个页面藏起来了！咕噜咕噜……",
  "铲屎官，你走丢了吗？这里只有一头雾水的猫咪。",
  "喵！此路不通，快回到主页吧。",
];

export function NotFoundContent({ locale }: { locale: Locale }) {
  const [phrase, setPhrase] = useState(phrases[0]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const nextPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      setPhrase(nextPhrase);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-1 select-none flex-col items-center justify-center bg-black px-6 py-24 text-white">
      <div className="flex items-center justify-center font-sans">
        <h1 className="mr-8 border-r border-white/20 pr-8 text-[48px] font-medium leading-none text-white sm:text-[56px]">
          404
        </h1>
        <div className="max-w-[280px] sm:max-w-md">
          <p className="py-1 text-[18px] font-normal leading-7 text-zinc-300 sm:text-[20px]" lang="zh-CN">
            {phrase}
          </p>
        </div>
      </div>
      <div className="mt-10">
        <ReturnHomeButton locale={locale} />
      </div>
    </main>
  );
}
