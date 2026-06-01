"use client";

import React, { useRef } from "react";
import Link from "next/link";
import actionsData from "@/data/actions.json";
import { BentoCard } from "@/components/ui/BentoCard";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface ActionItem {
  id: string;
  name: string;
  desc: string;
  status: "running" | "paused" | "completed" | "delayed" | "failed";
}

const statusMap = {
  running: { label: "正在执行", color: "bg-green-500 dark:bg-green-400", pulse: true },
  paused: { label: "暂停", color: "bg-yellow-500 dark:bg-yellow-400", pulse: false },
  completed: { label: "已完成", color: "bg-green-500 dark:bg-green-400", pulse: false },
  delayed: { label: "延期", color: "bg-yellow-500 dark:bg-yellow-400", pulse: false },
  failed: { label: "失败", color: "bg-red-500 dark:bg-red-400", pulse: false }
};

export default function ActionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const actions = actionsData as ActionItem[];

  useGSAP(() => {
    gsap.fromTo(".action-card", 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="bg-white dark:bg-background min-h-screen pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="action-card mb-6 text-label-large tracking-widest text-primary font-medium uppercase">
          ⚡ Our Actions / 我们的行动项目
        </div>
        <h1 className="action-card text-display-medium md:text-display-large text-text-main font-medium tracking-tight mb-16">
          行动，改变现在
        </h1>

        {/* Action Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {actions.map((act) => {
            const statusConfig = statusMap[act.status] || statusMap.running;
            
            return (
              <div key={act.id} className="action-card flex">
                <BentoCard 
                  theme="light" 
                  className="w-full p-8 flex flex-col justify-between items-start gap-8 min-h-[280px]"
                  hoverEffect
                >
                  {/* Status Indicator */}
                  <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-full">
                    {/* Glowing LED indicator */}
                    <div className="relative flex h-3 w-3">
                      {statusConfig.pulse && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusConfig.color} opacity-75`}></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${statusConfig.color}`}></span>
                    </div>
                    <span className="text-label-large text-text-main font-medium">
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-title-large text-text-main mb-3 font-semibold">
                      {act.name}
                    </h3>
                    <p className="text-body-large text-text-sub leading-relaxed">
                      {act.desc}
                    </p>
                  </div>
                </BentoCard>
              </div>
            );
          })}
        </div>

        {/* Back to Home Button */}
        <div className="action-card mt-16">
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
