const LINK_HEADER = "</.well-known/api-catalog>; rel=\"api-catalog\"; type=\"application/json\", </.well-known/service-doc.md>; rel=\"service-doc\"; type=\"text/markdown\", </llms.txt>; rel=\"alternate\"; type=\"text/markdown\"";
const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=yes";
const MARKDOWN_ROUTES = new Map([
  ["/", "/ai/index.md"],
  ["/index.html", "/ai/index.md"],
  ["/about", "/ai/about.md"],
  ["/about.html", "/ai/about.md"],
  ["/about-kiramyao", "/ai/about-kiramyao.md"],
  ["/about-kiramyao.html", "/ai/about-kiramyao.md"],
  ["/action", "/ai/action.md"],
  ["/action.html", "/ai/action.md"],
  ["/blog", "/ai/blog.md"],
  ["/blog.html", "/ai/blog.md"],
  ["/story", "/ai/story.md"],
  ["/story.html", "/ai/story.md"],
  ["/report", "/ai/report.md"],
  ["/report.html", "/ai/report.md"],
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
  if (segments.length === 2 && ["blog", "story", "report"].includes(segments[0])) {
    return `/ai/${segments[0]}/${segments[1]}.md`;
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
