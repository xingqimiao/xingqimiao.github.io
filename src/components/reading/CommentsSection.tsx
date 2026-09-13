"use client";

import gsap from "gsap";
import { useCallback, useEffect, useRef, useState } from "react";

export type CommentAuthor = {
  username: string;
  name: string;
  avatar: string | null;
};

export type CommentNode = {
  id: string;
  bodyHtml: string;
  createdAt: string;
  edited: boolean;
  isMine: boolean;
  author: CommentAuthor;
  replies: CommentNode[];
};

export type Viewer = {
  loggedIn: boolean;
  username?: string;
  name?: string;
  avatar?: string | null;
};

export const COMMENT_COPY = {
  heading: "评论区",
  pill: "添加公开评论…",
  loginCta: "使用 X 登录后评论",
  placeholder: "写下你的想法…",
  replyPlaceholder: "写下你的回复…",
  submit: "发送",
  sending: "发送中…",
  reply: "回复",
  cancel: "取消",
  remove: "删除",
  loginRequired: "请先使用 X 登录，再发表评论。",
  sendFailed: "发送失败，请稍后再试。",
  loadFailed: "评论加载失败，请刷新页面重试。",
  loginFailed: "登录没有完成，请再试一次。",
  loginBlocked: "该账号已被禁止评论。",
  confirmRemove: "确定删除这条评论吗？",
  poweredBy: "评论由本站自建服务提供",
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

const formatCommentDate = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

// Set before handing the reader to X so the thread is already open when they
// come back: a full page load otherwise drops them next to a collapsed pill.
const REOPEN_FLAG = "kira-comments-open";
const OPEN_QUERY = "comments";

// Past this the composer stops growing and scrolls instead.
const COMPOSER_MAX_HEIGHT = 260;

// The grow-open animations must wait two frames: the browser has to commit the
// 0fr track before it can transition to 1fr, or the growth snaps.
const nextFrame = (cb: () => void) =>
  typeof window.requestAnimationFrame === "function"
    ? window.requestAnimationFrame(cb)
    : (window.setTimeout(cb, 16) as unknown as number);

const cancelFrame = (handle: number) => {
  if (typeof window.cancelAnimationFrame === "function") window.cancelAnimationFrame(handle);
  else window.clearTimeout(handle);
};

const afterTwoFrames = (callback: () => void): (() => void) => {
  let second = 0;
  const first = nextFrame(() => {
    second = nextFrame(callback);
  });
  return () => {
    cancelFrame(first);
    cancelFrame(second);
  };
};

/**
 * Self-hosted comments for story pages. The thread reads from our own API
 * (see `equal-comments/`), so there is no third-party iframe to style around:
 * the list, the compose form and the X login all live in this page.
 */
export function CommentsSection({
  apiUrl,
  pageId,
  pageUrl,
  pageTitle,
  shortPage = false,
}: {
  apiUrl: string;
  pageId: string;
  pageUrl: string;
  pageTitle: string;
  shortPage?: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // The service lives under /comments on its origin so sibling services can
  // claim their own paths later; apiUrl is origin-only and we add the prefix.
  // An empty apiUrl stays empty so the rollback guard below still sees "unset".
  const apiOrigin = apiUrl.replace(/\/+$/, "");
  const api = apiOrigin ? `${apiOrigin}/comments` : "";
  const resolve = (path: string) => `${api}${path}`;

  // Both of these are entry conditions rather than state that changes while the
  // page is open — the callback's ?comment_error flag, and the intent to reopen
  // the thread after a full page load back from X. Reading them during the
  // first render avoids a collapsed flash that an effect would cause.
  const [entry] = useState(() => {
    if (typeof window === "undefined") return { notice: "", reopen: false };
    const params = new URLSearchParams(window.location.search);
    const error = params.get("comment_error");
    return {
      notice: error === "blocked" ? COMMENT_COPY.loginBlocked : error ? COMMENT_COPY.loginFailed : "",
      // A login error has to land where the reader can see it, so it opens the
      // thread the same way the reopen flag does.
      reopen:
        Boolean(error) ||
        window.sessionStorage.getItem(REOPEN_FLAG) === pageId ||
        params.get(OPEN_QUERY) === "1",
    };
  });

  const [expanded, setExpanded] = useState(entry.reopen);
  // Grows the thread open: the panel lives in a grid row that transitions
  // 0fr -> 1fr, so everything below it slides down with the panel instead of
  // teleporting in a single reflow.
  const [rowOpen, setRowOpen] = useState(false);
  const [comments, setComments] = useState<CommentNode[] | null>(null);
  const [viewer, setViewer] = useState<Viewer>({ loggedIn: false });
  const [loadError, setLoadError] = useState(false);
  // Same motion for the comment preview: the row stays closed until the fetch
  // lands, then grows open so the list never pops in.
  const [previewOpen, setPreviewOpen] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState(entry.notice);
  // Drawn once per mount: re-renders (e.g. a theme toggle) must not swap
  // the cat line under the reader.
  const [emptyLine] = useState(
    () => CAT_EMPTY_LINES[Math.floor(Math.random() * CAT_EMPTY_LINES.length)],
  );

  // Fetch resolves to a plain payload; the state lands in a callback so the
  // mount effect below never sets state synchronously (which would cascade).
  const fetchThread = useCallback(async () => {
    if (!api || !pageId) return null;
    try {
      // Built from the stable `api` string rather than the `resolve` helper:
      // a fresh closure per render would destabilise this useCallback.
      const response = await fetch(`${api}/api/comments?pageId=${encodeURIComponent(pageId)}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error(String(response.status));
      const json: { viewer?: Viewer; comments?: CommentNode[] } = await response.json();
      return { ok: true as const, viewer: json.viewer ?? { loggedIn: false }, comments: json.comments ?? [] };
    } catch {
      return { ok: false as const };
    }
  }, [api, pageId]);

  const applyThread = useCallback(
    (payload: Awaited<ReturnType<typeof fetchThread>>) => {
      if (!payload) return;
      if (payload.ok) {
        setViewer(payload.viewer);
        setComments(payload.comments);
        setLoadError(false);
      } else {
        setComments([]);
        setLoadError(true);
      }
    },
    [],
  );

  const loadComments = useCallback(async () => {
    applyThread(await fetchThread());
  }, [applyThread, fetchThread]);

  useEffect(() => {
    let alive = true;
    void fetchThread().then((payload) => {
      if (alive) applyThread(payload);
    });
    return () => {
      alive = false;
    };
  }, [applyThread, fetchThread]);

  // Flip the preview row open two frames after the comments land: the
  // browser must commit the 0fr row first, or the growth snaps instead of
  // animating (same mechanism as the thread row below).
  useEffect(() => {
    if (!comments) return;
    return afterTwoFrames(() => setPreviewOpen(true));
  }, [comments]);

  // Clear the one-shot entry flags once they have been consumed. No state is
  // written here, so this cannot cascade a render.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(REOPEN_FLAG);
    const params = new URLSearchParams(window.location.search);
    if (!params.has("comment_error")) return;
    params.delete("comment_error");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, []);

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
  // animating.
  useEffect(() => {
    if (!expanded) return;
    return afterTwoFrames(() => setRowOpen(true));
  }, [expanded]);

  // Reveal the thread content while the row grows around it: the panel fades
  // and rises inside the clip track so the growth reads as one motion. The
  // reader is never scrolled.
  useEffect(() => {
    if (!expanded) return;
    const content = composerRef.current;
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

  // Fit the box to its content so no scrollbar ever appears inside it. The
  // textarea is border-box, while scrollHeight measures the padding box — so
  // the border has to be added back or the box ends up exactly that many
  // pixels short and the browser draws a scrollbar track. Once the content
  // passes the cap, scrolling is the intended behaviour instead.
  const autoGrow = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const styles = window.getComputedStyle(textarea);
    const border =
      (parseFloat(styles.borderTopWidth) || 0) + (parseFloat(styles.borderBottomWidth) || 0);
    textarea.style.height = "auto";
    const needed = textarea.scrollHeight + border;
    textarea.style.height = `${Math.min(needed, COMPOSER_MAX_HEIGHT)}px`;
    textarea.style.overflowY = needed > COMPOSER_MAX_HEIGHT ? "auto" : "hidden";
  }, []);

  // Typing, switching to reply mode and opening the thread all change the
  // content; a viewport resize rewraps it. The box tracks each of them.
  useEffect(() => {
    autoGrow();
  }, [body, replyTo, expanded, autoGrow]);

  useEffect(() => {
    const onResize = () => autoGrow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [autoGrow]);

  const loginHref = () => {
    if (typeof window === "undefined") return resolve("/auth/x/start");
    const returnTo = `${window.location.pathname}${window.location.search}`;
    return resolve(`/auth/x/start?return_to=${encodeURIComponent(returnTo)}`);
  };

  const startLogin = () => {
    // Mark the reopen intent before the page unloads; the callback redirect
    // brings the reader back to a thread that is already open.
    try {
      window.sessionStorage.setItem(REOPEN_FLAG, pageId);
    } catch {
      // Private mode can refuse storage; the reader just gets the pill again.
    }
    window.location.href = loginHref();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || pending) return;
    if (!viewer.loggedIn) {
      setNotice(COMMENT_COPY.loginRequired);
      return;
    }
    setPending(true);
    setNotice("");
    try {
      const response = await fetch(resolve("/api/comments"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          pageUrl,
          pageTitle,
          body: text,
          parentId: replyTo?.id,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? String(response.status));
      }
      setBody("");
      setReplyTo(null);
      await loadComments();
    } catch {
      setNotice(COMMENT_COPY.sendFailed);
    } finally {
      setPending(false);
    }
  };

  const remove = async (comment: CommentNode) => {
    if (!window.confirm(COMMENT_COPY.confirmRemove)) return;
    try {
      const response = await fetch(resolve(`/api/comments/${encodeURIComponent(comment.id)}/delete`), {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error(String(response.status));
      await loadComments();
    } catch {
      setNotice(COMMENT_COPY.sendFailed);
    }
  };

  const reply = (comment: CommentNode) => {
    setReplyTo(comment);
    setNotice("");
    textareaRef.current?.focus();
  };

  // Rollback switch: no API configured means the site has no comments at all.
  if (!api || !pageId) return null;

  const composer = (
    <form onSubmit={submit} className="mt-4">
      {notice && (
        <p role="status" className="mb-2 text-label-medium text-text-sub/85">
          {notice}
        </p>
      )}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 text-label-medium text-text-sub/85">
          <span>回复 @{replyTo.author.name || replyTo.author.username}</span>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="underline decoration-dotted underline-offset-2"
          >
            {COMMENT_COPY.cancel}
          </button>
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={!viewer.loggedIn}
        aria-label={replyTo ? COMMENT_COPY.replyPlaceholder : COMMENT_COPY.placeholder}
        placeholder={
          viewer.loggedIn
            ? replyTo
              ? COMMENT_COPY.replyPlaceholder
              : COMMENT_COPY.placeholder
            : COMMENT_COPY.loginRequired
        }
        className="comment-composer"
        rows={1}
      />
      <div className="mt-2 flex items-center justify-end gap-3">
        {viewer.loggedIn ? (
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="comment-pill comment-submit rounded-full px-5 py-2.5 text-label-large"
          >
            {pending ? COMMENT_COPY.sending : COMMENT_COPY.submit}
          </button>
        ) : (
          <button
            type="button"
            onClick={startLogin}
            className="comment-pill rounded-full px-5 py-2.5 text-label-large"
          >
            {COMMENT_COPY.loginCta}
          </button>
        )}
      </div>
    </form>
  );

  return (
    <section
      ref={sectionRef}
      className="reading-rule mx-auto mt-[40vh] max-w-[720px] border-t border-black/5 pt-5"
    >
      <h2 className="mb-3 text-label-large font-medium text-text-main">{COMMENT_COPY.heading}</h2>
      {!expanded && (
        <div
          className={
            shortPage
              ? "comment-pill-float fixed bottom-4 left-6 right-6 z-10 mx-auto max-w-[720px]"
              : "mx-auto mb-3 max-w-[720px]"
          }
        >
          <button
            ref={pillRef}
            type="button"
            onClick={openThread}
            className="comment-pill block w-full rounded-full px-6 py-3.5 text-left text-body-large text-text-sub/80 shadow-soft backdrop-blur-md transition-colors duration-300 active:scale-[0.99]"
          >
            {COMMENT_COPY.pill}
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
              {loadError && (
                <p role="status" className="mb-3 text-label-medium text-text-sub/60">
                  {COMMENT_COPY.loadFailed}
                </p>
              )}
              {!loadError && comments.length === 0 && (
                <p className="mb-3 text-label-medium text-text-sub/60">{emptyLine}</p>
              )}
              {comments.length > 0 && (
                <CommentList comments={comments} onReply={reply} onRemove={remove} expanded={expanded} />
              )}
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
            <div ref={composerRef}>{composer}</div>
          </div>
        </div>
      )}
    </section>
  );
}

// Read-only-until-you-click list of the published thread.
function CommentList({
  comments,
  onReply,
  onRemove,
  expanded,
}: {
  comments: CommentNode[];
  onReply: (comment: CommentNode) => void;
  onRemove: (comment: CommentNode) => void;
  expanded: boolean;
}) {
  return (
    <ol className="mb-2 mt-3 space-y-4 text-body-large leading-[1.75] text-text-main">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onRemove={onRemove}
          expanded={expanded}
        />
      ))}
    </ol>
  );
}

function CommentItem({
  comment,
  onReply,
  onRemove,
  expanded,
}: {
  comment: CommentNode;
  onReply: (comment: CommentNode) => void;
  onRemove: (comment: CommentNode) => void;
  expanded: boolean;
}) {
  return (
    <li>
      <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-label-large font-medium text-text-sub">
          {comment.author.name || comment.author.username}
        </span>
        {comment.author.username && (
          <span className="text-label-medium text-text-sub/60">@{comment.author.username}</span>
        )}
        {formatCommentDate(comment.createdAt) && (
          <span className="text-label-medium text-text-sub/60">
            {formatCommentDate(comment.createdAt)}
          </span>
        )}
      </div>
      {/* The server escapes the body and injects only its own <a>/<br>, so
          this HTML is generated, not reader-supplied markup. */}
      <div
        className="reading-subtle whitespace-pre-wrap [&_a:underline]"
        dangerouslySetInnerHTML={{ __html: comment.bodyHtml }}
      />
      {expanded && (
        <div className="mt-1 flex items-center gap-3 text-label-medium text-text-sub/70">
          <button type="button" onClick={() => onReply(comment)} className="hover:text-text-main">
            {COMMENT_COPY.reply}
          </button>
          {comment.isMine && (
            <button type="button" onClick={() => onRemove(comment)} className="hover:text-text-main">
              {COMMENT_COPY.remove}
            </button>
          )}
        </div>
      )}
      {comment.replies.length > 0 && (
        <ul className="comment-reply-thread mt-2 space-y-2 border-l border-black/10 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onRemove={onRemove}
              expanded={expanded}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
