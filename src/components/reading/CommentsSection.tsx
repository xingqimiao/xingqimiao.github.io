"use client";

import { useEffect, useRef } from "react";

const CUSDIS_SCRIPT = "https://cusdis.com/js/cusdis.es.js";

// Official Simplified Chinese pack (djyde/cusdis -> widget/lang/zh-cn.js).
// The widget reads its own window.CUSDIS_LOCALE and only falls back to the
// English defaults for keys it does not find, so the full pack is required.
export const CUSDIS_ZH_CN_LOCALE = {
  powered_by: "评论由 Cusdis 提供",
  post_comment: "发送",
  loading: "加载中",
  email: "邮箱地址 (可选)",
  nickname: "昵称",
  reply_placeholder: "回复内容…",
  reply_btn: "回复",
  sending: "发送中…",
  mod_badge: "管理员",
  content_is_required: "内容不能为空",
  nickname_is_required: "昵称不能为空",
  comment_has_been_sent: "评论已发送，管理员审核通过后会展示",
} as const;

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
    (window as unknown as { CUSDIS_LOCALE?: unknown }).CUSDIS_LOCALE = CUSDIS_ZH_CN_LOCALE;

    // data-theme="auto" would follow the OS scheme; the reader's own toggle is
    // the source of truth here, so keep the widget in sync with main[data-theme].
    const cusdisApi = () => (
      window as unknown as {
        CUSDIS?: { renderTo?: (el: HTMLElement) => void; setTheme?: (theme: string) => void };
      }
    ).CUSDIS;
    const readerTheme = () => {
      const main = container.closest("main[data-theme]") as HTMLElement | null;
      return main?.dataset.theme === "dark" ? "dark" : "light";
    };
    // The widget sets color-scheme: dark on its document, which makes the
    // browser paint an opaque dark canvas behind the transparent content —
    // visible as a tinted block against the reading page. Sync the iframe
    // canvas with the reader's own background colour to blend it in.
    const syncWidgetCanvas = () => {
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      const doc = iframe?.contentDocument;
      if (!doc?.documentElement) return;
      const reader = container.closest("main[data-theme]");
      const computed = reader ? getComputedStyle(reader).backgroundColor : "rgba(0, 0, 0, 0)";
      const solid = computed !== "rgba(0, 0, 0, 0)" && computed !== "transparent"
        ? computed
        : readerTheme() === "dark"
          ? "rgb(13, 13, 18)"
          : "rgb(255, 255, 255)";
      doc.documentElement.style.backgroundColor = solid;
    };

    const applyTheme = () => {
      const theme = readerTheme();
      container.dataset.theme = theme;
      const cusdis = cusdisApi();
      if (cusdis?.setTheme) cusdis.setTheme(theme);
      syncWidgetCanvas();
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    const readerMain = container.closest("main[data-theme]");
    if (readerMain) {
      themeObserver.observe(readerMain, { attributes: true, attributeFilter: ["data-theme"] });
    }

    // The widget's fields and buttons are plain rectangles; round them to the
    // site's Material 3 shapes (fields 12dp, actions full pill) by injecting
    // styles into the same-origin srcdoc iframe.
    const widgetStyles = () => {
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      const doc = iframe?.contentDocument;
      if (!iframe || !doc?.head) return;
      if (doc.getElementById("kira-comment-shape")) return;
      const style = doc.createElement("style");
      style.id = "kira-comment-shape";
      style.textContent = [
        "input, textarea { border-radius: 12px !important; }",
        "button { border-radius: 9999px !important; }",
        "input:focus, textarea:focus { outline-offset: 2px; }",
      ].join("\n");
      doc.head.appendChild(style);
    };

    // The widget never posts its content height back (its resize messages do
    // not reach this page), so the iframe would stay pinned at 150px with an
    // inner scrollbar. Tune the iframe to the inner document height instead.
    let observedBody: HTMLElement | null = null;
    let heightObserver: MutationObserver | null = null;
    const tuneHeight = () => {
      widgetStyles();
      syncWidgetCanvas();
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      const doc = iframe?.contentDocument;
      if (!iframe || !doc?.body) return;
      // The widget re-renders its body as it works (submitting a comment swaps
      // in a confirmation message), so mirror height changes the moment they
      // land — waiting for the poll below is what let the inner scrollbar
      // flash for up to a second and a half. Re-arm the observer whenever the
      // inner document is replaced (e.g. the srcdoc reloads after render).
      if (doc.body !== observedBody) {
        heightObserver?.disconnect();
        heightObserver = new MutationObserver(tuneHeight);
        heightObserver.observe(doc.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        observedBody = doc.body;
      }
      const available = Math.max(320, Math.min(2400, Math.ceil(doc.body.scrollHeight)));
      if (iframe.style.height !== `${available}px`) {
        iframe.style.height = `${available}px`;
      }
    };
    // Polling stays as a fallback for height changes that mutate no DOM (font
    // loading, images decoding)…
    const heightTimer = window.setInterval(tuneHeight, 1500);
    // …while the call below sizes the iframe before the first poll fires, and
    // the observer makes content-driven changes instant.
    tuneHeight();

    const cusdis = cusdisApi();
    if (cusdis?.renderTo) {
      cusdis.renderTo(container);
      // The widget swaps its temporary blank document for the real srcdoc one
      // asynchronously, and armed the observer inside tuneHeight on the
      // temp document it dies with it — so the first tune above can fix an
      // empty doc and leave a scrollbar up to the next poll. Re-tune when the
      // iframe finishes loading (also re-arms the observer on the live body).
      container.querySelector("iframe")?.addEventListener("load", tuneHeight);
      tuneHeight();
      return () => {
        themeObserver.disconnect();
        window.clearInterval(heightTimer);
        heightObserver?.disconnect();
      };
    }
    const script = document.createElement("script");
    script.src = CUSDIS_SCRIPT;
    script.async = true;
    script.onload = () => {
      (window as unknown as { CUSDIS?: { renderTo?: (el: HTMLElement) => void } }).CUSDIS?.renderTo?.(container);
      container.querySelector("iframe")?.addEventListener("load", tuneHeight);
      tuneHeight();
    };
    document.body.appendChild(script);
    return () => {
      themeObserver.disconnect();
      window.clearInterval(heightTimer);
      heightObserver?.disconnect();
    };
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
