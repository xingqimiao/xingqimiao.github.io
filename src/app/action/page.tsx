"use client";

import React, { useRef } from "react";
import Link from "next/link";
import actionsData from "@/data/actions.json";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface ActionItem {
  id: string;
  name: string;
  desc: string;
  status: "running" | "paused" | "completed" | "delayed" | "failed";
}

const statusMap = {
  running: { label: "正在执行", color: "bg-green-500", pulse: true },
  paused: { label: "暂停", color: "bg-yellow-500", pulse: false },
  completed: { label: "已完成", color: "bg-green-500", pulse: false },
  delayed: { label: "延期", color: "bg-yellow-500", pulse: false },
  failed: { label: "失败", color: "bg-red-500", pulse: false },
};

export default function ActionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const actions = actionsData as ActionItem[];

  useGSAP(() => {
    gsap.fromTo(
      ".action-card",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="min-h-screen bg-white px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="action-card mb-12 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          行动，改变现在
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {actions.map((act) => {
            const statusConfig = statusMap[act.status] || statusMap.running;

            return (
              <article
                key={act.id}
                className="action-card flex min-h-[240px] flex-col justify-between rounded-[28px] border border-black/10 bg-white p-6 transition-all hover:-translate-y-0.5 hover:scale-[1.01] hover:border-black/15"
              >
                <div className="flex items-center gap-3 self-start rounded-full bg-black/5 px-4 py-2">
                  <span className="relative flex h-3 w-3">
                    {statusConfig.pulse && (
                      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusConfig.color} opacity-75`} />
                    )}
                    <span className={`relative inline-flex h-3 w-3 rounded-full ${statusConfig.color}`} />
                  </span>
                  <span className="text-label-large font-medium text-text-main">{statusConfig.label}</span>
                </div>

                <div>
                  <h2 className="mb-3 text-title-large font-semibold text-text-main">{act.name}</h2>
                  <p className="text-body-large leading-relaxed text-text-sub">{act.desc}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="action-card mt-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-black/5 px-6 py-3 text-label-large text-text-main transition-all hover:bg-black/10"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
