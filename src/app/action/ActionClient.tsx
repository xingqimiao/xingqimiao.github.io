"use client";

import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";
import React, { useRef } from "react";
import actionsData from "@/data/actions.json";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/i18n/locale";
import { buildActionPresentation, type ActionItem } from "@/lib/actionPresentation";

const statusMap = {
  running: { color: "bg-green-500", pulse: true },
  paused: { color: "bg-yellow-500", pulse: false },
  completed: { color: "bg-green-500", pulse: false },
  delayed: { color: "bg-yellow-500", pulse: false },
  failed: { color: "bg-red-500", pulse: false },
};

export default function ActionClient({ locale = "zh" }: { locale?: Locale }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const actions = actionsData as ActionItem[];
  const presentation = buildActionPresentation(locale, actions);

  useGSAP(() => {
    gsap.fromTo(
      ".fade-in",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="min-h-screen bg-white px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <h1 className="fade-in mb-12 text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
          {presentation.heading}
        </h1>

        <div className="fade-in grid grid-cols-1 gap-6 md:grid-cols-2">
          {presentation.actions.map((act) => {
            const statusConfig = statusMap[act.status] || statusMap.running;

            return (
              <article
                key={act.id}
                lang={act.contentLanguage}
                className="flex min-h-[240px] flex-col justify-between rounded-[28px] border border-black/10 bg-white p-6 transition-all hover:-translate-y-0.5 hover:scale-[1.01] hover:border-black/15"
              >
                <div className="flex items-center gap-3 self-start rounded-full bg-black/5 px-4 py-2">
                  <span className="relative flex h-3 w-3">
                    {statusConfig.pulse && (
                      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusConfig.color} opacity-75`} />
                    )}
                    <span className={`relative inline-flex h-3 w-3 rounded-full ${statusConfig.color}`} />
                  </span>
                  <span className="text-label-large font-medium text-text-main">{act.statusLabel}</span>
                </div>

                <div>
                  <h2 className="mb-3 text-title-large font-semibold text-text-main">{act.name}</h2>
                  <p className="text-body-large leading-relaxed text-text-sub">{act.desc}</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="fade-in mt-16">
          <ReturnHomeButton locale={locale} />
        </div>
      </div>
    </main>
  );
}
