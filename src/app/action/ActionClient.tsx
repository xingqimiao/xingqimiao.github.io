"use client";

import { ReturnHomeButton } from "@/components/ui/ReturnHomeButton";
import { LanguageToggle } from "@/components/reading/LanguageToggle";
import React, { useEffect, useRef, useState } from "react";
import actionsData from "@/data/actions.json";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Locale } from "@/i18n/locale";
import { applyDocumentLanguage, detectInitialLanguage, storeLanguage } from "@/i18n/language";
import { buildActionPresentation, type ActionItem } from "@/lib/actionPresentation";
import { actionEnglishCopy } from "@/lib/actionTranslation";

const statusMap = {
  running: { color: "bg-green-500", pulse: true },
  paused: { color: "bg-yellow-500", pulse: false },
  completed: { color: "bg-green-500", pulse: false },
  delayed: { color: "bg-yellow-500", pulse: false },
  failed: { color: "bg-red-500", pulse: false },
};

const TRANSLATION_NOTICE = "AI translation of the Chinese original — may not be fully accurate.";

export default function ActionClient({ locale = "zh" }: { locale?: Locale }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const actions = actionsData as ActionItem[];
  const [language, setLanguage] = useState<Locale>("zh");
  const isEnglish = language === "en";

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const initial = detectInitialLanguage();
      setLanguage(initial);
      applyDocumentLanguage(initial);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  function toggleLanguage() {
    setLanguage((current) => {
      const next = current === "zh" ? "en" : "zh";
      storeLanguage(next);
      applyDocumentLanguage(next);
      return next;
    });
  }

  const presentation = buildActionPresentation(locale, actions);
  const heading = isEnglish ? actionEnglishCopy.heading : presentation.heading;
  const shownActions = isEnglish
    ? actions.map((act) => {
        const english = actionEnglishCopy.items[act.id];
        return {
          ...act,
          name: english?.name ?? act.name,
          desc: english?.desc ?? act.desc,
          statusLabel: actionEnglishCopy.statusLabels[act.status],
          contentLanguage: "en" as const,
        };
      })
    : presentation.actions;

  useGSAP(() => {
    gsap.fromTo(
      ".fade-in",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }
    );
  }, { scope: containerRef });

  return (
    <main ref={containerRef} lang={isEnglish ? "en" : "zh-CN"} className="min-h-screen bg-background px-6 pb-24 pt-32">
      <div className="mx-auto max-w-6xl">
        <div className="fade-in mb-12 flex items-start justify-between gap-4">
          <h1 className="text-display-medium font-medium tracking-tight text-text-main md:text-display-large">
            {heading}
          </h1>
          <LanguageToggle language={language} onToggle={toggleLanguage} />
        </div>

        {isEnglish && (
          <p role="note" className="fade-in -mt-8 mb-12 text-center text-label-medium text-text-sub/85">
            {TRANSLATION_NOTICE}
          </p>
        )}

        <div className="fade-in grid grid-cols-1 gap-6 md:grid-cols-2">
          {shownActions.map((act) => {
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
