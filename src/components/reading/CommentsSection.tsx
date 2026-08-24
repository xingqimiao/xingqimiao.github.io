"use client";

import { useEffect, useRef } from "react";

const CUSDIS_SCRIPT = "https://cusdis.com/js/cusdis.es.js";

/**
 * Cusdis-hosted comment thread for story pages. Renders nothing until an App
 * ID is configured (global_config.json -> cusdis_app_id), so the reader is
 * untouched before the account exists.
 */
export function CommentsSection({
  appId,
  pageId,
  pageUrl,
  pageTitle,
}: {
  appId: string;
  pageId: string;
  pageUrl: string;
  pageTitle: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!appId || !container) return;
    // Cusdis localizes via a page-level global read when its script evaluates;
    // data-lang alone is not honoured by the widget script.
    (window as unknown as { CUSDIS_LOCALE?: unknown }).CUSDIS_LOCALE = { locale: 'zh-CN' };
    const cusdis = (
      window as unknown as {
        CUSDIS?: { renderOnce?: () => void; renderTo?: (el: HTMLElement) => void };
      }
    ).CUSDIS;
    if (cusdis?.renderTo) {
      cusdis.renderTo(container);
      return;
    }
    const script = document.createElement("script");
    script.src = CUSDIS_SCRIPT;
    script.async = true;
    script.onload = () => {
      (window as unknown as { CUSDIS?: { renderTo?: (el: HTMLElement) => void } }).CUSDIS?.renderTo?.(container);
    };
    document.body.appendChild(script);
  }, [appId]);

  if (!appId) return null;

  return (
    <section className="reading-rule mx-auto mt-16 max-w-[720px] border-t border-black/5 pt-6">
      <h2 className="mb-1 text-title-medium font-semibold text-text-main">评论区</h2>
      <p className="reading-subtle mb-4 text-label-medium text-text-sub/85">取个昵称即可参与讨论，无需注册；请友善发言，我们共同维护这个空间。</p>
      <div
        id="cusdis_thread"
        ref={containerRef}
        data-host="https://cusdis.com"
        data-app-id={appId}
        data-page-id={pageId}
        data-page-url={pageUrl}
        data-page-title={pageTitle}
        data-lang="zh-CN"
        data-theme="auto"
      />
    </section>
  );
}
