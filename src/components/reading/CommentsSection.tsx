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
    const cusdis = (
      window as unknown as {
        CUSDIS?: { renderOnce?: () => void; renderTo?: (el: HTMLElement) => void };
      }
    ).CUSDIS;
    if (cusdis?.renderOnce) {
      cusdis.renderOnce();
      return;
    }
    if (cusdis?.renderTo) {
      cusdis.renderTo(container);
      return;
    }
    const script = document.createElement("script");
    script.src = CUSDIS_SCRIPT;
    script.async = true;
    script.onload = () => {
      (window as unknown as { CUSDIS?: { renderOnce?: () => void } }).CUSDIS?.renderOnce?.();
    };
    document.body.appendChild(script);
  }, [appId]);

  if (!appId) return null;

  return (
    <section className="reading-rule mx-auto mt-16 max-w-[720px] border-t border-black/5 pt-6">
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
