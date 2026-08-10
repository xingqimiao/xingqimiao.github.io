const LINK_HEADER = "</.well-known/api-catalog>; rel=\"api-catalog\"; type=\"application/json\", </.well-known/service-doc.md>; rel=\"service-doc\"; type=\"text/markdown\", </llms.txt>; rel=\"alternate\"; type=\"text/markdown\"";
const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";
export const STORY_SLUG_ALIASES = Object.freeze({"88737526":"45648863","cat-birthday-17-kira":"45648863"});
const MARKDOWN_ROUTES = new Map([
  ["/", "/ai/index.md"],
  ["/index.html", "/ai/index.md"],
  ["/about-kiramyao", "/ai/about-kiramyao.md"],
  ["/about-kiramyao.html", "/ai/about-kiramyao.md"],
  ["/action", "/ai/action.md"],
  ["/action.html", "/ai/action.md"],
  ["/cat-cave", "/ai/cat-cave.md"],
  ["/cat-cave.html", "/ai/cat-cave.md"],
  ["/documents", "/ai/documents.md"],
  ["/documents.html", "/ai/documents.md"],
  ["/report", "/ai/report.md"],
  ["/report.html", "/ai/report.md"],
  ["/stories", "/ai/stories.md"],
  ["/stories.html", "/ai/stories.md"],
  ["/join", "/ai/join.md"],
  ["/join.html", "/ai/join.md"],
  ["/privacy", "/ai/privacy.md"],
  ["/privacy.html", "/ai/privacy.md"],
]);

function wantsMarkdown(request) {
  return (request.headers.get("accept") || "").toLowerCase().includes("text/markdown");
}

function addAgentHeaders(response, varyAccept = false) {
  const next = new Response(response.body, response);
  next.headers.set("Link", LINK_HEADER);
  next.headers.set("Content-Signal", CONTENT_SIGNAL);
  if (varyAccept) {
    const vary = next.headers.get("Vary");
    next.headers.set("Vary", vary ? `${vary}, Accept` : "Accept");
  }
  return next;
}

function markdownPathFor(pathname) {
  if (MARKDOWN_ROUTES.has(pathname)) {
    return MARKDOWN_ROUTES.get(pathname);
  }

  const clean = pathname.replace(/\/$/, "");
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 2 && ["cat-cave", "documents", "report", "stories"].includes(segments[0])) {
    return `/ai/${segments[0]}/${segments[1].replace(/\.html$/, "")}.md`;
  }
  return null;
}

function storyAliasRedirect(url) {
  const segments = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0] !== "stories") return null;
  const replacement = STORY_SLUG_ALIASES[segments[1]];
  if (!replacement) return null;
  segments[1] = replacement;
  url.pathname = `/${segments.join("/")}`;
  return new Response(null, {
    status: 308,
    headers: { Location: url.toString() },
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const aliasRedirect = storyAliasRedirect(url);
    if (aliasRedirect) return aliasRedirect;

    if (request.method === "GET" && wantsMarkdown(request)) {
      const markdownPath = markdownPathFor(url.pathname);
      if (markdownPath) {
        const markdownUrl = new URL(markdownPath, url);
        const response = await env.ASSETS.fetch(new Request(markdownUrl, request));
        if (response.ok) {
          const body = await response.text();
          return new Response(body, {
            status: 200,
            headers: {
              "Content-Type": "text/markdown; charset=utf-8",
              "Content-Signal": CONTENT_SIGNAL,
              "Link": LINK_HEADER,
              "Vary": "Accept",
              "x-markdown-tokens": String(Math.max(1, Math.ceil(body.length / 4))),
            },
          });
        }
      }
    }

    const response = await env.ASSETS.fetch(request);
    return addAgentHeaders(response, true);
  },
};

export default worker;
