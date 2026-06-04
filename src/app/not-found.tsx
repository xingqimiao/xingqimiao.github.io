"use client";

import React, { useState, useEffect } from "react";

export default function NotFound() {
  const catPhrases = [
    "喵呜……这里是一片荒无猫烟的虚无之地。",
    "喵~ 目标页面跑去捉蝴蝶了，换个地方找找吧！",
    "猫咪老师把这个页面藏起来了！咕噜咕噜……",
    "铲屎官，你走丢了吗？这里只有一头雾水的猫咪。",
    "喵！此路不通，快回到主页吧。"
  ];

  const [phrase, setPhrase] = useState("喵呜……这里是一片荒无猫烟的虚无之地。");

  useEffect(() => {
    const randomPhrase = catPhrases[Math.floor(Math.random() * catPhrases.length)];
    setPhrase(randomPhrase);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-black text-white w-full py-24 px-6 select-none">
      {/* Next.js standard 404 layout with enlarged, centered fonts */}
      <div className="flex items-center justify-center font-sans">
        <h1 className="text-[48px] sm:text-[56px] font-medium leading-none pr-8 mr-8 border-r border-white/20 text-white">
          404
        </h1>
        <div className="text-center max-w-[280px] sm:max-w-md">
          <h2 className="text-[18px] sm:text-[20px] font-normal leading-[28px] text-zinc-300 py-1">
            {phrase}
          </h2>
        </div>
      </div>
    </div>
  );
}
