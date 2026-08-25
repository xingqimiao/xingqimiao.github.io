"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const CUSDIS_SCRIPT = "https://cusdis.com/js/cusdis.es.js";

const FORM_COLLAPSE_STYLE_ID = "kira-form-collapsed";
// The widget nests its form as #root > div > div.grid.grid-cols-1.gap-4;
// the comment list lives in a sibling container, so hiding just the form
// keeps existing comments visible while the compose box stays out of the way.
const FORM_COLLAPSE_CSS = `#root > div > div.grid.grid-cols-1.gap-4 { display: none !important; }`;

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
 * Cusdis-hosted comment thread for story pages. The widget stays mounted so
 * approved comments are visible without interaction; the compose form is
 * collapsed behind a pill that sticks to the viewport bottom until the
 * reader opens it - leaving the form is a deliberate progressive disclosure.
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
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const [formOpen, setFormOpen] = useState(false);
  const formOpenRef = useRef(false);

  // Shrink the pill away, reveal the form where the reader already is, and
  // glide the page to the thread so the two read as one motion.
  const openThread = () => {
    const pill = pillRef.current;
    if (pill) {
      gsap.to(pill, { opacity: 0, scale: 0.985, y: 4, duration: 0.16, ease: "power2.in" });
    }
    window.setTimeout(() => {
      formOpenRef.current = true;
      setFormOpen(true);
      const target = collapsibleRef.current;
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 160);
  };

  // Reveal the form the moment the reader opens it; the collapse style is
  // re-applied idempotently by tuneHeight while closed.
  useEffect(() => {
    if (!formOpen) return;
    const doc = containerRef.current?.querySelector("iframe")?.contentDocument;
    doc?.getElementById(FORM_COLLAPSE_STYLE_ID)?.remove();
  }, [formOpen]);

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

    // The widget's fields, labels and buttons render large (16px, 96px box);
    // compact them so the thread does not dominate the page, keep the M3
    // shapes, and make the reply box single-line that grows with input.
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
        "label { margin-bottom: 4px !important; }",
        "label, button { font-size: 13px !important; }",
        "input, textarea { font-size: 14px !important; }",
        "input { padding: 6px 10px !important; }",
        // Single-line start; the input listener grows it, so never scroll.
        "textarea { height: 36px !important; min-height: 36px !important; max-height: 240px !important; padding: 8px 10px !important; resize: none !important; overflow-y: hidden !important; }",
        "button { padding: 6px 14px !important; }",
        "div.grid.grid-cols-2.gap-4 { gap: 8px !important; }",
        // The form rows only; :has keeps comment lists (same grid classes) intact.
        "div.grid.grid-cols-1.gap-4:has(textarea) { gap: 8px !important; }",
      ].join("\n");
      doc.head.appendChild(style);
    };

    // The composer is hidden until the reader opens it; re-applied on every
    // tune so a fresh document gets it as soon as the widget loads.
    const applyFormCollapse = () => {
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      const doc = iframe?.contentDocument;
      if (!doc?.head) return;
      if (formOpenRef.current) {
        doc.getElementById(FORM_COLLAPSE_STYLE_ID)?.remove();
        return;
      }
      if (doc.getElementById(FORM_COLLAPSE_STYLE_ID)) return;
      const style = doc.createElement("style");
      style.id = FORM_COLLAPSE_STYLE_ID;
      style.textContent = FORM_COLLAPSE_CSS;
      doc.head.appendChild(style);
    };

    // Grow the single-line reply box with the reader's input (no inner
    // scrollbar); marker keeps the binding idempotent across re-tunes and
    // fresh documents.
    const bindAutoGrow = () => {
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      const doc = iframe?.contentDocument;
      const textarea = doc?.querySelector("textarea") as HTMLTextAreaElement | null;
      if (!textarea || (textarea as unknown as { __kiraGrow?: boolean }).__kiraGrow) return;
      textarea.addEventListener("input", () => {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
      });
      (textarea as unknown as { __kiraGrow?: boolean }).__kiraGrow = true;
    };

    // The widget never posts its content height back (its resize messages do
    // not reach this page), so the iframe would stay pinned at 150px with an
    // inner scrollbar. Tune the iframe to the inner document height instead.
    let observedBody: HTMLElement | null = null;
    let heightObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const tuneHeight = () => {
      widgetStyles();
      applyFormCollapse();
      bindAutoGrow();
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
        resizeObserver?.disconnect();
        heightObserver = new MutationObserver(tuneHeight);
        heightObserver.observe(doc.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        // Font loading and image decoding grow the widget box without any DOM
        // mutation, which MutationObserver cannot see. The widget's own
        // ResizeObserver (same-origin srcdoc document) catches those layout
        // changes instead.
        const frameWin = iframe.contentWindow as (Window & { ResizeObserver?: typeof ResizeObserver }) | null;
        if (frameWin?.ResizeObserver) {
          resizeObserver = new frameWin.ResizeObserver(() => tuneHeight());
          resizeObserver.observe(doc.documentElement);
        }
        observedBody = doc.body;
      }
      const available = Math.max(48, Math.min(2400, Math.ceil(doc.body.scrollHeight)));
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
        resizeObserver?.disconnect();
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
      resizeObserver?.disconnect();
    };
  }, [appId]);

  if (!appId) return null;

  return (
    <>
      <div className="sticky bottom-4 z-10 mx-auto max-w-[720px]">
        <button
          ref={pillRef}
          type="button"
          onClick={openThread}
          className="block w-full rounded-full border border-black/10 bg-background/90 px-6 py-3.5 text-left text-body-large text-text-sub/80 shadow-soft backdrop-blur-md transition-colors duration-300 hover:bg-black/5 active:scale-[0.99] dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
        >
          添加公开评论…
        </button>
      </div>
      <section className="reading-rule mx-auto mt-10 max-w-[720px] border-t border-black/5 pt-5">
        <h2 className="mb-1 text-label-large font-medium text-text-main">评论区</h2>
        <div ref={collapsibleRef}>
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
        </div>
      </section>
    </>
  );
}
