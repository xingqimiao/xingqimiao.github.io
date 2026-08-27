"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const CUSDIS_SCRIPT = "https://cusdis.com/js/cusdis.es.js";

type CusComment = {
  id: string;
  by_nickname?: string;
  moderator?: { displayName?: string } | null;
  // API returns createdAt (ISO); parsedCreatedAt is a broken service-side
  // string that surfaces as the literal "Invalid Date", so never trust it.
  createdAt?: string;
  parsedContent?: string;
  content?: string;
  replies?: { data?: CusComment[] };
};

const formatCommentDate = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

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

// Empty-state pool for the no-comment preview: one is drawn per mount. The
// line only renders after the comments fetch lands on the client, so a random
// pick here can never desync server HTML from hydration.
export const CAT_EMPTY_LINES = [
  "这里还静悄悄的，喵～ 想留下鱼干大小的一句话吗？",
  "还没有评论呢，喵～ 第一条小鱼干就等你了！",
  "这片鱼塘空空的，喵～ 要不要撒下第一句话？",
  "喵呜～ 这里静悄悄，差点以为路过了只幽灵猫。说点什么吧？",
  "评论区还没开张，喵～ 第一颗鱼干会是谁的？",
  "这里连一根猫毛都没有，喵～ 说句话证明你来过？",
] as const;

/**
 * Cusdis-hosted comments for story pages. Approved comments are listed via
 * the lightweight public API (/api/open/comments) straight away; the widget
 * script, iframe and compose form stay lazy — they mount only when the
 * reader opens the thread from the pill that sticks to the viewport bottom.
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
  const sectionRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  // Grows the thread open: the panel lives in a grid row that transitions
  // 0fr -> 1fr, so everything below it slides down with the panel instead of
  // teleporting in a single reflow.
  const [rowOpen, setRowOpen] = useState(false);
  const [comments, setComments] = useState<CusComment[] | null>(null);
  // Same motion for the comment preview: the row stays closed until the
  // Cusdis round trip lands, then grows open so the list never pops in.
  const [previewOpen, setPreviewOpen] = useState(false);
  // Drawn once per mount: re-renders (e.g. a theme toggle) must not swap
  // the cat line under the reader.
  const [emptyLine] = useState(
    () => CAT_EMPTY_LINES[Math.floor(Math.random() * CAT_EMPTY_LINES.length)],
  );

  // Flip the preview row open two frames after the comments land: the
  // browser must commit the 0fr row first, or the growth snaps instead of
  // animating (same mechanism as the thread row below).
  useEffect(() => {
    if (!comments) return;
    const frame = (cb: () => void) =>
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame(cb)
        : (window.setTimeout(cb, 16) as unknown as number);
    const cancel = (handle: number) => {
      if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(handle);
      else window.clearTimeout(handle);
    };
    let second = 0;
    const first = frame(() => {
      second = frame(() => setPreviewOpen(true));
    });
    return () => {
      cancel(first);
      cancel(second);
    };
  }, [comments]);

  // Fetch approved comments separately from the widget so the list is
  // visible without loading Cusdis' script/iframe. First page only; the full
  // thread (pagination, reply) lives in the widget after opening.
  useEffect(() => {
    if (!appId || !pageId) return;
    let alive = true;
    fetch(
      `https://cusdis.com/api/open/comments?page=1&appId=${encodeURIComponent(appId)}&pageId=${encodeURIComponent(pageId)}`,
    )
      .then((response) => response.json())
      .then((json: { data?: { data?: CusComment[] } }) => {
        if (alive) setComments(json.data?.data ?? []);
      })
      .catch(() => {
        // A failed preview must not break the thread; the widget shows the
        // same list once opened.
      });
    return () => {
      alive = false;
    };
  }, [appId, pageId]);

  // Phones only: the thread opens 40vh below the story body, so a tap on the
  // pill would leave the form below the fold. Glide there — the landing puts
  // the section header about a third of a viewport down, and the movement is
  // capped so the page never lurches a whole screen away. Desktop keeps its
  // no-scroll behaviour.
  const scrollThreadIntoView = () => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const section = sectionRef.current;
    if (!section) return;
    const viewportHeight = window.innerHeight;
    const currentY = window.scrollY;
    const target = section.getBoundingClientRect().top + currentY - Math.round(viewportHeight * 0.35);
    const delta = target - currentY;
    if (delta <= 0) return;
    const moved = Math.min(delta, Math.round(viewportHeight * 0.6));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: currentY + moved, behavior: reduced ? "auto" : "smooth" });
  };

  // Shrink the pill away, mount the thread where the reader is, and glide
  // the page to it so the two read as one motion.
  const openThread = () => {
    const pill = pillRef.current;
    if (pill) {
      gsap.to(pill, { opacity: 0, scale: 0.985, y: 4, duration: 0.16, ease: "power2.in" });
    }
    window.setTimeout(() => {
      setExpanded(true);
      scrollThreadIntoView();
    }, 160);
  };

  // Flip the row open two frames after the panel mounts: the browser must
  // commit the 0fr row first, or the transition to 1fr snaps instead of
  // animating. tuneHeight's observers only ever resize the widget iframe —
  // the row track follows the content on every frame, which is why this
  // animation cannot be fought the way the old height tween was.
  useEffect(() => {
    if (!expanded) return;
    const frame = (cb: () => void) =>
      typeof window.requestAnimationFrame === "function"
        ? window.requestAnimationFrame(cb)
        : (window.setTimeout(cb, 16) as unknown as number);
    const cancel = (handle: number) => {
      if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(handle);
      else window.clearTimeout(handle);
    };
    let second = 0;
    const first = frame(() => {
      second = frame(() => setRowOpen(true));
    });
    return () => {
      cancel(first);
      cancel(second);
    };
  }, [expanded]);

  // Reveal the thread content while the row grows around it: the panel fades
  // and rises inside the clip track so the growth reads as one motion. The
  // reader is never scrolled.
  useEffect(() => {
    if (!expanded) return;
    const el = collapsibleRef.current;
    if (!el) return;
    const content = el.firstElementChild;
    if (!content) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(content, { opacity: 1, y: 0 });
      return;
    }
    const tween = gsap.fromTo(
      content,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
    );
    return () => {
      tween.kill();
    };
  }, [expanded]);

  useEffect(() => {
    const container = containerRef.current;
    if (!appId || !container || !expanded) return;
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
      const documentStyles = [
        // The widget doc must never grow its own scrollbar: between the
        // srcdoc swap and the next height tune the iframe can be a few
        // pixels short, which surfaces as an inner scrollbar beside the
        // fields. Clamp the doc; the height tune follows within one poll.
        "html, body { overflow: hidden !important; }",
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
      style.textContent = documentStyles;
      doc.head.appendChild(style);
      // The host page already renders the comment list; hide the widget's own
      // copy so opening the thread never doubles or reloads it.
      if (!doc.getElementById("kira-widget-list-hidden")) {
        const listHidden = doc.createElement("style");
        listHidden.id = "kira-widget-list-hidden";
        listHidden.textContent = "div.mt-4.px-1 { display: none !important; }";
        doc.head.appendChild(listHidden);
      }
    };

    // Grow the single-line reply box with the reader's input (no inner
    // scrollbar); marker keeps the binding idempotent across re-tunes and
    // fresh documents. Re-tuning on input avoids the poll window where the
    // taller box would briefly scroll inside the iframe.
    const bindAutoGrow = () => {
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      const doc = iframe?.contentDocument;
      const textarea = doc?.querySelector("textarea") as HTMLTextAreaElement | null;
      if (!textarea || (textarea as unknown as { __kiraGrow?: boolean }).__kiraGrow) return;
      textarea.addEventListener("input", () => {
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
        tuneHeight();
      });
      (textarea as unknown as { __kiraGrow?: boolean }).__kiraGrow = true;
    };

    // Hard backstop: if the widget ever ends up taller than the iframe (any
    // race, old build, odd font timing) a scrollbar appears inside; the first
    // scroll event re-tunes and the height snaps back to the content.
    const bindScrollBackstop = () => {
      const iframe = container.querySelector("iframe") as HTMLIFrameElement | null;
      const doc = iframe?.contentDocument;
      if (!doc || (doc as unknown as { __kiraScrollGuard?: boolean }).__kiraScrollGuard) return;
      doc.addEventListener("scroll", () => tuneHeight(), { passive: true });
      (doc as unknown as { __kiraScrollGuard?: boolean }).__kiraScrollGuard = true;
    };

    // The widget never posts its content height back (its resize messages do
    // not reach this page), so the iframe would stay pinned at 150px with an
    // inner scrollbar. Tune the iframe to the inner document height instead.
    let observedBody: HTMLElement | null = null;
    let heightObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const tuneHeight = () => {
      widgetStyles();
      bindAutoGrow();
      bindScrollBackstop();
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
        // Font loading and image decoding grow the widget content without any
        // DOM mutation, which MutationObserver cannot see. Observe the body
        // (its box grows with the content); observing documentElement would
        // track the iframe viewport instead, which never changes.
        const frameWin = iframe.contentWindow as (Window & { ResizeObserver?: typeof ResizeObserver }) | null;
        if (frameWin?.ResizeObserver) {
          resizeObserver = new frameWin.ResizeObserver(() => tuneHeight());
          resizeObserver.observe(doc.body);
        }
        observedBody = doc.body;
      }
      // The taller of the two boxes: some widget states grow the html box
      // beyond the body (margins, a swapped root), and body-only tuning
      // leaves the iframe short and the doc scrolling inside it.
      const available = Math.max(
        48,
        Math.min(2400, Math.ceil(Math.max(doc.body?.scrollHeight ?? 0, doc.documentElement?.scrollHeight ?? 0))),
      );
      if (iframe.style.height !== `${available}px`) {
        iframe.style.height = `${available}px`;
      }
      // If the panel ever holds a fixed px height (stale state, interrupted
      // tween) the widget content would scroll inside it; nudge it to auto.
      const panel = container.parentElement as HTMLElement | null;
      if (panel && panel.style.height && panel.style.height !== "auto") {
        panel.style.height = "auto";
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
  }, [appId, expanded]);

  if (!appId) return null;

  return (
    <section
      ref={sectionRef}
      className="reading-rule mx-auto mt-[40vh] max-w-[720px] border-t border-black/5 pt-5"
    >
      <h2 className="mb-3 text-label-large font-medium text-text-main">评论区</h2>
      {!expanded && (
        <div className="comment-pill-float fixed bottom-4 left-6 right-6 z-10 mx-auto max-w-[720px]">
          <button
            ref={pillRef}
            type="button"
            onClick={openThread}
            className="comment-pill block w-full rounded-full px-6 py-3.5 text-left text-body-large text-text-sub/80 shadow-soft backdrop-blur-md transition-colors duration-300 active:scale-[0.99]"
          >
            添加公开评论…
          </button>
        </div>
      )}
      <div
        className="grid transition-[grid-template-rows] duration-[350ms] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: previewOpen ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden">
          {comments && (
            <div className="comment-preview-enter">
              {comments.length === 0 && (
                <p className="mb-3 text-label-medium text-text-sub/60">{emptyLine}</p>
              )}
              {comments.length > 0 && <CommentList comments={comments} />}
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div
          className="grid transition-[grid-template-rows] duration-[350ms] ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none"
          style={{ gridTemplateRows: rowOpen ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
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
          </div>
        </div>
      )}
    </section>
  );
}

// Read-only preview of approved comments while the widget stays lazy.
function CommentList({ comments }: { comments: CusComment[] }) {
  return (
    <ol className="mb-2 mt-3 space-y-4 text-body-large leading-[1.75] text-text-main">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </ol>
  );
}

function CommentItem({ comment }: { comment: CusComment }) {
  return (
    <li>
      <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-label-large font-medium text-text-sub">
          {comment.by_nickname || CUSDIS_ZH_CN_LOCALE.nickname}
        </span>
        {comment.moderator?.displayName && (
          <span className="text-label-medium text-primary/80">{CUSDIS_ZH_CN_LOCALE.mod_badge}</span>
        )}
        {formatCommentDate(comment.createdAt) && (
          <span className="text-label-medium text-text-sub/60">{formatCommentDate(comment.createdAt)}</span>
        )}
      </div>
      {/* Cusdis pre-parses (and sanitizes) comment bodies server-side; the
          widget renders the same string via its own markup path. */}
      <div
        className="reading-subtle whitespace-pre-wrap [&_a:underline]"
        dangerouslySetInnerHTML={{ __html: comment.parsedContent ?? comment.content ?? "" }}
      />
      {comment.replies?.data && comment.replies.data.length > 0 && (
        <ul className="comment-reply-thread mt-2 space-y-2 border-l border-black/10 pl-4">
          {comment.replies.data.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </ul>
      )}
    </li>
  );
}
